import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  Scan,
  Scale,
  Sparkles,
  AlertCircle,
  Package,
  Layers
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { Product } from '../../types/grocery';
import { CartPanel } from './CartPanel';
import { WeightModal } from './WeightModal';
import { BarcodeScannerModal } from './BarcodeScannerModal';
import { PaymentModal } from './PaymentModal';
import { ReceiptModal } from './ReceiptModal';
import { CustomerSelectModal } from './CustomerSelectModal';

export const PosCheckout: React.FC = () => {
  const {
    products,
    addToCart,
    activeCart,
    createCartTab,
    clearActiveCart,
    setActiveCartCustomer,
    lastCompletedSale,
    language
  } = useStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Modals state
  const [weighedProduct, setWeighedProduct] = useState<Product | null>(null);
  const [showWeightModal, setShowWeightModal] = useState(false);
  const [showScannerModal, setShowScannerModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [showCustomerModal, setShowCustomerModal] = useState(false);

  const searchInputRef = useRef<HTMLInputElement>(null);

  // USB Hardware Barcode Scanner Listener
  // Hardware scanners type keystrokes very fast and send 'Enter' at the end
  const barcodeBufferRef = useRef<string>('');
  const lastKeyTimeRef = useRef<number>(0);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Hotkeys
      if (e.key === 'F2') {
        e.preventDefault();
        if (activeCart.length > 0) setShowPaymentModal(true);
      } else if (e.key === 'F3') {
        e.preventDefault();
        searchInputRef.current?.focus();
      } else if (e.key === 'F4') {
        e.preventDefault();
        createCartTab();
      } else if (e.key === 'F8') {
        e.preventDefault();
        clearActiveCart();
      }

      // Hardware barcode scanner keystroke collection
      const currentTime = Date.now();
      const timeDiff = currentTime - lastKeyTimeRef.current;
      lastKeyTimeRef.current = currentTime;

      // Ignore if user is purposefully typing inside search input
      if (document.activeElement === searchInputRef.current) {
        return;
      }

      if (e.key === 'Enter') {
        if (barcodeBufferRef.current.length >= 6) {
          const scannedCode = barcodeBufferRef.current;
          barcodeBufferRef.current = '';
          handleBarcodeScanned(scannedCode);
        }
        barcodeBufferRef.current = '';
      } else if (e.key.length === 1) {
        // Fast keystrokes (< 50ms) typically come from barcode scanners
        if (timeDiff < 60 || barcodeBufferRef.current.length === 0) {
          barcodeBufferRef.current += e.key;
        } else {
          barcodeBufferRef.current = e.key;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeCart, products]);

  const handleBarcodeScanned = (barcode: string) => {
    const found = products.find(
      (p) => p.barcode === barcode || p.sku.toLowerCase() === barcode.toLowerCase()
    );
    if (found) {
      if (found.isWeighed) {
        setWeighedProduct(found);
        setShowWeightModal(true);
      } else {
        addToCart(found, 1);
      }
    } else {
      alert(`Barcode ${barcode} not found in product database.`);
    }
  };

  const handleProductCardClick = (product: Product) => {
    if (product.isWeighed) {
      setWeighedProduct(product);
      setShowWeightModal(true);
    } else {
      addToCart(product, 1);
    }
  };

  const categories = [
    'all',
    'Flours & Grains',
    'Fresh Produce',
    'Dairy & Milk',
    'Cooking Oils & Fats',
    'Sugar & Sweeteners',
    'Household & Soaps'
  ];

  // Filter products by category and search
  const filteredProducts = products.filter((p) => {
    const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      p.name.toLowerCase().includes(q) ||
      (p.nameSwahili && p.nameSwahili.toLowerCase().includes(q)) ||
      p.barcode.includes(q) ||
      p.sku.toLowerCase().includes(q);

    return matchesCategory && matchesSearch;
  });

  const quickSaleProducts = products.filter((p) => p.isQuickSale);

  const cartSubtotal = activeCart.reduce((sum, it) => sum + it.lineTotal, 0);

  return (
    <div className="flex-1 flex flex-col lg:flex-row h-[calc(100vh-53px)] overflow-hidden bg-slate-100">
      {/* LEFT PANE: PRODUCT CATALOG & FAST TOUCH INTERFACE (65% on Desktop) */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden p-3 gap-2.5">
        {/* Top Controls: Search Input, Barcode Scanner, Scale Button */}
        <div className="flex items-center gap-2 bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs shrink-0">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder={language === 'sw' ? 'Tafuta bidhaa, barcode au SKU... (F3)' : 'Search products, barcode, or SKU... (F3)'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-600 font-medium"
            />
          </div>

          <button
            type="button"
            onClick={() => setShowScannerModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 transition-colors shrink-0"
            title="Scan barcode with phone camera or USB"
          >
            <Scan className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">Scan Barcode</span>
          </button>
        </div>

        {/* Quick Add Buttons: Kenyan Grocery Top Sellers */}
        {quickSaleProducts.length > 0 && selectedCategory === 'all' && !searchQuery && (
          <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs shrink-0">
            <div className="flex items-center gap-1.5 text-2xs font-bold text-slate-500 uppercase tracking-wider mb-2">
              <Sparkles className="w-3 h-3 text-amber-500" />
              <span>Fast Cashier Favorites (Quick Tap)</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2">
              {quickSaleProducts.slice(0, 6).map((prod) => (
                <button
                  key={prod.id}
                  type="button"
                  onClick={() => handleProductCardClick(prod)}
                  className="p-2 rounded-lg border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/50 text-left transition-all active:scale-95 group"
                >
                  <p className="text-xs font-bold text-slate-800 truncate group-hover:text-emerald-900">
                    {prod.name}
                  </p>
                  <div className="flex items-center justify-between text-2xs mt-1">
                    <span className="font-mono font-bold text-emerald-700 tabular-nums">
                      KSh {prod.sellingPrice}
                    </span>
                    <span className="text-3xs text-slate-500">{prod.unit}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Category Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none shrink-0">
          {categories.map((cat) => {
            const isSel = selectedCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors shrink-0 ${
                  isSel
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200'
                }`}
              >
                {cat === 'all' ? 'All Products' : cat}
              </button>
            );
          })}
        </div>

        {/* Main Product Grid */}
        <div className="flex-1 overflow-y-auto">
          {filteredProducts.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 text-slate-400 bg-white rounded-xl border border-slate-200">
              <Package className="w-12 h-12 text-slate-300 mb-2" />
              <p className="text-sm font-semibold text-slate-700">No matching products found</p>
              <p className="text-xs text-slate-500 mt-1">Check search query or switch categories.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-2.5 pb-2">
              {filteredProducts.map((p) => {
                const isLowStock = p.currentStock <= p.minStockLevel;
                return (
                  <div
                    key={p.id}
                    onClick={() => handleProductCardClick(p)}
                    className="p-3 bg-white rounded-xl border border-slate-200 hover:border-emerald-500 hover:shadow-sm cursor-pointer transition-all active:scale-[0.98] flex flex-col justify-between group"
                  >
                    <div>
                      {/* Category & Weighed badge */}
                      <div className="flex items-center justify-between text-3xs text-slate-500 mb-1">
                        <span className="truncate">{p.category}</span>
                        {p.isWeighed && (
                          <span className="flex items-center gap-0.5 text-emerald-700 font-bold bg-emerald-50 px-1 py-0.2 rounded">
                            <Scale className="w-2.5 h-2.5" />
                            <span>Scale</span>
                          </span>
                        )}
                      </div>

                      <h3 className="text-xs font-bold text-slate-900 group-hover:text-emerald-800 line-clamp-2 leading-snug">
                        {p.name}
                      </h3>

                      {p.nameSwahili && (
                        <p className="text-3xs text-slate-500 italic truncate mt-0.5">{p.nameSwahili}</p>
                      )}
                    </div>

                    <div className="mt-3 pt-2 border-t border-slate-100 flex items-baseline justify-between">
                      <div>
                        <span className="text-xs font-mono font-extrabold text-emerald-800 tabular-nums">
                          KSh {p.sellingPrice.toLocaleString()}
                        </span>
                        <span className="text-3xs text-slate-500 ml-0.5">/{p.unit}</span>
                      </div>

                      <span
                        className={`text-3xs font-mono font-semibold tabular-nums ${
                          isLowStock ? 'text-amber-700 font-bold' : 'text-slate-500'
                        }`}
                        title={isLowStock ? 'Low stock alert' : 'Current stock level'}
                      >
                        {p.isWeighed ? p.currentStock.toFixed(1) : p.currentStock} {p.unit}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Keyboard Shortcuts Hint Bar */}
        <div className="hidden md:flex items-center justify-between px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-3xs text-slate-500 font-mono shrink-0">
          <span>Shortcuts:</span>
          <span><strong>F2</strong>: Complete Pay</span>
          <span><strong>F3</strong>: Search</span>
          <span><strong>F4</strong>: Hold Sale</span>
          <span><strong>F8</strong>: Clear Cart</span>
          <span><strong>Esc</strong>: Close Modal</span>
        </div>
      </div>

      {/* RIGHT PANE: ACTIVE CART & CHECKOUT (35% on Desktop) */}
      <div className="w-full lg:w-96 xl:w-[410px] shrink-0 h-full flex flex-col">
        <CartPanel
          onOpenPayment={() => setShowPaymentModal(true)}
          onOpenCustomerSelect={() => setShowCustomerModal(true)}
        />
      </div>

      {/* MODALS */}
      <WeightModal
        product={weighedProduct}
        isOpen={showWeightModal}
        onClose={() => {
          setShowWeightModal(false);
          setWeighedProduct(null);
        }}
        onConfirm={(prod, qty) => addToCart(prod, qty)}
      />

      <BarcodeScannerModal
        isOpen={showScannerModal}
        onClose={() => setShowScannerModal(false)}
        onScanSuccess={handleBarcodeScanned}
      />

      <PaymentModal
        isOpen={showPaymentModal}
        totalAmount={cartSubtotal}
        subtotalAmount={cartSubtotal}
        discountAmount={0}
        onClose={() => setShowPaymentModal(false)}
        onPaymentComplete={() => {
          setShowPaymentModal(false);
          setShowReceiptModal(true);
        }}
      />

      <ReceiptModal
        sale={lastCompletedSale}
        isOpen={showReceiptModal}
        onClose={() => setShowReceiptModal(false)}
      />

      <CustomerSelectModal
        isOpen={showCustomerModal}
        onClose={() => setShowCustomerModal(false)}
        onSelectCustomer={(cust) => setActiveCartCustomer(cust)}
      />
    </div>
  );
};
