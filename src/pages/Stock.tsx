import { useEffect, useState } from 'react';
import { Package, TrendingDown, TrendingUp, AlertTriangle, Download } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';
import { Progress } from '@/components/ui/progress';
import { exportInventoryToPDF } from '@/lib/export';
import { toast } from 'sonner';
import { useSettings } from '@/contexts/SettingsContext';

type Article = Tables<'articles'>;

export default function Stock() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'low' | 'good'>('all');
  const { settings } = useSettings();

  useEffect(() => {
    loadArticles();
  }, []);

  async function loadArticles() {
    try {
      const { data, error } = await supabase
        .from('articles')
        .select('*')
        .eq('status', 'active');
      
      if (error) throw error;
      setArticles(data || []);
    } catch (error) {
      console.error('Error loading articles:', error);
      toast.error('Erreur lors du chargement des articles');
    }
  }

  const filteredArticles = articles
    .filter(article => {
      const matchesSearch = article.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        article.sku.toLowerCase().includes(searchTerm.toLowerCase());
      
      if (filter === 'low') return matchesSearch && article.stock <= article.min_stock;
      if (filter === 'good') return matchesSearch && article.stock > article.min_stock;
      return matchesSearch;
    })
    .sort((a, b) => a.stock - b.stock);

  const stats = {
    total: articles.length,
    totalValue: articles.reduce((sum, a) => sum + (a.stock * a.sell_price), 0),
    lowStock: articles.filter(a => a.stock <= a.min_stock).length,
    outOfStock: articles.filter(a => a.stock === 0).length,
  };

  return (
    <div className="flex-1 space-y-6 p-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Gestion du Stock</h1>
          <p className="text-muted-foreground mt-1">Suivez vos niveaux de stock en temps réel</p>
        </div>
        <Button
          variant="outline"
          onClick={async () => {
            try {
              await exportInventoryToPDF(articles, settings?.company_name);
              toast.success('Export PDF réussi');
            } catch (error) {
              toast.error('Erreur lors de l\'export');
            }
          }}
        >
          <Download className="h-4 w-4 mr-2" />
          Exporter PDF
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-4">
        <Card className="bg-gradient-card shadow-md">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Articles totaux</p>
                <p className="text-3xl font-bold mt-2">{stats.total}</p>
              </div>
              <Package className="h-12 w-12 text-primary opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card shadow-md">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Valeur totale</p>
                <p className="text-2xl font-bold mt-2">{stats.totalValue.toLocaleString()} FCFA</p>
              </div>
              <TrendingUp className="h-12 w-12 text-success opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card shadow-md">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Stock faible</p>
                <p className="text-3xl font-bold mt-2 text-warning">{stats.lowStock}</p>
              </div>
              <AlertTriangle className="h-12 w-12 text-warning opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card shadow-md">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Rupture</p>
                <p className="text-3xl font-bold mt-2 text-destructive">{stats.outOfStock}</p>
              </div>
              <TrendingDown className="h-12 w-12 text-destructive opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-md">
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <CardTitle>Inventaire détaillé</CardTitle>
            <div className="flex gap-2">
              <Badge
                variant={filter === 'all' ? 'default' : 'outline'}
                className="cursor-pointer"
                onClick={() => setFilter('all')}
              >
                Tous
              </Badge>
              <Badge
                variant={filter === 'low' ? 'default' : 'outline'}
                className="cursor-pointer"
                onClick={() => setFilter('low')}
              >
                Stock faible
              </Badge>
              <Badge
                variant={filter === 'good' ? 'default' : 'outline'}
                className="cursor-pointer"
                onClick={() => setFilter('good')}
              >
                Stock bon
              </Badge>
            </div>
          </div>
          <Input
            placeholder="Rechercher un article..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="mt-4"
          />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {filteredArticles.map((article) => {
              const stockPercentage = (article.stock / (article.min_stock * 3)) * 100;
              const isLow = article.stock <= article.min_stock;
              const isOut = article.stock === 0;

              return (
                <div
                  key={article.id}
                  className={`p-4 rounded-lg border ${
                    isOut ? 'border-destructive bg-destructive/5' :
                    isLow ? 'border-warning bg-warning/5' :
                    'border-border bg-card'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h3 className="font-semibold">{article.name}</h3>
                        {isOut && <Badge variant="destructive">Rupture</Badge>}
                        {isLow && !isOut && <Badge className="bg-warning text-warning-foreground">Faible</Badge>}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        SKU: {article.sku} • Catégorie: {article.category}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold">{article.stock}</p>
                      <p className="text-sm text-muted-foreground">{article.unit}</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Stock minimum: {article.min_stock}</span>
                      <span>Valeur: {(article.stock * article.sell_price).toLocaleString()} FCFA</span>
                    </div>
                    <Progress
                      value={Math.min(stockPercentage, 100)}
                      className={`h-2 ${isOut ? 'bg-destructive/20' : isLow ? 'bg-warning/20' : ''}`}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
