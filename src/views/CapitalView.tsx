import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { formatCurrency, formatDateToWords } from '../utils/formatters';
import { Coins, Plus, Trash2, ArrowRight } from 'lucide-react';
import { ConfirmDeleteModal } from '../components/modals/ConfirmDeleteModal';

interface CapitalViewProps {
  onOpenAddCapital: () => void;
}

export const CapitalView: React.FC<CapitalViewProps> = ({ onOpenAddCapital }) => {
  const {
    capitalSources,
    deleteCapitalSource,
    globalSearch,
    setSelectedCapitalId,
    setCurrentView,
    stats,
  } = useApp();

  const filteredSources = capitalSources.filter((c) => {
    if (!globalSearch) return true;
    return c.name.toLowerCase().includes(globalSearch.toLowerCase());
  });

  const [capitalToDelete, setCapitalToDelete] = useState<{ id: string; name: string } | null>(null);

  const handleDelete = (id: string, name: string) => {
    setCapitalToDelete({ id, name });
  };

  const handleOpenDetail = (id: string) => {
    setSelectedCapitalId(id);
    setCurrentView('capital-detail');
  };

  return (
    <div id="view-capital" className="space-y-6 animate-in fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Capital Management</h2>
          <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-1 font-medium">
            Manage fund sources and track total available capital (Click a source to view ledger of investments)
          </p>
        </div>
        <button
          onClick={onOpenAddCapital}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 shadow-lg shadow-indigo-600/20 cursor-pointer active:scale-[0.98]"
        >
          <Plus className="w-4 h-4" />
          <span>Add Capital Source</span>
        </button>
      </div>

      {/* Overview Stat */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card-bg p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold tracking-wider uppercase block mb-1">
            Total Capital Pool
          </span>
          <span className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
            {formatCurrency(stats.totalCapitalPool)}
          </span>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">Aggregated investment equity</p>
        </div>
        <div className="card-bg p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold tracking-wider uppercase block mb-1">
            Total Capital In Circulation
          </span>
          <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
            {formatCurrency(stats.totalCapitalDisbursed)}
          </span>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">Disbursed to active borrowers</p>
        </div>
        <div className="card-bg p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold tracking-wider uppercase block mb-1">
            Unallocated Liquid Reserve
          </span>
          <span className="text-2xl font-bold text-slate-900 dark:text-white">
            {formatCurrency(Math.max(0, stats.totalCapitalPool - stats.totalCapitalDisbursed))}
          </span>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">Available for new loan originations</p>
        </div>
      </div>

      <div className="card-bg rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
            <thead className="bg-slate-50 dark:bg-slate-900/90 uppercase text-[10px] text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-6 py-3.5">Source Name / Description</th>
                <th className="px-6 py-3.5">Total Injected Amount</th>
                <th className="px-6 py-3.5">Date Added</th>
                <th className="px-6 py-3.5">Transactions Count</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody id="capital-table-body" className="divide-y divide-slate-200/80 dark:divide-slate-800">
              {filteredSources.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors group">
                  <td
                    onClick={() => handleOpenDetail(c.id)}
                    className="px-6 py-4 font-semibold text-slate-900 dark:text-white cursor-pointer hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center gap-2"
                  >
                    <span>{c.name}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </td>
                  <td className="px-6 py-4 text-indigo-600 dark:text-indigo-400 font-bold">
                    {formatCurrency(c.amount)}
                  </td>
                  <td className="px-6 py-4 text-slate-500 dark:text-slate-400">{formatDateToWords(c.date)}</td>
                  <td className="px-6 py-4 text-slate-700 dark:text-slate-300">
                    <span className="px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px] font-medium">
                      {c.transactions?.length || 1} transactions
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <button
                      onClick={() => handleOpenDetail(c.id)}
                      className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-750 text-indigo-600 dark:text-indigo-400 border border-slate-200 dark:border-slate-700 text-xs font-medium cursor-pointer transition-colors"
                    >
                      History
                    </button>
                    <button
                      onClick={() => handleDelete(c.id, c.name)}
                      className="px-2.5 py-1 rounded-lg bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-500/20 text-xs font-medium cursor-pointer transition-colors"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}

              {filteredSources.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    <Coins className="w-8 h-8 mx-auto mb-2 text-gray-600" />
                    <p className="text-sm">No capital sources found matching your search.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ConfirmDeleteModal
        isOpen={Boolean(capitalToDelete)}
        title="Delete Capital Source"
        subtitle="Permanent capital source removal"
        message={
          <span>
            Are you sure you want to delete capital source{' '}
            <strong className="text-slate-900 dark:text-white font-semibold">
              "{capitalToDelete?.name}"
            </strong>
            ? This will remove its contribution from total capital pool computations.
          </span>
        }
        confirmLabel="Yes, Delete Capital"
        onConfirm={() => {
          if (capitalToDelete) {
            deleteCapitalSource(capitalToDelete.id);
            setCapitalToDelete(null);
          }
        }}
        onClose={() => setCapitalToDelete(null)}
      />
    </div>
  );
};
