import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { formatCurrency } from '../utils/formatters';
import { ArrowLeft, Trash2, Users, Plus } from 'lucide-react';
import { ConfirmDeleteModal } from '../components/modals/ConfirmDeleteModal';

interface CollectorLoansViewProps {
  onOpenAssignLoan: (collectorId: string) => void;
}

export const CollectorLoansView: React.FC<CollectorLoansViewProps> = ({ onOpenAssignLoan }) => {
  const {
    collectors,
    selectedCollectorId,
    borrowers,
    assignments,
    unassignLoan,
    setCurrentView,
    getCollectorStats,
    globalSearch,
  } = useApp();

  const collector = collectors.find((c) => c.id === selectedCollectorId);

  if (!collector) {
    return (
      <div className="card-bg p-8 rounded-2xl border border-slate-200 dark:border-slate-800 text-center space-y-4 max-w-md mx-auto my-12">
        <p className="text-slate-600 dark:text-slate-400 text-sm">Collector profile not found.</p>
        <button
          onClick={() => setCurrentView('collectors')}
          className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition-all shadow-lg shadow-indigo-600/20 active:scale-[0.98] cursor-pointer"
        >
          ← Back to Collectors
        </button>
      </div>
    );
  }

  const assignedPairs = assignments.filter((a) => a.collectorId === collector.id);

  const assignedBorrowers = assignedPairs
    .map((asg) => {
      const b = borrowers.find((borrower) => borrower.id === asg.borrowerId);
      return { asgId: asg.id, borrower: b };
    })
    .filter((item) => {
      if (!item.borrower) return false;
      if (!globalSearch) return true;
      const q = globalSearch.toLowerCase();
      return (
        item.borrower.name.toLowerCase().includes(q) ||
        item.borrower.contact.toLowerCase().includes(q)
      );
    });

  const stats = getCollectorStats(collector.id);

  const [unassignTarget, setUnassignTarget] = useState<{ asgId: string; borrowerName: string } | null>(null);

  const handleUnassign = (asgId: string, borrowerName: string) => {
    setUnassignTarget({ asgId, borrowerName });
  };

  return (
    <div id="view-collector-loans" className="space-y-6 animate-in fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentView('collectors')}
              className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight" id="collector-loans-title">
              Assigned Loans — {collector.name}
            </h2>
          </div>
          <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-1 pl-8 font-medium">
            Manage portfolio accounts assigned to this collector
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onOpenAssignLoan(collector.id)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 shadow-lg shadow-indigo-600/20 cursor-pointer active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" />
            <span>Assign New Loan</span>
          </button>
          <button
            onClick={() => setCurrentView('collectors')}
            className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
          >
            ← Back to Collectors
          </button>
        </div>
      </div>

      {/* 5 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        <div className="card-bg p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex justify-between items-center text-[10px] text-slate-500 dark:text-slate-400 font-semibold tracking-wider mb-2">
            <span>TOTAL ASSIGNED LOAN AMOUNT</span>
            <span className="text-indigo-600 dark:text-indigo-400 font-bold">₱</span>
          </div>
          <div className="text-indigo-600 dark:text-indigo-400 font-bold text-base mb-1" id="collector-stat-assigned">
            {formatCurrency(stats.totalAssignedAmount)}
          </div>
          <div className="text-[10px] text-slate-400 dark:text-slate-500">Initial principal of assigned loans</div>
        </div>

        <div className="card-bg p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex justify-between items-center text-[10px] text-slate-500 dark:text-slate-400 font-semibold tracking-wider mb-2">
            <span>TOTAL UNPAID</span>
            <span className="text-rose-500 font-bold">⚠️</span>
          </div>
          <div className="text-rose-600 dark:text-rose-400 font-bold text-base mb-1" id="collector-stat-unpaid">
            {formatCurrency(stats.totalUnpaid)}
          </div>
          <div className="text-[10px] text-slate-400 dark:text-slate-500">Remaining balance on assigned loans</div>
        </div>

        <div className="card-bg p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex justify-between items-center text-[10px] text-slate-500 dark:text-slate-400 font-semibold tracking-wider mb-2">
            <span>TOTAL COMMISSION</span>
            <span className="text-emerald-500 font-bold">↗</span>
          </div>
          <div className="text-emerald-600 dark:text-emerald-400 font-bold text-base mb-1" id="collector-stat-commission">
            {formatCurrency(stats.earnedCommission)}
          </div>
          <div className="text-[10px] text-slate-400 dark:text-slate-500">25% of interest from collected payments</div>
        </div>

        <div className="card-bg p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex justify-between items-center text-[10px] text-slate-500 dark:text-slate-400 font-semibold tracking-wider mb-2">
            <span>TOTAL CASH OUT</span>
            <span className="text-indigo-600 dark:text-indigo-400 font-bold">↗</span>
          </div>
          <div className="text-indigo-600 dark:text-indigo-400 font-bold text-base mb-1" id="collector-stat-cashout">
            {formatCurrency(stats.cashedOutCommission)}
          </div>
          <div className="text-[10px] text-slate-400 dark:text-slate-500">Collectors cash out</div>
        </div>

        <div className="card-bg p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex justify-between items-center text-[10px] text-slate-500 dark:text-slate-400 font-semibold tracking-wider mb-2">
            <span>TOTAL AMOUNT COLLECTED</span>
            <span className="text-amber-500 font-bold">↗</span>
          </div>
          <div className="text-amber-600 dark:text-amber-400 font-bold text-base mb-1" id="collector-stat-total-collected">
            {formatCurrency(stats.totalAmountCollected)}
          </div>
          <div className="text-[10px] text-slate-400 dark:text-slate-500">Total payment of all assigned borrowers</div>
        </div>
      </div>

      <div className="card-bg rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full table-auto text-left text-[11px] sm:text-xs text-slate-700 dark:text-slate-300">
            <thead className="bg-slate-50 dark:bg-slate-900/90 uppercase text-[10px] text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-3 sm:px-4 lg:px-6 py-3.5 whitespace-nowrap">Borrower Name</th>
                <th className="px-3 sm:px-4 lg:px-6 py-3.5 whitespace-nowrap">Contact No.</th>
                <th className="px-3 sm:px-4 lg:px-6 py-3.5 whitespace-nowrap">Loan Amount</th>
                <th className="px-3 sm:px-4 lg:px-6 py-3.5 whitespace-nowrap">Total Payable</th>
                <th className="px-3 sm:px-4 lg:px-6 py-3.5 whitespace-nowrap">Status</th>
                <th className="px-3 sm:px-4 lg:px-6 py-3.5 text-right whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody id="collector-loans-table-body" className="divide-y divide-slate-200/80 dark:divide-slate-800">
              {assignedBorrowers.map(({ asgId, borrower }) => {
                if (!borrower) return null;
                const totalPaid = borrower.schedules.reduce((sum, s) => sum + s.amount_paid, 0);

                return (
                  <tr key={asgId} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="px-3 sm:px-4 lg:px-6 py-3 sm:py-3.5 font-semibold text-slate-900 dark:text-white whitespace-nowrap">
                      {borrower.name}
                    </td>
                    <td className="px-3 sm:px-4 lg:px-6 py-3 sm:py-3.5 text-slate-500 dark:text-slate-400 whitespace-nowrap">{borrower.contact}</td>
                    <td className="px-3 sm:px-4 lg:px-6 py-3 sm:py-3.5 text-indigo-600 dark:text-indigo-400 font-semibold whitespace-nowrap tabular-nums">
                      {formatCurrency(borrower.amount)}
                    </td>
                    <td className="px-3 sm:px-4 lg:px-6 py-3 sm:py-3.5 text-emerald-600 dark:text-emerald-400 font-semibold whitespace-nowrap tabular-nums">
                      {formatCurrency(borrower.total_payable)}
                    </td>
                    <td className="px-3 sm:px-4 lg:px-6 py-3 sm:py-3.5 whitespace-nowrap">
                      {borrower.is_fully_paid ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20">
                          Fully Paid ✓
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/20">
                          Active ({formatCurrency(totalPaid)} paid)
                        </span>
                      )}
                    </td>
                    <td className="px-3 sm:px-4 lg:px-6 py-3 sm:py-3.5 text-right whitespace-nowrap">
                      <button
                        onClick={() => handleUnassign(asgId, borrower.name)}
                        className="bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 font-medium px-2.5 py-1 rounded-lg transition-colors border border-rose-200 dark:border-rose-500/20 text-xs cursor-pointer"
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                );
              })}

              {assignedBorrowers.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    <Users className="w-8 h-8 mx-auto mb-2 text-gray-600" />
                    <p className="text-sm">No active loans assigned to this collector.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ConfirmDeleteModal
        isOpen={Boolean(unassignTarget)}
        title="Unassign Borrower Loan"
        subtitle="Collector loan reassignment"
        message={
          <span>
            Are you sure you want to unassign borrower{' '}
            <strong className="text-slate-900 dark:text-white font-semibold">
              "{unassignTarget?.borrowerName}"
            </strong>{' '}
            from collector <strong className="text-slate-900 dark:text-white font-semibold">{collector.name}</strong>?
          </span>
        }
        confirmLabel="Yes, Unassign Loan"
        onConfirm={() => {
          if (unassignTarget) {
            unassignLoan(unassignTarget.asgId);
            setUnassignTarget(null);
          }
        }}
        onClose={() => setUnassignTarget(null)}
      />
    </div>
  );
};
