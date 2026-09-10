import React from 'react';
import { useApp } from '../context/AppContext';
import { formatDateToWords, getTodayIsoString } from '../utils/formatters';
import { Search, Menu, X, Cloud, RefreshCw, Database } from 'lucide-react';
import { PWAInstallButton } from './PWAInstallButton';

interface HeaderProps {
  onToggleMobileMenu: () => void;
  isMobileMenuOpen: boolean;
}

export const Header: React.FC<HeaderProps> = ({ onToggleMobileMenu, isMobileMenuOpen }) => {
  const {
    currentView,
    globalSearch,
    setGlobalSearch,
    isSupabaseConfigured,
    supabaseSyncStatus,
    setCurrentView,
    setActiveSettingsSection,
  } = useApp();

  const searchViews = ['borrowers', 'capital', 'collectors', 'cashouts', 'ledger', 'past-ledger', 'activity-log'];
  const showSearch = searchViews.includes(currentView);

  const getSearchPlaceholder = () => {
    switch (currentView) {
      case 'borrowers':
        return 'Search borrowers by name, contact, address...';
      case 'capital':
        return 'Search capital sources...';
      case 'collectors':
        return 'Search collectors by name, contact...';
      case 'cashouts':
        return 'Search collector cashouts by name or notes...';
      case 'ledger':
      case 'past-ledger':
        return 'Search ledger accounts by borrower name...';
      case 'activity-log':
        return 'Search activities by title, borrower, notes...';
      default:
        return 'Search records...';
    }
  };

  const todayStr = getTodayIsoString();

  return (
    <header className="print-hide border-b border-slate-200/80 dark:border-slate-800/80 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md px-6 py-3.5 sticky top-0 z-20 transition-colors">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Mobile Toggle & View Title/Context */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={onToggleMobileMenu}
              className="md:hidden p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              aria-label="Toggle Navigation"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Portfolio Status:</span>
                <span className="text-xs text-slate-900 dark:text-white font-semibold">Active Lending</span>
              </div>
              <p className="text-[11px] text-slate-400 dark:text-slate-500">
                as of {formatDateToWords(todayStr)}
              </p>
            </div>
          </div>

          {/* Right Status Pill for Mobile */}
          <div className="md:hidden flex items-center gap-2">
            <PWAInstallButton />
            <button
              onClick={() => {
                setCurrentView('settings');
                setActiveSettingsSection('backup');
              }}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold transition-all cursor-pointer ${
                supabaseSyncStatus.connected
                  ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                  : supabaseSyncStatus.syncing
                  ? 'bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400'
                  : 'bg-slate-200/60 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400'
              }`}
            >
              {supabaseSyncStatus.syncing ? (
                <>
                  <RefreshCw className="w-3 h-3 animate-spin text-indigo-500" />
                  <span>Syncing</span>
                </>
              ) : supabaseSyncStatus.connected ? (
                <>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  <Cloud className="w-3 h-3" />
                  <span>Supabase</span>
                </>
              ) : (
                <>
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                  <span>Local DB</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Global Search & Connection Status */}
        <div className="flex items-center gap-3 flex-1 md:justify-end">
          <div className="hidden md:block">
            <PWAInstallButton />
          </div>
          {showSearch && (
            <div className="relative flex-1 max-w-md">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={globalSearch}
                onChange={(e) => setGlobalSearch(e.target.value)}
                placeholder={getSearchPlaceholder()}
                className="w-full bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-8 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              />
              {globalSearch && (
                <button
                  onClick={() => setGlobalSearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-white text-xs"
                >
                  ✕
                </button>
              )}
            </div>
          )}

          {/* Desktop Connection Status Pill */}
          <button
            onClick={() => {
              setCurrentView('settings');
              setActiveSettingsSection('backup');
            }}
            title={supabaseSyncStatus.message || (supabaseSyncStatus.connected ? 'Auto-saved to Supabase Cloud' : 'Data auto-saving enabled')}
            className={`hidden md:flex items-center gap-2 text-xs px-3.5 py-1.5 rounded-full border transition-all cursor-pointer active:scale-[0.98] ${
              supabaseSyncStatus.connected
                ? 'bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 border-emerald-200 dark:border-emerald-800/60 text-emerald-700 dark:text-emerald-300'
                : supabaseSyncStatus.syncing
                ? 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800/60 text-indigo-700 dark:text-indigo-300'
                : isSupabaseConfigured
                ? 'bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/40 border-amber-200 dark:border-amber-800/60 text-amber-700 dark:text-amber-300'
                : 'bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700/80 border-slate-200 dark:border-slate-700/60 text-slate-700 dark:text-slate-300'
            }`}
          >
            {supabaseSyncStatus.syncing ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 text-indigo-500 animate-spin" />
                <span className="font-semibold text-[11px]">Auto-saving to Supabase...</span>
              </>
            ) : supabaseSyncStatus.connected ? (
              <>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <Cloud className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span className="font-semibold text-[11px]">Auto-saved to Cloud</span>
              </>
            ) : isSupabaseConfigured ? (
              <>
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                <Cloud className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                <span className="font-semibold text-[11px]">Connecting Supabase...</span>
              </>
            ) : (
              <>
                <span className="w-2 h-2 rounded-full bg-slate-400"></span>
                <Database className="w-3.5 h-3.5 text-slate-500" />
                <span className="font-medium text-[11px]">Local Storage</span>
              </>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
