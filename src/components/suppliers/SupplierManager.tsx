import React, { useState } from 'react';
import { Truck, Phone, Mail, Plus, DollarSign, Search, CheckCircle2 } from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { Supplier } from '../../types/grocery';

export const SupplierManager: React.FC = () => {
  const { suppliers } = useStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  const totalPayables = suppliers.reduce((sum, s) => sum + s.amountOwed, 0);

  const filtered = suppliers.filter(
    (s) =>
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.contactPerson.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.phone.includes(searchTerm)
  );

  return (
    <div className="flex-1 flex flex-col p-4 md:p-6 bg-slate-100 overflow-y-auto space-y-4">
      {/* 1. Header & Summary Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
        <div>
          <span className="text-2xs text-emerald-700 font-mono font-bold uppercase tracking-wider block">
            Procurement & Accounts Payable
          </span>
          <h1 className="text-lg md:text-xl font-extrabold text-slate-900 tracking-tight">
            Supplier Directory & Payables
          </h1>
          <p className="text-2xs text-slate-500 mt-0.5">
            Manage food distributors, wholesale purchase accounts, amounts owed, and settlement terms.
          </p>
        </div>

        <div className="px-4 py-2 bg-slate-900 text-white rounded-lg text-right">
          <span className="text-2xs text-slate-400 font-bold uppercase block">Total Supplier Invoices Owed</span>
          <span className="text-lg font-mono font-extrabold text-emerald-400 tabular-nums">
            KSh {totalPayables.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </span>
        </div>
      </div>

      {/* 2. Search Bar */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search suppliers by name, contact person, or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-600"
          />
        </div>
      </div>

      {/* 3. Supplier Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5">
        {filtered.map((s) => (
          <div
            key={s.id}
            className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">{s.name}</h3>
                  <p className="text-2xs text-slate-600 font-medium mt-0.5">Contact: {s.contactPerson}</p>
                </div>
                <Truck className="w-5 h-5 text-slate-400" />
              </div>

              <div className="mt-3 space-y-1 text-2xs text-slate-500">
                <p className="flex items-center gap-1.5">
                  <Phone className="w-3 h-3 text-slate-400" />
                  <span>{s.phone}</span>
                </p>
                {s.email && (
                  <p className="flex items-center gap-1.5">
                    <Mail className="w-3 h-3 text-slate-400" />
                    <span>{s.email}</span>
                  </p>
                )}
                {s.terms && (
                  <p className="text-3xs text-slate-500 italic mt-1 bg-slate-50 p-1.5 rounded">
                    Payment terms: {s.terms}
                  </p>
                )}
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
              <div>
                <span className="text-3xs text-slate-400 block uppercase">Outstanding Payable:</span>
                <span
                  className={`text-sm font-bold font-mono tabular-nums ${
                    s.amountOwed > 0 ? 'text-red-700' : 'text-emerald-700'
                  }`}
                >
                  KSh {s.amountOwed.toLocaleString()}
                </span>
              </div>
              <button
                type="button"
                className="px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 text-2xs font-semibold"
              >
                View Orders
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
