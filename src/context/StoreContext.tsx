import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  Product,
  Sale,
  CartItem,
  Customer,
  Supplier,
  Expense,
  Shift,
  Employee,
  StoreSettings,
  WastageRecord,
  CreditRepayment,
  PaymentMethod,
  PaymentSplit
} from '../types/grocery';
import { StorageService } from '../services/storage';
import { INITIAL_EMPLOYEES } from '../data/initialData';

export interface CartTab {
  id: string;
  name: string;
  items: CartItem[];
  customerId?: string;
  customerName?: string;
}

interface StoreContextType {
  products: Product[];
  sales: Sale[];
  customers: Customer[];
  suppliers: Supplier[];
  expenses: Expense[];
  wastage: WastageRecord[];
  shifts: Shift[];
  currentShift: Shift | null;
  employees: Employee[];
  currentUser: Employee;
  cartTabs: CartTab[];
  activeTabId: string;
  activeCart: CartItem[];
  settings: StoreSettings;
  language: 'en' | 'sw';
  theme: 'light' | 'dark';
  isOnline: boolean;
  syncPendingCount: number;
  lastCompletedSale: Sale | null;
  // Cart Actions
  setActiveTabId: (tabId: string) => void;
  createCartTab: () => void;
  removeCartTab: (tabId: string) => void;
  addToCart: (product: Product, quantity?: number, unitPrice?: number) => void;
  updateCartItemQuantity: (productId: string, quantity: number) => void;
  updateCartItemDiscount: (productId: string, discount: number) => void;
  removeFromCart: (productId: string) => void;
  clearActiveCart: () => void;
  setActiveCartCustomer: (customer?: Customer) => void;
  // Sale & Payment Actions
  processSale: (params: {
    paymentMethod: PaymentMethod;
    cashTendered?: number;
    changeGiven?: number;
    mpesaPhone?: string;
    mpesaReceipt?: string;
    splits?: PaymentSplit[];
    customerId?: string;
    discountTotal?: number;
  }) => Promise<Sale>;
  voidSale: (saleId: string, reason: string, authorizedBy: string) => void;
  // Repayments & Credit
  recordRepayment: (params: {
    customerId: string;
    amount: number;
    paymentMethod: 'cash' | 'mpesa';
    mpesaReceipt?: string;
    notes?: string;
  }) => void;
  // Inventory & Wastage
  recordWastage: (params: {
    productId: string;
    quantity: number;
    reason: WastageRecord['reason'];
    notes?: string;
  }) => void;
  addStockIn: (params: {
    productId: string;
    quantity: number;
    costPrice: number;
    batchNumber: string;
    expiryDate: string;
    supplierId?: string;
  }) => void;
  adjustStocktake: (params: {
    productId: string;
    countedStock: number;
    notes?: string;
  }) => void;
  addProduct: (product: Omit<Product, 'id'>) => void;
  updateProduct: (product: Product) => void;
  // Expenses & Shifts
  addExpense: (expense: Omit<Expense, 'id' | 'recordedBy'>) => void;
  startShift: (openingFloat: number) => void;
  closeShift: (countedCash: number, notes?: string) => Shift;
  // Employees & Auth
  setCurrentUser: (emp: Employee) => void;
  verifyManagerPin: (pin: string) => boolean;
  // Settings & Sync
  updateSettings: (newSettings: StoreSettings) => void;
  syncOfflineQueue: () => Promise<number>;
  setLanguage: (lang: 'en' | 'sw') => void;
  setTheme: (theme: 'light' | 'dark') => void;
  resetAllData: () => void;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export const StoreProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [products, setProducts] = useState<Product[]>(StorageService.getProducts());
  const [sales, setSales] = useState<Sale[]>(StorageService.getSales());
  const [customers, setCustomers] = useState<Customer[]>(StorageService.getCustomers());
  const [suppliers, setSuppliers] = useState<Supplier[]>(StorageService.getSuppliers());
  const [expenses, setExpenses] = useState<Expense[]>(StorageService.getExpenses());
  const [wastage, setWastage] = useState<WastageRecord[]>(StorageService.getWastage());
  const [shifts, setShifts] = useState<Shift[]>(StorageService.getShifts());
  const [settings, setSettings] = useState<StoreSettings>(StorageService.getSettings());
  const [employees] = useState<Employee[]>(INITIAL_EMPLOYEES);
  const [currentUser, setCurrentUser] = useState<Employee>(INITIAL_EMPLOYEES[2]); // Kevin (cashier) default
  const [language, setLanguage] = useState<'en' | 'sw'>('en');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [lastCompletedSale, setLastCompletedSale] = useState<Sale | null>(null);

  // Cart multi-tabs for holding / resuming sales
  const [cartTabs, setCartTabs] = useState<CartTab[]>([
    { id: 'tab_1', name: 'Sale 1', items: [] }
  ]);
  const [activeTabId, setActiveTabId] = useState<string>('tab_1');

  // Network listener
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const activeCart = cartTabs.find((t) => t.id === activeTabId)?.items || [];
  const activeTabCustomer = cartTabs.find((t) => t.id === activeTabId)?.customerId;

  // Active shift
  const currentShift = shifts.find((s) => s.status === 'open') || null;

  // Cart Handlers
  const createCartTab = () => {
    const newId = 'tab_' + Date.now();
    const newTab: CartTab = {
      id: newId,
      name: `Sale ${cartTabs.length + 1}`,
      items: []
    };
    setCartTabs([...cartTabs, newTab]);
    setActiveTabId(newId);
  };

  const removeCartTab = (tabId: string) => {
    if (cartTabs.length === 1) {
      // Clear instead of removing last tab
      setCartTabs([{ id: 'tab_1', name: 'Sale 1', items: [] }]);
      setActiveTabId('tab_1');
      return;
    }
    const filtered = cartTabs.filter((t) => t.id !== tabId);
    setCartTabs(filtered);
    if (activeTabId === tabId) {
      setActiveTabId(filtered[0].id);
    }
  };

  const updateActiveCartItems = (updater: (prev: CartItem[]) => CartItem[]) => {
    setCartTabs((prevTabs) =>
      prevTabs.map((tab) => {
        if (tab.id === activeTabId) {
          return { ...tab, items: updater(tab.items) };
        }
        return tab;
      })
    );
  };

  const addToCart = (product: Product, quantity = 1, unitPrice?: number) => {
    const price = unitPrice !== undefined ? unitPrice : product.sellingPrice;
    updateActiveCartItems((prev) => {
      const existingIndex = prev.findIndex((item) => item.productId === product.id);
      if (existingIndex > -1) {
        const item = prev[existingIndex];
        const newQty = item.quantity + quantity;
        const lineTotal = (item.unitPrice - item.discountAmount) * newQty;
        const taxAmount = product.taxRate > 0 ? (lineTotal * product.taxRate) / (1 + product.taxRate) : 0;
        const updated = [...prev];
        updated[existingIndex] = {
          ...item,
          quantity: newQty,
          lineTotal,
          taxAmount
        };
        return updated;
      } else {
        const lineTotal = price * quantity;
        const taxAmount = product.taxRate > 0 ? (lineTotal * product.taxRate) / (1 + product.taxRate) : 0;
        const newItem: CartItem = {
          productId: product.id,
          productName: product.name,
          barcode: product.barcode,
          unit: product.unit,
          isWeighed: product.isWeighed,
          quantity,
          unitPrice: price,
          discountAmount: 0,
          finalPrice: price,
          lineTotal,
          taxRate: product.taxRate,
          taxAmount,
          costPrice: product.costPrice
        };
        return [...prev, newItem];
      }
    });
  };

  const updateCartItemQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    updateActiveCartItems((prev) =>
      prev.map((it) => {
        if (it.productId === productId) {
          const lineTotal = (it.unitPrice - it.discountAmount) * quantity;
          const taxAmount = it.taxRate > 0 ? (lineTotal * it.taxRate) / (1 + it.taxRate) : 0;
          return { ...it, quantity, lineTotal, taxAmount };
        }
        return it;
      })
    );
  };

  const updateCartItemDiscount = (productId: string, discount: number) => {
    updateActiveCartItems((prev) =>
      prev.map((it) => {
        if (it.productId === productId) {
          const discountAmount = Math.max(0, Math.min(it.unitPrice, discount));
          const finalPrice = it.unitPrice - discountAmount;
          const lineTotal = finalPrice * it.quantity;
          const taxAmount = it.taxRate > 0 ? (lineTotal * it.taxRate) / (1 + it.taxRate) : 0;
          return { ...it, discountAmount, finalPrice, lineTotal, taxAmount };
        }
        return it;
      })
    );
  };

  const removeFromCart = (productId: string) => {
    updateActiveCartItems((prev) => prev.filter((it) => it.productId !== productId));
  };

  const clearActiveCart = () => {
    updateActiveCartItems(() => []);
  };

  const setActiveCartCustomer = (customer?: Customer) => {
    setCartTabs((prevTabs) =>
      prevTabs.map((tab) => {
        if (tab.id === activeTabId) {
          return {
            ...tab,
            customerId: customer?.id,
            customerName: customer?.name
          };
        }
        return tab;
      })
    );
  };

  // CHECKOUT: Process Sale with FEFO inventory deduction & accurate COGS calculation
  const processSale = async ({
    paymentMethod,
    cashTendered,
    changeGiven,
    mpesaPhone,
    mpesaReceipt,
    splits,
    customerId,
    discountTotal = 0
  }: {
    paymentMethod: PaymentMethod;
    cashTendered?: number;
    changeGiven?: number;
    mpesaPhone?: string;
    mpesaReceipt?: string;
    splits?: PaymentSplit[];
    customerId?: string;
    discountTotal?: number;
  }): Promise<Sale> => {
    if (activeCart.length === 0) {
      throw new Error('Cart is empty');
    }

    const subtotal = activeCart.reduce((sum, it) => sum + it.lineTotal, 0);
    const grandTotal = Math.max(0, subtotal - discountTotal);
    const taxTotal = activeCart.reduce((sum, it) => sum + it.taxAmount, 0);

    // Calculate accurate COGS & FEFO stock deduction
    let totalCogs = 0;
    const updatedProducts = [...products];

    const saleItemsWithBatchCost = activeCart.map((item) => {
      const prodIndex = updatedProducts.findIndex((p) => p.id === item.productId);
      let itemBatchCost = item.costPrice;

      if (prodIndex > -1) {
        const prod = { ...updatedProducts[prodIndex] };
        let qtyToDeduct = item.quantity;

        // If product has batches, deduct via FEFO (earliest expiry first)
        if (prod.batches && prod.batches.length > 0) {
          // Sort ascending by expiry date
          const sortedBatches = [...prod.batches].sort(
            (a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime()
          );

          let batchCostSum = 0;
          let qtyAccounted = 0;

          const updatedBatches = sortedBatches.map((b) => {
            if (qtyToDeduct > 0 && b.quantityRemaining > 0) {
              const take = Math.min(b.quantityRemaining, qtyToDeduct);
              b.quantityRemaining -= take;
              qtyToDeduct -= take;
              batchCostSum += take * b.costPrice;
              qtyAccounted += take;
            }
            return b;
          });

          prod.batches = updatedBatches;
          if (qtyAccounted > 0) {
            itemBatchCost = batchCostSum / qtyAccounted;
          }
        }

        // Deduct overall current stock
        prod.currentStock = Math.max(0, prod.currentStock - item.quantity);
        updatedProducts[prodIndex] = prod;
      }

      const itemCostTotal = itemBatchCost * item.quantity;
      totalCogs += itemCostTotal;

      return {
        ...item,
        costPrice: itemBatchCost
      };
    });

    // Save updated products with new stock levels
    setProducts(updatedProducts);
    StorageService.saveProducts(updatedProducts);

    // Generate receipt number & eTIMS serial
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
    const randomHex = Math.floor(1000 + Math.random() * 9000);
    const receiptNumber = `MBK-${dateStr}-${randomHex}`;
    const kraETimsNumber = settings.enableEtims ? `KRA-ETIMS-${dateStr}-${randomHex}` : undefined;

    const matchedCustomer = customerId ? customers.find((c) => c.id === customerId) : undefined;
    const isCredit = paymentMethod === 'credit';

    const sale: Sale = {
      id: 'sale_' + Date.now(),
      receiptNumber,
      date: now.toISOString(),
      items: saleItemsWithBatchCost,
      subtotal,
      totalDiscount: discountTotal,
      taxTotal,
      grandTotal,
      totalCost: totalCogs,
      grossProfit: grandTotal - totalCogs,
      paymentMethod,
      paymentDetails: {
        cashTendered,
        changeGiven,
        mpesaPhone,
        mpesaReceipt,
        splits
      },
      customerId: matchedCustomer?.id,
      customerName: matchedCustomer?.name,
      cashierId: currentUser.id,
      cashierName: currentUser.name,
      status: 'completed',
      isCredit,
      creditSettled: !isCredit,
      syncStatus: isOnline ? 'synced' : 'pending_sync',
      kraETimsNumber
    };

    // Save sale
    const updatedSales = [sale, ...sales];
    setSales(updatedSales);
    StorageService.addSale(sale);

    // If Credit (Mkopo): Update customer balance
    if (isCredit && matchedCustomer) {
      const updatedCustomers = customers.map((c) => {
        if (c.id === matchedCustomer.id) {
          return {
            ...c,
            currentCredit: c.currentCredit + grandTotal,
            totalSpent: c.totalSpent + grandTotal
          };
        }
        return c;
      });
      setCustomers(updatedCustomers);
      StorageService.saveCustomers(updatedCustomers);
    } else if (matchedCustomer && settings.enableLoyalty) {
      // Award loyalty points
      const pointsEarned = Math.floor(grandTotal / (settings.loyaltyPointsRate || 100));
      const updatedCustomers = customers.map((c) => {
        if (c.id === matchedCustomer.id) {
          return {
            ...c,
            loyaltyPoints: c.loyaltyPoints + pointsEarned,
            totalSpent: c.totalSpent + grandTotal
          };
        }
        return c;
      });
      setCustomers(updatedCustomers);
      StorageService.saveCustomers(updatedCustomers);
    }

    // Update active shift drawer totals
    if (currentShift) {
      const updatedShift: Shift = { ...currentShift };
      if (paymentMethod === 'cash') {
        updatedShift.cashSales += grandTotal;
        updatedShift.expectedCash += grandTotal;
      } else if (paymentMethod === 'mpesa') {
        updatedShift.mpesaSales += grandTotal;
      } else if (paymentMethod === 'card') {
        updatedShift.cardSales += grandTotal;
      } else if (paymentMethod === 'credit') {
        updatedShift.creditSales += grandTotal;
      } else if (paymentMethod === 'split' && splits) {
        splits.forEach((sp) => {
          if (sp.method === 'cash') {
            updatedShift.cashSales += sp.amount;
            updatedShift.expectedCash += sp.amount;
          } else if (sp.method === 'mpesa') {
            updatedShift.mpesaSales += sp.amount;
          } else if (sp.method === 'card') {
            updatedShift.cardSales += sp.amount;
          }
        });
      }
      updatedShift.totalSales += grandTotal;

      const newShifts = shifts.map((s) => (s.id === currentShift.id ? updatedShift : s));
      setShifts(newShifts);
      StorageService.saveShifts(newShifts);
    }

    // Clear active cart & record last completed sale for modal
    clearActiveCart();
    setLastCompletedSale(sale);

    // Audit log
    StorageService.logAudit({
      userId: currentUser.id,
      userName: currentUser.name,
      action: isCredit ? 'credit_limit_change' : 'cash_drawer_open',
      details: `Sale ${receiptNumber} completed. Total: KSh ${grandTotal}. Method: ${paymentMethod}`
    });

    return sale;
  };

  // Void a sale (requires manager PIN)
  const voidSale = (saleId: string, reason: string, authorizedBy: string) => {
    const updatedSales = sales.map((s) => {
      if (s.id === saleId) {
        return { ...s, status: 'voided' as const, voidReason: reason };
      }
      return s;
    });
    setSales(updatedSales);
    StorageService.saveSales(updatedSales);

    StorageService.logAudit({
      userId: currentUser.id,
      userName: currentUser.name,
      action: 'void_sale',
      details: `Voided sale ${saleId}. Reason: ${reason}`,
      authorizedBy
    });
  };

  // Credit debt repayment
  const recordRepayment = ({
    customerId,
    amount,
    paymentMethod,
    mpesaReceipt,
    notes
  }: {
    customerId: string;
    amount: number;
    paymentMethod: 'cash' | 'mpesa';
    mpesaReceipt?: string;
    notes?: string;
  }) => {
    const repayment: CreditRepayment = {
      id: 'rep_' + Date.now(),
      customerId,
      date: new Date().toISOString(),
      amount,
      paymentMethod,
      mpesaReceipt,
      receivedBy: currentUser.name,
      notes
    };

    const repayments = StorageService.getRepayments();
    repayments.unshift(repayment);
    StorageService.saveRepayments(repayments);

    // Deduct debt from customer
    const updatedCustomers = customers.map((c) => {
      if (c.id === customerId) {
        return {
          ...c,
          currentCredit: Math.max(0, c.currentCredit - amount)
        };
      }
      return c;
    });
    setCustomers(updatedCustomers);
    StorageService.saveCustomers(updatedCustomers);

    // If cash repayment, add to shift cash
    if (currentShift && paymentMethod === 'cash') {
      const updatedShift: Shift = {
        ...currentShift,
        cashIn: currentShift.cashIn + amount,
        expectedCash: currentShift.expectedCash + amount
      };
      const newShifts = shifts.map((s) => (s.id === currentShift.id ? updatedShift : s));
      setShifts(newShifts);
      StorageService.saveShifts(newShifts);
    }
  };

  // Wastage / Spoilage recording (deducts stock and logs financial loss)
  const recordWastage = ({
    productId,
    quantity,
    reason,
    notes
  }: {
    productId: string;
    quantity: number;
    reason: WastageRecord['reason'];
    notes?: string;
  }) => {
    const product = products.find((p) => p.id === productId);
    if (!product) return;

    const totalLoss = product.costPrice * quantity;
    const record: WastageRecord = {
      id: 'w_' + Date.now(),
      date: new Date().toISOString(),
      productId,
      productName: product.name,
      quantity,
      unit: product.unit,
      costPrice: product.costPrice,
      totalLoss,
      reason,
      recordedBy: currentUser.name,
      notes
    };

    const updatedWastage = [record, ...wastage];
    setWastage(updatedWastage);
    StorageService.saveWastage(updatedWastage);

    // Deduct stock
    const updatedProducts = products.map((p) => {
      if (p.id === productId) {
        return {
          ...p,
          currentStock: Math.max(0, p.currentStock - quantity)
        };
      }
      return p;
    });
    setProducts(updatedProducts);
    StorageService.saveProducts(updatedProducts);

    StorageService.logAudit({
      userId: currentUser.id,
      userName: currentUser.name,
      action: 'stock_adjustment',
      details: `Wastage recorded: ${quantity} ${product.unit} of ${product.name}. Loss: KSh ${totalLoss}. Reason: ${reason}`
    });
  };

  // Stock-in (purchase order receipt with batch and cost updates)
  const addStockIn = ({
    productId,
    quantity,
    costPrice,
    batchNumber,
    expiryDate,
    supplierId
  }: {
    productId: string;
    quantity: number;
    costPrice: number;
    batchNumber: string;
    expiryDate: string;
    supplierId?: string;
  }) => {
    const updatedProducts = products.map((p) => {
      if (p.id === productId) {
        const newBatch = {
          id: 'b_' + Date.now(),
          productId,
          batchNumber,
          quantityRemaining: quantity,
          costPrice,
          receivedDate: new Date().toISOString().slice(0, 10),
          expiryDate,
          supplierId
        };
        const existingBatches = p.batches || [];
        // Calculate new weighted average cost price
        const totalOldValue = p.currentStock * p.costPrice;
        const totalNewValue = quantity * costPrice;
        const newStock = p.currentStock + quantity;
        const weightedCost = newStock > 0 ? (totalOldValue + totalNewValue) / newStock : costPrice;

        return {
          ...p,
          currentStock: newStock,
          costPrice: Math.round(weightedCost * 100) / 100,
          batches: [...existingBatches, newBatch]
        };
      }
      return p;
    });

    setProducts(updatedProducts);
    StorageService.saveProducts(updatedProducts);

    StorageService.logAudit({
      userId: currentUser.id,
      userName: currentUser.name,
      action: 'stock_adjustment',
      details: `Stock-in: +${quantity} units to ${productId}. Batch: ${batchNumber}. Cost: KSh ${costPrice}`
    });
  };

  // Stocktake cycle count adjustment
  const adjustStocktake = ({
    productId,
    countedStock,
    notes
  }: {
    productId: string;
    countedStock: number;
    notes?: string;
  }) => {
    const prod = products.find((p) => p.id === productId);
    if (!prod) return;

    const variance = countedStock - prod.currentStock;
    const updatedProducts = products.map((p) => (p.id === productId ? { ...p, currentStock: countedStock } : p));
    setProducts(updatedProducts);
    StorageService.saveProducts(updatedProducts);

    StorageService.logAudit({
      userId: currentUser.id,
      userName: currentUser.name,
      action: 'stock_adjustment',
      details: `Stocktake count: ${prod.name}. Expected: ${prod.currentStock}, Counted: ${countedStock}, Variance: ${variance}. Notes: ${notes || '-'}`
    });
  };

  const addProduct = (prodData: Omit<Product, 'id'>) => {
    const newProduct: Product = {
      ...prodData,
      id: 'prod_' + Date.now()
    };
    const updated = [newProduct, ...products];
    setProducts(updated);
    StorageService.saveProducts(updated);
  };

  const updateProduct = (updatedProd: Product) => {
    const updated = products.map((p) => (p.id === updatedProd.id ? updatedProd : p));
    setProducts(updated);
    StorageService.saveProducts(updated);
  };

  // Expenses
  const addExpense = (expenseData: Omit<Expense, 'id' | 'recordedBy'>) => {
    const newExpense: Expense = {
      ...expenseData,
      id: 'exp_' + Date.now(),
      recordedBy: currentUser.name
    };
    const updated = [newExpense, ...expenses];
    setExpenses(updated);
    StorageService.saveExpenses(updated);

    // If paid via cash drawer, deduct from shift
    if (currentShift && expenseData.paymentMethod === 'cash') {
      const updatedShift: Shift = {
        ...currentShift,
        cashOut: currentShift.cashOut + expenseData.amount,
        expectedCash: currentShift.expectedCash - expenseData.amount
      };
      const newShifts = shifts.map((s) => (s.id === currentShift.id ? updatedShift : s));
      setShifts(newShifts);
      StorageService.saveShifts(newShifts);
    }
  };

  // Shift & Cash Drawer
  const startShift = (openingFloat: number) => {
    const newShift: Shift = {
      id: 'shift_' + Date.now(),
      cashierId: currentUser.id,
      cashierName: currentUser.name,
      startTime: new Date().toISOString(),
      openingFloat,
      cashSales: 0,
      mpesaSales: 0,
      cardSales: 0,
      creditSales: 0,
      totalSales: 0,
      cashIn: 0,
      cashOut: 0,
      expectedCash: openingFloat,
      status: 'open'
    };
    const updated = [newShift, ...shifts];
    setShifts(updated);
    StorageService.saveShifts(updated);
  };

  const closeShift = (countedCash: number, notes?: string): Shift => {
    if (!currentShift) throw new Error('No open shift found');

    const expectedCash = currentShift.openingFloat + currentShift.cashSales + currentShift.cashIn - currentShift.cashOut;
    const variance = countedCash - expectedCash;

    const closed: Shift = {
      ...currentShift,
      endTime: new Date().toISOString(),
      closingFloat: countedCash,
      countedCash,
      expectedCash,
      variance,
      notes,
      status: 'closed'
    };

    const updated = shifts.map((s) => (s.id === currentShift.id ? closed : s));
    setShifts(updated);
    StorageService.saveShifts(updated);

    StorageService.logAudit({
      userId: currentUser.id,
      userName: currentUser.name,
      action: 'cash_drawer_open',
      details: `Shift closed. Expected cash: KSh ${expectedCash}, Counted: KSh ${countedCash}, Variance: KSh ${variance}`
    });

    return closed;
  };

  // Manager PIN check
  const verifyManagerPin = (pin: string): boolean => {
    const managers = employees.filter((e) => e.role === 'owner' || e.role === 'manager');
    return managers.some((m) => m.pin === pin);
  };

  const updateSettings = (newSettings: StoreSettings) => {
    setSettings(newSettings);
    StorageService.saveSettings(newSettings);
  };

  const syncOfflineQueue = async (): Promise<number> => {
    const queue = StorageService.getSyncQueue();
    if (queue.length === 0) return 0;
    // Mark sales as synced
    const updatedSales = sales.map((s) => (s.syncStatus === 'pending_sync' ? { ...s, syncStatus: 'synced' as const } : s));
    setSales(updatedSales);
    StorageService.saveSales(updatedSales);
    StorageService.clearSyncQueue();
    return queue.length;
  };

  const resetAllData = () => {
    StorageService.resetToDefaultData();
    setProducts(StorageService.getProducts());
    setSales(StorageService.getSales());
    setCustomers(StorageService.getCustomers());
    setSuppliers(StorageService.getSuppliers());
    setExpenses(StorageService.getExpenses());
    setWastage(StorageService.getWastage());
    setShifts(StorageService.getShifts());
    setSettings(StorageService.getSettings());
    setCartTabs([{ id: 'tab_1', name: 'Sale 1', items: [] }]);
    setActiveTabId('tab_1');
  };

  const syncPendingCount = sales.filter((s) => s.syncStatus === 'pending_sync').length;

  return (
    <StoreContext.Provider
      value={{
        products,
        sales,
        customers,
        suppliers,
        expenses,
        wastage,
        shifts,
        currentShift,
        employees,
        currentUser,
        cartTabs,
        activeTabId,
        activeCart,
        settings,
        language,
        theme,
        isOnline,
        syncPendingCount,
        lastCompletedSale,
        setActiveTabId,
        createCartTab,
        removeCartTab,
        addToCart,
        updateCartItemQuantity,
        updateCartItemDiscount,
        removeFromCart,
        clearActiveCart,
        setActiveCartCustomer,
        processSale,
        voidSale,
        recordRepayment,
        recordWastage,
        addStockIn,
        adjustStocktake,
        addProduct,
        updateProduct,
        addExpense,
        startShift,
        closeShift,
        setCurrentUser,
        verifyManagerPin,
        updateSettings,
        syncOfflineQueue,
        setLanguage,
        setTheme,
        resetAllData
      }}
    >
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
};
