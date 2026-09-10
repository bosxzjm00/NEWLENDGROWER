import React, { useState } from 'react';
import { Borrower } from '../../types';
import { formatCurrency } from '../../utils/formatters';
import { useApp } from '../../context/AppContext';
import { getSupabaseConfig, DEFAULT_SUPABASE_URL, DEFAULT_SUPABASE_ANON_KEY } from '../../lib/supabase';
import {
  Share2,
  X,
  Copy,
  Check,
  ExternalLink,
  MessageSquare,
  Phone,
  Calendar,
  Sparkles,
  Smartphone,
  CloudCheck,
  Cloud,
  RefreshCw,
  Database
} from 'lucide-react';

interface ShareBorrowerLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  borrower: Borrower | null;
  onOpenPreview: (borrowerId: string) => void;
}

export const ShareBorrowerLinkModal: React.FC<ShareBorrowerLinkModalProps> = ({
  isOpen,
  onClose,
  borrower,
  onOpenPreview,
}) => {
  const { supabaseSyncStatus, pushToSupabase } = useApp();
  const [copied, setCopied] = useState(false);
  const [isSyncingNow, setIsSyncingNow] = useState(false);
  const [syncSuccessMsg, setSyncSuccessMsg] = useState<string | null>(null);

  if (!isOpen || !borrower) return null;

  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const pathname = typeof window !== 'undefined' ? window.location.pathname : '';

  const { url: sbUrl, key: sbKey } = getSupabaseConfig();
  const isCustomSupabase = Boolean(
    sbUrl && sbKey && (sbUrl !== DEFAULT_SUPABASE_URL || sbKey !== DEFAULT_SUPABASE_ANON_KEY)
  );

  let configParam = '';
  if (isCustomSupabase && sbUrl && sbKey) {
    try {
      configParam = `&sbc=${encodeURIComponent(btoa(JSON.stringify({ u: sbUrl, k: sbKey })))}`;
    } catch {
      configParam = '';
    }
  }

  const shareableUrl = `${origin}${pathname}?portal=${encodeURIComponent(borrower.id)}${configParam}`;

  const totalPaid = borrower.schedules.reduce((sum, s) => sum + s.amount_paid, 0);
  const totalUnpaid = Math.max(0, borrower.total_payable - totalPaid);

  const messageText = `Hi ${borrower.name}, here is your official LendGrower loan schedule link (Loan ID: ${borrower.loan_id || borrower.id}) to view your payment dates, installments, and remaining balance (${formatCurrency(totalUnpaid)}): ${shareableUrl}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(shareableUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }).catch(() => {
      const el = document.createElement('textarea');
      el.value = shareableUrl;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  const handleSyncToSupabase = async () => {
    setIsSyncingNow(true);
    setSyncSuccessMsg(null);
    try {
      const res = await pushToSupabase();
      if (res.success) {
        setSyncSuccessMsg('Saved to Supabase cloud!');
        setTimeout(() => setSyncSuccessMsg(null), 3500);
      } else {
        setSyncSuccessMsg('Sync notice: check connection');
        setTimeout(() => setSyncSuccessMsg(null), 3500);
      }
    } catch {
      setSyncSuccessMsg('Sync failed');
    } finally {
      setIsSyncingNow(false);
    }
  };

  const handleShareWhatsApp = () => {
    const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(messageText)}`;
    window.open(waUrl, '_blank');
  };

  const handleShareSms = () => {
    const cleanPhone = (borrower.contact || '').replace(/[^0-9+]/g, '');
    const smsUrl = `sms:${cleanPhone}?&body=${encodeURIComponent(messageText)}`;
    window.location.href = smsUrl;
  };

  return (
    <div
      id="share-borrower-link-modal-backdrop"
      className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        id="share-borrower-link-modal-card"
        className="card-bg w-full max-w-lg p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl space-y-5 animate-in zoom-in-95"
      >
        {/* Header */}
        <div className="flex justify-between items-center pb-3 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-slate-900 dark:text-white font-bold text-base">
                Borrower Schedule Link
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Share direct schedule access with {borrower.name}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Borrower Overview Pill */}
        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 text-xs flex items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-900 dark:text-white">{borrower.name}</span>
              {borrower.loan_id && (
                <span className="inline-flex items-center px-1.5 py-0.5 rounded font-mono text-[10px] font-bold bg-slate-200 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400">
                  Loan ID: {borrower.loan_id}
                </span>
              )}
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400">
              {borrower.contact || 'No phone'} • {borrower.installments} installments ({borrower.frequency})
            </div>
          </div>
          <div className="text-right shrink-0">
            <div className="text-[10px] uppercase font-semibold text-slate-400">Balance Due</div>
            <div className="font-bold text-rose-600 dark:text-rose-400">
              {formatCurrency(totalUnpaid)}
            </div>
          </div>
        </div>

        {/* Supabase Cloud Sync Status Notice */}
        <div className="rounded-xl p-3 bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <Database className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-slate-800 dark:text-slate-200">Supabase Cloud Ready</span>
                <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1 animate-pulse" />
                  Live Sync
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                {syncSuccessMsg || (supabaseSyncStatus.lastSynced ? `Latest snapshot synced at ${supabaseSyncStatus.lastSynced}` : 'Saves automatically so borrower can open on mobile')}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleSyncToSupabase}
            disabled={isSyncingNow}
            className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 disabled:opacity-50"
            title="Push data to Supabase now"
          >
            <RefreshCw className={`w-3 h-3 ${isSyncingNow ? 'animate-spin' : ''}`} />
            <span>{isSyncingNow ? 'Syncing...' : 'Save to Cloud'}</span>
          </button>
        </div>

        {/* Link Display and Copy Action */}
        <div className="space-y-2 text-xs">
          <label className="block text-slate-700 dark:text-slate-300 font-semibold">
            Direct Shareable URL:
          </label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={shareableUrl}
              onClick={(e) => (e.target as HTMLInputElement).select()}
              className="flex-1 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white font-mono select-all focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button
              type="button"
              onClick={handleCopy}
              className={`px-4 py-2.5 rounded-xl font-semibold text-xs flex items-center gap-1.5 transition-all cursor-pointer shrink-0 shadow-sm ${
                copied
                  ? 'bg-emerald-600 text-white shadow-emerald-600/20'
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-600/20 active:scale-95'
              }`}
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Copy Link</span>
                </>
              )}
            </button>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-1">
            <Smartphone className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
            <span>The borrower does not need an account or password to view this link.</span>
          </p>
        </div>

        {/* Direct Send Buttons (SMS / WhatsApp / Preview) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2">
          {borrower.contact && (
            <button
              type="button"
              onClick={handleShareSms}
              className="px-3 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold text-xs flex items-center justify-center gap-2 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
            >
              <Phone className="w-3.5 h-3.5 text-indigo-500" />
              <span>Send SMS</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleShareWhatsApp}
            className="px-3 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold text-xs flex items-center justify-center gap-2 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
          >
            <MessageSquare className="w-3.5 h-3.5 text-emerald-500" />
            <span>WhatsApp</span>
          </button>

          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenPreview(borrower.id);
            }}
            className="px-3 py-2.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/50 dark:hover:bg-indigo-900/60 text-indigo-600 dark:text-indigo-400 font-semibold text-xs flex items-center justify-center gap-2 border border-indigo-200 dark:border-indigo-800/60 transition-colors cursor-pointer"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Preview Page</span>
          </button>
        </div>

        {/* Footer info */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 text-[11px] text-slate-400 dark:text-slate-500">
          This portal link gives the borrower live, read-only visibility over their installment due dates, payments, and remaining balance.
        </div>
      </div>
    </div>
  );
};
