import React, { useState } from 'react';
import { Lock, UserCheck, X } from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { Employee } from '../../types/grocery';

interface PinLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PinLoginModal: React.FC<PinLoginModalProps> = ({ isOpen, onClose }) => {
  const { employees, currentUser, setCurrentUser } = useStore();
  const [selectedEmp, setSelectedEmp] = useState<Employee>(currentUser);
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleKeypadPress = (val: string) => {
    if (pin.length < 4) {
      setPin((prev) => prev + val);
      setError('');
    }
  };

  const handleBackspace = () => {
    setPin((prev) => prev.slice(0, -1));
    setError('');
  };

  const handleClear = () => {
    setPin('');
    setError('');
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (pin === selectedEmp.pin) {
      setCurrentUser(selectedEmp);
      setPin('');
      setError('');
      onClose();
    } else {
      setError('Incorrect 4-digit PIN. Please try again.');
      setPin('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
      <div className="w-full max-w-sm rounded-xl bg-white shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 bg-slate-900 text-white">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-emerald-400" />
            <h2 className="text-sm font-semibold tracking-wide">Cashier & Staff Switch</h2>
          </div>
          <button onClick={onClose} className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5">
          <label className="block text-xs font-medium text-slate-600 mb-1.5">Select Active Staff Member</label>
          <div className="grid grid-cols-2 gap-2 mb-4">
            {employees.map((emp) => {
              const isSelected = selectedEmp.id === emp.id;
              return (
                <button
                  key={emp.id}
                  type="button"
                  onClick={() => {
                    setSelectedEmp(emp);
                    setPin('');
                    setError('');
                  }}
                  className={`p-2.5 rounded-lg border text-left transition-colors ${
                    isSelected
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-950 font-medium'
                      : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-slate-50'
                  }`}
                >
                  <p className="text-xs truncate">{emp.name}</p>
                  <p className="text-2xs text-slate-500 uppercase tracking-wider">{emp.role.replace('_', ' ')}</p>
                </button>
              );
            })}
          </div>

          <div className="text-center mb-3">
            <p className="text-xs text-slate-600 mb-2">Enter 4-Digit Security PIN for <strong>{selectedEmp.name}</strong></p>
            <div className="flex justify-center gap-2">
              {[0, 1, 2, 3].map((idx) => (
                <div
                  key={idx}
                  className={`w-9 h-11 rounded border flex items-center justify-center text-lg font-mono font-bold ${
                    pin[idx] ? 'border-emerald-600 bg-emerald-50 text-slate-900' : 'border-slate-300 bg-white'
                  }`}
                >
                  {pin[idx] ? '•' : ''}
                </div>
              ))}
            </div>
            {error && <p className="mt-2 text-2xs text-red-600 font-medium">{error}</p>}
          </div>

          {/* Touch Number Pad for Cashier Station */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
              <button
                key={digit}
                type="button"
                onClick={() => handleKeypadPress(digit)}
                className="py-3 text-base font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg active:scale-95 transition-transform"
              >
                {digit}
              </button>
            ))}
            <button
              type="button"
              onClick={handleClear}
              className="py-3 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg"
            >
              CLEAR
            </button>
            <button
              type="button"
              onClick={() => handleKeypadPress('0')}
              className="py-3 text-base font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg active:scale-95 transition-transform"
            >
              0
            </button>
            <button
              type="button"
              onClick={handleBackspace}
              className="py-3 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg"
            >
              ⌫
            </button>
          </div>

          <button
            type="button"
            onClick={() => handleSubmit()}
            disabled={pin.length < 4}
            className="w-full py-2.5 rounded-lg bg-emerald-700 text-white text-xs font-bold hover:bg-emerald-800 disabled:opacity-40 transition-colors flex items-center justify-center gap-1.5"
          >
            <UserCheck className="w-4 h-4" />
            Switch Active User
          </button>
        </div>
      </div>
    </div>
  );
};
