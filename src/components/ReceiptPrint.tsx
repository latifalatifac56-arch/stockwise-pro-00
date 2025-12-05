import { useEffect, useState } from 'react';
import { getDB, Sale, Settings } from '@/lib/db';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface ReceiptPrintProps {
  saleId: number;
  onClose: () => void;
}

export function ReceiptPrint({ saleId, onClose }: ReceiptPrintProps) {
  const [sale, setSale] = useState<Sale | null>(null);
  const [settings, setSettings] = useState<Settings | null>(null);

  useEffect(() => {
    loadData();
  }, [saleId]);

  async function loadData() {
    const db = await getDB();
    const saleData = await db.get('sales', saleId);
    const settingsData = await db.getAll('settings');
    
    setSale(saleData || null);
    setSettings(settingsData[0] || null);

    // Auto print after loading
    setTimeout(() => {
      window.print();
      onClose();
    }, 500);
  }

  if (!sale || !settings) return null;

  return (
    <div className="print-only fixed inset-0 bg-white z-50 overflow-auto">
      <div className="max-w-sm mx-auto p-8 font-mono text-sm">
        {/* Header */}
        <div className="text-center mb-6">
          {settings.logo && (
            <img src={settings.logo} alt="Logo" className="h-16 mx-auto mb-2" />
          )}
          <h1 className="text-xl font-bold">{settings.companyName}</h1>
          <p className="text-xs mt-2">REÇU DE VENTE</p>
        </div>

        {/* Invoice Info */}
        <div className="border-t border-b border-gray-300 py-3 mb-4 text-xs">
          <div className="flex justify-between mb-1">
            <span>Facture:</span>
            <span className="font-bold">{sale.invoiceNumber}</span>
          </div>
          <div className="flex justify-between mb-1">
            <span>Date:</span>
            <span>{format(new Date(sale.createdAt), 'dd/MM/yyyy HH:mm', { locale: fr })}</span>
          </div>
          <div className="flex justify-between">
            <span>Paiement:</span>
            <span className="uppercase">
              {sale.paymentMethod === 'cash' && 'ESPÈCES'}
              {sale.paymentMethod === 'tmoney' && 'TMONEY'}
              {sale.paymentMethod === 'flooz' && 'FLOOZ'}
              {sale.paymentMethod === 'card' && 'CARTE'}
              {sale.paymentMethod === 'credit' && 'CRÉDIT'}
            </span>
          </div>
        </div>

        {/* Items */}
        <div className="mb-4">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-gray-300">
                <th className="text-left py-2">Article</th>
                <th className="text-center">Qté</th>
                <th className="text-right">Prix</th>
                <th className="text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {sale.items.map((item, idx) => (
                <tr key={idx} className="border-b border-gray-200">
                  <td className="py-2">{item.name}</td>
                  <td className="text-center">{item.quantity}</td>
                  <td className="text-right">{item.price.toLocaleString()}</td>
                  <td className="text-right font-semibold">{item.total.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="border-t border-gray-300 pt-3 mb-4 text-xs">
          <div className="flex justify-between mb-2">
            <span>Sous-total:</span>
            <span>{sale.subtotal.toLocaleString()} {settings.currency}</span>
          </div>
          <div className="flex justify-between mb-2">
            <span>TVA ({settings.taxRate}%):</span>
            <span>{sale.tax.toLocaleString()} {settings.currency}</span>
          </div>
          {sale.discount > 0 && (
            <div className="flex justify-between mb-2 text-destructive">
              <span>Réduction:</span>
              <span>-{sale.discount.toLocaleString()} {settings.currency}</span>
            </div>
          )}
          <div className="flex justify-between text-base font-bold border-t border-gray-300 pt-2">
            <span>TOTAL:</span>
            <span>{sale.total.toLocaleString()} {settings.currency}</span>
          </div>
        </div>

        {/* Footer */}
        {settings.receiptFooter && (
          <div className="text-center text-xs border-t border-gray-300 pt-3 mt-4">
            {settings.receiptFooter}
          </div>
        )}

        <div className="text-center text-xs mt-4">
          <p>Merci de votre visite!</p>
        </div>
      </div>

      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print-only, .print-only * {
            visibility: visible;
          }
          .print-only {
            position: fixed;
            left: 0;
            top: 0;
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
}
