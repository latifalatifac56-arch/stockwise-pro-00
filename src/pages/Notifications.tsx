import { useEffect, useState } from 'react';
import { Bell, AlertTriangle, Package, Users, Truck, CreditCard, Check, X, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

interface Notification {
  id: string;
  type: 'stock' | 'credit' | 'delivery' | 'client' | 'system';
  title: string;
  message: string;
  priority: 'high' | 'medium' | 'low';
  read: boolean;
  createdAt: Date;
  link?: string;
}

export default function Notifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filter, setFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNotifications();
  }, []);

  async function loadNotifications() {
    setLoading(true);
    const notifs: Notification[] = [];

    // 1. Alertes stock bas
    const { data: articles } = await supabase
      .from('articles')
      .select('id, name, stock, min_stock, sku')
      .eq('status', 'active');

    articles?.forEach(article => {
      if (article.stock <= article.min_stock) {
        const isUrgent = article.stock === 0;
        notifs.push({
          id: `stock-${article.id}`,
          type: 'stock',
          title: isUrgent ? 'Rupture de stock!' : 'Stock faible',
          message: `${article.name} (SKU: ${article.sku}) - ${article.stock} restant(s), minimum: ${article.min_stock}`,
          priority: isUrgent ? 'high' : 'medium',
          read: false,
          createdAt: new Date(),
          link: '/articles'
        });
      }
    });

    // 2. Clients avec solde négatif (dettes)
    const { data: clients } = await supabase
      .from('clients')
      .select('id, name, balance, phone')
      .gt('balance', 0);

    clients?.forEach(client => {
      const isUrgent = (client.balance || 0) > 100000;
      notifs.push({
        id: `credit-${client.id}`,
        type: 'credit',
        title: 'Crédit client en attente',
        message: `${client.name} doit ${(client.balance || 0).toLocaleString()} FCFA`,
        priority: isUrgent ? 'high' : 'medium',
        read: false,
        createdAt: new Date(),
        link: '/clients'
      });
    });

    // 3. Livraisons en attente
    const { data: deliveries } = await supabase
      .from('deliveries')
      .select('id, delivery_address, status, scheduled_at')
      .in('status', ['pending', 'assigned']);

    deliveries?.forEach(delivery => {
      const isLate = delivery.scheduled_at && new Date(delivery.scheduled_at) < new Date();
      notifs.push({
        id: `delivery-${delivery.id}`,
        type: 'delivery',
        title: isLate ? 'Livraison en retard!' : 'Livraison en attente',
        message: `Livraison vers ${delivery.delivery_address} - Statut: ${delivery.status}`,
        priority: isLate ? 'high' : 'low',
        read: false,
        createdAt: delivery.scheduled_at ? new Date(delivery.scheduled_at) : new Date(),
        link: '/deliveries'
      });
    });

    // 4. Commandes en crédit non payées
    const { data: creditSales } = await supabase
      .from('sales')
      .select('id, invoice_number, total, created_at, client_id')
      .eq('payment_method', 'credit')
      .eq('status', 'completed');

    creditSales?.forEach(sale => {
      notifs.push({
        id: `sale-credit-${sale.id}`,
        type: 'credit',
        title: 'Vente à crédit',
        message: `Facture #${sale.invoice_number} - ${sale.total.toLocaleString()} FCFA à récupérer`,
        priority: 'medium',
        read: false,
        createdAt: new Date(sale.created_at!),
        link: '/sales'
      });
    });

    // Trier par priorité puis par date
    notifs.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      }
      return b.createdAt.getTime() - a.createdAt.getTime();
    });

    setNotifications(notifs);
    setLoading(false);
  }

  const getIcon = (type: string) => {
    switch (type) {
      case 'stock': return <Package className="h-5 w-5" />;
      case 'credit': return <CreditCard className="h-5 w-5" />;
      case 'delivery': return <Truck className="h-5 w-5" />;
      case 'client': return <Users className="h-5 w-5" />;
      default: return <Bell className="h-5 w-5" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'stock': return 'bg-orange-500';
      case 'credit': return 'bg-blue-500';
      case 'delivery': return 'bg-purple-500';
      case 'client': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high': return <Badge variant="destructive">Urgent</Badge>;
      case 'medium': return <Badge variant="secondary" className="bg-warning/20 text-warning">Moyen</Badge>;
      default: return <Badge variant="outline">Info</Badge>;
    }
  };

  const filteredNotifications = filter === 'all' 
    ? notifications 
    : notifications.filter(n => n.type === filter);

  const highPriorityCount = notifications.filter(n => n.priority === 'high').length;
  const stockAlerts = notifications.filter(n => n.type === 'stock').length;
  const creditAlerts = notifications.filter(n => n.type === 'credit').length;
  const deliveryAlerts = notifications.filter(n => n.type === 'delivery').length;

  return (
    <div className="flex-1 space-y-6 p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Bell className="h-8 w-8 text-primary" />
            Centre de Notifications
            {highPriorityCount > 0 && (
              <Badge variant="destructive" className="animate-pulse">
                {highPriorityCount} urgentes
              </Badge>
            )}
          </h1>
          <p className="text-muted-foreground mt-1">
            Toutes vos alertes et notifications en un seul endroit
          </p>
        </div>
        <Button onClick={loadNotifications} variant="outline">
          Actualiser
        </Button>
      </div>

      {/* Stats rapides */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card 
          className={`shadow-md cursor-pointer transition-all ${filter === 'all' ? 'ring-2 ring-primary' : ''}`}
          onClick={() => setFilter('all')}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">{notifications.length}</p>
              </div>
              <Bell className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card 
          className={`shadow-md cursor-pointer transition-all ${filter === 'stock' ? 'ring-2 ring-orange-500' : ''}`}
          onClick={() => setFilter('stock')}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Stock</p>
                <p className="text-2xl font-bold text-orange-500">{stockAlerts}</p>
              </div>
              <Package className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card 
          className={`shadow-md cursor-pointer transition-all ${filter === 'credit' ? 'ring-2 ring-blue-500' : ''}`}
          onClick={() => setFilter('credit')}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Crédits</p>
                <p className="text-2xl font-bold text-blue-500">{creditAlerts}</p>
              </div>
              <CreditCard className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card 
          className={`shadow-md cursor-pointer transition-all ${filter === 'delivery' ? 'ring-2 ring-purple-500' : ''}`}
          onClick={() => setFilter('delivery')}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Livraisons</p>
                <p className="text-2xl font-bold text-purple-500">{deliveryAlerts}</p>
              </div>
              <Truck className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Liste des notifications */}
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Notifications {filter !== 'all' && `(${filter})`}</span>
            {filter !== 'all' && (
              <Button variant="ghost" size="sm" onClick={() => setFilter('all')}>
                Voir tout
              </Button>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <Clock className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
              <p className="text-muted-foreground mt-2">Chargement...</p>
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="text-center py-8">
              <Check className="h-16 w-16 text-success mx-auto mb-4" />
              <p className="text-xl font-semibold">Tout est en ordre!</p>
              <p className="text-muted-foreground">Aucune notification pour le moment</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredNotifications.map((notif) => (
                <div
                  key={notif.id}
                  className={`flex items-start gap-4 p-4 rounded-lg transition-colors cursor-pointer hover:bg-muted ${
                    notif.priority === 'high' ? 'bg-destructive/5 border border-destructive/20' : 'bg-muted/50'
                  }`}
                  onClick={() => notif.link && (window.location.href = notif.link)}
                >
                  <div className={`p-2 rounded-full text-white ${getTypeColor(notif.type)}`}>
                    {getIcon(notif.type)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold">{notif.title}</h4>
                      {getPriorityBadge(notif.priority)}
                    </div>
                    <p className="text-sm text-muted-foreground">{notif.message}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDistanceToNow(notif.createdAt, { addSuffix: true, locale: fr })}
                    </p>
                  </div>
                  {notif.priority === 'high' && (
                    <AlertTriangle className="h-5 w-5 text-destructive animate-pulse" />
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
