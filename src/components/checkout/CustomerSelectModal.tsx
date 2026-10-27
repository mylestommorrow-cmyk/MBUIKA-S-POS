import React, { useState } from 'react';
import { Search, UserCheck, UserPlus, X, Phone, DollarSign } from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { Customer } from '../../types/grocery';

interface CustomerSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectCustomer: (customer?: Customer) => void;
}

export const CustomerSelectModal: React.FC<CustomerSelectModalProps> = ({
  isOpen,
  onClose,
  onSelectCustomer
}) => {
  const { customers } = useStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  // New customer form
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newCreditLimit, setNewCreditLimit] = useState('5000');

  if (!isOpen) return null;

  const filtered = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.phone.includes(searchTerm)
  );

  const handleSelect = (customer?: Customer) => {
    onSelectCustomer(customer);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
      <div className="w-full max-w-md rounded-xl bg-white shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-slate-900 text-white shrink-0">
          <div className="flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-emerald-400" />
            <h2 className="text-sm font-bold">Select Customer / Mkopo Account</h2>
          </div>
          <button onClick={onClose} className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search & Actions */}
        <div className="p-4 border-b border-slate-200 bg-slate-50 shrink-0 space-y-2">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by customer name or Safaricom phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              autoFocus
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-600 bg-white"
            />
          </div>

          <div className="flex justify-between items-center text-xs">
            <button
              type="button"
              onClick={() => handleSelect(undefined)}
              className="text-slate-600 hover:text-slate-900 underline font-medium"
            >
              Reset to Walk-in Customer
            </button>
            <button
              type="button"
              onClick={() => setShowAddForm(!showAddForm)}
              className="text-emerald-700 font-bold hover:text-emerald-800 flex items-center gap-1"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>{showAddForm ? 'Cancel Form' : '+ New Customer'}</span>
            </button>
          </div>
        </div>

        {/* Customer List */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100 p-2">
          {filtered.length === 0 ? (
            <div className="text-center py-8 text-slate-500 text-xs">
              No matching customers found.
            </div>
          ) : (
            filtered.map((c) => {
              const availableCredit = c.creditLimit - c.currentCredit;
              return (
                <div
                  key={c.id}
                  onClick={() => handleSelect(c)}
                  className="p-3 hover:bg-emerald-50 rounded-lg cursor-pointer transition-colors flex items-center justify-between"
                >
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">{c.name}</h4>
                    <div className="flex items-center gap-3 text-2xs text-slate-500 mt-0.5">
                      <span className="flex items-center gap-1">
                        <Phone className="w-3 h-3 text-slate-400" />
                        {c.phone}
                      </span>
                      <span>• Points: {c.loyaltyPoints}</span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-2xs text-slate-500 block">Debt Balance:</span>
                    <span
                      className={`text-xs font-bold font-mono tabular-nums ${
                        c.currentCredit > 0 ? 'text-amber-700' : 'text-emerald-700'
                      }`}
                    >
                      KSh {c.currentCredit.toLocaleString()}
                    </span>
                    <span className="text-3xs text-slate-400 block">
                      Limit: KSh {c.creditLimit.toLocaleString()}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
