import { Article, Sale } from './db';
import { startOfDay, endOfDay, subDays, differenceInDays } from 'date-fns';

export interface SalesPrediction {
  date: string;
  predictedSales: number;
  confidence: number;
}

export interface StockRecommendation {
  article: Article;
  currentStock: number;
  recommendedStock: number;
  urgency: 'low' | 'medium' | 'high' | 'critical';
  reason: string;
  dailyAverage: number;
  daysUntilStockout: number;
}

export interface PerformanceInsight {
  type: 'warning' | 'info' | 'success' | 'danger';
  title: string;
  description: string;
  actionable?: string;
}

// Calcul de la moyenne mobile sur N jours
function calculateMovingAverage(values: number[], period: number): number {
  if (values.length === 0) return 0;
  const relevantValues = values.slice(-period);
  return relevantValues.reduce((sum, v) => sum + v, 0) / relevantValues.length;
}

// Analyse des tendances de ventes
export function analyzeSalesTrend(sales: Sale[]): {
  trend: 'increasing' | 'decreasing' | 'stable';
  percentageChange: number;
  description: string;
} {
  if (sales.length < 7) {
    return {
      trend: 'stable',
      percentageChange: 0,
      description: 'Pas assez de données pour une analyse de tendance'
    };
  }

  // Comparer les 7 derniers jours avec les 7 jours précédents
  const today = new Date();
  const last7Days = sales.filter(s => {
    const saleDate = new Date(s.createdAt);
    return differenceInDays(today, saleDate) <= 7;
  });
  
  const previous7Days = sales.filter(s => {
    const saleDate = new Date(s.createdAt);
    const days = differenceInDays(today, saleDate);
    return days > 7 && days <= 14;
  });

  const last7Total = last7Days.reduce((sum, s) => sum + s.total, 0);
  const prev7Total = previous7Days.reduce((sum, s) => sum + s.total, 0);

  if (prev7Total === 0) {
    return {
      trend: 'stable',
      percentageChange: 0,
      description: 'Pas assez de données pour comparer'
    };
  }

  const percentageChange = ((last7Total - prev7Total) / prev7Total) * 100;

  let trend: 'increasing' | 'decreasing' | 'stable';
  if (percentageChange > 10) trend = 'increasing';
  else if (percentageChange < -10) trend = 'decreasing';
  else trend = 'stable';

  return {
    trend,
    percentageChange: Math.round(percentageChange * 10) / 10,
    description: 
      trend === 'increasing' 
        ? `Vos ventes augmentent de ${Math.abs(Math.round(percentageChange))}%`
        : trend === 'decreasing'
        ? `Vos ventes diminuent de ${Math.abs(Math.round(percentageChange))}%`
        : 'Vos ventes sont stables'
  };
}

// Prédiction des ventes futures (simple moyenne mobile)
export function predictFutureSales(sales: Sale[], daysAhead: number = 7): SalesPrediction[] {
  const today = new Date();
  const last30Days = sales.filter(s => {
    const saleDate = new Date(s.createdAt);
    return differenceInDays(today, saleDate) <= 30;
  });

  // Calculer la moyenne quotidienne
  const dailyTotals: { [key: string]: number } = {};
  last30Days.forEach(sale => {
    const dateKey = startOfDay(new Date(sale.createdAt)).toISOString();
    dailyTotals[dateKey] = (dailyTotals[dateKey] || 0) + sale.total;
  });

  const values = Object.values(dailyTotals);
  const avgDaily = calculateMovingAverage(values, 7);

  // Prédire les prochains jours
  const predictions: SalesPrediction[] = [];
  for (let i = 1; i <= daysAhead; i++) {
    const futureDate = new Date(today);
    futureDate.setDate(futureDate.getDate() + i);
    
    predictions.push({
      date: futureDate.toISOString(),
      predictedSales: Math.round(avgDaily),
      confidence: values.length >= 7 ? 0.75 : 0.5
    });
  }

  return predictions;
}

// Recommandations de réapprovisionnement
export function generateStockRecommendations(
  articles: Article[],
  sales: Sale[]
): StockRecommendation[] {
  const recommendations: StockRecommendation[] = [];
  const today = new Date();

  articles.forEach(article => {
    // Calculer les ventes quotidiennes moyennes de cet article
    const articleSales = sales.filter(s => {
      const saleDate = new Date(s.createdAt);
      return (
        differenceInDays(today, saleDate) <= 30 &&
        s.items.some(item => item.articleId === article.id)
      );
    });

    const totalSold = articleSales.reduce((sum, sale) => {
      const item = sale.items.find(i => i.articleId === article.id);
      return sum + (item?.quantity || 0);
    }, 0);

    const dailyAverage = articleSales.length > 0 ? totalSold / 30 : 0;
    const daysUntilStockout = dailyAverage > 0 ? article.stock / dailyAverage : 999;

    // Déterminer l'urgence
    let urgency: 'low' | 'medium' | 'high' | 'critical';
    let reason: string;
    let recommendedStock: number;

    if (article.stock === 0) {
      urgency = 'critical';
      reason = 'Stock épuisé - Commander immédiatement';
      recommendedStock = Math.ceil(dailyAverage * 30); // 30 jours de stock
    } else if (article.stock <= article.minStock) {
      urgency = 'high';
      reason = 'Stock en dessous du minimum';
      recommendedStock = Math.ceil(dailyAverage * 30);
    } else if (daysUntilStockout <= 7) {
      urgency = 'high';
      reason = `Rupture prévue dans ${Math.ceil(daysUntilStockout)} jours`;
      recommendedStock = Math.ceil(dailyAverage * 30);
    } else if (daysUntilStockout <= 14) {
      urgency = 'medium';
      reason = 'Prévoir réapprovisionnement bientôt';
      recommendedStock = Math.ceil(dailyAverage * 20);
    } else {
      urgency = 'low';
      reason = 'Stock suffisant';
      recommendedStock = article.stock;
    }

    // N'ajouter que les recommandations pertinentes
    if (urgency !== 'low' || article.stock <= article.minStock) {
      recommendations.push({
        article,
        currentStock: article.stock,
        recommendedStock,
        urgency,
        reason,
        dailyAverage: Math.round(dailyAverage * 10) / 10,
        daysUntilStockout: Math.round(daysUntilStockout)
      });
    }
  });

  // Trier par urgence
  const urgencyOrder = { critical: 0, high: 1, medium: 2, low: 3 };
  return recommendations.sort((a, b) => urgencyOrder[a.urgency] - urgencyOrder[b.urgency]);
}

// Insights intelligents sur la performance
export function generatePerformanceInsights(
  articles: Article[],
  sales: Sale[]
): PerformanceInsight[] {
  const insights: PerformanceInsight[] = [];
  const today = new Date();

  // 1. Articles non vendus depuis longtemps
  const last30DaysSales = sales.filter(s => differenceInDays(today, new Date(s.createdAt)) <= 30);
  const soldArticleIds = new Set(last30DaysSales.flatMap(s => s.items.map(i => i.articleId)));
  
  const unsoldArticles = articles.filter(a => 
    a.status === 'active' && 
    a.stock > 0 && 
    !soldArticleIds.has(a.id!)
  );

  if (unsoldArticles.length > 0) {
    insights.push({
      type: 'warning',
      title: `${unsoldArticles.length} articles non vendus`,
      description: 'Certains articles n\'ont pas été vendus depuis 30 jours',
      actionable: 'Envisagez une promotion ou revoyez les prix'
    });
  }

  // 2. Articles les plus rentables
  const profitByArticle: { [key: number]: number } = {};
  sales.forEach(sale => {
    sale.items.forEach(item => {
      profitByArticle[item.articleId] = (profitByArticle[item.articleId] || 0) + item.profit;
    });
  });

  const topProfitable = Object.entries(profitByArticle)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3);

  if (topProfitable.length > 0) {
    const topArticleId = Number(topProfitable[0][0]);
    const topArticle = articles.find(a => a.id === topArticleId);
    if (topArticle) {
      insights.push({
        type: 'success',
        title: 'Produit star identifié',
        description: `"${topArticle.name}" génère le plus de bénéfices`,
        actionable: 'Assurez-vous d\'avoir toujours ce produit en stock'
      });
    }
  }

  // 3. Alerte sur les marges faibles
  const lowMarginSales = sales.filter(s => {
    const profit = s.items.reduce((sum, i) => sum + i.profit, 0);
    const margin = s.total > 0 ? (profit / s.total) * 100 : 0;
    return margin < 10 && margin > 0;
  });

  if (lowMarginSales.length > 5) {
    insights.push({
      type: 'warning',
      title: 'Marges bénéficiaires faibles détectées',
      description: `${lowMarginSales.length} ventes avec moins de 10% de marge`,
      actionable: 'Revoyez vos prix de vente pour améliorer la rentabilité'
    });
  }

  // 4. Tendance positive
  const trend = analyzeSalesTrend(sales);
  if (trend.trend === 'increasing') {
    insights.push({
      type: 'success',
      title: 'Croissance des ventes',
      description: trend.description,
      actionable: 'Continuez sur cette lancée !'
    });
  } else if (trend.trend === 'decreasing') {
    insights.push({
      type: 'danger',
      title: 'Baisse des ventes',
      description: trend.description,
      actionable: 'Analysez les causes et envisagez des actions marketing'
    });
  }

  return insights;
}
