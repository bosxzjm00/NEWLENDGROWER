import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useApp, getPortalBorrowerIdFromUrl } from '../context/AppContext';
import { Borrower } from '../types';
import { fetchBorrowerFromSupabase, saveSupabaseConfig } from '../lib/supabase';
import { formatCurrency, formatDateToWords, getTodayIsoString } from '../utils/formatters';
import {
  Calendar,
  CreditCard,
  Printer,
  Share2,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ArrowLeft,
  Copy,
  Check,
  Phone,
  MapPin,
  FileText,
  Moon,
  Sun,
  ShieldCheck,
  TrendingUp,
  ExternalLink,
  ChevronRight,
  Info,
  RefreshCw,
  Loader2,
  Database
} from 'lucide-react';

interface BorrowerPortalViewProps {
  isPublicAccess?: boolean;
  borrowerId?: string;
  onBackToDashboard?: () => void;
}

// Parse custom Supabase configuration from URL if shared with &sbc=
const parseCustomSupabaseFromUrl = (): { url?: string; key?: string } | undefined => {
  if (typeof window === 'undefined') return undefined;
  try {
    const params = new URLSearchParams(window.location.search);
    const sbc = params.get('sbc');
    if (!sbc) return undefined;
    const decoded = JSON.parse(atob(decodeURIComponent(sbc)));
    if (decoded && decoded.u && decoded.k) {
      saveSupabaseConfig(decoded.u as string, decoded.k as string);
      return { url: decoded.u as string, key: decoded.k as string };
    }
  } catch (e) {
    console.warn('Could not parse sbc parameter:', e);
  }
  return undefined;
};

export const BorrowerPortalView: React.FC<BorrowerPortalViewProps> = ({
  isPublicAccess = false,
  borrowerId: propBorrowerId,
  onBackToDashboard,
}) => {
  const {
    borrowers,
    selectedPortalBorrowerId,
    setSelectedPortalBorrowerId,
    setSelectedStatementBorrowerId,
    setCurrentView,
    isLoggedIn,
    themeMode,
    toggleThemeMode,
  } = useApp();

  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedLoanId, setCopiedLoanId] = useState(false);
  const [activeTab, setActiveTab] = useState<'schedule' | 'statement'>('schedule');

  // Resolve target borrower ID: from props, context, or URL
  const targetId = propBorrowerId || selectedPortalBorrowerId || getPortalBorrowerIdFromUrl();

  // If accessed via personal portal link, lock page strictly to this borrower
  const isLocked = isPublicAccess || Boolean(getPortalBorrowerIdFromUrl());

  // Prevent browser back navigation from leaving the locked borrower portfolio
  useEffect(() => {
    if (isLocked && typeof window !== 'undefined') {
      const handlePopState = () => {
        window.history.pushState(null, '', window.location.href);
      };
      window.history.pushState(null, '', window.location.href);
      window.addEventListener('popstate', handlePopState);
      return () => window.removeEventListener('popstate', handlePopState);
    }
  }, [isLocked]);

  // Local state lookup
  const localBorrower = useMemo(() => {
    if (!targetId) return null;
    return borrowers.find((b) => b.id === targetId || b.id.toLowerCase() === targetId.toLowerCase());
  }, [borrowers, targetId]);

  // Cloud Supabase fetching state
  const [remoteBorrower, setRemoteBorrower] = useState<Borrower | null>(null);
  const [isCloudLoading, setIsCloudLoading] = useState<boolean>(!localBorrower);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [lastSyncedTime, setLastSyncedTime] = useState<string | null>(null);
  const [cloudError, setCloudError] = useState<string | null>(null);

  const loadFromCloud = useCallback(async (isManualRefresh = false) => {
    if (!targetId) {
      setIsCloudLoading(false);
      return;
    }

    if (isManualRefresh) {
      setIsRefreshing(true);
    } else if (!localBorrower) {
      setIsCloudLoading(true);
    }

    try {
      const customConfig = parseCustomSupabaseFromUrl();
      const res = await fetchBorrowerFromSupabase(targetId, customConfig);

      if (res.success && res.borrower) {
        setRemoteBorrower(res.borrower);
        setLastSyncedTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
        setCloudError(null);
      } else {
        if (!localBorrower) {
          setCloudError(res.error || 'Borrower schedule not found in database.');
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (!localBorrower) {
        setCloudError(msg);
      }
    } finally {
      setIsCloudLoading(false);
      setIsRefreshing(false);
    }
  }, [targetId, localBorrower]);

  // Initial cloud fetch on target ID
  useEffect(() => {
    loadFromCloud(false);
  }, [loadFromCloud]);

  // Active borrower priority: remote fresh snapshot first, fallback to local context
  const borrower = remoteBorrower || localBorrower;

  const today = getTodayIsoString();

  // Computations (preserving exact lending algorithms and calculations)
  const totalPaid = useMemo(() => {
    if (!borrower) return 0;
    return borrower.schedules.reduce((sum, s) => sum + s.amount_paid, 0);
  }, [borrower]);

  const totalUnpaid = useMemo(() => {
    if (!borrower) return 0;
    return Math.max(0, borrower.total_payable - totalPaid);
  }, [borrower, totalPaid]);

  const percentPaid = useMemo(() => {
    if (!borrower || borrower.total_payable <= 0) return 0;
    return Math.min(100, Math.round((totalPaid / borrower.total_payable) * 100));
  }, [borrower, totalPaid]);

  // Find next upcoming due installment
  const nextPendingInstallment = useMemo(() => {
    if (!borrower) return null;
    return borrower.schedules.find((s) => s.status !== 'Paid') || null;
  }, [borrower]);

  // Check if any installment is overdue
  const hasOverdue = useMemo(() => {
    if (!borrower) return false;
    return borrower.schedules.some((s) => s.status !== 'Paid' && s.due_date < today);
  }, [borrower, today]);

  // Quick filter for schedule list (minimizes portfolio on mobile)
  const [scheduleFilter, setScheduleFilter] = useState<'all' | 'unpaid' | 'paid'>('all');

  const paidCount = useMemo(() => {
    if (!borrower) return 0;
    return borrower.schedules.filter((s) => s.status === 'Paid').length;
  }, [borrower]);

  const unpaidCount = useMemo(() => {
    if (!borrower) return 0;
    return borrower.schedules.filter((s) => s.status !== 'Paid').length;
  }, [borrower]);

  const filteredSchedules = useMemo(() => {
    if (!borrower) return [];
    if (scheduleFilter === 'paid') {
      return borrower.schedules.filter((s) => s.status === 'Paid');
    }
    if (scheduleFilter === 'unpaid') {
      return borrower.schedules.filter((s) => s.status !== 'Paid');
    }
    return borrower.schedules;
  }, [borrower, scheduleFilter]);

  // Current page shareable link
  const portalUrl = useMemo(() => {
    if (typeof window === 'undefined' || !borrower) return '';
    const baseUrl = `${window.location.origin}${window.location.pathname}`;
    return `${baseUrl}?portal=${encodeURIComponent(borrower.id)}`;
  }, [borrower]);

  const handleCopyLink = () => {
    if (!portalUrl) return;
    navigator.clipboard.writeText(portalUrl).then(() => {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }).catch(() => {
      // fallback
      const textArea = document.createElement('textarea');
      textArea.value = portalUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    });
  };

  const handlePrint = () => {
    window.print();
  };

  const handleOpenStatement = () => {
    if (!borrower) return;
    if (!isLocked && isLoggedIn) {
      setSelectedStatementBorrowerId(borrower.id);
      setCurrentView('statement');
    } else {
      setActiveTab('statement');
    }
  };

  // Loading state while checking Supabase cloud
  if (!borrower && isCloudLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#0b1120] text-slate-800 dark:text-slate-300 flex items-center justify-center p-4">
        <div className="w-full max-w-md card-bg p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl text-center space-y-4">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
            <Loader2 className="w-7 h-7 animate-spin" />
          </div>
          <div>
            <h1 className="text-slate-900 dark:text-white font-bold text-lg">Loading Loan Schedule</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
              Fetching up-to-date schedule and payment records from Supabase cloud database...
            </p>
          </div>
          <div className="inline-flex items-center gap-1.5 text-[11px] text-indigo-600 dark:text-indigo-400 font-medium pt-2">
            <Database className="w-3.5 h-3.5" />
            <span>Connecting to live cloud portfolio</span>
          </div>
        </div>
      </div>
    );
  }

  // If borrower not found after checking local and cloud
  if (!borrower) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#0b1120] text-slate-800 dark:text-slate-300 flex items-center justify-center p-4">
        <div className="w-full max-w-md card-bg p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl text-center space-y-5">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
            <AlertTriangle className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-slate-900 dark:text-white font-bold text-lg">Loan Schedule Not Found</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
              We couldn't locate this loan schedule in the Supabase database. The link may have expired or the borrower reference is invalid.
            </p>
            {cloudError && (
              <p className="text-[11px] text-rose-500 font-mono mt-2 bg-rose-50 dark:bg-rose-950/30 p-2 rounded-lg">
                {cloudError}
              </p>
            )}
          </div>

          <div className="pt-2 flex flex-col gap-2.5">
            <button
              onClick={() => loadFromCloud(true)}
              className="w-full py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold text-xs transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>Retry Cloud Lookup</span>
            </button>

            {!isLocked && isLoggedIn && (
              <button
                onClick={() => {
                  setSelectedPortalBorrowerId(null);
                  setCurrentView('borrowers');
                  if (typeof window !== 'undefined') {
                    window.history.replaceState(null, '', window.location.pathname);
                  }
                }}
                className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
              >
                Return to Borrowers Table
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0b1120] text-slate-800 dark:text-slate-300 transition-colors">
      {/* Top Navbar / Header Bar */}
      <header className="sticky top-0 z-30 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-3 sm:px-6 py-2.5 sm:py-3.5 no-print print-hide">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-2 sm:gap-3">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            {!isLocked && isLoggedIn && (
              <button
                onClick={() => {
                  if (onBackToDashboard) {
                    onBackToDashboard();
                  } else {
                    setSelectedPortalBorrowerId(null);
                    setCurrentView('borrowers');
                    if (typeof window !== 'undefined') {
                      window.history.replaceState(null, '', window.location.pathname);
                    }
                  }
                }}
                className="p-1.5 sm:p-2 -ml-1 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-semibold shrink-0"
                title="Return to Admin Dashboard"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Admin Dashboard</span>
              </button>
            )}

            <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-base sm:text-lg shadow-md shadow-indigo-600/20 shrink-0">
                ₱
              </div>
              <div className="truncate">
                <span className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm tracking-tight block truncate">
                  LendGrower
                </span>
                <span className="text-[9px] sm:text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold tracking-wide uppercase block truncate">
                  Borrower Portal
                </span>
              </div>
            </div>
          </div>

          {/* Header Controls */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <button
              onClick={() => loadFromCloud(true)}
              disabled={isRefreshing}
              className="p-2 sm:px-2.5 sm:py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
              title="Refresh schedule from Supabase cloud database"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-emerald-500 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">{isRefreshing ? 'Updating...' : 'Live Refresh'}</span>
            </button>

            <button
              onClick={handleCopyLink}
              className="p-2 sm:px-3 sm:py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Copy shareable link"
            >
              {copiedLink ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                  <span className="hidden sm:inline text-emerald-600 dark:text-emerald-400">Copied!</span>
                </>
              ) : (
                <>
                  <Share2 className="w-3.5 h-3.5 text-indigo-500" />
                  <span className="hidden sm:inline">Share</span>
                </>
              )}
            </button>

            <button
              onClick={handlePrint}
              className="p-2 sm:px-3 sm:py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm shadow-indigo-600/20 transition-all cursor-pointer"
              title="Print Loan Schedule"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Print</span>
            </button>

            <button
              onClick={toggleThemeMode}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title="Toggle theme"
              aria-label="Toggle theme"
            >
              {themeMode === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-5xl mx-auto p-3 sm:p-6 lg:p-8 space-y-3.5 sm:space-y-6">
        {/* Borrower Information Card */}
        <section className="card-bg rounded-xl sm:rounded-2xl border border-slate-200 dark:border-slate-800 p-3.5 sm:p-6 shadow-sm relative overflow-hidden">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4">
            <div className="space-y-1.5 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-slate-900 dark:text-white font-bold text-lg sm:text-2xl tracking-tight">
                  {borrower.name}
                </h1>
                {borrower.loan_id && (
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(borrower.loan_id!);
                      setCopiedLoanId(true);
                      setTimeout(() => setCopiedLoanId(false), 1500);
                    }}
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] sm:text-xs font-mono font-bold border tracking-wide cursor-pointer transition-all ${
                      copiedLoanId
                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400 border-emerald-300 dark:border-emerald-700'
                        : 'bg-slate-100 text-indigo-700 dark:bg-slate-800 dark:text-indigo-400 border-slate-200 dark:border-slate-700 hover:bg-indigo-50 dark:hover:bg-slate-700/80 active:scale-95'
                    }`}
                    title={copiedLoanId ? 'Copied to clipboard!' : 'Click to copy Loan ID'}
                  >
                    {copiedLoanId ? 'Copied!' : `Loan ID: ${borrower.loan_id}`}
                  </button>
                )}
                {borrower.is_fully_paid ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] sm:text-xs font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20">
                    <CheckCircle2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                    Fully Paid
                  </span>
                ) : hasOverdue ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] sm:text-xs font-bold bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400 border border-rose-200 dark:border-rose-500/20">
                    <AlertTriangle className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                    Overdue
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] sm:text-xs font-bold bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/20">
                    <Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                    Active Account
                  </span>
                )}

                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] sm:text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Live Sync</span>
                  {lastSyncedTime && <span className="opacity-75 font-normal text-[10px] hidden xs:inline">({lastSyncedTime})</span>}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-x-3.5 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
                {borrower.contact && (
                  <div className="flex items-center gap-1">
                    <Phone className="w-3 h-3 text-slate-400" />
                    <span>{borrower.contact}</span>
                  </div>
                )}
                {borrower.address && (
                  <div className="flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-slate-400" />
                    <span>{borrower.address}</span>
                  </div>
                )}
                <div className="flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-slate-400" />
                  <span>Started: {formatDateToWords(borrower.start_date)}</span>
                </div>
              </div>
            </div>

            {/* Quick Share Link Pill */}
            <div className="no-print print-hide flex items-center gap-2 pt-1 md:pt-0">
              <button
                onClick={handleCopyLink}
                className="w-full sm:w-auto px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium text-xs flex items-center justify-center gap-1.5 border border-slate-200 dark:border-slate-700 transition-all cursor-pointer"
              >
                {copiedLink ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Link Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-slate-500" />
                    <span>Copy Link</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-3.5 sm:mt-5 pt-3 sm:pt-4 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between text-xs font-semibold mb-1.5">
              <span className="text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
                Repayment Progress
              </span>
              <span className="text-slate-900 dark:text-white text-xs">
                {percentPaid}% Settled ({formatCurrency(totalPaid)} / {formatCurrency(borrower.total_payable)})
              </span>
            </div>
            <div className="w-full h-2.5 sm:h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-200/80 dark:border-slate-700/80">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  borrower.is_fully_paid
                    ? 'bg-emerald-500'
                    : 'bg-gradient-to-r from-indigo-500 to-emerald-500'
                }`}
                style={{ width: `${percentPaid}%` }}
              ></div>
            </div>
          </div>
        </section>

        {/* 4 Financial Metrics Cards (Exact computations preserved) */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
          <div className="card-bg rounded-xl sm:rounded-2xl border border-slate-200 dark:border-slate-800 p-3 sm:p-4.5 shadow-sm">
            <span className="text-[10px] sm:text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
              Principal Loan
            </span>
            <span className="text-base sm:text-xl font-bold text-indigo-600 dark:text-indigo-400 mt-1 block">
              {formatCurrency(borrower.amount)}
            </span>
            <span className="text-[9px] sm:text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 block">
              {borrower.interest_rate}% interest rate
            </span>
          </div>

          <div className="card-bg rounded-xl sm:rounded-2xl border border-slate-200 dark:border-slate-800 p-3 sm:p-4.5 shadow-sm">
            <span className="text-[10px] sm:text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
              Total Payable
            </span>
            <span className="text-base sm:text-xl font-bold text-slate-900 dark:text-white mt-1 block">
              {formatCurrency(borrower.total_payable)}
            </span>
            <span className="text-[9px] sm:text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 block truncate">
              {borrower.frequency.toUpperCase()} • {borrower.installments} inst.
            </span>
          </div>

          <div className="card-bg rounded-xl sm:rounded-2xl border border-slate-200 dark:border-slate-800 p-3 sm:p-4.5 shadow-sm">
            <span className="text-[10px] sm:text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
              Total Paid
            </span>
            <span className="text-base sm:text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-1 block">
              {formatCurrency(totalPaid)}
            </span>
            <span className="text-[9px] sm:text-[10px] text-emerald-600/80 dark:text-emerald-400/80 mt-0.5 block">
              {percentPaid}% completed
            </span>
          </div>

          <div className="card-bg rounded-xl sm:rounded-2xl border border-slate-200 dark:border-slate-800 p-3 sm:p-4.5 shadow-sm">
            <span className="text-[10px] sm:text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
              Remaining Balance
            </span>
            <span className={`text-base sm:text-xl font-bold mt-1 block ${totalUnpaid > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
              {formatCurrency(totalUnpaid)}
            </span>
            <span className="text-[9px] sm:text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 block">
              {totalUnpaid === 0 ? 'Fully settled' : 'Outstanding balance'}
            </span>
          </div>
        </section>

        {/* Next Due Spotlight Banner (if active) */}
        {!borrower.is_fully_paid && nextPendingInstallment && (
          <section className="rounded-xl sm:rounded-2xl bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-200/80 dark:border-indigo-800/60 p-3 sm:p-4.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3 shadow-sm">
            <div className="flex items-center gap-2.5 sm:gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-indigo-600/20">
                <Calendar className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div>
                <span className="text-[10px] sm:text-[11px] uppercase tracking-wider font-bold text-indigo-700 dark:text-indigo-300 block">
                  Next Due Installment (#{nextPendingInstallment.installment_no})
                </span>
                <span className="text-xs sm:text-base font-bold text-slate-900 dark:text-white">
                  {formatDateToWords(nextPendingInstallment.due_date)}{' '}
                  {nextPendingInstallment.due_date < today && (
                    <span className="text-[11px] text-rose-600 dark:text-rose-400 font-semibold">(Overdue)</span>
                  )}
                </span>
              </div>
            </div>

            <div className="sm:text-right flex sm:flex-col justify-between items-center sm:items-end border-t sm:border-t-0 pt-2 sm:pt-0 border-indigo-200/60 dark:border-indigo-900/60">
              <span className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400">Amount Due</span>
              <span className="text-sm sm:text-lg font-bold text-indigo-700 dark:text-indigo-300">
                {formatCurrency(Math.max(0, nextPendingInstallment.amount_due - nextPendingInstallment.amount_paid))}
              </span>
            </div>
          </section>
        )}

        {/* Schedule or Statement View */}
        {activeTab === 'statement' ? (
          /* Formal Statement View within Portal */
          <section className="card-bg rounded-xl sm:rounded-2xl border border-slate-200 dark:border-slate-800 p-4 sm:p-6 shadow-sm space-y-5">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-slate-200 dark:border-slate-800 no-print">
              <button
                onClick={() => setActiveTab('schedule')}
                className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Schedule</span>
              </button>
              <button
                onClick={handlePrint}
                className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Formal Statement</span>
              </button>
            </div>

            {/* Statement of Account Header */}
            <div className="text-center space-y-1">
              <h2 className="text-base sm:text-xl font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Statement of Account
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Official Amortization & Repayment Ledger
              </p>
            </div>

            {/* Account Metadata Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 text-xs">
              <div>
                <span className="text-[10px] text-slate-400 block">Borrower</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{borrower.name}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">Principal Loan</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{formatCurrency(borrower.amount)}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">Interest Rate</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{borrower.interest_rate}%</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">Frequency</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{borrower.frequency.toUpperCase()}</span>
              </div>
            </div>

            {/* Schedule List in Statement */}
            <div className="divide-y divide-slate-200/80 dark:divide-slate-800">
              {borrower.schedules.map((s) => {
                const balance = Math.max(0, s.amount_due - s.amount_paid);
                return (
                  <div key={s.id} className="py-2.5 flex items-center justify-between text-xs gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-[11px]">
                        #{s.installment_no}
                      </span>
                      <span className="text-slate-600 dark:text-slate-300">
                        {formatDateToWords(s.due_date)}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                          {formatCurrency(s.amount_due)}
                        </span>
                        {s.amount_paid > 0 && (
                          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 block">
                            Paid: {formatCurrency(s.amount_paid)}
                          </span>
                        )}
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                        s.status === 'Paid'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20'
                          : balance > 0 && s.due_date < today
                          ? 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20'
                          : 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
                      }`}>
                        {s.status === 'Paid' ? 'Paid' : s.due_date < today ? 'Overdue' : s.status}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        ) : (
          /* Amortization & Payment Schedule Section */
          <section className="card-bg rounded-xl sm:rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            {/* Header with Title and Filter Tabs */}
            <div className="p-3.5 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex flex-col gap-3 bg-slate-50/50 dark:bg-slate-900/40">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <h2 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white flex items-center gap-1.5 sm:gap-2">
                    <span>Payment Schedule</span>
                    <span className="text-[11px] sm:text-xs font-normal text-slate-500 dark:text-slate-400">
                      ({borrower.schedules.length} installments)
                    </span>
                  </h2>
                  <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Dates, amounts due, and settlement records
                  </p>
                </div>

                <div className="shrink-0 no-print print-hide">
                  <button
                    onClick={handleOpenStatement}
                    className="px-2.5 sm:px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700 text-indigo-600 dark:text-indigo-400 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Formal Statement</span>
                    <span className="sm:hidden">Statement</span>
                  </button>
                </div>
              </div>

              {/* Minimizer Filter Pills (Quick mobile filter) */}
              <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/60 no-print print-hide text-xs font-semibold self-start sm:self-auto overflow-x-auto max-w-full">
                <button
                  onClick={() => setScheduleFilter('all')}
                  className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                    scheduleFilter === 'all'
                      ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  All ({borrower.schedules.length})
                </button>
                <button
                  onClick={() => setScheduleFilter('unpaid')}
                  className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                    scheduleFilter === 'unpaid'
                      ? 'bg-white dark:bg-slate-700 text-rose-600 dark:text-rose-400 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Due / Pending ({unpaidCount})
                </button>
                <button
                  onClick={() => setScheduleFilter('paid')}
                  className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                    scheduleFilter === 'paid'
                      ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Paid ({paidCount})
                </button>
              </div>
            </div>

            {/* Mobile Card / List View (Zero horizontal scroll on phone screens) */}
            <div className="block md:hidden divide-y divide-slate-100 dark:divide-slate-800/80">
              {filteredSchedules.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400 dark:text-slate-500 italic">
                  No installments match this filter.
                </div>
              ) : (
                filteredSchedules.map((s) => {
                  const balance = Math.max(0, s.amount_due - s.amount_paid);
                  const isOverdue = s.status !== 'Paid' && s.due_date < today;

                  let statusBadgeClass = 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700';
                  let statusLabel = s.status;

                  if (s.status === 'Paid') {
                    statusBadgeClass = 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20';
                  } else if (s.status === 'Partial') {
                    statusBadgeClass = 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20';
                  } else if (isOverdue) {
                    statusBadgeClass = 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20';
                    statusLabel = 'Overdue' as any;
                  }

                  return (
                    <div
                      key={s.id}
                      className={`p-3 space-y-2 transition-colors ${
                        isOverdue ? 'bg-rose-50/20 dark:bg-rose-950/10' : ''
                      }`}
                    >
                      {/* Top Row: #, Date, Status */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 dark:text-white text-xs bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                            #{s.installment_no}
                          </span>
                          <span className="font-semibold text-slate-800 dark:text-slate-200 text-xs">
                            {formatDateToWords(s.due_date)}
                          </span>
                        </div>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] border font-bold ${statusBadgeClass}`}>
                          {statusLabel}
                        </span>
                      </div>

                      {/* 3-Box Comparison: Due | Paid | Balance */}
                      <div className="grid grid-cols-3 gap-2 py-1.5 px-2.5 rounded-lg bg-slate-50/90 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800/80 text-center">
                        <div>
                          <span className="text-[10px] text-slate-400 block">Due</span>
                          <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                            {formatCurrency(s.amount_due)}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-emerald-600/80 dark:text-emerald-400/80 block">Paid</span>
                          <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                            {formatCurrency(s.amount_paid)}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block">Balance</span>
                          <span className={`text-xs font-bold ${balance > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-400'}`}>
                            {formatCurrency(balance)}
                          </span>
                        </div>
                      </div>

                      {/* Payment History Record */}
                      {s.payments && s.payments.length > 0 && (
                        <div className="pt-0.5 space-y-1">
                          {s.payments.map((p, idx) => (
                            <div
                              key={p.id || idx}
                              className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 bg-emerald-50/50 dark:bg-emerald-950/20 px-2 py-1 rounded border border-emerald-100/50 dark:border-emerald-900/20"
                            >
                              <div className="flex items-center gap-1.5">
                                <span className="font-semibold text-emerald-700 dark:text-emerald-400">
                                  {formatCurrency(p.amount)}
                                </span>
                                <span>•</span>
                                <span>{p.method}</span>
                              </div>
                              <div className="flex items-center gap-1 text-[9px] text-slate-400">
                                <span>{formatDateToWords(p.date)}</span>
                                {p.reference && <span>(Ref: {p.reference})</span>}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Desktop Table View (Full table layout on md+ screens and print) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
                <thead className="bg-slate-100/90 dark:bg-slate-900 uppercase text-[10px] text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="px-4 py-3 whitespace-nowrap">#</th>
                    <th className="px-4 py-3 whitespace-nowrap">Due Date</th>
                    <th className="px-4 py-3 whitespace-nowrap">Amount Due</th>
                    <th className="px-4 py-3 whitespace-nowrap">Paid</th>
                    <th className="px-4 py-3 whitespace-nowrap">Balance</th>
                    <th className="px-4 py-3 whitespace-nowrap">Status</th>
                    <th className="px-4 py-3 whitespace-nowrap">Payment Record</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/80 dark:divide-slate-800">
                  {filteredSchedules.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-slate-400 dark:text-slate-500 italic">
                        No installments match this filter.
                      </td>
                    </tr>
                  ) : (
                    filteredSchedules.map((s) => {
                      const balance = Math.max(0, s.amount_due - s.amount_paid);
                      const isOverdue = s.status !== 'Paid' && s.due_date < today;

                      let statusBadgeClass = 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700';
                      let statusLabel = s.status;

                      if (s.status === 'Paid') {
                        statusBadgeClass = 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20';
                      } else if (s.status === 'Partial') {
                        statusBadgeClass = 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20';
                      } else if (isOverdue) {
                        statusBadgeClass = 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20';
                        statusLabel = 'Overdue' as any;
                      }

                      return (
                        <tr
                          key={s.id}
                          className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors ${
                            isOverdue ? 'bg-rose-50/20 dark:bg-rose-950/10' : ''
                          }`}
                        >
                          <td className="px-4 py-3.5 font-bold text-slate-900 dark:text-white">
                            #{s.installment_no}
                          </td>
                          <td className="px-4 py-3.5 whitespace-nowrap font-medium text-slate-700 dark:text-slate-200">
                            {formatDateToWords(s.due_date)}
                          </td>
                          <td className="px-4 py-3.5 font-semibold text-slate-900 dark:text-white whitespace-nowrap">
                            {formatCurrency(s.amount_due)}
                          </td>
                          <td className="px-4 py-3.5 text-emerald-600 dark:text-emerald-400 font-semibold whitespace-nowrap">
                            {formatCurrency(s.amount_paid)}
                          </td>
                          <td className={`px-4 py-3.5 font-semibold whitespace-nowrap ${balance > 0 ? 'text-slate-700 dark:text-slate-300' : 'text-slate-400'}`}>
                            {formatCurrency(balance)}
                          </td>
                          <td className="px-4 py-3.5 whitespace-nowrap">
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] border font-bold ${statusBadgeClass}`}>
                              {statusLabel}
                            </span>
                          </td>
                          <td className="px-4 py-3.5 text-[11px] text-slate-500 dark:text-slate-400">
                            {s.payments && s.payments.length > 0 ? (
                              <div className="space-y-1">
                                {s.payments.map((p, idx) => (
                                  <div key={p.id || idx} className="flex items-center gap-1.5 flex-wrap">
                                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                                      {formatCurrency(p.amount)}
                                    </span>
                                    <span className="text-[10px] text-slate-400">•</span>
                                    <span className="text-[10px] text-slate-500">{p.method}</span>
                                    <span className="text-[10px] text-slate-400">
                                      ({formatDateToWords(p.date)})
                                    </span>
                                    {p.reference && (
                                      <span className="text-[9px] bg-slate-100 dark:bg-slate-800 px-1 rounded text-slate-500">
                                        Ref: {p.reference}
                                      </span>
                                    )}
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <span className="text-slate-400 dark:text-slate-500 italic">No payments recorded</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* Repayment Information and Guidelines */}
        <section className="card-bg rounded-xl sm:rounded-2xl border border-slate-200 dark:border-slate-800 p-4 sm:p-5 shadow-sm space-y-3">
          <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-sm">
            <ShieldCheck className="w-4 h-4 text-indigo-500" />
            <span>Repayment Instructions & Information</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            <div className="space-y-2 p-3 sm:p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200/70 dark:border-slate-800/80">
              <span className="font-semibold text-slate-800 dark:text-slate-200 block">
                How to Settle Installments:
              </span>
              <ul className="list-disc pl-4 space-y-1">
                <li>Remit payments to your assigned field collector during their scheduled collection visit.</li>
                <li>Digital payments (GCash, Maya, Bank Transfer) should always include your name as reference.</li>
                <li>Always request and retain your official collection receipt or reference code.</li>
              </ul>
            </div>

            <div className="space-y-2 p-3 sm:p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200/70 dark:border-slate-800/80">
              <span className="font-semibold text-slate-800 dark:text-slate-200 block">
                Account Summary & Remarks:
              </span>
              <p>
                {borrower.notes ? (
                  <span><strong>Notes:</strong> {borrower.notes}</span>
                ) : (
                  <span>Standard lending contract terms apply. For loan renewals or balance inquiries, contact your loan officer.</span>
                )}
              </p>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 pt-1">
                Account ID: <code className="font-mono text-indigo-600 dark:text-indigo-400">{borrower.id}</code>
              </p>
            </div>
          </div>
        </section>

        {/* Public Footer */}
        <footer className="pt-4 pb-8 text-center text-xs text-slate-400 dark:text-slate-500 no-print print-hide space-y-2">
          <p>© LendGrower Lending Management System. All calculations and balances certified.</p>
          {!isLocked && !isLoggedIn && (
            <div>
              <button
                onClick={() => {
                  setSelectedPortalBorrowerId(null);
                  setCurrentView('dashboard');
                  if (typeof window !== 'undefined') {
                    window.history.replaceState(null, '', window.location.pathname);
                  }
                }}
                className="text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer text-[11px] font-medium"
              >
                Administrator Login →
              </button>
            </div>
          )}
        </footer>
      </main>
    </div>
  );
};
