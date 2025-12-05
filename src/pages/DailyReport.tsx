import { useEffect, useState } from 'react';
import { FileText, Download, Calendar, TrendingUp, ShoppingCart, Users, Package } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useSettings } from '@/contexts/SettingsContext';
import { toast } from 'sonner';
import { format, startOfDay, endOfDay } from 'date-fns';
import { fr } from 'date-fns/locale';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface DailyStats {
  totalSales: number;
  salesCount: number;
  totalExpenses: number;
  topProducts: { name: string; quantity: number; revenue: number }[];
  paymentBreakdown: { method: string; amount: number }[];
  newClients: number;
  deliveries: number;
}

export default function DailyReport() {
  const { settings } = useSettings();
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [stats, setStats] = useState<DailyStats>({
    totalSales: 0,
    salesCount: 0,
    totalExpenses: 0,
    topProducts: [],
    paymentBreakdown: [],
    newClients: 0,
    deliveries: 0
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadDailyStats();
  }, [selectedDate]);

  async function loadDailyStats() {
    setLoading(true);
    const dateStart = `${selectedDate}T00:00:00`;
    const dateEnd = `${selectedDate}T23:59:59`;

    // Charger les ventes
    const { data: sales } = await supabase
      .from('sales')
      .select('*')
      .eq('status', 'completed')
      .gte('created_at', dateStart)
      .lte('created_at', dateEnd);

    // Charger les dépenses
    const { data: expenses } = await supabase
      .from('expenses')
      .select('amount')
      .eq('date', selectedDate);

    // Charger les nouveaux clients
    const { data: clients } = await supabase
      .from('clients')
      .select('id')
      .gte('created_at', dateStart)
      .lte('created_at', dateEnd);

    // Charger les livraisons
    const { data: deliveries } = await supabase
      .from('deliveries')
      .select('id')
      .gte('created_at', dateStart)
      .lte('created_at', dateEnd);

    // Calculer les stats
    const totalSales = sales?.reduce((sum, s) => sum + s.total, 0) || 0;
    const totalExpenses = expenses?.reduce((sum, e) => sum + e.amount, 0) || 0;

    // Breakdown par méthode de paiement
    const paymentMethods: { [key: string]: number } = {};
    sales?.forEach(sale => {
      const method = sale.payment_method || 'cash';
      paymentMethods[method] = (paymentMethods[method] || 0) + sale.total;
    });

    const paymentBreakdown = Object.entries(paymentMethods).map(([method, amount]) => ({
      method: getPaymentMethodLabel(method),
      amount
    }));

    // Top produits
    const productSales: { [key: string]: { name: string; quantity: number; revenue: number } } = {};
    sales?.forEach(sale => {
      const items = sale.items as any[];
      items?.forEach(item => {
        const key = item.name || item.articleId;
        if (!productSales[key]) {
          productSales[key] = { name: item.name, quantity: 0, revenue: 0 };
        }
        productSales[key].quantity += item.quantity;
        productSales[key].revenue += item.total || (item.price * item.quantity);
      });
    });

    const topProducts = Object.values(productSales)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    setStats({
      totalSales,
      salesCount: sales?.length || 0,
      totalExpenses,
      topProducts,
      paymentBreakdown,
      newClients: clients?.length || 0,
      deliveries: deliveries?.length || 0
    });
    setLoading(false);
  }

  function getPaymentMethodLabel(method: string) {
    const labels: { [key: string]: string } = {
      cash: 'Espèces',
      tmoney: 'TMoney',
      flooz: 'Flooz',
      card: 'Carte',
      credit: 'Crédit'
    };
    return labels[method] || method;
  }

  function generatePDF() {
    const doc = new jsPDF();
    const dateFormatted = format(new Date(selectedDate), 'dd MMMM yyyy', { locale: fr });

    // En-tête
    doc.setFontSize(20);
    doc.setTextColor(59, 130, 246);
    doc.text(settings.company_name || 'Mon Entreprise', 105, 20, { align: 'center' });
    
    doc.setFontSize(16);
    doc.setTextColor(0, 0, 0);
    doc.text('Rapport Journalier', 105, 30, { align: 'center' });
    doc.setFontSize(12);
    doc.text(dateFormatted, 105, 38, { align: 'center' });

    // Résumé
    doc.setFontSize(14);
    doc.text('Résumé', 14, 55);
    
    autoTable(doc, {
      startY: 60,
      head: [['Indicateur', 'Valeur']],
      body: [
        ['Nombre de ventes', stats.salesCount.toString()],
        ['Chiffre d\'affaires', `${stats.totalSales.toLocaleString()} FCFA`],
        ['Dépenses', `${stats.totalExpenses.toLocaleString()} FCFA`],
        ['Bénéfice net', `${(stats.totalSales - stats.totalExpenses).toLocaleString()} FCFA`],
        ['Nouveaux clients', stats.newClients.toString()],
        ['Livraisons', stats.deliveries.toString()],
      ],
      theme: 'striped',
      headStyles: { fillColor: [59, 130, 246] }
    });

    // Paiements par méthode
    let finalY = (doc as any).lastAutoTable.finalY + 15;
    doc.setFontSize(14);
    doc.text('Répartition des Paiements', 14, finalY);

    autoTable(doc, {
      startY: finalY + 5,
      head: [['Méthode', 'Montant']],
      body: stats.paymentBreakdown.map(p => [p.method, `${p.amount.toLocaleString()} FCFA`]),
      theme: 'striped',
      headStyles: { fillColor: [16, 185, 129] }
    });

    // Top produits
    finalY = (doc as any).lastAutoTable.finalY + 15;
    doc.setFontSize(14);
    doc.text('Top Produits', 14, finalY);

    autoTable(doc, {
      startY: finalY + 5,
      head: [['Produit', 'Quantité', 'CA']],
      body: stats.topProducts.map(p => [p.name, p.quantity.toString(), `${p.revenue.toLocaleString()} FCFA`]),
      theme: 'striped',
      headStyles: { fillColor: [245, 158, 11] }
    });

    // Pied de page
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(10);
      doc.setTextColor(128, 128, 128);
      doc.text(
        `Généré le ${format(new Date(), 'dd/MM/yyyy HH:mm')} - Page ${i}/${pageCount}`,
        105,
        doc.internal.pageSize.height - 10,
        { align: 'center' }
      );
    }

    doc.save(`rapport-${selectedDate}.pdf`);
    toast.success('Rapport PDF généré avec succès');
  }

  const netProfit = stats.totalSales - stats.totalExpenses;

  return (
    <div className="flex-1 space-y-6 p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <FileText className="h-8 w-8 text-primary" />
            Rapport Journalier
          </h1>
          <p className="text-muted-foreground mt-1">
            Générez et téléchargez vos rapports quotidiens
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-muted-foreground" />
            <Input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-40"
            />
          </div>
          <Button onClick={generatePDF} className="bg-gradient-primary">
            <Download className="h-4 w-4 mr-2" />
            Télécharger PDF
          </Button>
        </div>
      </div>

      {/* Stats principales */}
      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
        <Card className="bg-gradient-card shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Ventes</p>
                <p className="text-lg font-bold">{stats.salesCount}</p>
              </div>
              <ShoppingCart className="h-6 w-6 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">CA</p>
                <p className="text-lg font-bold">{stats.totalSales.toLocaleString()}</p>
              </div>
              <TrendingUp className="h-6 w-6 text-success" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Dépenses</p>
                <p className="text-lg font-bold">{stats.totalExpenses.toLocaleString()}</p>
              </div>
              <TrendingUp className="h-6 w-6 text-destructive" />
            </div>
          </CardContent>
        </Card>

        <Card className={`shadow-md ${netProfit >= 0 ? 'bg-success/10' : 'bg-destructive/10'}`}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Bénéfice</p>
                <p className={`text-lg font-bold ${netProfit >= 0 ? 'text-success' : 'text-destructive'}`}>
                  {netProfit.toLocaleString()}
                </p>
              </div>
              <TrendingUp className={`h-6 w-6 ${netProfit >= 0 ? 'text-success' : 'text-destructive'}`} />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Clients</p>
                <p className="text-lg font-bold">{stats.newClients}</p>
              </div>
              <Users className="h-6 w-6 text-accent" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Livraisons</p>
                <p className="text-lg font-bold">{stats.deliveries}</p>
              </div>
              <Package className="h-6 w-6 text-warning" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Répartition des paiements */}
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle>Répartition des Paiements</CardTitle>
          </CardHeader>
          <CardContent>
            {stats.paymentBreakdown.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">Aucune vente ce jour</p>
            ) : (
              <div className="space-y-3">
                {stats.paymentBreakdown.map((payment, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <span className="font-medium">{payment.method}</span>
                    <span className="font-bold text-primary">{payment.amount.toLocaleString()} FCFA</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top produits */}
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle>Top Produits Vendus</CardTitle>
          </CardHeader>
          <CardContent>
            {stats.topProducts.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">Aucune vente ce jour</p>
            ) : (
              <div className="space-y-3">
                {stats.topProducts.map((product, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div>
                      <p className="font-medium">{product.name}</p>
                      <p className="text-sm text-muted-foreground">{product.quantity} vendus</p>
                    </div>
                    <span className="font-bold text-success">{product.revenue.toLocaleString()} FCFA</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
