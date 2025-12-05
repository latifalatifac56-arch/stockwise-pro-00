import { useEffect, useState } from 'react';
import { History, User, ShoppingCart, CreditCard, Calendar, Phone, Mail, MapPin, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { WhatsAppButton } from '@/components/WhatsAppButton';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface Client {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  balance: number | null;
  type: string | null;
}

interface Transaction {
  id: string;
  type: 'sale' | 'payment' | 'credit';
  amount: number;
  date: string;
  description: string;
  paymentMethod?: string;
}

export default function ClientHistory() {
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [stats, setStats] = useState({
    totalPurchases: 0,
    totalTransactions: 0,
    avgTransaction: 0,
    lastPurchase: null as string | null
  });

  useEffect(() => {
    loadClients();
  }, []);

  async function loadClients() {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .order('name');

    if (!error && data) {
      setClients(data);
    }
  }

  async function loadClientHistory(client: Client) {
    setSelectedClient(client);

    // Charger les ventes du client
    const { data: sales } = await supabase
      .from('sales')
      .select('*')
      .eq('client_id', client.id)
      .order('created_at', { ascending: false });

    const trans: Transaction[] = [];

    sales?.forEach(sale => {
      trans.push({
        id: sale.id,
        type: sale.payment_method === 'credit' ? 'credit' : 'sale',
        amount: sale.total,
        date: sale.created_at!,
        description: `Facture #${sale.invoice_number}`,
        paymentMethod: sale.payment_method
      });
    });

    // Calculer les stats
    const totalPurchases = sales?.reduce((sum, s) => sum + s.total, 0) || 0;
    const avgTransaction = sales && sales.length > 0 ? totalPurchases / sales.length : 0;
    const lastPurchase = sales && sales.length > 0 ? sales[0].created_at : null;

    setTransactions(trans);
    setStats({
      totalPurchases,
      totalTransactions: sales?.length || 0,
      avgTransaction,
      lastPurchase
    });
  }

  const filteredClients = clients.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.phone?.includes(searchTerm)
  );

  const getPaymentMethodLabel = (method: string) => {
    const labels: { [key: string]: string } = {
      cash: 'Espèces',
      tmoney: 'TMoney',
      flooz: 'Flooz',
      card: 'Carte',
      credit: 'Crédit'
    };
    return labels[method] || method;
  };

  const getPaymentMethodColor = (method: string) => {
    const colors: { [key: string]: string } = {
      cash: 'bg-success/20 text-success',
      tmoney: 'bg-blue-500/20 text-blue-500',
      flooz: 'bg-yellow-500/20 text-yellow-500',
      card: 'bg-purple-500/20 text-purple-500',
      credit: 'bg-destructive/20 text-destructive'
    };
    return colors[method] || 'bg-muted';
  };

  return (
    <div className="flex-1 space-y-6 p-8">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <History className="h-8 w-8 text-primary" />
          Historique Clients
        </h1>
        <p className="text-muted-foreground mt-1">
          Consultez l'historique complet des transactions de vos clients
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Liste des clients */}
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle>Sélectionner un client</CardTitle>
            <Input
              placeholder="Rechercher..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </CardHeader>
          <CardContent className="max-h-[600px] overflow-y-auto">
            <div className="space-y-2">
              {filteredClients.map((client) => (
                <div
                  key={client.id}
                  className={`p-3 rounded-lg cursor-pointer transition-all ${
                    selectedClient?.id === client.id 
                      ? 'bg-primary text-primary-foreground' 
                      : 'bg-muted/50 hover:bg-muted'
                  }`}
                  onClick={() => loadClientHistory(client)}
                >
                  <div className="flex items-center gap-3">
                    <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                      selectedClient?.id === client.id ? 'bg-primary-foreground/20' : 'bg-primary/20'
                    }`}>
                      <User className={`h-5 w-5 ${
                        selectedClient?.id === client.id ? 'text-primary-foreground' : 'text-primary'
                      }`} />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{client.name}</p>
                      <p className={`text-sm ${
                        selectedClient?.id === client.id ? 'text-primary-foreground/70' : 'text-muted-foreground'
                      }`}>
                        {client.phone || 'Pas de téléphone'}
                      </p>
                    </div>
                    {client.type === 'vip' && (
                      <Badge variant={selectedClient?.id === client.id ? 'secondary' : 'default'}>
                        VIP
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Détails client et historique */}
        <div className="lg:col-span-2 space-y-6">
          {selectedClient ? (
            <>
              {/* Info client */}
              <Card className="shadow-md">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                      <div className="h-16 w-16 rounded-full bg-gradient-primary flex items-center justify-center">
                        <User className="h-8 w-8 text-white" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold">{selectedClient.name}</h2>
                        <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                          {selectedClient.phone && (
                            <span className="flex items-center gap-1">
                              <Phone className="h-4 w-4" />
                              {selectedClient.phone}
                            </span>
                          )}
                          {selectedClient.email && (
                            <span className="flex items-center gap-1">
                              <Mail className="h-4 w-4" />
                              {selectedClient.email}
                            </span>
                          )}
                        </div>
                        {selectedClient.address && (
                          <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            {selectedClient.address}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {selectedClient.phone && (
                        <WhatsAppButton 
                          phone={selectedClient.phone} 
                          message={`Bonjour ${selectedClient.name}, `}
                        />
                      )}
                      <Badge variant={selectedClient.type === 'vip' ? 'default' : 'secondary'}>
                        {selectedClient.type === 'vip' ? 'Client VIP' : 'Client Régulier'}
                      </Badge>
                    </div>
                  </div>

                  {/* Stats client */}
                  <div className="grid grid-cols-4 gap-4 mt-6">
                    <div className="p-3 rounded-lg bg-primary/10 text-center">
                      <p className="text-sm text-muted-foreground">Total achats</p>
                      <p className="text-lg font-bold text-primary">{stats.totalPurchases.toLocaleString()} FCFA</p>
                    </div>
                    <div className="p-3 rounded-lg bg-accent/10 text-center">
                      <p className="text-sm text-muted-foreground">Transactions</p>
                      <p className="text-lg font-bold text-accent">{stats.totalTransactions}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-success/10 text-center">
                      <p className="text-sm text-muted-foreground">Panier moyen</p>
                      <p className="text-lg font-bold text-success">{Math.round(stats.avgTransaction).toLocaleString()} FCFA</p>
                    </div>
                    <div className={`p-3 rounded-lg text-center ${
                      (selectedClient.balance || 0) > 0 ? 'bg-destructive/10' : 'bg-success/10'
                    }`}>
                      <p className="text-sm text-muted-foreground">Solde</p>
                      <p className={`text-lg font-bold ${
                        (selectedClient.balance || 0) > 0 ? 'text-destructive' : 'text-success'
                      }`}>
                        {(selectedClient.balance || 0).toLocaleString()} FCFA
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Historique transactions */}
              <Card className="shadow-md">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ShoppingCart className="h-5 w-5 text-primary" />
                    Historique des Transactions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {transactions.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">Aucune transaction enregistrée</p>
                  ) : (
                    <div className="space-y-3">
                      {transactions.map((trans) => (
                        <div
                          key={trans.id}
                          className="flex items-center justify-between p-4 rounded-lg bg-muted/50"
                        >
                          <div className="flex items-center gap-4">
                            <div className={`p-2 rounded-full ${
                              trans.type === 'credit' ? 'bg-destructive/20' : 'bg-success/20'
                            }`}>
                              {trans.type === 'credit' ? (
                                <CreditCard className="h-5 w-5 text-destructive" />
                              ) : (
                                <ShoppingCart className="h-5 w-5 text-success" />
                              )}
                            </div>
                            <div>
                              <p className="font-medium">{trans.description}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-sm text-muted-foreground">
                                  {format(new Date(trans.date), 'dd MMM yyyy HH:mm', { locale: fr })}
                                </span>
                                {trans.paymentMethod && (
                                  <Badge className={getPaymentMethodColor(trans.paymentMethod)}>
                                    {getPaymentMethodLabel(trans.paymentMethod)}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                          <p className={`text-lg font-bold ${
                            trans.type === 'credit' ? 'text-destructive' : 'text-success'
                          }`}>
                            {trans.type === 'credit' ? '-' : ''}{trans.amount.toLocaleString()} FCFA
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          ) : (
            <Card className="shadow-md">
              <CardContent className="p-12 text-center">
                <User className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h2 className="text-xl font-semibold mb-2">Sélectionnez un client</h2>
                <p className="text-muted-foreground">
                  Choisissez un client dans la liste pour voir son historique complet
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
