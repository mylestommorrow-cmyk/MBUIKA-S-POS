import React, { useState } from 'react';
import { Printer, Share2, Download, X, QrCode, Check } from 'lucide-react';
import { Sale } from '../../types/grocery';
import { useStore } from '../../context/StoreContext';
import { ReceiptPrinterService } from '../../services/receiptPrinter';
import { jsPDF } from 'jspdf';

interface ReceiptModalProps {
  sale: Sale | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({ sale, isOpen, onClose }) => {
  const { settings } = useStore();
  const [paperWidth, setPaperWidth] = useState<'80mm' | '58mm'>(settings.printerType || '80mm');
  const [copiedLink, setCopiedLink] = useState(false);

  if (!isOpen || !sale) return null;

  const handlePrint = () => {
    ReceiptPrinterService.printThermalReceipt();
  };

  const handleWhatsAppShare = () => {
    const url = ReceiptPrinterService.generateWhatsAppShareUrl(
      sale,
      settings,
      sale.paymentDetails.mpesaPhone
    );
    window.open(url, '_blank');
  };

  const handleDownloadPdf = () => {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: [80, 200] // Thermal receipt dimensions
    });

    doc.setFont('courier', 'bold');
    doc.setFontSize(11);
    doc.text(settings.storeName, 40, 10, { align: 'center' });

    doc.setFont('courier', 'normal');
    doc.setFontSize(7.5);
    doc.text(settings.tagline, 40, 15, { align: 'center' });
    doc.text(settings.address, 40, 19, { align: 'center' });
    doc.text(`Tel: ${settings.phone}`, 40, 23, { align: 'center' });
    doc.text(`KRA PIN: ${settings.kraPin}`, 40, 27, { align: 'center' });

    if (settings.enableEtims && sale.kraETimsNumber) {
      doc.text(`eTIMS: ${sale.kraETimsNumber}`, 40, 31, { align: 'center' });
    }

    doc.text('------------------------------------------', 40, 35, { align: 'center' });
    doc.text(`Receipt: ${sale.receiptNumber}`, 5, 40);
    doc.text(`Date: ${new Date(sale.date).toLocaleString()}`, 5, 44);
    doc.text(`Cashier: ${sale.cashierName}`, 5, 48);
    if (sale.customerName) {
      doc.text(`Customer: ${sale.customerName}`, 5, 52);
    }
    doc.text('------------------------------------------', 40, 56, { align: 'center' });

    let y = 61;
    sale.items.forEach((it) => {
      doc.text(`${it.productName}`, 5, y);
      y += 4;
      doc.text(
        `  ${it.quantity} x ${it.finalPrice.toFixed(2)}`,
        5,
        y
      );
      doc.text(`KSh ${it.lineTotal.toFixed(2)}`, 75, y, { align: 'right' });
      y += 5;
    });

    doc.text('------------------------------------------', 40, y, { align: 'center' });
    y += 5;

    doc.setFont('courier', 'bold');
    doc.setFontSize(9);
    doc.text('TOTAL DUE:', 5, y);
    doc.text(`KSh ${sale.grandTotal.toFixed(2)}`, 75, y, { align: 'right' });
    y += 5;

    doc.setFont('courier', 'normal');
    doc.setFontSize(7.5);
    doc.text(`Payment: ${sale.paymentMethod.toUpperCase()}`, 5, y);
    if (sale.paymentDetails.mpesaReceipt) {
      y += 4;
      doc.text(`M-Pesa Ref: ${sale.paymentDetails.mpesaReceipt}`, 5, y);
    }
    if (sale.paymentDetails.changeGiven) {
      y += 4;
      doc.text(`Change Given: KSh ${sale.paymentDetails.changeGiven.toFixed(2)}`, 5, y);
    }

    y += 8;
    doc.text('THANK YOU FOR SHOPPING WITH US!', 40, y, { align: 'center' });
    y += 4;
    doc.text('KARIBU TENA!', 40, y, { align: 'center' });

    doc.save(`Receipt_${sale.receiptNumber}.pdf`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
      <div className="w-full max-w-lg rounded-xl bg-white shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header Bar */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-slate-900 text-white shrink-0">
          <div className="flex items-center gap-2">
            <Printer className="w-4 h-4 text-emerald-400" />
            <h2 className="text-sm font-bold">Official Sales Receipt</h2>
          </div>
          <div className="flex items-center gap-2">
            {/* 58mm / 80mm Switcher */}
            <div className="flex rounded border border-slate-700 bg-slate-800 p-0.5 text-2xs">
              <button
                type="button"
                onClick={() => setPaperWidth('80mm')}
                className={`px-2 py-0.5 rounded font-bold ${
                  paperWidth === '80mm' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                80mm
              </button>
              <button
                type="button"
                onClick={() => setPaperWidth('58mm')}
                className={`px-2 py-0.5 rounded font-bold ${
                  paperWidth === '58mm' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                58mm
              </button>
            </div>
            <button onClick={onClose} className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Receipt Preview Canvas */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-100 flex justify-center">
          <div
            id="thermal-receipt"
            style={{ width: paperWidth === '80mm' ? '300px' : '230px' }}
            className="bg-white p-4 shadow-md border border-slate-300 font-mono text-2xs text-black leading-tight"
          >
            {/* Store Branding */}
            <div className="text-center mb-2 border-b border-dashed border-black pb-2">
              <h1 className="text-sm font-extrabold uppercase tracking-tight">{settings.storeName}</h1>
              <p className="text-3xs">{settings.tagline}</p>
              <p className="text-3xs">{settings.address}, {settings.city}</p>
              <p className="text-3xs">Tel: {settings.phone}</p>
              <p className="text-3xs font-bold mt-1">KRA PIN: {settings.kraPin}</p>
              {settings.enableEtims && sale.kraETimsNumber && (
                <p className="text-3xs font-semibold">eTIMS Inv: {sale.kraETimsNumber}</p>
              )}
            </div>

            {/* Receipt Metadata */}
            <div className="mb-2 text-3xs border-b border-dashed border-black pb-1.5 space-y-0.5">
              <div className="flex justify-between">
                <span>Receipt:</span>
                <span className="font-bold">{sale.receiptNumber}</span>
              </div>
              <div className="flex justify-between">
                <span>Date:</span>
                <span>{new Date(sale.date).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Cashier:</span>
                <span>{sale.cashierName}</span>
              </div>
              {sale.customerName && (
                <div className="flex justify-between">
                  <span>Customer:</span>
                  <span>{sale.customerName}</span>
                </div>
              )}
            </div>

            {/* Itemized Lines */}
            <div className="border-b border-dashed border-black pb-2 mb-2">
              <div className="flex justify-between font-bold border-b border-black pb-1 mb-1">
                <span>ITEM</span>
                <span>TOTAL</span>
              </div>
              {sale.items.map((it, idx) => (
                <div key={idx} className="mb-1">
                  <div className="font-semibold">{it.productName}</div>
                  <div className="flex justify-between text-3xs text-slate-700">
                    <span>
                      {it.quantity} {it.unit} @ {it.finalPrice.toFixed(2)}
                      {it.discountAmount > 0 && ` (Disc: -${it.discountAmount})`}
                    </span>
                    <span className="font-bold text-black font-mono">
                      {it.lineTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Financial Totals */}
            <div className="border-b border-dashed border-black pb-2 mb-2 space-y-1">
              <div className="flex justify-between text-3xs">
                <span>SUBTOTAL:</span>
                <span>KSh {sale.subtotal.toFixed(2)}</span>
              </div>
              {sale.totalDiscount > 0 && (
                <div className="flex justify-between text-3xs">
                  <span>DISCOUNT:</span>
                  <span>-KSh {sale.totalDiscount.toFixed(2)}</span>
                </div>
              )}
              {sale.taxTotal > 0 && (
                <div className="flex justify-between text-3xs text-slate-700">
                  <span>INCL. 16% VAT:</span>
                  <span>KSh {sale.taxTotal.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-xs font-bold border-t border-black pt-1">
                <span>TOTAL PAID:</span>
                <span>KSh {sale.grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
            </div>

            {/* Tender & Change */}
            <div className="border-b border-dashed border-black pb-2 mb-2 text-3xs space-y-0.5">
              <div className="flex justify-between">
                <span>PAYMENT METHOD:</span>
                <span className="font-bold">{sale.paymentMethod.toUpperCase()}</span>
              </div>
              {sale.paymentDetails.cashTendered !== undefined && (
                <div className="flex justify-between">
                  <span>CASH TENDERED:</span>
                  <span>KSh {sale.paymentDetails.cashTendered.toFixed(2)}</span>
                </div>
              )}
              {sale.paymentDetails.changeGiven !== undefined && (
                <div className="flex justify-between font-bold">
                  <span>CHANGE:</span>
                  <span>KSh {sale.paymentDetails.changeGiven.toFixed(2)}</span>
                </div>
              )}
              {sale.paymentDetails.mpesaReceipt && (
                <div className="flex justify-between">
                  <span>M-PESA REF:</span>
                  <span className="font-bold">{sale.paymentDetails.mpesaReceipt}</span>
                </div>
              )}
            </div>

            {/* eTIMS QR Code Simulation */}
            <div className="text-center my-3">
              <div className="inline-block p-1 border border-black bg-white">
                <QrCode className="w-16 h-16 mx-auto text-black" />
              </div>
              <p className="text-4xs mt-1 text-slate-700">Scan to verify KRA Tax Compliance</p>
            </div>

            {/* Footer Notice */}
            <div className="text-center text-3xs text-slate-800 space-y-0.5">
              <p className="font-bold">ASANTE KWA KUNUNUA NASI!</p>
              <p>Goods once sold in good condition are not returnable.</p>
              <p className="text-4xs">Powered by MBUIKAS POS • v2.6</p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="px-5 py-3.5 bg-white border-t border-slate-200 flex flex-wrap items-center justify-between gap-2 shrink-0">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="px-3.5 py-2 rounded-lg bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 flex items-center gap-1.5 shadow-sm"
            >
              <Printer className="w-4 h-4" />
              Print Receipt
            </button>

            <button
              type="button"
              onClick={handleDownloadPdf}
              className="px-3 py-2 rounded-lg border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50 flex items-center gap-1.5"
            >
              <Download className="w-4 h-4" />
              Save PDF
            </button>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleWhatsAppShare}
              className="px-3.5 py-2 rounded-lg bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 flex items-center gap-1.5 shadow-sm"
            >
              <Share2 className="w-4 h-4" />
              WhatsApp Customer
            </button>

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-100"
            >
              New Sale
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
