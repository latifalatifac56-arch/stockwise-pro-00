import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';
import { toast } from 'sonner';
import { Upload } from 'lucide-react';

type Article = Tables<'articles'>;

interface ArticleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  article?: Article;
  onSuccess: () => void;
}

const categories = ['Électronique', 'Alimentaire', 'Vêtements', 'Mobilier', 'Autre'];
const types = ['Stockable', 'Consommable', 'Service'];
const units = ['Pièce', 'Carton', 'Kg', 'Litre', 'Mètre'];

export function ArticleDialog({ open, onOpenChange, article, onSuccess }: ArticleDialogProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    sku: '',
    name: '',
    description: '',
    category: 'Électronique',
    type: 'Stockable',
    image: '',
    barcode: '',
    buy_price: 0,
    sell_price: 0,
    wholesale_price: 0,
    unit: 'Pièce',
    stock: 0,
    min_stock: 5,
    status: 'active',
  });

  useEffect(() => {
    if (article) {
      setFormData({
        sku: article.sku,
        name: article.name,
        description: article.description || '',
        category: article.category,
        type: article.type,
        image: article.image || '',
        barcode: article.barcode || '',
        buy_price: article.buy_price,
        sell_price: article.sell_price,
        wholesale_price: article.wholesale_price || 0,
        unit: article.unit,
        stock: article.stock,
        min_stock: article.min_stock,
        status: article.status || 'active',
      });
    } else {
      setFormData({
        sku: `SKU-${Date.now()}`,
        name: '',
        description: '',
        category: 'Électronique',
        type: 'Stockable',
        image: '',
        barcode: '',
        buy_price: 0,
        sell_price: 0,
        wholesale_price: 0,
        unit: 'Pièce',
        stock: 0,
        min_stock: 5,
        status: 'active',
      });
    }
  }, [article, open]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, image: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      if (article?.id) {
        // Update existing article
        const { error } = await supabase
          .from('articles')
          .update({
            sku: formData.sku,
            name: formData.name,
            description: formData.description || null,
            category: formData.category,
            type: formData.type,
            image: formData.image || null,
            barcode: formData.barcode || null,
            buy_price: formData.buy_price,
            sell_price: formData.sell_price,
            wholesale_price: formData.wholesale_price || null,
            unit: formData.unit,
            stock: formData.stock,
            min_stock: formData.min_stock,
            status: formData.status,
          })
          .eq('id', article.id);
        
        if (error) throw error;
        toast.success('Article mis à jour avec succès');
      } else {
        // Create new article
        const { error } = await supabase
          .from('articles')
          .insert({
            sku: formData.sku,
            name: formData.name,
            description: formData.description || null,
            category: formData.category,
            type: formData.type,
            image: formData.image || null,
            barcode: formData.barcode || null,
            buy_price: formData.buy_price,
            sell_price: formData.sell_price,
            wholesale_price: formData.wholesale_price || null,
            unit: formData.unit,
            stock: formData.stock,
            min_stock: formData.min_stock,
            status: formData.status,
          });
        
        if (error) throw error;
        toast.success('Article créé avec succès');
      }

      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error saving article:', error);
      toast.error(error.message || 'Erreur lors de la sauvegarde');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{article ? 'Modifier l\'article' : 'Nouvel article'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="sku">SKU *</Label>
              <Input
                id="sku"
                value={formData.sku}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="barcode">Code-barres</Label>
              <Input
                id="barcode"
                value={formData.barcode}
                onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Nom de l'article *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">Catégorie *</Label>
              <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="type">Type *</Label>
              <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {types.map((type) => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="unit">Unité *</Label>
              <Select value={formData.unit} onValueChange={(value) => setFormData({ ...formData, unit: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {units.map((unit) => (
                    <SelectItem key={unit} value={unit}>{unit}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="buy_price">Prix d'achat *</Label>
              <Input
                id="buy_price"
                type="number"
                min="0"
                step="0.01"
                value={formData.buy_price}
                onChange={(e) => setFormData({ ...formData, buy_price: parseFloat(e.target.value) })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sell_price">Prix de vente *</Label>
              <Input
                id="sell_price"
                type="number"
                min="0"
                step="0.01"
                value={formData.sell_price}
                onChange={(e) => setFormData({ ...formData, sell_price: parseFloat(e.target.value) })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="wholesale_price">Prix gros</Label>
              <Input
                id="wholesale_price"
                type="number"
                min="0"
                step="0.01"
                value={formData.wholesale_price}
                onChange={(e) => setFormData({ ...formData, wholesale_price: parseFloat(e.target.value) })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="stock">Stock initial *</Label>
              <Input
                id="stock"
                type="number"
                min="0"
                value={formData.stock}
                onChange={(e) => setFormData({ ...formData, stock: parseInt(e.target.value) })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="min_stock">Stock minimum *</Label>
              <Input
                id="min_stock"
                type="number"
                min="0"
                value={formData.min_stock}
                onChange={(e) => setFormData({ ...formData, min_stock: parseInt(e.target.value) })}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="image">Image du produit</Label>
            <div className="flex items-center gap-4">
              <Input
                id="image"
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="flex-1"
              />
              {formData.image && (
                <img src={formData.image} alt="Preview" className="h-16 w-16 object-cover rounded-lg" />
              )}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={loading} className="bg-gradient-primary">
              {loading ? 'Enregistrement...' : article ? 'Mettre à jour' : 'Créer'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
