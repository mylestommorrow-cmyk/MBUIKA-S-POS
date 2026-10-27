import { Product, Sale, Customer, Supplier, Expense, Shift, AuditLog, StoreSettings, WastageRecord, CreditRepayment } from '../types/grocery';
import { INITIAL_PRODUCTS, INITIAL_CUSTOMERS, INITIAL_SUPPLIERS, INITIAL_EXPENSES, INITIAL_SALES, INITIAL_SHIFTS, INITIAL_SETTINGS, INITIAL_WASTAGE } from '../data/initialData';

const STORAGE_KEYS = {
  PRODUCTS: 'mbuikas_products_v1',
  SALES: 'mbuikas_sales_v1',
  CUSTOMERS: 'mbuikas_customers_v1',
  SUPPLIERS: 'mbuikas_suppliers_v1',
  EXPENSES: 'mbuikas_expenses_v1',
  WASTAGE: 'mbuikas_wastage_v1',
  SHIFTS: 'mbuikas_shifts_v1',
  AUDIT_LOGS: 'mbuikas_audit_logs_v1',
  SETTINGS: 'mbuikas_settings_v1',
  REPAYMENTS: 'mbuikas_repayments_v1',
  SYNC_QUEUE: 'mbuikas_sync_queue_v1'
};

export class StorageService {
  static getSettings(): StoreSettings {
    const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    return raw ? JSON.parse(raw) : INITIAL_SETTINGS;
  }

  static saveSettings(settings: StoreSettings): void {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  }

  static getProducts(): Product[] {
    const raw = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
    return raw ? JSON.parse(raw) : INITIAL_PRODUCTS;
  }

  static saveProducts(products: Product[]): void {
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
  }

  static getSales(): Sale[] {
    const raw = localStorage.getItem(STORAGE_KEYS.SALES);
    return raw ? JSON.parse(raw) : INITIAL_SALES;
  }

  static saveSales(sales: Sale[]): void {
    localStorage.setItem(STORAGE_KEYS.SALES, JSON.stringify(sales));
  }

  static addSale(sale: Sale): void {
    const sales = this.getSales();
    sales.unshift(sale);
    this.saveSales(sales);

    // If offline, also enqueue for backend sync
    if (sale.syncStatus === 'pending_sync') {
      const queue = this.getSyncQueue();
      queue.push(sale.id);
      localStorage.setItem(STORAGE_KEYS.SYNC_QUEUE, JSON.stringify(queue));
    }
  }

  static getSyncQueue(): string[] {
    const raw = localStorage.getItem(STORAGE_KEYS.SYNC_QUEUE);
    return raw ? JSON.parse(raw) : [];
  }

  static clearSyncQueue(): void {
    localStorage.setItem(STORAGE_KEYS.SYNC_QUEUE, JSON.stringify([]));
  }

  static getCustomers(): Customer[] {
    const raw = localStorage.getItem(STORAGE_KEYS.CUSTOMERS);
    return raw ? JSON.parse(raw) : INITIAL_CUSTOMERS;
  }

  static saveCustomers(customers: Customer[]): void {
    localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(customers));
  }

  static getSuppliers(): Supplier[] {
    const raw = localStorage.getItem(STORAGE_KEYS.SUPPLIERS);
    return raw ? JSON.parse(raw) : INITIAL_SUPPLIERS;
  }

  static saveSuppliers(suppliers: Supplier[]): void {
    localStorage.setItem(STORAGE_KEYS.SUPPLIERS, JSON.stringify(suppliers));
  }

  static getExpenses(): Expense[] {
    const raw = localStorage.getItem(STORAGE_KEYS.EXPENSES);
    return raw ? JSON.parse(raw) : INITIAL_EXPENSES;
  }

  static saveExpenses(expenses: Expense[]): void {
    localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(expenses));
  }

  static getWastage(): WastageRecord[] {
    const raw = localStorage.getItem(STORAGE_KEYS.WASTAGE);
    return raw ? JSON.parse(raw) : INITIAL_WASTAGE;
  }

  static saveWastage(wastage: WastageRecord[]): void {
    localStorage.setItem(STORAGE_KEYS.WASTAGE, JSON.stringify(wastage));
  }

  static getShifts(): Shift[] {
    const raw = localStorage.getItem(STORAGE_KEYS.SHIFTS);
    return raw ? JSON.parse(raw) : INITIAL_SHIFTS;
  }

  static saveShifts(shifts: Shift[]): void {
    localStorage.setItem(STORAGE_KEYS.SHIFTS, JSON.stringify(shifts));
  }

  static getRepayments(): CreditRepayment[] {
    const raw = localStorage.getItem(STORAGE_KEYS.REPAYMENTS);
    return raw ? JSON.parse(raw) : [];
  }

  static saveRepayments(repayments: CreditRepayment[]): void {
    localStorage.setItem(STORAGE_KEYS.REPAYMENTS, JSON.stringify(repayments));
  }

  static getAuditLogs(): AuditLog[] {
    const raw = localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS);
    return raw ? JSON.parse(raw) : [];
  }

  static logAudit(log: Omit<AuditLog, 'id' | 'timestamp'>): void {
    const logs = this.getAuditLogs();
    const entry: AuditLog = {
      ...log,
      id: 'log_' + Date.now(),
      timestamp: new Date().toISOString()
    };
    logs.unshift(entry);
    localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(logs.slice(0, 500)));
  }

  static resetToDefaultData(): void {
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(INITIAL_PRODUCTS));
    localStorage.setItem(STORAGE_KEYS.SALES, JSON.stringify(INITIAL_SALES));
    localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(INITIAL_CUSTOMERS));
    localStorage.setItem(STORAGE_KEYS.SUPPLIERS, JSON.stringify(INITIAL_SUPPLIERS));
    localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(INITIAL_EXPENSES));
    localStorage.setItem(STORAGE_KEYS.WASTAGE, JSON.stringify(INITIAL_WASTAGE));
    localStorage.setItem(STORAGE_KEYS.SHIFTS, JSON.stringify(INITIAL_SHIFTS));
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(INITIAL_SETTINGS));
    localStorage.setItem(STORAGE_KEYS.REPAYMENTS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.SYNC_QUEUE, JSON.stringify([]));
  }
}
