import { useEffect, useState } from 'react';
import { Wallet, ArrowUpCircle, ArrowDownCircle, Clock, CheckCircle, Calculator, Smartphone } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface CashRegisterData {
  id: string;
  date: string;
  opening_balance: number;
  closing_balance: number | null;
  cash_in: number | null;
  cash_out: number | null;
  tmoney_in: number | null;
  flooz_in: number | null;
  card_in: number | null;
  opened_at: string | null;
  closed_at: string | null;
  notes: string | null;
}

export default function CashRegister() {
  const [todayRegister, setTodayRegister] = useState<CashRegisterData | null>(null);
  const [isOpenDialogOpen, setIsOpenDialogOpen] = useState(false);
  const [isCloseDialogOpen, setIsCloseDialogOpen] = useState(false);
  const [openingBalance, setOpeningBalance] = useState(0);
  const [closingNotes, setClosingNotes] = useState('');
  const [countedCash, setCountedCash] = useState(0);
  const [history, setHistory] = useState<CashRegisterData[]>([]);

  useEffect(() => {
    loadTodayRegister();
    loadHistory();
  }, []);

  async function loadTodayRegister() {
    const today = format(new Date(), 'yyyy-MM-dd');
    
    const { data, error } = await supabase
      .from('cash_register')
      .select('*')
      .eq('date', today)
      .single();

    if (data) {
      setTodayRegister(data);
    }
  }

  async function loadHistory() {
    const { data } = await supabase
      .from('cash_register')
      .select('*')
      .order('date', { ascending: false })
      .limit(10);

    setHistory(data || []);
  }

  async function loadTodaySales() {
    const today = format(new Date(), 'yyyy-MM-dd');
    const { data: sales } = await supabase
      .from('sales')
      .select('total, payment_method, created_at')
      .eq('status', 'completed')
      .gte('created_at', `${today}T00:00:00`)
      .lte('created_at', `${today}T23:59:59`);

    let cashIn = 0, tmoneyIn = 0, floozIn = 0, cardIn = 0;
    
    sales?.forEach(sale => {
      switch (sale.payment_method) {
        case 'cash':
          cashIn += sale.total;
          break;
        case 'tmoney':
          tmoneyIn += sale.total;
          break;
        case 'flooz':
          floozIn += sale.total;
          break;
        case 'card':
          cardIn += sale.total;
          break;
      }
    });

    return { cashIn, tmoneyIn, floozIn, cardIn };
  }

  async function handleOpenRegister() {
    const today = format(new Date(), 'yyyy-MM-dd');
    const { data: user } = await supabase.auth.getUser();

    const { error } = await supabase
      .from('cash_register')
      .insert({
        date: today,
        opening_balance: openingBalance,
        opened_at: new Date().toISOString(),
        opened_by: user.user?.id,
        cash_in: 0,
        cash_out: 0,
        tmoney_in: 0,
        flooz_in: 0,
        card_in: 0
      });

    if (error) {
      toast.error('Erreur lors de l\'ouverture de la caisse');
      return;
    }

    toast.success('Caisse ouverte avec succès');
    setIsOpenDialogOpen(false);
    loadTodayRegister();
    loadHistory();
  }

  async function handleCloseRegister() {
    if (!todayRegister) return;

    const { data: user } = await supabase.auth.getUser();
    const salesData = await loadTodaySales();
    
    const expectedBalance = todayRegister.opening_balance + salesData.cashIn;
    const difference = countedCash - expectedBalance;

    const { error } = await supabase
      .from('cash_register')
      .update({
        closing_balance: countedCash,
        closed_at: new Date().toISOString(),
        closed_by: user.user?.id,
        cash_in: salesData.cashIn,
        tmoney_in: salesData.tmoneyIn,
        flooz_in: salesData.floozIn,
        card_in: salesData.cardIn,
        notes: closingNotes + (difference !== 0 ? ` | Écart: ${difference.toLocaleString()} FCFA` : '')
      })
      .eq('id', todayRegister.id);

    if (error) {
      toast.error('Erreur lors de la fermeture de la caisse');
      return;
    }

    if (difference !== 0) {
      toast.warning(`Caisse fermée avec un écart de ${difference.toLocaleString()} FCFA`);
    } else {
      toast.success('Caisse fermée avec succès - Aucun écart');
    }
    
    setIsCloseDialogOpen(false);
    loadTodayRegister();
    loadHistory();
  }

  const [salesSummary, setSalesSummary] = useState({ cashIn: 0, tmoneyIn: 0, floozIn: 0, cardIn: 0 });
  
  useEffect(() => {
    if (todayRegister && !todayRegister.closed_at) {
      loadTodaySales().then(setSalesSummary);
    }
  }, [todayRegister]);

  const expectedBalance = todayRegister ? todayRegister.opening_balance + salesSummary.cashIn : 0;
  const totalSales = salesSummary.cashIn + salesSummary.tmoneyIn + salesSummary.floozIn + salesSummary.cardIn;

  return (
    <div className="flex-1 space-y-6 p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Wallet className="h-8 w-8 text-primary" />
            Caisse du Jour
          </h1>
          <p className="text-muted-foreground mt-1">
            {format(new Date(), 'EEEE dd MMMM yyyy', { locale: fr })}
          </p>
        </div>
        {!todayRegister ? (
          <Dialog open={isOpenDialogOpen} onOpenChange={setIsOpenDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-primary">
                <Clock className="h-4 w-4 mr-2" />
                Ouvrir la caisse
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Ouverture de caisse</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Fond de caisse (FCFA)</Label>
                  <Input
                    type="number"
                    min="0"
                    value={openingBalance}
                    onChange={(e) => setOpeningBalance(parseFloat(e.target.value) || 0)}
                    placeholder="Entrez le montant en caisse"
                  />
                </div>
                <Button onClick={handleOpenRegister} className="w-full bg-gradient-primary">
                  Confirmer l'ouverture
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        ) : !todayRegister.closed_at ? (
          <Dialog open={isCloseDialogOpen} onOpenChange={setIsCloseDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="destructive">
                <CheckCircle className="h-4 w-4 mr-2" />
                Fermer la caisse
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Fermeture de caisse</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="p-4 rounded-lg bg-muted">
                  <p className="text-sm text-muted-foreground">Solde attendu (espèces)</p>
                  <p className="text-2xl font-bold text-primary">{expectedBalance.toLocaleString()} FCFA</p>
                </div>
                <div className="space-y-2">
                  <Label>Montant compté (FCFA)</Label>
                  <Input
                    type="number"
                    min="0"
                    value={countedCash}
                    onChange={(e) => setCountedCash(parseFloat(e.target.value) || 0)}
                    placeholder="Comptez l'argent en caisse"
                  />
                  {countedCash > 0 && countedCash !== expectedBalance && (
                    <p className={`text-sm ${countedCash > expectedBalance ? 'text-success' : 'text-destructive'}`}>
                      Écart: {(countedCash - expectedBalance).toLocaleString()} FCFA
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Notes</Label>
                  <Textarea
                    value={closingNotes}
                    onChange={(e) => setClosingNotes(e.target.value)}
                    placeholder="Observations éventuelles..."
                  />
                </div>
                <Button onClick={handleCloseRegister} className="w-full" variant="destructive">
                  Confirmer la fermeture
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        ) : (
          <div className="flex items-center gap-2 text-success">
            <CheckCircle className="h-5 w-5" />
            <span className="font-semibold">Caisse fermée</span>
          </div>
        )}
      </div>

      {/* Status Card */}
      {todayRegister ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card className="bg-gradient-card shadow-md">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Ouverture</p>
                  <p className="text-2xl font-bold mt-1">{todayRegister.opening_balance.toLocaleString()} FCFA</p>
                </div>
                <Clock className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-card shadow-md">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Ventes Espèces</p>
                  <p className="text-2xl font-bold mt-1 text-success">{salesSummary.cashIn.toLocaleString()} FCFA</p>
                </div>
                <ArrowUpCircle className="h-8 w-8 text-success" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-card shadow-md">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Mobile Money</p>
                  <p className="text-2xl font-bold mt-1 text-accent">
                    {(salesSummary.tmoneyIn + salesSummary.floozIn).toLocaleString()} FCFA
                  </p>
                </div>
                <Smartphone className="h-8 w-8 text-accent" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-card shadow-md">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Solde Attendu</p>
                  <p className="text-2xl font-bold mt-1">{expectedBalance.toLocaleString()} FCFA</p>
                </div>
                <Calculator className="h-8 w-8 text-warning" />
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <Card className="bg-warning/10 border-warning/30">
          <CardContent className="p-8 text-center">
            <Wallet className="h-16 w-16 text-warning mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Caisse non ouverte</h2>
            <p className="text-muted-foreground mb-4">Ouvrez la caisse pour commencer à enregistrer les ventes</p>
          </CardContent>
        </Card>
      )}

      {/* Détail des ventes */}
      {todayRegister && !todayRegister.closed_at && (
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle>Détail des Encaissements</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-4">
              <div className="p-4 rounded-lg bg-success/10 border border-success/30">
                <p className="text-sm text-muted-foreground">Espèces</p>
                <p className="text-xl font-bold text-success">{salesSummary.cashIn.toLocaleString()} FCFA</p>
              </div>
              <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/30">
                <p className="text-sm text-muted-foreground">TMoney</p>
                <p className="text-xl font-bold text-blue-500">{salesSummary.tmoneyIn.toLocaleString()} FCFA</p>
              </div>
              <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
                <p className="text-sm text-muted-foreground">Flooz</p>
                <p className="text-xl font-bold text-yellow-500">{salesSummary.floozIn.toLocaleString()} FCFA</p>
              </div>
              <div className="p-4 rounded-lg bg-purple-500/10 border border-purple-500/30">
                <p className="text-sm text-muted-foreground">Carte</p>
                <p className="text-xl font-bold text-purple-500">{salesSummary.cardIn.toLocaleString()} FCFA</p>
              </div>
            </div>
            <div className="mt-4 p-4 rounded-lg bg-primary/10 border border-primary/30">
              <div className="flex justify-between items-center">
                <span className="font-semibold">Total des ventes du jour</span>
                <span className="text-2xl font-bold text-primary">{totalSales.toLocaleString()} FCFA</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Historique */}
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle>Historique des Caisses</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {history.map((register) => (
              <div
                key={register.id}
                className="flex items-center justify-between p-4 rounded-lg bg-muted/50"
              >
                <div>
                  <p className="font-semibold">{format(new Date(register.date), 'EEEE dd MMMM', { locale: fr })}</p>
                  <p className="text-sm text-muted-foreground">
                    Ouverture: {register.opening_balance.toLocaleString()} FCFA
                  </p>
                </div>
                <div className="text-right">
                  {register.closed_at ? (
                    <>
                      <p className="font-bold text-success">{(register.closing_balance || 0).toLocaleString()} FCFA</p>
                      <Badge variant="secondary" className="bg-success/20 text-success">Fermée</Badge>
                    </>
                  ) : (
                    <Badge variant="secondary" className="bg-warning/20 text-warning">En cours</Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
