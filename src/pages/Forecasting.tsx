import { useEffect, useState } from 'react';
import { TrendingUp, Package, AlertTriangle, Lightbulb, ArrowUp, ArrowDown, Minus } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { getDB } from '@/lib/db';
import { 
  analyzeSalesTrend, 
  predictFutureSales, 
  generateStockRecommendations,
  generatePerformanceInsights,
  StockRecommendation,
  PerformanceInsight
} from '@/lib/forecasting';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function ForecastingPage() {
  const [loading, setLoading] = useState(true);
  const [trend, setTrend] = useState<any>(null);
  const [predictions, setPredictions] = useState<any[]>([]);
  const [recommendations, setRecommendations] = useState<StockRecommendation[]>([]);
  const [insights, setInsights] = useState<PerformanceInsight[]>([]);

  useEffect(() => {
    loadForecastData();
  }, []);

  async function loadForecastData() {
    setLoading(true);
    try {
      const db = await getDB();
      const articles = await db.getAll('articles');
      const sales = await db.getAll('sales');

      // Analyser la tendance
      const trendData = analyzeSalesTrend(sales);
      setTrend(trendData);

      // Prédictions futures
      const futurePredictions = predictFutureSales(sales, 7);
      setPredictions(futurePredictions);

      // Recommandations de stock
      const stockRecs = generateStockRecommendations(articles, sales);
      setRecommendations(stockRecs);

      // Insights de performance
      const performanceInsights = generatePerformanceInsights(articles, sales);
      setInsights(performanceInsights);
    } catch (error) {
      console.error('Erreur lors du chargement des prévisions:', error);
    } finally {
      setLoading(false);
    }
  }

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      default: return 'bg-green-500';
    }
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'success': return <TrendingUp className="h-5 w-5 text-green-500" />;
      case 'warning': return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'danger': return <AlertTriangle className="h-5 w-5 text-red-500" />;
      default: return <Lightbulb className="h-5 w-5 text-blue-500" />;
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Analyse en cours...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-6 p-8">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <TrendingUp className="h-8 w-8 text-primary" />
          Prévisions & Analyses Intelligentes
        </h1>
        <p className="text-muted-foreground mt-1">
          Analyses prédictives et recommandations pour optimiser votre activité
        </p>
      </div>

      {/* Tendance des ventes */}
      {trend && (
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {trend.trend === 'increasing' && <ArrowUp className="h-5 w-5 text-green-500" />}
              {trend.trend === 'decreasing' && <ArrowDown className="h-5 w-5 text-red-500" />}
              {trend.trend === 'stable' && <Minus className="h-5 w-5 text-yellow-500" />}
              Tendance des Ventes
            </CardTitle>
            <CardDescription>Analyse des 14 derniers jours</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-2xl font-bold">{trend.description}</p>
              {trend.percentageChange !== 0 && (
                <p className="text-muted-foreground">
                  Variation: {trend.percentageChange > 0 ? '+' : ''}{trend.percentageChange}%
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Prévisions futures */}
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle>Prévisions des 7 Prochains Jours</CardTitle>
          <CardDescription>Estimations basées sur l'historique récent</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {predictions.map((pred, idx) => (
              <div key={idx} className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                <div>
                  <p className="font-medium">
                    {format(new Date(pred.date), 'EEEE dd MMMM', { locale: fr })}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Confiance: {Math.round(pred.confidence * 100)}%
                  </p>
                </div>
                <p className="text-lg font-bold">
                  {pred.predictedSales.toLocaleString('fr-FR')} FCFA
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recommandations de réapprovisionnement */}
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Recommandations de Réapprovisionnement
          </CardTitle>
          <CardDescription>
            {recommendations.length} article{recommendations.length > 1 ? 's' : ''} nécessite{recommendations.length > 1 ? 'nt' : ''} votre attention
          </CardDescription>
        </CardHeader>
        <CardContent>
          {recommendations.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Aucun réapprovisionnement nécessaire pour le moment
            </p>
          ) : (
            <div className="space-y-3">
              {recommendations.map((rec, idx) => (
                <div key={idx} className="border rounded-lg p-4 space-y-2">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge className={getUrgencyColor(rec.urgency)}>
                          {rec.urgency.toUpperCase()}
                        </Badge>
                        <h4 className="font-semibold">{rec.article.name}</h4>
                      </div>
                      <p className="text-sm text-muted-foreground">{rec.reason}</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Stock actuel</p>
                      <p className="font-semibold">{rec.currentStock} {rec.article.unit}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Stock recommandé</p>
                      <p className="font-semibold text-primary">{rec.recommendedStock} {rec.article.unit}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Vente quotidienne</p>
                      <p className="font-semibold">{rec.dailyAverage} {rec.article.unit}/jour</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Autonomie</p>
                      <p className="font-semibold">
                        {rec.daysUntilStockout > 365 ? '∞' : `${rec.daysUntilStockout} jours`}
                      </p>
                    </div>
                  </div>

                  {rec.urgency === 'critical' || rec.urgency === 'high' ? (
                    <Button className="w-full mt-2" variant="default">
                      Commander {rec.recommendedStock - rec.currentStock} {rec.article.unit}
                    </Button>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Insights de performance */}
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5" />
            Analyses & Recommandations
          </CardTitle>
          <CardDescription>Insights intelligents sur votre activité</CardDescription>
        </CardHeader>
        <CardContent>
          {insights.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Continuez à vendre pour obtenir plus d'analyses
            </p>
          ) : (
            <div className="space-y-3">
              {insights.map((insight, idx) => (
                <div key={idx} className="flex gap-3 p-4 bg-muted/50 rounded-lg">
                  {getInsightIcon(insight.type)}
                  <div className="flex-1">
                    <h4 className="font-semibold mb-1">{insight.title}</h4>
                    <p className="text-sm text-muted-foreground mb-2">{insight.description}</p>
                    {insight.actionable && (
                      <p className="text-sm font-medium text-primary">
                        💡 {insight.actionable}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
