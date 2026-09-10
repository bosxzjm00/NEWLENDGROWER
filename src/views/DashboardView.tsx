import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { formatCurrency, formatDateToWords, getTodayIsoString } from '../utils/formatters';
import {
  Coins,
  Send,
  AlertTriangle,
  Clock,
  TrendingUp,
  Percent,
  UserCheck,
  Award,
  Users,
  BookOpen,
  ArrowUpRight,
  ShieldAlert,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface DashboardViewProps {
  onOpenAddBorrower: () => void;
  onOpenAddCapital: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onOpenAddBorrower,
  onOpenAddCapital,
}) => {
  const { stats, setCurrentView, setSelectedLedgerBorrowerId, borrowers } = useApp();

  const [isOverviewMinimizedMobile, setIsOverviewMinimizedMobile] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem('overview_minimized_mobile');
      if (stored !== null) return stored === 'true';
      return typeof window !== 'undefined' ? window.innerWidth < 768 : false;
    } catch {
      return true;
    }
  });

  const toggleMobileOverview = () => {
    setIsOverviewMinimizedMobile((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('overview_minimized_mobile', String(next));
      } catch {
        // Ignore localStorage error
      }
      return next;
    });
  };

  const currentMonthName = new Date().toLocaleString('en-US', { month: 'short' }).toUpperCase();
  const todayStr = getTodayIsoString();

  const statCards = [
    {
      label: 'TOTAL CAPITAL',
      symbol: '₱',
      symbolColor: 'text-indigo-500',
      value: formatCurrency(stats.totalCapitalPool),
      subtext: 'Total injected funds',
      accentColor: 'text-slate-900 dark:text-white',
    },
    {
      label: 'CAPITAL DISBURSED',
      symbol: '₱',
      symbolColor: 'text-indigo-500',
      value: formatCurrency(stats.totalCapitalDisbursed),
      subtext: 'Borrowed by active clients',
      accentColor: 'text-slate-900 dark:text-white',
    },
    {
      label: 'TOTAL OUTSTANDING',
      symbol: '₱',
      symbolColor: 'text-indigo-500',
      value: formatCurrency(stats.totalOutstanding),
      subtext: 'Across all active loans',
      accentColor: 'text-indigo-600 dark:text-indigo-400',
    },
    {
      label: 'OVERDUE ACCOUNTS',
      symbol: '⚠️',
      symbolColor: 'text-rose-500',
      value: String(stats.overdueAccountsCount),
      subtext: 'Installments past due date',
      accentColor: 'text-rose-600 dark:text-rose-400',
    },
    {
      label: 'ACTIVE LOANS',
      symbol: '📦',
      symbolColor: 'text-indigo-500',
      value: String(stats.activeLoansCount),
      subtext: 'Currently being repaid',
      accentColor: 'text-slate-900 dark:text-white',
    },
    {
      label: `COLLECTED (${currentMonthName})`,
      symbol: '↗',
      symbolColor: 'text-emerald-500',
      value: formatCurrency(stats.totalCollected),
      subtext: 'Total payment receipts',
      accentColor: 'text-emerald-600 dark:text-emerald-400',
    },
    {
      label: 'TOTAL PROFIT',
      symbol: '↗',
      symbolColor: 'text-emerald-500',
      value: formatCurrency(stats.totalProfit),
      subtext: 'Contract interest expected',
      accentColor: 'text-emerald-600 dark:text-emerald-400',
    },
    {
      label: 'TOTAL INTEREST EARNED',
      symbol: '📈',
      symbolColor: 'text-emerald-500',
      value: formatCurrency(stats.totalInterestEarned),
      subtext: 'Owner + Collectors split',
      accentColor: 'text-emerald-600 dark:text-emerald-400',
    },
    {
      label: 'PORTFOLIO OWNER INTEREST',
      symbol: '◎',
      symbolColor: 'text-emerald-500',
      value: formatCurrency(stats.ownerInterest),
      subtext: "75% portfolio share",
      accentColor: 'text-emerald-600 dark:text-emerald-400',
    },
    {
      label: 'COLLECTORS PROFIT',
      symbol: '↗',
      symbolColor: 'text-indigo-500',
      value: formatCurrency(stats.collectorProfit),
      subtext: "25% commission pool",
      accentColor: 'text-indigo-600 dark:text-indigo-400',
    },
  ];

  return (
    <div id="view-dashboard" className="space-y-6 animate-in fade-in">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Portfolio Dashboard
          </h2>
          <div className="flex items-center gap-2.5 text-xs mt-1 text-slate-500 dark:text-slate-400">
            <span className="text-indigo-600 dark:text-indigo-400 font-medium">Lending health overview</span>
            <span className="text-slate-300 dark:text-slate-700">•</span>
            <span id="header-current-date">as of {formatDateToWords(todayStr)}</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onOpenAddBorrower}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs px-4 py-2.5 rounded-xl shadow-lg shadow-indigo-600/20 transition-all flex items-center gap-1.5 cursor-pointer active:scale-[0.98]"
          >
            <span>+</span>
            <span>Add Borrower</span>
          </button>
          <button
            onClick={onOpenAddCapital}
            className="bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 font-semibold text-xs px-4 py-2.5 rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer active:scale-[0.98]"
          >
            <span>+</span>
            <span>Add Capital</span>
          </button>
        </div>
      </div>

      {/* Mobile Minimize / Expand Toggle Bar */}
      <div className="flex md:hidden items-center justify-between px-1 py-0.5">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            System Overview
          </span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 font-semibold border border-indigo-200/60 dark:border-indigo-800/40">
            10 Metrics
          </span>
        </div>
        <button
          type="button"
          onClick={toggleMobileOverview}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium transition-all active:scale-95 cursor-pointer border border-slate-200/80 dark:border-slate-700/60 shadow-2xs"
          aria-label={isOverviewMinimizedMobile ? 'Expand system overview' : 'Minimize system overview'}
        >
          {isOverviewMinimizedMobile ? (
            <>
              <ChevronDown className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              <span>Expand</span>
            </>
          ) : (
            <>
              <ChevronUp className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
              <span>Minimize</span>
            </>
          )}
        </button>
      </div>

      {/* Compact Minimized Card (Mobile only when minimized) */}
      {isOverviewMinimizedMobile && (
        <div
          onClick={toggleMobileOverview}
          className="md:hidden card-bg p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs cursor-pointer hover:border-indigo-500/40 transition-all active:scale-[0.99] space-y-2.5"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-xs font-bold text-slate-800 dark:text-white">Portfolio Pulse</span>
              <span className="text-[10px] text-slate-400 dark:text-slate-500">• Minimized</span>
            </div>
            <span className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
              <span>Tap to expand</span>
              <ChevronDown className="w-3 h-3" />
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100 dark:border-slate-800/80">
            <div>
              <div className="text-[9px] text-slate-400 dark:text-slate-500 font-semibold uppercase tracking-wider">
                Total Outstanding
              </div>
              <div className="text-sm font-bold text-indigo-600 dark:text-indigo-400">
                {formatCurrency(stats.totalOutstanding)}
              </div>
            </div>
            <div className="text-right">
              <div className="text-[9px] text-slate-400 dark:text-slate-500 font-semibold uppercase tracking-wider">
                Collected ({currentMonthName})
              </div>
              <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                {formatCurrency(stats.totalCollected)}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 10 Dashboard Stat Cards (Full view on desktop, collapsible on phone) */}
      <div
        className={`${
          isOverviewMinimizedMobile ? 'hidden md:grid' : 'grid'
        } grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5`}
      >
        {statCards.map((card, idx) => (
          <div
            key={idx}
            className="card-bg p-4 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-indigo-500/30 transition-all flex flex-col justify-between shadow-xs hover:shadow-md"
          >
            <div>
              <div className="flex justify-between items-center text-[10px] text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider mb-2">
                <span className="truncate max-w-[120px]">{card.label}</span>
                <span className={`${card.symbolColor} font-bold text-xs`}>{card.symbol}</span>
              </div>
              <div className={`${card.accentColor} font-bold text-base mb-1 tracking-tight`}>
                {card.value}
              </div>
            </div>
            <div className="text-[10px] text-slate-400 dark:text-slate-500 truncate mt-1">{card.subtext}</div>
          </div>
        ))}
      </div>

      {/* Quick Summary Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Active Accounts Highlight */}
        <div className="card-bg p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4 shadow-xs">
          <div className="flex justify-between items-center pb-3 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-indigo-500" />
              <h3 className="text-slate-900 dark:text-white font-bold text-sm">Active Borrowers</h3>
            </div>
            <button
              onClick={() => setCurrentView('borrowers')}
              className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-0.5 font-medium"
            >
              <span>View all</span>
              <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>

          <div className="space-y-2.5">
            {borrowers.filter((b) => !b.is_fully_paid).slice(0, 4).map((b) => {
              const totalPaid = b.schedules.reduce((sum, s) => sum + s.amount_paid, 0);
              const remaining = Math.max(0, b.total_payable - totalPaid);
              const progress = b.total_payable > 0 ? (totalPaid / b.total_payable) * 100 : 0;

              return (
                <div
                  key={b.id}
                  onClick={() => {
                    setSelectedLedgerBorrowerId(b.id);
                    setCurrentView('ledger');
                  }}
                  className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-700/60 cursor-pointer transition-all space-y-2"
                >
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-slate-800 dark:text-white">{b.name}</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                      {formatCurrency(totalPaid)} / {formatCurrency(b.total_payable)}
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-900 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-indigo-600 dark:bg-indigo-500 h-full rounded-full transition-all"
                      style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                    <span>{b.frequency}</span>
                    <span>Remaining: {formatCurrency(remaining)}</span>
                  </div>
                </div>
              );
            })}

            {borrowers.filter((b) => !b.is_fully_paid).length === 0 && (
              <p className="text-xs text-slate-400 text-center py-6">No active borrowers registered.</p>
            )}
          </div>
        </div>

        {/* Profit Split Distribution */}
        <div className="card-bg p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4 shadow-xs">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-200 dark:border-slate-800">
            <Award className="w-4 h-4 text-emerald-500" />
            <h3 className="text-slate-900 dark:text-white font-bold text-sm">Interest Distribution Model</h3>
          </div>

          <p className="text-xs text-slate-500 dark:text-slate-400">
            Every installment collection separates principal from interest. The interest portion is
            systematically split:
          </p>

          <div className="space-y-3">
            <div className="p-3.5 bg-emerald-50/50 dark:bg-slate-800/80 rounded-xl border border-emerald-200 dark:border-emerald-500/20">
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs font-semibold text-slate-800 dark:text-white">Owner Portfolio Share</span>
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">75%</span>
              </div>
              <p className="text-[11px] text-emerald-700 dark:text-emerald-300/80 mb-2">
                Accumulated: {formatCurrency(stats.ownerInterest)}
              </p>
              <div className="w-full bg-slate-200 dark:bg-slate-900 rounded-full h-2 overflow-hidden">
                <div className="bg-emerald-500 h-full rounded-full w-3/4"></div>
              </div>
            </div>

            <div className="p-3.5 bg-indigo-50/50 dark:bg-slate-800/80 rounded-xl border border-indigo-200 dark:border-indigo-500/20">
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs font-semibold text-slate-800 dark:text-white">Collectors Commission Share</span>
                <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">25%</span>
              </div>
              <p className="text-[11px] text-indigo-700 dark:text-indigo-300/80 mb-2">
                Accumulated: {formatCurrency(stats.collectorProfit)}
              </p>
              <div className="w-full bg-slate-200 dark:bg-slate-900 rounded-full h-2 overflow-hidden">
                <div className="bg-indigo-600 dark:bg-indigo-500 h-full rounded-full w-1/4"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Operations & Tools */}
        <div className="card-bg p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4 shadow-xs">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-200 dark:border-slate-800">
            <BookOpen className="w-4 h-4 text-indigo-500" />
            <h3 className="text-slate-900 dark:text-white font-bold text-sm">Fast Access Portal</h3>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <button
              onClick={() => setCurrentView('ledger')}
              className="p-3 bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700/60 text-left transition-colors group cursor-pointer"
            >
              <span className="block text-slate-800 dark:text-white font-semibold text-xs group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                📖 Master Ledger
              </span>
              <span className="text-[10px] text-slate-400">View installments</span>
            </button>

            <button
              onClick={() => setCurrentView('collectors')}
              className="p-3 bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700/60 text-left transition-colors group cursor-pointer"
            >
              <span className="block text-slate-800 dark:text-white font-semibold text-xs group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                👤 Collectors
              </span>
              <span className="text-[10px] text-slate-400">Field agents</span>
            </button>

            <button
              onClick={() => setCurrentView('cashouts')}
              className="p-3 bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700/60 text-left transition-colors group cursor-pointer"
            >
              <span className="block text-slate-800 dark:text-white font-semibold text-xs group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                📉 Cash Outs
              </span>
              <span className="text-[10px] text-slate-400">Disburse pool</span>
            </button>

            <button
              onClick={() => setCurrentView('past-ledger')}
              className="p-3 bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700/60 text-left transition-colors group cursor-pointer"
            >
              <span className="block text-slate-800 dark:text-white font-semibold text-xs group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                📑 Past Ledger
              </span>
              <span className="text-[10px] text-slate-400">Archived loans</span>
            </button>
          </div>

          <div className="p-3.5 bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200/80 dark:border-indigo-500/20 rounded-xl flex items-center justify-between text-xs">
            <div>
              <p className="text-slate-900 dark:text-white font-semibold">Daily Collection Sheet</p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">View schedules due today</p>
            </div>
            <button
              onClick={() => setCurrentView('collection-sheet')}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-3 py-1.5 rounded-lg text-xs transition-colors shadow-sm cursor-pointer"
            >
              Open Sheet
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
