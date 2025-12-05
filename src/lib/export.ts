import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Tables } from '@/integrations/supabase/types';

type Article = Tables<'articles'>;

export async function exportArticlesToExcel(articles: Article[]) {
  const data = articles.map(article => ({
    SKU: article.sku,
    Nom: article.name,
    Description: article.description || '',
    Catégorie: article.category,
    Type: article.type,
    'Prix Achat': article.buy_price,
    'Prix Vente': article.sell_price,
    'Prix Gros': article.wholesale_price || '',
    Unité: article.unit,
    Stock: article.stock,
    'Stock Min': article.min_stock,
    Statut: article.status,
    'Date Création': article.created_at ? format(new Date(article.created_at), 'dd/MM/yyyy', { locale: fr }) : ''
  }));

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Articles');
  
  XLSX.writeFile(wb, `articles_${format(new Date(), 'yyyyMMdd_HHmmss')}.xlsx`);
}

export async function exportSalesToExcel(sales: any[]) {
  const data = sales.map(sale => ({
    'N° Facture': sale.invoice_number || sale.invoiceNumber,
    Date: sale.created_at ? format(new Date(sale.created_at), 'dd/MM/yyyy HH:mm', { locale: fr }) : '',
    'Sous-total': sale.subtotal,
    Remise: sale.discount,
    Taxe: sale.tax,
    Total: sale.total,
    'Mode Paiement': sale.payment_method || sale.paymentMethod,
    Statut: sale.status
  }));

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Ventes');
  
  XLSX.writeFile(wb, `ventes_${format(new Date(), 'yyyyMMdd_HHmmss')}.xlsx`);
}

export async function exportClientsToExcel(clients: any[]) {
  const data = clients.map(client => ({
    Nom: client.name,
    Téléphone: client.phone || '',
    Email: client.email || '',
    Adresse: client.address || '',
    Pays: client.country || '',
    Type: client.type,
    'Limite Crédit': client.credit_limit || client.creditLimit,
    Solde: client.balance,
    'Date Création': client.created_at ? format(new Date(client.created_at), 'dd/MM/yyyy', { locale: fr }) : ''
  }));

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Clients');
  
  XLSX.writeFile(wb, `clients_${format(new Date(), 'yyyyMMdd_HHmmss')}.xlsx`);
}

export async function exportSuppliersToExcel(suppliers: any[]) {
  const data = suppliers.map(supplier => ({
    Nom: supplier.name,
    Téléphone: supplier.phone || '',
    Email: supplier.email || '',
    WhatsApp: supplier.whatsapp || '',
    Adresse: supplier.address || '',
    Pays: supplier.country || '',
    'Conditions Paiement': supplier.payment_terms || supplier.paymentTerms || '',
    Solde: supplier.balance,
    Statut: supplier.status,
    'Date Création': supplier.created_at ? format(new Date(supplier.created_at), 'dd/MM/yyyy', { locale: fr }) : ''
  }));

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Fournisseurs');
  
  XLSX.writeFile(wb, `fournisseurs_${format(new Date(), 'yyyyMMdd_HHmmss')}.xlsx`);
}

export async function exportExpensesToExcel(expenses: any[]) {
  const data = expenses.map(expense => ({
    Catégorie: expense.category,
    Montant: expense.amount,
    Description: expense.description,
    Date: expense.date ? format(new Date(expense.date), 'dd/MM/yyyy', { locale: fr }) : ''
  }));

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Dépenses');
  
  XLSX.writeFile(wb, `depenses_${format(new Date(), 'yyyyMMdd_HHmmss')}.xlsx`);
}

export async function exportInventoryToPDF(articles: Article[], companyName: string = 'Mon Entreprise') {
  const doc = new jsPDF();
  
  // En-tête
  doc.setFontSize(18);
  doc.text(companyName, 14, 20);
  doc.setFontSize(12);
  doc.text('Rapport d\'Inventaire', 14, 30);
  doc.setFontSize(10);
  doc.text(format(new Date(), 'dd/MM/yyyy HH:mm', { locale: fr }), 14, 36);

  // Tableau
  const tableData = articles.map(article => [
    article.sku,
    article.name,
    article.category,
    article.stock,
    `${article.sell_price} FCFA`,
    `${article.stock * article.sell_price} FCFA`
  ]);

  autoTable(doc, {
    head: [['SKU', 'Article', 'Catégorie', 'Stock', 'Prix Unit.', 'Valeur']],
    body: tableData,
    startY: 45,
    styles: { fontSize: 8 },
    headStyles: { fillColor: [59, 130, 246] }
  });

  // Total
  const totalValue = articles.reduce((sum, a) => sum + (a.stock * a.sell_price), 0);
  const finalY = (doc as any).lastAutoTable.finalY || 45;
  doc.setFontSize(12);
  doc.text(`Valeur totale du stock: ${totalValue.toLocaleString('fr-FR')} FCFA`, 14, finalY + 10);

  doc.save(`inventaire_${format(new Date(), 'yyyyMMdd_HHmmss')}.pdf`);
}

export async function exportSalesReportToPDF(
  sales: any[], 
  startDate: Date,
  endDate: Date,
  companyName: string = 'Mon Entreprise'
) {
  const doc = new jsPDF();
  
  // En-tête
  doc.setFontSize(18);
  doc.text(companyName, 14, 20);
  doc.setFontSize(12);
  doc.text('Rapport de Ventes', 14, 30);
  doc.setFontSize(10);
  doc.text(
    `Période: ${format(startDate, 'dd/MM/yyyy', { locale: fr })} - ${format(endDate, 'dd/MM/yyyy', { locale: fr })}`,
    14,
    36
  );

  // Statistiques
  const totalSales = sales.reduce((sum, s) => sum + s.total, 0);

  doc.setFontSize(10);
  doc.text(`Nombre de ventes: ${sales.length}`, 14, 45);
  doc.text(`Chiffre d'affaires: ${totalSales.toLocaleString('fr-FR')} FCFA`, 14, 52);

  // Tableau des ventes
  const tableData = sales.slice(0, 50).map(sale => [
    sale.invoice_number || sale.invoiceNumber,
    sale.created_at ? format(new Date(sale.created_at), 'dd/MM/yyyy', { locale: fr }) : '',
    `${sale.total} FCFA`,
    sale.payment_method || sale.paymentMethod
  ]);

  autoTable(doc, {
    head: [['N° Facture', 'Date', 'Total', 'Paiement']],
    body: tableData,
    startY: 60,
    styles: { fontSize: 8 },
    headStyles: { fillColor: [59, 130, 246] }
  });

  doc.save(`rapport_ventes_${format(new Date(), 'yyyyMMdd_HHmmss')}.pdf`);
}
