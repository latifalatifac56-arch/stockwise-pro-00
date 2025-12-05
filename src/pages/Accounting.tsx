import { useEffect, useState } from 'react';
import { Wallet, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export default function Accounting() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAccountingData();
  }, []);

  async function loadAccountingData() {
    try {
      // Load accounting data
      setLoading(false);
    } catch (error) {
      console.error('Error loading accounting data:', error);
      toast.error('Erreur lors du chargement des données comptables');
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
        <h1 className="text-3xl font-bold">Comptabilité Professionnelle</h1>
        <p className="text-muted-foreground mt-1">
          Gérez votre trésorerie et vos états financiers
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-4">
        <Card className="bg-gradient-card shadow-md">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Caisse Cash</p>
                <p className="text-3xl font-bold mt-2">0 FCFA</p>
              </div>
              <Wallet className="h-12 w-12 text-primary opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card shadow-md">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Mobile Money</p>
                <p className="text-3xl font-bold mt-2">0 FCFA</p>
              </div>
              <DollarSign className="h-12 w-12 text-success opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card shadow-md">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Entrées</p>
                <p className="text-3xl font-bold mt-2 text-success">0 FCFA</p>
              </div>
              <TrendingUp className="h-12 w-12 text-success opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card shadow-md">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Sorties</p>
                <p className="text-3xl font-bold mt-2 text-destructive">0 FCFA</p>
              </div>
              <TrendingDown className="h-12 w-12 text-destructive opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle>Livre de caisse</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12 text-muted-foreground">
              <Wallet className="h-16 w-16 mx-auto mb-4 opacity-20" />
              <p>Aucune transaction pour aujourd'hui</p>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-md">
          <CardHeader>
            <CardTitle>États financiers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12 text-muted-foreground">
              <TrendingUp className="h-16 w-16 mx-auto mb-4 opacity-20" />
              <p>Rapports mensuels disponibles ici</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
