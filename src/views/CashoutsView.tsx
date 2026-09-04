import React from 'react';
import { useApp } from '../context/AppContext';
import { formatCurrency, formatDateToWords } from '../utils/formatters';
import { TrendingDown, Plus, Trash2 } from 'lucide-react';

interface CashoutsViewProps {
  onOpenCashout: () => void;
}

export const CashoutsView: React.FC<CashoutsViewProps> = ({ onOpenCashout }) => {
  const {
    collectorCashouts,
    collectors,
    deleteCollectorCashout,
    globalSearch,
  } = useApp();

  const filteredCashouts = collectorCashouts.filter((co) => {
    const col = collectors.find((c) => c.id === co.collectorId);
    const colName = col ? col.name : 'Unknown Collector';
    if (!globalSearch) return true;
    const q = globalSearch.toLowerCase();
    return colName.toLowerCase().includes(q) || (co.notes && co.notes.toLowerCase().includes(q));
  });

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this cash out transaction?')) {
      deleteCollectorCashout(id);
    }
  };

  const totalCashedOut = collectorCashouts.reduce((sum, co) => sum + co.amount, 0);

  return (
    <div id="view-cashouts" className="space-y-6 animate-in fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Collector Cash Outs</h2>
          <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-1 font-medium">
            Manage and record commission cash out disbursements for field collectors
          </p>
        </div>
        <button
          onClick={onOpenCashout}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 shadow-lg shadow-indigo-600/20 cursor-pointer active:scale-[0.98]"
        >
          <Plus className="w-4 h-4" />
          <span>Cash Out Commission</span>
        </button>
      </div>

      {/* Overview Metric Banner */}
      <div className="card-bg p-5 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-between shadow-xs">
        <div>
          <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold tracking-wider uppercase block">
            Total Commission Disbursed (All Collectors)
          </span>
          <span className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{formatCurrency(totalCashedOut)}</span>
        </div>
        <div className="text-right text-xs text-slate-500 dark:text-slate-400">
          <span>{collectorCashouts.length} total payout transactions</span>
        </div>
      </div>

      <div className="card-bg rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
            <thead className="bg-slate-50 dark:bg-slate-900/90 uppercase text-[10px] text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-6 py-3.5 whitespace-nowrap">Date</th>
                <th className="px-6 py-3.5 whitespace-nowrap">Collector Name</th>
                <th className="px-6 py-3.5 whitespace-nowrap">Amount Cashed Out</th>
                <th className="px-6 py-3.5 whitespace-nowrap">Notes & Remarks</th>
                <th className="px-6 py-3.5 text-right whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody id="collector-cashouts-table-body" className="divide-y divide-slate-200/80 dark:divide-slate-800">
              {filteredCashouts.map((co) => {
                const col = collectors.find((c) => c.id === co.collectorId);
                const colName = col ? col.name : 'Unknown Collector';

                return (
                  <tr key={co.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="px-6 py-4 text-slate-500 dark:text-slate-400 whitespace-nowrap">
                      {formatDateToWords(co.date)}
                    </td>
                    <td className="px-6 py-4 font-semibold text-slate-900 dark:text-white whitespace-nowrap">
                      {colName}
                    </td>
                    <td className="px-6 py-4 text-emerald-600 dark:text-emerald-400 font-bold whitespace-nowrap">
                      {formatCurrency(co.amount)}
                    </td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{co.notes || '-'}</td>
                    <td className="px-6 py-4 text-right whitespace-nowrap">
                      <button
                        onClick={() => handleDelete(co.id)}
                        className="px-2.5 py-1 rounded-lg bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-500/20 text-xs font-medium cursor-pointer transition-colors"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                );
              })}

              {filteredCashouts.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    <TrendingDown className="w-8 h-8 mx-auto mb-2 text-gray-600" />
                    <p className="text-sm">No cash out records recorded yet.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
