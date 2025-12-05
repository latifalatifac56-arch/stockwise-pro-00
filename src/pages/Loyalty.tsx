import { useEffect, useState } from 'react';
import { Gift, Star, TrendingUp, Award, History, Plus, Minus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface LoyaltyClient {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  type: string | null;
  balance: number | null;
  loyaltyPoints?: number;
  totalPurchases?: number;
}

export default function Loyalty() {
  const [clients, setClients] = useState<LoyaltyClient[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClient, setSelectedClient] = useState<LoyaltyClient | null>(null);
  const [pointsToAdd, setPointsToAdd] = useState(0);
  const [isRedeemOpen, setIsRedeemOpen] = useState(false);
  const [redeemAmount, setRedeemAmount] = useState(0);

  // Configuration fidélité (1 point = 100 FCFA d'achat, 100 points = 1000 FCFA de réduction)
  const POINTS_PER_FCFA = 100; // 1 point pour chaque 100 FCFA
  const FCFA_PER_POINT = 10; // 1 point = 10 FCFA de réduction

  useEffect(() => {
    loadClients();
  }, []);

  async function loadClients() {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .order('name');

    if (error) {
      toast.error('Erreur de chargement des clients');
      return;
    }

    // Charger les ventes pour calculer les points
    const { data: sales } = await supabase
      .from('sales')
      .select('client_id, total')
      .eq('status', 'completed');

    const clientsWithPoints = (data || []).map(client => {
      const clientSales = sales?.filter(s => s.client_id === client.id) || [];
      const totalPurchases = clientSales.reduce((sum, s) => sum + s.total, 0);
      const loyaltyPoints = Math.floor(totalPurchases / POINTS_PER_FCFA);
      
      return {
        ...client,
        totalPurchases,
        loyaltyPoints
      };
    });

    setClients(clientsWithPoints);
  }

  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.phone?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getTierInfo = (points: number) => {
    if (points >= 5000) return { tier: 'Platine', color: 'bg-gradient-to-r from-gray-400 to-gray-600', icon: '💎' };
    if (points >= 2000) return { tier: 'Or', color: 'bg-gradient-to-r from-yellow-400 to-yellow-600', icon: '🥇' };
    if (points >= 500) return { tier: 'Argent', color: 'bg-gradient-to-r from-gray-300 to-gray-500', icon: '🥈' };
    return { tier: 'Bronze', color: 'bg-gradient-to-r from-orange-400 to-orange-600', icon: '🥉' };
  };

  const handleRedeemPoints = async () => {
    if (!selectedClient || redeemAmount <= 0) return;
    
    const maxRedeem = selectedClient.loyaltyPoints || 0;
    if (redeemAmount > maxRedeem) {
      toast.error(`Points insuffisants. Maximum: ${maxRedeem}`);
      return;
    }

    const reductionValue = redeemAmount * FCFA_PER_POINT;
    toast.success(`${redeemAmount} points échangés = ${reductionValue.toLocaleString()} FCFA de réduction`);
    setIsRedeemOpen(false);
    setRedeemAmount(0);
  };

  const totalPoints = clients.reduce((sum, c) => sum + (c.loyaltyPoints || 0), 0);
  const platineCount = clients.filter(c => (c.loyaltyPoints || 0) >= 5000).length;
  const orCount = clients.filter(c => (c.loyaltyPoints || 0) >= 2000 && (c.loyaltyPoints || 0) < 5000).length;

  return (
    <div className="flex-1 space-y-6 p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Gift className="h-8 w-8 text-primary" />
            Programme de Fidélité
          </h1>
          <p className="text-muted-foreground mt-1">
            Gérez les points et récompenses de vos clients fidèles
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="bg-gradient-card shadow-md">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Points</p>
                <p className="text-2xl font-bold mt-1">{totalPoints.toLocaleString()}</p>
              </div>
              <Star className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card shadow-md">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Clients Platine</p>
                <p className="text-2xl font-bold mt-1">{platineCount}</p>
              </div>
              <span className="text-3xl">💎</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card shadow-md">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Clients Or</p>
                <p className="text-2xl font-bold mt-1">{orCount}</p>
              </div>
              <span className="text-3xl">🥇</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card shadow-md">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Valeur Points</p>
                <p className="text-2xl font-bold mt-1">{(totalPoints * FCFA_PER_POINT).toLocaleString()} FCFA</p>
              </div>
              <TrendingUp className="h-8 w-8 text-success" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tiers Explanation */}
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5 text-primary" />
            Niveaux de Fidélité
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4">
            <div className="p-4 rounded-lg bg-gradient-to-r from-orange-400/20 to-orange-600/20 border border-orange-500/30 text-center">
              <span className="text-2xl">🥉</span>
              <p className="font-semibold mt-2">Bronze</p>
              <p className="text-sm text-muted-foreground">0 - 499 pts</p>
            </div>
            <div className="p-4 rounded-lg bg-gradient-to-r from-gray-300/20 to-gray-500/20 border border-gray-400/30 text-center">
              <span className="text-2xl">🥈</span>
              <p className="font-semibold mt-2">Argent</p>
              <p className="text-sm text-muted-foreground">500 - 1999 pts</p>
            </div>
            <div className="p-4 rounded-lg bg-gradient-to-r from-yellow-400/20 to-yellow-600/20 border border-yellow-500/30 text-center">
              <span className="text-2xl">🥇</span>
              <p className="font-semibold mt-2">Or</p>
              <p className="text-sm text-muted-foreground">2000 - 4999 pts</p>
            </div>
            <div className="p-4 rounded-lg bg-gradient-to-r from-gray-400/20 to-gray-600/20 border border-gray-500/30 text-center">
              <span className="text-2xl">💎</span>
              <p className="font-semibold mt-2">Platine</p>
              <p className="text-sm text-muted-foreground">5000+ pts</p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground mt-4 text-center">
            1 point = {POINTS_PER_FCFA} FCFA d'achat | 1 point = {FCFA_PER_POINT} FCFA de réduction
          </p>
        </CardContent>
      </Card>

      {/* Clients List */}
      <Card className="shadow-md">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Clients Fidèles</CardTitle>
            <Input
              placeholder="Rechercher..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-64"
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {filteredClients.map((client) => {
              const tierInfo = getTierInfo(client.loyaltyPoints || 0);
              return (
                <div
                  key={client.id}
                  className="flex items-center justify-between p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className={`h-12 w-12 rounded-full ${tierInfo.color} flex items-center justify-center text-white text-xl`}>
                      {tierInfo.icon}
                    </div>
                    <div>
                      <p className="font-semibold">{client.name}</p>
                      <p className="text-sm text-muted-foreground">{client.phone || 'Pas de téléphone'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Total achats</p>
                      <p className="font-semibold">{(client.totalPurchases || 0).toLocaleString()} FCFA</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Points</p>
                      <p className="font-bold text-primary text-lg">{(client.loyaltyPoints || 0).toLocaleString()}</p>
                    </div>
                    <Badge className={tierInfo.color + ' text-white'}>
                      {tierInfo.tier}
                    </Badge>
                    <Dialog open={isRedeemOpen && selectedClient?.id === client.id} onOpenChange={(open) => {
                      setIsRedeemOpen(open);
                      if (open) setSelectedClient(client);
                    }}>
                      <DialogTrigger asChild>
                        <Button size="sm" variant="outline" onClick={() => setSelectedClient(client)}>
                          <Gift className="h-4 w-4 mr-1" />
                          Échanger
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Échanger les Points - {client.name}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="p-4 rounded-lg bg-primary/10 text-center">
                            <p className="text-sm text-muted-foreground">Points disponibles</p>
                            <p className="text-3xl font-bold text-primary">{(client.loyaltyPoints || 0).toLocaleString()}</p>
                            <p className="text-sm text-muted-foreground">= {((client.loyaltyPoints || 0) * FCFA_PER_POINT).toLocaleString()} FCFA</p>
                          </div>
                          <div className="space-y-2">
                            <Label>Points à échanger</Label>
                            <Input
                              type="number"
                              min="0"
                              max={client.loyaltyPoints || 0}
                              value={redeemAmount}
                              onChange={(e) => setRedeemAmount(parseInt(e.target.value) || 0)}
                            />
                            <p className="text-sm text-muted-foreground">
                              Valeur: {(redeemAmount * FCFA_PER_POINT).toLocaleString()} FCFA
                            </p>
                          </div>
                          <Button onClick={handleRedeemPoints} className="w-full bg-gradient-primary">
                            Confirmer l'échange
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
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
