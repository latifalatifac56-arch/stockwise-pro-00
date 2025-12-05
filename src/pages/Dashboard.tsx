import { useEffect, useState } from "react";
import { TrendingUp, Package, ShoppingCart, AlertTriangle, DollarSign, Truck, Clock, CheckCircle } from "lucide-react";
import { StatCard } from "@/components/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format, startOfDay, endOfDay, subDays } from "date-fns";
import { fr } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface SaleStats {
  todaySales: number;
  todayProfit: number;
  weekSales: number;
  weekProfit: number;
  salesCount: number;
}

interface StockStats {
  totalValue: number;
  lowStockCount: number;
  totalArticles: number;
}

interface DeliveryStats {
  pending: number;
  inTransit: number;
  delivered: number;
}

interface RecentSale {
  id: string;
  invoice_number: string;
  total: number;
  items: unknown;
  created_at: string;
  payment_method: string;
}

interface LowStockArticle {
  id: string;
  name: string;
  sku: string;
  stock: number;
  min_stock: number;
  unit: string;
}

interface PendingDelivery {
  id: string;
  delivery_address: string;
  status: string;
  scheduled_at: string | null;
  created_at: string;
  amount_to_collect: number | null;
  clients: { name: string } | null;
  sales: { invoice_number: string } | null;
  delivery_drivers: { name: string } | null;
}

export default function Dashboard() {
  const { toast } = useToast();
  const [saleStats, setSaleStats] = useState<SaleStats>({
    todaySales: 0,
    todayProfit: 0,
    weekSales: 0,
    weekProfit: 0,
    salesCount: 0,
  });
  const [stockStats, setStockStats] = useState<StockStats>({
    totalValue: 0,
    lowStockCount: 0,
    totalArticles: 0,
  });
  const [deliveryStats, setDeliveryStats] = useState<DeliveryStats>({
    pending: 0,
    inTransit: 0,
    delivered: 0,
  });
  const [recentSales, setRecentSales] = useState<RecentSale[]>([]);
  const [lowStockArticles, setLowStockArticles] = useState<LowStockArticle[]>([]);
  const [pendingDeliveries, setPendingDeliveries] = useState<PendingDelivery[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
    
    // Set up real-time subscriptions
    const salesChannel = supabase
      .channel('sales-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sales' }, () => {
        loadSalesData();
      })
      .subscribe();

    const articlesChannel = supabase
      .channel('articles-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'articles' }, () => {
        loadStockData();
      })
      .subscribe();

    const deliveriesChannel = supabase
      .channel('deliveries-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'deliveries' }, () => {
        loadDeliveryData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(salesChannel);
      supabase.removeChannel(articlesChannel);
      supabase.removeChannel(deliveriesChannel);
    };
  }, []);

  async function loadDashboardData() {
    setLoading(true);
    await Promise.all([
      loadSalesData(),
      loadStockData(),
      loadDeliveryData(),
    ]);
    setLoading(false);
  }

  async function loadSalesData() {
    const today = new Date();
    const todayStart = startOfDay(today).toISOString();
    const todayEnd = endOfDay(today).toISOString();
    const weekStart = startOfDay(subDays(today, 7)).toISOString();

    // Get today's sales
    const { data: todaySalesData, error: todayError } = await supabase
      .from('sales')
      .select('*')
      .gte('created_at', todayStart)
      .lte('created_at', todayEnd)
      .eq('status', 'completed');

    if (todayError) {
      console.error('Error loading today sales:', todayError);
      return;
    }

    // Get week's sales
    const { data: weekSalesData, error: weekError } = await supabase
      .from('sales')
      .select('*')
      .gte('created_at', weekStart)
      .eq('status', 'completed');

    if (weekError) {
      console.error('Error loading week sales:', weekError);
      return;
    }

    // Get articles for profit calculation
    const { data: articles } = await supabase
      .from('articles')
      .select('id, buy_price');

    const articlePrices = new Map(articles?.map(a => [a.id, a.buy_price]) || []);

    // Calculate today stats
    const todayRevenue = todaySalesData?.reduce((sum, sale) => sum + sale.total, 0) || 0;
    let todayProfit = 0;
    for (const sale of todaySalesData || []) {
      const items = sale.items as any[];
      for (const item of items) {
        const buyPrice = articlePrices.get(item.articleId) || 0;
        todayProfit += (item.price - buyPrice) * item.quantity;
      }
    }

    // Calculate week stats
    const weekRevenue = weekSalesData?.reduce((sum, sale) => sum + sale.total, 0) || 0;
    let weekProfit = 0;
    for (const sale of weekSalesData || []) {
      const items = sale.items as any[];
      for (const item of items) {
        const buyPrice = articlePrices.get(item.articleId) || 0;
        weekProfit += (item.price - buyPrice) * item.quantity;
      }
    }

    setSaleStats({
      todaySales: todayRevenue,
      todayProfit,
      weekSales: weekRevenue,
      weekProfit,
      salesCount: todaySalesData?.length || 0,
    });

    // Get recent sales
    const { data: recentData } = await supabase
      .from('sales')
      .select('id, invoice_number, total, items, created_at, payment_method')
      .order('created_at', { ascending: false })
      .limit(5);

    setRecentSales(recentData || []);
  }

  async function loadStockData() {
    const { data: articles, error } = await supabase
      .from('articles')
      .select('*')
      .eq('status', 'active');

    if (error) {
      console.error('Error loading articles:', error);
      return;
    }

    const totalValue = articles?.reduce((sum, article) => {
      return sum + (article.stock * article.sell_price);
    }, 0) || 0;

    const lowStock = articles?.filter(a => a.stock <= a.min_stock) || [];

    setStockStats({
      totalValue,
      lowStockCount: lowStock.length,
      totalArticles: articles?.length || 0,
    });

    setLowStockArticles(lowStock.slice(0, 5));
  }

  async function loadDeliveryData() {
    const today = new Date();
    const todayStart = startOfDay(today).toISOString();
    const todayEnd = endOfDay(today).toISOString();

    // Get delivery stats
    const { data: pending } = await supabase
      .from('deliveries')
      .select('id')
      .eq('status', 'pending');

    const { data: inTransit } = await supabase
      .from('deliveries')
      .select('id')
      .eq('status', 'in_transit');

    const { data: deliveredToday } = await supabase
      .from('deliveries')
      .select('id')
      .eq('status', 'delivered')
      .gte('delivered_at', todayStart)
      .lte('delivered_at', todayEnd);

    setDeliveryStats({
      pending: pending?.length || 0,
      inTransit: inTransit?.length || 0,
      delivered: deliveredToday?.length || 0,
    });

    // Get pending deliveries details
    const { data: pendingDetails } = await supabase
      .from('deliveries')
      .select(`
        id,
        delivery_address,
        status,
        scheduled_at,
        created_at,
        amount_to_collect,
        clients (name),
        sales (invoice_number),
        delivery_drivers (name)
      `)
      .in('status', ['pending', 'assigned', 'in_transit'])
      .order('created_at', { ascending: false })
      .limit(5);

    setPendingDeliveries(pendingDetails || []);
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary" className="bg-warning/20 text-warning border-warning/30">En attente</Badge>;
      case 'assigned':
        return <Badge variant="secondary" className="bg-primary/20 text-primary border-primary/30">Assignée</Badge>;
      case 'in_transit':
        return <Badge variant="secondary" className="bg-accent/20 text-accent border-accent/30">En cours</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getPaymentMethodLabel = (method: string) => {
    const labels: Record<string, string> = {
      cash: 'Espèces',
      card: 'Carte',
      tmoney: 'T-Money',
      flooz: 'Flooz',
      credit: 'Crédit',
    };
    return labels[method] || method;
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
          <p className="mt-4 text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-6 p-8">
      <div>
        <h1 className="text-3xl font-bold">Tableau de bord</h1>
        <p className="text-muted-foreground mt-1">
          Vue d'ensemble en temps réel - {format(new Date(), 'dd MMMM yyyy', { locale: fr })}
        </p>
      </div>

      {/* Main Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Ventes du jour"
          value={`${saleStats.todaySales.toLocaleString()} FCFA`}
          icon={ShoppingCart}
          trend={saleStats.salesCount > 0 ? { value: `${saleStats.salesCount} ventes`, positive: true } : undefined}
          className="bg-gradient-card shadow-md"
        />
        <StatCard
          title="Bénéfice du jour"
          value={`${saleStats.todayProfit.toLocaleString()} FCFA`}
          icon={TrendingUp}
          trend={saleStats.todaySales > 0 ? { 
            value: `${((saleStats.todayProfit / saleStats.todaySales) * 100).toFixed(1)}% marge`, 
            positive: true 
          } : undefined}
          className="bg-gradient-card shadow-md"
        />
        <StatCard
          title="Valeur du stock"
          value={`${stockStats.totalValue.toLocaleString()} FCFA`}
          icon={Package}
          className="bg-gradient-card shadow-md"
        />
        <StatCard
          title="Alertes stock"
          value={stockStats.lowStockCount}
          icon={AlertTriangle}
          trend={stockStats.lowStockCount > 0 ? { value: 'Articles à commander', positive: false } : undefined}
          className="bg-gradient-card shadow-md"
        />
      </div>

      {/* Delivery Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="shadow-md border-l-4 border-l-warning">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Livraisons en attente</p>
                <h3 className="text-3xl font-bold mt-2">{deliveryStats.pending}</h3>
              </div>
              <div className="h-12 w-12 rounded-xl bg-warning/20 flex items-center justify-center">
                <Clock className="h-6 w-6 text-warning" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-md border-l-4 border-l-primary">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">En cours de livraison</p>
                <h3 className="text-3xl font-bold mt-2">{deliveryStats.inTransit}</h3>
              </div>
              <div className="h-12 w-12 rounded-xl bg-primary/20 flex items-center justify-center">
                <Truck className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-md border-l-4 border-l-success">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Livrées aujourd'hui</p>
                <h3 className="text-3xl font-bold mt-2">{deliveryStats.delivered}</h3>
              </div>
              <div className="h-12 w-12 rounded-xl bg-success/20 flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-success" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent Sales */}
        <Card className="shadow-md lg:col-span-1">
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
              <div className="space-y-3">
                {recentSales.map((sale) => (
                  <div
                    key={sale.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <div>
                      <p className="font-medium">#{sale.invoice_number}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(sale.created_at), 'dd/MM HH:mm')} • {getPaymentMethodLabel(sale.payment_method)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-primary">{sale.total.toLocaleString()} F</p>
                      <p className="text-xs text-muted-foreground">{(sale.items as any[]).length} art.</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Low Stock Alerts */}
        <Card className="shadow-md lg:col-span-1">
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
              <div className="space-y-3">
                {lowStockArticles.map((article) => (
                  <div
                    key={article.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-warning/10 border border-warning/20"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{article.name}</p>
                      <p className="text-xs text-muted-foreground">SKU: {article.sku}</p>
                    </div>
                    <div className="text-right ml-2">
                      <p className="font-bold text-warning">{article.stock} {article.unit}</p>
                      <p className="text-xs text-muted-foreground">Min: {article.min_stock}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pending Deliveries */}
        <Card className="shadow-md lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Truck className="h-5 w-5 text-accent" />
              Livraisons en cours
            </CardTitle>
          </CardHeader>
          <CardContent>
            {pendingDeliveries.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">Aucune livraison en cours</p>
            ) : (
              <div className="space-y-3">
                {pendingDeliveries.map((delivery) => (
                  <div
                    key={delivery.id}
                    className="p-3 rounded-lg bg-muted/50 border border-border/50"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">
                          {delivery.clients?.name || 'Client non spécifié'}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {delivery.delivery_address}
                        </p>
                        {delivery.delivery_drivers?.name && (
                          <p className="text-xs text-muted-foreground mt-1">
                            🚗 {delivery.delivery_drivers.name}
                          </p>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        {getStatusBadge(delivery.status)}
                        {delivery.amount_to_collect && (
                          <span className="text-xs font-medium text-accent">
                            {delivery.amount_to_collect.toLocaleString()} F
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Weekly Summary */}
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-success" />
            Résumé de la semaine
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
              <p className="text-sm text-muted-foreground">Ventes 7 jours</p>
              <p className="text-2xl font-bold text-primary mt-1">{saleStats.weekSales.toLocaleString()} F</p>
            </div>
            <div className="p-4 rounded-lg bg-success/10 border border-success/20">
              <p className="text-sm text-muted-foreground">Bénéfice 7 jours</p>
              <p className="text-2xl font-bold text-success mt-1">{saleStats.weekProfit.toLocaleString()} F</p>
            </div>
            <div className="p-4 rounded-lg bg-accent/10 border border-accent/20">
              <p className="text-sm text-muted-foreground">Marge moyenne</p>
              <p className="text-2xl font-bold text-accent mt-1">
                {saleStats.weekSales > 0 
                  ? `${((saleStats.weekProfit / saleStats.weekSales) * 100).toFixed(1)}%`
                  : '0%'}
              </p>
            </div>
            <div className="p-4 rounded-lg bg-secondary border border-border">
              <p className="text-sm text-muted-foreground">Total articles</p>
              <p className="text-2xl font-bold mt-1">{stockStats.totalArticles}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
