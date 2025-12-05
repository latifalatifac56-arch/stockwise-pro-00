import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Smartphone, CheckCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface MobileMoneyPaymentProps {
  amount: number;
  onPaymentComplete: (method: 'tmoney' | 'flooz', transactionId: string) => void;
  trigger?: React.ReactNode;
}

export function MobileMoneyPayment({ amount, onPaymentComplete, trigger }: MobileMoneyPaymentProps) {
  const [open, setOpen] = useState(false);
  const [provider, setProvider] = useState<'tmoney' | 'flooz'>('tmoney');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [transactionId, setTransactionId] = useState('');
  const [step, setStep] = useState<'input' | 'confirm' | 'success'>('input');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!phoneNumber || phoneNumber.length < 8) {
      toast.error('Veuillez entrer un numéro de téléphone valide');
      return;
    }

    setLoading(true);
    // Simulate payment processing
    await new Promise(resolve => setTimeout(resolve, 1500));
    setLoading(false);
    setStep('confirm');
  };

  const handleConfirm = () => {
    if (!transactionId) {
      toast.error('Veuillez entrer l\'ID de transaction');
      return;
    }

    setStep('success');
    setTimeout(() => {
      onPaymentComplete(provider, transactionId);
      setOpen(false);
      // Reset state
      setStep('input');
      setPhoneNumber('');
      setTransactionId('');
    }, 1500);
  };

  const formatPhoneNumber = (value: string) => {
    // Format for Togolese numbers
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length <= 2) return cleaned;
    if (cleaned.length <= 4) return `${cleaned.slice(0, 2)} ${cleaned.slice(2)}`;
    if (cleaned.length <= 6) return `${cleaned.slice(0, 2)} ${cleaned.slice(2, 4)} ${cleaned.slice(4)}`;
    return `${cleaned.slice(0, 2)} ${cleaned.slice(2, 4)} ${cleaned.slice(4, 6)} ${cleaned.slice(6, 8)}`;
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" className="gap-2">
            <Smartphone className="h-4 w-4" />
            Mobile Money
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5" />
            Paiement Mobile Money
          </DialogTitle>
        </DialogHeader>

        {step === 'input' && (
          <div className="space-y-6">
            <div className="text-center p-4 bg-primary/10 rounded-lg">
              <p className="text-sm text-muted-foreground">Montant à payer</p>
              <p className="text-3xl font-bold text-primary">{amount.toLocaleString()} FCFA</p>
            </div>

            <div className="space-y-3">
              <Label>Choisir l'opérateur</Label>
              <RadioGroup value={provider} onValueChange={(v) => setProvider(v as 'tmoney' | 'flooz')}>
                <div className="grid grid-cols-2 gap-3">
                  <label 
                    className={`flex items-center justify-center p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      provider === 'tmoney' 
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                        : 'border-border hover:border-blue-300'
                    }`}
                  >
                    <RadioGroupItem value="tmoney" className="sr-only" />
                    <div className="text-center">
                      <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-blue-600 flex items-center justify-center">
                        <span className="text-white font-bold text-lg">T</span>
                      </div>
                      <span className="font-medium">TMoney</span>
                    </div>
                  </label>

                  <label 
                    className={`flex items-center justify-center p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      provider === 'flooz' 
                        ? 'border-green-500 bg-green-50 dark:bg-green-900/20' 
                        : 'border-border hover:border-green-300'
                    }`}
                  >
                    <RadioGroupItem value="flooz" className="sr-only" />
                    <div className="text-center">
                      <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-green-600 flex items-center justify-center">
                        <span className="text-white font-bold text-lg">F</span>
                      </div>
                      <span className="font-medium">Flooz</span>
                    </div>
                  </label>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Numéro de téléphone du client</Label>
              <div className="flex gap-2">
                <div className="flex items-center px-3 bg-muted rounded-l-md border border-r-0">
                  <span className="text-sm text-muted-foreground">+228</span>
                </div>
                <Input
                  id="phone"
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(formatPhoneNumber(e.target.value))}
                  placeholder="90 XX XX XX"
                  className="rounded-l-none"
                />
              </div>
            </div>

            <Button 
              onClick={handleSubmit} 
              disabled={loading} 
              className="w-full bg-gradient-primary"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Envoi de la demande...
                </>
              ) : (
                'Envoyer la demande de paiement'
              )}
            </Button>

            <p className="text-xs text-center text-muted-foreground">
              Le client recevra une notification {provider === 'tmoney' ? 'TMoney' : 'Flooz'} pour confirmer le paiement
            </p>
          </div>
        )}

        {step === 'confirm' && (
          <div className="space-y-6">
            <div className="text-center p-4 bg-warning/10 rounded-lg">
              <p className="text-sm text-muted-foreground mb-2">
                En attente de confirmation du client
              </p>
              <p className="text-lg font-medium">+228 {phoneNumber}</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="transactionId">ID de transaction (reçu après paiement)</Label>
              <Input
                id="transactionId"
                value={transactionId}
                onChange={(e) => setTransactionId(e.target.value.toUpperCase())}
                placeholder="Ex: TXN123456789"
              />
            </div>

            <Button onClick={handleConfirm} className="w-full bg-gradient-primary">
              Confirmer le paiement
            </Button>

            <Button 
              variant="outline" 
              onClick={() => setStep('input')} 
              className="w-full"
            >
              Renvoyer la demande
            </Button>
          </div>
        )}

        {step === 'success' && (
          <div className="text-center py-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-success/20 flex items-center justify-center">
              <CheckCircle className="h-10 w-10 text-success" />
            </div>
            <h3 className="text-xl font-bold mb-2">Paiement réussi!</h3>
            <p className="text-muted-foreground">
              Transaction {transactionId} confirmée
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
