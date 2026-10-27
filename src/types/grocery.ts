export type UserRole = 'owner' | 'manager' | 'cashier' | 'stock_clerk';

export interface Employee {
  id: string;
  name: string;
  role: UserRole;
  pin: string; // 4-digit PIN for quick POS switch
  phone: string;
  active: boolean;
}

export type UnitOfMeasure = 'piece' | 'kg' | 'g' | 'litre' | 'packet' | 'dozen' | 'carton' | 'bag_50kg' | 'bag_25kg';

export interface ProductBatch {
  id: string;
  productId: string;
  batchNumber: string;
  quantityRemaining: number; // in base units (e.g. kg or pieces)
  costPrice: number; // KSh per base unit
  receivedDate: string; // ISO date
  expiryDate: string; // ISO date
  supplierId?: string;
}

export interface Product {
  id: string;
  barcode: string;
  sku: string;
  name: string;
  nameSwahili?: string;
  category: string;
  unit: UnitOfMeasure;
  isWeighed: boolean; // if true, uses scale / decimal quantities (e.g. 1.25 kg)
  sellingPrice: number; // KSh per unit
  costPrice: number; // default or weighted average cost per unit
  currentStock: number;
  minStockLevel: number; // reorder trigger
  taxRate: number; // 0.16 (VAT 16%), 0 (0% rated), or 0 (exempt)
  taxType: 'vat16' | 'zero_rated' | 'exempt';
  isPerishable: boolean;
  batches?: ProductBatch[]; // FEFO batches
  isQuickSale?: boolean; // pinned to POS quick buttons
  image?: string;
}

export interface CartItem {
  productId: string;
  productName: string;
  barcode: string;
  unit: UnitOfMeasure;
  isWeighed: boolean;
  quantity: number;
  unitPrice: number; // original selling price
  discountAmount: number; // discount per item or line
  finalPrice: number; // price after discount
  lineTotal: number; // finalPrice * quantity
  taxRate: number;
  taxAmount: number;
  costPrice: number; // for profit calculation at point of sale
  batchId?: string; // assigned FEFO batch
}

export type PaymentMethod = 'cash' | 'mpesa' | 'card' | 'credit' | 'split';

export interface PaymentSplit {
  method: 'cash' | 'mpesa' | 'card';
  amount: number;
  reference?: string; // M-Pesa code or card auth
}

export interface Sale {
  id: string;
  receiptNumber: string;
  date: string; // ISO string
  items: CartItem[];
  subtotal: number;
  totalDiscount: number;
  taxTotal: number;
  grandTotal: number;
  totalCost: number; // COGS
  grossProfit: number; // grandTotal - totalCost
  paymentMethod: PaymentMethod;
  paymentDetails: {
    cashTendered?: number;
    changeGiven?: number;
    mpesaPhone?: string;
    mpesaReceipt?: string;
    splits?: PaymentSplit[];
  };
  customerId?: string;
  customerName?: string;
  cashierId: string;
  cashierName: string;
  status: 'completed' | 'refunded' | 'voided';
  voidReason?: string;
  isCredit: boolean;
  creditSettled: boolean;
  syncStatus: 'synced' | 'pending_sync';
  kraETimsNumber?: string;
  qrCodeUrl?: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  creditLimit: number;
  currentCredit: number; // outstanding mkopo
  loyaltyPoints: number;
  totalSpent: number;
  notes?: string;
  createdAt: string;
}

export interface CreditRepayment {
  id: string;
  customerId: string;
  date: string;
  amount: number;
  paymentMethod: 'cash' | 'mpesa';
  mpesaReceipt?: string;
  receivedBy: string;
  notes?: string;
}

export interface Supplier {
  id: string;
  name: string;
  contactPerson: string;
  phone: string;
  email?: string;
  amountOwed: number; // supplier payables
  terms?: string;
}

export interface WastageRecord {
  id: string;
  date: string;
  productId: string;
  productName: string;
  quantity: number;
  unit: UnitOfMeasure;
  costPrice: number;
  totalLoss: number; // quantity * costPrice
  reason: 'expired' | 'damaged' | 'spoiled_rotten' | 'theft' | 'spill_shrinkage';
  batchNumber?: string;
  recordedBy: string;
  notes?: string;
}

export interface Expense {
  id: string;
  date: string;
  category: 'rent' | 'electricity' | 'water' | 'salaries' | 'transport' | 'licences_council' | 'packaging' | 'maintenance' | 'others';
  description: string;
  amount: number;
  paymentMethod: 'cash' | 'mpesa' | 'bank';
  receiptRef?: string;
  recordedBy: string;
}

export interface Shift {
  id: string;
  cashierId: string;
  cashierName: string;
  startTime: string;
  endTime?: string;
  openingFloat: number;
  closingFloat?: number;
  cashSales: number;
  mpesaSales: number;
  cardSales: number;
  creditSales: number;
  totalSales: number;
  cashIn: number;
  cashOut: number;
  expectedCash: number; // openingFloat + cashSales + cashIn - cashOut
  countedCash?: number;
  variance?: number; // countedCash - expectedCash
  notes?: string;
  status: 'open' | 'closed';
}

export interface AuditLog {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  action: 'void_item' | 'void_sale' | 'discount_applied' | 'price_override' | 'stock_adjustment' | 'credit_limit_change' | 'login' | 'cash_drawer_open';
  details: string;
  authorizedBy?: string;
}

export interface StoreSettings {
  storeName: string;
  tagline: string;
  address: string;
  city: string;
  phone: string;
  whatsapp: string;
  kraPin: string;
  enableEtims: boolean;
  etimsDeviceNumber: string;
  mpesaShortcode: string;
  mpesaTillOrPaybill: 'till' | 'paybill';
  mpesaPasskey: string;
  mpesaConsumerKey: string;
  mpesaConsumerSecret: string;
  mpesaEnvironment: 'sandbox' | 'production';
  enableLoyalty: boolean;
  loyaltyPointsRate: number; // KSh spent per 1 point
  printerType: '58mm' | '80mm';
  supabaseUrl?: string;
  supabaseAnonKey?: string;
}

export interface DateFilterRange {
  startDate: string;
  endDate: string;
  label: 'today' | 'yesterday' | 'this_week' | 'last_week' | 'this_month' | 'last_month' | 'custom';
}
