import React, { useState } from 'react';
import { Calculator, X, CheckCircle2, AlertTriangle, Printer } from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { Shift } from '../../types/grocery';

interface ZReportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ZReportModal: React.FC<ZReportModalProps> = ({ isOpen, onClose }) => {
  const { currentShift, closeShift, settings, shifts } = useStore();
  const [countedCashInput, setCountedCashInput] = useState('');
  const [notes, setNotes] = useState('');
  const [closedShiftResult, setClosedShiftResult] = useState<Shift | null>(null);

  if (!isOpen) return null;

  const countedCash = parseFloat(countedCashInput) || 0;
  const expectedCash = currentShift
    ? currentShift.openingFloat + currentShift.cashSales + currentShift.cashIn - currentShift.cashOut
    : 0;
  const variance = countedCash - expectedCash;

  const handleCloseShift = () => {
    if (!currentShift) return;
    const closed = closeShift(countedCash, notes);
    setClosedShiftResult(closed);
  };

  const handlePrintZ = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
      <div className="w-full max-w-lg rounded-xl bg-white shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-slate-900 text-white">
          <div className="flex items-center gap-2">
            <Calculator className="w-5 h-5 text-emerald-400" />
            <h2 className="text-sm font-bold">End-of-Day Cash Reconciliation (Z-Report)</h2>
          </div>
          <button onClick={onClose} className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5">
          {closedShiftResult ? (
            <div className="space-y-4">
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-center">
                <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto mb-1.5" />
                <h3 className="text-sm font-bold text-emerald-900">Shift Successfully Closed & Audited</h3>
                <p className="text-2xs text-emerald-700">Audit report generated and saved to immutable ledger.</p>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs font-mono">
                <div className="flex justify-between">
                  <span className="text-slate-600">Cashier:</span>
                  <span className="font-bold text-slate-900">{closedShiftResult.cashierName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Opening Float:</span>
                  <span className="font-bold">KSh {closedShiftResult.openingFloat.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Total Cash Sales:</span>
                  <span className="font-bold text-emerald-700">+KSh {closedShiftResult.cashSales.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Total M-Pesa Sales:</span>
                  <span className="font-bold text-emerald-700">KSh {closedShiftResult.mpesaSales.toFixed(2)}</span>
                </div>
                <div className="flex justify-between border-t border-slate-300 pt-1.5">
                  <span className="text-slate-800 font-bold">Expected Cash in Drawer:</span>
                  <span className="font-bold">KSh {closedShiftResult.expectedCash.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-800 font-bold">Physical Counted Cash:</span>
                  <span className="font-bold">KSh {closedShiftResult.countedCash?.toFixed(2)}</span>
                </div>
                <div className="flex justify-between border-t border-slate-300 pt-1.5 text-sm">
                  <span className="font-extrabold text-slate-900">Cash Variance (Over/Short):</span>
                  <span
                    className={`font-extrabold ${
                      (closedShiftResult.variance || 0) < 0
                        ? 'text-red-600'
                        : (closedShiftResult.variance || 0) > 0
                        ? 'text-amber-600'
                        : 'text-emerald-700'
                    }`}
                  >
                    KSh {closedShiftResult.variance?.toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={handlePrintZ}
                  className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-bold hover:bg-slate-800 flex items-center gap-1.5"
                >
                  <Printer className="w-4 h-4" />
                  Print Z-Report Slip
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-xs font-bold hover:bg-slate-100"
                >
                  Close Window
                </button>
              </div>
            </div>
          ) : currentShift ? (
            <div className="space-y-4">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-600">Active Cashier:</span>
                  <span className="font-bold text-slate-900">{currentShift.cashierName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Opening Float:</span>
                  <span className="font-mono font-bold">KSh {currentShift.openingFloat.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Cash Sales (Today):</span>
                  <span className="font-mono font-bold text-emerald-700">KSh {currentShift.cashSales.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">M-Pesa Sales (Today):</span>
                  <span className="font-mono font-bold text-emerald-700">KSh {currentShift.mpesaSales.toLocaleString()}</span>
                </div>
                <div className="flex justify-between border-t border-slate-200 pt-1 text-slate-900 font-semibold">
                  <span>System Expected Cash in Drawer:</span>
                  <span className="font-mono font-bold text-slate-900">KSh {expectedCash.toLocaleString()}</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Physical Cash Counted in Till (KSh)
                </label>
                <input
                  type="number"
                  placeholder="Enter total physical notes and coins counted..."
                  value={countedCashInput}
                  onChange={(e) => setCountedCashInput(e.target.value)}
                  autoFocus
                  className="w-full px-3 py-2 text-base font-mono font-bold border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              {countedCashInput && (
                <div
                  className={`p-3 rounded-lg border text-xs flex items-center justify-between font-mono ${
                    variance === 0
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                      : variance < 0
                      ? 'bg-red-50 border-red-200 text-red-900'
                      : 'bg-amber-50 border-amber-200 text-amber-900'
                  }`}
                >
                  <span className="font-semibold">Cash Variance:</span>
                  <span className="text-sm font-bold">
                    {variance >= 0 ? '+' : ''}KSh {variance.toFixed(2)} ({variance === 0 ? 'Balanced' : variance < 0 ? 'Shortage' : 'Overage'})
                  </span>
                </div>
              )}

              <div>
                <label className="block text-2xs font-semibold text-slate-600 uppercase mb-1">
                  Reconciliation Notes / Remarks
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Returned change to Mama Jane, petty purchase of masking tape..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleCloseShift}
                  disabled={!countedCashInput}
                  className="px-5 py-2 bg-emerald-700 text-white rounded-lg text-xs font-bold hover:bg-emerald-800 disabled:opacity-40"
                >
                  Confirm & Finalize Z-Report
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-6 text-slate-500 text-xs">
              No active shift currently open to reconcile. Start a shift from the Cashier menu.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
