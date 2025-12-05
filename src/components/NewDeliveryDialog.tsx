import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, MapPin, Phone, User, Truck, Calendar } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Client {
  id: string;
  name: string;
  phone: string;
  address: string;
}

interface Sale {
  id: string;
  invoice_number: string;
  total: number;
  client_id: string;
}

interface Driver {
  id: string;
  name: string;
  phone: string;
  status: string;
}

interface NewDeliveryDialogProps {
  onDeliveryCreated: () => void;
}

export function NewDeliveryDialog({ onDeliveryCreated }: NewDeliveryDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  
  const [formData, setFormData] = useState({
    sale_id: '',
    client_id: '',
    driver_id: '',
    delivery_address: '',
    delivery_phone: '',
    scheduled_at: '',
    amount_to_collect: 0,
    delivery_notes: '',
  });

  useEffect(() => {
    if (open) {
      loadData();
    }
  }, [open]);

  async function loadData() {
    try {
      // Load clients
      const { data: clientsData } = await supabase
        .from('clients')
        .select('id, name, phone, address')
        .order('name');
      setClients(clientsData || []);

      // Load completed sales without delivery
      const { data: salesData } = await supabase
        .from('sales')
        .select('id, invoice_number, total, client_id')
        .eq('status', 'completed')
        .order('created_at', { ascending: false })
        .limit(50);
      setSales(salesData || []);

      // Load active drivers
      const { data: driversData } = await supabase
        .from('delivery_drivers')
        .select('id, name, phone, status')
        .eq('status', 'active')
        .order('name');
      setDrivers(driversData || []);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  }

  const handleSaleSelect = (saleId: string) => {
    const sale = sales.find(s => s.id === saleId);
    if (sale) {
      setFormData(prev => ({
        ...prev,
        sale_id: saleId,
        amount_to_collect: sale.total,
        client_id: sale.client_id || '',
      }));

      // Auto-fill client info
      if (sale.client_id) {
        const client = clients.find(c => c.id === sale.client_id);
        if (client) {
          setFormData(prev => ({
            ...prev,
            delivery_address: client.address || '',
            delivery_phone: client.phone || '',
          }));
        }
      }
    }
  };

  const handleClientSelect = (clientId: string) => {
    const client = clients.find(c => c.id === clientId);
    if (client) {
      setFormData(prev => ({
        ...prev,
        client_id: clientId,
        delivery_address: client.address || prev.delivery_address,
        delivery_phone: client.phone || prev.delivery_phone,
      }));
    }
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    if (!formData.sale_id || !formData.delivery_address) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('deliveries')
        .insert({
          sale_id: formData.sale_id,
          client_id: formData.client_id || null,
          driver_id: formData.driver_id || null,
          delivery_address: formData.delivery_address,
          delivery_phone: formData.delivery_phone || null,
          scheduled_at: formData.scheduled_at || new Date().toISOString(),
          amount_to_collect: formData.amount_to_collect,
          delivery_notes: formData.delivery_notes || null,
          status: formData.driver_id ? 'assigned' : 'pending',
          created_by: user?.id,
        });

      if (error) throw error;

      toast.success('Livraison créée avec succès');
      setOpen(false);
      setFormData({
        sale_id: '',
        client_id: '',
        driver_id: '',
        delivery_address: '',
        delivery_phone: '',
        scheduled_at: '',
        amount_to_collect: 0,
        delivery_notes: '',
      });
      onDeliveryCreated();
    } catch (error: any) {
      console.error('Error creating delivery:', error);
      toast.error(error.message || 'Erreur lors de la création');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-gradient-primary">
          <Plus className="h-4 w-4 mr-2" />
          Nouvelle Livraison
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5" />
            Nouvelle Livraison
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Vente associée */}
          <div className="space-y-2">
            <Label htmlFor="sale">Vente associée *</Label>
            <Select value={formData.sale_id} onValueChange={handleSaleSelect}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner une vente" />
              </SelectTrigger>
              <SelectContent>
                {sales.map(sale => (
                  <SelectItem key={sale.id} value={sale.id}>
                    {sale.invoice_number} - {sale.total.toLocaleString()} FCFA
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Client */}
          <div className="space-y-2">
            <Label htmlFor="client">Client</Label>
            <Select value={formData.client_id} onValueChange={handleClientSelect}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un client" />
              </SelectTrigger>
              <SelectContent>
                {clients.map(client => (
                  <SelectItem key={client.id} value={client.id}>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      {client.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Adresse et téléphone */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="address">Adresse de livraison *</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="address"
                  value={formData.delivery_address}
                  onChange={(e) => setFormData(prev => ({ ...prev, delivery_address: e.target.value }))}
                  placeholder="Ex: Quartier Bè, Lomé"
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Téléphone</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="phone"
                  value={formData.delivery_phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, delivery_phone: e.target.value }))}
                  placeholder="+228 90 XX XX XX"
                  className="pl-10"
                />
              </div>
            </div>
          </div>

          {/* Livreur */}
          <div className="space-y-2">
            <Label htmlFor="driver">Livreur</Label>
            <Select value={formData.driver_id} onValueChange={(v) => setFormData(prev => ({ ...prev, driver_id: v }))}>
              <SelectTrigger>
                <SelectValue placeholder="Assigner un livreur (optionnel)" />
              </SelectTrigger>
              <SelectContent>
                {drivers.map(driver => (
                  <SelectItem key={driver.id} value={driver.id}>
                    <div className="flex items-center gap-2">
                      <Truck className="h-4 w-4" />
                      {driver.name} - {driver.phone}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Date et montant */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="scheduled">Date de livraison</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="scheduled"
                  type="datetime-local"
                  value={formData.scheduled_at}
                  onChange={(e) => setFormData(prev => ({ ...prev, scheduled_at: e.target.value }))}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Montant à collecter (FCFA)</Label>
              <Input
                id="amount"
                type="number"
                value={formData.amount_to_collect}
                onChange={(e) => setFormData(prev => ({ ...prev, amount_to_collect: parseFloat(e.target.value) || 0 }))}
                placeholder="0"
              />
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes de livraison</Label>
            <Textarea
              id="notes"
              value={formData.delivery_notes}
              onChange={(e) => setFormData(prev => ({ ...prev, delivery_notes: e.target.value }))}
              placeholder="Instructions spéciales pour le livreur..."
              rows={3}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={loading} className="bg-gradient-primary">
              {loading ? 'Création...' : 'Créer la livraison'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
