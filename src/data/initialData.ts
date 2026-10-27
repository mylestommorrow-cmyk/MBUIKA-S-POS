import { Product, Customer, Supplier, Expense, Shift, Employee, StoreSettings, Sale, WastageRecord } from '../types/grocery';

export const INITIAL_EMPLOYEES: Employee[] = [
  { id: 'emp_1', name: 'John Mbuika', role: 'owner', pin: '1234', phone: '0722111222', active: true },
  { id: 'emp_2', name: 'Mary Mwangi', role: 'manager', pin: '4321', phone: '0733222333', active: true },
  { id: 'emp_3', name: 'Kevin Kipkorir', role: 'cashier', pin: '1111', phone: '0711333444', active: true },
  { id: 'emp_4', name: 'Amina Hassan', role: 'stock_clerk', pin: '2222', phone: '0720444555', active: true }
];

export const INITIAL_SETTINGS: StoreSettings = {
  storeName: 'MBUIKAS GROCERY',
  tagline: 'Fresh Groceries, Wholesale & Retail Store',
  address: 'Shop #14, Ground Floor, Commercial Center, Thika Road',
  city: 'Nairobi, Kenya',
  phone: '+254 722 000 111',
  whatsapp: '254722000111',
  kraPin: 'P051234567Z',
  enableEtims: true,
  etimsDeviceNumber: 'KRA-ETIMS-MBK-084',
  mpesaShortcode: '522522',
  mpesaTillOrPaybill: 'till',
  mpesaPasskey: 'bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919',
  mpesaConsumerKey: 'SANDBOX_MBU_KEY_9847',
  mpesaConsumerSecret: 'SANDBOX_MBU_SEC_3312',
  mpesaEnvironment: 'sandbox',
  enableLoyalty: true,
  loyaltyPointsRate: 100, // 1 point for every 100 KSh spent
  printerType: '80mm',
  supabaseUrl: '',
  supabaseAnonKey: ''
};

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'prod_1',
    barcode: '6161101234567',
    sku: 'FLOUR-JOG-2KG',
    name: 'Jogoo Maize Meal 2kg',
    nameSwahili: 'Unga wa Jogoo 2kg',
    category: 'Flours & Grains',
    unit: 'piece',
    isWeighed: false,
    sellingPrice: 195,
    costPrice: 165,
    currentStock: 48,
    minStockLevel: 15,
    taxRate: 0,
    taxType: 'zero_rated',
    isPerishable: true,
    isQuickSale: true,
    batches: [
      { id: 'b_101', productId: 'prod_1', batchNumber: 'JOG-2026-A', quantityRemaining: 20, costPrice: 165, receivedDate: '2026-10-10', expiryDate: '2026-12-15' },
      { id: 'b_102', productId: 'prod_1', batchNumber: 'JOG-2026-B', quantityRemaining: 28, costPrice: 165, receivedDate: '2026-10-20', expiryDate: '2027-01-20' }
    ]
  },
  {
    id: 'prod_2',
    barcode: '6161102345678',
    sku: 'FLOUR-PEM-2KG',
    name: 'Pembe Maize Meal 2kg',
    nameSwahili: 'Unga wa Pembe 2kg',
    category: 'Flours & Grains',
    unit: 'piece',
    isWeighed: false,
    sellingPrice: 190,
    costPrice: 162,
    currentStock: 35,
    minStockLevel: 10,
    taxRate: 0,
    taxType: 'zero_rated',
    isPerishable: true,
    isQuickSale: true,
    batches: [
      { id: 'b_201', productId: 'prod_2', batchNumber: 'PEM-2026-1', quantityRemaining: 35, costPrice: 162, receivedDate: '2026-10-15', expiryDate: '2026-12-30' }
    ]
  },
  {
    id: 'prod_3',
    barcode: '6161103456789',
    sku: 'SUGAR-LOOSE-KG',
    name: 'Sugar Loose (White) 1kg',
    nameSwahili: 'Sukari ya Kupima (Kilo)',
    category: 'Sugar & Sweeteners',
    unit: 'kg',
    isWeighed: true,
    sellingPrice: 180,
    costPrice: 150,
    currentStock: 125.5,
    minStockLevel: 25,
    taxRate: 0.16,
    taxType: 'vat16',
    isPerishable: false,
    isQuickSale: true,
    batches: [
      { id: 'b_301', productId: 'prod_3', batchNumber: 'SUG-OCT-01', quantityRemaining: 125.5, costPrice: 150, receivedDate: '2026-10-01', expiryDate: '2027-10-01' }
    ]
  },
  {
    id: 'prod_4',
    barcode: '6161104567890',
    sku: 'RICE-PISH-KG',
    name: 'Pure Pishori Mwea Rice (Loose)',
    nameSwahili: 'Mchele wa Pishori Mwea (Kilo)',
    category: 'Flours & Grains',
    unit: 'kg',
    isWeighed: true,
    sellingPrice: 240,
    costPrice: 195,
    currentStock: 82.0,
    minStockLevel: 20,
    taxRate: 0,
    taxType: 'zero_rated',
    isPerishable: false,
    isQuickSale: true,
    batches: [
      { id: 'b_401', productId: 'prod_4', batchNumber: 'PISH-MWEA-99', quantityRemaining: 82.0, costPrice: 195, receivedDate: '2026-10-05', expiryDate: '2027-08-01' }
    ]
  },
  {
    id: 'prod_5',
    barcode: '6161105678901',
    sku: 'VEG-TOMATO-KG',
    name: 'Fresh Tomatoes (Ripe)',
    nameSwahili: 'Nyanya Safi (Kilo)',
    category: 'Fresh Produce',
    unit: 'kg',
    isWeighed: true,
    sellingPrice: 120,
    costPrice: 85,
    currentStock: 42.5,
    minStockLevel: 10,
    taxRate: 0,
    taxType: 'zero_rated',
    isPerishable: true,
    isQuickSale: true,
    batches: [
      // Batch expiring in 2 days! FEFO alert test
      { id: 'b_501', productId: 'prod_5', batchNumber: 'TOM-WK43', quantityRemaining: 14.5, costPrice: 85, receivedDate: '2026-10-23', expiryDate: '2026-10-28' },
      { id: 'b_502', productId: 'prod_5', batchNumber: 'TOM-WK44', quantityRemaining: 28.0, costPrice: 85, receivedDate: '2026-10-25', expiryDate: '2026-11-02' }
    ]
  },
  {
    id: 'prod_6',
    barcode: '6161106789012',
    sku: 'VEG-ONION-KG',
    name: 'Red Onions (Kitunguu Maji)',
    nameSwahili: 'Kitunguu Maji Chekundu (Kilo)',
    category: 'Fresh Produce',
    unit: 'kg',
    isWeighed: true,
    sellingPrice: 150,
    costPrice: 110,
    currentStock: 65.0,
    minStockLevel: 15,
    taxRate: 0,
    taxType: 'zero_rated',
    isPerishable: true,
    isQuickSale: true,
    batches: [
      { id: 'b_601', productId: 'prod_6', batchNumber: 'ONI-OCT-18', quantityRemaining: 65.0, costPrice: 110, receivedDate: '2026-10-18', expiryDate: '2026-11-20' }
    ]
  },
  {
    id: 'prod_7',
    barcode: '6161107890123',
    sku: 'VEG-POTATO-KG',
    name: 'Irish Potatoes (Waru)',
    nameSwahili: 'Viazi Mviringo (Waru Kilo)',
    category: 'Fresh Produce',
    unit: 'kg',
    isWeighed: true,
    sellingPrice: 90,
    costPrice: 65,
    currentStock: 110.0,
    minStockLevel: 30,
    taxRate: 0,
    taxType: 'zero_rated',
    isPerishable: true,
    isQuickSale: true,
    batches: [
      { id: 'b_701', productId: 'prod_7', batchNumber: 'WARU-NYANDARUA', quantityRemaining: 110.0, costPrice: 65, receivedDate: '2026-10-22', expiryDate: '2026-11-15' }
    ]
  },
  {
    id: 'prod_8',
    barcode: '6161108901234',
    sku: 'DAIRY-BS-500ML',
    name: 'Brookside Fresh Milk 500ml pouch',
    nameSwahili: 'Maziwa ya Brookside 500ml',
    category: 'Dairy & Milk',
    unit: 'piece',
    isWeighed: false,
    sellingPrice: 65,
    costPrice: 53,
    currentStock: 24,
    minStockLevel: 12,
    taxRate: 0,
    taxType: 'zero_rated',
    isPerishable: true,
    isQuickSale: true,
    batches: [
      // Expiring in 3 days!
      { id: 'b_801', productId: 'prod_8', batchNumber: 'BRK-BATCH-24', quantityRemaining: 10, costPrice: 53, receivedDate: '2026-10-25', expiryDate: '2026-10-29' },
      { id: 'b_802', productId: 'prod_8', batchNumber: 'BRK-BATCH-26', quantityRemaining: 14, costPrice: 53, receivedDate: '2026-10-26', expiryDate: '2026-10-31' }
    ]
  },
  {
    id: 'prod_9',
    barcode: '6161109012345',
    sku: 'OIL-RINA-1L',
    name: 'Rina Salad Vegetable Oil 1L',
    nameSwahili: 'Mafuta ya Rina 1L',
    category: 'Cooking Oils & Fats',
    unit: 'piece',
    isWeighed: false,
    sellingPrice: 320,
    costPrice: 275,
    currentStock: 18,
    minStockLevel: 8,
    taxRate: 0.16,
    taxType: 'vat16',
    isPerishable: false,
    isQuickSale: true,
    batches: [
      { id: 'b_901', productId: 'prod_9', batchNumber: 'RINA-2026-08', quantityRemaining: 18, costPrice: 275, receivedDate: '2026-09-15', expiryDate: '2027-09-15' }
    ]
  },
  {
    id: 'prod_10',
    barcode: '6161100123456',
    sku: 'OIL-LOOSE-L',
    name: 'Cooking Oil (Loose Dispensed 1L)',
    nameSwahili: 'Mafuta ya Kupikia ya Kupima (Lita)',
    category: 'Cooking Oils & Fats',
    unit: 'litre',
    isWeighed: true,
    sellingPrice: 250,
    costPrice: 210,
    currentStock: 45.0,
    minStockLevel: 15,
    taxRate: 0.16,
    taxType: 'vat16',
    isPerishable: false,
    isQuickSale: true,
    batches: [
      { id: 'b_1001', productId: 'prod_10', batchNumber: 'OIL-DRUM-12', quantityRemaining: 45.0, costPrice: 210, receivedDate: '2026-10-12', expiryDate: '2027-05-01' }
    ]
  },
  {
    id: 'prod_11',
    barcode: '6161111234567',
    sku: 'COND-ROYCO-40S',
    name: 'Royco Beef Flavour Cubes 40s',
    nameSwahili: 'Royco za Nyama (Pakiti 40)',
    category: 'Flours & Grains',
    unit: 'packet',
    isWeighed: false,
    sellingPrice: 160,
    costPrice: 130,
    currentStock: 22,
    minStockLevel: 6,
    taxRate: 0.16,
    taxType: 'vat16',
    isPerishable: true,
    isQuickSale: false,
    batches: [
      { id: 'b_1101', productId: 'prod_11', batchNumber: 'ROY-2026-4', quantityRemaining: 22, costPrice: 130, receivedDate: '2026-08-20', expiryDate: '2027-04-10' }
    ]
  },
  {
    id: 'prod_12',
    barcode: '6161112345678',
    sku: 'BEV-KETEPA-250G',
    name: 'Ketepa Pride Loose Tea Leaves 250g',
    nameSwahili: 'Majani ya Chai Ketepa 250g',
    category: 'Flours & Grains',
    unit: 'piece',
    isWeighed: false,
    sellingPrice: 140,
    costPrice: 115,
    currentStock: 16,
    minStockLevel: 5,
    taxRate: 0.16,
    taxType: 'vat16',
    isPerishable: false,
    isQuickSale: false,
    batches: [
      { id: 'b_1201', productId: 'prod_12', batchNumber: 'KET-TEA-89', quantityRemaining: 16, costPrice: 115, receivedDate: '2026-09-01', expiryDate: '2028-01-01' }
    ]
  },
  {
    id: 'prod_13',
    barcode: '6161113456789',
    sku: 'SOAP-SUNLIGHT-500G',
    name: 'Sunlight Washing Powder 500g',
    nameSwahili: 'Sabuni ya Unga Sunlight 500g',
    category: 'Household & Soaps',
    unit: 'piece',
    isWeighed: false,
    sellingPrice: 175,
    costPrice: 142,
    currentStock: 25,
    minStockLevel: 8,
    taxRate: 0.16,
    taxType: 'vat16',
    isPerishable: false,
    isQuickSale: true,
    batches: [
      { id: 'b_1301', productId: 'prod_13', batchNumber: 'SUN-POW-22', quantityRemaining: 25, costPrice: 142, receivedDate: '2026-09-10', expiryDate: '2029-01-01' }
    ]
  },
  {
    id: 'prod_14',
    barcode: '6161114567890',
    sku: 'SOAP-MENENGAI-800G',
    name: 'Menengai Cream Bar Soap 800g',
    nameSwahili: 'Sabuni ya Kipande Menengai 800g',
    category: 'Household & Soaps',
    unit: 'piece',
    isWeighed: false,
    sellingPrice: 185,
    costPrice: 152,
    currentStock: 4, // LOW STOCK TRIGGER (< 10)
    minStockLevel: 10,
    taxRate: 0.16,
    taxType: 'vat16',
    isPerishable: false,
    isQuickSale: true,
    batches: [
      { id: 'b_1401', productId: 'prod_14', batchNumber: 'MEN-BAR-11', quantityRemaining: 4, costPrice: 152, receivedDate: '2026-08-15', expiryDate: '2029-01-01' }
    ]
  },
  {
    id: 'prod_15',
    barcode: '6161115678901',
    sku: 'GRAIN-BEANS-KG',
    name: 'Yellow Beans (Nyayo) Cleaned 1kg',
    nameSwahili: 'Maharagwe ya Manjano (Nyayo Kilo)',
    category: 'Flours & Grains',
    unit: 'kg',
    isWeighed: true,
    sellingPrice: 220,
    costPrice: 175,
    currentStock: 3, // LOW STOCK (< 15)
    minStockLevel: 15,
    taxRate: 0,
    taxType: 'zero_rated',
    isPerishable: false,
    isQuickSale: false,
    batches: [
      { id: 'b_1501', productId: 'prod_15', batchNumber: 'BEAN-NYA-55', quantityRemaining: 3, costPrice: 175, receivedDate: '2026-10-02', expiryDate: '2027-06-01' }
    ]
  }
];

export const INITIAL_CUSTOMERS: Customer[] = [
  {
    id: 'cust_1',
    name: 'Mama Jane Wairimu',
    phone: '0721888999',
    creditLimit: 5000,
    currentCredit: 2450, // Mkopo outstanding
    loyaltyPoints: 340,
    totalSpent: 38400,
    notes: 'Regular customer, pays end of month via M-Pesa',
    createdAt: '2026-01-15'
  },
  {
    id: 'cust_2',
    name: 'Dennis Omondi (Boda Stage)',
    phone: '0712334455',
    creditLimit: 3000,
    currentCredit: 1120, // Mkopo outstanding
    loyaltyPoints: 120,
    totalSpent: 14200,
    notes: 'Boda rider, settles every Friday',
    createdAt: '2026-03-20'
  },
  {
    id: 'cust_3',
    name: 'Mwalimu Peter Kamau',
    phone: '0733556677',
    creditLimit: 8000,
    currentCredit: 0, // Fully settled
    loyaltyPoints: 510,
    totalSpent: 62000,
    notes: 'Primary school teacher, pays promptly upon salary',
    createdAt: '2026-02-10'
  },
  {
    id: 'cust_4',
    name: 'Alice Muthoni',
    phone: '0790112233',
    creditLimit: 4000,
    currentCredit: 1850,
    loyaltyPoints: 95,
    totalSpent: 11500,
    notes: 'Neighbour estate resident',
    createdAt: '2026-05-18'
  }
];

export const INITIAL_SUPPLIERS: Supplier[] = [
  {
    id: 'sup_1',
    name: 'Unga Farm Care Ltd',
    contactPerson: 'Kamau Njoroge',
    phone: '0722100200',
    email: 'orders@ungagroup.com',
    amountOwed: 14500,
    terms: 'Net 14 days delivery upon invoice'
  },
  {
    id: 'sup_2',
    name: 'Brookside Dairy Distributors',
    contactPerson: 'Grace Wanjiku',
    phone: '0733400500',
    email: 'dispatch@brookside.co.ke',
    amountOwed: 8200,
    terms: 'Weekly settlement via Paybill'
  },
  {
    id: 'sup_3',
    name: 'Wakulima Wholesale Traders',
    contactPerson: 'Moses Odhiambo',
    phone: '0711900800',
    email: 'wakulima@trade.ke',
    amountOwed: 0,
    terms: 'Cash on delivery for fresh farm haul'
  },
  {
    id: 'sup_4',
    name: 'Bidco Africa Ltd',
    contactPerson: 'Faith Chebet',
    phone: '0720333444',
    email: 'supply@bidco-group.com',
    amountOwed: 21000,
    terms: 'Net 30 days for fats and detergents'
  }
];

export const INITIAL_EXPENSES: Expense[] = [
  {
    id: 'exp_1',
    date: '2026-10-26',
    category: 'transport',
    description: 'Boda & handcart transport from Marikiti Market',
    amount: 650,
    paymentMethod: 'cash',
    receiptRef: 'HCT-991',
    recordedBy: 'John Mbuika'
  },
  {
    id: 'exp_2',
    date: '2026-10-25',
    category: 'packaging',
    description: 'Bulk brown paper bags & biodegradable rolls 500pcs',
    amount: 1400,
    paymentMethod: 'mpesa',
    receiptRef: 'MPESA-QW8920K',
    recordedBy: 'Mary Mwangi'
  },
  {
    id: 'exp_3',
    date: '2026-10-24',
    category: 'electricity',
    description: 'Kenya Power Prepaid Token for display chillers & POS',
    amount: 2500,
    paymentMethod: 'mpesa',
    receiptRef: 'KPLC-8830192',
    recordedBy: 'John Mbuika'
  },
  {
    id: 'exp_4',
    date: '2026-10-20',
    category: 'rent',
    description: 'Shop monthly rental advance partial payment',
    amount: 15000,
    paymentMethod: 'bank',
    receiptRef: 'BK-TRF-09182',
    recordedBy: 'John Mbuika'
  },
  {
    id: 'exp_5',
    date: '2026-10-18',
    category: 'water',
    description: 'Nairobi Water sanitation token & meter bill',
    amount: 800,
    paymentMethod: 'mpesa',
    receiptRef: 'NCWSC-7712',
    recordedBy: 'Mary Mwangi'
  }
];

export const INITIAL_WASTAGE: WastageRecord[] = [
  {
    id: 'w_1',
    date: '2026-10-25',
    productId: 'prod_5',
    productName: 'Fresh Tomatoes (Ripe)',
    quantity: 3.5,
    unit: 'kg',
    costPrice: 85,
    totalLoss: 297.5,
    reason: 'spoiled_rotten',
    recordedBy: 'Mary Mwangi',
    notes: 'Bruised in transit crate from Kinangop'
  },
  {
    id: 'w_2',
    date: '2026-10-23',
    productId: 'prod_8',
    productName: 'Brookside Fresh Milk 500ml pouch',
    quantity: 2,
    unit: 'piece',
    costPrice: 53,
    totalLoss: 106,
    reason: 'expired',
    batchNumber: 'BRK-BATCH-22',
    recordedBy: 'Kevin Kipkorir',
    notes: 'Exceeded display shelf expiration'
  }
];

// Rich sales history covering Today, Yesterday, This Week, and This Month
// so the Owner P&L calculations (Daily, Weekly, Monthly) have real computed data immediately!
export const INITIAL_SALES: Sale[] = [
  {
    id: 'sale_101',
    receiptNumber: 'MBK-20261026-001',
    date: '2026-10-26T08:15:00Z',
    items: [
      {
        productId: 'prod_1',
        productName: 'Jogoo Maize Meal 2kg',
        barcode: '6161101234567',
        unit: 'piece',
        isWeighed: false,
        quantity: 2,
        unitPrice: 195,
        discountAmount: 0,
        finalPrice: 195,
        lineTotal: 390,
        taxRate: 0,
        taxAmount: 0,
        costPrice: 165,
        batchId: 'b_101'
      },
      {
        productId: 'prod_8',
        productName: 'Brookside Fresh Milk 500ml pouch',
        barcode: '6161108901234',
        unit: 'piece',
        isWeighed: false,
        quantity: 2,
        unitPrice: 65,
        discountAmount: 0,
        finalPrice: 65,
        lineTotal: 130,
        taxRate: 0,
        taxAmount: 0,
        costPrice: 53,
        batchId: 'b_801'
      }
    ],
    subtotal: 520,
    totalDiscount: 0,
    taxTotal: 0,
    grandTotal: 520,
    totalCost: 436, // (2*165) + (2*53) = 330 + 106 = 436
    grossProfit: 84,
    paymentMethod: 'cash',
    paymentDetails: { cashTendered: 1000, changeGiven: 480 },
    cashierId: 'emp_3',
    cashierName: 'Kevin Kipkorir',
    status: 'completed',
    isCredit: false,
    creditSettled: true,
    syncStatus: 'synced',
    kraETimsNumber: 'KRA-ETIMS-2026-0081'
  },
  {
    id: 'sale_102',
    receiptNumber: 'MBK-20261026-002',
    date: '2026-10-26T09:30:00Z',
    items: [
      {
        productId: 'prod_3',
        productName: 'Sugar Loose (White) 1kg',
        barcode: '6161103456789',
        unit: 'kg',
        isWeighed: true,
        quantity: 2.5,
        unitPrice: 180,
        discountAmount: 0,
        finalPrice: 180,
        lineTotal: 450,
        taxRate: 0.16,
        taxAmount: 62.07,
        costPrice: 150,
        batchId: 'b_301'
      },
      {
        productId: 'prod_9',
        productName: 'Rina Salad Vegetable Oil 1L',
        barcode: '6161109012345',
        unit: 'piece',
        isWeighed: false,
        quantity: 1,
        unitPrice: 320,
        discountAmount: 0,
        finalPrice: 320,
        lineTotal: 320,
        taxRate: 0.16,
        taxAmount: 44.14,
        costPrice: 275,
        batchId: 'b_901'
      }
    ],
    subtotal: 770,
    totalDiscount: 0,
    taxTotal: 106.21,
    grandTotal: 770,
    totalCost: 650, // (2.5*150=375) + 275 = 650
    grossProfit: 120,
    paymentMethod: 'mpesa',
    paymentDetails: { mpesaPhone: '0722888999', mpesaReceipt: 'SKF81029KL' },
    customerId: 'cust_1',
    customerName: 'Mama Jane Wairimu',
    cashierId: 'emp_3',
    cashierName: 'Kevin Kipkorir',
    status: 'completed',
    isCredit: false,
    creditSettled: true,
    syncStatus: 'synced',
    kraETimsNumber: 'KRA-ETIMS-2026-0082'
  },
  {
    id: 'sale_103',
    receiptNumber: 'MBK-20261026-003',
    date: '2026-10-26T10:45:00Z',
    items: [
      {
        productId: 'prod_5',
        productName: 'Fresh Tomatoes (Ripe)',
        barcode: '6161105678901',
        unit: 'kg',
        isWeighed: true,
        quantity: 1.8,
        unitPrice: 120,
        discountAmount: 0,
        finalPrice: 120,
        lineTotal: 216,
        taxRate: 0,
        taxAmount: 0,
        costPrice: 85,
        batchId: 'b_501'
      },
      {
        productId: 'prod_6',
        productName: 'Red Onions (Kitunguu Maji)',
        barcode: '6161106789012',
        unit: 'kg',
        isWeighed: true,
        quantity: 1.5,
        unitPrice: 150,
        discountAmount: 0,
        finalPrice: 150,
        lineTotal: 225,
        taxRate: 0,
        taxAmount: 0,
        costPrice: 110,
        batchId: 'b_601'
      },
      {
        productId: 'prod_7',
        productName: 'Irish Potatoes (Waru)',
        barcode: '6161107890123',
        unit: 'kg',
        isWeighed: true,
        quantity: 3.0,
        unitPrice: 90,
        discountAmount: 0,
        finalPrice: 90,
        lineTotal: 270,
        taxRate: 0,
        taxAmount: 0,
        costPrice: 65,
        batchId: 'b_701'
      }
    ],
    subtotal: 711,
    totalDiscount: 0,
    taxTotal: 0,
    grandTotal: 711,
    totalCost: 513, // (1.8*85=153) + (1.5*110=165) + (3*65=195) = 513
    grossProfit: 198,
    paymentMethod: 'mpesa',
    paymentDetails: { mpesaPhone: '0712334455', mpesaReceipt: 'SKF81033OP' },
    cashierId: 'emp_3',
    cashierName: 'Kevin Kipkorir',
    status: 'completed',
    isCredit: false,
    creditSettled: true,
    syncStatus: 'synced',
    kraETimsNumber: 'KRA-ETIMS-2026-0083'
  },
  // Yesterday's sales
  {
    id: 'sale_90',
    receiptNumber: 'MBK-20261025-014',
    date: '2026-10-25T14:20:00Z',
    items: [
      {
        productId: 'prod_4',
        productName: 'Pure Pishori Mwea Rice (Loose)',
        barcode: '6161104567890',
        unit: 'kg',
        isWeighed: true,
        quantity: 5.0,
        unitPrice: 240,
        discountAmount: 0,
        finalPrice: 240,
        lineTotal: 1200,
        taxRate: 0,
        taxAmount: 0,
        costPrice: 195,
        batchId: 'b_401'
      },
      {
        productId: 'prod_9',
        productName: 'Rina Salad Vegetable Oil 1L',
        barcode: '6161109012345',
        unit: 'piece',
        isWeighed: false,
        quantity: 2,
        unitPrice: 320,
        discountAmount: 0,
        finalPrice: 320,
        lineTotal: 640,
        taxRate: 0.16,
        taxAmount: 88.28,
        costPrice: 275,
        batchId: 'b_901'
      }
    ],
    subtotal: 1840,
    totalDiscount: 0,
    taxTotal: 88.28,
    grandTotal: 1840,
    totalCost: 1525, // (5*195=975) + (2*275=550) = 1525
    grossProfit: 315,
    paymentMethod: 'mpesa',
    paymentDetails: { mpesaPhone: '0733556677', mpesaReceipt: 'SJE76541ZZ' },
    customerId: 'cust_3',
    customerName: 'Mwalimu Peter Kamau',
    cashierId: 'emp_2',
    cashierName: 'Mary Mwangi',
    status: 'completed',
    isCredit: false,
    creditSettled: true,
    syncStatus: 'synced',
    kraETimsNumber: 'KRA-ETIMS-2026-0062'
  },
  {
    id: 'sale_91',
    receiptNumber: 'MBK-20261025-015',
    date: '2026-10-25T17:40:00Z',
    items: [
      {
        productId: 'prod_2',
        productName: 'Pembe Maize Meal 2kg',
        barcode: '6161102345678',
        unit: 'piece',
        isWeighed: false,
        quantity: 3,
        unitPrice: 190,
        discountAmount: 0,
        finalPrice: 190,
        lineTotal: 570,
        taxRate: 0,
        taxAmount: 0,
        costPrice: 162,
        batchId: 'b_201'
      },
      {
        productId: 'prod_13',
        productName: 'Sunlight Washing Powder 500g',
        barcode: '6161113456789',
        unit: 'piece',
        isWeighed: false,
        quantity: 1,
        unitPrice: 175,
        discountAmount: 0,
        finalPrice: 175,
        lineTotal: 175,
        taxRate: 0.16,
        taxAmount: 24.14,
        costPrice: 142,
        batchId: 'b_1301'
      }
    ],
    subtotal: 745,
    totalDiscount: 0,
    taxTotal: 24.14,
    grandTotal: 745,
    totalCost: 628, // (3*162=486) + 142 = 628
    grossProfit: 117,
    paymentMethod: 'credit', // Sold on Mkopo!
    paymentDetails: {},
    customerId: 'cust_1',
    customerName: 'Mama Jane Wairimu',
    cashierId: 'emp_3',
    cashierName: 'Kevin Kipkorir',
    status: 'completed',
    isCredit: true,
    creditSettled: false,
    syncStatus: 'synced',
    kraETimsNumber: 'KRA-ETIMS-2026-0063'
  },
  // Earlier in week / month sales
  {
    id: 'sale_80',
    receiptNumber: 'MBK-20261023-009',
    date: '2026-10-23T11:10:00Z',
    items: [
      {
        productId: 'prod_1',
        productName: 'Jogoo Maize Meal 2kg',
        barcode: '6161101234567',
        unit: 'piece',
        isWeighed: false,
        quantity: 12, // Wholesale / bulk purchase
        unitPrice: 195,
        discountAmount: 5, // line discount: KSh 5 off per piece
        finalPrice: 190,
        lineTotal: 2280,
        taxRate: 0,
        taxAmount: 0,
        costPrice: 165,
        batchId: 'b_101'
      },
      {
        productId: 'prod_3',
        productName: 'Sugar Loose (White) 1kg',
        barcode: '6161103456789',
        unit: 'kg',
        isWeighed: true,
        quantity: 10,
        unitPrice: 180,
        discountAmount: 0,
        finalPrice: 180,
        lineTotal: 1800,
        taxRate: 0.16,
        taxAmount: 248.28,
        costPrice: 150,
        batchId: 'b_301'
      }
    ],
    subtotal: 4140,
    totalDiscount: 60,
    taxTotal: 248.28,
    grandTotal: 4080,
    totalCost: 3480, // (12*165=1980) + (10*150=1500) = 3480
    grossProfit: 600,
    paymentMethod: 'split',
    paymentDetails: {
      splits: [
        { method: 'cash', amount: 2000 },
        { method: 'mpesa', amount: 2080, reference: 'SJA381920L' }
      ]
    },
    cashierId: 'emp_2',
    cashierName: 'Mary Mwangi',
    status: 'completed',
    isCredit: false,
    creditSettled: true,
    syncStatus: 'synced',
    kraETimsNumber: 'KRA-ETIMS-2026-0044'
  }
];

export const INITIAL_SHIFTS: Shift[] = [
  {
    id: 'shift_today',
    cashierId: 'emp_3',
    cashierName: 'Kevin Kipkorir',
    startTime: '2026-10-26T07:30:00Z',
    openingFloat: 3000,
    cashSales: 520,
    mpesaSales: 1481,
    cardSales: 0,
    creditSales: 0,
    totalSales: 2001,
    cashIn: 0,
    cashOut: 0,
    expectedCash: 3520, // 3000 float + 520 cash sales
    status: 'open'
  }
];
