import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { formatCurrency, formatDateToWords } from '../utils/formatters';
import {
  BookOpen,
  ChevronDown,
  ChevronUp,
  FileText,
  ScrollText,
  CreditCard,
  Filter,
  CheckCircle2,
  Share2,
} from 'lucide-react';
import { Borrower } from '../types';
import { ShareBorrowerLinkModal } from '../components/modals/ShareBorrowerLinkModal';

interface LedgerViewProps {
  onOpenPaymentModal: (borrowerId: string, scheduleId: string) => void;
}

export const LedgerView: React.FC<LedgerViewProps> = ({ onOpenPaymentModal }) => {
  const {
    borrowers,
    selectedLedgerBorrowerId,
    setSelectedLedgerBorrowerId,
    setSelectedStatementBorrowerId,
    setSelectedAgreementBorrowerId,
    setSelectedPortalBorrowerId,
    setCurrentView,
    globalSearch,
  } = useApp();

  const [shareBorrower, setShareBorrower] = useState<Borrower | null>(null);

  // Track expanded state of borrower cards
  const [expandedMap, setExpandedMap] = useState<Record<string, boolean>>(() => {
    if (selectedLedgerBorrowerId) {
      return { [selectedLedgerBorrowerId]: true };
    }
    return {};
  });

  const toggleExpand = (borrowerId: string) => {
    setExpandedMap((prev) => ({
      ...prev,
      [borrowerId]: !prev[borrowerId],
    }));
  };

  const activeBorrowers = borrowers.filter((b) => {
    if (b.is_fully_paid) return false;
    if (selectedLedgerBorrowerId && b.id !== selectedLedgerBorrowerId) return false;
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
    <div id="view-ledger" className="space-y-6 animate-in fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Master Loan Ledger</h2>
          <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-1 font-medium">
            Click on a borrower's card to toggle and view their complete installment amortization schedule
          </p>
        </div>

        {selectedLedgerBorrowerId && (
          <button
            onClick={() => setSelectedLedgerBorrowerId(null)}
            className="bg-indigo-50 dark:bg-indigo-900/30 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 text-xs font-semibold px-3 py-2 rounded-xl transition-colors flex items-center gap-2 cursor-pointer"
          >
            <Filter className="w-3.5 h-3.5" />
            <span>Show All Active Borrowers</span>
          </button>
        )}
      </div>

      <div id="ledger-container" className="space-y-4">
        {activeBorrowers.map((b) => {
          // If explicitly selected or expanded in map, open by default
          const isExpanded = selectedLedgerBorrowerId === b.id || !!expandedMap[b.id];
          const totalPaid = b.schedules.reduce((sum, s) => sum + s.amount_paid, 0);
          const totalUnpaid = Math.max(0, b.total_payable - totalPaid);

          return (
            <div
              key={b.id}
              className="card-bg rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden transition-all shadow-sm"
            >
              {/* Header Bar */}
              <div className="p-4 sm:p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-50/80 dark:bg-slate-900/80">
                <div
                  onClick={() => toggleExpand(b.id)}
                  className="cursor-pointer select-none flex-1 group"
                >
                  <div className="flex items-center gap-2">
                    <h3 className="text-slate-900 dark:text-white font-bold text-base group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors flex items-center gap-2">
                      <span>{b.name}</span>
                      <span className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">
                        ({b.frequency.toUpperCase()} • {b.schedules.length} installments)
                      </span>
                    </h3>
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-indigo-600" />
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 dark:text-slate-400 mt-1">
                    <span>
                      Principal:{' '}
                      <strong className="text-indigo-600 dark:text-indigo-400 font-semibold">{formatCurrency(b.amount)}</strong>
                    </span>
                    <span>•</span>
                    <span>
                      Payable:{' '}
                      <strong className="text-emerald-600 dark:text-emerald-400 font-semibold">
                        {formatCurrency(b.total_payable)}
                      </strong>
                    </span>
                    <span>•</span>
                    <span>
                      Paid:{' '}
                      <strong className="text-emerald-600 dark:text-emerald-400 font-semibold">
                        {formatCurrency(totalPaid)}
                      </strong>
                    </span>
                    <span>•</span>
                    <span>
                      Unpaid:{' '}
                      <strong className="text-rose-600 dark:text-rose-400 font-semibold">
                        {formatCurrency(totalUnpaid)}
                      </strong>
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => setShareBorrower(b)}
                    className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-violet-600 dark:text-violet-400 font-semibold text-xs px-3 py-1.5 rounded-xl transition-colors border border-slate-200 dark:border-slate-700 flex items-center gap-1.5 cursor-pointer"
                    title="Share direct schedule link with borrower"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Share Link</span>
                  </button>
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

              {/* Installments Table */}
              {isExpanded && (
                <div className="border-t border-slate-200 dark:border-slate-800 p-4 sm:p-5 pt-0 bg-slate-50/30 dark:bg-slate-950/40">
                  <div className="overflow-x-auto mt-3">
                    <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
                      <thead className="bg-slate-100 dark:bg-slate-900 uppercase text-[10px] text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
                        <tr>
                          <th className="px-4 py-2.5 whitespace-nowrap">#</th>
                          <th className="px-4 py-2.5 whitespace-nowrap">Due Date</th>
                          <th className="px-4 py-2.5 whitespace-nowrap">Amount Due</th>
                          <th className="px-4 py-2.5 whitespace-nowrap">Paid</th>
                          <th className="px-4 py-2.5 whitespace-nowrap">Status</th>
                          <th className="px-4 py-2.5 whitespace-nowrap">Payment History</th>
                          <th className="px-4 py-2.5 text-right whitespace-nowrap">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200/80 dark:divide-slate-800">
                        {b.schedules.map((s) => {
                          const statusColor =
                            s.status === 'Paid'
                              ? 'text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20'
                              : s.status === 'Partial'
                              ? 'text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20'
                              : 'text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700';

                          return (
                            <tr key={s.id} className="hover:bg-slate-100/50 dark:hover:bg-slate-800/40 transition-colors">
                              <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">
                                #{s.installment_no}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-slate-500 dark:text-slate-400">
                                {formatDateToWords(s.due_date)}
                              </td>
                              <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white whitespace-nowrap">
                                {formatCurrency(s.amount_due)}
                              </td>
                              <td className="px-4 py-3 text-emerald-600 dark:text-emerald-400 font-semibold whitespace-nowrap">
                                {formatCurrency(s.amount_paid)}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap">
                                <span
                                  className={`px-2.5 py-0.5 rounded-full text-[10px] border font-bold ${statusColor}`}
                                >
                                  {s.status}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-slate-500 dark:text-slate-400 text-[11px]">
                                {s.payments && s.payments.length > 0 ? (
                                  <div className="space-y-0.5 max-w-xs">
                                    {s.payments.map((p) => (
                                      <div key={p.id} className="truncate">
                                        <span className="text-indigo-600 dark:text-indigo-400 font-medium">
                                          {formatCurrency(p.amount)}
                                        </span>{' '}
                                        via {p.method}{' '}
                                        <span className="text-slate-400 dark:text-slate-500">
                                          ({formatDateToWords(p.date)})
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <span className="text-slate-400 dark:text-slate-600">No payment records</span>
                                )}
                              </td>
                              <td className="px-4 py-3 text-right whitespace-nowrap">
                                <button
                                  onClick={() => onOpenPaymentModal(b.id, s.id)}
                                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-3 py-1.5 rounded-xl transition-all shadow-sm shadow-indigo-600/20 text-xs flex items-center gap-1.5 ml-auto cursor-pointer"
                                >
                                  <CreditCard className="w-3.5 h-3.5" />
                                  <span>{s.status === 'Paid' ? 'Edit / Add' : 'Log Payment'}</span>
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {activeBorrowers.length === 0 && (
          <div className="card-bg p-8 rounded-2xl text-center text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-slate-800">
            <BookOpen className="w-8 h-8 mx-auto mb-2 text-slate-400" />
            <p className="text-sm">No active loan accounts found.</p>
          </div>
        )}
      </div>

      {/* Share Borrower Portal Link Modal */}
      <ShareBorrowerLinkModal
        isOpen={Boolean(shareBorrower)}
        onClose={() => setShareBorrower(null)}
        borrower={shareBorrower}
        onOpenPreview={(bId) => {
          setSelectedPortalBorrowerId(bId);
          setCurrentView('borrower-portal');
        }}
      />
    </div>
  );
};
