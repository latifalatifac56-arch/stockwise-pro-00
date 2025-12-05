import { useEffect, useState } from "react";
import { TrendingUp, Package, ShoppingCart, AlertTriangle, DollarSign } from "lucide-react";
import { StatCard } from "@/components/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getDB, Article, Sale } from "@/lib/db";
import { format, startOfDay, endOfDay, subDays } from "date-fns";
import { fr } from "date-fns/locale";

export default function Dashboard() {
  const [stats, setStats] = useState({
    todaySales: 0,
    todayProfit: 0,
    totalStock: 0,
    lowStock: 0,
    totalArticles: 0,
  });
  const [recentSales, setRecentSales] = useState<Sale[]>([]);
  const [lowStockArticles, setLowStockArticles] = useState<Article[]>([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  async function loadDashboardData() {
    const db = await getDB();
    
    // Get all articles
    const articles = await db.getAll('articles');
    const activeArticles = articles.filter(a => a.status === 'active');
    
    // Calculate total stock value
    const totalStockValue = activeArticles.reduce((sum, article) => {
      return sum + (article.stock * article.sellPrice);
    }, 0);

    // Get low stock articles
    const lowStock = activeArticles.filter(a => a.stock <= a.minStock);

    // Get today's sales
    const today = new Date();
    const todayStart = startOfDay(today).toISOString();
    const todayEnd = endOfDay(today).toISOString();
    
    const allSales = await db.getAll('sales');
    const todaySales = allSales.filter(s => 
      s.createdAt >= todayStart && 
      s.createdAt <= todayEnd &&
      s.status === 'completed'
    );

    const todayRevenue = todaySales.reduce((sum, sale) => sum + sale.total, 0);
    
    // Calculate profit (simple calculation: sell price - buy price)
    let todayProfit = 0;
    for (const sale of todaySales) {
      for (const item of sale.items) {
        const article = articles.find(a => a.id === item.articleId);
        if (article) {
          const profit = (item.price - article.buyPrice) * item.quantity;
          todayProfit += profit;
        }
      }
    }

    // Get recent sales (last 5)
    const recent = allSales
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);

    setStats({
      todaySales: todayRevenue,
      todayProfit,
      totalStock: totalStockValue,
      lowStock: lowStock.length,
      totalArticles: activeArticles.length,
    });
    
    setRecentSales(recent);
    setLowStockArticles(lowStock.slice(0, 5));
  }

  return (
    <div className="flex-1 space-y-6 p-8">
      <div>
        <h1 className="text-3xl font-bold">Tableau de bord</h1>
        <p className="text-muted-foreground mt-1">
          Vue d'ensemble de votre activité - {format(new Date(), 'dd MMMM yyyy', { locale: fr })}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Ventes du jour"
          value={`${stats.todaySales.toLocaleString()} FCFA`}
          icon={ShoppingCart}
          className="bg-gradient-card shadow-md"
        />
        <StatCard
          title="Bénéfice du jour"
          value={`${stats.todayProfit.toLocaleString()} FCFA`}
          icon={TrendingUp}
          className="bg-gradient-card shadow-md"
        />
        <StatCard
          title="Valeur du stock"
          value={`${stats.totalStock.toLocaleString()} FCFA`}
          icon={Package}
          className="bg-gradient-card shadow-md"
        />
        <StatCard
          title="Alertes stock"
          value={stats.lowStock}
          icon={AlertTriangle}
          className="bg-gradient-card shadow-md"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Sales */}
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-primary" />
              Ventes récentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentSales.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">Aucune vente enregistrée</p>
            ) : (
              <div className="space-y-4">
                {recentSales.map((sale) => (
                  <div
                    key={sale.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <div>
                      <p className="font-medium">Facture #{sale.invoiceNumber}</p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(sale.createdAt), 'dd/MM/yyyy HH:mm')}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-primary">{sale.total.toLocaleString()} FCFA</p>
                      <p className="text-xs text-muted-foreground">{sale.items.length} articles</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Low Stock Alerts */}
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-warning" />
              Stock faible
            </CardTitle>
          </CardHeader>
          <CardContent>
            {lowStockArticles.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">Aucune alerte de stock</p>
            ) : (
              <div className="space-y-4">
                {lowStockArticles.map((article) => (
                  <div
                    key={article.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-warning/10 border border-warning/20"
                  >
                    <div className="flex-1">
                      <p className="font-medium">{article.name}</p>
                      <p className="text-sm text-muted-foreground">SKU: {article.sku}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-warning">{article.stock} {article.unit}</p>
                      <p className="text-xs text-muted-foreground">Min: {article.minStock}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Stats */}
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-success" />
            Résumé
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="p-4 rounded-lg bg-gradient-primary/10 border border-primary/20">
              <p className="text-sm text-muted-foreground">Total articles</p>
              <p className="text-2xl font-bold text-primary mt-1">{stats.totalArticles}</p>
            </div>
            <div className="p-4 rounded-lg bg-gradient-accent/10 border border-accent/20">
              <p className="text-sm text-muted-foreground">Marge moyenne</p>
              <p className="text-2xl font-bold text-accent mt-1">
                {stats.todaySales > 0 
                  ? `${((stats.todayProfit / stats.todaySales) * 100).toFixed(1)}%`
                  : '0%'}
              </p>
            </div>
            <div className="p-4 rounded-lg bg-success/10 border border-success/20">
              <p className="text-sm text-muted-foreground">Stock actif</p>
              <p className="text-2xl font-bold text-success mt-1">{stats.totalArticles}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
