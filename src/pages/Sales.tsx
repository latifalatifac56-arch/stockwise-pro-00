import { useEffect, useState } from 'react';
import { ShoppingCart, Plus, Minus, Trash2, CreditCard, Download } from 'lucide-react';
import { ReceiptPrint } from '@/components/ReceiptPrint';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';
import { getDB, Sale, SaleItem } from '@/lib/db';
import { logAction } from '@/lib/audit';
import { toast } from 'sonner';
import { exportSalesToExcel } from '@/lib/export';

type Article = Tables<'articles'>;

interface CartItem {
  article: Article;
  quantity: number;
}

export default function Sales() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'tmoney' | 'flooz' | 'card'>('cash');
  const [discount, setDiscount] = useState(0);
  const [printSaleId, setPrintSaleId] = useState<number | null>(null);
  const [sales, setSales] = useState<Sale[]>([]);

  useEffect(() => {
    loadArticles();
    loadSales();
  }, []);

  async function loadArticles() {
    try {
      const { data, error } = await supabase
        .from('articles')
        .select('*')
        .eq('status', 'active')
        .gt('stock', 0);
      
      if (error) throw error;
      setArticles(data || []);
    } catch (error) {
      console.error('Error loading articles:', error);
      toast.error('Erreur lors du chargement des articles');
    }
  }

  async function loadSales() {
    const db = await getDB();
    const allSales = await db.getAll('sales');
    setSales(allSales);
  }

  const filteredArticles = articles.filter(article =>
    article.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    article.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
    article.barcode?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const addToCart = (article: Article) => {
    const existing = cart.find(item => item.article.id === article.id);
    if (existing) {
      if (existing.quantity < article.stock) {
        setCart(cart.map(item =>
          item.article.id === article.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        ));
      } else {
        toast.error('Stock insuffisant');
      }
    } else {
      setCart([...cart, { article, quantity: 1 }]);
    }
  };

  const updateQuantity = (articleId: string, change: number) => {
    setCart(cart.map(item => {
      if (item.article.id === articleId) {
        const newQuantity = item.quantity + change;
        if (newQuantity <= 0) return item;
        if (newQuantity > item.article.stock) {
          toast.error('Stock insuffisant');
          return item;
        }
        return { ...item, quantity: newQuantity };
      }
      return item;
    }));
  };

  const removeFromCart = (articleId: string) => {
    setCart(cart.filter(item => item.article.id !== articleId));
  };

  const subtotal = cart.reduce((sum, item) => sum + (item.article.sell_price * item.quantity), 0);
  const tax = subtotal * 0.18;
  const total = subtotal + tax - discount;

  async function handleCheckout() {
    if (cart.length === 0) {
      toast.error('Le panier est vide');
      return;
    }

    try {
      const db = await getDB();
      
      const saleItems: SaleItem[] = cart.map(item => ({
        articleId: parseInt(item.article.id) || 0,
        name: item.article.name,
        quantity: item.quantity,
        price: item.article.sell_price,
        buyPrice: item.article.buy_price,
        profit: (item.article.sell_price - item.article.buy_price) * item.quantity,
        total: item.article.sell_price * item.quantity,
      }));

      const sale: Sale = {
        invoiceNumber: `INV-${Date.now()}`,
        items: saleItems,
        subtotal,
        discount,
        tax,
        total,
        paymentMethod,
        status: 'completed',
        createdBy: 1,
        createdAt: new Date().toISOString(),
      };

      const saleId = await db.add('sales', sale);

      // Update stock in Supabase
      for (const item of cart) {
        const newStock = item.article.stock - item.quantity;
        await supabase
          .from('articles')
          .update({ stock: newStock })
          .eq('id', item.article.id);
      }

      await logAction('create', 'sale', saleId as number, `Sale completed: ${sale.invoiceNumber} - ${total} FCFA`);

      toast.success('Vente enregistrée avec succès!');
      setPrintSaleId(saleId as number);
      setCart([]);
      setDiscount(0);
      loadArticles();
    } catch (error) {
      console.error('Error completing sale:', error);
      toast.error('Erreur lors de l\'enregistrement de la vente');
    }
  }

  return (
    <>
      {printSaleId && (
        <ReceiptPrint 
          saleId={printSaleId} 
          onClose={() => setPrintSaleId(null)} 
        />
      )}
      
      <div className="flex-1 p-8">
      <div className="grid lg:grid-cols-3 gap-6 h-full">
        {/* Product Selection */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold">Point de Vente</h1>
              <p className="text-muted-foreground mt-1">Scannez ou recherchez un article</p>
            </div>
            <Button 
              variant="outline"
              onClick={async () => {
                try {
                  await exportSalesToExcel(sales);
                  toast.success('Export Excel des ventes réussi');
                } catch (error) {
                  toast.error('Erreur lors de l\'export');
                }
              }}
            >
              <Download className="h-4 w-4 mr-2" />
              Exporter
            </Button>
          </div>

          <Input
            placeholder="Rechercher un article (nom, SKU, code-barre)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="text-lg py-6"
            autoFocus
          />

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-h-[calc(100vh-280px)] overflow-y-auto">
            {filteredArticles.map((article) => (
              <Card
                key={article.id}
                className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => addToCart(article)}
              >
                <CardContent className="p-4">
                  <div className="aspect-square bg-muted rounded-lg mb-3 flex items-center justify-center overflow-hidden">
                    {article.image ? (
                      <img src={article.image} alt={article.name} className="w-full h-full object-cover" />
                    ) : (
                      <ShoppingCart className="h-12 w-12 text-muted-foreground" />
                    )}
                  </div>
                  <h3 className="font-semibold text-sm mb-1 line-clamp-2">{article.name}</h3>
                  <p className="text-primary font-bold">{article.sell_price} FCFA</p>
                  <p className="text-xs text-muted-foreground">Stock: {article.stock}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Cart */}
        <div className="space-y-4">
          <Card className="shadow-lg">
            <CardHeader className="bg-gradient-primary text-white">
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                Panier ({cart.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {cart.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">Panier vide</p>
                ) : (
                  cart.map((item) => (
                    <div key={item.article.id} className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{item.article.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {item.article.sell_price} FCFA × {item.quantity}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateQuantity(item.article.id, -1)}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-8 text-center font-medium">{item.quantity}</span>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateQuantity(item.article.id, 1)}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-destructive"
                          onClick={() => removeFromCart(item.article.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      <p className="font-bold text-primary min-w-[80px] text-right">
                        {(item.article.sell_price * item.quantity).toLocaleString()} FCFA
                      </p>
                    </div>
                  ))
                )}
              </div>

              <div className="space-y-2 border-t pt-4">
                <div className="flex justify-between text-sm">
                  <span>Sous-total:</span>
                  <span className="font-medium">{subtotal.toLocaleString()} FCFA</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>TVA (18%):</span>
                  <span className="font-medium">{tax.toLocaleString()} FCFA</span>
                </div>
                <div className="flex justify-between items-center gap-2">
                  <span className="text-sm">Réduction:</span>
                  <Input
                    type="number"
                    min="0"
                    max={subtotal}
                    value={discount}
                    onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                    className="w-32 h-8"
                  />
                </div>
                <div className="flex justify-between text-lg font-bold pt-2 border-t">
                  <span>Total:</span>
                  <span className="text-primary">{total.toLocaleString()} FCFA</span>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Mode de paiement</label>
                <Select value={paymentMethod} onValueChange={(value: any) => setPaymentMethod(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Espèces</SelectItem>
                    <SelectItem value="tmoney">TMoney</SelectItem>
                    <SelectItem value="flooz">Flooz</SelectItem>
                    <SelectItem value="card">Carte bancaire</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button
                onClick={handleCheckout}
                disabled={cart.length === 0}
                className="w-full bg-gradient-accent h-12 text-lg font-bold"
              >
                <CreditCard className="h-5 w-5 mr-2" />
                Encaisser
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
    </>
  );
}
