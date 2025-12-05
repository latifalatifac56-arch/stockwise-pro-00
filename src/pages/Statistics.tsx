import { useEffect, useState } from 'react';
import { TrendingUp, DollarSign, Calendar, BarChart3 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getDB, Sale, Article } from '@/lib/db';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function Statistics() {
  const [dailySales, setDailySales] = useState<any[]>([]);
  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [profitData, setProfitData] = useState<any[]>([]);
  const [summary, setSummary] = useState({
    totalSales: 0,
    totalProfit: 0,
    totalRevenue: 0,
    avgMargin: 0,
  });

  useEffect(() => {
    loadStatistics();
  }, []);

  async function loadStatistics() {
    const db = await getDB();
    const sales = await db.getAll('sales');
    const articles = await db.getAll('articles');
    
    // Filter last 30 days
    const last30Days = subDays(new Date(), 30);
    const recentSales = sales.filter(s => 
      new Date(s.createdAt) >= last30Days && s.status === 'completed'
    );

    // Daily sales for last 7 days
    const dailyData: any[] = [];
    for (let i = 6; i >= 0; i--) {
      const date = subDays(new Date(), i);
      const dayStart = startOfDay(date);
      const dayEnd = endOfDay(date);
      
      const daySales = recentSales.filter(s => {
        const saleDate = new Date(s.createdAt);
        return saleDate >= dayStart && saleDate <= dayEnd;
      });

      let dayProfit = 0;
      daySales.forEach(sale => {
        sale.items.forEach(item => {
          dayProfit += item.profit || 0;
        });
      });

      const dayRevenue = daySales.reduce((sum, sale) => sum + sale.total, 0);
      
      dailyData.push({
        date: format(date, 'dd/MM', { locale: fr }),
        ventes: dayRevenue,
        benefice: dayProfit,
      });
    }

    // Top products
    const productSales: { [key: number]: { name: string, quantity: number, revenue: number } } = {};
    recentSales.forEach(sale => {
      sale.items.forEach(item => {
        if (!productSales[item.articleId]) {
          productSales[item.articleId] = { name: item.name, quantity: 0, revenue: 0 };
        }
        productSales[item.articleId].quantity += item.quantity;
        productSales[item.articleId].revenue += item.total;
      });
    });

    const topProds = Object.entries(productSales)
      .map(([id, data]) => ({ id: Number(id), ...data }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    // Profit trend
    const profitTrend = dailyData.map(d => ({
      date: d.date,
      marge: d.ventes > 0 ? ((d.benefice / d.ventes) * 100).toFixed(1) : 0,
    }));

    // Summary
    const totalRevenue = recentSales.reduce((sum, sale) => sum + sale.total, 0);
    let totalProfit = 0;
    recentSales.forEach(sale => {
      sale.items.forEach(item => {
        totalProfit += item.profit || 0;
      });
    });

    setDailySales(dailyData);
    setTopProducts(topProds);
    setProfitData(profitTrend);
    setSummary({
      totalSales: recentSales.length,
      totalProfit,
      totalRevenue,
      avgMargin: totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0,
    });
  }

  const COLORS = ['hsl(var(--primary))', 'hsl(var(--accent))', 'hsl(var(--success))', 'hsl(var(--warning))', 'hsl(var(--destructive))'];

  return (
    <div className="flex-1 space-y-6 p-8">
      <div>
        <h1 className="text-3xl font-bold">Statistiques</h1>
        <p className="text-muted-foreground mt-1">Analyse détaillée des performances</p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-gradient-card shadow-md">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Ventes (30j)</p>
                <p className="text-2xl font-bold mt-1">{summary.totalSales}</p>
              </div>
              <BarChart3 className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card shadow-md">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">CA Total</p>
                <p className="text-2xl font-bold mt-1">{summary.totalRevenue.toLocaleString()} FCFA</p>
              </div>
              <DollarSign className="h-8 w-8 text-success" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card shadow-md">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Bénéfice Total</p>
                <p className="text-2xl font-bold mt-1">{summary.totalProfit.toLocaleString()} FCFA</p>
              </div>
              <TrendingUp className="h-8 w-8 text-accent" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card shadow-md">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Marge Moyenne</p>
                <p className="text-2xl font-bold mt-1">{summary.avgMargin.toFixed(1)}%</p>
              </div>
              <Calendar className="h-8 w-8 text-warning" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Daily Sales Chart */}
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle>Ventes et Bénéfices (7 derniers jours)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={dailySales}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--background))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
                <Legend />
                <Bar dataKey="ventes" fill="hsl(var(--primary))" name="Ventes (FCFA)" radius={[8, 8, 0, 0]} />
                <Bar dataKey="benefice" fill="hsl(var(--success))" name="Bénéfice (FCFA)" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Profit Margin Trend */}
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle>Évolution de la Marge (%)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={profitData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--background))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="marge" 
                  stroke="hsl(var(--accent))" 
                  strokeWidth={3}
                  name="Marge (%)"
                  dot={{ fill: 'hsl(var(--accent))', r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top Products */}
        <Card className="shadow-md lg:col-span-2">
          <CardHeader>
            <CardTitle>Top 5 Produits (CA)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topProducts} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" stroke="hsl(var(--muted-foreground))" />
                <YAxis dataKey="name" type="category" width={150} stroke="hsl(var(--muted-foreground))" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--background))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
                <Bar dataKey="revenue" fill="hsl(var(--primary))" name="Chiffre d'affaires (FCFA)" radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
