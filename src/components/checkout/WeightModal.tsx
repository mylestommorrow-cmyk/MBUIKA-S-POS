import React, { useState, useEffect } from 'react';
import { Scale, X, Check, Activity } from 'lucide-react';
import { Product } from '../../types/grocery';

interface WeightModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (product: Product, quantity: number) => void;
}

export const WeightModal: React.FC<WeightModalProps> = ({ product, isOpen, onClose, onConfirm }) => {
  const [weightStr, setWeightStr] = useState('1.00');
  const [scaleConnected, setScaleConnected] = useState(true);

  useEffect(() => {
    if (product) {
      setWeightStr('1.00');
    }
  }, [product]);

  if (!isOpen || !product) return null;

  const currentWeight = parseFloat(weightStr) || 0;
  const totalPrice = currentWeight * product.sellingPrice;

  const handleKeypad = (char: string) => {
    if (char === '.' && weightStr.includes('.')) return;
    if (weightStr === '0' && char !== '.') {
      setWeightStr(char);
    } else {
      setWeightStr((prev) => prev + char);
    }
  };

  const handleClear = () => setWeightStr('0');
  const handleBackspace = () => setWeightStr((prev) => (prev.length > 1 ? prev.slice(0, -1) : '0'));

  const handlePreset = (kg: number) => setWeightStr(kg.toFixed(2));

  // Simulate scale reading jitter (CAS / Toledo scale emulation)
  const handleSimulateScale = () => {
    const randomKg = (Math.random() * 2.8 + 0.35).toFixed(3);
    setWeightStr(randomKg);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
      <div className="w-full max-w-md rounded-xl bg-white shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-emerald-800 text-white">
          <div className="flex items-center gap-2">
            <Scale className="w-5 h-5 text-emerald-300" />
            <div>
              <h2 className="text-sm font-bold">{product.name}</h2>
              <p className="text-2xs text-emerald-200">
                Unit Price: KSh {product.sellingPrice.toLocaleString()} per {product.unit}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded hover:bg-emerald-700 text-emerald-200 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Display Panel */}
        <div className="p-5 bg-slate-900 text-white border-b border-slate-800">
          <div className="flex items-center justify-between text-2xs text-slate-400 mb-1">
            <div className="flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
              <span>DIGITAL SCALE {scaleConnected ? 'STABLE (KG)' : 'MANUAL'}</span>
            </div>
            <button
              type="button"
              onClick={handleSimulateScale}
              className="text-2xs text-emerald-400 underline hover:text-emerald-300"
            >
              Simulate Scale Tare/Read
            </button>
          </div>

          <div className="flex items-baseline justify-between mt-2">
            <div>
              <span className="text-4xl font-extrabold font-mono text-emerald-400 tabular-nums">{weightStr}</span>
              <span className="ml-2 text-sm text-slate-400 uppercase font-medium">{product.unit}</span>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-400 block uppercase">Calculated Total</span>
              <span className="text-2xl font-bold font-mono text-white tabular-nums">
                KSh {totalPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>

        {/* Presets */}
        <div className="px-5 py-3 bg-slate-50 border-b border-slate-200">
          <p className="text-2xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Fast Grocery Weight Presets</p>
          <div className="grid grid-cols-5 gap-2">
            {[
              { label: '250g', val: 0.25 },
              { label: '500g', val: 0.5 },
              { label: '1.0kg', val: 1.0 },
              { label: '2.0kg', val: 2.0 },
              { label: '5.0kg', val: 5.0 }
            ].map((p) => (
              <button
                key={p.label}
                type="button"
                onClick={() => handlePreset(p.val)}
                className="py-1.5 rounded border border-slate-300 bg-white hover:bg-slate-100 text-xs font-semibold text-slate-700 transition-colors"
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Touch Keypad */}
        <div className="p-5">
          <div className="grid grid-cols-3 gap-2 mb-4">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0'].map((digit) => (
              <button
                key={digit}
                type="button"
                onClick={() => handleKeypad(digit)}
                className="py-3 text-lg font-bold text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg active:scale-95 transition-transform"
              >
                {digit}
              </button>
            ))}
            <button
              type="button"
              onClick={handleBackspace}
              className="py-3 text-sm font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg"
            >
              ⌫
            </button>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleClear}
              className="w-1/3 py-2.5 rounded-lg border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-100"
            >
              Zero / Clear
            </button>
            <button
              type="button"
              onClick={() => {
                if (currentWeight > 0) {
                  onConfirm(product, currentWeight);
                  onClose();
                }
              }}
              disabled={currentWeight <= 0}
              className="w-2/3 py-2.5 rounded-lg bg-emerald-700 text-white text-xs font-bold hover:bg-emerald-800 disabled:opacity-40 transition-colors flex items-center justify-center gap-1.5 shadow-sm"
            >
              <Check className="w-4 h-4" />
              Add {weightStr} {product.unit} (KSh {totalPrice.toFixed(0)})
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
