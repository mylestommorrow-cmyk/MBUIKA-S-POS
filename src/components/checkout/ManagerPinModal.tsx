import React, { useState } from 'react';
import { ShieldAlert, X } from 'lucide-react';
import { useStore } from '../../context/StoreContext';

interface ManagerPinModalProps {
  isOpen: boolean;
  title?: string;
  description?: string;
  onClose: () => void;
  onSuccess: (managerName: string) => void;
}

export const ManagerPinModal: React.FC<ManagerPinModalProps> = ({
  isOpen,
  title = 'Manager Authorization Required',
  description = 'Enter owner or manager PIN to authorize this sensitive action.',
  onClose,
  onSuccess
}) => {
  const { verifyManagerPin, employees } = useStore();
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

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (verifyManagerPin(pin)) {
      const authorizedManager = employees.find(
        (e) => (e.role === 'owner' || e.role === 'manager') && e.pin === pin
      );
      onSuccess(authorizedManager?.name || 'Authorized Manager');
      setPin('');
      setError('');
      onClose();
    } else {
      setError('Invalid Manager PIN. Contact John Mbuika or Mary Mwangi.');
      setPin('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
      <div className="w-full max-w-sm rounded-xl bg-white shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-red-700 text-white">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-red-200" />
            <h2 className="text-sm font-bold">{title}</h2>
          </div>
          <button onClick={onClose} className="p-1 rounded hover:bg-red-800 text-red-200 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5">
          <p className="text-xs text-slate-600 mb-3">{description}</p>

          <div className="text-center mb-3">
            <div className="flex justify-center gap-2 mb-2">
              {[0, 1, 2, 3].map((idx) => (
                <div
                  key={idx}
                  className={`w-9 h-11 rounded border flex items-center justify-center text-lg font-mono font-bold ${
                    pin[idx] ? 'border-red-600 bg-red-50 text-slate-900' : 'border-slate-300 bg-white'
                  }`}
                >
                  {pin[idx] ? '•' : ''}
                </div>
              ))}
            </div>
            {error && <p className="text-2xs text-red-600 font-bold">{error}</p>}
          </div>

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
              onClick={() => setPin('')}
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
            className="w-full py-2.5 rounded-lg bg-red-700 text-white text-xs font-bold hover:bg-red-800 disabled:opacity-40 transition-colors"
          >
            Authorize Action
          </button>
        </div>
      </div>
    </div>
  );
};
