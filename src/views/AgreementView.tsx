import React from 'react';
import { useApp } from '../context/AppContext';
import { formatCurrency, formatDateToWords, getTodayIsoString } from '../utils/formatters';
import { Printer, ArrowLeft } from 'lucide-react';

export const AgreementView: React.FC = () => {
  const {
    borrowers,
    selectedAgreementBorrowerId,
    setCurrentView,
  } = useApp();

  const borrower = borrowers.find((b) => b.id === selectedAgreementBorrowerId);

  if (!borrower) {
    return (
      <div className="card-bg p-8 rounded-2xl border border-slate-200 dark:border-slate-800 text-center space-y-4 max-w-md mx-auto my-12">
        <p className="text-slate-600 dark:text-slate-400 text-sm">Loan agreement not found. Please select a borrower first.</p>
        <button
          onClick={() => setCurrentView('ledger')}
          className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition-all shadow-lg shadow-indigo-600/20 active:scale-[0.98] cursor-pointer"
        >
          ← Back to Ledger
        </button>
      </div>
    );
  }

  return (
    <div id="view-agreement" className="space-y-6 max-w-4xl mx-auto animate-in fade-in">
      {/* Action Controls (Hidden on Print) */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 print:hidden">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Promissory Note & Loan Agreement
          </h2>
          <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-1 font-medium">Official legal lending agreement document</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 shadow-lg shadow-indigo-600/20 cursor-pointer active:scale-[0.98]"
          >
            <Printer className="w-4 h-4" />
            <span>Print Agreement</span>
          </button>
          <button
            onClick={() => setCurrentView('ledger')}
            className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Ledger</span>
          </button>
        </div>
      </div>

      {/* Printable Legal Agreement Document */}
      <div
        id="agreement-card-content"
        className="card-bg p-8 sm:p-10 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-6 text-xs text-slate-700 dark:text-slate-300 leading-relaxed shadow-sm"
      >
        <div className="text-center border-b border-slate-200 dark:border-slate-800 pb-6 space-y-1">
          <div className="inline-block px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 text-[10px] font-bold uppercase tracking-widest mb-1">
            Contract Document
          </div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white uppercase tracking-wider">
            PROMISSORY NOTE & LOAN AGREEMENT
          </h1>
          <p className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">LendGrower Portfolio Lending System</p>
        </div>

        <div className="space-y-4 text-xs">
          <p>
            This Loan Agreement (the <strong className="text-slate-900 dark:text-white font-semibold">"Agreement"</strong>) is entered
            into and made effective as of{' '}
            <strong className="text-slate-900 dark:text-white font-semibold">{formatDateToWords(borrower.start_date)}</strong>,
            by and between:
          </p>

          <p className="pl-4 border-l-2 border-indigo-500 py-1">
            <strong className="text-slate-900 dark:text-white">LENDGROWER PORTFOLIO</strong>, represented by the
            authorized Portfolio Administrator (hereinafter referred to as the{' '}
            <strong className="text-slate-900 dark:text-white">"LENDER"</strong>),
          </p>

          <p className="text-center font-bold text-indigo-600 dark:text-indigo-400 tracking-widest text-[11px]">AND</p>

          <p className="pl-4 border-l-2 border-emerald-500 py-1">
            <strong className="text-slate-900 dark:text-white">{borrower.name}</strong>, of legal age, residing at{' '}
            <strong className="text-slate-900 dark:text-white">{borrower.address}</strong>, with contact number{' '}
            <strong className="text-slate-900 dark:text-white">{borrower.contact}</strong> (hereinafter referred to as
            the <strong className="text-slate-900 dark:text-white">"BORROWER"</strong>).
          </p>
        </div>

        <div className="space-y-3 pt-2">
          <h3 className="text-slate-900 dark:text-white font-bold uppercase tracking-wider text-xs border-b border-slate-200 dark:border-slate-800 pb-1">
            1. Loan Terms & Principal
          </h3>
          <p>
            For valuable consideration received, the Borrower unconditionally promises to pay to the
            order of the Lender the principal sum of{' '}
            <strong className="text-indigo-600 dark:text-indigo-400 font-bold">{formatCurrency(borrower.amount)}</strong>,
            together with agreed fixed interest of{' '}
            <strong className="text-amber-600 dark:text-amber-400 font-bold">{borrower.interest_rate}% flat</strong>,
            resulting in an aggregate total repayable obligation of{' '}
            <strong className="text-emerald-600 dark:text-emerald-400 font-bold">
              {formatCurrency(borrower.total_payable)}
            </strong>
            .
          </p>
        </div>

        <div className="space-y-3 pt-2">
          <h3 className="text-slate-900 dark:text-white font-bold uppercase tracking-wider text-xs border-b border-slate-200 dark:border-slate-800 pb-1">
            2. Payment Schedule & Frequency
          </h3>
          <p>
            The total repayable amount shall be satisfied in{' '}
            <strong className="text-slate-900 dark:text-white font-semibold">{borrower.installments} installment(s)</strong> on
            a <strong className="text-slate-900 dark:text-white font-semibold uppercase">{borrower.frequency}</strong> basis,
            with each installment amortized and due strictly in accordance with the official ledger
            schedule attached to the borrower account.
          </p>
        </div>

        <div className="space-y-3 pt-2">
          <h3 className="text-slate-900 dark:text-white font-bold uppercase tracking-wider text-xs border-b border-slate-200 dark:border-slate-800 pb-1">
            3. Default, Acceleration & Remedies
          </h3>
          <p>
            In the event of any default or failure in punctual payment when due, the entire remaining
            unpaid balance shall, at the option of the Lender, become immediately due and demandable
            without further formal notice. The Borrower undertakes to indemnify all collection
            expenses and reasonable legal costs incurred.
          </p>
        </div>

        {/* Signature Blocks */}
        <div className="pt-12 grid grid-cols-2 gap-10 text-center border-t border-slate-200 dark:border-slate-800">
          <div>
            <div className="border-b border-slate-300 dark:border-slate-700 pb-10 mb-2"></div>
            <p className="text-slate-900 dark:text-white font-bold text-xs">{borrower.name}</p>
            <p className="text-[10px] text-slate-400">Borrower Signature Over Printed Name</p>
          </div>
          <div>
            <div className="border-b border-slate-300 dark:border-slate-700 pb-10 mb-2"></div>
            <p className="text-slate-900 dark:text-white font-bold text-xs">LendGrower Admin</p>
            <p className="text-[10px] text-slate-400">Authorized Lender Representative</p>
          </div>
        </div>
      </div>
    </div>
  );
};
