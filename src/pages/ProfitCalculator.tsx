import { useEffect, useState } from 'react';
import { Calculator, TrendingUp, Package, DollarSign, Percent, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Article {
  id: string;
  name: string;
  sku: string;
  buy_price: number;
  sell_price: number;
  wholesale_price: number | null;
  stock: number;
  category: string;
}

interface ProfitAnalysis {
  article: Article;
  unitProfit: number;
  marginPercent: number;
  stockValue: number;
  potentialProfit: number;
  wholesaleMargin: number | null;
}

export default function ProfitCalculator() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [analysis, setAnalysis] = useState<ProfitAnalysis[]>([]);
  const [customBuyPrice, setCustomBuyPrice] = useState(0);
  const [customSellPrice, setCustomSellPrice] = useState(0);
  const [customQuantity, setCustomQuantity] = useState(1);
  const [sortBy, setSortBy] = useState<'margin' | 'profit' | 'stock'>('margin');

  useEffect(() => {
    loadArticles();
  }, []);

  async function loadArticles() {
    const { data, error } = await supabase
      .from('articles')
      .select('*')
      .eq('status', 'active')
      .order('name');

    if (!error && data) {
      setArticles(data);
      analyzeArticles(data);
    }
  }

  function analyzeArticles(articlesList: Article[]) {
    const analyzed: ProfitAnalysis[] = articlesList.map(article => {
      const unitProfit = article.sell_price - article.buy_price;
      const marginPercent = article.buy_price > 0 
        ? ((unitProfit / article.buy_price) * 100) 
        : 0;
      const stockValue = article.stock * article.buy_price;
      const potentialProfit = article.stock * unitProfit;
      const wholesaleMargin = article.wholesale_price 
        ? ((article.wholesale_price - article.buy_price) / article.buy_price) * 100 
        : null;

      return {
        article,
        unitProfit,
        marginPercent,
        stockValue,
        potentialProfit,
        wholesaleMargin
      };
    });

    // Trier
    analyzed.sort((a, b) => {
      switch (sortBy) {
        case 'margin': return b.marginPercent - a.marginPercent;
        case 'profit': return b.potentialProfit - a.potentialProfit;
        case 'stock': return b.stockValue - a.stockValue;
        default: return 0;
      }
    });

    setAnalysis(analyzed);
  }

  useEffect(() => {
    if (articles.length > 0) {
      analyzeArticles(articles);
    }
  }, [sortBy]);

  const handleArticleSelect = (articleId: string) => {
    const article = articles.find(a => a.id === articleId);
    if (article) {
      setSelectedArticle(article);
      setCustomBuyPrice(article.buy_price);
      setCustomSellPrice(article.sell_price);
    }
  };

  // Calculs personnalisés
  const customUnitProfit = customSellPrice - customBuyPrice;
  const customMarginPercent = customBuyPrice > 0 ? ((customUnitProfit / customBuyPrice) * 100) : 0;
  const customTotalProfit = customUnitProfit * customQuantity;
  const customTotalRevenue = customSellPrice * customQuantity;

  // Stats globales
  const totalStockValue = analysis.reduce((sum, a) => sum + a.stockValue, 0);
  const totalPotentialProfit = analysis.reduce((sum, a) => sum + a.potentialProfit, 0);
  const avgMargin = analysis.length > 0 
    ? analysis.reduce((sum, a) => sum + a.marginPercent, 0) / analysis.length 
    : 0;
  const lowMarginProducts = analysis.filter(a => a.marginPercent < 15).length;

  const getMarginColor = (margin: number) => {
    if (margin >= 30) return 'text-success';
    if (margin >= 15) return 'text-warning';
    return 'text-destructive';
  };

  const getMarginBadge = (margin: number) => {
    if (margin >= 30) return <Badge className="bg-success/20 text-success">Excellente</Badge>;
    if (margin >= 15) return <Badge className="bg-warning/20 text-warning">Correcte</Badge>;
    return <Badge variant="destructive">Faible</Badge>;
  };

  return (
    <div className="flex-1 space-y-6 p-8">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Calculator className="h-8 w-8 text-primary" />
          Calculateur de Rentabilité
        </h1>
        <p className="text-muted-foreground mt-1">
          Analysez la rentabilité de vos produits et optimisez vos marges
        </p>
      </div>

      {/* Stats globales */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="bg-gradient-card shadow-md">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Valeur du stock</p>
                <p className="text-2xl font-bold mt-1">{totalStockValue.toLocaleString()} FCFA</p>
              </div>
              <Package className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card shadow-md">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Profit potentiel</p>
                <p className="text-2xl font-bold mt-1 text-success">{totalPotentialProfit.toLocaleString()} FCFA</p>
              </div>
              <TrendingUp className="h-8 w-8 text-success" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card shadow-md">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Marge moyenne</p>
                <p className={`text-2xl font-bold mt-1 ${getMarginColor(avgMargin)}`}>{avgMargin.toFixed(1)}%</p>
              </div>
              <Percent className="h-8 w-8 text-accent" />
            </div>
          </CardContent>
        </Card>

        <Card className={`shadow-md ${lowMarginProducts > 0 ? 'bg-warning/10' : 'bg-gradient-card'}`}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Marges faibles</p>
                <p className="text-2xl font-bold mt-1 text-warning">{lowMarginProducts}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-warning" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Calculateur personnalisé */}
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5 text-primary" />
              Simulateur de Prix
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Sélectionner un article (optionnel)</Label>
              <Select onValueChange={handleArticleSelect}>
                <SelectTrigger>
                  <SelectValue placeholder="Choisir un article..." />
                </SelectTrigger>
                <SelectContent>
                  {articles.map(article => (
                    <SelectItem key={article.id} value={article.id}>
                      {article.name} ({article.sku})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Prix d'achat (FCFA)</Label>
                <Input
                  type="number"
                  min="0"
                  value={customBuyPrice}
                  onChange={(e) => setCustomBuyPrice(parseFloat(e.target.value) || 0)}
                />
              </div>
              <div className="space-y-2">
                <Label>Prix de vente (FCFA)</Label>
                <Input
                  type="number"
                  min="0"
                  value={customSellPrice}
                  onChange={(e) => setCustomSellPrice(parseFloat(e.target.value) || 0)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Quantité</Label>
              <Input
                type="number"
                min="1"
                value={customQuantity}
                onChange={(e) => setCustomQuantity(parseInt(e.target.value) || 1)}
              />
            </div>

            {/* Résultats */}
            <div className="mt-6 space-y-3">
              <div className="p-4 rounded-lg bg-muted">
                <div className="flex justify-between items-center">
                  <span>Profit unitaire</span>
                  <span className={`font-bold ${customUnitProfit >= 0 ? 'text-success' : 'text-destructive'}`}>
                    {customUnitProfit.toLocaleString()} FCFA
                  </span>
                </div>
              </div>

              <div className="p-4 rounded-lg bg-muted">
                <div className="flex justify-between items-center">
                  <span>Marge</span>
                  <div className="flex items-center gap-2">
                    <span className={`font-bold ${getMarginColor(customMarginPercent)}`}>
                      {customMarginPercent.toFixed(1)}%
                    </span>
                    {getMarginBadge(customMarginPercent)}
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-lg bg-primary/10 border border-primary/30">
                <div className="flex justify-between items-center">
                  <span className="font-semibold">Profit total ({customQuantity} unités)</span>
                  <span className="text-xl font-bold text-primary">{customTotalProfit.toLocaleString()} FCFA</span>
                </div>
              </div>

              <div className="p-4 rounded-lg bg-muted">
                <div className="flex justify-between items-center">
                  <span>Chiffre d'affaires</span>
                  <span className="font-bold">{customTotalRevenue.toLocaleString()} FCFA</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Analyse des produits */}
        <Card className="shadow-md">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Analyse par Produit</CardTitle>
              <Select value={sortBy} onValueChange={(v: any) => setSortBy(v)}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="margin">Par marge</SelectItem>
                  <SelectItem value="profit">Par profit</SelectItem>
                  <SelectItem value="stock">Par stock</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-[500px] overflow-y-auto">
              {analysis.slice(0, 15).map((item) => (
                <div
                  key={item.article.id}
                  className="p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="font-medium">{item.article.name}</p>
                      <p className="text-sm text-muted-foreground">{item.article.sku}</p>
                    </div>
                    {getMarginBadge(item.marginPercent)}
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <div>
                      <p className="text-muted-foreground">Marge</p>
                      <p className={`font-semibold ${getMarginColor(item.marginPercent)}`}>
                        {item.marginPercent.toFixed(1)}%
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Profit/unité</p>
                      <p className="font-semibold">{item.unitProfit.toLocaleString()} FCFA</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Profit stock</p>
                      <p className="font-semibold text-success">{item.potentialProfit.toLocaleString()} FCFA</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Conseils */}
      <Card className="shadow-md bg-primary/5 border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Conseils d'Optimisation
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="p-4 rounded-lg bg-background">
              <h4 className="font-semibold text-success mb-2">✅ Marges &gt; 30%</h4>
              <p className="text-sm text-muted-foreground">
                Excellentes marges! Concentrez vos efforts de vente sur ces produits.
              </p>
            </div>
            <div className="p-4 rounded-lg bg-background">
              <h4 className="font-semibold text-warning mb-2">⚠️ Marges 15-30%</h4>
              <p className="text-sm text-muted-foreground">
                Marges correctes. Négociez de meilleurs prix d'achat ou augmentez les prix.
              </p>
            </div>
            <div className="p-4 rounded-lg bg-background">
              <h4 className="font-semibold text-destructive mb-2">❌ Marges &lt; 15%</h4>
              <p className="text-sm text-muted-foreground">
                Marges trop faibles. Revoyez votre stratégie de prix ou arrêtez ces produits.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
