import React, { useState } from 'react';
import { Receipt, Plus, DollarSign, Calendar, Tag, Trash2 } from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { Expense } from '../../types/grocery';

export const ExpenseManager: React.FC = () => {
  const { expenses, addExpense, currentShift } = useStore();
  const [showAddModal, setShowAddModal] = useState(false);

  // New expense form
  const [category, setCategory] = useState<Expense['category']>('transport');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'mpesa' | 'bank'>('cash');
  const [receiptRef, setReceiptRef] = useState('');

  const totalExpenseAmount = expenses.reduce((sum, e) => sum + e.amount, 0);

  const handleCreateExpense = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(amount);
    if (val > 0 && description) {
      addExpense({
        date: new Date().toISOString().slice(0, 10),
        category,
        description,
        amount: val,
        paymentMethod,
        receiptRef: receiptRef || undefined
      });
      setShowAddModal(false);
      setDescription('');
      setAmount('');
      setReceiptRef('');
    }
  };

  return (
    <div className="flex-1 flex flex-col p-4 md:p-6 bg-slate-100 overflow-y-auto space-y-4">
      {/* 1. Header & Summary Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
        <div>
          <span className="text-2xs text-red-700 font-mono font-bold uppercase tracking-wider block">
            Store Overheads & Overhead Deductions
          </span>
          <h1 className="text-lg md:text-xl font-extrabold text-slate-900 tracking-tight">
            Operating Expenses Management
          </h1>
          <p className="text-2xs text-slate-500 mt-0.5">
            Log rent, electricity tokens, transport, salaries, and licences to compute true Owner Net Profit.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-4 py-2 bg-red-50 border border-red-200 rounded-lg text-right">
            <span className="text-2xs text-red-800 font-bold uppercase block">Recorded Overheads</span>
            <span className="text-lg font-mono font-extrabold text-red-900 tabular-nums">
              KSh {totalExpenseAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
          </div>

          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 shadow-2xs"
          >
            <Plus className="w-4 h-4" />
            <span>Record Expense</span>
          </button>
        </div>
      </div>

      {/* 2. Expenses Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 text-2xs uppercase">
                <th className="py-2.5 px-3">Date</th>
                <th className="py-2.5 px-3">Category</th>
                <th className="py-2.5 px-3">Description</th>
                <th className="py-2.5 px-3 text-right">Amount (KSh)</th>
                <th className="py-2.5 px-3">Payment Method</th>
                <th className="py-2.5 px-3">Receipt / Ref</th>
                <th className="py-2.5 px-3">Recorded By</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {expenses.map((exp) => (
                <tr key={exp.id} className="hover:bg-slate-50">
                  <td className="py-2.5 px-3 font-sans text-2xs text-slate-600">{exp.date}</td>
                  <td className="py-2.5 px-3 font-sans">
                    <span className="px-2 py-0.5 rounded text-3xs font-bold uppercase bg-slate-100 text-slate-800">
                      {exp.category.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 font-sans font-semibold text-slate-900">{exp.description}</td>
                  <td className="py-2.5 px-3 text-right font-bold text-red-700 tabular-nums">
                    KSh {exp.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-2.5 px-3 font-sans uppercase text-3xs font-semibold text-slate-600">
                    {exp.paymentMethod}
                  </td>
                  <td className="py-2.5 px-3 text-2xs text-slate-500">{exp.receiptRef || '-'}</td>
                  <td className="py-2.5 px-3 font-sans text-2xs text-slate-600">{exp.recordedBy}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* RECORD EXPENSE MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="w-full max-w-md rounded-xl bg-white shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-5 py-3.5 bg-slate-900 text-white flex justify-between items-center">
              <h2 className="text-sm font-bold">Record Store Operating Expense</h2>
              <button onClick={() => setShowAddModal(false)} className="text-white">✕</button>
            </div>
            <form onSubmit={handleCreateExpense} className="p-5 space-y-3">
              <div>
                <label className="block text-2xs font-bold text-slate-700 uppercase mb-1">Expense Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                >
                  <option value="transport">Transport & Market Haulage</option>
                  <option value="electricity">Electricity Tokens (KPLC)</option>
                  <option value="water">Water & Sanitation</option>
                  <option value="rent">Shop Monthly Rent</option>
                  <option value="salaries">Staff Wages / Casuals</option>
                  <option value="packaging">Packaging Bags & Rolls</option>
                  <option value="licences_council">County Licences & Single Business Permit</option>
                  <option value="maintenance">Maintenance & Repairs</option>
                  <option value="others">Petty Cash / Others</option>
                </select>
              </div>

              <div>
                <label className="block text-2xs font-bold text-slate-700 uppercase mb-1">Description</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Boda transport for 4 sacks of potatoes"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-2xs font-bold text-slate-700 uppercase mb-1">Amount (KSh)</label>
                <input
                  type="number"
                  step="any"
                  required
                  placeholder="650"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full px-3 py-2 text-base font-mono font-bold border border-slate-300 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-2xs font-bold text-slate-700 uppercase mb-1">Payment Method</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as any)}
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg"
                  >
                    <option value="cash">Cash Drawer</option>
                    <option value="mpesa">M-Pesa</option>
                    <option value="bank">Bank Transfer</option>
                  </select>
                </div>
                <div>
                  <label className="block text-2xs font-bold text-slate-700 uppercase mb-1">Receipt Ref / Voucher</label>
                  <input
                    type="text"
                    placeholder="e.g. KPLC-881902"
                    value={receiptRef}
                    onChange={(e) => setReceiptRef(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg font-mono"
                  />
                </div>
              </div>

              {paymentMethod === 'cash' && currentShift && (
                <p className="text-3xs text-amber-700">
                  ℹ️ Paying via Cash Drawer will automatically reduce expected closing cash for the active shift.
                </p>
              )}

              <div className="flex justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border rounded-lg text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-700 text-white rounded-lg text-xs font-bold hover:bg-emerald-800"
                >
                  Save Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
