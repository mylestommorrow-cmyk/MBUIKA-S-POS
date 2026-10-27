-- =========================================================================
-- MBUIKAS GROCERY - POS & RETAIL MANAGEMENT SYSTEM
-- PostgreSQL Database Schema with Row Level Security (RLS),
-- FEFO Stock Deduction Functions, Profit Reporting Views, and Seed Data
-- =========================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. EMPLOYEES & PROFILES TABLE
CREATE TABLE IF NOT EXISTS employees (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    name VARCHAR(100) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('owner', 'manager', 'cashier', 'stock_clerk')),
    pin_hash VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. PRODUCT CATEGORIES TABLE
CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    name_swahili VARCHAR(100),
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. SUPPLIERS TABLE
CREATE TABLE IF NOT EXISTS suppliers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(150) NOT NULL,
    contact_person VARCHAR(100),
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(100),
    amount_owed NUMERIC(12, 2) DEFAULT 0.00,
    terms TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. PRODUCTS TABLE
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    barcode VARCHAR(64) UNIQUE,
    sku VARCHAR(64) UNIQUE NOT NULL,
    name VARCHAR(150) NOT NULL,
    name_swahili VARCHAR(150),
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    unit VARCHAR(20) NOT NULL DEFAULT 'piece' CHECK (unit IN ('piece', 'kg', 'g', 'litre', 'packet', 'dozen', 'carton', 'bag_50kg', 'bag_25kg')),
    is_weighed BOOLEAN DEFAULT FALSE,
    selling_price NUMERIC(10, 2) NOT NULL,
    cost_price NUMERIC(10, 2) NOT NULL,
    current_stock NUMERIC(10, 3) NOT NULL DEFAULT 0.000,
    min_stock_level NUMERIC(10, 3) NOT NULL DEFAULT 5.000,
    tax_type VARCHAR(20) NOT NULL DEFAULT 'vat16' CHECK (tax_type IN ('vat16', 'zero_rated', 'exempt')),
    tax_rate NUMERIC(4, 2) NOT NULL DEFAULT 0.16,
    is_perishable BOOLEAN DEFAULT FALSE,
    is_quick_sale BOOLEAN DEFAULT FALSE,
    image_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. PRODUCT BATCHES (FOR FEFO EXPIRY AND ACCURATE COGS)
CREATE TABLE IF NOT EXISTS product_batches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    batch_number VARCHAR(64) NOT NULL,
    quantity_received NUMERIC(10, 3) NOT NULL,
    quantity_remaining NUMERIC(10, 3) NOT NULL CHECK (quantity_remaining >= 0),
    cost_price NUMERIC(10, 2) NOT NULL,
    received_date DATE NOT NULL DEFAULT CURRENT_DATE,
    expiry_date DATE NOT NULL,
    supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. CUSTOMERS & MKOPO (DEBT BOOK)
CREATE TABLE IF NOT EXISTS customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(120) NOT NULL,
    phone VARCHAR(20) NOT NULL UNIQUE,
    credit_limit NUMERIC(10, 2) NOT NULL DEFAULT 5000.00,
    current_credit NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    loyalty_points INTEGER DEFAULT 0,
    total_spent NUMERIC(12, 2) DEFAULT 0.00,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. SALES / TRANSACTIONS
CREATE TABLE IF NOT EXISTS sales (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    receipt_number VARCHAR(50) UNIQUE NOT NULL,
    date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    subtotal NUMERIC(12, 2) NOT NULL,
    total_discount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    tax_total NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    grand_total NUMERIC(12, 2) NOT NULL,
    total_cost NUMERIC(12, 2) NOT NULL DEFAULT 0.00, -- Accurate COGS
    gross_profit NUMERIC(12, 2) GENERATED ALWAYS AS (grand_total - total_cost) STORED,
    payment_method VARCHAR(20) NOT NULL CHECK (payment_method IN ('cash', 'mpesa', 'card', 'credit', 'split')),
    cash_tendered NUMERIC(10, 2),
    change_given NUMERIC(10, 2),
    mpesa_phone VARCHAR(20),
    mpesa_receipt VARCHAR(64),
    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    cashier_id UUID REFERENCES employees(id) ON DELETE SET NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'completed' CHECK (status IN ('completed', 'refunded', 'voided')),
    void_reason TEXT,
    is_credit BOOLEAN DEFAULT FALSE,
    credit_settled BOOLEAN DEFAULT FALSE,
    kra_etims_number VARCHAR(100),
    sync_status VARCHAR(20) DEFAULT 'synced',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. SALE ITEMS TABLE
CREATE TABLE IF NOT EXISTS sale_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sale_id UUID NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    batch_id UUID REFERENCES product_batches(id) ON DELETE SET NULL,
    quantity NUMERIC(10, 3) NOT NULL,
    unit_price NUMERIC(10, 2) NOT NULL,
    discount_amount NUMERIC(10, 2) DEFAULT 0.00,
    final_price NUMERIC(10, 2) NOT NULL,
    line_total NUMERIC(10, 2) NOT NULL,
    cost_price NUMERIC(10, 2) NOT NULL, -- Captured batch cost at sale time
    line_cost NUMERIC(10, 2) NOT NULL,  -- quantity * cost_price
    tax_rate NUMERIC(4, 2) NOT NULL DEFAULT 0.16,
    tax_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00
);

-- 9. CUSTOMER CREDIT REPAYMENTS
CREATE TABLE IF NOT EXISTS credit_repayments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    amount NUMERIC(10, 2) NOT NULL,
    payment_method VARCHAR(20) NOT NULL CHECK (payment_method IN ('cash', 'mpesa')),
    mpesa_receipt VARCHAR(64),
    received_by UUID REFERENCES employees(id),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. WASTAGE & SPOILAGE RECORDING
CREATE TABLE IF NOT EXISTS wastage_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    batch_id UUID REFERENCES product_batches(id) ON DELETE SET NULL,
    quantity NUMERIC(10, 3) NOT NULL,
    cost_price NUMERIC(10, 2) NOT NULL,
    total_loss NUMERIC(10, 2) NOT NULL,
    reason VARCHAR(30) NOT NULL CHECK (reason IN ('expired', 'damaged', 'spoiled_rotten', 'theft', 'spill_shrinkage')),
    recorded_by UUID REFERENCES employees(id),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. EXPENSES TABLE (CRITICAL FOR TRUE NET PROFIT)
CREATE TABLE IF NOT EXISTS expenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    category VARCHAR(40) NOT NULL CHECK (category IN (
        'rent', 'electricity', 'water', 'salaries', 'transport', 
        'licences_council', 'packaging', 'maintenance', 'others'
    )),
    description TEXT NOT NULL,
    amount NUMERIC(10, 2) NOT NULL,
    payment_method VARCHAR(20) NOT NULL DEFAULT 'cash' CHECK (payment_method IN ('cash', 'mpesa', 'bank')),
    receipt_ref VARCHAR(100),
    recorded_by UUID REFERENCES employees(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. CASHIER SHIFTS & DRAWER RECONCILIATION (Z-REPORT)
CREATE TABLE IF NOT EXISTS shifts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cashier_id UUID NOT NULL REFERENCES employees(id),
    start_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    end_time TIMESTAMPTZ,
    opening_float NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    closing_float NUMERIC(10, 2),
    cash_sales NUMERIC(10, 2) DEFAULT 0.00,
    mpesa_sales NUMERIC(10, 2) DEFAULT 0.00,
    card_sales NUMERIC(10, 2) DEFAULT 0.00,
    credit_sales NUMERIC(10, 2) DEFAULT 0.00,
    total_sales NUMERIC(10, 2) DEFAULT 0.00,
    cash_in NUMERIC(10, 2) DEFAULT 0.00,
    cash_out NUMERIC(10, 2) DEFAULT 0.00,
    expected_cash NUMERIC(10, 2) DEFAULT 0.00,
    counted_cash NUMERIC(10, 2),
    variance NUMERIC(10, 2),
    notes TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed'))
);

-- 13. IMMUTABLE AUDIT LOGS
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    user_id UUID REFERENCES employees(id),
    action VARCHAR(50) NOT NULL,
    details JSONB NOT NULL,
    authorized_by UUID REFERENCES employees(id)
);

-- =========================================================================
-- INDEXES FOR FAST RETAIL QUERY PERFORMANCE
-- =========================================================================
CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode);
CREATE INDEX IF NOT EXISTS idx_products_name ON products(name);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_batches_expiry ON product_batches(expiry_date ASC);
CREATE INDEX IF NOT EXISTS idx_sales_date ON sales(date DESC);
CREATE INDEX IF NOT EXISTS idx_sales_receipt ON sales(receipt_number);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(date DESC);
CREATE INDEX IF NOT EXISTS idx_wastage_date ON wastage_records(date DESC);

-- =========================================================================
-- BUSINESS LOGIC: FEFO STOCK DEDUCTION FUNCTION & TRIGGER
-- Deducts stock starting with the batch expiring earliest
-- =========================================================================
CREATE OR REPLACE FUNCTION deduct_stock_fefo(
    p_product_id UUID,
    p_quantity NUMERIC
) RETURNS TABLE (
    batch_id UUID,
    deducted_qty NUMERIC,
    cost_price NUMERIC
) AS $$
DECLARE
    v_qty_needed NUMERIC := p_quantity;
    r_batch RECORD;
    v_deduct NUMERIC;
BEGIN
    FOR r_batch IN 
        SELECT id, quantity_remaining, cost_price
        FROM product_batches
        WHERE product_id = p_product_id AND quantity_remaining > 0
        ORDER BY expiry_date ASC
    LOOP
        IF v_qty_needed <= 0 THEN
            EXIT;
        END IF;

        IF r_batch.quantity_remaining >= v_qty_needed THEN
            v_deduct := v_qty_needed;
        ELSE
            v_deduct := r_batch.quantity_remaining;
        END IF;

        UPDATE product_batches
        SET quantity_remaining = quantity_remaining - v_deduct
        WHERE id = r_batch.id;

        v_qty_needed := v_qty_needed - v_deduct;

        batch_id := r_batch.id;
        deducted_qty := v_deduct;
        cost_price := r_batch.cost_price;
        RETURN NEXT;
    END LOOP;

    -- Update total product stock
    UPDATE products
    SET current_stock = current_stock - p_quantity
    WHERE id = p_product_id;
END;
$$ LANGUAGE plpgsql;

-- =========================================================================
-- OWNER PROFIT REPORTING VIEWS
-- Formulas implemented:
-- Revenue = total sales - returns - discounts
-- COGS = cost of goods sold
-- Gross Profit = Revenue - COGS, Gross Margin %
-- Net Profit = Gross Profit - Expenses - Spoilage Losses
-- =========================================================================

CREATE OR REPLACE VIEW view_daily_profit_summary AS
WITH daily_sales AS (
    SELECT 
        DATE(date) as sale_date,
        COUNT(id) as total_transactions,
        SUM(grand_total) as revenue,
        SUM(total_cost) as cogs,
        SUM(gross_profit) as gross_profit,
        SUM(CASE WHEN payment_method = 'cash' THEN grand_total ELSE 0 END) as cash_collected,
        SUM(CASE WHEN payment_method = 'mpesa' THEN grand_total ELSE 0 END) as mpesa_collected,
        SUM(CASE WHEN is_credit THEN grand_total ELSE 0 END) as credit_issued
    FROM sales
    WHERE status = 'completed'
    GROUP BY DATE(date)
),
daily_expenses AS (
    SELECT 
        date as expense_date,
        SUM(amount) as total_expenses
    FROM expenses
    GROUP BY date
),
daily_wastage AS (
    SELECT 
        DATE(date) as wastage_date,
        SUM(total_loss) as total_wastage
    FROM wastage_records
    GROUP BY DATE(date)
)
SELECT 
    s.sale_date,
    s.total_transactions,
    s.revenue,
    s.cogs,
    s.gross_profit,
    ROUND((s.gross_profit / NULLIF(s.revenue, 0)) * 100, 2) as gross_margin_percent,
    COALESCE(e.total_expenses, 0) as total_expenses,
    COALESCE(w.total_wastage, 0) as total_wastage_loss,
    (s.gross_profit - COALESCE(e.total_expenses, 0) - COALESCE(w.total_wastage, 0)) as net_profit,
    ROUND(((s.gross_profit - COALESCE(e.total_expenses, 0) - COALESCE(w.total_wastage, 0)) / NULLIF(s.revenue, 0)) * 100, 2) as net_margin_percent,
    s.cash_collected,
    s.mpesa_collected,
    s.credit_issued
FROM daily_sales s
LEFT JOIN daily_expenses e ON s.sale_date = e.expense_date
LEFT JOIN daily_wastage w ON s.sale_date = w.wastage_date
ORDER BY s.sale_date DESC;

-- =========================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =========================================================================
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Anonymous read for POS catalogue, restricted writes
CREATE POLICY "Public products view" ON products FOR SELECT USING (true);
CREATE POLICY "Authorized product edits" ON products FOR ALL USING (
    EXISTS (SELECT 1 FROM employees WHERE user_id = auth.uid() AND role IN ('owner', 'manager'))
);

CREATE POLICY "Cashiers create sales" ON sales FOR INSERT WITH CHECK (true);
CREATE POLICY "View sales" ON sales FOR SELECT USING (true);
CREATE POLICY "Owners managers update sales" ON sales FOR UPDATE USING (
    EXISTS (SELECT 1 FROM employees WHERE user_id = auth.uid() AND role IN ('owner', 'manager'))
);

CREATE POLICY "Owner manager view expenses" ON expenses FOR ALL USING (
    EXISTS (SELECT 1 FROM employees WHERE user_id = auth.uid() AND role IN ('owner', 'manager'))
);

-- =========================================================================
-- SEED DATA: AUTHENTIC KENYAN GROCERY CATALOG & CATEGORIES
-- =========================================================================
INSERT INTO categories (id, name, name_swahili, description) VALUES
    ('c1111111-1111-1111-1111-111111111111', 'Flours & Grains', 'Unga na Nafaka', 'Maize flour, wheat flour, and grain staples'),
    ('c2222222-2222-2222-2222-222222222222', 'Fresh Produce', 'Mboga na Matunda', 'Loose vegetables, onions, potatoes, sukuma wiki'),
    ('c3333333-3333-3333-3333-333333333333', 'Dairy & Milk', 'Maziwa', 'Fresh pouch milk, mala, yogurt, butter'),
    ('c4444444-4444-4444-4444-444444444444', 'Cooking Oils & Fats', 'Mafuta ya Kupikia', 'Salad oil, cooking fat, liquid oil'),
    ('c5555555-5555-5555-5555-555555555555', 'Sugar & Sweeteners', 'Sukari', 'White sugar, brown sugar'),
    ('c6666666-6666-6666-6666-666666666666', 'Household & Soaps', 'Sabuni na Usafi', 'Washing bars, detergent powder, dishwash')
ON CONFLICT (name) DO NOTHING;

INSERT INTO suppliers (id, name, contact_person, phone, amount_owed) VALUES
    ('s1111111-1111-1111-1111-111111111111', 'Unga Farm Care Ltd', 'Kamau Njoroge', '0722100200', 14500.00),
    ('s2222222-2222-2222-2222-222222222222', 'Brookside Dairy Distributors', 'Grace Wanjiku', '0733400500', 8200.00),
    ('s3333333-3333-3333-3333-333333333333', 'Wakulima Market Sacco', 'Moses Odhiambo', '0711900800', 0.00),
    ('s4444444-4444-4444-4444-444444444444', 'Bidco Africa Ltd', 'Faith Chebet', '0720333444', 21000.00)
ON CONFLICT DO NOTHING;

INSERT INTO employees (id, name, role, pin_hash, phone) VALUES
    ('e1111111-1111-1111-1111-111111111111', 'John Mbuika (Owner)', 'owner', '1234', '0722000001'),
    ('e2222222-2222-2222-2222-222222222222', 'Mary Mwangi (Manager)', 'manager', '4321', '0722000002'),
    ('e3333333-3333-3333-3333-333333333333', 'Kevin Kipkorir (Cashier)', 'cashier', '1111', '0722000003'),
    ('e4444444-4444-4444-4444-444444444444', 'Amina Hassan (Stock Clerk)', 'stock_clerk', '2222', '0722000004')
ON CONFLICT DO NOTHING;
