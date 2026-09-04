import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { formatCurrency, formatDateToWords, getTodayIsoString } from '../utils/formatters';
import { getSupabaseConfig } from '../lib/supabase';
import {
  Database,
  Upload,
  Download,
  CalendarCheck,
  Printer,
  AlertTriangle,
  FileCheck,
  RefreshCw,
  Cloud,
  CheckCircle2,
  Copy,
  Check,
  Key,
} from 'lucide-react';

interface SettingsViewProps {
  onOpenResetModal: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ onOpenResetModal }) => {
  const {
    activeSettingsSection,
    setActiveSettingsSection,
    exportDatabase,
    importDatabase,
    borrowers,
    collectors,
    assignments,
    setCurrentView,
    isSupabaseConfigured,
    supabaseSyncStatus,
    pushToSupabase,
    pullFromSupabase,
    saveSupabaseSettings,
  } = useApp();

  const [dcsDate, setDcsDate] = useState(getTodayIsoString());
  const [importStatus, setImportStatus] = useState<string | null>(null);

  // Supabase form states
  const [supabaseUrl, setSupabaseUrl] = useState(() => getSupabaseConfig().url);
  const [supabaseKey, setSupabaseKey] = useState(() => getSupabaseConfig().key);
  const [supabaseMsg, setSupabaseMsg] = useState<string | null>(null);
  const [copiedSql, setCopiedSql] = useState(false);
  const [showSql, setShowSql] = useState(false);

  useEffect(() => {
    const cfg = getSupabaseConfig();
    setSupabaseUrl(cfg.url);
    setSupabaseKey(cfg.key);
  }, [activeSettingsSection]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const success = importDatabase(text);
        if (success) {
          setImportStatus('Database imported successfully!');
          setTimeout(() => setImportStatus(null), 4000);
        } else {
          setImportStatus('Failed to parse database file. Invalid JSON structure.');
        }
      } catch {
        setImportStatus('Error reading file.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Compute daily collection sheet items for the inline setting preview
  const scheduledToday: {
    borrowerName: string;
    contact: string;
    collectorName: string;
    installmentNo: number;
    amountDue: number;
    amountPaid: number;
    balance: number;
    status: string;
  }[] = [];

  borrowers.forEach((b) => {
    if (b.is_fully_paid) return;
    const asg = assignments.find((a) => a.borrowerId === b.id);
    const col = asg ? collectors.find((c) => c.id === asg.collectorId) : null;
    const collectorName = col ? col.name : 'Unassigned';

    b.schedules.forEach((s) => {
      if (s.due_date === dcsDate) {
        scheduledToday.push({
          borrowerName: b.name,
          contact: b.contact,
          collectorName,
          installmentNo: s.installment_no,
          amountDue: s.amount_due,
          amountPaid: s.amount_paid,
          balance: Math.max(0, s.amount_due - s.amount_paid),
          status: s.status,
        });
      }
    });
  });

  return (
    <div id="view-settings" className="space-y-6 max-w-4xl animate-in fade-in">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">System Settings & Tools</h2>
        <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-1 font-medium">
          Manage local database backups, daily collection schedules, and portfolio records
        </p>
      </div>

      {importStatus && (
        <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-xl text-xs text-indigo-600 dark:text-indigo-400 flex items-center gap-2">
          <FileCheck className="w-4 h-4" />
          <span>{importStatus}</span>
        </div>
      )}

      {/* Backup & Restore Section */}
      <div
        id="settings-card-backup"
        className="card-bg rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm"
      >
        <div
          onClick={() => setActiveSettingsSection('backup')}
          className="p-5 text-slate-900 dark:text-white font-bold text-sm cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 flex justify-between items-center select-none transition-colors"
        >
          <div className="flex items-center gap-2.5">
            <Database className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span>Database Backup & Restore</span>
          </div>
          <span className="text-indigo-600 dark:text-indigo-400 text-xs font-mono">
            {activeSettingsSection === 'backup' ? '▼' : '►'}
          </span>
        </div>

        {activeSettingsSection === 'backup' && (
          <div className="p-6 pt-0 space-y-4 border-t border-slate-200 dark:border-slate-800 animate-in fade-in">
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-3 leading-relaxed">
              Export all local portfolio data, active loans, transaction logs, and collector accounts
              to a JSON file. You can restore this file at any time or transfer to another device.
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                onClick={exportDatabase}
                className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs px-4 py-2.5 rounded-xl transition-colors border border-slate-200 dark:border-slate-700 flex items-center gap-2 cursor-pointer"
              >
                <Download className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span>Export Database (.json)</span>
              </button>

              <label className="bg-indigo-50 dark:bg-indigo-900/30 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 font-semibold text-xs px-4 py-2.5 rounded-xl transition-colors border border-indigo-200 dark:border-indigo-800 cursor-pointer flex items-center gap-2">
                <Upload className="w-4 h-4" />
                <span>Import Database (.json)</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        )}
      </div>

      {/* Supabase Cloud Database Section */}
      <div
        id="settings-card-supabase"
        className="card-bg rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm"
      >
        <div
          onClick={() => setActiveSettingsSection('supabase')}
          className="p-5 text-slate-900 dark:text-white font-bold text-sm cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 flex justify-between items-center select-none transition-colors"
        >
          <div className="flex items-center gap-2.5">
            <Cloud className="w-4 h-4 text-emerald-500" />
            <div className="flex items-center gap-2">
              <span>Supabase Cloud Database</span>
              {supabaseSyncStatus.connected ? (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  Connected
                </span>
              ) : isSupabaseConfigured ? (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20">
                  Configured
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/20">
                  Ready to Connect
                </span>
              )}
            </div>
          </div>
          <span className="text-indigo-600 dark:text-indigo-400 text-xs font-mono">
            {activeSettingsSection === 'supabase' ? '▼' : '►'}
          </span>
        </div>

        {activeSettingsSection === 'supabase' && (
          <div className="p-6 pt-0 space-y-4 border-t border-slate-200 dark:border-slate-800 animate-in fade-in">
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-3 leading-relaxed">
              Connect your lending portfolio directly to your Supabase PostgreSQL cloud backend.
              All active loans, schedules, payments, capital funds, and collector ledger records sync safely.
            </p>

            {supabaseMsg && (
              <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-xl text-xs text-indigo-600 dark:text-indigo-400 flex items-center gap-2">
                <FileCheck className="w-4 h-4" />
                <span>{supabaseMsg}</span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Supabase Project URL
                </label>
                <input
                  type="text"
                  placeholder="https://xyzcompany.supabase.co"
                  value={supabaseUrl}
                  onChange={(e) => setSupabaseUrl(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Supabase Anon Public API Key
                </label>
                <div className="relative">
                  <input
                    type="password"
                    placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                    value={supabaseKey}
                    onChange={(e) => setSupabaseKey(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500 font-mono"
                  />
                  <Key className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-2.5 pointer-events-none" />
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                onClick={async () => {
                  setSupabaseMsg('Verifying and saving connection...');
                  const res = await saveSupabaseSettings(supabaseUrl, supabaseKey);
                  setSupabaseMsg(res.message);
                  setTimeout(() => setSupabaseMsg(null), 5000);
                }}
                disabled={supabaseSyncStatus.syncing}
                className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold text-xs px-4 py-2.5 rounded-xl transition-all shadow-sm shadow-indigo-600/20 flex items-center gap-2 cursor-pointer active:scale-[0.98]"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${supabaseSyncStatus.syncing ? 'animate-spin' : ''}`} />
                <span>Save & Connect</span>
              </button>

              <button
                onClick={async () => {
                  setSupabaseMsg('Syncing local portfolio to Supabase...');
                  const res = await pushToSupabase();
                  setSupabaseMsg(res.message);
                  setTimeout(() => setSupabaseMsg(null), 5000);
                }}
                disabled={supabaseSyncStatus.syncing || !isSupabaseConfigured}
                className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-40 text-slate-700 dark:text-slate-200 font-semibold text-xs px-4 py-2.5 rounded-xl transition-colors border border-slate-200 dark:border-slate-700 flex items-center gap-2 cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                <span>Push Local to Supabase</span>
              </button>

              <button
                onClick={async () => {
                  setSupabaseMsg('Pulling remote records from Supabase...');
                  const res = await pullFromSupabase();
                  setSupabaseMsg(res.message);
                  setTimeout(() => setSupabaseMsg(null), 5000);
                }}
                disabled={supabaseSyncStatus.syncing || !isSupabaseConfigured}
                className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-40 text-slate-700 dark:text-slate-200 font-semibold text-xs px-4 py-2.5 rounded-xl transition-colors border border-slate-200 dark:border-slate-700 flex items-center gap-2 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Pull from Supabase</span>
              </button>

              <button
                onClick={() => setShowSql(!showSql)}
                className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline px-2 py-2 cursor-pointer ml-auto"
              >
                {showSql ? 'Hide SQL Script ▲' : 'View Supabase SQL Script ▼'}
              </button>
            </div>

            {showSql && (
              <div className="mt-3 p-4 bg-slate-900 rounded-xl border border-slate-800 text-slate-300 text-xs font-mono relative">
                <div className="flex justify-between items-center mb-2 pb-2 border-b border-slate-800">
                  <span className="text-slate-400 text-[11px]">Run in Supabase SQL Editor:</span>
                  <button
                    onClick={() => {
                      const sql = `CREATE TABLE IF NOT EXISTS public.portfolio_sync (
    id TEXT PRIMARY KEY,
    borrowers JSONB NOT NULL DEFAULT '[]'::jsonb,
    capital_sources JSONB NOT NULL DEFAULT '[]'::jsonb,
    collectors JSONB NOT NULL DEFAULT '[]'::jsonb,
    assignments JSONB NOT NULL DEFAULT '[]'::jsonb,
    collector_cashouts JSONB NOT NULL DEFAULT '[]'::jsonb,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.portfolio_sync ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read access" ON public.portfolio_sync;
DROP POLICY IF EXISTS "Allow public insert access" ON public.portfolio_sync;
DROP POLICY IF EXISTS "Allow public update access" ON public.portfolio_sync;
DROP POLICY IF EXISTS "Allow public delete access" ON public.portfolio_sync;
DROP POLICY IF EXISTS "Allow full public access" ON public.portfolio_sync;

CREATE POLICY "Allow full public access" ON public.portfolio_sync FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);`;
                      navigator.clipboard.writeText(sql);
                      setCopiedSql(true);
                      setTimeout(() => setCopiedSql(false), 3000);
                    }}
                    className="flex items-center gap-1 text-[11px] text-indigo-400 hover:text-indigo-300 bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-700 cursor-pointer"
                  >
                    {copiedSql ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedSql ? 'Copied SQL!' : 'Copy SQL'}</span>
                  </button>
                </div>
                <pre className="overflow-x-auto text-[11px] text-slate-300 leading-relaxed">
{`CREATE TABLE IF NOT EXISTS public.portfolio_sync (
    id TEXT PRIMARY KEY,
    borrowers JSONB NOT NULL DEFAULT '[]'::jsonb,
    capital_sources JSONB NOT NULL DEFAULT '[]'::jsonb,
    collectors JSONB NOT NULL DEFAULT '[]'::jsonb,
    assignments JSONB NOT NULL DEFAULT '[]'::jsonb,
    collector_cashouts JSONB NOT NULL DEFAULT '[]'::jsonb,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.portfolio_sync ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read access" ON public.portfolio_sync;
DROP POLICY IF EXISTS "Allow public insert access" ON public.portfolio_sync;
DROP POLICY IF EXISTS "Allow public update access" ON public.portfolio_sync;
DROP POLICY IF EXISTS "Allow public delete access" ON public.portfolio_sync;
DROP POLICY IF EXISTS "Allow full public access" ON public.portfolio_sync;

CREATE POLICY "Allow full public access" ON public.portfolio_sync FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);`}
                </pre>
              </div>
            )}

            {supabaseSyncStatus.message && (
              <p className="text-[11px] text-slate-500 dark:text-slate-400 pt-1">
                Status: {supabaseSyncStatus.message}
                {supabaseSyncStatus.lastSynced && ` • Last synced at ${supabaseSyncStatus.lastSynced}`}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Daily Collection Sheet Section */}
      <div
        id="settings-card-dcs"
        className="card-bg rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm"
      >
        <div
          onClick={() => setActiveSettingsSection('dcs')}
          className="p-5 text-slate-900 dark:text-white font-bold text-sm cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 flex justify-between items-center select-none transition-colors"
        >
          <div className="flex items-center gap-2.5">
            <CalendarCheck className="w-4 h-4 text-emerald-500" />
            <span>Daily Collection Sheet</span>
          </div>
          <span className="text-indigo-600 dark:text-indigo-400 text-xs font-mono">
            {activeSettingsSection === 'dcs' ? '▼' : '►'}
          </span>
        </div>

        {activeSettingsSection === 'dcs' && (
          <div className="p-6 pt-0 space-y-4 border-t border-slate-200 dark:border-slate-800 animate-in fade-in">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mt-3">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Inspect installments due for collection on the selected date:
              </p>
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={dcsDate}
                  onChange={(e) => setDcsDate(e.target.value)}
                  className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-indigo-500 font-medium"
                />
                <button
                  onClick={() => setCurrentView('collection-sheet')}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs px-3.5 py-1.5 rounded-xl transition-all shadow-sm shadow-indigo-600/20 flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Full Sheet</span>
                </button>
              </div>
            </div>

            <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
              <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
                <thead className="bg-slate-50 dark:bg-slate-900/90 uppercase text-[10px] text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="px-4 py-2.5">Borrower Name</th>
                    <th className="px-4 py-2.5">Contact No.</th>
                    <th className="px-4 py-2.5">Collector</th>
                    <th className="px-4 py-2.5">Installment #</th>
                    <th className="px-4 py-2.5">Amount Due</th>
                    <th className="px-4 py-2.5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/80 dark:divide-slate-800">
                  {scheduledToday.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                      <td className="px-4 py-2.5 font-semibold text-slate-900 dark:text-white">{item.borrowerName}</td>
                      <td className="px-4 py-2.5 text-slate-500 dark:text-slate-400">{item.contact}</td>
                      <td className="px-4 py-2.5 text-indigo-600 dark:text-indigo-400 font-medium">{item.collectorName}</td>
                      <td className="px-4 py-2.5 text-slate-600 dark:text-slate-300">#{item.installmentNo}</td>
                      <td className="px-4 py-2.5 text-emerald-600 dark:text-emerald-400 font-bold">
                        {formatCurrency(item.balance)}
                      </td>
                      <td className="px-4 py-2.5">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            item.status === 'Paid'
                              ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20'
                              : 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20'
                          }`}
                        >
                          {item.status}
                        </span>
                      </td>
                    </tr>
                  ))}

                  {scheduledToday.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-4 py-6 text-center text-slate-400 dark:text-slate-500">
                        No installments due on {formatDateToWords(dcsDate)}.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Danger Zone (Reset Data) Section */}
      <div
        id="settings-card-danger"
        className="card-bg rounded-2xl overflow-hidden border border-rose-200 dark:border-rose-900/40 shadow-sm"
      >
        <div
          onClick={() => setActiveSettingsSection('danger')}
          className="p-5 text-rose-600 dark:text-rose-400 font-bold text-sm cursor-pointer hover:bg-rose-50/50 dark:hover:bg-rose-950/20 flex justify-between items-center select-none transition-colors"
        >
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-4 h-4 text-rose-500" />
            <span>Danger Zone (Reset Data)</span>
          </div>
          <span className="text-rose-500 text-xs font-mono">
            {activeSettingsSection === 'danger' ? '▼' : '►'}
          </span>
        </div>

        {activeSettingsSection === 'danger' && (
          <div className="p-6 pt-0 space-y-4 border-t border-rose-200 dark:border-rose-900/40 animate-in fade-in">
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-3 leading-relaxed">
              Permanently erase all portfolio records, borrowers, active loans, ledgers, capital sources,
              and payment histories from browser storage and your connected Supabase cloud database.
            </p>
            <div className="pt-1">
              <button
                onClick={onOpenResetModal}
                className="bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs px-4 py-2.5 rounded-xl transition-all shadow-sm shadow-rose-600/20 flex items-center gap-2 cursor-pointer active:scale-[0.98]"
              >
                <AlertTriangle className="w-4 h-4" />
                <span>Reset All Portfolio & Supabase Data</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
