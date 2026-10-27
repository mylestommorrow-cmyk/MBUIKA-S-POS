import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Sale, Expense, WastageRecord } from '../types/grocery';
import { ReportFinancialSummary } from './excelExport';

export class PdfExportService {
  static exportFinancialReport(
    summary: ReportFinancialSummary,
    sales: Sale[],
    expenses: Expense[],
    wastage: WastageRecord[]
  ): void {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const pageWidth = doc.internal.pageSize.getWidth();

    // 1. Header Banner
    doc.setFillColor(21, 128, 61); // Emerald green #15803d
    doc.rect(0, 0, pageWidth, 24, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text('MBUIKAS GROCERY - FINANCIAL PROFIT & LOSS REPORT', 14, 11);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text('Fresh Produce & Retail Store | KRA PIN: P051234567Z | Nairobi, Kenya', 14, 18);

    // 2. Metadata Subheader
    doc.setTextColor(30, 41, 59);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(`Reporting Period: ${summary.periodLabel.toUpperCase()}`, 14, 32);
    doc.setFont('helvetica', 'normal');
    doc.text(`Dates: ${summary.startDate} to ${summary.endDate}`, 14, 38);
    doc.text(`Generated On: ${new Date().toLocaleString()}`, 14, 44);

    // 3. KPI Summary Grid
    const startY = 48;
    const colWidth = (pageWidth - 28) / 4;

    const kpiBoxes = [
      { label: 'TOTAL REVENUE', value: `KSh ${summary.revenue.toLocaleString()}`, color: [240, 253, 244], border: [34, 197, 94] },
      { label: 'TOTAL COGS', value: `KSh ${summary.cogs.toLocaleString()}`, color: [248, 250, 252], border: [203, 213, 225] },
      { label: 'GROSS PROFIT', value: `KSh ${summary.grossProfit.toLocaleString()} (${summary.grossMarginPct.toFixed(1)}%)`, color: [238, 242, 255], border: [99, 102, 241] },
      { label: 'NET PROFIT', value: `KSh ${summary.netProfit.toLocaleString()} (${summary.netMarginPct.toFixed(1)}%)`, color: [236, 253, 245], border: [16, 185, 129] }
    ];

    kpiBoxes.forEach((kpi, idx) => {
      const x = 14 + idx * colWidth;
      doc.setFillColor(kpi.color[0], kpi.color[1], kpi.color[2]);
      doc.setDrawColor(kpi.border[0], kpi.border[1], kpi.border[2]);
      doc.roundedRect(x, startY, colWidth - 2, 18, 1, 1, 'FD');

      doc.setFontSize(7.5);
      doc.setTextColor(100, 116, 139);
      doc.setFont('helvetica', 'bold');
      doc.text(kpi.label, x + 3, startY + 5);

      doc.setFontSize(10);
      doc.setTextColor(15, 23, 42);
      doc.text(kpi.value, x + 3, startY + 12);
    });

    // 4. Detailed P&L Statement Table
    autoTable(doc, {
      startY: 72,
      head: [['Metric / Account Line', 'Amount (KES)', 'Accounting Formula & Explanation']],
      body: [
        ['Total Gross Revenue', `KSh ${summary.revenue.toLocaleString()}`, 'Total sales − Returns − Discounts'],
        ['Cost of Goods Sold (COGS)', `KSh ${summary.cogs.toLocaleString()}`, 'Direct batch acquisition cost of sold items'],
        ['Gross Profit', `KSh ${summary.grossProfit.toLocaleString()}`, 'Revenue − COGS'],
        ['Gross Margin %', `${summary.grossMarginPct.toFixed(2)}%`, '(Gross Profit / Revenue) * 100'],
        ['Operating Expenses', `KSh ${summary.totalExpenses.toLocaleString()}`, 'Rent, electricity, transport, salaries, licenses'],
        ['Spoilage & Wastage Losses', `KSh ${summary.totalWastageLoss.toLocaleString()}`, 'Expired, rotten, damaged goods at cost'],
        ['NET PROFIT', `KSh ${summary.netProfit.toLocaleString()}`, 'Gross Profit − Expenses − Spoilage Loss'],
        ['Net Margin %', `${summary.netMarginPct.toFixed(2)}%`, '(Net Profit / Revenue) * 100'],
        ['Cash Collections', `KSh ${summary.cashCollected.toLocaleString()}`, 'Physical cash in drawer'],
        ['M-Pesa Collections', `KSh ${summary.mpesaCollected.toLocaleString()}`, 'Verified Lipa na M-Pesa receipts'],
        ['Customer Mkopo Issued', `KSh ${summary.creditIssued.toLocaleString()}`, 'Unpaid sales pending collection'],
        ['Total Outstanding Credit', `KSh ${summary.totalOutstandingCredit.toLocaleString()}`, 'Total money owed to shop by credit customers'],
        ['Supplier Payables', `KSh ${summary.totalSupplierPayables.toLocaleString()}`, 'Total money owed by shop to suppliers']
      ],
      theme: 'grid',
      headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8.5 },
      bodyStyles: { fontSize: 8, textColor: [51, 65, 85] },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      margin: { left: 14, right: 14 }
    });

    // 5. Recent Transactions Summary
    const finalY = (doc as any).lastAutoTable ? (doc as any).lastAutoTable.finalY + 10 : 160;

    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 41, 59);
    doc.text('Key Sales Transactions in Selected Range', 14, finalY);

    const tableSales = sales.slice(0, 10).map((s) => [
      s.receiptNumber,
      new Date(s.date).toLocaleDateString() + ' ' + new Date(s.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      s.paymentMethod.toUpperCase(),
      `KSh ${s.grandTotal.toLocaleString()}`,
      `KSh ${s.grossProfit.toLocaleString()}`,
      s.cashierName
    ]);

    autoTable(doc, {
      startY: finalY + 4,
      head: [['Receipt #', 'Date & Time', 'Method', 'Total', 'Profit', 'Cashier']],
      body: tableSales,
      theme: 'striped',
      headStyles: { fillColor: [21, 128, 61], textColor: [255, 255, 255], fontSize: 8 },
      bodyStyles: { fontSize: 7.5 },
      margin: { left: 14, right: 14 }
    });

    // Footer with Page Numbers
    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text(
        `MBUIKAS GROCERY POS • Confidential Owner Report • Page ${i} of ${pageCount}`,
        pageWidth / 2,
        288,
        { align: 'center' }
      );
    }

    doc.save(`Mbuikas_Report_${summary.periodLabel}_${new Date().toISOString().slice(0, 10)}.pdf`);
  }
}
