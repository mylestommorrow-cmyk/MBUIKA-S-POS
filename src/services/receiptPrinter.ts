import { Sale, StoreSettings } from '../types/grocery';

export class ReceiptPrinterService {
  /**
   * Generates WhatsApp direct share URL with formatted receipt text
   */
  static generateWhatsAppShareUrl(sale: Sale, settings: StoreSettings, customerPhone?: string): string {
    const itemsList = sale.items
      .map(
        (it) =>
          `• ${it.productName} (${it.quantity}${it.unit === 'kg' ? 'kg' : 'x'} @ KSh ${it.finalPrice}) = KSh ${it.lineTotal.toLocaleString()}`
      )
      .join('\n');

    const message = `*${settings.storeName.toUpperCase()}*\n` +
      `${settings.tagline}\n` +
      `Tel: ${settings.phone} | KRA PIN: ${settings.kraPin}\n` +
      `--------------------------------\n` +
      `Receipt: ${sale.receiptNumber}\n` +
      `Date: ${new Date(sale.date).toLocaleString()}\n` +
      `Cashier: ${sale.cashierName}\n` +
      `--------------------------------\n` +
      `*ITEMS PURCHASED:*\n` +
      `${itemsList}\n` +
      `--------------------------------\n` +
      `*GRAND TOTAL: KSh ${sale.grandTotal.toLocaleString()}*\n` +
      `Payment: ${sale.paymentMethod.toUpperCase()}` +
      (sale.paymentDetails.mpesaReceipt ? ` (Ref: ${sale.paymentDetails.mpesaReceipt})` : '') +
      (sale.paymentDetails.changeGiven ? `\nChange: KSh ${sale.paymentDetails.changeGiven}` : '') +
      `\n--------------------------------\n` +
      (settings.enableEtims && sale.kraETimsNumber ? `eTIMS Inv: ${sale.kraETimsNumber}\n` : '') +
      `Asante sana kwa kununua nasi! Welcome again!`;

    const encoded = encodeURIComponent(message);
    const targetPhone = customerPhone ? customerPhone.replace(/[^0-9]/g, '') : '';
    return targetPhone
      ? `https://wa.me/${targetPhone}?text=${encoded}`
      : `https://wa.me/?text=${encoded}`;
  }

  /**
   * Trigger browser thermal printing
   */
  static printThermalReceipt(): void {
    window.print();
  }
}
