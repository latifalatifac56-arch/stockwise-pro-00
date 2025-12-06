import { useEffect, useState } from "react";
import { Plus, Search, Edit, Trash2, Image as ImageIcon, Package, Download, TrendingUp, AlertTriangle, LayoutGrid, List, ChevronLeft, ChevronRight } from "lucide-react";
import { ArticleDialog } from "@/components/ArticleDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { exportArticlesToExcel } from "@/lib/export";
import { Tables } from "@/integrations/supabase/types";

type Article = Tables<'articles'>;
type ViewMode = 'grid' | 'table';

const ITEMS_PER_PAGE_OPTIONS = [10, 20, 50, 100];

export default function Articles() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(12);

  useEffect(() => {
    loadArticles();
  }, []);

  async function loadArticles() {
    try {
      const { data, error } = await supabase
        .from('articles')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setArticles(data || []);
    } catch (error) {
      console.error('Error loading articles:', error);
      toast.error("Erreur lors du chargement des articles");
    } finally {
      setLoading(false);
    }
  }

  const filteredArticles = articles.filter(article =>
    article.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    article.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
    article.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Pagination logic
  const totalPages = Math.ceil(filteredArticles.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedArticles = filteredArticles.slice(startIndex, startIndex + itemsPerPage);

  // Reset to page 1 when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingArticle, setEditingArticle] = useState<Article | undefined>(undefined);

  const handleEdit = (article: Article) => {
    setEditingArticle(article);
    setDialogOpen(true);
  };

  const handleDialogClose = (open: boolean) => {
    setDialogOpen(open);
    if (!open) {
      setEditingArticle(undefined);
    }
  };

  const handleAddNew = () => {
    setEditingArticle(undefined);
    setDialogOpen(true);
  };

  const handleDelete = async (article: Article) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer "${article.name}" ?`)) return;
    
    try {
      const { error } = await supabase
        .from('articles')
        .delete()
        .eq('id', article.id);
      
      if (error) throw error;
      toast.success('Article supprimé avec succès');
      loadArticles();
    } catch (error: any) {
      console.error('Error deleting article:', error);
      toast.error(error.message || 'Erreur lors de la suppression');
    }
  };

  const totalStock = articles.reduce((acc, a) => acc + a.stock, 0);
  const lowStockCount = articles.filter(a => a.stock <= a.min_stock).length;
  const totalValue = articles.reduce((acc, a) => acc + (a.sell_price * a.stock), 0);

  return (
    <div className="flex-1 space-y-8 p-8">
      {/* Header Section */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-accent/5 to-transparent rounded-3xl blur-3xl -z-10" />
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-gradient-to-br from-primary to-primary/80 shadow-lg shadow-primary/25">
                <Package className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                  Articles
                </h1>
                <p className="text-muted-foreground">
                  Gérez votre catalogue de produits
                </p>
              </div>
            </div>
          </div>
          <div className="flex gap-3">
            <Button 
              variant="outline"
              className="group border-border/50 hover:border-primary/50 hover:bg-primary/5 transition-all duration-300"
              onClick={async () => {
                try {
                  await exportArticlesToExcel(articles);
                  toast.success('Export Excel réussi');
                } catch (error) {
                  toast.error('Erreur lors de l\'export');
                }
              }}
            >
              <Download className="h-4 w-4 mr-2 group-hover:animate-bounce" />
              Exporter
            </Button>
            <Button 
              className="bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all duration-300 hover:-translate-y-0.5" 
              onClick={handleAddNew}
            >
              <Plus className="h-4 w-4 mr-2" />
              Nouvel article
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="group relative overflow-hidden border-border/50 bg-gradient-to-br from-card to-card/80 hover:shadow-xl hover:shadow-primary/10 transition-all duration-500 hover:-translate-y-1">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Articles</p>
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
                <p className="text-sm font-medium text-muted-foreground">Valeur Stock</p>
                <p className="text-3xl font-bold mt-1">{totalValue.toLocaleString()} <span className="text-sm font-normal text-muted-foreground">FCFA</span></p>
              </div>
              <div className="p-3 rounded-xl bg-success/10 group-hover:bg-success/20 group-hover:scale-110 transition-all duration-300">
                <TrendingUp className="h-6 w-6 text-success" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="group relative overflow-hidden border-border/50 bg-gradient-to-br from-card to-card/80 hover:shadow-xl hover:shadow-warning/10 transition-all duration-500 hover:-translate-y-1">
          <div className="absolute inset-0 bg-gradient-to-br from-warning/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Stock Faible</p>
                <p className="text-3xl font-bold mt-1">{lowStockCount}</p>
              </div>
              <div className="p-3 rounded-xl bg-warning/10 group-hover:bg-warning/20 group-hover:scale-110 transition-all duration-300">
                <AlertTriangle className="h-6 w-6 text-warning" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <ArticleDialog
        open={dialogOpen}
        onOpenChange={handleDialogClose}
        article={editingArticle}
        onSuccess={loadArticles}
      />

      {/* Search Bar & View Toggle */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative group flex-1">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-accent/10 to-primary/20 rounded-2xl blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-500" />
          <div className="relative flex items-center gap-4 p-2 rounded-2xl bg-card border border-border/50 shadow-sm group-focus-within:shadow-lg group-focus-within:border-primary/30 transition-all duration-300">
            <Search className="ml-4 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors duration-300" />
            <Input
              placeholder="Rechercher un article par nom, SKU ou catégorie..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 text-lg placeholder:text-muted-foreground/60"
            />
            {searchTerm && (
              <Badge variant="secondary" className="mr-2 animate-fade-in">
                {filteredArticles.length} résultat{filteredArticles.length > 1 ? 's' : ''}
              </Badge>
            )}
          </div>
        </div>

        {/* View Toggle */}
        <div className="flex items-center gap-2 p-1 rounded-xl bg-muted/50 border border-border/50">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('grid')}
            className={`transition-all duration-300 ${viewMode === 'grid' ? 'shadow-md' : 'hover:bg-muted'}`}
          >
            <LayoutGrid className="h-4 w-4 mr-2" />
            Grille
          </Button>
          <Button
            variant={viewMode === 'table' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('table')}
            className={`transition-all duration-300 ${viewMode === 'table' ? 'shadow-md' : 'hover:bg-muted'}`}
          >
            <List className="h-4 w-4 mr-2" />
            Liste
          </Button>
        </div>
      </div>

      {/* Articles Content */}
      {loading ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {[...Array(8)].map((_, i) => (
            <Card key={i} className="overflow-hidden animate-pulse">
              <div className="aspect-[4/3] bg-muted" />
              <CardContent className="p-5 space-y-3">
                <div className="h-6 bg-muted rounded w-3/4" />
                <div className="h-4 bg-muted rounded w-1/2" />
                <div className="h-10 bg-muted rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredArticles.length === 0 ? (
        <Card className="border-dashed border-2 border-border/50 bg-transparent">
          <CardContent className="flex flex-col items-center justify-center py-20">
            <div className="p-6 rounded-full bg-muted/50 mb-6">
              <Package className="h-16 w-16 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-2">
              {searchTerm ? "Aucun article trouvé" : "Aucun article enregistré"}
            </h3>
            <p className="text-muted-foreground text-center max-w-md mb-6">
              {searchTerm 
                ? "Essayez avec d'autres termes de recherche" 
                : "Commencez par ajouter votre premier article au catalogue"
              }
            </p>
            {!searchTerm && (
              <Button onClick={handleAddNew} className="bg-gradient-to-r from-primary to-primary/90">
                <Plus className="h-4 w-4 mr-2" />
                Ajouter un article
              </Button>
            )}
          </CardContent>
        </Card>
      ) : viewMode === 'grid' ? (
        // Grid View
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {paginatedArticles.map((article, index) => (
            <Card 
              key={article.id} 
              className="group relative overflow-hidden border-border/50 bg-card hover:bg-card/80 transition-all duration-500 hover:shadow-2xl hover:shadow-primary/10 hover:-translate-y-2"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              
              <div className="relative aspect-[4/3] bg-gradient-to-br from-muted to-muted/50 overflow-hidden">
                {article.image ? (
                  <img 
                    src={article.image} 
                    alt={article.name} 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out" 
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="p-6 rounded-full bg-background/50 backdrop-blur-sm group-hover:scale-110 transition-transform duration-500">
                      <ImageIcon className="h-10 w-10 text-muted-foreground" />
                    </div>
                  </div>
                )}
                
                <div className="absolute top-3 left-3">
                  <Badge 
                    variant="secondary" 
                    className="bg-background/80 backdrop-blur-md border-0 shadow-lg group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300"
                  >
                    {article.category}
                  </Badge>
                </div>

                <div className="absolute top-3 right-3">
                  <Badge 
                    variant={article.status === 'active' ? 'default' : 'secondary'}
                    className={`${article.status === 'active' 
                      ? 'bg-success/90 hover:bg-success shadow-lg shadow-success/25' 
                      : 'bg-muted'} transition-all duration-300`}
                  >
                    {article.status === 'active' ? 'Actif' : 'Inactif'}
                  </Badge>
                </div>

                {article.stock <= article.min_stock && (
                  <div className="absolute bottom-3 right-3 animate-pulse">
                    <Badge variant="destructive" className="bg-warning text-warning-foreground shadow-lg">
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      Stock faible
                    </Badge>
                  </div>
                )}
              </div>
              
              <CardContent className="relative p-5 space-y-4">
                <div>
                  <h3 className="font-bold text-lg group-hover:text-primary transition-colors duration-300 line-clamp-1">
                    {article.name}
                  </h3>
                  <p className="text-sm text-muted-foreground font-mono">
                    {article.sku}
                  </p>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl bg-muted/50 group-hover:bg-primary/10 transition-colors duration-300">
                    <p className="text-xs text-muted-foreground mb-1">Prix vente</p>
                    <p className="font-bold text-primary text-lg">
                      {article.sell_price.toLocaleString()}
                      <span className="text-xs font-normal ml-1">FCFA</span>
                    </p>
                  </div>
                  <div className={`p-3 rounded-xl transition-colors duration-300 ${
                    article.stock <= article.min_stock 
                      ? 'bg-warning/10 group-hover:bg-warning/20' 
                      : 'bg-muted/50 group-hover:bg-success/10'
                  }`}>
                    <p className="text-xs text-muted-foreground mb-1">En stock</p>
                    <p className={`font-bold text-lg ${
                      article.stock <= article.min_stock ? 'text-warning' : 'text-success'
                    }`}>
                      {article.stock}
                      <span className="text-xs font-normal ml-1">{article.unit}</span>
                    </p>
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1 group/btn border-border/50 hover:border-primary hover:bg-primary hover:text-primary-foreground transition-all duration-300"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEdit(article);
                    }}
                  >
                    <Edit className="h-4 w-4 mr-2 group-hover/btn:rotate-12 transition-transform duration-300" />
                    Modifier
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="border-border/50 hover:border-destructive hover:bg-destructive hover:text-destructive-foreground transition-all duration-300 group/del"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(article);
                    }}
                  >
                    <Trash2 className="h-4 w-4 group-hover/del:scale-110 transition-transform duration-300" />
                  </Button>
                </div>
              </CardContent>

              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out" />
              </div>
            </Card>
          ))}
        </div>
      ) : (
        // Table View
        <Card className="border-border/50 overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50 hover:bg-muted/50">
                  <TableHead className="w-[80px]">Image</TableHead>
                  <TableHead>Article</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Catégorie</TableHead>
                  <TableHead className="text-right">Prix achat</TableHead>
                  <TableHead className="text-right">Prix vente</TableHead>
                  <TableHead className="text-right">Stock</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedArticles.map((article, index) => (
                  <TableRow 
                    key={article.id}
                    className="group hover:bg-muted/30 transition-colors duration-200"
                    style={{ animationDelay: `${index * 30}ms` }}
                  >
                    <TableCell>
                      <div className="w-12 h-12 rounded-lg overflow-hidden bg-muted flex items-center justify-center group-hover:shadow-md transition-shadow duration-300">
                        {article.image ? (
                          <img 
                            src={article.image} 
                            alt={article.name} 
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" 
                          />
                        ) : (
                          <ImageIcon className="h-5 w-5 text-muted-foreground" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-medium group-hover:text-primary transition-colors duration-200">
                          {article.name}
                        </span>
                        {article.stock <= article.min_stock && (
                          <AlertTriangle className="h-4 w-4 text-warning animate-pulse" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <code className="text-xs bg-muted px-2 py-1 rounded font-mono">
                        {article.sku}
                      </code>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-normal">
                        {article.category}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {article.buy_price.toLocaleString()} <span className="text-muted-foreground text-xs">FCFA</span>
                    </TableCell>
                    <TableCell className="text-right font-bold text-primary">
                      {article.sell_price.toLocaleString()} <span className="text-muted-foreground text-xs font-normal">FCFA</span>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className={`font-bold ${
                        article.stock <= article.min_stock ? 'text-warning' : 'text-success'
                      }`}>
                        {article.stock}
                      </span>
                      <span className="text-muted-foreground text-xs ml-1">{article.unit}</span>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={article.status === 'active' ? 'default' : 'secondary'}
                        className={article.status === 'active' ? 'bg-success/90' : ''}
                      >
                        {article.status === 'active' ? 'Actif' : 'Inactif'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <Button 
                          variant="ghost" 
                          size="icon"
                          className="h-8 w-8 hover:bg-primary/10 hover:text-primary"
                          onClick={() => handleEdit(article)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive"
                          onClick={() => handleDelete(article)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}

      {/* Pagination */}
      {filteredArticles.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Afficher</span>
            <Select
              value={itemsPerPage.toString()}
              onValueChange={(value) => {
                setItemsPerPage(Number(value));
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="w-[80px] h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ITEMS_PER_PAGE_OPTIONS.map((option) => (
                  <SelectItem key={option} value={option.toString()}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span>par page</span>
            <span className="mx-2">•</span>
            <span>
              {startIndex + 1}-{Math.min(startIndex + itemsPerPage, filteredArticles.length)} sur {filteredArticles.length}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              className="hidden sm:flex"
            >
              Début
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                
                return (
                  <Button
                    key={pageNum}
                    variant={currentPage === pageNum ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setCurrentPage(pageNum)}
                    className={`h-9 w-9 ${currentPage === pageNum ? 'shadow-md' : ''}`}
                  >
                    {pageNum}
                  </Button>
                );
              })}
            </div>

            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9"
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
              className="hidden sm:flex"
            >
              Fin
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
