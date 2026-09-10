import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { AlertTriangle, X, RefreshCw, Loader2, CheckCircle2, Copy, Check } from 'lucide-react';

interface ResetDataModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ResetDataModal: React.FC<ResetDataModalProps> = ({ isOpen, onClose }) => {
  const { resetAllData, resetToDefaultSeed, setCurrentView, isSupabaseConfigured } = useApp();
  const [confirmText, setConfirmText] = useState('');
  const [isResetting, setIsResetting] = useState(false);
  const [rlsNotice, setRlsNotice] = useState<string | null>(null);
  const [copiedSql, setCopiedSql] = useState(false);

  if (!isOpen) return null;

  const isConfirmed =
    confirmText.trim().toUpperCase() === 'RESET ALL' ||
    confirmText.trim().toUpperCase() === 'RESET';

  const handleResetAll = async () => {
    if (!isConfirmed || isResetting) return;
    setIsResetting(true);
    setRlsNotice(null);

    try {
      const res = await resetAllData();
      if (res.isRlsError) {
        setRlsNotice(
          'Local data wiped! However, Supabase blocked the remote wipe due to Row-Level Security (RLS). Run the updated SQL script in your Supabase SQL Editor so Supabase deletes successfully.'
        );
        setIsResetting(false);
        return;
      }

      setIsResetting(false);
      onClose();
      setCurrentView('dashboard');
    } catch (err) {
      console.error('Reset error:', err);
      setIsResetting(false);
      onClose();
      setCurrentView('dashboard');
    }
  };

  const handleResetToSeed = async () => {
    if (isResetting) return;
    setIsResetting(true);
    try {
      await resetToDefaultSeed();
      setIsResetting(false);
      onClose();
      setCurrentView('dashboard');
    } catch (err) {
      console.error('Seed reset error:', err);
      setIsResetting(false);
      onClose();
      setCurrentView('dashboard');
    }
  };

  const sqlFix = `DROP POLICY IF EXISTS "Allow public read access" ON public.portfolio_sync;
DROP POLICY IF EXISTS "Allow public insert access" ON public.portfolio_sync;
DROP POLICY IF EXISTS "Allow public update access" ON public.portfolio_sync;
DROP POLICY IF EXISTS "Allow public delete access" ON public.portfolio_sync;
DROP POLICY IF EXISTS "Allow full public access" ON public.portfolio_sync;

CREATE POLICY "Allow full public access"
ON public.portfolio_sync
FOR ALL
TO anon, authenticated, service_role
USING (true)
WITH CHECK (true);

GRANT ALL ON TABLE public.portfolio_sync TO anon;
GRANT ALL ON TABLE public.portfolio_sync TO authenticated;
GRANT ALL ON TABLE public.portfolio_sync TO service_role;`;

  return (
    <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in">
      <div className="card-bg w-full max-w-lg p-6 rounded-2xl border border-rose-200 dark:border-rose-900/40 shadow-2xl space-y-4">
        <div className="flex justify-between items-center pb-3 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <h3 className="text-rose-600 dark:text-rose-400 font-bold text-sm">
              Confirm Complete Database & Portfolio Reset
            </h3>
          </div>
          <button
            onClick={onClose}
            disabled={isResetting}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
          This action will <strong>permanently erase</strong> all portfolio records, borrowers,
          active loans, ledgers, and payment histories from local browser storage{' '}
          {isSupabaseConfigured && (
            <span className="text-indigo-600 dark:text-indigo-400 font-medium">
              and your connected Supabase cloud database
            </span>
          )}
          .
        </p>

        {rlsNotice && (
          <div className="p-3.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl space-y-2 text-xs">
            <p className="text-amber-800 dark:text-amber-300 font-semibold">{rlsNotice}</p>
            <div className="p-2.5 bg-slate-900 rounded-lg text-[11px] font-mono text-slate-300 relative">
              <pre className="overflow-x-auto whitespace-pre">{sqlFix}</pre>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(sqlFix);
                  setCopiedSql(true);
                  setTimeout(() => setCopiedSql(false), 3000);
                }}
                className="mt-2 flex items-center gap-1.5 bg-indigo-600 text-white px-2.5 py-1 rounded text-[11px] font-sans font-medium cursor-pointer hover:bg-indigo-700"
              >
                {copiedSql ? <Check className="w-3 h-3 text-emerald-300" /> : <Copy className="w-3 h-3" />}
                <span>{copiedSql ? 'Copied to Clipboard!' : 'Copy SQL to Run in Supabase'}</span>
              </button>
            </div>
            <button
              onClick={() => {
                onClose();
                setCurrentView('dashboard');
              }}
              className="text-[11px] text-indigo-600 dark:text-indigo-400 underline font-medium cursor-pointer"
            >
              Continue to Empty Dashboard
            </button>
          </div>
        )}

        <div className="p-3.5 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 rounded-xl space-y-2">
          <p className="text-xs text-rose-700 dark:text-rose-300">
            Type <strong className="font-mono bg-rose-200 dark:bg-rose-950/60 text-rose-900 dark:text-rose-200 px-1.5 py-0.5 rounded">RESET ALL</strong> below to confirm permanent erase:
          </p>
          <input
            type="text"
            value={confirmText}
            disabled={isResetting}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder="Type RESET ALL or RESET here"
            className="w-full bg-white dark:bg-slate-800 border border-rose-200 dark:border-rose-900/50 rounded-xl px-3 py-2 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-rose-500 font-mono"
          />
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
          <button
            type="button"
            disabled={isResetting}
            onClick={handleResetToSeed}
            className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 underline flex items-center gap-1 font-medium cursor-pointer disabled:opacity-50"
            title="Restore sample demo records instead of completely emptying"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Load Demo Seed Data</span>
          </button>

          <div className="flex gap-2 justify-end">
            <button
              type="button"
              disabled={isResetting}
              onClick={onClose}
              className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold transition-colors cursor-pointer border border-slate-200 dark:border-slate-700 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={!isConfirmed || isResetting}
              onClick={handleResetAll}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer ${
                isConfirmed && !isResetting
                  ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-lg shadow-rose-600/20 active:scale-[0.98]'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed border border-slate-200 dark:border-slate-800'
              }`}
            >
              {isResetting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Erasing Database...</span>
                </>
              ) : (
                <span>Erase Everything</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
