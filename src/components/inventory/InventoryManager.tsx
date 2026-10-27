import React, { useState } from 'react';
import {
  Package,
  Plus,
  AlertTriangle,
  Clock,
  ArrowDownToLine,
  Search,
  CheckCircle2,
  Trash2,
  FileSpreadsheet,
  Calendar,
  Layers,
  Scale
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { Product, UnitOfMeasure, WastageRecord } from '../../types/grocery';
import * as XLSX from 'xlsx';

export const InventoryManager: React.FC = () => {
  const {
    products,
    addProduct,
    updateProduct,
    addStockIn,
    recordWastage,
    adjustStocktake,
    suppliers
  } = useStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [showLowStockOnly, setShowLowStockOnly] = useState(false);
  const [showExpiringOnly, setShowExpiringOnly] = useState(false);

  // Modals
  const [showStockInModal, setShowStockInModal] = useState(false);
  const [showWastageModal, setShowWastageModal] = useState(false);
  const [showStocktakeModal, setShowStocktakeModal] = useState(false);
  const [showNewProductModal, setShowNewProductModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Stock-in form state
  const [stockInQty, setStockInQty] = useState('');
  const [stockInCost, setStockInCost] = useState('');
  const [stockInBatch, setStockInBatch] = useState('');
  const [stockInExpiry, setStockInExpiry] = useState('');
  const [stockInSupplier, setStockInSupplier] = useState('');

  // Wastage form state
  const [wastageQty, setWastageQty] = useState('');
  const [wastageReason, setWastageReason] = useState<WastageRecord['reason']>('expired');
  const [wastageNotes, setWastageNotes] = useState('');

  // Stocktake form state
  const [countedQty, setCountedQty] = useState('');
  const [stocktakeNotes, setStocktakeNotes] = useState('');

  // New product form
  const [newProdName, setNewProdName] = useState('');
  const [newProdNameSwahili, setNewProdNameSwahili] = useState('');
  const [newProdCategory, setNewProdCategory] = useState('Flours & Grains');
  const [newProdUnit, setNewProdUnit] = useState<UnitOfMeasure>('piece');
  const [newProdIsWeighed, setNewProdIsWeighed] = useState(false);
  const [newProdSellingPrice, setNewProdSellingPrice] = useState('');
  const [newProdCostPrice, setNewProdCostPrice] = useState('');
  const [newProdCurrentStock, setNewProdCurrentStock] = useState('10');
  const [newProdMinStock, setNewProdMinStock] = useState('5');
  const [newProdBarcode, setNewProdBarcode] = useState('');

  // Expiry check logic (perishable items with batches expiring in < 7 days or expired)
  const today = new Date();
  const sevenDaysFromNow = new Date();
  sevenDaysFromNow.setDate(today.getDate() + 7);

  const isExpiringSoon = (p: Product) => {
    if (!p.batches || p.batches.length === 0) return false;
    return p.batches.some((b) => {
      const exp = new Date(b.expiryDate);
      return b.quantityRemaining > 0 && exp <= sevenDaysFromNow;
    });
  };

  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      !searchTerm ||
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.barcode.includes(searchTerm) ||
      p.sku.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'all' || p.category === filterCategory;
    const matchesLowStock = !showLowStockOnly || p.currentStock <= p.minStockLevel;
    const matchesExpiring = !showExpiringOnly || isExpiringSoon(p);

    return matchesSearch && matchesCategory && matchesLowStock && matchesExpiring;
  });

  const categories = [
    'all',
    'Flours & Grains',
    'Fresh Produce',
    'Dairy & Milk',
    'Cooking Oils & Fats',
    'Sugar & Sweeteners',
    'Household & Soaps'
  ];

  const handleStockInSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;
    const qty = parseFloat(stockInQty);
    const cost = parseFloat(stockInCost) || selectedProduct.costPrice;
    if (qty > 0) {
      addStockIn({
        productId: selectedProduct.id,
        quantity: qty,
        costPrice: cost,
        batchNumber: stockInBatch || `B-${Date.now().toString().slice(-6)}`,
        expiryDate: stockInExpiry || new Date(Date.now() + 60 * 86400000).toISOString().slice(0, 10),
        supplierId: stockInSupplier || undefined
      });
      setShowStockInModal(false);
      setStockInQty('');
      setStockInCost('');
      setStockInBatch('');
    }
  };

  const handleWastageSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;
    const qty = parseFloat(wastageQty);
    if (qty > 0) {
      recordWastage({
        productId: selectedProduct.id,
        quantity: qty,
        reason: wastageReason,
        notes: wastageNotes
      });
      setShowWastageModal(false);
      setWastageQty('');
      setWastageNotes('');
    }
  };

  const handleStocktakeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;
    const counted = parseFloat(countedQty);
    if (!isNaN(counted)) {
      adjustStocktake({
        productId: selectedProduct.id,
        countedStock: counted,
        notes: stocktakeNotes
      });
      setShowStocktakeModal(false);
      setCountedQty('');
      setStocktakeNotes('');
    }
  };

  const handleCreateProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProdName || !newProdSellingPrice || !newProdCostPrice) return;
    const barcode = newProdBarcode || '616' + Math.floor(1000000000 + Math.random() * 9000000000);
    const sku = newProdName.slice(0, 3).toUpperCase() + '-' + Math.floor(100 + Math.random() * 900);

    addProduct({
      name: newProdName,
      nameSwahili: newProdNameSwahili || undefined,
      category: newProdCategory,
      unit: newProdUnit,
      isWeighed: newProdIsWeighed,
      sellingPrice: parseFloat(newProdSellingPrice),
      costPrice: parseFloat(newProdCostPrice),
      currentStock: parseFloat(newProdCurrentStock) || 0,
      minStockLevel: parseFloat(newProdMinStock) || 5,
      barcode,
      sku,
      taxRate: 0.16,
      taxType: 'vat16',
      isPerishable: ['Dairy & Milk', 'Fresh Produce', 'Flours & Grains'].includes(newProdCategory),
      isQuickSale: false
    });

    setShowNewProductModal(false);
    setNewProdName('');
    setNewProdSellingPrice('');
    setNewProdCostPrice('');
    setNewProdBarcode('');
  };

  const handleExportInventoryExcel = () => {
    const rows = products.map((p) => ({
      'Barcode': p.barcode,
      'SKU': p.sku,
      'Product Name': p.name,
      'Category': p.category,
      'Stock Level': p.currentStock,
      'Unit': p.unit,
      'Cost Price (KSh)': p.costPrice,
      'Selling Price (KSh)': p.sellingPrice,
      'Stock Valuation @ Cost (KSh)': p.currentStock * p.costPrice,
      'Stock Valuation @ Retail (KSh)': p.currentStock * p.sellingPrice
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Inventory Master');
    XLSX.writeFile(wb, `Mbuikas_Inventory_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  return (
    <div className="flex-1 flex flex-col p-4 md:p-6 bg-slate-100 overflow-y-auto space-y-4">
      {/* 1. Header & Quick Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
        <div>
          <span className="text-2xs text-emerald-700 font-mono font-bold uppercase tracking-wider block">
            Stock Control & FEFO Tracking
          </span>
          <h1 className="text-lg md:text-xl font-extrabold text-slate-900 tracking-tight">
            Grocery Inventory Management
          </h1>
          <p className="text-2xs text-slate-500 mt-0.5">
            Real-time batch tracking, First-Expiry-First-Out deductions, spoilage recording, and cycle counts.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleExportInventoryExcel}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-700" />
            <span>Export Excel</span>
          </button>

          <button
            type="button"
            onClick={() => setShowNewProductModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-emerald-700 text-white text-xs font-bold hover:bg-emerald-800 transition-colors shadow-2xs"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Item</span>
          </button>
        </div>
      </div>

      {/* 2. Filter Bar & Alerts */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row gap-2.5">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search product name, barcode, SKU..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-600"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowLowStockOnly(!showLowStockOnly)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                showLowStockOnly
                  ? 'bg-amber-600 text-white'
                  : 'bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Low Stock Trigger</span>
            </button>

            <button
              type="button"
              onClick={() => setShowExpiringOnly(!showExpiringOnly)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                showExpiringOnly
                  ? 'bg-red-600 text-white'
                  : 'bg-red-50 text-red-800 border border-red-200 hover:bg-red-100'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Expiring &lt; 7 Days</span>
            </button>
          </div>
        </div>

        {/* Category Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {categories.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setFilterCategory(c)}
              className={`px-3 py-1 rounded-md text-xs font-medium whitespace-nowrap transition-colors ${
                filterCategory === c
                  ? 'bg-slate-900 text-white font-bold'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {c === 'all' ? 'All Categories' : c}
            </button>
          ))}
        </div>
      </div>

      {/* 3. Products Table with FEFO Batch status */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 text-2xs uppercase">
                <th className="py-2.5 px-3">Product Name & SKU</th>
                <th className="py-2.5 px-3">Category</th>
                <th className="py-2.5 px-3 text-right">In Stock</th>
                <th className="py-2.5 px-3 text-right">Cost (KSh)</th>
                <th className="py-2.5 px-3 text-right">Price (KSh)</th>
                <th className="py-2.5 px-3">FEFO Batches & Expiry</th>
                <th className="py-2.5 px-3 text-right">Quick Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredProducts.map((p) => {
                const isLow = p.currentStock <= p.minStockLevel;
                const expiring = isExpiringSoon(p);

                return (
                  <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-2.5 px-3">
                      <div className="font-bold text-slate-900">{p.name}</div>
                      <div className="text-3xs text-slate-500 font-mono">
                        SKU: {p.sku} • Barcode: {p.barcode}
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-slate-600 font-medium">{p.category}</td>
                    <td className="py-2.5 px-3 text-right font-mono">
                      <span
                        className={`font-bold tabular-nums ${
                          isLow ? 'text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded' : 'text-slate-900'
                        }`}
                      >
                        {p.isWeighed ? p.currentStock.toFixed(2) : p.currentStock} {p.unit}
                      </span>
                      {isLow && <span className="block text-3xs text-amber-700 font-sans">Reorder &lt; {p.minStockLevel}</span>}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-slate-700 tabular-nums">
                      KSh {p.costPrice.toFixed(2)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900 tabular-nums">
                      KSh {p.sellingPrice.toFixed(2)}
                    </td>
                    <td className="py-2.5 px-3">
                      {p.batches && p.batches.length > 0 ? (
                        <div className="space-y-0.5 max-w-xs">
                          {p.batches.slice(0, 2).map((b) => {
                            const expDate = new Date(b.expiryDate);
                            const isNearExp = expDate <= sevenDaysFromNow;
                            return (
                              <div
                                key={b.id}
                                className={`text-3xs font-mono px-1.5 py-0.5 rounded flex items-center justify-between ${
                                  isNearExp ? 'bg-red-50 text-red-800 font-bold' : 'bg-slate-100 text-slate-600'
                                }`}
                              >
                                <span>{b.batchNumber}: {b.quantityRemaining} {p.unit}</span>
                                <span>Exp: {b.expiryDate}</span>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <span className="text-3xs text-slate-400">Non-perishable</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedProduct(p);
                            setStockInQty('');
                            setStockInCost(p.costPrice.toString());
                            setStockInBatch(`B-${Date.now().toString().slice(-4)}`);
                            setShowStockInModal(true);
                          }}
                          className="px-2 py-1 rounded bg-emerald-50 text-emerald-800 hover:bg-emerald-100 text-2xs font-bold"
                          title="Stock-in / Receive Purchase"
                        >
                          +Stock
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setSelectedProduct(p);
                            setWastageQty('1');
                            setShowWastageModal(true);
                          }}
                          className="px-2 py-1 rounded bg-red-50 text-red-800 hover:bg-red-100 text-2xs font-semibold"
                          title="Record Spoilage / Wastage"
                        >
                          Spoilage
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setSelectedProduct(p);
                            setCountedQty(p.currentStock.toString());
                            setShowStocktakeModal(true);
                          }}
                          className="px-2 py-1 rounded bg-slate-100 text-slate-700 hover:bg-slate-200 text-2xs font-semibold"
                          title="Physical Count Cycle Check"
                        >
                          Count
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL 1: STOCK-IN / GOODS RECEIVED NOTE */}
      {showStockInModal && selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="w-full max-w-md rounded-xl bg-white shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-5 py-3.5 bg-emerald-800 text-white flex justify-between items-center">
              <h2 className="text-sm font-bold">Receive Stock-in: {selectedProduct.name}</h2>
              <button onClick={() => setShowStockInModal(false)} className="text-white">✕</button>
            </div>
            <form onSubmit={handleStockInSubmit} className="p-5 space-y-3">
              <div>
                <label className="block text-2xs font-bold text-slate-700 uppercase mb-1">
                  Quantity Received ({selectedProduct.unit})
                </label>
                <input
                  type="number"
                  step="any"
                  required
                  value={stockInQty}
                  onChange={(e) => setStockInQty(e.target.value)}
                  placeholder="e.g. 50"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-2xs font-bold text-slate-700 uppercase mb-1">
                  Cost Price per Unit (KSh)
                </label>
                <input
                  type="number"
                  step="any"
                  required
                  value={stockInCost}
                  onChange={(e) => setStockInCost(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg font-mono"
                />
                <span className="text-3xs text-slate-500 mt-0.5 block">
                  Updates weighted average cost for accurate future COGS.
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-2xs font-bold text-slate-700 uppercase mb-1">Batch Number</label>
                  <input
                    type="text"
                    value={stockInBatch}
                    onChange={(e) => setStockInBatch(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="block text-2xs font-bold text-slate-700 uppercase mb-1">Expiry Date</label>
                  <input
                    type="date"
                    value={stockInExpiry}
                    onChange={(e) => setStockInExpiry(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-2xs font-bold text-slate-700 uppercase mb-1">Supplier</label>
                <select
                  value={stockInSupplier}
                  onChange={(e) => setStockInSupplier(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                >
                  <option value="">-- Select Supplier --</option>
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setShowStockInModal(false)}
                  className="px-4 py-2 border rounded-lg text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-700 text-white rounded-lg text-xs font-bold hover:bg-emerald-800"
                >
                  Confirm Stock Receipt
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: SPOILAGE / WASTAGE RECORDING */}
      {showWastageModal && selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="w-full max-w-md rounded-xl bg-white shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-5 py-3.5 bg-red-700 text-white flex justify-between items-center">
              <h2 className="text-sm font-bold">Record Spoilage / Loss: {selectedProduct.name}</h2>
              <button onClick={() => setShowWastageModal(false)} className="text-white">✕</button>
            </div>
            <form onSubmit={handleWastageSubmit} className="p-5 space-y-3">
              <div>
                <label className="block text-2xs font-bold text-slate-700 uppercase mb-1">
                  Quantity Lost ({selectedProduct.unit})
                </label>
                <input
                  type="number"
                  step="any"
                  required
                  value={wastageQty}
                  onChange={(e) => setWastageQty(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-2xs font-bold text-slate-700 uppercase mb-1">Reason for Loss</label>
                <select
                  value={wastageReason}
                  onChange={(e) => setWastageReason(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                >
                  <option value="expired">Expired on Shelf</option>
                  <option value="spoiled_rotten">Spoiled / Rotten / Pest</option>
                  <option value="damaged">Damaged in Handling</option>
                  <option value="theft">Theft / Shoplifting</option>
                  <option value="spill_shrinkage">Spill / Moisture Shrinkage</option>
                </select>
              </div>

              <div>
                <label className="block text-2xs font-bold text-slate-700 uppercase mb-1">Notes / Description</label>
                <textarea
                  rows={2}
                  value={wastageNotes}
                  onChange={(e) => setWastageNotes(e.target.value)}
                  placeholder="e.g. Milk pouch leaking, crushed tomatoes..."
                  className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg"
                />
              </div>

              <div className="p-3 bg-red-50 text-red-800 text-2xs rounded-lg">
                ⚠️ Spoilage immediately reduces inventory and is counted as a direct financial loss in your Owner Net Profit report.
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setShowWastageModal(false)}
                  className="px-4 py-2 border rounded-lg text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-red-700 text-white rounded-lg text-xs font-bold hover:bg-red-800"
                >
                  Record Loss
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: STOCKTAKE / CYCLE COUNT */}
      {showStocktakeModal && selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="w-full max-w-md rounded-xl bg-white shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-5 py-3.5 bg-slate-900 text-white flex justify-between items-center">
              <h2 className="text-sm font-bold">Physical Count Adjustment: {selectedProduct.name}</h2>
              <button onClick={() => setShowStocktakeModal(false)} className="text-white">✕</button>
            </div>
            <form onSubmit={handleStocktakeSubmit} className="p-5 space-y-3">
              <div className="p-3 bg-slate-50 border rounded-lg text-xs space-y-1">
                <div className="flex justify-between">
                  <span>Current System Expected:</span>
                  <span className="font-bold font-mono">{selectedProduct.currentStock} {selectedProduct.unit}</span>
                </div>
              </div>

              <div>
                <label className="block text-2xs font-bold text-slate-700 uppercase mb-1">
                  Actual Physical Counted Stock
                </label>
                <input
                  type="number"
                  step="any"
                  required
                  value={countedQty}
                  onChange={(e) => setCountedQty(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-2xs font-bold text-slate-700 uppercase mb-1">Adjustment Reason</label>
                <input
                  type="text"
                  value={stocktakeNotes}
                  onChange={(e) => setStocktakeNotes(e.target.value)}
                  placeholder="e.g. End of month physical stocktake audit"
                  className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setShowStocktakeModal(false)}
                  className="px-4 py-2 border rounded-lg text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-slate-900 text-white rounded-lg text-xs font-bold hover:bg-slate-800"
                >
                  Update Count
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: ADD NEW PRODUCT */}
      {showNewProductModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="w-full max-w-lg rounded-xl bg-white shadow-2xl border border-slate-200 overflow-hidden max-h-[90vh] flex flex-col">
            <div className="px-5 py-3.5 bg-slate-900 text-white flex justify-between items-center">
              <h2 className="text-sm font-bold">Add New Grocery Product</h2>
              <button onClick={() => setShowNewProductModal(false)} className="text-white">✕</button>
            </div>
            <form onSubmit={handleCreateProduct} className="p-5 space-y-3 overflow-y-auto flex-1">
              <div>
                <label className="block text-2xs font-bold text-slate-700 uppercase mb-1">Product Name (English)</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ndovu Maize Meal 2kg"
                  value={newProdName}
                  onChange={(e) => setNewProdName(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-2xs font-bold text-slate-700 uppercase mb-1">Product Name (Kiswahili)</label>
                <input
                  type="text"
                  placeholder="e.g. Unga wa Ndovu 2kg"
                  value={newProdNameSwahili}
                  onChange={(e) => setNewProdNameSwahili(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-2xs font-bold text-slate-700 uppercase mb-1">Category</label>
                  <select
                    value={newProdCategory}
                    onChange={(e) => setNewProdCategory(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg"
                  >
                    {categories.filter((c) => c !== 'all').map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-2xs font-bold text-slate-700 uppercase mb-1">Unit of Measure</label>
                  <select
                    value={newProdUnit}
                    onChange={(e) => setNewProdUnit(e.target.value as any)}
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg"
                  >
                    <option value="piece">Piece (Item)</option>
                    <option value="kg">Kilogram (kg)</option>
                    <option value="g">Gram (g)</option>
                    <option value="litre">Litre (L)</option>
                    <option value="packet">Packet</option>
                    <option value="dozen">Dozen</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="weighed_check"
                  checked={newProdIsWeighed}
                  onChange={(e) => setNewProdIsWeighed(e.target.checked)}
                  className="rounded text-emerald-700 focus:ring-emerald-500"
                />
                <label htmlFor="weighed_check" className="text-xs text-slate-700 font-semibold">
                  Weighed Item (Requires digital scale or kg/g decimal input at POS)
                </label>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-2xs font-bold text-slate-700 uppercase mb-1">Cost Price (KSh)</label>
                  <input
                    type="number"
                    step="any"
                    required
                    placeholder="120"
                    value={newProdCostPrice}
                    onChange={(e) => setNewProdCostPrice(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="block text-2xs font-bold text-slate-700 uppercase mb-1">Selling Price (KSh)</label>
                  <input
                    type="number"
                    step="any"
                    required
                    placeholder="150"
                    value={newProdSellingPrice}
                    onChange={(e) => setNewProdSellingPrice(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg font-mono font-bold text-emerald-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-2xs font-bold text-slate-700 uppercase mb-1">Opening Stock</label>
                  <input
                    type="number"
                    step="any"
                    value={newProdCurrentStock}
                    onChange={(e) => setNewProdCurrentStock(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-2xs font-bold text-slate-700 uppercase mb-1">Min Reorder Level</label>
                  <input
                    type="number"
                    step="any"
                    value={newProdMinStock}
                    onChange={(e) => setNewProdMinStock(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-2xs font-bold text-slate-700 uppercase mb-1">Barcode (Optional)</label>
                <input
                  type="text"
                  placeholder="Auto-generated if empty"
                  value={newProdBarcode}
                  onChange={(e) => setNewProdBarcode(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg font-mono"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowNewProductModal(false)}
                  className="px-4 py-2 border rounded-lg text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-700 text-white rounded-lg text-xs font-bold hover:bg-emerald-800"
                >
                  Save Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
