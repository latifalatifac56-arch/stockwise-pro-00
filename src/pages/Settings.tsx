import { useEffect, useState } from 'react';
import { Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { useSettings } from '@/contexts/SettingsContext';
import { toast } from 'sonner';

export default function SettingsPage() {
  const { settings, loading: settingsLoading, updateSettings, refreshSettings } = useSettings();
  const [localSettings, setLocalSettings] = useState({
    company_name: '',
    logo: '',
    primary_color: '#3b82f6',
    secondary_color: '#10b981',
    currency: 'FCFA',
    language: 'fr',
    receipt_footer: '',
    tax_rate: 18,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (settings) {
      setLocalSettings({
        company_name: settings.company_name || '',
        logo: settings.logo || '',
        primary_color: settings.primary_color || '#3b82f6',
        secondary_color: settings.secondary_color || '#10b981',
        currency: settings.currency || 'FCFA',
        language: settings.language || 'fr',
        receipt_footer: settings.receipt_footer || '',
        tax_rate: settings.tax_rate || 18,
      });
    }
  }, [settings]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLocalSettings(prev => ({ ...prev, logo: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  async function handleSave() {
    setSaving(true);

    try {
      await updateSettings({
        company_name: localSettings.company_name,
        logo: localSettings.logo || null,
        primary_color: localSettings.primary_color,
        secondary_color: localSettings.secondary_color,
        currency: localSettings.currency,
        language: localSettings.language,
        receipt_footer: localSettings.receipt_footer || null,
        tax_rate: localSettings.tax_rate,
      });
      
      await refreshSettings();
      toast.success('Paramètres sauvegardés avec succès');
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  }

  if (settingsLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-muted-foreground">Chargement...</p>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-6 p-8 max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold">Paramètres</h1>
        <p className="text-muted-foreground mt-1">Personnalisez votre application</p>
      </div>

      <Card className="shadow-md">
        <CardHeader>
          <CardTitle>Identité de l'entreprise</CardTitle>
          <CardDescription>Personnalisez les informations de votre entreprise</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="companyName">Nom de l'entreprise</Label>
            <Input
              id="companyName"
              value={localSettings.company_name}
              onChange={(e) => setLocalSettings(prev => ({ ...prev, company_name: e.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="logo">Logo de l'entreprise</Label>
            <div className="flex items-center gap-4">
              <Input
                id="logo"
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="flex-1"
              />
              {localSettings.logo && (
                <img src={localSettings.logo} alt="Logo" className="h-16 w-16 object-contain rounded-lg border" />
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Ce logo apparaîtra sur vos reçus, factures et dans la barre latérale
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="receiptFooter">Texte de pied de page (reçus)</Label>
            <Textarea
              id="receiptFooter"
              value={localSettings.receipt_footer}
              onChange={(e) => setLocalSettings(prev => ({ ...prev, receipt_footer: e.target.value }))}
              rows={3}
              placeholder="Ex: Merci de votre visite! • Tel: +228 XX XX XX XX"
            />
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-md">
        <CardHeader>
          <CardTitle>Apparence</CardTitle>
          <CardDescription>Personnalisez les couleurs de l'application</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="primaryColor">Couleur principale</Label>
              <div className="flex gap-2">
                <Input
                  id="primaryColor"
                  type="color"
                  value={localSettings.primary_color}
                  onChange={(e) => setLocalSettings(prev => ({ ...prev, primary_color: e.target.value }))}
                  className="w-20 h-10"
                />
                <Input
                  type="text"
                  value={localSettings.primary_color}
                  onChange={(e) => setLocalSettings(prev => ({ ...prev, primary_color: e.target.value }))}
                  className="flex-1"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="secondaryColor">Couleur secondaire</Label>
              <div className="flex gap-2">
                <Input
                  id="secondaryColor"
                  type="color"
                  value={localSettings.secondary_color}
                  onChange={(e) => setLocalSettings(prev => ({ ...prev, secondary_color: e.target.value }))}
                  className="w-20 h-10"
                />
                <Input
                  type="text"
                  value={localSettings.secondary_color}
                  onChange={(e) => setLocalSettings(prev => ({ ...prev, secondary_color: e.target.value }))}
                  className="flex-1"
                />
              </div>
            </div>
          </div>

          <div className="p-4 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground mb-3">Aperçu des couleurs:</p>
            <div className="flex gap-2">
              <div
                className="h-12 flex-1 rounded-lg"
                style={{ backgroundColor: localSettings.primary_color }}
              />
              <div
                className="h-12 flex-1 rounded-lg"
                style={{ backgroundColor: localSettings.secondary_color }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-md">
        <CardHeader>
          <CardTitle>Paramètres régionaux</CardTitle>
          <CardDescription>Devise, langue et fiscalité</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="currency">Devise</Label>
              <Input
                id="currency"
                value={localSettings.currency}
                onChange={(e) => setLocalSettings(prev => ({ ...prev, currency: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="language">Langue</Label>
              <Input
                id="language"
                value={localSettings.language}
                onChange={(e) => setLocalSettings(prev => ({ ...prev, language: e.target.value }))}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="taxRate">Taux de TVA (%)</Label>
            <Input
              id="taxRate"
              type="number"
              min="0"
              max="100"
              step="0.1"
              value={localSettings.tax_rate}
              onChange={(e) => setLocalSettings(prev => ({ ...prev, tax_rate: parseFloat(e.target.value) || 0 }))}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving} className="bg-gradient-primary" size="lg">
          <Save className="h-4 w-4 mr-2" />
          {saving ? 'Enregistrement...' : 'Sauvegarder les paramètres'}
        </Button>
      </div>
    </div>
  );
}
