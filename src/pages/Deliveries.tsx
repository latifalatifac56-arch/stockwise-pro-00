import { useEffect, useState } from 'react';
import { Truck, Package, CheckCircle, XCircle, Clock, Plus, Phone, MapPin, MessageCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { NewDeliveryDialog } from '@/components/NewDeliveryDialog';

interface Delivery {
  id: string;
  sale_id: string;
  delivery_address: string;
  delivery_phone?: string;
  status: string;
  scheduled_at: string;
  driver_id?: string;
  amount_to_collect?: number;
  delivery_notes?: string;
  driver?: {
    name: string;
    phone: string;
  };
  client?: {
    name: string;
  };
}

export default function Deliveries() {
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDeliveries();
  }, []);

  async function loadDeliveries() {
    try {
      const { data, error } = await supabase
        .from('deliveries')
        .select(`
          *,
          driver:delivery_drivers(name, phone),
          client:clients(name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDeliveries(data || []);
    } catch (error) {
      console.error('Error loading deliveries:', error);
      toast.error('Erreur lors du chargement des livraisons');
    } finally {
      setLoading(false);
    }
  }

  const openWhatsApp = (phone: string, address: string) => {
    const message = encodeURIComponent(`Bonjour! Votre commande sera livrée à: ${address}. Merci de votre confiance!`);
    window.open(`https://wa.me/${phone.replace(/\s/g, '')}?text=${message}`, '_blank');
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: any }> = {
      pending: { label: 'En attente', variant: 'secondary' },
      assigned: { label: 'Assignée', variant: 'default' },
      in_transit: { label: 'En transit', variant: 'default' },
      delivered: { label: 'Livrée', variant: 'default' },
      failed: { label: 'Échouée', variant: 'destructive' },
      cancelled: { label: 'Annulée', variant: 'outline' },
    };
    return statusMap[status] || { label: status, variant: 'outline' };
  };

  const stats = {
    total: deliveries.length,
    pending: deliveries.filter(d => d.status === 'pending').length,
    inTransit: deliveries.filter(d => d.status === 'in_transit').length,
    delivered: deliveries.filter(d => d.status === 'delivered').length,
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p>Chargement...</p>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-6 p-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Gestion des Livraisons</h1>
          <p className="text-muted-foreground mt-1">
            Gérez vos livraisons et suivez vos livreurs en temps réel
          </p>
        </div>
        <NewDeliveryDialog onDeliveryCreated={loadDeliveries} />
      </div>

      <div className="grid gap-6 md:grid-cols-4">
        <Card className="bg-gradient-card shadow-md">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total</p>
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
                <p className="text-sm text-muted-foreground">En attente</p>
                <p className="text-3xl font-bold mt-2 text-warning">{stats.pending}</p>
              </div>
              <Clock className="h-12 w-12 text-warning opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card shadow-md">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">En transit</p>
                <p className="text-3xl font-bold mt-2 text-primary">{stats.inTransit}</p>
              </div>
              <Truck className="h-12 w-12 text-primary opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card shadow-md">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Livrées</p>
                <p className="text-3xl font-bold mt-2 text-success">{stats.delivered}</p>
              </div>
              <CheckCircle className="h-12 w-12 text-success opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-md">
        <CardHeader>
          <CardTitle>Liste des livraisons</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {deliveries.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Truck className="h-16 w-16 mx-auto mb-4 opacity-20" />
                <p>Aucune livraison pour le moment</p>
              </div>
            ) : (
              deliveries.map((delivery) => {
                const statusInfo = getStatusBadge(delivery.status);
                return (
                  <div
                    key={delivery.id}
                    className="p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <Badge variant={statusInfo.variant}>
                            {statusInfo.label}
                          </Badge>
                          {delivery.amount_to_collect && (
                            <span className="text-sm font-semibold text-primary">
                              {delivery.amount_to_collect.toLocaleString()} FCFA
                            </span>
                          )}
                          {delivery.client?.name && (
                            <span className="text-sm text-muted-foreground">
                              • {delivery.client.name}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mb-1">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <p className="font-medium">{delivery.delivery_address}</p>
                        </div>
                        {delivery.delivery_phone && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Phone className="h-3 w-3" />
                            <span>{delivery.delivery_phone}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                          <span>
                            Programmée: {delivery.scheduled_at ? new Date(delivery.scheduled_at).toLocaleDateString('fr-FR', {
                              day: 'numeric',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit'
                            }) : 'Non programmée'}
                          </span>
                          {delivery.driver?.name && (
                            <span className="flex items-center gap-1">
                              <Truck className="h-3 w-3" />
                              {delivery.driver.name}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {delivery.delivery_phone && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => openWhatsApp(delivery.delivery_phone!, delivery.delivery_address)}
                            className="text-green-600 hover:text-green-700"
                          >
                            <MessageCircle className="h-4 w-4" />
                          </Button>
                        )}
                        <Button variant="outline" size="sm">
                          Détails
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
