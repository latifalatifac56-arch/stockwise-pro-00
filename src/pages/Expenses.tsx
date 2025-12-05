import { useEffect, useState } from 'react';
import { Receipt, Plus, Calendar, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getDB, Expense } from '@/lib/db';
import { getCurrentUser } from '@/lib/storage';
import { logAction } from '@/lib/audit';
import { toast } from 'sonner';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { fr } from 'date-fns/locale';

const expenseCategories = [
  'Loyer',
  'Électricité',
  'Eau',
  'Internet',
  'Téléphone',
  'Salaires',
  'Transport',
  'Fournitures',
  'Maintenance',
  'Publicité',
  'Assurance',
  'Taxes',
  'Autre',
];

export default function Expenses() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<Expense>>({
    category: 'Autre',
    amount: 0,
    description: '',
    date: format(new Date(), 'yyyy-MM-dd'),
  });

  useEffect(() => {
    loadExpenses();
  }, []);

  async function loadExpenses() {
    const db = await getDB();
    const allExpenses = await db.getAll('expenses');
    setExpenses(allExpenses.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
  }

  const monthStart = startOfMonth(new Date());
  const monthEnd = endOfMonth(new Date());
  
  const monthlyExpenses = expenses.filter(e => {
    const expenseDate = new Date(e.date);
    return expenseDate >= monthStart && expenseDate <= monthEnd;
  });

  const monthlyTotal = monthlyExpenses.reduce((sum, e) => sum + e.amount, 0);
  const categoryTotals = monthlyExpenses.reduce((acc, e) => {
    acc[e.category] = (acc[e.category] || 0) + e.amount;
    return acc;
  }, {} as Record<string, number>);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    try {
      const db = await getDB();
      
      // Note: This still uses IndexedDB for compatibility
      // TODO: Migrate to Supabase expenses table
      const newExpense: Expense = {
        ...formData,
        createdBy: 1, // Temporary: will be replaced with Supabase user ID
        createdAt: new Date().toISOString(),
      } as Expense;

      const id = await db.add('expenses', newExpense);
      await logAction('create', 'expense', id as number, `Created expense: ${formData.category} - ${formData.amount} FCFA`);
      
      toast.success('Dépense enregistrée avec succès');
      setIsDialogOpen(false);
      loadExpenses();
      setFormData({ category: 'Autre', amount: 0, description: '', date: format(new Date(), 'yyyy-MM-dd') });
    } catch (error) {
      console.error('Error adding expense:', error);
      toast.error('Erreur lors de l\'ajout de la dépense');
    }
  }

  return (
    <div className="flex-1 space-y-6 p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dépenses</h1>
          <p className="text-muted-foreground mt-1">Suivez vos dépenses professionnelles</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-primary">
              <Plus className="h-4 w-4 mr-2" />
              Nouvelle dépense
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nouvelle dépense</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Catégorie *</Label>
                <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {expenseCategories.map((cat) => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Montant (FCFA) *</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Date *</Label>
                <Input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Description *</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  required
                />
              </div>
              <Button type="submit" className="w-full bg-gradient-primary">Enregistrer la dépense</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="bg-gradient-card shadow-md">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total ce mois</p>
                <p className="text-3xl font-bold text-destructive mt-2">{monthlyTotal.toLocaleString()} FCFA</p>
              </div>
              <DollarSign className="h-12 w-12 text-destructive opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card shadow-md">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Nombre de dépenses</p>
                <p className="text-3xl font-bold mt-2">{monthlyExpenses.length}</p>
              </div>
              <Receipt className="h-12 w-12 text-primary opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card shadow-md">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Moyenne par jour</p>
                <p className="text-2xl font-bold mt-2">
                  {monthlyExpenses.length > 0
                    ? Math.round(monthlyTotal / monthlyExpenses.length).toLocaleString()
                    : 0} FCFA
                </p>
              </div>
              <Calendar className="h-12 w-12 text-accent opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2 shadow-md">
          <CardHeader>
            <CardTitle>Historique des dépenses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {expenses.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">Aucune dépense enregistrée</p>
              ) : (
                expenses.map((expense) => (
                  <div key={expense.id} className="flex items-center justify-between p-4 rounded-lg border bg-card">
                    <div className="flex items-start gap-3">
                      <div className="h-10 w-10 rounded-lg bg-destructive/10 flex items-center justify-center">
                        <Receipt className="h-5 w-5 text-destructive" />
                      </div>
                      <div>
                        <p className="font-semibold">{expense.category}</p>
                        <p className="text-sm text-muted-foreground line-clamp-1">{expense.description}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {format(new Date(expense.date), 'dd MMMM yyyy', { locale: fr })}
                        </p>
                      </div>
                    </div>
                    <p className="font-bold text-destructive text-lg">
                      {expense.amount.toLocaleString()} FCFA
                    </p>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-md">
          <CardHeader>
            <CardTitle>Par catégorie (ce mois)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(categoryTotals)
                .sort((a, b) => b[1] - a[1])
                .map(([category, amount]) => (
                  <div key={category} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">{category}</span>
                      <span className="text-destructive font-bold">{amount.toLocaleString()} FCFA</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-primary"
                        style={{ width: `${(amount / monthlyTotal) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
