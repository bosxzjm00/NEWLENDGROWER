import React from 'react';
import { useApp } from '../context/AppContext';
import { formatCurrency } from '../utils/formatters';
import { UserCheck, Plus, Trash2, ArrowRight } from 'lucide-react';

interface CollectorsViewProps {
  onOpenAddCollector: () => void;
  onOpenAssignLoan: (collectorId: string) => void;
}

export const CollectorsView: React.FC<CollectorsViewProps> = ({
  onOpenAddCollector,
  onOpenAssignLoan,
}) => {
  const {
    collectors,
    deleteCollector,
    getCollectorStats,
    globalSearch,
    setSelectedCollectorId,
    setCurrentView,
    collectorCashouts,
  } = useApp();

  const filteredCollectors = collectors.filter((col) => {
    if (!globalSearch) return true;
    const q = globalSearch.toLowerCase();
    return (
      col.name.toLowerCase().includes(q) ||
      col.contact.toLowerCase().includes(q) ||
      col.address.toLowerCase().includes(q)
    );
  });

  // Aggregated totals across all collectors
  let grandTotalAssigned = 0;
  let grandTotalUnpaid = 0;
  let grandTotalCommission = 0;

  collectors.forEach((col) => {
    const s = getCollectorStats(col.id);
    grandTotalAssigned += s.totalAssignedAmount;
    grandTotalUnpaid += s.totalUnpaid;
    grandTotalCommission += s.earnedCommission;
  });

  const grandTotalCashout = collectorCashouts.reduce((sum, co) => sum + co.amount, 0);

  const handleDelete = (id: string, name: string) => {
    if (
      window.confirm(
        `Are you sure you want to delete collector profile "${name}"? All assignments and records will be unlinked.`
      )
    ) {
      deleteCollector(id);
    }
  };

  const handleOpenLoans = (collectorId: string) => {
    setSelectedCollectorId(collectorId);
    setCurrentView('collector-loans');
  };

  return (
    <div id="view-collectors" className="space-y-6 animate-in fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Collectors Management</h2>
          <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-1 font-medium">
            Manage collector profiles and track assigned loans & commission shares
          </p>
        </div>
        <button
          onClick={onOpenAddCollector}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 shadow-lg shadow-indigo-600/20 cursor-pointer active:scale-[0.98]"
        >
          <Plus className="w-4 h-4" />
          <span>Add Collector Profile</span>
        </button>
      </div>

      {/* 4 Collector Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="card-bg p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex justify-between items-center text-[10px] text-slate-500 dark:text-slate-400 font-semibold tracking-wider uppercase mb-2">
            <span>TOTAL ASSIGNED LOANS</span>
            <span className="text-indigo-500 font-bold">₱</span>
          </div>
          <div className="text-indigo-600 dark:text-indigo-400 font-bold text-lg mb-1" id="collectors-stat-assigned">
            {formatCurrency(grandTotalAssigned)}
          </div>
          <div className="text-[10px] text-slate-400 dark:text-slate-500">Initial principal of assigned loans</div>
        </div>

        <div className="card-bg p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex justify-between items-center text-[10px] text-slate-500 dark:text-slate-400 font-semibold tracking-wider uppercase mb-2">
            <span>TOTAL UNPAID</span>
            <span className="text-rose-500 font-bold">⚠️</span>
          </div>
          <div className="text-rose-600 dark:text-rose-400 font-bold text-lg mb-1" id="collectors-stat-unpaid">
            {formatCurrency(grandTotalUnpaid)}
          </div>
          <div className="text-[10px] text-slate-400 dark:text-slate-500">Remaining balance across assigned loans</div>
        </div>

        <div className="card-bg p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex justify-between items-center text-[10px] text-slate-500 dark:text-slate-400 font-semibold tracking-wider uppercase mb-2">
            <span>TOTAL COMMISSION</span>
            <span className="text-emerald-500 font-bold">↗</span>
          </div>
          <div className="text-emerald-600 dark:text-emerald-400 font-bold text-lg mb-1" id="collectors-stat-commission">
            {formatCurrency(grandTotalCommission)}
          </div>
          <div className="text-[10px] text-slate-400 dark:text-slate-500">25% of interest from collected payments</div>
        </div>

        <div className="card-bg p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex justify-between items-center text-[10px] text-slate-500 dark:text-slate-400 font-semibold tracking-wider uppercase mb-2">
            <span>COMMISSION DISBURSED</span>
            <span className="text-indigo-500 font-bold">↗</span>
          </div>
          <div className="text-slate-900 dark:text-white font-bold text-lg mb-1" id="collectors-stat-cashout">
            {formatCurrency(grandTotalCashout)}
          </div>
          <div className="text-[10px] text-slate-400 dark:text-slate-500">Collectors cash out</div>
        </div>
      </div>

      <div className="card-bg rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
            <thead className="bg-slate-50 dark:bg-slate-900/90 uppercase text-[10px] text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-5 py-3.5 whitespace-nowrap">Collector Name</th>
                <th className="px-5 py-3.5 whitespace-nowrap">Contact No.</th>
                <th className="px-5 py-3.5 whitespace-nowrap">Address</th>
                <th className="px-5 py-3.5 whitespace-nowrap">Assigned Loans</th>
                <th className="px-5 py-3.5 whitespace-nowrap">Fully Paid</th>
                <th className="px-5 py-3.5 whitespace-nowrap">Total Loan Amount</th>
                <th className="px-5 py-3.5 whitespace-nowrap">Total Unpaid</th>
                <th className="px-5 py-3.5 whitespace-nowrap">Total Commission</th>
                <th className="px-5 py-3.5 text-right whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody id="collectors-table-body" className="divide-y divide-slate-200/80 dark:divide-slate-800">
              {filteredCollectors.map((col) => {
                const s = getCollectorStats(col.id);

                return (
                  <tr key={col.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors group">
                    <td
                      onClick={() => handleOpenLoans(col.id)}
                      className="px-5 py-4 font-semibold text-slate-900 dark:text-white cursor-pointer hover:text-indigo-600 dark:hover:text-indigo-400 whitespace-nowrap flex items-center gap-1.5"
                    >
                      <span>{col.name}</span>
                      <ArrowRight className="w-3.5 h-3.5 text-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </td>
                    <td className="px-5 py-4 text-slate-500 dark:text-slate-400 whitespace-nowrap">{col.contact}</td>
                    <td className="px-5 py-4 text-slate-500 dark:text-slate-400 max-w-[160px] truncate" title={col.address}>
                      {col.address}
                    </td>
                    <td className="px-5 py-4 text-indigo-600 dark:text-indigo-400 font-semibold whitespace-nowrap">
                      {s.assignedCount}
                    </td>
                    <td className="px-5 py-4 text-emerald-600 dark:text-emerald-400 font-semibold whitespace-nowrap">
                      {s.fullyPaidCount}
                    </td>
                    <td className="px-5 py-4 text-indigo-600 dark:text-indigo-400 font-semibold whitespace-nowrap">
                      {formatCurrency(s.totalAssignedAmount)}
                    </td>
                    <td className="px-5 py-4 text-rose-600 dark:text-rose-400 font-semibold whitespace-nowrap">
                      {formatCurrency(s.totalUnpaid)}
                    </td>
                    <td className="px-5 py-4 text-emerald-600 dark:text-emerald-400 font-semibold whitespace-nowrap">
                      {formatCurrency(s.earnedCommission)}
                    </td>
                    <td className="px-5 py-4 text-right whitespace-nowrap space-x-1.5">
                      <button
                        onClick={() => onOpenAssignLoan(col.id)}
                        className="bg-indigo-50 dark:bg-indigo-900/30 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 font-semibold px-2.5 py-1 rounded-lg transition-colors border border-indigo-200 dark:border-indigo-800 text-xs cursor-pointer"
                        title="Assign Borrower Loan"
                      >
                        + Assign
                      </button>
                      <button
                        onClick={() => handleDelete(col.id, col.name)}
                        className="bg-rose-50 dark:bg-rose-900/30 hover:bg-rose-100 dark:hover:bg-rose-900/50 text-rose-600 dark:text-rose-400 font-semibold px-2 py-1 rounded-lg transition-colors border border-rose-200 dark:border-rose-800 text-xs cursor-pointer"
                        title="Delete Collector"
                      >
                        ×
                      </button>
                    </td>
                  </tr>
                );
              })}

              {filteredCollectors.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center text-gray-500">
                    <UserCheck className="w-8 h-8 mx-auto mb-2 text-gray-600" />
                    <p className="text-sm">No collector profiles registered yet.</p>
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
