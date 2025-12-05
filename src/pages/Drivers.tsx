import { useEffect, useState } from 'react';
import { Truck, Plus, Phone, Star, Package, Edit, Trash2, MessageCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Driver {
  id: string;
  name: string;
  phone: string;
  vehicle_type: string;
  vehicle_number: string;
  commission_rate: number;
  status: string;
  total_deliveries: number;
  successful_deliveries: number;
}

export default function Drivers() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingDriver, setEditingDriver] = useState<Driver | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    vehicle_type: 'moto',
    vehicle_number: '',
    commission_rate: 10,
  });

  useEffect(() => {
    loadDrivers();
  }, []);

  async function loadDrivers() {
    try {
      const { data, error } = await supabase
        .from('delivery_drivers')
        .select('*')
        .order('name');

      if (error) throw error;
      setDrivers(data || []);
    } catch (error) {
      console.error('Error loading drivers:', error);
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  }

  const openDialog = (driver?: Driver) => {
    if (driver) {
      setEditingDriver(driver);
      setFormData({
        name: driver.name,
        phone: driver.phone,
        vehicle_type: driver.vehicle_type || 'moto',
        vehicle_number: driver.vehicle_number || '',
        commission_rate: driver.commission_rate || 10,
      });
    } else {
      setEditingDriver(null);
      setFormData({
        name: '',
        phone: '',
        vehicle_type: 'moto',
        vehicle_number: '',
        commission_rate: 10,
      });
    }
    setDialogOpen(true);
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    if (!formData.name || !formData.phone) {
      toast.error('Veuillez remplir les champs obligatoires');
      return;
    }

    try {
      if (editingDriver) {
        const { error } = await supabase
          .from('delivery_drivers')
          .update(formData)
          .eq('id', editingDriver.id);

        if (error) throw error;
        toast.success('Livreur mis à jour');
      } else {
        const { error } = await supabase
          .from('delivery_drivers')
          .insert(formData);

        if (error) throw error;
        toast.success('Livreur ajouté');
      }

      setDialogOpen(false);
      loadDrivers();
    } catch (error: any) {
      console.error('Error saving driver:', error);
      toast.error(error.message || 'Erreur lors de la sauvegarde');
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce livreur?')) return;

    try {
      const { error } = await supabase
        .from('delivery_drivers')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Livreur supprimé');
      loadDrivers();
    } catch (error: any) {
      console.error('Error deleting driver:', error);
      toast.error(error.message || 'Erreur lors de la suppression');
    }
  }

  async function toggleStatus(driver: Driver) {
    try {
      const newStatus = driver.status === 'active' ? 'inactive' : 'active';
      const { error } = await supabase
        .from('delivery_drivers')
        .update({ status: newStatus })
        .eq('id', driver.id);

      if (error) throw error;
      toast.success(`Livreur ${newStatus === 'active' ? 'activé' : 'désactivé'}`);
      loadDrivers();
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Erreur lors de la mise à jour');
    }
  }

  const openWhatsApp = (phone: string) => {
    window.open(`https://wa.me/${phone.replace(/\s/g, '')}`, '_blank');
  };

  const getSuccessRate = (driver: Driver) => {
    if (!driver.total_deliveries) return 0;
    return Math.round((driver.successful_deliveries / driver.total_deliveries) * 100);
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
          <h1 className="text-3xl font-bold">Gestion des Livreurs</h1>
          <p className="text-muted-foreground mt-1">
            Gérez votre équipe de livraison
          </p>
        </div>
        <Button onClick={() => openDialog()} className="bg-gradient-primary">
          <Plus className="h-4 w-4 mr-2" />
          Nouveau Livreur
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="bg-gradient-card shadow-md">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Livreurs</p>
                <p className="text-3xl font-bold mt-2">{drivers.length}</p>
              </div>
              <Truck className="h-12 w-12 text-primary opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card shadow-md">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Actifs</p>
                <p className="text-3xl font-bold mt-2 text-success">
                  {drivers.filter(d => d.status === 'active').length}
                </p>
              </div>
              <Star className="h-12 w-12 text-success opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card shadow-md">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Livraisons Totales</p>
                <p className="text-3xl font-bold mt-2">
                  {drivers.reduce((sum, d) => sum + (d.total_deliveries || 0), 0)}
                </p>
              </div>
              <Package className="h-12 w-12 text-primary opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Drivers List */}
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle>Liste des Livreurs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {drivers.length === 0 ? (
              <div className="col-span-full text-center py-12 text-muted-foreground">
                <Truck className="h-16 w-16 mx-auto mb-4 opacity-20" />
                <p>Aucun livreur enregistré</p>
              </div>
            ) : (
              drivers.map((driver) => (
                <Card key={driver.id} className="border hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-lg">{driver.name}</h3>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Phone className="h-3 w-3" />
                          {driver.phone}
                        </div>
                      </div>
                      <Badge variant={driver.status === 'active' ? 'default' : 'secondary'}>
                        {driver.status === 'active' ? 'Actif' : 'Inactif'}
                      </Badge>
                    </div>

                    <div className="space-y-2 text-sm mb-4">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Véhicule:</span>
                        <span className="font-medium capitalize">
                          {driver.vehicle_type || 'Non spécifié'} {driver.vehicle_number && `- ${driver.vehicle_number}`}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Commission:</span>
                        <span className="font-medium">{driver.commission_rate || 10}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Livraisons:</span>
                        <span className="font-medium">
                          {driver.successful_deliveries || 0}/{driver.total_deliveries || 0}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Taux de succès:</span>
                        <span className={`font-medium ${getSuccessRate(driver) >= 90 ? 'text-success' : getSuccessRate(driver) >= 70 ? 'text-warning' : 'text-destructive'}`}>
                          {getSuccessRate(driver)}%
                        </span>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openWhatsApp(driver.phone)}
                        className="flex-1 text-green-600"
                      >
                        <MessageCircle className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openDialog(driver)}
                        className="flex-1"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant={driver.status === 'active' ? 'secondary' : 'default'}
                        size="sm"
                        onClick={() => toggleStatus(driver)}
                        className="flex-1"
                      >
                        {driver.status === 'active' ? 'Désactiver' : 'Activer'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingDriver ? 'Modifier le livreur' : 'Nouveau livreur'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nom complet *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Ex: Kofi Mensah"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Téléphone *</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="+228 90 XX XX XX"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="vehicle_type">Type de véhicule</Label>
                <Select 
                  value={formData.vehicle_type} 
                  onValueChange={(v) => setFormData(prev => ({ ...prev, vehicle_type: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="moto">Moto</SelectItem>
                    <SelectItem value="tricycle">Tricycle</SelectItem>
                    <SelectItem value="voiture">Voiture</SelectItem>
                    <SelectItem value="camionnette">Camionnette</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="vehicle_number">Immatriculation</Label>
                <Input
                  id="vehicle_number"
                  value={formData.vehicle_number}
                  onChange={(e) => setFormData(prev => ({ ...prev, vehicle_number: e.target.value }))}
                  placeholder="TG XXX YY"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="commission">Taux de commission (%)</Label>
              <Input
                id="commission"
                type="number"
                min="0"
                max="100"
                value={formData.commission_rate}
                onChange={(e) => setFormData(prev => ({ ...prev, commission_rate: parseFloat(e.target.value) || 0 }))}
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Annuler
              </Button>
              <Button type="submit" className="bg-gradient-primary">
                {editingDriver ? 'Mettre à jour' : 'Ajouter'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
