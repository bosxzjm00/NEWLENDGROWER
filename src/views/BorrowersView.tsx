import React from 'react';
import { useApp } from '../context/AppContext';
import { formatCurrency, formatBorrowerTableDate } from '../utils/formatters';
import { Users, Plus, Trash2, BookOpen, FileText, ScrollText } from 'lucide-react';

interface BorrowersViewProps {
  onOpenAddBorrower: () => void;
}

export const BorrowersView: React.FC<BorrowersViewProps> = ({ onOpenAddBorrower }) => {
  const {
    borrowers,
    deleteBorrower,
    globalSearch,
    setSelectedLedgerBorrowerId,
    setSelectedStatementBorrowerId,
    setSelectedAgreementBorrowerId,
    setCurrentView,
  } = useApp();

  const filteredBorrowers = borrowers.filter((b) => {
    if (b.is_fully_paid) return false;
    if (!globalSearch) return true;
    const q = globalSearch.toLowerCase();
    return (
      b.name.toLowerCase().includes(q) ||
      b.contact.toLowerCase().includes(q) ||
      b.address.toLowerCase().includes(q)
    );
  });

  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete borrower "${name}" and all associated schedules?`)) {
      deleteBorrower(id);
    }
  };

  const handleOpenLedger = (borrowerId: string) => {
    setSelectedLedgerBorrowerId(borrowerId);
    setCurrentView('ledger');
  };

  const handleOpenStatement = (borrowerId: string) => {
    setSelectedStatementBorrowerId(borrowerId);
    setCurrentView('statement');
  };

  const handleOpenAgreement = (borrowerId: string) => {
    setSelectedAgreementBorrowerId(borrowerId);
    setCurrentView('agreement');
  };

  return (
    <div id="view-borrowers" className="space-y-6 animate-in fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Borrowers Management</h2>
          <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-1 font-medium">
            Click a borrower's name to view their master ledger schedule
          </p>
        </div>
        <button
          onClick={onOpenAddBorrower}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 shadow-lg shadow-indigo-600/20 cursor-pointer active:scale-[0.98]"
        >
          <Plus className="w-4 h-4" />
          <span>Add Borrower & Loan</span>
        </button>
      </div>

      <div className="card-bg rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
            <thead className="bg-slate-50 dark:bg-slate-900/90 uppercase text-[10px] text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-5 py-3.5 whitespace-nowrap">Date</th>
                <th className="px-5 py-3.5 whitespace-nowrap">Borrower Name</th>
                <th className="px-5 py-3.5 whitespace-nowrap">Contact No.</th>
                <th className="px-5 py-3.5 whitespace-nowrap">Address</th>
                <th className="px-5 py-3.5 whitespace-nowrap">Loan Amount</th>
                <th className="px-5 py-3.5 whitespace-nowrap">Total Payable</th>
                <th className="px-5 py-3.5 whitespace-nowrap">Total Paid</th>
                <th className="px-5 py-3.5 whitespace-nowrap">Total Unpaid</th>
                <th className="px-5 py-3.5 text-right whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody id="borrowers-table-body" className="divide-y divide-slate-200/80 dark:divide-slate-800">
              {filteredBorrowers.map((b) => {
                const totalPaid = b.schedules.reduce((sum, s) => sum + s.amount_paid, 0);
                const totalUnpaid = Math.max(0, b.total_payable - totalPaid);

                return (
                  <tr
                    key={b.id}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors group"
                  >
                    <td className="px-5 py-4 text-slate-500 dark:text-slate-400 whitespace-nowrap">
                      {formatBorrowerTableDate(b.start_date)}
                    </td>
                    <td
                      onClick={() => handleOpenLedger(b.id)}
                      className="px-5 py-4 font-semibold text-slate-900 dark:text-white cursor-pointer hover:text-indigo-600 dark:hover:text-indigo-400 whitespace-nowrap flex items-center gap-1.5"
                    >
                      <span>{b.name}</span>
                      <span className="text-[10px] text-indigo-600 dark:text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity">
                        (view schedule)
                      </span>
                    </td>
                    <td className="px-5 py-4 text-slate-500 dark:text-slate-400 whitespace-nowrap">{b.contact}</td>
                    <td className="px-5 py-4 text-slate-500 dark:text-slate-400 max-w-[180px] truncate" title={b.address}>
                      {b.address}
                    </td>
                    <td className="px-5 py-4 text-indigo-600 dark:text-indigo-400 font-semibold whitespace-nowrap">
                      {formatCurrency(b.amount)}
                    </td>
                    <td className="px-5 py-4 text-emerald-600 dark:text-emerald-400 font-semibold whitespace-nowrap">
                      {formatCurrency(b.total_payable)}
                    </td>
                    <td className="px-5 py-4 text-emerald-600 dark:text-emerald-400 font-semibold whitespace-nowrap">
                      {formatCurrency(totalPaid)}
                    </td>
                    <td className="px-5 py-4 text-rose-600 dark:text-rose-400 font-semibold whitespace-nowrap">
                      {formatCurrency(totalUnpaid)}
                    </td>
                    <td className="px-5 py-4 text-right whitespace-nowrap space-x-1.5">
                      <button
                        onClick={() => handleOpenStatement(b.id)}
                        className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-indigo-600 dark:text-indigo-400 border border-slate-200 dark:border-slate-700 text-[11px] font-medium inline-flex items-center gap-1 cursor-pointer transition-colors"
                        title="View Account Statement"
                      >
                        <FileText className="w-3 h-3" />
                        <span>Stmt</span>
                      </button>
                      <button
                        onClick={() => handleOpenAgreement(b.id)}
                        className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-emerald-600 dark:text-emerald-400 border border-slate-200 dark:border-slate-700 text-[11px] font-medium inline-flex items-center gap-1 cursor-pointer transition-colors"
                        title="Promissory Note / Agreement"
                      >
                        <ScrollText className="w-3 h-3" />
                        <span>Agmt</span>
                      </button>
                      <button
                        onClick={() => handleDelete(b.id, b.name)}
                        className="px-2.5 py-1 rounded-lg bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-500/20 text-[11px] font-medium inline-flex items-center gap-1 cursor-pointer transition-colors"
                        title="Delete Borrower"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Delete</span>
                      </button>
                    </td>
                  </tr>
                );
              })}

              {filteredBorrowers.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center text-gray-500">
                    <Users className="w-8 h-8 mx-auto mb-2 text-gray-600" />
                    <p className="text-sm">No active borrowers found matching your search.</p>
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
