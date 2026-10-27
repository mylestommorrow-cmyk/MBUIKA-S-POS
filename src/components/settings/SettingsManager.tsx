import React, { useState } from 'react';
import {
  Settings,
  Store,
  Smartphone,
  Database,
  Printer,
  ShieldCheck,
  RefreshCw,
  Download,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { StoreSettings } from '../../types/grocery';

export const SettingsManager: React.FC = () => {
  const { settings, updateSettings, resetAllData, currentShift, startShift } = useStore();
  const [formData, setFormData] = useState<StoreSettings>({ ...settings });
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [openingFloatInput, setOpeningFloatInput] = useState('3000');
  const [showShiftStartModal, setShowShiftStartModal] = useState(false);

  const handleChange = (field: keyof StoreSettings, val: any) => {
    setFormData((prev) => ({ ...prev, [field]: val }));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings(formData);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleDownloadSchema = () => {
    fetch('/supabase/schema.sql')
      .then((res) => res.text())
      .then((sql) => {
        const blob = new Blob([sql], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'mbuikas_supabase_schema.sql';
        a.click();
      })
      .catch(() => {
        alert('Downloading Supabase schema from /supabase/schema.sql');
      });
  };

  const handleStartShiftSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const float = parseFloat(openingFloatInput) || 0;
    startShift(float);
    setShowShiftStartModal(false);
  };

  return (
    <div className="flex-1 flex flex-col p-4 md:p-6 bg-slate-100 overflow-y-auto space-y-6">
      {/* 1. Header */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <span className="text-2xs text-emerald-700 font-mono font-bold uppercase tracking-wider block">
            System Preferences & Integrations
          </span>
          <h1 className="text-lg md:text-xl font-extrabold text-slate-900 tracking-tight">
            Store Settings & Cloud Configuration
          </h1>
          <p className="text-2xs text-slate-500 mt-0.5">
            Configure KRA eTIMS, Daraja Lipa na M-Pesa credentials, thermal printer type, and Supabase database.
          </p>
        </div>

        {!currentShift ? (
          <button
            type="button"
            onClick={() => setShowShiftStartModal(true)}
            className="px-4 py-2 bg-emerald-700 text-white rounded-lg text-xs font-bold hover:bg-emerald-800 shadow-2xs"
          >
            + Open Shift / Set Drawer Float
          </button>
        ) : (
          <div className="px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-lg text-2xs text-emerald-800 font-mono font-semibold">
            Shift Active ({currentShift.cashierName}) • Float: KSh {currentShift.openingFloat.toLocaleString()}
          </div>
        )}
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Section 1: Store & KRA Details */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100 text-slate-900 font-bold text-sm">
            <Store className="w-4 h-4 text-emerald-700" />
            <span>Store Profile & KRA Tax Compliance</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-2xs font-bold text-slate-600 uppercase mb-1">Store Name</label>
              <input
                type="text"
                value={formData.storeName}
                onChange={(e) => handleChange('storeName', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg font-bold"
              />
            </div>
            <div>
              <label className="block text-2xs font-bold text-slate-600 uppercase mb-1">Tagline</label>
              <input
                type="text"
                value={formData.tagline}
                onChange={(e) => handleChange('tagline', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-2xs font-bold text-slate-600 uppercase mb-1">Address / Branch</label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => handleChange('address', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-2xs font-bold text-slate-600 uppercase mb-1">Phone / WhatsApp</label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono"
              />
            </div>
            <div>
              <label className="block text-2xs font-bold text-slate-600 uppercase mb-1">KRA PIN</label>
              <input
                type="text"
                value={formData.kraPin}
                onChange={(e) => handleChange('kraPin', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono font-bold uppercase"
              />
            </div>
            <div>
              <label className="block text-2xs font-bold text-slate-600 uppercase mb-1">eTIMS Device Serial Number</label>
              <input
                type="text"
                value={formData.etimsDeviceNumber}
                onChange={(e) => handleChange('etimsDeviceNumber', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Daraja M-Pesa Integration */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100 text-slate-900 font-bold text-sm">
            <Smartphone className="w-4 h-4 text-emerald-700" />
            <span>Safaricom Daraja M-Pesa STK Push Credentials</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-2xs font-bold text-slate-600 uppercase mb-1">M-Pesa Shortcode (Till / Paybill)</label>
              <input
                type="text"
                value={formData.mpesaShortcode}
                onChange={(e) => handleChange('mpesaShortcode', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono font-bold"
              />
            </div>
            <div>
              <label className="block text-2xs font-bold text-slate-600 uppercase mb-1">Environment</label>
              <select
                value={formData.mpesaEnvironment}
                onChange={(e) => handleChange('mpesaEnvironment', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              >
                <option value="sandbox">Safaricom Daraja Sandbox (Testing)</option>
                <option value="production">Production Live Lipa na M-Pesa</option>
              </select>
            </div>
            <div>
              <label className="block text-2xs font-bold text-slate-600 uppercase mb-1">Consumer Key</label>
              <input
                type="password"
                value={formData.mpesaConsumerKey}
                onChange={(e) => handleChange('mpesaConsumerKey', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono text-2xs"
              />
            </div>
            <div>
              <label className="block text-2xs font-bold text-slate-600 uppercase mb-1">Consumer Secret</label>
              <input
                type="password"
                value={formData.mpesaConsumerSecret}
                onChange={(e) => handleChange('mpesaConsumerSecret', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono text-2xs"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Supabase Cloud Database */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
              <Database className="w-4 h-4 text-emerald-700" />
              <span>Supabase PostgreSQL Cloud Connector</span>
            </div>
            <button
              type="button"
              onClick={handleDownloadSchema}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-slate-300 bg-slate-50 hover:bg-slate-100 text-2xs font-bold text-slate-700"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download SQL Schema DDL</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-2xs font-bold text-slate-600 uppercase mb-1">Supabase Project URL</label>
              <input
                type="text"
                placeholder="https://xyzcompany.supabase.co"
                value={formData.supabaseUrl || ''}
                onChange={(e) => handleChange('supabaseUrl', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono text-xs"
              />
            </div>
            <div>
              <label className="block text-2xs font-bold text-slate-600 uppercase mb-1">Supabase Anon Key</label>
              <input
                type="password"
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6..."
                value={formData.supabaseAnonKey || ''}
                onChange={(e) => handleChange('supabaseAnonKey', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono text-xs"
              />
            </div>
          </div>
          <p className="text-3xs text-slate-500">
            Offline-first architecture caches all transactions locally. Connecting to Supabase syncs sales, FEFO batches, and RLS tables automatically.
          </p>
        </div>

        {/* Save Bar */}
        <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <button
            type="button"
            onClick={() => {
              if (window.confirm('Reset catalog and sales to default Kenyan grocery sample dataset?')) {
                resetAllData();
                alert('Reset complete!');
              }
            }}
            className="px-3.5 py-2 text-xs font-semibold text-red-700 hover:bg-red-50 rounded-lg transition-colors"
          >
            Reset to Sample Kenyan Catalog
          </button>

          <div className="flex items-center gap-3">
            {saveSuccess && (
              <span className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" />
                Settings Saved!
              </span>
            )}
            <button
              type="submit"
              className="px-6 py-2.5 bg-emerald-700 text-white rounded-lg text-xs font-bold hover:bg-emerald-800 transition-colors shadow-2xs"
            >
              Save Configuration
            </button>
          </div>
        </div>
      </form>

      {/* START SHIFT MODAL */}
      {showShiftStartModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="w-full max-w-sm rounded-xl bg-white shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-5 py-3.5 bg-emerald-800 text-white flex justify-between items-center">
              <h2 className="text-sm font-bold">Open Cashier Shift</h2>
              <button onClick={() => setShowShiftStartModal(false)} className="text-white">✕</button>
            </div>
            <form onSubmit={handleStartShiftSubmit} className="p-5 space-y-3">
              <div>
                <label className="block text-2xs font-bold text-slate-700 uppercase mb-1">
                  Cash Drawer Opening Float (KSh)
                </label>
                <input
                  type="number"
                  step="any"
                  required
                  value={openingFloatInput}
                  onChange={(e) => setOpeningFloatInput(e.target.value)}
                  placeholder="3000"
                  className="w-full px-3 py-2 text-base font-mono font-bold border border-slate-300 rounded-lg"
                  autoFocus
                />
                <span className="text-3xs text-slate-500 mt-1 block">
                  Coins and notes placed in drawer at the start of shift.
                </span>
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setShowShiftStartModal(false)}
                  className="px-4 py-2 border rounded-lg text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-700 text-white rounded-lg text-xs font-bold hover:bg-emerald-800"
                >
                  Start Shift
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
