import * as XLSX from 'xlsx';
import { Sale, Expense, WastageRecord, Product } from '../types/grocery';

export interface ReportFinancialSummary {
  periodLabel: string;
  startDate: string;
  endDate: string;
  revenue: number;
  cogs: number;
  grossProfit: number;
  grossMarginPct: number;
  totalExpenses: number;
  totalWastageLoss: number;
  netProfit: number;
  netMarginPct: number;
  cashCollected: number;
  mpesaCollected: number;
  creditIssued: number;
  totalTransactions: number;
  totalOutstandingCredit: number;
  totalSupplierPayables: number;
}

export class ExcelExportService {
  /**
   * Generates a comprehensive multi-sheet Excel workbook
   */
  static exportFinancialReport(
    summary: ReportFinancialSummary,
    sales: Sale[],
    expenses: Expense[],
    wastage: WastageRecord[],
    products: Product[]
  ): void {
    const wb = XLSX.utils.book_new();

    // ----------------------------------------------------
    // SHEET 1: EXECUTIVE P&L SUMMARY
    // ----------------------------------------------------
    const summaryData = [
      ['MBUIKAS GROCERY - FINANCIAL PROFIT & LOSS REPORT'],
      ['Store Branch: Nairobi (Thika Road Commercial Center)'],
      ['KRA PIN: P051234567Z | Currency: KES (Kenya Shillings)'],
      ['Period:', summary.periodLabel, `(${summary.startDate} to ${summary.endDate})`],
      ['Generated On:', new Date().toLocaleString()],
      [],
      ['PROFIT & LOSS BREAKDOWN', 'AMOUNT (KSH)', 'FORMULA / NOTES'],
      ['1. Total Gross Revenue', summary.revenue, 'Sales completed − Returns − Discounts'],
      ['2. Cost of Goods Sold (COGS)', summary.cogs, 'Acquisition cost of items sold (FEFO batches)'],
      ['3. GROSS PROFIT', summary.grossProfit, 'Gross Revenue − COGS'],
      ['4. Gross Margin %', `${summary.grossMarginPct.toFixed(2)}%`, '(Gross Profit / Gross Revenue) * 100'],
      ['5. Operating Expenses', summary.totalExpenses, 'Rent, Electricity, Transport, Salaries, Packaging'],
      ['6. Spoilage & Wastage Loss', summary.totalWastageLoss, 'Damaged, expired, rotten stock at cost value'],
      ['7. NET PROFIT', summary.netProfit, 'Gross Profit − Operating Expenses − Spoilage Loss'],
      ['8. Net Profit Margin %', `${summary.netMarginPct.toFixed(2)}%`, '(Net Profit / Gross Revenue) * 100'],
      [],
      ['PAYMENT METHOD RECONCILIATION', 'AMOUNT (KSH)', 'COUNT'],
      ['Cash Collections', summary.cashCollected, ''],
      ['M-Pesa Collections (Daraja)', summary.mpesaCollected, ''],
      ['Credit Issued (Mkopo)', summary.creditIssued, 'Pending customer settlement'],
      ['Total Transactions', summary.totalTransactions, ''],
      [],
      ['BALANCE SHEET SNAPSHOT (ACCRUAL AUDIT)', 'AMOUNT (KSH)', 'AUDIT NOTE'],
      ['Money Owed to Shop (Customer Mkopo)', summary.totalOutstandingCredit, 'Active debt book receivables'],
      ['Money Owed by Shop (Supplier Payables)', summary.totalSupplierPayables, 'Outstanding supplier invoices']
    ];

    const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);

    // Set column widths
    wsSummary['!cols'] = [{ wch: 38 }, { wch: 20 }, { wch: 45 }];

    XLSX.utils.book_append_sheet(wb, wsSummary, 'P&L Summary');

    // ----------------------------------------------------
    // SHEET 2: ITEMIZED SALES
    // ----------------------------------------------------
    const salesHeader = [
      'Receipt #',
      'Date & Time',
      'Items Count',
      'Payment Method',
      'Grand Total (KSh)',
      'Total COGS (KSh)',
      'Gross Profit (KSh)',
      'Cashier',
      'Customer',
      'Status'
    ];

    const salesRows = sales.map((s) => [
      s.receiptNumber,
      new Date(s.date).toLocaleString(),
      s.items.reduce((acc, it) => acc + it.quantity, 0),
      s.paymentMethod.toUpperCase(),
      s.grandTotal,
      s.totalCost,
      s.grossProfit,
      s.cashierName,
      s.customerName || 'Walk-in',
      s.status.toUpperCase()
    ]);

    const wsSales = XLSX.utils.aoa_to_sheet([salesHeader, ...salesRows]);
    wsSales['!cols'] = [
      { wch: 22 },
      { wch: 20 },
      { wch: 12 },
      { wch: 16 },
      { wch: 18 },
      { wch: 18 },
      { wch: 18 },
      { wch: 18 },
      { wch: 22 },
      { wch: 12 }
    ];
    XLSX.utils.book_append_sheet(wb, wsSales, 'Sales Detail');

    // ----------------------------------------------------
    // SHEET 3: OPERATING EXPENSES & WASTAGE
    // ----------------------------------------------------
    const expensesHeader = [
      'Date',
      'Category',
      'Description',
      'Amount (KSh)',
      'Payment Method',
      'Receipt / Ref',
      'Recorded By'
    ];

    const expenseRows = expenses.map((e) => [
      e.date,
      e.category.toUpperCase(),
      e.description,
      e.amount,
      e.paymentMethod.toUpperCase(),
      e.receiptRef || '-',
      e.recordedBy
    ]);

    const wsExpenses = XLSX.utils.aoa_to_sheet([expensesHeader, ...expenseRows]);
    wsExpenses['!cols'] = [
      { wch: 14 },
      { wch: 18 },
      { wch: 35 },
      { wch: 16 },
      { wch: 16 },
      { wch: 20 },
      { wch: 18 }
    ];
    XLSX.utils.book_append_sheet(wb, wsExpenses, 'Expenses');

    // ----------------------------------------------------
    // SHEET 4: INVENTORY VALUATION
    // ----------------------------------------------------
    const inventoryHeader = [
      'Product Name',
      'Category',
      'Stock Qty',
      'Unit',
      'Cost Price (KSh)',
      'Selling Price (KSh)',
      'Stock Value @ Cost (KSh)',
      'Stock Value @ Retail (KSh)',
      'Potential Margin (KSh)'
    ];

    const inventoryRows = products.map((p) => {
      const valCost = p.currentStock * p.costPrice;
      const valRetail = p.currentStock * p.sellingPrice;
      return [
        p.name,
        p.category,
        p.currentStock,
        p.unit,
        p.costPrice,
        p.sellingPrice,
        valCost,
        valRetail,
        valRetail - valCost
      ];
    });

    const wsInventory = XLSX.utils.aoa_to_sheet([inventoryHeader, ...inventoryRows]);
    wsInventory['!cols'] = [
      { wch: 32 },
      { wch: 20 },
      { wch: 12 },
      { wch: 10 },
      { wch: 16 },
      { wch: 18 },
      { wch: 24 },
      { wch: 24 },
      { wch: 22 }
    ];
    XLSX.utils.book_append_sheet(wb, wsInventory, 'Inventory Valuation');

    // Generate filename and trigger download
    const filename = `Mbuikas_Grocery_${summary.periodLabel.replace(/\s+/g, '_')}_Report_${new Date().toISOString().slice(0, 10)}.xlsx`;
    XLSX.writeFile(wb, filename);
  }
}
