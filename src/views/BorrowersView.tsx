import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Borrower } from '../types';
import { formatCurrency, formatBorrowerTableDateParts } from '../utils/formatters';
import {
  Users,
  Plus,
  Trash2,
  MoreVertical,
  FileText,
  FileSignature,
  CreditCard,
  Edit3,
  Share2,
} from 'lucide-react';
import { ConfirmDeleteModal } from '../components/modals/ConfirmDeleteModal';
import { EditBorrowerModal } from '../components/modals/EditBorrowerModal';
import { ShareBorrowerLinkModal } from '../components/modals/ShareBorrowerLinkModal';

interface BorrowersViewProps {
  onOpenAddBorrower: () => void;
  onOpenPaymentModal?: (borrowerId: string, scheduleId?: string) => void;
}

export const BorrowersView: React.FC<BorrowersViewProps> = ({
  onOpenAddBorrower,
  onOpenPaymentModal,
}) => {
  const {
    borrowers,
    deleteBorrower,
    globalSearch,
    setSelectedLedgerBorrowerId,
    setSelectedStatementBorrowerId,
    setSelectedAgreementBorrowerId,
    setSelectedPortalBorrowerId,
    setCurrentView,
  } = useApp();

  const filteredBorrowers = borrowers.filter((b) => {
    if (b.is_fully_paid) return false;
    if (!globalSearch) return true;
    const q = globalSearch.toLowerCase().trim();
    const cleanQ = q.replace(/^[#\s]+/, '');
    return (
      b.name.toLowerCase().includes(q) ||
      (b.loan_id && (b.loan_id.toLowerCase().includes(q) || b.loan_id.toLowerCase().includes(cleanQ))) ||
      b.contact.toLowerCase().includes(q) ||
      b.address.toLowerCase().includes(q)
    );
  });

  const [borrowerToDelete, setBorrowerToDelete] = useState<{ id: string; name: string } | null>(null);
  const [borrowerToEdit, setBorrowerToEdit] = useState<Borrower | null>(null);
  const [shareBorrower, setShareBorrower] = useState<Borrower | null>(null);
  const [menuBorrower, setMenuBorrower] = useState<Borrower | null>(null);
  const [menuCoords, setMenuCoords] = useState<{ top: number; right: number } | null>(null);
  const [copiedLoanId, setCopiedLoanId] = useState<string | null>(null);

  const handleCopyLoanId = (e: React.MouseEvent, loanId?: string) => {
    e.stopPropagation();
    if (!loanId) return;
    navigator.clipboard.writeText(loanId);
    setCopiedLoanId(loanId);
    setTimeout(() => {
      setCopiedLoanId((prev) => (prev === loanId ? null : prev));
    }, 1500);
  };

  const handleToggleMenu = (e: React.MouseEvent<HTMLButtonElement>, borrower: Borrower) => {
    e.stopPropagation();
    if (menuBorrower?.id === borrower.id) {
      setMenuBorrower(null);
      setMenuCoords(null);
      return;
    }

    const rect = e.currentTarget.getBoundingClientRect();
    const dropdownHeight = 260;
    const fitsBelow = rect.bottom + dropdownHeight <= window.innerHeight;

    setMenuBorrower(borrower);
    setMenuCoords({
      top: fitsBelow ? rect.bottom + 6 : Math.max(10, rect.top - dropdownHeight - 6),
      right: Math.max(10, window.innerWidth - rect.right),
    });
  };

  useEffect(() => {
    const handleClose = () => {
      setMenuBorrower(null);
      setMenuCoords(null);
    };

    if (menuBorrower) {
      window.addEventListener('resize', handleClose);
      window.addEventListener('scroll', handleClose, true);
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') handleClose();
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => {
        window.removeEventListener('resize', handleClose);
        window.removeEventListener('scroll', handleClose, true);
        window.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [menuBorrower]);

  const handleOpenLedger = (borrowerId: string) => {
    setSelectedLedgerBorrowerId(borrowerId);
    setCurrentView('ledger');
  };

  const handleOpenStatement = (borrowerId: string) => {
    setSelectedStatementBorrowerId(borrowerId);
    setCurrentView('statement');
    setMenuBorrower(null);
    setMenuCoords(null);
  };

  const handleOpenAgreement = (borrowerId: string) => {
    setSelectedAgreementBorrowerId(borrowerId);
    setCurrentView('agreement');
    setMenuBorrower(null);
    setMenuCoords(null);
  };

  const handleRecordPayment = (borrower: Borrower) => {
    setMenuBorrower(null);
    setMenuCoords(null);
    if (onOpenPaymentModal) {
      onOpenPaymentModal(borrower.id);
    } else {
      setSelectedLedgerBorrowerId(borrower.id);
      setCurrentView('ledger');
    }
  };

  const handleEditInfo = (borrower: Borrower) => {
    setMenuBorrower(null);
    setMenuCoords(null);
    setBorrowerToEdit(borrower);
  };

  return (
    <div id="view-borrowers" className="space-y-6 animate-in fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Borrowers Management</h2>
          <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-1 font-medium">
            Click a borrower's name to view their schedule, or use the direct action menu
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
        <div className="w-full overflow-x-auto">
          <table className="w-full table-fixed text-left text-[11px] sm:text-xs text-slate-700 dark:text-slate-300">
            <colgroup>
              <col className="w-[12%] min-w-[70px]" />
              <col className="w-[12%] min-w-[65px]" />
              <col className="w-[22%] min-w-[100px]" />
              <col className="w-[11%] min-w-[65px]" />
              <col className="w-[11%] min-w-[70px]" />
              <col className="w-[11%] min-w-[65px]" />
              <col className="w-[11%] min-w-[65px]" />
              <col className="w-[10%] min-w-[65px]" />
            </colgroup>
            <thead className="bg-slate-50 dark:bg-slate-900/90 uppercase text-[9px] sm:text-[10px] text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-2 sm:px-3 lg:px-4 py-3">Date</th>
                <th className="px-2 sm:px-3 lg:px-4 py-3">Loan ID</th>
                <th className="px-2 sm:px-3 lg:px-4 py-3">Borrower Name</th>
                <th className="px-2 sm:px-3 lg:px-4 py-3">
                  <span className="block xl:inline">Loan</span>{' '}
                  <span className="block xl:inline">Amount</span>
                </th>
                <th className="px-2 sm:px-3 lg:px-4 py-3">
                  <span className="block xl:inline">Total</span>{' '}
                  <span className="block xl:inline">Payable</span>
                </th>
                <th className="px-2 sm:px-3 lg:px-4 py-3">
                  <span className="block xl:inline">Total</span>{' '}
                  <span className="block xl:inline">Paid</span>
                </th>
                <th className="px-2 sm:px-3 lg:px-4 py-3">
                  <span className="block xl:inline">Total</span>{' '}
                  <span className="block xl:inline">Unpaid</span>
                </th>
                <th className="px-2 sm:px-3 lg:px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody id="borrowers-table-body" className="divide-y divide-slate-200/80 dark:divide-slate-800">
              {filteredBorrowers.map((b) => {
                const totalPaid = b.schedules.reduce((sum, s) => sum + s.amount_paid, 0);
                const totalUnpaid = Math.max(0, b.total_payable - totalPaid);
                const dateParts = formatBorrowerTableDateParts(b.start_date);
                const isMenuOpen = menuBorrower?.id === b.id;

                return (
                  <tr
                    key={b.id}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors group"
                  >
                    <td className="px-2 sm:px-3 lg:px-4 py-2.5 sm:py-3.5 leading-tight">
                      <div className="font-medium text-slate-700 dark:text-slate-300 text-[11px] sm:text-xs truncate">
                        {dateParts.date}
                      </div>
                      {dateParts.day && (
                        <div className="text-[9px] sm:text-[10px] text-slate-400 dark:text-slate-500 font-normal truncate">
                          {dateParts.day}
                        </div>
                      )}
                    </td>
                    <td className="px-2 sm:px-3 lg:px-4 py-2.5 sm:py-3.5">
                      <button
                        type="button"
                        onClick={(e) => handleCopyLoanId(e, b.loan_id)}
                        className={`inline-flex items-center px-1.5 sm:px-2 py-0.5 rounded-md font-mono text-[10px] sm:text-[11px] font-bold border tracking-wide transition-all cursor-pointer ${
                          copiedLoanId === b.loan_id
                            ? 'bg-emerald-50 text-emerald-600 border-emerald-300 dark:bg-emerald-950/50 dark:text-emerald-400 dark:border-emerald-700'
                            : 'bg-slate-100 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 border-slate-200/80 dark:border-slate-700/80 hover:bg-indigo-50 dark:hover:bg-slate-700/80 active:scale-95'
                        }`}
                        title={copiedLoanId === b.loan_id ? 'Copied to clipboard!' : 'Click to copy Loan ID'}
                      >
                        {copiedLoanId === b.loan_id ? 'Copied!' : (b.loan_id || '------')}
                      </button>
                    </td>
                    <td className="px-2 sm:px-3 lg:px-4 py-2.5 sm:py-3.5">
                      <div
                        onClick={() => handleOpenLedger(b.id)}
                        className="font-semibold text-slate-900 dark:text-white cursor-pointer hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center gap-1 truncate"
                        title={`${b.name} (Click to view schedule)`}
                      >
                        <span className="truncate">{b.name}</span>
                        <span className="text-[9px] text-indigo-500 font-normal opacity-0 group-hover:opacity-100 transition-opacity hidden xl:inline shrink-0">
                          (schedule)
                        </span>
                      </div>
                    </td>
                    <td
                      className="px-2 sm:px-3 lg:px-4 py-2.5 sm:py-3.5 text-indigo-600 dark:text-indigo-400 font-semibold tabular-nums truncate"
                      title={formatCurrency(b.amount)}
                    >
                      {formatCurrency(b.amount)}
                    </td>
                    <td
                      className="px-2 sm:px-3 lg:px-4 py-2.5 sm:py-3.5 text-emerald-600 dark:text-emerald-400 font-semibold tabular-nums truncate"
                      title={formatCurrency(b.total_payable)}
                    >
                      {formatCurrency(b.total_payable)}
                    </td>
                    <td
                      className="px-2 sm:px-3 lg:px-4 py-2.5 sm:py-3.5 text-emerald-600 dark:text-emerald-400 font-semibold tabular-nums truncate"
                      title={formatCurrency(totalPaid)}
                    >
                      {formatCurrency(totalPaid)}
                    </td>
                    <td
                      className="px-2 sm:px-3 lg:px-4 py-2.5 sm:py-3.5 text-rose-600 dark:text-rose-400 font-semibold tabular-nums truncate"
                      title={formatCurrency(totalUnpaid)}
                    >
                      {formatCurrency(totalUnpaid)}
                    </td>
                    <td className="px-2 sm:px-3 lg:px-4 py-2.5 sm:py-3.5 text-right">
                      <div className="flex items-center justify-end">
                        <button
                          type="button"
                          onClick={(e) => handleToggleMenu(e, b)}
                          className={`p-1.5 sm:px-2.5 sm:py-1 rounded-lg border text-[10px] sm:text-[11px] font-medium inline-flex items-center gap-1 cursor-pointer transition-all active:scale-95 shadow-2xs ${
                            isMenuOpen
                              ? 'bg-indigo-600 text-white border-indigo-600 shadow-indigo-500/20'
                              : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border-slate-200/80 dark:border-slate-700'
                          }`}
                          title="Borrower Quick Actions"
                          aria-label={`Quick actions for ${b.name}`}
                          aria-expanded={isMenuOpen}
                        >
                          <MoreVertical className="w-3.5 h-3.5 shrink-0" />
                          <span className="hidden sm:inline">Actions</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredBorrowers.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    <Users className="w-8 h-8 mx-auto mb-2 text-gray-600" />
                    <p className="text-sm">No active borrowers found matching your search.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Floating 3-Dot Direct Action Menu (Escape & Outside Click Safe) */}
      {menuBorrower && menuCoords && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/15 dark:bg-black/40 backdrop-blur-[0.5px]"
            onClick={() => {
              setMenuBorrower(null);
              setMenuCoords(null);
            }}
          />
          <div
            style={{
              top: `${menuCoords.top}px`,
              right: `${menuCoords.right}px`,
            }}
            className="fixed z-50 w-60 sm:w-64 card-bg rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl p-1.5 animate-in fade-in zoom-in-95 duration-100 text-xs"
          >
            <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800/80 mb-1">
              <p className="font-semibold text-slate-900 dark:text-white truncate">
                {menuBorrower.name}
              </p>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate">
                {menuBorrower.contact || 'No contact'} • {formatCurrency(menuBorrower.amount)}
              </p>
            </div>

            {/* 📄 Statement of Account */}
            <button
              type="button"
              onClick={() => handleOpenStatement(menuBorrower.id)}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 hover:text-indigo-600 dark:hover:text-indigo-400 font-medium transition-colors cursor-pointer text-left"
            >
              <div className="w-6 h-6 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                <FileText className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-semibold leading-tight">Statement of Account</div>
                <div className="text-[10px] text-slate-400 dark:text-slate-500">Ready to print or share</div>
              </div>
            </button>

            {/* 📝 Loan Agreement */}
            <button
              type="button"
              onClick={() => handleOpenAgreement(menuBorrower.id)}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:text-emerald-600 dark:hover:text-emerald-400 font-medium transition-colors cursor-pointer text-left"
            >
              <div className="w-6 h-6 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <FileSignature className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-semibold leading-tight">Loan Agreement</div>
                <div className="text-[10px] text-slate-400 dark:text-slate-500">Promissory note & contract</div>
              </div>
            </button>

            {/* 🔗 Borrower Portal Link */}
            <button
              type="button"
              onClick={() => {
                const b = menuBorrower;
                setMenuBorrower(null);
                setMenuCoords(null);
                setShareBorrower(b);
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-violet-50 dark:hover:bg-violet-950/40 hover:text-violet-600 dark:hover:text-violet-400 font-medium transition-colors cursor-pointer text-left"
            >
              <div className="w-6 h-6 rounded-lg bg-violet-50 dark:bg-violet-950/60 text-violet-600 dark:text-violet-400 flex items-center justify-center shrink-0">
                <Share2 className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-semibold leading-tight">Borrower Portal Link</div>
                <div className="text-[10px] text-slate-400 dark:text-slate-500">Share or copy schedule link</div>
              </div>
            </button>

            {/* 💰 Record Payment */}
            <button
              type="button"
              onClick={() => handleRecordPayment(menuBorrower)}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-amber-50 dark:hover:bg-amber-950/40 hover:text-amber-600 dark:hover:text-amber-400 font-medium transition-colors cursor-pointer text-left"
            >
              <div className="w-6 h-6 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                <CreditCard className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-semibold leading-tight">Record Payment</div>
                <div className="text-[10px] text-slate-400 dark:text-slate-500">Direct installment payment</div>
              </div>
            </button>

            {/* ✏️ Edit Info */}
            <button
              type="button"
              onClick={() => handleEditInfo(menuBorrower)}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-sky-50 dark:hover:bg-sky-950/40 hover:text-sky-600 dark:hover:text-sky-400 font-medium transition-colors cursor-pointer text-left"
            >
              <div className="w-6 h-6 rounded-lg bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0">
                <Edit3 className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-semibold leading-tight">Edit Info</div>
                <div className="text-[10px] text-slate-400 dark:text-slate-500">Phone, address & notes</div>
              </div>
            </button>

            <div className="border-t border-slate-100 dark:border-slate-800 my-1" />

            {/* Delete Option */}
            <button
              type="button"
              onClick={() => {
                const b = menuBorrower;
                setMenuBorrower(null);
                setMenuCoords(null);
                setBorrowerToDelete({ id: b.id, name: b.name });
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 font-medium transition-colors cursor-pointer text-left"
            >
              <div className="w-6 h-6 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                <Trash2 className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-semibold leading-tight">Delete Borrower</div>
                <div className="text-[10px] text-slate-400 dark:text-slate-500">Remove from portfolio</div>
              </div>
            </button>
          </div>
        </>
      )}

      {/* Edit Info Modal */}
      <EditBorrowerModal
        isOpen={Boolean(borrowerToEdit)}
        onClose={() => setBorrowerToEdit(null)}
        borrower={borrowerToEdit}
      />

      {/* Confirm Delete Modal */}
      <ConfirmDeleteModal
        isOpen={Boolean(borrowerToDelete)}
        title="Delete Borrower Account"
        subtitle="Permanent portfolio deletion"
        message={
          <span>
            Are you sure you want to permanently delete borrower{' '}
            <strong className="text-slate-900 dark:text-white font-semibold">
              "{borrowerToDelete?.name}"
            </strong>
            ? This will remove all their loan schedules and assignments, and remove this account from portfolio calculations across the entire system.
          </span>
        }
        confirmLabel="Yes, Delete Borrower"
        onConfirm={() => {
          if (borrowerToDelete) {
            deleteBorrower(borrowerToDelete.id);
            setBorrowerToDelete(null);
          }
        }}
        onClose={() => setBorrowerToDelete(null)}
      />

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

