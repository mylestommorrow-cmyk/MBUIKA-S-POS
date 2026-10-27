import React, { useState } from 'react';
import { ShoppingCart, Package, TrendingUp, BookOpen, Truck, Receipt, Settings, User } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { PWAInstallButton } from './pwa/PWAInstallButton';
import { PinLoginModal } from './employees/PinLoginModal';

export type NavTab = 'checkout' | 'inventory' | 'reports' | 'credit' | 'suppliers' | 'expenses' | 'settings';

interface NavbarProps {
  currentTab: NavTab;
  onTabChange: (tab: NavTab) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentTab, onTabChange }) => {
  const { currentUser, language, setLanguage, currentShift } = useStore();
  const [showPinModal, setShowPinModal] = useState(false);

  const t = {
    checkout: language === 'sw' ? 'Mauzo (POS)' : 'POS Checkout',
    inventory: language === 'sw' ? 'Bidhaa & Hisa' : 'Inventory & FEFO',
    reports: language === 'sw' ? 'Ripoti za Faida' : 'Owner Profit Reports',
    credit: language === 'sw' ? 'Daftari la Mkopo' : 'Credit (Mkopo)',
    suppliers: language === 'sw' ? 'Wasambazaji' : 'Suppliers',
    expenses: language === 'sw' ? 'Gharama' : 'Expenses',
    settings: language === 'sw' ? 'Mipangilio' : 'Settings'
  };

  const navItems: { id: NavTab; label: string; icon: React.ReactNode }[] = [
    { id: 'checkout', label: t.checkout, icon: <ShoppingCart className="w-3.5 h-3.5" /> },
    { id: 'inventory', label: t.inventory, icon: <Package className="w-3.5 h-3.5" /> },
    { id: 'reports', label: t.reports, icon: <TrendingUp className="w-3.5 h-3.5" /> },
    { id: 'credit', label: t.credit, icon: <BookOpen className="w-3.5 h-3.5" /> },
    { id: 'suppliers', label: t.suppliers, icon: <Truck className="w-3.5 h-3.5" /> },
    { id: 'expenses', label: t.expenses, icon: <Receipt className="w-3.5 h-3.5" /> },
    { id: 'settings', label: t.settings, icon: <Settings className="w-3.5 h-3.5" /> }
  ];

  return (
    <>
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200">
        <div className="flex items-center justify-between gap-4 px-4 py-2.5">
          {/* Zone 1: Single Brand Wordmark */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => onTabChange('checkout')}
              className="text-left group cursor-pointer focus:outline-hidden"
            >
              <span className="text-base font-extrabold tracking-tight text-emerald-800 uppercase block leading-tight">
                MBUIKAS GROCERY
              </span>
              <span className="text-2xs text-slate-500 font-medium tracking-normal block">
                Nairobi • KRA PIN: P051234567Z
              </span>
            </button>
          </div>

          {/* Zone 2: Navigation Links (single-line) */}
          <nav className="flex items-center gap-1 overflow-x-auto py-1 scrollbar-none">
            {navItems.map((item) => {
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onTabChange(item.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                    isActive
                      ? 'bg-slate-900 text-white shadow-xs font-semibold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Zone 3: Primary Action & User Cluster */}
          <div className="flex items-center gap-2.5 shrink-0">
            {/* Language Toggle (EN / SW) */}
            <div className="flex items-center rounded-md border border-slate-200 bg-slate-50 p-0.5">
              <button
                onClick={() => setLanguage('en')}
                className={`px-2 py-0.5 text-2xs font-bold rounded ${
                  language === 'en' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                EN
              </button>
              <button
                onClick={() => setLanguage('sw')}
                className={`px-2 py-0.5 text-2xs font-bold rounded ${
                  language === 'sw' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                SW
              </button>
            </div>

            {/* PWA Install Button */}
            <PWAInstallButton />

            {/* Active Cashier / Staff Switch Button */}
            <button
              onClick={() => setShowPinModal(true)}
              className="flex items-center gap-2 px-2.5 py-1 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-800 transition-colors"
              title="Click to switch active cashier"
            >
              <div className="w-6 h-6 rounded-full bg-emerald-700 text-white flex items-center justify-center text-2xs font-bold uppercase">
                {currentUser.name.charAt(0)}
              </div>
              <div className="text-left hidden sm:block">
                <p className="text-xs font-semibold leading-none text-slate-900">{currentUser.name}</p>
                <p className="text-2xs text-slate-500 uppercase tracking-wider leading-none mt-0.5">
                  {currentUser.role.replace('_', ' ')}
                  {currentShift ? ' • Shift Open' : ' • No Shift'}
                </p>
              </div>
              <User className="w-3.5 h-3.5 text-slate-400" />
            </button>
          </div>
        </div>
      </header>

      <PinLoginModal isOpen={showPinModal} onClose={() => setShowPinModal(false)} />
    </>
  );
};
