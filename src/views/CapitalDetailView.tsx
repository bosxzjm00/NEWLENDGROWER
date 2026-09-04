import React from 'react';
import { useApp } from '../context/AppContext';
import { formatCurrency, formatDateToWords } from '../utils/formatters';
import { Plus, ArrowLeft, Trash2, Coins } from 'lucide-react';

interface CapitalDetailViewProps {
  onOpenAddInvestment: () => void;
}

export const CapitalDetailView: React.FC<CapitalDetailViewProps> = ({ onOpenAddInvestment }) => {
  const {
    capitalSources,
    selectedCapitalId,
    deleteCapitalTransaction,
    setCurrentView,
    globalSearch,
  } = useApp();

  const currentCap = capitalSources.find((c) => c.id === selectedCapitalId);

  if (!currentCap) {
    return (
      <div className="card-bg p-8 rounded-2xl border border-slate-200 dark:border-slate-800 text-center space-y-4 max-w-md mx-auto my-12">
        <p className="text-slate-600 dark:text-slate-400 text-sm">Capital source not found.</p>
        <button
          onClick={() => setCurrentView('capital')}
          className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition-all shadow-lg shadow-indigo-600/20 active:scale-[0.98] cursor-pointer"
        >
          ← Back to Capital
        </button>
      </div>
    );
  }

  const transactions = (currentCap.transactions || []).filter((tx) => {
    if (!globalSearch) return true;
    return tx.notes.toLowerCase().includes(globalSearch.toLowerCase());
  });

  const handleDeleteTx = (txId: string) => {
    if (window.confirm('Are you sure you want to delete this investment entry?')) {
      deleteCapitalTransaction(currentCap.id, txId);
    }
  };

  return (
    <div id="view-capital-detail" className="space-y-6 animate-in fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentView('capital')}
              className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight" id="capital-detail-title">
              Investor / Capital Source — {currentCap.name}
            </h2>
          </div>
          <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-1 pl-8 font-medium">
            Transaction history and cumulative investment tranches (Total:{' '}
            {formatCurrency(currentCap.amount)})
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenAddInvestment}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 shadow-lg shadow-indigo-600/20 cursor-pointer active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" />
            <span>Add Investment</span>
          </button>
          <button
            onClick={() => setCurrentView('capital')}
            className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
          >
            ← Back to Capital
          </button>
        </div>
      </div>

      <div className="card-bg rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
            <thead className="bg-slate-50 dark:bg-slate-900/90 uppercase text-[10px] text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-6 py-3.5">Date</th>
                <th className="px-6 py-3.5">Amount</th>
                <th className="px-6 py-3.5">Notes / Description</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody id="capital-detail-table-body" className="divide-y divide-slate-200/80 dark:divide-slate-800">
              {transactions.map((tx) => (
                <tr key={tx.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="px-6 py-4 text-slate-500 dark:text-slate-400">{formatDateToWords(tx.date)}</td>
                  <td className="px-6 py-4 text-indigo-600 dark:text-indigo-400 font-bold">{formatCurrency(tx.amount)}</td>
                  <td className="px-6 py-4 text-slate-900 dark:text-white font-medium">{tx.notes || 'Investment'}</td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => handleDeleteTx(tx.id)}
                      className="px-2.5 py-1 rounded-lg bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-500/20 text-xs font-medium cursor-pointer transition-colors"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}

              {transactions.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                    <Coins className="w-8 h-8 mx-auto mb-2 text-gray-600" />
                    <p className="text-sm">No investment transactions recorded yet.</p>
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
