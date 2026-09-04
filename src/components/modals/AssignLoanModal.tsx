import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { formatCurrency } from '../../utils/formatters';
import { UserCheck, X } from 'lucide-react';

interface AssignLoanModalProps {
  isOpen: boolean;
  onClose: () => void;
  collectorId: string | null;
}

export const AssignLoanModal: React.FC<AssignLoanModalProps> = ({
  isOpen,
  onClose,
  collectorId,
}) => {
  const { collectors, borrowers, assignments, assignLoan } = useApp();
  const [selectedBorrowerId, setSelectedBorrowerId] = useState('');

  const targetCollector = collectors.find((c) => c.id === collectorId);

  // Active borrowers not currently assigned to this collector
  const activeUnassignedBorrowers = borrowers.filter((b) => {
    if (b.is_fully_paid) return false;
    const currentAsg = assignments.find((a) => a.borrowerId === b.id);
    return !currentAsg || currentAsg.collectorId !== collectorId;
  });

  useEffect(() => {
    if (isOpen && activeUnassignedBorrowers.length > 0) {
      setSelectedBorrowerId(activeUnassignedBorrowers[0].id);
    } else {
      setSelectedBorrowerId('');
    }
  }, [isOpen, collectorId]);

  if (!isOpen || !collectorId) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBorrowerId) return;

    assignLoan(collectorId, selectedBorrowerId);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in">
      <div className="card-bg w-full max-w-md p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl">
        <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-600/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <UserCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-slate-900 dark:text-white font-bold text-sm">Assign Borrower Loan</h3>
              <p className="text-[11px] text-indigo-600 dark:text-indigo-400 font-medium">To Collector: {targetCollector?.name}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          <div>
            <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">
              Select Active Borrower & Loan *
            </label>
            {activeUnassignedBorrowers.length === 0 ? (
              <p className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl text-slate-500 dark:text-slate-400 text-center border border-slate-200 dark:border-slate-700">
                No unassigned active borrowers available.
              </p>
            ) : (
              <select
                required
                value={selectedBorrowerId}
                onChange={(e) => setSelectedBorrowerId(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 cursor-pointer font-medium"
              >
                {activeUnassignedBorrowers.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name} — Principal: {formatCurrency(b.amount)} (Total:{' '}
                    {formatCurrency(b.total_payable)})
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="pt-3 flex justify-end gap-2 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 font-semibold transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!selectedBorrowerId}
              className={`px-4 py-2 rounded-xl font-semibold transition-all cursor-pointer ${
                !selectedBorrowerId
                  ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed'
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-600/20 active:scale-[0.98]'
              }`}
            >
              Assign Loan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
