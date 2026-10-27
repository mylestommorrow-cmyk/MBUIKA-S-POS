import React, { useState } from 'react';
import {
  Trash2,
  Plus,
  Minus,
  Tag,
  User,
  ShoppingBag,
  CreditCard,
  Pause,
  Percent,
  AlertTriangle
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { ManagerPinModal } from './ManagerPinModal';

interface CartPanelProps {
  onOpenPayment: () => void;
  onOpenCustomerSelect: () => void;
}

export const CartPanel: React.FC<CartPanelProps> = ({ onOpenPayment, onOpenCustomerSelect }) => {
  const {
    activeCart,
    cartTabs,
    activeTabId,
    setActiveTabId,
    createCartTab,
    removeCartTab,
    updateCartItemQuantity,
    updateCartItemDiscount,
    removeFromCart,
    clearActiveCart,
    customers,
    currentUser
  } = useStore();

  const [cartDiscount, setCartDiscount] = useState<number>(0);
  const [editingDiscountId, setEditingDiscountId] = useState<string | null>(null);
  const [discountInput, setDiscountInput] = useState<string>('');

  // Manager PIN modal state for clearing cart / voiding
  const [showManagerPin, setShowManagerPin] = useState(false);
  const [pendingAction, setPendingAction] = useState<'clear' | 'remove_item' | null>(null);
  const [itemToRemove, setItemToRemove] = useState<string | null>(null);

  const activeTab = cartTabs.find((t) => t.id === activeTabId);
  const activeCustomer = customers.find((c) => c.id === activeTab?.customerId);

  const subtotal = activeCart.reduce((sum, it) => sum + it.lineTotal, 0);
  const grandTotal = Math.max(0, subtotal - cartDiscount);
  const taxTotal = activeCart.reduce((sum, it) => sum + it.taxAmount, 0);

  const handleRequestClear = () => {
    if (activeCart.length === 0) return;
    if (currentUser.role === 'owner' || currentUser.role === 'manager') {
      clearActiveCart();
      setCartDiscount(0);
    } else {
      setPendingAction('clear');
      setShowManagerPin(true);
    }
  };

  const handleRequestRemoveItem = (productId: string) => {
    removeFromCart(productId);
  };

  const handleManagerSuccess = () => {
    if (pendingAction === 'clear') {
      clearActiveCart();
      setCartDiscount(0);
    } else if (pendingAction === 'remove_item' && itemToRemove) {
      removeFromCart(itemToRemove);
    }
    setPendingAction(null);
    setItemToRemove(null);
  };

  const handleSaveLineDiscount = (productId: string) => {
    const val = parseFloat(discountInput) || 0;
    updateCartItemDiscount(productId, val);
    setEditingDiscountId(null);
    setDiscountInput('');
  };

  return (
    <div className="flex flex-col h-full bg-white border-l border-slate-200">
      {/* 1. Multi-Cart Held Sales Tabs */}
      <div className="flex items-center gap-1 p-2 bg-slate-100 border-b border-slate-200 overflow-x-auto scrollbar-none">
        {cartTabs.map((tab) => {
          const isActive = tab.id === activeTabId;
          const itemsCount = tab.items.reduce((acc, it) => acc + (it.isWeighed ? 1 : it.quantity), 0);
          return (
            <div
              key={tab.id}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium cursor-pointer transition-colors shrink-0 ${
                isActive
                  ? 'bg-white text-slate-900 shadow-2xs font-bold border border-slate-300'
                  : 'text-slate-600 hover:bg-slate-200'
              }`}
              onClick={() => setActiveTabId(tab.id)}
            >
              <span>{tab.name}</span>
              {itemsCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-3xs font-mono bg-emerald-100 text-emerald-800">
                  {itemsCount}
                </span>
              )}
              {cartTabs.length > 1 && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeCartTab(tab.id);
                  }}
                  className="ml-1 text-slate-400 hover:text-red-600"
                >
                  ×
                </button>
              )}
            </div>
          );
        })}

        <button
          type="button"
          onClick={createCartTab}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 shrink-0"
          title="Hold current sale and open new cart"
        >
          <Pause className="w-3 h-3" />
          <span>Hold New</span>
        </button>
      </div>

      {/* 2. Customer Selector Bar */}
      <div className="flex items-center justify-between px-3.5 py-2 bg-slate-50 border-b border-slate-200 text-xs">
        <div className="flex items-center gap-2 truncate">
          <User className="w-3.5 h-3.5 text-slate-500 shrink-0" />
          {activeCustomer ? (
            <div className="truncate">
              <span className="font-bold text-slate-900">{activeCustomer.name}</span>
              <span className="text-2xs text-slate-500 ml-1.5">
                (Owed: KSh {activeCustomer.currentCredit.toLocaleString()})
              </span>
            </div>
          ) : (
            <span className="text-slate-600">Walk-in Customer</span>
          )}
        </div>
        <button
          type="button"
          onClick={onOpenCustomerSelect}
          className="text-2xs font-bold text-emerald-700 hover:text-emerald-800 underline whitespace-nowrap ml-2"
        >
          {activeCustomer ? 'Change' : '+ Select / Mkopo'}
        </button>
      </div>

      {/* 3. Cart Line Items List */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-100 p-2">
        {activeCart.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
            <ShoppingBag className="w-12 h-12 text-slate-300 mb-2 stroke-1" />
            <p className="text-xs font-semibold text-slate-600">Your Checkout Cart is Empty</p>
            <p className="text-2xs text-slate-500 mt-1 max-w-[200px]">
              Scan barcode, tap a product card, or use fast search to add grocery items.
            </p>
          </div>
        ) : (
          activeCart.map((item) => (
            <div key={item.productId} className="py-2.5 px-2 hover:bg-slate-50 rounded-lg group transition-colors">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs font-bold text-slate-900 truncate">{item.productName}</h4>
                  <div className="flex items-center gap-2 text-2xs text-slate-500 mt-0.5">
                    <span>
                      KSh {item.finalPrice.toFixed(0)}/{item.unit}
                    </span>
                    {item.discountAmount > 0 && (
                      <span className="text-emerald-700 font-semibold font-mono">
                        (-KSh {item.discountAmount} off)
                      </span>
                    )}
                    {item.taxRate > 0 && <span>• 16% VAT</span>}
                  </div>
                </div>

                {/* Line Total */}
                <div className="text-right shrink-0">
                  <span className="text-xs font-bold font-mono text-slate-900 tabular-nums">
                    KSh {item.lineTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              {/* Controls Row: Qty - / +, Line Discount, Trash */}
              <div className="flex items-center justify-between mt-2 pt-1 border-t border-slate-100 text-2xs">
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() =>
                      updateCartItemQuantity(
                        item.productId,
                        item.isWeighed ? Math.max(0.1, item.quantity - 0.25) : item.quantity - 1
                      )
                    }
                    className="w-6 h-6 rounded bg-slate-200 hover:bg-slate-300 flex items-center justify-center text-slate-800 font-bold"
                  >
                    <Minus className="w-3 h-3" />
                  </button>

                  <span className="min-w-[44px] text-center font-mono font-bold text-xs text-slate-900 tabular-nums">
                    {item.isWeighed ? item.quantity.toFixed(2) : item.quantity} {item.unit}
                  </span>

                  <button
                    type="button"
                    onClick={() =>
                      updateCartItemQuantity(
                        item.productId,
                        item.isWeighed ? item.quantity + 0.25 : item.quantity + 1
                      )
                    }
                    className="w-6 h-6 rounded bg-slate-200 hover:bg-slate-300 flex items-center justify-center text-slate-800 font-bold"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  {editingDiscountId === item.productId ? (
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        placeholder="Disc (KSh)"
                        value={discountInput}
                        onChange={(e) => setDiscountInput(e.target.value)}
                        className="w-16 px-1.5 py-0.5 text-2xs border border-emerald-400 rounded font-mono"
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={() => handleSaveLineDiscount(item.productId)}
                        className="px-1.5 py-0.5 bg-emerald-700 text-white rounded text-3xs font-bold"
                      >
                        OK
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingDiscountId(item.productId);
                        setDiscountInput(item.discountAmount ? item.discountAmount.toString() : '');
                      }}
                      className="flex items-center gap-1 text-slate-500 hover:text-emerald-700"
                      title="Add line discount"
                    >
                      <Tag className="w-3 h-3" />
                      <span>Disc</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => handleRequestRemoveItem(item.productId)}
                    className="text-slate-400 hover:text-red-600 p-1"
                    title="Remove item"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* 4. Financial Totals & Checkout Actions */}
      <div className="p-3.5 bg-slate-50 border-t border-slate-200 space-y-2">
        <div className="space-y-1 text-xs">
          <div className="flex justify-between text-slate-600">
            <span>Subtotal:</span>
            <span className="font-mono font-semibold tabular-nums">
              KSh {subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
          </div>

          {taxTotal > 0 && (
            <div className="flex justify-between text-2xs text-slate-500">
              <span>Incl. 16% VAT (eTIMS):</span>
              <span className="font-mono tabular-nums">KSh {taxTotal.toFixed(2)}</span>
            </div>
          )}

          {cartDiscount > 0 && (
            <div className="flex justify-between text-xs text-emerald-700 font-semibold">
              <span>Cart Discount:</span>
              <span className="font-mono tabular-nums">-KSh {cartDiscount.toFixed(2)}</span>
            </div>
          )}

          <div className="flex justify-between items-baseline pt-1.5 border-t border-slate-200">
            <span className="text-sm font-extrabold text-slate-900">GRAND TOTAL:</span>
            <span className="text-xl font-extrabold font-mono text-emerald-800 tabular-nums">
              KSh {grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        {/* Primary Pay Action & Clear Button */}
        <div className="grid grid-cols-4 gap-2 pt-1">
          <button
            type="button"
            onClick={handleRequestClear}
            disabled={activeCart.length === 0}
            className="col-span-1 py-3 rounded-lg border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-200 disabled:opacity-40 transition-colors"
            title="Clear active cart (F8)"
          >
            Clear (F8)
          </button>

          <button
            type="button"
            onClick={onOpenPayment}
            disabled={activeCart.length === 0}
            className="col-span-3 py-3 rounded-lg bg-emerald-700 text-white text-sm font-extrabold hover:bg-emerald-800 disabled:opacity-40 transition-colors flex items-center justify-center gap-2 shadow-sm"
          >
            <CreditCard className="w-4 h-4" />
            <span>PAY (F2) • KSh {grandTotal.toLocaleString()}</span>
          </button>
        </div>
      </div>

      <ManagerPinModal
        isOpen={showManagerPin}
        title="Manager PIN Authorization"
        description="A manager PIN is required to void items or clear active sales."
        onClose={() => {
          setShowManagerPin(false);
          setPendingAction(null);
          setItemToRemove(null);
        }}
        onSuccess={handleManagerSuccess}
      />
    </div>
  );
};
