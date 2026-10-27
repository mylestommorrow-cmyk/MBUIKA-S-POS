import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  Download,
  FileSpreadsheet,
  FileText,
  Calendar,
  AlertCircle,
  HelpCircle,
  ArrowUpRight,
  ArrowDownRight,
  DollarSign,
  PieChart,
  Layers,
  Clock,
  Send,
  CheckCircle2,
  AlertTriangle,
  Receipt
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { Sale, Expense, WastageRecord, Product } from '../../types/grocery';
import { ExcelExportService, ReportFinancialSummary } from '../../services/excelExport';
import { PdfExportService } from '../../services/pdfExport';
import { ZReportModal } from './ZReportModal';

type PeriodType = 'today' | 'yesterday' | 'this_week' | 'last_week' | 'this_month' | 'last_month' | 'custom';

export const OwnerReports: React.FC = () => {
  const {
    sales,
    expenses,
    wastage,
    products,
    customers,
    suppliers,
    settings,
    shifts
  } = useStore();

  const [period, setPeriod] = useState<PeriodType>('today');
  const [customStart, setCustomStart] = useState<string>(new Date().toISOString().slice(0, 10));
  const [customEnd, setCustomEnd] = useState<string>(new Date().toISOString().slice(0, 10));
  const [activeReportTab, setActiveReportTab] = useState<'pnl' | 'payments' | 'categories' | 'products' | 'inventory' | 'spoilage' | 'tax' | 'zreports'>('pnl');

  const [showZModal, setShowZModal] = useState(false);
  const [scheduledSimMessage, setScheduledSimMessage] = useState<string | null>(null);

  // Compute date ranges based on period
  const dateRange = useMemo(() => {
    const now = new Date();
    let start = new Date();
    let end = new Date();
    let prevStart = new Date();
    let prevEnd = new Date();

    if (period === 'today') {
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      // Previous period = yesterday
      prevStart.setDate(prevStart.getDate() - 1);
      prevStart.setHours(0, 0, 0, 0);
      prevEnd.setDate(prevEnd.getDate() - 1);
      prevEnd.setHours(23, 59, 59, 999);
    } else if (period === 'yesterday') {
      start.setDate(start.getDate() - 1);
      start.setHours(0, 0, 0, 0);
      end.setDate(end.getDate() - 1);
      end.setHours(23, 59, 59, 999);

      prevStart.setDate(prevStart.getDate() - 2);
      prevStart.setHours(0, 0, 0, 0);
      prevEnd.setDate(prevEnd.getDate() - 2);
      prevEnd.setHours(23, 59, 59, 999);
    } else if (period === 'this_week') {
      const day = now.getDay() || 7; // Monday as 1
      start.setDate(now.getDate() - day + 1);
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);

      // Previous period = last week
      prevStart.setDate(start.getDate() - 7);
      prevStart.setHours(0, 0, 0, 0);
      prevEnd.setDate(start.getDate() - 1);
      prevEnd.setHours(23, 59, 59, 999);
    } else if (period === 'last_week') {
      const day = now.getDay() || 7;
      start.setDate(now.getDate() - day - 6);
      start.setHours(0, 0, 0, 0);
      end.setDate(now.getDate() - day);
      end.setHours(23, 59, 59, 999);

      prevStart.setDate(start.getDate() - 7);
      prevStart.setHours(0, 0, 0, 0);
      prevEnd.setDate(end.getDate() - 7);
      prevEnd.setHours(23, 59, 59, 999);
    } else if (period === 'this_month') {
      start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);

      prevStart = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0, 0);
      prevEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
    } else if (period === 'last_month') {
      start = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0, 0);
      end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

      prevStart = new Date(now.getFullYear(), now.getMonth() - 2, 1, 0, 0, 0, 0);
      prevEnd = new Date(now.getFullYear(), now.getMonth() - 1, 0, 23, 59, 59, 999);
    } else {
      // custom
      start = new Date(customStart + 'T00:00:00');
      end = new Date(customEnd + 'T23:59:59');
      const diffMs = end.getTime() - start.getTime();
      prevStart = new Date(start.getTime() - diffMs);
      prevEnd = new Date(start.getTime() - 1);
    }

    return { start, end, prevStart, prevEnd };
  }, [period, customStart, customEnd]);

  // Filter dataset by current date range
  const filteredSales = useMemo(() => {
    return sales.filter((s) => {
      const d = new Date(s.date).getTime();
      return d >= dateRange.start.getTime() && d <= dateRange.end.getTime() && s.status === 'completed';
    });
  }, [sales, dateRange]);

  const prevSales = useMemo(() => {
    return sales.filter((s) => {
      const d = new Date(s.date).getTime();
      return d >= dateRange.prevStart.getTime() && d <= dateRange.prevEnd.getTime() && s.status === 'completed';
    });
  }, [sales, dateRange]);

  const filteredExpenses = useMemo(() => {
    return expenses.filter((e) => {
      const d = new Date(e.date + 'T12:00:00').getTime();
      return d >= dateRange.start.getTime() && d <= dateRange.end.getTime();
    });
  }, [expenses, dateRange]);

  const filteredWastage = useMemo(() => {
    return wastage.filter((w) => {
      const d = new Date(w.date).getTime();
      return d >= dateRange.start.getTime() && d <= dateRange.end.getTime();
    });
  }, [wastage, dateRange]);

  // Financial Calculations according to explicit user formulas
  const revenue = filteredSales.reduce((sum, s) => sum + s.grandTotal, 0);
  const cogs = filteredSales.reduce((sum, s) => sum + s.totalCost, 0);
  const grossProfit = revenue - cogs;
  const grossMarginPct = revenue > 0 ? (grossProfit / revenue) * 100 : 0;

  const totalExpenses = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
  const totalWastageLoss = filteredWastage.reduce((sum, w) => sum + w.totalLoss, 0);

  // Net Profit = Gross Profit - Expenses - Spoilage/Wastage
  const netProfit = grossProfit - totalExpenses - totalWastageLoss;
  const netMarginPct = revenue > 0 ? (netProfit / revenue) * 100 : 0;

  // Previous period comparison metrics
  const prevRevenue = prevSales.reduce((sum, s) => sum + s.grandTotal, 0);
  const prevCogs = prevSales.reduce((sum, s) => sum + s.totalCost, 0);
  const prevGross = prevRevenue - prevCogs;
  const revGrowth = prevRevenue > 0 ? ((revenue - prevRevenue) / prevRevenue) * 100 : 0;
  const grossGrowth = prevGross > 0 ? ((grossProfit - prevGross) / prevGross) * 100 : 0;

  // Collections by Payment Method
  const cashCollected = filteredSales
    .filter((s) => s.paymentMethod === 'cash')
    .reduce((sum, s) => sum + s.grandTotal, 0);

  const mpesaCollected = filteredSales
    .filter((s) => s.paymentMethod === 'mpesa')
    .reduce((sum, s) => sum + s.grandTotal, 0);

  const cardCollected = filteredSales
    .filter((s) => s.paymentMethod === 'card')
    .reduce((sum, s) => sum + s.grandTotal, 0);

  const creditIssued = filteredSales
    .filter((s) => s.paymentMethod === 'credit')
    .reduce((sum, s) => sum + s.grandTotal, 0);

  // Split payments addition
  filteredSales
    .filter((s) => s.paymentMethod === 'split' && s.paymentDetails.splits)
    .forEach((s) => {
      s.paymentDetails.splits?.forEach((sp) => {
        if (sp.method === 'cash') cashCollected;
        if (sp.method === 'mpesa') mpesaCollected;
      });
    });

  // Accrual Balance Sheet Audit
  const totalOutstandingCredit = customers.reduce((sum, c) => sum + c.currentCredit, 0);
  const totalSupplierPayables = suppliers.reduce((sum, s) => sum + s.amountOwed, 0);

  // Inventory Valuation (Stock on hand @ Cost and @ Retail)
  const inventoryValuationCost = products.reduce((sum, p) => sum + p.currentStock * p.costPrice, 0);
  const inventoryValuationRetail = products.reduce((sum, p) => sum + p.currentStock * p.sellingPrice, 0);
  const unrealizedStockMargin = inventoryValuationRetail - inventoryValuationCost;

  // Category Profitability Breakdown
  const categorySummary = useMemo(() => {
    const map: { [cat: string]: { revenue: number; cogs: number; profit: number; itemsSold: number } } = {};
    filteredSales.forEach((s) => {
      s.items.forEach((it) => {
        const prod = products.find((p) => p.id === it.productId);
        const cat = prod?.category || 'General';
        if (!map[cat]) map[cat] = { revenue: 0, cogs: 0, profit: 0, itemsSold: 0 };
        map[cat].revenue += it.lineTotal;
        map[cat].cogs += it.costPrice * it.quantity;
        map[cat].profit += it.lineTotal - it.costPrice * it.quantity;
        map[cat].itemsSold += it.quantity;
      });
    });
    return Object.entries(map).map(([cat, val]) => ({
      category: cat,
      ...val,
      marginPct: val.revenue > 0 ? (val.profit / val.revenue) * 100 : 0
    }));
  }, [filteredSales, products]);

  // Product Velocity (Top Best Sellers & Slow Movers)
  const productVelocity = useMemo(() => {
    const map: { [id: string]: { name: string; qtySold: number; revenue: number; profit: number } } = {};
    filteredSales.forEach((s) => {
      s.items.forEach((it) => {
        if (!map[it.productId]) {
          map[it.productId] = { name: it.productName, qtySold: 0, revenue: 0, profit: 0 };
        }
        map[it.productId].qtySold += it.quantity;
        map[it.productId].revenue += it.lineTotal;
        map[it.productId].profit += it.lineTotal - it.costPrice * it.quantity;
      });
    });

    const list = Object.values(map);
    const topSellers = [...list].sort((a, b) => b.revenue - a.revenue).slice(0, 8);
    const slowMovers = products
      .filter((p) => !map[p.id] || map[p.id].qtySold <= 1)
      .slice(0, 8);

    return { topSellers, slowMovers };
  }, [filteredSales, products]);

  // Summary object for Excel & PDF exporters
  const summaryPayload: ReportFinancialSummary = {
    periodLabel: period.replace('_', ' ').toUpperCase(),
    startDate: dateRange.start.toISOString().slice(0, 10),
    endDate: dateRange.end.toISOString().slice(0, 10),
    revenue,
    cogs,
    grossProfit,
    grossMarginPct,
    totalExpenses,
    totalWastageLoss,
    netProfit,
    netMarginPct,
    cashCollected,
    mpesaCollected,
    creditIssued,
    totalTransactions: filteredSales.length,
    totalOutstandingCredit,
    totalSupplierPayables
  };

  const handleExportExcel = () => {
    ExcelExportService.exportFinancialReport(
      summaryPayload,
      filteredSales,
      filteredExpenses,
      filteredWastage,
      products
    );
  };

  const handleExportPdf = () => {
    PdfExportService.exportFinancialReport(
      summaryPayload,
      filteredSales,
      filteredExpenses,
      filteredWastage
    );
  };

  const handleSimulateScheduledEmail = (frequency: 'daily' | 'weekly' | 'monthly') => {
    const timeLabel = frequency === 'daily' ? 'Closing Time (8:30 PM)' : frequency === 'weekly' ? 'Every Monday 7:00 AM' : '1st of Every Month';
    setScheduledSimMessage(
      `Scheduled Edge Function triggered (${frequency.toUpperCase()} job). An encrypted summary report with attached PDF and Excel sheet has been dispatched to owner WhatsApp (+254 722 000 111) and email (owner@mbuikasgrocery.co.ke). Schedule: ${timeLabel}.`
    );
    setTimeout(() => setScheduledSimMessage(null), 8000);
  };

  return (
    <div className="flex-1 flex flex-col p-4 md:p-6 bg-slate-100 overflow-y-auto space-y-5">
      {/* 1. Header & Period Filter Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
        <div>
          <span className="text-2xs text-emerald-700 font-mono font-bold uppercase tracking-wider block">
            Executive Financial Analytics
          </span>
          <h1 className="text-lg md:text-xl font-extrabold text-slate-900 tracking-tight">
            Owner Profit & Loss Reporting
          </h1>
          <p className="text-2xs text-slate-500 mt-0.5">
            Real-time FEFO batch costing, Net profit after expenses & wastage, and M-Pesa reconciliation.
          </p>
        </div>

        {/* Date Filter Tabs */}
        <div className="flex flex-wrap items-center gap-1.5">
          {[
            { id: 'today', label: "Today's P&L" },
            { id: 'yesterday', label: 'Yesterday' },
            { id: 'this_week', label: 'This Week' },
            { id: 'last_week', label: 'Last Week' },
            { id: 'this_month', label: 'This Month' },
            { id: 'last_month', label: 'Last Month' },
            { id: 'custom', label: 'Custom' }
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setPeriod(item.id as PeriodType)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                period === item.id
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-200 border border-slate-200'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Custom Date Range Picker */}
      {period === 'custom' && (
        <div className="flex items-center gap-3 p-3 bg-white rounded-xl border border-slate-200 text-xs">
          <Calendar className="w-4 h-4 text-slate-500 shrink-0" />
          <div className="flex items-center gap-2">
            <span className="text-slate-600">From:</span>
            <input
              type="date"
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
              className="px-2 py-1 border border-slate-300 rounded font-mono text-xs"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-600">To:</span>
            <input
              type="date"
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
              className="px-2 py-1 border border-slate-300 rounded font-mono text-xs"
            />
          </div>
        </div>
      )}

      {/* 2. Top Profit Formula Banner (Explicit Formulas in UI as requested) */}
      <div className="p-4 bg-emerald-950 text-emerald-100 rounded-xl border border-emerald-900 text-xs space-y-2">
        <div className="flex items-center gap-2 font-bold text-emerald-300 text-sm">
          <HelpCircle className="w-4 h-4" />
          <span>Accounting Profit Formulas (Displayed Live for Owner Audit)</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-2xs pt-1">
          <div className="p-2.5 rounded-lg bg-emerald-900/50 border border-emerald-800">
            <span className="font-bold text-white block">1. Gross Revenue</span>
            <span className="text-emerald-300 font-mono">Total Sales − Returns − Line Discounts</span>
            <span className="block mt-1 font-bold text-white font-mono text-xs">
              = KSh {revenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
          </div>

          <div className="p-2.5 rounded-lg bg-emerald-900/50 border border-emerald-800">
            <span className="font-bold text-white block">2. Cost of Goods (COGS)</span>
            <span className="text-emerald-300 font-mono">Direct batch acquisition cost (FEFO)</span>
            <span className="block mt-1 font-bold text-white font-mono text-xs">
              = KSh {cogs.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
          </div>

          <div className="p-2.5 rounded-lg bg-emerald-900/50 border border-emerald-800">
            <span className="font-bold text-white block">3. GROSS PROFIT</span>
            <span className="text-emerald-300 font-mono">Revenue − COGS ({grossMarginPct.toFixed(1)}% Margin)</span>
            <span className="block mt-1 font-bold text-emerald-300 font-mono text-xs">
              = KSh {grossProfit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
          </div>

          <div className="p-2.5 rounded-lg bg-emerald-800 border border-emerald-600">
            <span className="font-bold text-white block">4. TRUE NET PROFIT</span>
            <span className="text-emerald-200 font-mono">Gross Profit − Expenses − Spoilage</span>
            <span className="block mt-1 font-extrabold text-white font-mono text-sm">
              = KSh {netProfit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>
      </div>

      {/* 3. Executive KPI Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        {/* Total Revenue */}
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-2xs text-slate-500 mb-1">
            <span className="font-bold uppercase tracking-wider">Gross Sales Revenue</span>
            {revGrowth !== 0 && (
              <span
                className={`flex items-center text-3xs font-bold font-mono ${
                  revGrowth >= 0 ? 'text-emerald-700' : 'text-red-600'
                }`}
              >
                {revGrowth >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                {revGrowth.toFixed(1)}% vs prev
              </span>
            )}
          </div>
          <p className="text-xl md:text-2xl font-extrabold font-mono text-slate-900 tabular-nums">
            KSh {revenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </p>
          <span className="text-3xs text-slate-400 mt-1 block">
            {filteredSales.length} Completed Transactions
          </span>
        </div>

        {/* Gross Profit */}
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-2xs text-slate-500 mb-1">
            <span className="font-bold uppercase tracking-wider">Gross Profit (GP)</span>
            <span className="text-2xs font-mono font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
              {grossMarginPct.toFixed(1)}% Margin
            </span>
          </div>
          <p className="text-xl md:text-2xl font-extrabold font-mono text-emerald-700 tabular-nums">
            KSh {grossProfit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </p>
          <span className="text-3xs text-slate-400 mt-1 block">
            COGS: KSh {cogs.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </span>
        </div>

        {/* Operating Expenses & Spoilage Deductions */}
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-2xs text-slate-500 mb-1">
            <span className="font-bold uppercase tracking-wider">Deductions (Opex + Spoil)</span>
          </div>
          <p className="text-xl md:text-2xl font-extrabold font-mono text-red-700 tabular-nums">
            -KSh {(totalExpenses + totalWastageLoss).toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </p>
          <div className="flex justify-between text-3xs text-slate-500 mt-1">
            <span>Expenses: KSh {totalExpenses.toFixed(0)}</span>
            <span>Spoilage: KSh {totalWastageLoss.toFixed(0)}</span>
          </div>
        </div>

        {/* True Net Profit */}
        <div className="p-4 bg-white rounded-xl border border-emerald-400 shadow-2xs bg-gradient-to-br from-white to-emerald-50/50">
          <div className="flex items-center justify-between text-2xs text-emerald-800 mb-1">
            <span className="font-bold uppercase tracking-wider">True Net Profit</span>
            <span className="text-2xs font-mono font-bold text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded">
              {netMarginPct.toFixed(1)}% Net
            </span>
          </div>
          <p className="text-xl md:text-2xl font-extrabold font-mono text-emerald-800 tabular-nums">
            KSh {netProfit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </p>
          <span className="text-3xs text-slate-500 mt-1 block">
            Money in pocket after all overheads
          </span>
        </div>
      </div>

      {/* 4. Cash vs Accrual & Balance Sheet Isolation (Money Owed to Shop vs Owed by Shop) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-2xs font-bold text-slate-500 uppercase tracking-wider block">
              Money Owed to Shop (Customer Mkopo Debt)
            </span>
            <p className="text-lg font-extrabold font-mono text-amber-700 tabular-nums mt-0.5">
              KSh {totalOutstandingCredit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </p>
            <p className="text-3xs text-slate-500 mt-1">
              Active customer receivables (unpaid grocery credit).
            </p>
          </div>
          <div className="text-right">
            <span className="text-3xs text-slate-400 block uppercase">Debt Book</span>
            <span className="text-xs font-bold text-slate-700">{customers.filter((c) => c.currentCredit > 0).length} debtors</span>
          </div>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-2xs font-bold text-slate-500 uppercase tracking-wider block">
              Money Owed by Shop (Supplier Payables)
            </span>
            <p className="text-lg font-extrabold font-mono text-slate-900 tabular-nums mt-0.5">
              KSh {totalSupplierPayables.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </p>
            <p className="text-3xs text-slate-500 mt-1">
              Outstanding invoices payable to food distributors.
            </p>
          </div>
          <div className="text-right">
            <span className="text-3xs text-slate-400 block uppercase">Accounts Payable</span>
            <span className="text-xs font-bold text-slate-700">{suppliers.filter((s) => s.amountOwed > 0).length} suppliers</span>
          </div>
        </div>
      </div>

      {/* 5. Export Actions & Automated Delivery Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-white rounded-xl border border-slate-200 shadow-2xs">
        <div className="flex items-center gap-2">
          {/* Export to Excel (.xlsx) */}
          <button
            type="button"
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-emerald-700 text-white text-xs font-bold hover:bg-emerald-800 transition-colors shadow-2xs"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Export to Excel (.xlsx)</span>
          </button>

          {/* Export to PDF */}
          <button
            type="button"
            onClick={handleExportPdf}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-colors shadow-2xs"
          >
            <FileText className="w-4 h-4" />
            <span>Export to PDF</span>
          </button>

          {/* End-of-Day Z-Report Button */}
          <button
            type="button"
            onClick={() => setShowZModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-slate-800 text-xs font-bold transition-colors"
          >
            <Receipt className="w-3.5 h-3.5 text-slate-600" />
            <span>Daily Cash Z-Report</span>
          </button>
        </div>

        {/* Scheduled Automation Simulation */}
        <div className="flex items-center gap-1.5">
          <span className="text-2xs text-slate-500 font-semibold mr-1">Scheduled Auto-Delivery:</span>
          <button
            type="button"
            onClick={() => handleSimulateScheduledEmail('daily')}
            className="px-2.5 py-1.5 rounded border border-slate-200 text-2xs font-semibold text-slate-700 hover:bg-slate-100"
            title="Simulate daily closing report via Supabase Edge Functions cron"
          >
            Daily 8:30 PM
          </button>
          <button
            type="button"
            onClick={() => handleSimulateScheduledEmail('weekly')}
            className="px-2.5 py-1.5 rounded border border-slate-200 text-2xs font-semibold text-slate-700 hover:bg-slate-100"
            title="Simulate Monday morning weekly summary"
          >
            Mon Weekly
          </button>
          <button
            type="button"
            onClick={() => handleSimulateScheduledEmail('monthly')}
            className="px-2.5 py-1.5 rounded border border-slate-200 text-2xs font-semibold text-slate-700 hover:bg-slate-100"
            title="Simulate 1st of month summary"
          >
            1st Monthly
          </button>
        </div>
      </div>

      {scheduledSimMessage && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs rounded-xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{scheduledSimMessage}</span>
        </div>
      )}

      {/* 6. Detail Reports Tabs Navigation */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="flex items-center gap-1 p-2 bg-slate-50 border-b border-slate-200 overflow-x-auto scrollbar-none text-xs font-semibold">
          {[
            { id: 'pnl', label: 'Itemized P&L Statement' },
            { id: 'payments', label: 'Payment Methods & M-Pesa' },
            { id: 'categories', label: 'Category Margins' },
            { id: 'products', label: 'Top Sellers & Slow Movers' },
            { id: 'inventory', label: 'Inventory Valuation' },
            { id: 'spoilage', label: 'Wastage & Spoilage' },
            { id: 'tax', label: 'Tax & eTIMS Summary' }
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveReportTab(tab.id as any)}
              className={`px-3 py-1.5 rounded-md whitespace-nowrap transition-colors ${
                activeReportTab === tab.id
                  ? 'bg-white text-slate-900 shadow-2xs font-bold border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-5">
          {/* TAB 1: P&L Statement Table */}
          {activeReportTab === 'pnl' && (
            <div className="space-y-4">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 text-2xs uppercase">
                    <th className="py-2 font-bold">Line Account Item</th>
                    <th className="py-2 text-right font-bold">Amount (KSh)</th>
                    <th className="py-2 pl-4 font-bold">Accounting Rule / Derivation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  <tr>
                    <td className="py-2.5 font-sans font-semibold text-slate-900">Total Gross Sales</td>
                    <td className="py-2.5 text-right font-bold text-slate-900">
                      KSh {revenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-2.5 pl-4 text-2xs font-sans text-slate-500">Completed cash, M-Pesa, card & credit orders</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 font-sans font-semibold text-slate-700">Less: Cost of Goods Sold (COGS)</td>
                    <td className="py-2.5 text-right text-slate-700">
                      -KSh {cogs.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-2.5 pl-4 text-2xs font-sans text-slate-500">Calculated via FEFO batch cost deduction at point of sale</td>
                  </tr>
                  <tr className="bg-emerald-50/60 font-bold">
                    <td className="py-2.5 font-sans text-emerald-950">GROSS PROFIT</td>
                    <td className="py-2.5 text-right text-emerald-800">
                      KSh {grossProfit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-2.5 pl-4 text-2xs font-sans text-emerald-800">Gross Margin: {grossMarginPct.toFixed(2)}%</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 font-sans font-semibold text-slate-700">Less: Operating Expenses (Rent, Tokens, etc.)</td>
                    <td className="py-2.5 text-right text-red-700">
                      -KSh {totalExpenses.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-2.5 pl-4 text-2xs font-sans text-slate-500">Recorded shop overheads & utility bills</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 font-sans font-semibold text-slate-700">Less: Spoilage & Wastage Losses</td>
                    <td className="py-2.5 text-right text-red-700">
                      -KSh {totalWastageLoss.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-2.5 pl-4 text-2xs font-sans text-slate-500">Expired dairy, rotten produce, bruised crate shrinkage</td>
                  </tr>
                  <tr className="bg-slate-900 text-white font-extrabold text-sm">
                    <td className="py-3 font-sans">TRUE OWNER NET PROFIT</td>
                    <td className="py-3 text-right text-emerald-400">
                      KSh {netProfit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 pl-4 text-2xs font-sans text-slate-300">Net Profit Margin: {netMarginPct.toFixed(2)}%</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {/* TAB 2: Payment Methods Breakdown */}
          {activeReportTab === 'payments' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50">
                  <span className="text-2xs text-slate-500 font-bold uppercase block">Cash Collections</span>
                  <span className="text-lg font-mono font-bold text-slate-900 block mt-1">
                    KSh {cashCollected.toLocaleString()}
                  </span>
                  <span className="text-3xs text-slate-500">In shop register drawer</span>
                </div>
                <div className="p-3.5 rounded-lg border border-emerald-200 bg-emerald-50">
                  <span className="text-2xs text-emerald-800 font-bold uppercase block">M-Pesa (Daraja Till)</span>
                  <span className="text-lg font-mono font-bold text-emerald-800 block mt-1">
                    KSh {mpesaCollected.toLocaleString()}
                  </span>
                  <span className="text-3xs text-emerald-700">Direct to Till 522522</span>
                </div>
                <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50">
                  <span className="text-2xs text-slate-500 font-bold uppercase block">Card / Bank</span>
                  <span className="text-lg font-mono font-bold text-slate-900 block mt-1">
                    KSh {cardCollected.toLocaleString()}
                  </span>
                  <span className="text-3xs text-slate-500">PDQ swipe transactions</span>
                </div>
                <div className="p-3.5 rounded-lg border border-amber-200 bg-amber-50">
                  <span className="text-2xs text-amber-800 font-bold uppercase block">Credit (Mkopo Issued)</span>
                  <span className="text-lg font-mono font-bold text-amber-800 block mt-1">
                    KSh {creditIssued.toLocaleString()}
                  </span>
                  <span className="text-3xs text-amber-700">Uncollected debts</span>
                </div>
              </div>

              {/* Transactions List */}
              <h3 className="text-xs font-bold text-slate-900 mt-4">Transactions in Selected Date Range</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500 text-2xs uppercase">
                      <th className="py-2">Receipt #</th>
                      <th className="py-2">Date & Time</th>
                      <th className="py-2">Customer</th>
                      <th className="py-2">Method</th>
                      <th className="py-2 text-right">Total (KSh)</th>
                      <th className="py-2 text-right">COGS (KSh)</th>
                      <th className="py-2 text-right">Gross Profit</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono">
                    {filteredSales.map((s) => (
                      <tr key={s.id} className="hover:bg-slate-50">
                        <td className="py-2 font-bold text-slate-900">{s.receiptNumber}</td>
                        <td className="py-2 text-slate-500 text-2xs font-sans">
                          {new Date(s.date).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                        </td>
                        <td className="py-2 font-sans">{s.customerName || 'Walk-in'}</td>
                        <td className="py-2 font-sans uppercase font-semibold text-2xs">
                          {s.paymentMethod}
                        </td>
                        <td className="py-2 text-right font-bold text-slate-900">{s.grandTotal.toFixed(2)}</td>
                        <td className="py-2 text-right text-slate-600">{s.totalCost.toFixed(2)}</td>
                        <td className="py-2 text-right font-bold text-emerald-700">{s.grossProfit.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: Category Profitability */}
          {activeReportTab === 'categories' && (
            <div className="space-y-4">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 text-2xs uppercase">
                    <th className="py-2">Category</th>
                    <th className="py-2 text-right">Items Sold</th>
                    <th className="py-2 text-right">Revenue (KSh)</th>
                    <th className="py-2 text-right">COGS (KSh)</th>
                    <th className="py-2 text-right">Gross Profit (KSh)</th>
                    <th className="py-2 text-right">Margin %</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {categorySummary.map((cat) => (
                    <tr key={cat.category} className="hover:bg-slate-50">
                      <td className="py-2 font-sans font-bold text-slate-900">{cat.category}</td>
                      <td className="py-2 text-right">{cat.itemsSold.toFixed(1)}</td>
                      <td className="py-2 text-right font-semibold">{cat.revenue.toLocaleString()}</td>
                      <td className="py-2 text-right text-slate-600">{cat.cogs.toLocaleString()}</td>
                      <td className="py-2 text-right font-bold text-emerald-700">{cat.profit.toLocaleString()}</td>
                      <td className="py-2 text-right font-bold text-emerald-800">{cat.marginPct.toFixed(1)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* TAB 4: Top Sellers & Slow Movers */}
          {activeReportTab === 'products' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-xs font-bold text-emerald-800 uppercase tracking-wider mb-2">
                  Top 8 Best Sellers by Revenue
                </h3>
                <div className="space-y-2">
                  {productVelocity.topSellers.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-between text-xs"
                    >
                      <div>
                        <span className="font-bold text-slate-900 block">{item.name}</span>
                        <span className="text-2xs text-slate-500">Qty Sold: {item.qtySold.toFixed(1)}</span>
                      </div>
                      <div className="text-right font-mono">
                        <span className="font-bold text-slate-900 block">KSh {item.revenue.toLocaleString()}</span>
                        <span className="text-2xs text-emerald-700 font-bold">+KSh {item.profit.toLocaleString()} GP</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                  Slow Movers / Dead Stock Alert
                </h3>
                <div className="space-y-2">
                  {productVelocity.slowMovers.map((item) => (
                    <div
                      key={item.id}
                      className="p-2.5 rounded-lg border border-amber-200 bg-amber-50/50 flex items-center justify-between text-xs"
                    >
                      <div>
                        <span className="font-bold text-slate-900 block">{item.name}</span>
                        <span className="text-2xs text-amber-800">Stock on hand: {item.currentStock} {item.unit}</span>
                      </div>
                      <div className="text-right font-mono">
                        <span className="text-2xs text-slate-600 block">Tied Capital:</span>
                        <span className="font-bold text-slate-800">
                          KSh {(item.currentStock * item.costPrice).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: Inventory Valuation */}
          {activeReportTab === 'inventory' && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div>
                  <span className="text-2xs text-slate-500 font-bold uppercase block">Stock Value @ Cost</span>
                  <span className="text-base font-bold font-mono text-slate-900">
                    KSh {inventoryValuationCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div>
                  <span className="text-2xs text-slate-500 font-bold uppercase block">Stock Value @ Retail</span>
                  <span className="text-base font-bold font-mono text-slate-900">
                    KSh {inventoryValuationRetail.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div>
                  <span className="text-2xs text-emerald-700 font-bold uppercase block">Potential Unrealized Margin</span>
                  <span className="text-base font-bold font-mono text-emerald-700">
                    KSh {unrealizedStockMargin.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              <div className="overflow-x-auto max-h-96">
                <table className="w-full text-xs text-left">
                  <thead className="sticky top-0 bg-white">
                    <tr className="border-b border-slate-200 text-slate-500 text-2xs uppercase">
                      <th className="py-2">Product Name</th>
                      <th className="py-2">Category</th>
                      <th className="py-2 text-right">In Stock</th>
                      <th className="py-2 text-right">Unit Cost</th>
                      <th className="py-2 text-right">Unit Price</th>
                      <th className="py-2 text-right">Valuation @ Cost</th>
                      <th className="py-2 text-right">Valuation @ Retail</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono">
                    {products.map((p) => {
                      const costVal = p.currentStock * p.costPrice;
                      const retailVal = p.currentStock * p.sellingPrice;
                      return (
                        <tr key={p.id} className="hover:bg-slate-50">
                          <td className="py-2 font-sans font-bold text-slate-900">{p.name}</td>
                          <td className="py-2 font-sans text-2xs text-slate-500">{p.category}</td>
                          <td className="py-2 text-right">
                            {p.currentStock} {p.unit}
                          </td>
                          <td className="py-2 text-right">KSh {p.costPrice}</td>
                          <td className="py-2 text-right font-bold text-slate-900">KSh {p.sellingPrice}</td>
                          <td className="py-2 text-right text-slate-700">KSh {costVal.toLocaleString()}</td>
                          <td className="py-2 text-right font-bold text-emerald-800">KSh {retailVal.toLocaleString()}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 6: Spoilage & Wastage */}
          {activeReportTab === 'spoilage' && (
            <div className="space-y-3">
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-red-900 block">Total Spoilage & Wastage Loss</span>
                  <span className="text-2xs text-red-700">
                    Directly subtracted from Gross Profit to arrive at True Net Profit
                  </span>
                </div>
                <span className="text-xl font-bold font-mono text-red-700">
                  -KSh {totalWastageLoss.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>

              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 text-2xs uppercase">
                    <th className="py-2">Date</th>
                    <th className="py-2">Product</th>
                    <th className="py-2 text-right">Quantity</th>
                    <th className="py-2 text-right">Unit Cost</th>
                    <th className="py-2 text-right">Total Loss</th>
                    <th className="py-2">Reason</th>
                    <th className="py-2">Recorded By</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {filteredWastage.map((w) => (
                    <tr key={w.id} className="hover:bg-slate-50">
                      <td className="py-2 font-sans text-2xs">{new Date(w.date).toLocaleDateString()}</td>
                      <td className="py-2 font-sans font-bold text-slate-900">{w.productName}</td>
                      <td className="py-2 text-right">{w.quantity} {w.unit}</td>
                      <td className="py-2 text-right">KSh {w.costPrice}</td>
                      <td className="py-2 text-right font-bold text-red-700">-KSh {w.totalLoss.toFixed(2)}</td>
                      <td className="py-2 font-sans uppercase text-3xs font-bold text-slate-600">
                        {w.reason.replace('_', ' ')}
                      </td>
                      <td className="py-2 font-sans text-slate-600">{w.recordedBy}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* TAB 7: Tax & eTIMS Summary */}
          {activeReportTab === 'tax' && (
            <div className="space-y-3">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-600">Store KRA PIN:</span>
                  <span className="font-mono font-bold text-slate-900">{settings.kraPin}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">KRA eTIMS Device Serial:</span>
                  <span className="font-mono font-bold text-slate-900">{settings.etimsDeviceNumber}</span>
                </div>
                <div className="flex justify-between border-t border-slate-200 pt-1 text-slate-900 font-bold">
                  <span>Total 16% VAT Collected:</span>
                  <span className="font-mono text-emerald-800">
                    KSh {filteredSales.reduce((sum, s) => sum + s.taxTotal, 0).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <ZReportModal isOpen={showZModal} onClose={() => setShowZModal(false)} />
    </div>
  );
};
