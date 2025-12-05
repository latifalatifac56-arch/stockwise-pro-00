import { Button } from '@/components/ui/button';
import { MessageCircle } from 'lucide-react';

interface WhatsAppButtonProps {
  phone: string;
  message?: string;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
  children?: React.ReactNode;
}

export function WhatsAppButton({ 
  phone, 
  message, 
  variant = 'outline', 
  size = 'sm',
  className = '',
  children 
}: WhatsAppButtonProps) {
  const handleClick = () => {
    // Clean phone number (remove spaces, dashes, etc.)
    let cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
    
    // Add Togo country code if not present
    if (!cleanPhone.startsWith('+') && !cleanPhone.startsWith('228')) {
      cleanPhone = '228' + cleanPhone;
    }
    if (cleanPhone.startsWith('+')) {
      cleanPhone = cleanPhone.substring(1);
    }
    
    const encodedMessage = message ? encodeURIComponent(message) : '';
    const url = encodedMessage 
      ? `https://wa.me/${cleanPhone}?text=${encodedMessage}`
      : `https://wa.me/${cleanPhone}`;
    
    window.open(url, '_blank');
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleClick}
      className={`text-green-600 hover:text-green-700 hover:bg-green-50 ${className}`}
    >
      <MessageCircle className="h-4 w-4" />
      {children && <span className="ml-2">{children}</span>}
    </Button>
  );
}

// Utility function for generating WhatsApp links
export function generateWhatsAppLink(phone: string, message?: string): string {
  let cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
  
  if (!cleanPhone.startsWith('+') && !cleanPhone.startsWith('228')) {
    cleanPhone = '228' + cleanPhone;
  }
  if (cleanPhone.startsWith('+')) {
    cleanPhone = cleanPhone.substring(1);
  }
  
  const encodedMessage = message ? encodeURIComponent(message) : '';
  return encodedMessage 
    ? `https://wa.me/${cleanPhone}?text=${encodedMessage}`
    : `https://wa.me/${cleanPhone}`;
}

// Common message templates for Togolese business
export const whatsappTemplates = {
  orderConfirmation: (orderNumber: string, total: number) => 
    `Bonjour! Votre commande N°${orderNumber} d'un montant de ${total.toLocaleString()} FCFA a été confirmée. Merci pour votre confiance!`,
  
  deliveryNotification: (address: string) => 
    `Bonjour! Votre commande est en route vers ${address}. Notre livreur vous contactera à son arrivée.`,
  
  paymentReminder: (amount: number, dueDate: string) => 
    `Bonjour! Petit rappel: un paiement de ${amount.toLocaleString()} FCFA est dû le ${dueDate}. Merci de régulariser votre situation.`,
  
  stockAlert: (productName: string) => 
    `Bonjour! Le produit "${productName}" que vous avez commandé est maintenant disponible. Passez votre commande!`,
  
  thankYou: () => 
    `Merci pour votre achat! Nous espérons vous revoir très bientôt. À bientôt!`,
};
