import React, { useState } from 'react';
import { StoreProvider } from './context/StoreContext';
import { Navbar, NavTab } from './components/Navbar';
import { OfflineBanner } from './components/pwa/OfflineBanner';
import { PosCheckout } from './components/checkout/PosCheckout';
import { InventoryManager } from './components/inventory/InventoryManager';
import { OwnerReports } from './components/reports/OwnerReports';
import { CreditBook } from './components/credit/CreditBook';
import { SupplierManager } from './components/suppliers/SupplierManager';
import { ExpenseManager } from './components/expenses/ExpenseManager';
import { SettingsManager } from './components/settings/SettingsManager';

export default function App() {
  const [currentTab, setCurrentTab] = useState<NavTab>('checkout');

  return (
    <StoreProvider>
      <div className="min-h-screen flex flex-col bg-slate-100 font-sans selection:bg-emerald-100 selection:text-emerald-900 text-slate-900 antialiased">
        {/* Offline & Sync Notification Banner */}
        <OfflineBanner />

        {/* Global Navigation Bar */}
        <Navbar currentTab={currentTab} onTabChange={setCurrentTab} />

        {/* Main Work Area by Tab */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {currentTab === 'checkout' && <PosCheckout />}
          {currentTab === 'inventory' && <InventoryManager />}
          {currentTab === 'reports' && <OwnerReports />}
          {currentTab === 'credit' && <CreditBook />}
          {currentTab === 'suppliers' && <SupplierManager />}
          {currentTab === 'expenses' && <ExpenseManager />}
          {currentTab === 'settings' && <SettingsManager />}
        </main>
      </div>
    </StoreProvider>
  );
}
