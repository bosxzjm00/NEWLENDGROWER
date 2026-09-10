import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { formatCurrency, formatDateToWords, getTodayIsoString } from '../utils/formatters';
import { Printer, ArrowLeft, ExternalLink } from 'lucide-react';

export const AgreementView: React.FC = () => {
  const {
    borrowers,
    selectedAgreementBorrowerId,
    setCurrentView,
  } = useApp();

  const [fallbackPrintUrl, setFallbackPrintUrl] = useState<string | null>(null);

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

  const generatePrintableAgreementHtml = () => {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Loan Agreement - ${borrower.name}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 15mm 20mm;
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      color: #334155;
      background-color: #ffffff;
      padding: 24px;
      font-size: 12px;
      line-height: 1.6;
    }
    .print-bar {
      display: flex;
      justify-content: flex-end;
      gap: 10px;
      margin-bottom: 20px;
      padding: 10px 14px;
      background: #f1f5f9;
      border: 1px solid #cbd5e1;
      border-radius: 10px;
    }
    .btn {
      padding: 7px 16px;
      font-size: 12px;
      font-weight: 600;
      border-radius: 8px;
      cursor: pointer;
      border: 1px solid #cbd5e1;
      background: #ffffff;
      color: #1e293b;
    }
    .btn-primary {
      background: #4f46e5;
      color: #ffffff;
      border-color: #4f46e5;
    }
    .agreement-card {
      max-width: 800px;
      margin: 0 auto;
      border: 1px solid #cbd5e1;
      border-radius: 16px;
      padding: 40px;
      background: #ffffff;
    }
    .contract-badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 9999px;
      background: #eef2ff;
      color: #4f46e5;
      border: 1px solid #c7d2fe;
      font-size: 10px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      margin-bottom: 8px;
    }
    .header {
      text-align: center;
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 24px;
      margin-bottom: 24px;
    }
    .title {
      font-size: 20px;
      font-weight: 800;
      color: #0f172a;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .sub {
      font-size: 11px;
      color: #4f46e5;
      font-weight: 600;
      margin-top: 4px;
    }
    .clause {
      margin-top: 18px;
    }
    .clause-title {
      font-size: 12px;
      font-weight: 700;
      color: #0f172a;
      text-transform: uppercase;
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 4px;
      margin-bottom: 8px;
    }
    .quote-box {
      padding-left: 14px;
      border-left: 3px solid #6366f1;
      margin: 8px 0;
    }
    .quote-box-alt {
      padding-left: 14px;
      border-left: 3px solid #10b981;
      margin: 8px 0;
    }
    .signatures-row {
      border-top: 1px solid #e2e8f0;
      padding-top: 40px;
      margin-top: 40px;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 60px;
      text-align: center;
    }
    .sig-line {
      border-bottom: 1px solid #94a3b8;
      padding-bottom: 40px;
      margin-bottom: 8px;
    }
    .sig-name {
      font-weight: 700;
      font-size: 12px;
      color: #0f172a;
    }
    .sig-label {
      font-size: 10px;
      color: #94a3b8;
      margin-top: 2px;
    }
    @media print {
      .print-bar { display: none !important; }
      body { padding: 0 !important; }
      .agreement-card {
        border: none !important;
        border-radius: 0 !important;
        padding: 0 !important;
        max-width: 100% !important;
      }
    }
  </style>
</head>
<body>
  <div class="print-bar">
    <button onclick="window.print()" class="btn btn-primary">🖨️ Print Agreement</button>
    <button onclick="window.close()" class="btn">✕ Close</button>
  </div>

  <div class="agreement-card">
    <div class="header">
      <div class="contract-badge">Contract Document</div>
      <div class="title">PROMISSORY NOTE & LOAN AGREEMENT</div>
      <div class="sub">LendGrower Portfolio Lending System</div>
    </div>

    <div style="margin-bottom: 16px;">
      <p>
        This Loan Agreement (the <strong>"Agreement"</strong>) is entered into and made effective as of
        <strong>${formatDateToWords(borrower.start_date)}</strong>, by and between:
      </p>

      <div class="quote-box">
        <strong>LENDGROWER PORTFOLIO</strong>, represented by the authorized Portfolio Administrator
        (hereinafter referred to as the <strong>"LENDER"</strong>),
      </div>

      <p style="text-align: center; font-weight: 700; color: #4f46e5; margin: 10px 0; letter-spacing: 0.1em; font-size: 11px;">
        AND
      </p>

      <div class="quote-box-alt">
        <strong>${borrower.name}</strong>, of legal age, residing at <strong>${borrower.address}</strong>,
        with contact number <strong>${borrower.contact}</strong> (hereinafter referred to as the <strong>"BORROWER"</strong>).
      </div>
    </div>

    <div class="clause">
      <div class="clause-title">1. Loan Terms & Principal</div>
      <p>
        For valuable consideration received, the Borrower unconditionally promises to pay to the order of the
        Lender the principal sum of <strong style="color: #4f46e5;">${formatCurrency(borrower.amount)}</strong>,
        together with agreed fixed interest of <strong style="color: #d97706;">${borrower.interest_rate}% flat</strong>,
        resulting in an aggregate total repayable obligation of
        <strong style="color: #059669;">${formatCurrency(borrower.total_payable)}</strong>.
      </p>
    </div>

    <div class="clause">
      <div class="clause-title">2. Payment Schedule & Frequency</div>
      <p>
        The total repayable amount shall be satisfied in <strong>${borrower.installments} installment(s)</strong> on
        a <strong style="text-transform: uppercase;">${borrower.frequency}</strong> basis, with each installment amortized
        and due strictly in accordance with the official ledger schedule attached to the borrower account.
      </p>
    </div>

    <div class="clause">
      <div class="clause-title">3. Default, Acceleration & Remedies</div>
      <p>
        In the event of any default or failure in punctual payment when due, the entire remaining unpaid balance
        shall, at the option of the Lender, become immediately due and demandable without further formal notice.
        The Borrower undertakes to indemnify all collection expenses and reasonable legal costs incurred.
      </p>
    </div>

    <div class="signatures-row">
      <div>
        <div class="sig-line"></div>
        <div class="sig-name">${borrower.name}</div>
        <div class="sig-label">Borrower Signature Over Printed Name</div>
      </div>
      <div>
        <div class="sig-line"></div>
        <div class="sig-name">LendGrower Admin</div>
        <div class="sig-label">Authorized Lender Representative</div>
      </div>
    </div>
  </div>

  <script>
    window.addEventListener('load', function() {
      setTimeout(function() {
        window.print();
      }, 350);
    });
  </script>
</body>
</html>`;
  };

  const handlePrint = () => {
    const htmlContent = generatePrintableAgreementHtml();
    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);

    try {
      const win = window.open(url, '_blank');
      if (win) {
        win.focus();
        setFallbackPrintUrl(null);
        return;
      }
    } catch (e) {
      console.warn('Agreement window.open blocked:', e);
    }

    setFallbackPrintUrl(url);

    try {
      window.print();
    } catch (e) {
      console.warn('Native window.print failed:', e);
    }
  };

  return (
    <div id="view-agreement" className="space-y-6 max-w-4xl mx-auto animate-in fade-in">
      {/* Action Controls (Hidden on Print) */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 print:hidden no-print print-hide">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Promissory Note & Loan Agreement
          </h2>
          <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-1 font-medium">Official legal lending agreement document</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
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

      {/* Fallback notification if browser blocked popup */}
      {fallbackPrintUrl && (
        <div className="bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 p-3.5 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs print:hidden no-print print-hide">
          <div className="flex items-center gap-2">
            <span className="font-semibold">Print Window Blocked:</span>
            <span>Your browser blocked the print pop-up. Click the button to open and print your agreement.</span>
          </div>
          <a
            href={fallbackPrintUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-amber-600 hover:bg-amber-700 text-white font-semibold px-3.5 py-1.5 rounded-lg shrink-0 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Open & Print Agreement</span>
          </a>
        </div>
      )}

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
