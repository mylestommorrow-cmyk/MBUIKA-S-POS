import React, { useState } from 'react';
import {
  BookOpen,
  DollarSign,
  Phone,
  MessageSquare,
  Plus,
  Search,
  CheckCircle2,
  Calendar,
  AlertTriangle,
  History
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { Customer } from '../../types/grocery';
import { StorageService } from '../../services/storage';

export const CreditBook: React.FC = () => {
  const { customers, recordRepayment, settings } = useStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  // Repayment Modal
  const [showRepayModal, setShowRepayModal] = useState(false);
  const [repayAmount, setRepayAmount] = useState('');
  const [repayMethod, setRepayMethod] = useState<'cash' | 'mpesa'>('mpesa');
  const [mpesaReceipt, setMpesaReceipt] = useState('');
  const [repayNotes, setRepayNotes] = useState('');

  const repayments = StorageService.getRepayments();

  const totalOwed = customers.reduce((sum, c) => sum + c.currentCredit, 0);
  const debtorCount = customers.filter((c) => c.currentCredit > 0).length;

  const filtered = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.phone.includes(searchTerm)
  );

  const handleOpenRepay = (cust: Customer) => {
    setSelectedCustomer(cust);
    setRepayAmount(cust.currentCredit.toString());
    setMpesaReceipt('SK' + Math.floor(10000000 + Math.random() * 90000000));
    setShowRepayModal(true);
  };

  const handleRepaySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer) return;
    const amt = parseFloat(repayAmount);
    if (amt > 0) {
      recordRepayment({
        customerId: selectedCustomer.id,
        amount: amt,
        paymentMethod: repayMethod,
        mpesaReceipt: repayMethod === 'mpesa' ? mpesaReceipt : undefined,
        notes: repayNotes
      });
      setShowRepayModal(false);
      setRepayAmount('');
      setSelectedCustomer(null);
    }
  };

  const handleSendWhatsAppReminder = (cust: Customer) => {
    const text =
      `*KIKUMBUSHO CHA MKOPO - ${settings.storeName.toUpperCase()}*\n\n` +
      `Hujambo ${cust.name},\n` +
      `Tunakukumbusha kuhusu salio lako la mkopo la *KSh ${cust.currentCredit.toLocaleString()}* kwa Mbuikas Grocery.\n` +
      `Unaweza kulipa kupitia M-Pesa Till: *${settings.mpesaShortcode}* au dukani.\n\n` +
      `Asante sana kwa ushirikiano wako!`;

    const encoded = encodeURIComponent(text);
    const phone = cust.phone.replace(/[^0-9]/g, '');
    const fullPhone = phone.startsWith('0') ? '254' + phone.slice(1) : phone;
    window.open(`https://wa.me/${fullPhone}?text=${encoded}`, '_blank');
  };

  return (
    <div className="flex-1 flex flex-col p-4 md:p-6 bg-slate-100 overflow-y-auto space-y-4">
      {/* 1. Header & Summary Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
        <div>
          <span className="text-2xs text-amber-700 font-mono font-bold uppercase tracking-wider block">
            Customer Debt Book (Daftari la Mkopo)
          </span>
          <h1 className="text-lg md:text-xl font-extrabold text-slate-900 tracking-tight">
            Customer Credit & Repayments
          </h1>
          <p className="text-2xs text-slate-500 mt-0.5">
            Track customer balances, enforce credit limits, record partial settlements, and dispatch WhatsApp payment reminders.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-4 py-2 bg-amber-50 border border-amber-200 rounded-lg text-right">
            <span className="text-2xs text-amber-800 font-bold uppercase block">Total Outstanding Mkopo</span>
            <span className="text-lg font-mono font-extrabold text-amber-900 tabular-nums">
              KSh {totalOwed.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>
      </div>

      {/* 2. Search & Filter Bar */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search customer name or phone number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-600"
          />
        </div>
        <span className="text-xs text-slate-500 whitespace-nowrap">
          {debtorCount} Active Debtors
        </span>
      </div>

      {/* 3. Customers Credit Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5">
        {filtered.map((c) => {
          const hasDebt = c.currentCredit > 0;
          const availableCredit = c.creditLimit - c.currentCredit;
          const pctUsed = Math.min(100, (c.currentCredit / c.creditLimit) * 100);

          return (
            <div
              key={c.id}
              className={`p-4 bg-white rounded-xl border shadow-2xs transition-all flex flex-col justify-between ${
                hasDebt ? 'border-amber-200 hover:border-amber-400' : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">{c.name}</h3>
                    <p className="text-2xs text-slate-500 flex items-center gap-1 mt-0.5">
                      <Phone className="w-3 h-3 text-slate-400" />
                      {c.phone}
                    </p>
                  </div>
                  <span
                    className={`text-2xs font-bold px-2 py-0.5 rounded font-mono ${
                      hasDebt ? 'bg-amber-100 text-amber-900' : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    {hasDebt ? 'Debt Active' : 'Settled (0)'}
                  </span>
                </div>

                {/* Progress bar of credit limit used */}
                <div className="mt-3 space-y-1">
                  <div className="flex justify-between text-2xs text-slate-500 font-mono">
                    <span>Owed: KSh {c.currentCredit.toLocaleString()}</span>
                    <span>Limit: KSh {c.creditLimit.toLocaleString()}</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        pctUsed > 80 ? 'bg-red-500' : pctUsed > 50 ? 'bg-amber-500' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${pctUsed}%` }}
                    />
                  </div>
                </div>

                {c.notes && (
                  <p className="text-3xs text-slate-500 italic mt-2 bg-slate-50 p-1.5 rounded">
                    "{c.notes}"
                  </p>
                )}
              </div>

              {/* Actions */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => handleSendWhatsAppReminder(c)}
                  disabled={!hasDebt}
                  className="px-2.5 py-1.5 rounded-lg border border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 disabled:opacity-40 text-2xs font-semibold flex items-center gap-1"
                  title="Send WhatsApp debt reminder"
                >
                  <MessageSquare className="w-3 h-3 text-emerald-600" />
                  <span>WhatsApp</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleOpenRepay(c)}
                  disabled={!hasDebt}
                  className="px-3.5 py-1.5 rounded-lg bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-40 text-2xs font-bold flex items-center gap-1"
                >
                  <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Record Repayment</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* 4. Recent Repayments Audit Ledger */}
      {repayments.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-4 space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
            <History className="w-4 h-4 text-emerald-700" />
            <span>Recent Debt Repayment Audit Ledger</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 text-2xs uppercase">
                  <th className="py-2">Date</th>
                  <th className="py-2">Customer</th>
                  <th className="py-2">Method</th>
                  <th className="py-2">M-Pesa Ref</th>
                  <th className="py-2 text-right">Amount (KSh)</th>
                  <th className="py-2">Received By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {repayments.slice(0, 5).map((r) => {
                  const cust = customers.find((c) => c.id === r.customerId);
                  return (
                    <tr key={r.id}>
                      <td className="py-2 font-sans text-2xs">{new Date(r.date).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</td>
                      <td className="py-2 font-sans font-bold">{cust?.name || 'Customer'}</td>
                      <td className="py-2 font-sans uppercase font-semibold text-2xs">{r.paymentMethod}</td>
                      <td className="py-2 text-2xs">{r.mpesaReceipt || '-'}</td>
                      <td className="py-2 text-right font-bold text-emerald-700">KSh {r.amount.toLocaleString()}</td>
                      <td className="py-2 font-sans text-slate-600">{r.receivedBy}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* REPAYMENT MODAL */}
      {showRepayModal && selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="w-full max-w-md rounded-xl bg-white shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-5 py-3.5 bg-slate-900 text-white flex justify-between items-center">
              <div>
                <h2 className="text-sm font-bold">Record Repayment: {selectedCustomer.name}</h2>
                <p className="text-2xs text-emerald-400">Current Owed: KSh {selectedCustomer.currentCredit.toLocaleString()}</p>
              </div>
              <button onClick={() => setShowRepayModal(false)} className="text-white">✕</button>
            </div>
            <form onSubmit={handleRepaySubmit} className="p-5 space-y-3">
              <div>
                <label className="block text-2xs font-bold text-slate-700 uppercase mb-1">
                  Repayment Amount (KSh)
                </label>
                <input
                  type="number"
                  step="any"
                  required
                  value={repayAmount}
                  onChange={(e) => setRepayAmount(e.target.value)}
                  className="w-full px-3 py-2 text-base font-mono font-bold border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-600"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-2xs font-bold text-slate-700 uppercase mb-1">Payment Method</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setRepayMethod('mpesa')}
                    className={`py-2 rounded-lg text-xs font-bold border ${
                      repayMethod === 'mpesa'
                        ? 'bg-emerald-50 border-emerald-600 text-emerald-900'
                        : 'border-slate-300 text-slate-700'
                    }`}
                  >
                    M-Pesa Till
                  </button>
                  <button
                    type="button"
                    onClick={() => setRepayMethod('cash')}
                    className={`py-2 rounded-lg text-xs font-bold border ${
                      repayMethod === 'cash'
                        ? 'bg-emerald-50 border-emerald-600 text-emerald-900'
                        : 'border-slate-300 text-slate-700'
                    }`}
                  >
                    Cash Drawer
                  </button>
                </div>
              </div>

              {repayMethod === 'mpesa' && (
                <div>
                  <label className="block text-2xs font-bold text-slate-700 uppercase mb-1">
                    M-Pesa Transaction Confirmation Code
                  </label>
                  <input
                    type="text"
                    required
                    value={mpesaReceipt}
                    onChange={(e) => setMpesaReceipt(e.target.value)}
                    placeholder="e.g. SKF81029KL"
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg font-mono uppercase"
                  />
                </div>
              )}

              <div>
                <label className="block text-2xs font-bold text-slate-700 uppercase mb-1">Notes / Remarks</label>
                <input
                  type="text"
                  value={repayNotes}
                  onChange={(e) => setRepayNotes(e.target.value)}
                  placeholder="e.g. Paid in full via M-Pesa"
                  className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setShowRepayModal(false)}
                  className="px-4 py-2 border rounded-lg text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-700 text-white rounded-lg text-xs font-bold hover:bg-emerald-800"
                >
                  Confirm Repayment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
