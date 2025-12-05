import { useEffect, useState } from 'react';
import { Package, ArrowUpDown, AlertTriangle, History } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export default function AdvancedStock() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStockData();
  }, []);

  async function loadStockData() {
    try {
      // Load stock data
      setLoading(false);
    } catch (error) {
      console.error('Error loading stock data:', error);
      toast.error('Erreur lors du chargement du stock');
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p>Chargement...</p>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-6 p-8">
      <div>
        <h1 className="text-3xl font-bold">Gestion Stock Avancée</h1>
        <p className="text-muted-foreground mt-1">
          Mouvements, ajustements et réservations de stock
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-4">
        <Card className="bg-gradient-card shadow-md">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Stock Total</p>
                <p className="text-3xl font-bold mt-2">0</p>
              </div>
              <Package className="h-12 w-12 text-primary opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card shadow-md">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Stock Réservé</p>
                <p className="text-3xl font-bold mt-2 text-warning">0</p>
              </div>
              <AlertTriangle className="h-12 w-12 text-warning opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card shadow-md">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Mouvements</p>
                <p className="text-3xl font-bold mt-2">0</p>
              </div>
              <ArrowUpDown className="h-12 w-12 text-primary opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card shadow-md">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Ajustements</p>
                <p className="text-3xl font-bold mt-2">0</p>
              </div>
              <History className="h-12 w-12 text-primary opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-md">
        <CardHeader>
          <CardTitle>Gestion détaillée</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="movements" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="movements">Mouvements</TabsTrigger>
              <TabsTrigger value="adjustments">Ajustements</TabsTrigger>
              <TabsTrigger value="reservations">Réservations</TabsTrigger>
            </TabsList>
            
            <TabsContent value="movements" className="mt-6">
              <div className="text-center py-12 text-muted-foreground">
                <ArrowUpDown className="h-16 w-16 mx-auto mb-4 opacity-20" />
                <p>Aucun mouvement de stock</p>
              </div>
            </TabsContent>
            
            <TabsContent value="adjustments" className="mt-6">
              <div className="text-center py-12 text-muted-foreground">
                <History className="h-16 w-16 mx-auto mb-4 opacity-20" />
                <p>Aucun ajustement de stock</p>
              </div>
            </TabsContent>
            
            <TabsContent value="reservations" className="mt-6">
              <div className="text-center py-12 text-muted-foreground">
                <AlertTriangle className="h-16 w-16 mx-auto mb-4 opacity-20" />
                <p>Aucune réservation de stock</p>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
