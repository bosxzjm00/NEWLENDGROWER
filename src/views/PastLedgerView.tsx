import React from 'react';
import { useApp } from '../context/AppContext';
import { formatCurrency, formatDateToWords } from '../utils/formatters';
import { Archive, CheckCircle2, FileText, ScrollText } from 'lucide-react';

export const PastLedgerView: React.FC = () => {
  const {
    borrowers,
    globalSearch,
    setSelectedStatementBorrowerId,
    setSelectedAgreementBorrowerId,
    setCurrentView,
  } = useApp();

  const fullyPaidBorrowers = borrowers.filter((b) => {
    if (!b.is_fully_paid) return false;
    if (!globalSearch) return true;
    const q = globalSearch.toLowerCase();
    return b.name.toLowerCase().includes(q) || b.contact.toLowerCase().includes(q);
  });

  const handleOpenStatement = (borrowerId: string) => {
    setSelectedStatementBorrowerId(borrowerId);
    setCurrentView('statement');
  };

  const handleOpenAgreement = (borrowerId: string) => {
    setSelectedAgreementBorrowerId(borrowerId);
    setCurrentView('agreement');
  };

  return (
    <div id="view-past-ledger" className="space-y-6 animate-in fade-in">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Past Ledger (Archived)</h2>
        <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-1 font-medium">
          Archived historical records of fully settled and completed borrower loans
        </p>
      </div>

      <div id="past-ledger-container" className="space-y-4">
        {fullyPaidBorrowers.map((b) => {
          return (
            <div
              key={b.id}
              className="card-bg p-5 rounded-2xl border border-emerald-200 dark:border-emerald-800/40 space-y-4 shadow-sm"
            >
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-slate-900 dark:text-white font-bold text-base">{b.name}</h3>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Fully Paid</span>
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Settled Loan: <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{formatCurrency(b.total_payable)}</span> (Principal: {formatCurrency(b.amount)})
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleOpenStatement(b.id)}
                    className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-indigo-600 dark:text-indigo-400 font-semibold text-xs px-3 py-1.5 rounded-xl transition-colors border border-slate-200 dark:border-slate-700 flex items-center gap-1.5 cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Statement</span>
                  </button>
                  <button
                    onClick={() => handleOpenAgreement(b.id)}
                    className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-emerald-600 dark:text-emerald-400 font-semibold text-xs px-3 py-1.5 rounded-xl transition-colors border border-slate-200 dark:border-slate-700 flex items-center gap-1.5 cursor-pointer"
                  >
                    <ScrollText className="w-3.5 h-3.5" />
                    <span>Agreement</span>
                  </button>
                </div>
              </div>

              {/* Installment Summary */}
              <div className="bg-slate-50 dark:bg-slate-900/60 p-4 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-slate-500 dark:text-slate-400">
                  <div>
                    <span className="text-[10px] block font-medium">Start Date:</span>
                    <span className="text-slate-900 dark:text-white font-medium">{formatDateToWords(b.start_date)}</span>
                  </div>
                  <div>
                    <span className="text-[10px] block font-medium">Frequency:</span>
                    <span className="text-slate-900 dark:text-white font-medium">{b.frequency.toUpperCase()}</span>
                  </div>
                  <div>
                    <span className="text-[10px] block font-medium">Total Installments:</span>
                    <span className="text-slate-900 dark:text-white font-medium">{b.schedules.length} settled</span>
                  </div>
                  <div>
                    <span className="text-[10px] block font-medium">Total Interest Realized:</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{formatCurrency(b.total_payable - b.amount)}</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {fullyPaidBorrowers.length === 0 && (
          <div className="card-bg p-8 rounded-2xl text-center text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-slate-800 shadow-sm">
            <Archive className="w-8 h-8 mx-auto mb-2 text-slate-400 dark:text-slate-600" />
            <p className="text-sm">No archived/fully settled loan accounts found.</p>
          </div>
        )}
      </div>
    </div>
  );
};
