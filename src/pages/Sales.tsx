import { useEffect, useState } from 'react';
import { ShoppingCart, Plus, Minus, Trash2, CreditCard, Download, Package, TrendingUp, Receipt, Search } from 'lucide-react';
import { ReceiptPrint } from '@/components/ReceiptPrint';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
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

  const todayTotal = sales
    .filter(s => new Date(s.createdAt).toDateString() === new Date().toDateString())
    .reduce((sum, s) => sum + s.total, 0);

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
      loadSales();
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
      
      <div className="flex-1 space-y-8 p-8">
        {/* Header Section */}
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-accent/5 to-transparent rounded-3xl blur-3xl -z-10" />
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-gradient-to-br from-primary to-primary/80 shadow-lg shadow-primary/25">
                  <ShoppingCart className="h-6 w-6 text-primary-foreground" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                    Point de Vente
                  </h1>
                  <p className="text-muted-foreground">
                    Scannez ou recherchez un article
                  </p>
                </div>
              </div>
            </div>
            <Button 
              variant="outline"
              className="group border-border/50 hover:border-primary/50 hover:bg-primary/5 transition-all duration-300"
              onClick={async () => {
                try {
                  await exportSalesToExcel(sales);
                  toast.success('Export Excel des ventes réussi');
                } catch (error) {
                  toast.error('Erreur lors de l\'export');
                }
              }}
            >
              <Download className="h-4 w-4 mr-2 group-hover:animate-bounce" />
              Exporter
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="group relative overflow-hidden border-border/50 bg-gradient-to-br from-card to-card/80 hover:shadow-xl hover:shadow-primary/10 transition-all duration-500 hover:-translate-y-1">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Articles disponibles</p>
                  <p className="text-3xl font-bold mt-1">{articles.length}</p>
                </div>
                <div className="p-3 rounded-xl bg-primary/10 group-hover:bg-primary/20 group-hover:scale-110 transition-all duration-300">
                  <Package className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="group relative overflow-hidden border-border/50 bg-gradient-to-br from-card to-card/80 hover:shadow-xl hover:shadow-success/10 transition-all duration-500 hover:-translate-y-1">
            <div className="absolute inset-0 bg-gradient-to-br from-success/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Ventes du jour</p>
                  <p className="text-3xl font-bold mt-1">{todayTotal.toLocaleString()} <span className="text-sm font-normal text-muted-foreground">FCFA</span></p>
                </div>
                <div className="p-3 rounded-xl bg-success/10 group-hover:bg-success/20 group-hover:scale-110 transition-all duration-300">
                  <TrendingUp className="h-6 w-6 text-success" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="group relative overflow-hidden border-border/50 bg-gradient-to-br from-card to-card/80 hover:shadow-xl hover:shadow-accent/10 transition-all duration-500 hover:-translate-y-1">
            <div className="absolute inset-0 bg-gradient-to-br from-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total ventes</p>
                  <p className="text-3xl font-bold mt-1">{sales.length}</p>
                </div>
                <div className="p-3 rounded-xl bg-accent/10 group-hover:bg-accent/20 group-hover:scale-110 transition-all duration-300">
                  <Receipt className="h-6 w-6 text-accent-foreground" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Product Selection */}
          <div className="lg:col-span-2 space-y-4">
            {/* Search Bar */}
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-accent/10 to-primary/20 rounded-2xl blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-500" />
              <div className="relative flex items-center gap-4 p-2 rounded-2xl bg-card border border-border/50 shadow-sm group-focus-within:shadow-lg group-focus-within:border-primary/30 transition-all duration-300">
                <Search className="ml-4 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors duration-300" />
                <Input
                  placeholder="Rechercher un article (nom, SKU, code-barre)..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 text-lg placeholder:text-muted-foreground/60"
                  autoFocus
                />
                {searchTerm && (
                  <Badge variant="secondary" className="mr-2 animate-fade-in">
                    {filteredArticles.length} résultat{filteredArticles.length > 1 ? 's' : ''}
                  </Badge>
                )}
              </div>
            </div>

            {/* Products Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-h-[calc(100vh-420px)] overflow-y-auto pr-2">
              {filteredArticles.map((article, index) => (
                <Card
                  key={article.id}
                  className="group relative cursor-pointer overflow-hidden border-border/50 bg-card hover:bg-card/80 transition-all duration-500 hover:shadow-xl hover:shadow-primary/10 hover:-translate-y-1"
                  onClick={() => addToCart(article)}
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  
                  <CardContent className="relative p-4">
                    <div className="aspect-square bg-gradient-to-br from-muted to-muted/50 rounded-xl mb-3 flex items-center justify-center overflow-hidden">
                      {article.image ? (
                        <img 
                          src={article.image} 
                          alt={article.name} 
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                        />
                      ) : (
                        <div className="p-4 rounded-full bg-background/50 backdrop-blur-sm group-hover:scale-110 transition-transform duration-500">
                          <ShoppingCart className="h-8 w-8 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    <h3 className="font-semibold text-sm mb-1 line-clamp-2 group-hover:text-primary transition-colors duration-300">
                      {article.name}
                    </h3>
                    <p className="text-primary font-bold text-lg">{article.sell_price.toLocaleString()} <span className="text-xs font-normal">FCFA</span></p>
                    <div className="flex items-center justify-between mt-2">
                      <Badge variant="outline" className="text-xs">
                        Stock: {article.stock}
                      </Badge>
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:bg-primary group-hover:text-primary-foreground">
                        <Plus className="h-4 w-4" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {filteredArticles.length === 0 && (
              <Card className="border-dashed border-2 border-border/50 bg-transparent">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <div className="p-4 rounded-full bg-muted/50 mb-4">
                    <Package className="h-10 w-10 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold mb-1">
                    {searchTerm ? "Aucun article trouvé" : "Aucun article en stock"}
                  </h3>
                  <p className="text-muted-foreground text-center text-sm">
                    {searchTerm 
                      ? "Essayez avec d'autres termes de recherche" 
                      : "Ajoutez des articles au stock pour commencer à vendre"
                    }
                  </p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Cart */}
          <div className="space-y-4">
            <Card className="border-border/50 shadow-xl overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground p-4">
                <CardTitle className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5" />
                  Panier
                  {cart.length > 0 && (
                    <Badge className="bg-primary-foreground/20 text-primary-foreground ml-auto">
                      {cart.length} article{cart.length > 1 ? 's' : ''}
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                <div className="space-y-2 max-h-[250px] overflow-y-auto pr-1">
                  {cart.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                      <div className="p-4 rounded-full bg-muted/50 mb-3">
                        <ShoppingCart className="h-8 w-8 text-muted-foreground" />
                      </div>
                      <p className="text-muted-foreground text-sm">Panier vide</p>
                      <p className="text-muted-foreground/60 text-xs mt-1">Cliquez sur un article pour l'ajouter</p>
                    </div>
                  ) : (
                    cart.map((item) => (
                      <div 
                        key={item.article.id} 
                        className="group flex items-center gap-2 p-3 bg-muted/30 hover:bg-muted/50 rounded-xl transition-all duration-300"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate group-hover:text-primary transition-colors duration-300">
                            {item.article.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {item.article.sell_price.toLocaleString()} FCFA × {item.quantity}
                          </p>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 w-7 p-0 border-border/50 hover:border-primary hover:bg-primary/10"
                            onClick={() => updateQuantity(item.article.id, -1)}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="w-8 text-center font-bold text-sm">{item.quantity}</span>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 w-7 p-0 border-border/50 hover:border-primary hover:bg-primary/10"
                            onClick={() => updateQuantity(item.article.id, 1)}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                            onClick={() => removeFromCart(item.article.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        <p className="font-bold text-primary min-w-[70px] text-right text-sm">
                          {(item.article.sell_price * item.quantity).toLocaleString()}
                        </p>
                      </div>
                    ))
                  )}
                </div>

                <div className="space-y-3 border-t border-border/50 pt-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Sous-total:</span>
                    <span className="font-medium">{subtotal.toLocaleString()} FCFA</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">TVA (18%):</span>
                    <span className="font-medium">{tax.toLocaleString()} FCFA</span>
                  </div>
                  <div className="flex justify-between items-center gap-2">
                    <span className="text-sm text-muted-foreground">Réduction:</span>
                    <Input
                      type="number"
                      min="0"
                      max={subtotal}
                      value={discount}
                      onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                      className="w-28 h-8 text-right border-border/50"
                    />
                  </div>
                  <div className="flex justify-between text-xl font-bold pt-3 border-t border-border/50">
                    <span>Total:</span>
                    <span className="text-primary">{total.toLocaleString()} FCFA</span>
                  </div>
                </div>

                <div className="space-y-3 pt-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">Mode de paiement</label>
                    <Select value={paymentMethod} onValueChange={(value: any) => setPaymentMethod(value)}>
                      <SelectTrigger className="border-border/50">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cash">💵 Espèces</SelectItem>
                        <SelectItem value="tmoney">📱 TMoney</SelectItem>
                        <SelectItem value="flooz">📱 Flooz</SelectItem>
                        <SelectItem value="card">💳 Carte bancaire</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Button
                    onClick={handleCheckout}
                    disabled={cart.length === 0}
                    className="w-full h-12 text-lg font-bold bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all duration-300 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                  >
                    <CreditCard className="h-5 w-5 mr-2" />
                    Encaisser {total > 0 && `${total.toLocaleString()} FCFA`}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}
