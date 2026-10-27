import React from 'react';
import { WifiOff, RefreshCw, CheckCircle2 } from 'lucide-react';
import { useStore } from '../../context/StoreContext';

export const OfflineBanner: React.FC = () => {
  const { isOnline, syncPendingCount, syncOfflineQueue } = useStore();
  const [syncing, setSyncing] = React.useState(false);
  const [syncedCount, setSyncedCount] = React.useState<number | null>(null);

  const handleSync = async () => {
    setSyncing(true);
    try {
      const count = await syncOfflineQueue();
      setSyncedCount(count);
      setTimeout(() => setSyncedCount(null), 3000);
    } finally {
      setSyncing(false);
    }
  };

  if (isOnline && syncPendingCount === 0 && syncedCount === null) {
    return null;
  }

  return (
    <aside aria-label="Network status and synchronization" className="w-full bg-amber-500 text-slate-900 px-4 py-1.5 text-xs font-medium flex items-center justify-between border-b border-amber-600 shadow-xs">
      <div className="flex items-center gap-2">
        {!isOnline ? (
          <>
            <WifiOff className="w-4 h-4 text-slate-950 shrink-0" />
            <span>
              <strong>Offline Mode Active:</strong> Sales are safely queued in local storage. System will auto-sync when network returns.
            </span>
          </>
        ) : syncPendingCount > 0 ? (
          <>
            <RefreshCw className="w-4 h-4 text-slate-950 shrink-0 animate-spin" />
            <span>
              <strong>Online:</strong> {syncPendingCount} pending offline transactions ready to sync with Supabase cloud.
            </span>
          </>
        ) : (
          <>
            <CheckCircle2 className="w-4 h-4 text-emerald-950 shrink-0" />
            <span>Successfully synced all offline transactions!</span>
          </>
        )}
      </div>

      {isOnline && syncPendingCount > 0 && (
        <button
          onClick={handleSync}
          disabled={syncing}
          className="ml-4 px-2.5 py-1 bg-slate-950 text-white rounded text-2xs uppercase tracking-wider font-semibold hover:bg-slate-800 disabled:opacity-50 transition-colors"
        >
          {syncing ? 'Syncing...' : 'Sync Now'}
        </button>
      )}
    </aside>
  );
};
