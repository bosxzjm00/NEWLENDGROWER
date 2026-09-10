import React, { useState } from 'react';
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
  Cloud,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Key,
  Globe,
  ArrowUpCircle,
  ArrowDownCircle,
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

  const initialConfig = getSupabaseConfig();
  const [supabaseUrl, setSupabaseUrl] = useState(initialConfig.url || '');
  const [supabaseAnonKey, setSupabaseAnonKey] = useState(initialConfig.key || '');
  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [dcsDate, setDcsDate] = useState(getTodayIsoString());
  const [importStatus, setImportStatus] = useState<string | null>(null);

  const handleSaveSupabase = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveStatus(null);
    try {
      const res = await saveSupabaseSettings(supabaseUrl.trim(), supabaseAnonKey.trim());
      setSaveStatus(res.message || (res.success ? 'Supabase connected successfully!' : 'Failed to connect.'));
    } catch {
      setSaveStatus('Error saving Supabase configuration.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleManualPush = async () => {
    const res = await pushToSupabase();
    setSaveStatus(res.message);
  };

  const handleManualPull = async () => {
    if (window.confirm('Pull latest data from Supabase? This will replace your local records with cloud data.')) {
      const res = await pullFromSupabase();
      setSaveStatus(res.message);
    }
  };

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

      {/* Supabase Cloud Sync Section */}
      <div
        id="settings-card-supabase"
        className="card-bg rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm"
      >
        <div
          onClick={() => setActiveSettingsSection('supabase')}
          className="p-5 text-slate-900 dark:text-white font-bold text-sm cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 flex justify-between items-center select-none transition-colors"
        >
          <div className="flex items-center gap-2.5">
            <Cloud className="w-4 h-4 text-cyan-500" />
            <span>Supabase Cloud Database & Sync</span>
            {isSupabaseConfigured && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20 font-semibold">
                Configured
              </span>
            )}
          </div>
          <span className="text-cyan-600 dark:text-cyan-400 text-xs font-mono">
            {activeSettingsSection === 'supabase' ? '▼' : '►'}
          </span>
        </div>

        {activeSettingsSection === 'supabase' && (
          <div className="p-6 pt-0 space-y-5 border-t border-slate-200 dark:border-slate-800 animate-in fade-in">
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-3 leading-relaxed">
              Connect your portfolio to a free Supabase Postgres database. This enables real-time synchronization between your 
              <strong> PC and mobile devices</strong> so changes appear on all screens automatically.
            </p>

            {/* Connection Status Badge */}
            <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                {supabaseSyncStatus.connected ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                ) : (
                  <XCircle className="w-4 h-4 text-rose-500 shrink-0" />
                )}
                <div>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {supabaseSyncStatus.connected ? 'Cloud Connected' : 'Not Connected'}
                  </span>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    {supabaseSyncStatus.message}
                    {supabaseSyncStatus.lastSynced && ` • Last synced at ${supabaseSyncStatus.lastSynced}`}
                  </p>
                </div>
              </div>
              {supabaseSyncStatus.syncing && (
                <RefreshCw className="w-4 h-4 text-cyan-500 animate-spin" />
              )}
            </div>

            {saveStatus && (
              <div className="p-3 bg-cyan-50 dark:bg-cyan-900/20 border border-cyan-200 dark:border-cyan-800 rounded-xl text-xs text-cyan-700 dark:text-cyan-300 flex items-center gap-2">
                <FileCheck className="w-4 h-4 shrink-0" />
                <span>{saveStatus}</span>
              </div>
            )}

            {/* Credentials Form */}
            <form onSubmit={handleSaveSupabase} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-slate-400" />
                  <span>Supabase Project URL</span>
                </label>
                <input
                  type="text"
                  placeholder="https://your-project-id.supabase.co"
                  value={supabaseUrl}
                  onChange={(e) => setSupabaseUrl(e.target.value)}
                  className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-cyan-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-slate-400" />
                  <span>Supabase Anon / Public API Key</span>
                </label>
                <input
                  type="password"
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  value={supabaseAnonKey}
                  onChange={(e) => setSupabaseAnonKey(e.target.value)}
                  className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-cyan-500 font-mono"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-1">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="bg-cyan-600 hover:bg-cyan-700 text-white font-semibold text-xs px-4 py-2.5 rounded-xl transition-all shadow-sm shadow-cyan-600/20 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isSaving ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Testing & Saving...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Save & Test Connection</span>
                    </>
                  )}
                </button>

                {isSupabaseConfigured && (
                  <>
                    <button
                      type="button"
                      onClick={handleManualPush}
                      className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs px-3.5 py-2.5 rounded-xl transition-colors border border-slate-200 dark:border-slate-700 flex items-center gap-1.5 cursor-pointer"
                      title="Upload all current local data to Supabase"
                    >
                      <ArrowUpCircle className="w-3.5 h-3.5 text-cyan-500" />
                      <span>Push Local to Cloud</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleManualPull}
                      className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs px-3.5 py-2.5 rounded-xl transition-colors border border-slate-200 dark:border-slate-700 flex items-center gap-1.5 cursor-pointer"
                      title="Download latest data from Supabase to this device"
                    >
                      <ArrowDownCircle className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Pull Cloud to This Device</span>
                    </button>
                  </>
                )}
              </div>
            </form>
          </div>
        )}
      </div>
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
