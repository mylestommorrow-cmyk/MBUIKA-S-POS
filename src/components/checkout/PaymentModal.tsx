import React, { useState } from 'react';
import {
  Banknote,
  Smartphone,
  CreditCard,
  BookOpen,
  Split,
  X,
  CheckCircle2,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { PaymentMethod, PaymentSplit } from '../../types/grocery';
import { DarajaMpesaService } from '../../services/darajaMpesa';

interface PaymentModalProps {
  isOpen: boolean;
  totalAmount: number;
  subtotalAmount: number;
  discountAmount: number;
  onClose: () => void;
  onPaymentComplete: () => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  totalAmount,
  discountAmount,
  onClose,
  onPaymentComplete
}) => {
  const { customers, processSale, settings } = useStore();
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('cash');

  // Cash state
  const [cashTendered, setCashTendered] = useState<string>(totalAmount.toString());

  // M-Pesa state
  const [mpesaPhone, setMpesaPhone] = useState('0722123456');
  const [isSendingStk, setIsSendingStk] = useState(false);
  const [stkStatus, setStkStatus] = useState<string | null>(null);
  const [mpesaReceiptCode, setMpesaReceiptCode] = useState<string | null>(null);

  // Credit (Mkopo) state
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(customers[0]?.id || '');

  // Split state
  const [splitCash, setSplitCash] = useState<number>(Math.floor(totalAmount / 2));
  const [splitMpesa, setSplitMpesa] = useState<number>(totalAmount - Math.floor(totalAmount / 2));
  const [splitMpesaRef, setSplitMpesaRef] = useState('SKM' + Math.floor(100000 + Math.random() * 900000));

  // Error / Loading
  const [error, setError] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  const tenderedNum = parseFloat(cashTendered) || 0;
  const changeGiven = Math.max(0, tenderedNum - totalAmount);

  // Customer credit validation
  const chosenCustomer = customers.find((c) => c.id === selectedCustomerId);
  const creditAvailable = chosenCustomer ? chosenCustomer.creditLimit - chosenCustomer.currentCredit : 0;
  const creditExceeded = selectedMethod === 'credit' && chosenCustomer && totalAmount > creditAvailable;

  const handleCashPreset = (amount: number) => {
    setCashTendered(amount.toString());
  };

  const handleSendStkPush = async () => {
    setError('');
    setIsSendingStk(true);
    setStkStatus('Sending Lipa na M-Pesa STK Push to ' + mpesaPhone + '...');
    try {
      const resp = await DarajaMpesaService.initiateStkPush(
        {
          phoneNumber: mpesaPhone,
          amount: totalAmount,
          accountReference: 'MBK-' + Math.floor(1000 + Math.random() * 9000),
          transactionDesc: 'Mbuikas Grocery Retail POS'
        },
        settings
      );

      setStkStatus('STK prompt displayed on customer phone. Waiting for M-Pesa PIN...');

      // Simulate customer entering PIN
      const queryResp = await DarajaMpesaService.queryTransactionStatus(
        resp.checkoutRequestId,
        mpesaPhone,
        totalAmount
      );

      setMpesaReceiptCode(queryResp.mpesaReceiptNumber || 'SKF98200ZZ');
      setStkStatus(`Confirmed! M-Pesa Ref: ${queryResp.mpesaReceiptNumber}`);
    } catch (err: any) {
      setError(err.message || 'M-Pesa STK push failed.');
      setStkStatus(null);
    } finally {
      setIsSendingStk(false);
    }
  };

  const handleFinalizePayment = async () => {
    setError('');
    setIsProcessing(true);

    try {
      if (selectedMethod === 'cash') {
        if (tenderedNum < totalAmount) {
          throw new Error(`Cash tendered (KSh ${tenderedNum}) is less than total (KSh ${totalAmount})`);
        }
        await processSale({
          paymentMethod: 'cash',
          cashTendered: tenderedNum,
          changeGiven,
          discountTotal: discountAmount
        });
      } else if (selectedMethod === 'mpesa') {
        const receiptCode = mpesaReceiptCode || 'SKF' + Math.floor(100000 + Math.random() * 900000);
        await processSale({
          paymentMethod: 'mpesa',
          mpesaPhone,
          mpesaReceipt: receiptCode,
          discountTotal: discountAmount
        });
      } else if (selectedMethod === 'credit') {
        if (!chosenCustomer) {
          throw new Error('Please select a registered customer for credit sales.');
        }
        if (creditExceeded) {
          throw new Error(`Credit limit exceeded! Available credit: KSh ${creditAvailable}`);
        }
        await processSale({
          paymentMethod: 'credit',
          customerId: chosenCustomer.id,
          discountTotal: discountAmount
        });
      } else if (selectedMethod === 'split') {
        if (splitCash + splitMpesa < totalAmount) {
          throw new Error('Split totals do not equal grand total.');
        }
        const splits: PaymentSplit[] = [
          { method: 'cash', amount: splitCash },
          { method: 'mpesa', amount: splitMpesa, reference: splitMpesaRef }
        ];
        await processSale({
          paymentMethod: 'split',
          splits,
          discountTotal: discountAmount
        });
      } else if (selectedMethod === 'card') {
        await processSale({
          paymentMethod: 'card',
          discountTotal: discountAmount
        });
      }

      onPaymentComplete();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Payment processing error.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
      <div className="w-full max-w-xl rounded-xl bg-white shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white">
          <div>
            <span className="text-2xs text-emerald-400 font-mono uppercase tracking-wider block">Point of Sale</span>
            <h2 className="text-lg font-bold">Complete Payment</h2>
          </div>
          <div className="text-right">
            <span className="text-2xs text-slate-400 uppercase tracking-wider block">Grand Total Due</span>
            <span className="text-xl font-mono font-extrabold text-emerald-400 tabular-nums">
              KSh {totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        {/* Payment Method Selector Tabs */}
        <div className="grid grid-cols-5 border-b border-slate-200 bg-slate-50 text-xs font-semibold">
          {[
            { id: 'cash', label: 'Cash', icon: <Banknote className="w-4 h-4" /> },
            { id: 'mpesa', label: 'M-Pesa (Till)', icon: <Smartphone className="w-4 h-4 text-emerald-600" /> },
            { id: 'credit', label: 'Mkopo (Credit)', icon: <BookOpen className="w-4 h-4" /> },
            { id: 'split', label: 'Split Pay', icon: <Split className="w-4 h-4" /> },
            { id: 'card', label: 'Card / Bank', icon: <CreditCard className="w-4 h-4" /> }
          ].map((m) => {
            const isSel = selectedMethod === m.id;
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => {
                  setSelectedMethod(m.id as PaymentMethod);
                  setError('');
                }}
                className={`flex flex-col items-center justify-center py-3 gap-1 transition-colors border-r border-slate-200 last:border-r-0 ${
                  isSel
                    ? 'bg-white text-emerald-800 border-b-2 border-b-emerald-700 font-bold shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                {m.icon}
                <span>{m.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-700 text-xs rounded-lg flex items-center gap-2 border border-red-200">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* 1. CASH FLOW */}
          {selectedMethod === 'cash' && (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Cash Tendered (KSh)</label>
              <div className="flex gap-2 mb-3">
                <input
                  type="number"
                  value={cashTendered}
                  onChange={(e) => setCashTendered(e.target.value)}
                  className="w-full px-4 py-2 text-xl font-mono font-bold text-slate-900 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-600 tabular-nums"
                  placeholder="0.00"
                  autoFocus
                />
              </div>

              {/* Quick Cash Presets */}
              <p className="text-2xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Fast Cash Presets</p>
              <div className="grid grid-cols-6 gap-2 mb-4">
                <button
                  type="button"
                  onClick={() => handleCashPreset(totalAmount)}
                  className="py-2 text-xs font-bold rounded-lg border border-emerald-600 bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
                >
                  Exact
                </button>
                {[
                  Math.ceil(totalAmount / 50) * 50,
                  Math.ceil(totalAmount / 100) * 100,
                  500,
                  1000,
                  2000
                ].map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleCashPreset(preset)}
                    className="py-2 text-xs font-semibold rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-800"
                  >
                    KSh {preset}
                  </button>
                ))}
              </div>

              {/* Change Box */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="text-xs font-medium text-slate-600 block">Change to Return Customer:</span>
                  <span className="text-2xs text-slate-400">Cash Drawer Drawer Will Open</span>
                </div>
                <span
                  className={`text-2xl font-mono font-extrabold tabular-nums ${
                    changeGiven > 0 ? 'text-emerald-700' : 'text-slate-700'
                  }`}
                >
                  KSh {changeGiven.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          )}

          {/* 2. M-PESA DARAJA STK PUSH */}
          {selectedMethod === 'mpesa' && (
            <div>
              <div className="p-4 bg-emerald-50/60 rounded-xl border border-emerald-200 mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-emerald-900">Lipa na M-Pesa Online (Daraja API)</span>
                  <span className="text-2xs bg-emerald-200 text-emerald-800 font-bold px-2 py-0.5 rounded uppercase">
                    Till: {settings.mpesaShortcode}
                  </span>
                </div>
                <label className="block text-2xs font-semibold text-emerald-950 uppercase mb-1">
                  Customer Safaricom Mobile Number
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={mpesaPhone}
                    onChange={(e) => setMpesaPhone(e.target.value)}
                    placeholder="07XXXXXXXX or 2547XXXXXXXX"
                    className="flex-1 px-3 py-2 text-sm font-mono border border-emerald-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-600 bg-white"
                  />
                  <button
                    type="button"
                    onClick={handleSendStkPush}
                    disabled={isSendingStk}
                    className="px-4 py-2 bg-emerald-700 text-white rounded-lg text-xs font-bold hover:bg-emerald-800 disabled:opacity-50 flex items-center gap-1.5 transition-colors"
                  >
                    {isSendingStk ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Prompting Phone...
                      </>
                    ) : (
                      'Send STK Push'
                    )}
                  </button>
                </div>
              </div>

              {stkStatus && (
                <div className="p-3 bg-slate-900 text-emerald-400 text-xs font-mono rounded-lg mb-3 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{stkStatus}</span>
                </div>
              )}

              <div className="text-2xs text-slate-500">
                <p>• Prompts customer on their Safaricom phone to enter M-Pesa PIN directly.</p>
                <p>• If customer paid manually via Till {settings.mpesaShortcode}, click Complete Sale to confirm.</p>
              </div>
            </div>
          )}

          {/* 3. MKOPO (CUSTOMER CREDIT BOOK) */}
          {selectedMethod === 'credit' && (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Select Credit Customer</label>
              <select
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-600 bg-white mb-3"
              >
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.phone}) — Limit: KSh {c.creditLimit} | Owed: KSh {c.currentCredit}
                  </option>
                ))}
              </select>

              {chosenCustomer && (
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Credit Limit:</span>
                    <span className="font-mono font-bold text-slate-900">KSh {chosenCustomer.creditLimit.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Current Outstanding Debt:</span>
                    <span className="font-mono font-bold text-amber-700">KSh {chosenCustomer.currentCredit.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between border-t border-slate-200 pt-1.5">
                    <span className="text-slate-800 font-semibold">Available Credit Before Sale:</span>
                    <span className={`font-mono font-bold ${creditAvailable >= totalAmount ? 'text-emerald-700' : 'text-red-600'}`}>
                      KSh {creditAvailable.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between border-t border-slate-200 pt-1.5">
                    <span className="text-slate-800 font-semibold">New Debt Balance After Sale:</span>
                    <span className="font-mono font-extrabold text-slate-900">
                      KSh {(chosenCustomer.currentCredit + totalAmount).toLocaleString()}
                    </span>
                  </div>
                </div>
              )}

              {creditExceeded && (
                <p className="mt-2 text-xs text-red-600 font-bold">
                  ⚠️ This sale exceeds the customer approved credit limit!
                </p>
              )}
            </div>
          )}

          {/* 4. SPLIT PAYMENT */}
          {selectedMethod === 'split' && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-2xs font-semibold text-slate-600 uppercase mb-1">
                    Portion 1: Cash Amount
                  </label>
                  <input
                    type="number"
                    value={splitCash}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value) || 0;
                      setSplitCash(val);
                      setSplitMpesa(Math.max(0, totalAmount - val));
                    }}
                    className="w-full px-3 py-2 text-sm font-mono border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-2xs font-semibold text-slate-600 uppercase mb-1">
                    Portion 2: M-Pesa Amount
                  </label>
                  <input
                    type="number"
                    value={splitMpesa}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value) || 0;
                      setSplitMpesa(val);
                      setSplitCash(Math.max(0, totalAmount - val));
                    }}
                    className="w-full px-3 py-2 text-sm font-mono border border-slate-300 rounded-lg"
                  />
                </div>
              </div>
              <div>
                <label className="block text-2xs font-semibold text-slate-600 uppercase mb-1">
                  M-Pesa Reference / Code
                </label>
                <input
                  type="text"
                  value={splitMpesaRef}
                  onChange={(e) => setSplitMpesaRef(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-lg uppercase"
                />
              </div>
            </div>
          )}

          {/* 5. CARD / BANK */}
          {selectedMethod === 'card' && (
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-center">
              <CreditCard className="w-10 h-10 mx-auto text-slate-500 mb-2" />
              <p className="text-xs text-slate-800 font-semibold">Swipe or Tap Customer Card on PDQ Terminal</p>
              <p className="text-2xs text-slate-500 mt-1">Once approved by the bank card terminal, click Complete Sale.</p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-100 border-t border-slate-200">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-200"
          >
            Cancel (Esc)
          </button>

          <button
            type="button"
            onClick={handleFinalizePayment}
            disabled={isProcessing || (selectedMethod === 'credit' && creditExceeded)}
            className="px-6 py-2.5 rounded-lg bg-emerald-700 text-white text-xs font-bold hover:bg-emerald-800 disabled:opacity-40 transition-colors flex items-center gap-2 shadow-sm"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Recording Sale...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                Complete Sale (KSh {totalAmount.toLocaleString()})
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
