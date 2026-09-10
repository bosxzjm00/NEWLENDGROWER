import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { formatCurrency, formatDateToWords, getTodayIsoString } from '../utils/formatters';
import { Printer, ArrowLeft, ExternalLink } from 'lucide-react';

export const StatementView: React.FC = () => {
  const {
    borrowers,
    selectedStatementBorrowerId,
    setCurrentView,
  } = useApp();

  const [showDueDate, setShowDueDate] = useState(true);
  const [showAmountDue, setShowAmountDue] = useState(true);
  const [showAmountPaid, setShowAmountPaid] = useState(true);
  const [showStatus, setShowStatus] = useState(true);
  const [showSignature, setShowSignature] = useState(true);
  const [fallbackPrintUrl, setFallbackPrintUrl] = useState<string | null>(null);

  const borrower = borrowers.find((b) => b.id === selectedStatementBorrowerId);

  if (!borrower) {
    return (
      <div className="card-bg p-8 rounded-2xl border border-slate-200 dark:border-slate-800 text-center space-y-4 max-w-md mx-auto my-12">
        <p className="text-slate-600 dark:text-slate-400 text-sm">Borrower statement not found. Please select a borrower first.</p>
        <button
          onClick={() => setCurrentView('ledger')}
          className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition-all shadow-lg shadow-indigo-600/20 active:scale-[0.98] cursor-pointer"
        >
          ← Back to Ledger
        </button>
      </div>
    );
  }

  const totalPaid = borrower.schedules.reduce((sum, s) => sum + s.amount_paid, 0);
  const totalUnpaid = Math.max(0, borrower.total_payable - totalPaid);

  // Split schedules into 2 balanced columns for print statement efficiency
  const mid = Math.ceil(borrower.schedules.length / 2);
  const leftSchedules = borrower.schedules.slice(0, mid);
  const rightSchedules = borrower.schedules.slice(mid);

  const renderScheduleTable = (list: typeof borrower.schedules) => {
    if (list.length === 0) return null;
    return (
      <table className="w-full text-left text-xs border-collapse">
        <thead className="bg-slate-50 dark:bg-slate-900/90 uppercase text-[10px] text-slate-500 dark:text-slate-400 font-semibold border border-slate-200 dark:border-slate-800">
          <tr>
            <th className="border border-slate-200 dark:border-slate-800 px-3 py-2">#</th>
            {showDueDate && <th className="border border-slate-200 dark:border-slate-800 px-3 py-2">Due Date</th>}
            {showAmountDue && <th className="border border-slate-200 dark:border-slate-800 px-3 py-2">Amount Due</th>}
            {showAmountPaid && <th className="border border-slate-200 dark:border-slate-800 px-3 py-2">Paid</th>}
            {showStatus && <th className="border border-slate-200 dark:border-slate-800 px-3 py-2">Status</th>}
            {showSignature && <th className="border border-slate-200 dark:border-slate-800 px-3 py-2">Signature</th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200/80 dark:divide-slate-800">
          {list.map((s) => {
            const statusColor =
              s.status === 'Paid'
                ? 'text-emerald-600 dark:text-emerald-400 font-bold'
                : s.status === 'Partial'
                ? 'text-amber-600 dark:text-amber-400 font-bold'
                : 'text-slate-500 dark:text-slate-400';

            return (
              <tr key={s.id} className="border border-slate-200 dark:border-slate-800">
                <td className="border border-slate-200 dark:border-slate-800 px-3 py-2 font-semibold text-slate-900 dark:text-white">
                  #{s.installment_no}
                </td>
                {showDueDate && (
                  <td className="border border-slate-200 dark:border-slate-800 px-3 py-2 text-slate-500 dark:text-slate-400">
                    {formatDateToWords(s.due_date)}
                  </td>
                )}
                {showAmountDue && (
                  <td className="border border-slate-200 dark:border-slate-800 px-3 py-2 font-semibold text-slate-900 dark:text-white">
                    {formatCurrency(s.amount_due)}
                  </td>
                )}
                {showAmountPaid && (
                  <td className="border border-slate-200 dark:border-slate-800 px-3 py-2 text-emerald-600 dark:text-emerald-400 font-semibold">
                    {formatCurrency(s.amount_paid)}
                  </td>
                )}
                {showStatus && (
                  <td className={`border border-slate-200 dark:border-slate-800 px-3 py-2 ${statusColor}`}>
                    {s.status}
                  </td>
                )}
                {showSignature && (
                  <td className="border border-slate-200 dark:border-slate-800 px-3 py-2 text-slate-400 w-24"></td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    );
  };

  const generatePrintableHtml = () => {
    const renderTableHtml = (list: typeof borrower.schedules) => {
      if (list.length === 0) return '';
      return `
        <table class="stmt-table">
          <thead>
            <tr>
              <th style="width: 28px;">#</th>
              ${showDueDate ? '<th>Due Date</th>' : ''}
              ${showAmountDue ? '<th>Amount Due</th>' : ''}
              ${showAmountPaid ? '<th>Paid</th>' : ''}
              ${showStatus ? '<th>Status</th>' : ''}
              ${showSignature ? '<th style="width: 80px;">Signature</th>' : ''}
            </tr>
          </thead>
          <tbody>
            ${list.map((s) => {
              const statusClass =
                s.status === 'Paid'
                  ? 'status-paid'
                  : s.status === 'Partial'
                  ? 'status-partial'
                  : 'status-pending';

              return `
                <tr>
                  <td style="font-weight: 700; color: #0f172a;">#${s.installment_no}</td>
                  ${showDueDate ? `<td style="color: #64748b;">${formatDateToWords(s.due_date)}</td>` : ''}
                  ${showAmountDue ? `<td style="font-weight: 700; color: #0f172a;">${formatCurrency(s.amount_due)}</td>` : ''}
                  ${showAmountPaid ? `<td style="color: #059669; font-weight: 600;">${formatCurrency(s.amount_paid)}</td>` : ''}
                  ${showStatus ? `<td class="${statusClass}">${s.status}</td>` : ''}
                  ${showSignature ? '<td style="border: 1px solid #cbd5e1;"></td>' : ''}
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      `;
    };

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Statement of Account - ${borrower.name}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 12mm 15mm;
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
      font-size: 11px;
      line-height: 1.4;
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
      transition: all 0.15s ease;
    }
    .btn-primary {
      background: #4f46e5;
      color: #ffffff;
      border-color: #4f46e5;
    }
    .statement-card {
      max-width: 860px;
      margin: 0 auto;
      border: 1px solid #cbd5e1;
      border-radius: 16px;
      padding: 30px;
      background: #ffffff;
    }
    .doc-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 18px;
      margin-bottom: 20px;
    }
    .brand-wrap {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .brand-icon {
      width: 30px;
      height: 30px;
      border-radius: 8px;
      background: rgba(79, 70, 229, 0.1);
      color: #4f46e5;
      font-weight: 800;
      font-size: 15px;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 1px solid rgba(79, 70, 229, 0.25);
    }
    .brand-title {
      font-size: 19px;
      font-weight: 800;
      color: #0f172a;
      letter-spacing: -0.02em;
    }
    .brand-sub {
      font-size: 11px;
      color: #4f46e5;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-top: 2px;
    }
    .header-info {
      text-align: right;
      font-size: 11px;
      color: #64748b;
    }
    .header-info strong {
      color: #0f172a;
    }
    .doc-ref {
      font-size: 10px;
      color: #94a3b8;
      margin-top: 3px;
    }
    .meta-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 14px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 16px;
      margin-bottom: 22px;
    }
    .meta-box label {
      display: block;
      font-size: 10px;
      color: #64748b;
      margin-bottom: 3px;
    }
    .meta-box span {
      font-size: 13px;
      font-weight: 600;
      color: #0f172a;
    }
    .meta-box .val-indigo { color: #4f46e5; font-weight: 700; }
    .meta-box .val-emerald { color: #059669; font-weight: 700; }
    .meta-box .val-rose { color: #e11d48; font-weight: 700; }
    .meta-box .val-amber { color: #d97706; font-weight: 600; }
    .section-title {
      font-size: 11px;
      font-weight: 700;
      color: #0f172a;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 12px;
    }
    .tables-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      margin-bottom: 26px;
    }
    .stmt-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 11px;
      text-align: left;
    }
    .stmt-table th {
      background: #f8fafc;
      color: #475569;
      font-weight: 700;
      text-transform: uppercase;
      font-size: 9px;
      border: 1px solid #cbd5e1;
      padding: 7px 9px;
    }
    .stmt-table td {
      border: 1px solid #cbd5e1;
      padding: 6px 9px;
    }
    .status-paid { color: #059669; font-weight: 700; }
    .status-partial { color: #d97706; font-weight: 700; }
    .status-pending { color: #64748b; }
    .signatures-row {
      border-top: 1px solid #e2e8f0;
      padding-top: 30px;
      margin-top: 10px;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 50px;
      text-align: center;
    }
    .sig-line {
      border-bottom: 1px solid #94a3b8;
      padding-bottom: 35px;
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
      .statement-card {
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
    <button onclick="window.print()" class="btn btn-primary">🖨️ Print Statement</button>
    <button onclick="window.close()" class="btn">✕ Close</button>
  </div>

  <div class="statement-card">
    <div class="doc-header">
      <div class="brand-wrap">
        <div class="brand-icon">₱</div>
        <div>
          <div class="brand-title">LENDGROWER PORTFOLIO</div>
          <div class="brand-sub">Official Borrower Statement of Account</div>
        </div>
      </div>
      <div class="header-info">
        <div>Date Generated: <strong>${formatDateToWords(getTodayIsoString())}</strong></div>
        <div class="doc-ref">Document Ref: LG-SOA-${borrower.id.toUpperCase()}</div>
      </div>
    </div>

    <div class="meta-grid">
      <div class="meta-box">
        <label>Borrower Name:</label>
        <span style="font-weight: 700;">${borrower.name}</span>
      </div>
      <div class="meta-box">
        <label>Contact Number:</label>
        <span>${borrower.contact}</span>
      </div>
      <div class="meta-box">
        <label>Address:</label>
        <span>${borrower.address}</span>
      </div>
      <div class="meta-box">
        <label>Loan Principal:</label>
        <span class="val-indigo">${formatCurrency(borrower.amount)}</span>
      </div>
      <div class="meta-box">
        <label>Total Payable:</label>
        <span class="val-emerald">${formatCurrency(borrower.total_payable)}</span>
      </div>
      <div class="meta-box">
        <label>Total Paid:</label>
        <span class="val-emerald">${formatCurrency(totalPaid)}</span>
      </div>
      <div class="meta-box">
        <label>Outstanding Balance:</label>
        <span class="val-rose">${formatCurrency(totalUnpaid)}</span>
      </div>
      <div class="meta-box">
        <label>Interest Rate:</label>
        <span class="val-amber">${borrower.interest_rate}% flat</span>
      </div>
    </div>

    <div class="section-title">Installment Schedule & Verified Receipts</div>

    <div class="tables-row">
      <div>${renderTableHtml(leftSchedules)}</div>
      <div>${renderTableHtml(rightSchedules)}</div>
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
    const htmlContent = generatePrintableHtml();
    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);

    // 1. Try opening via new window which bypasses iframe sandbox restrictions
    try {
      const win = window.open(url, '_blank');
      if (win) {
        win.focus();
        setFallbackPrintUrl(null);
        return;
      }
    } catch (e) {
      console.warn('window.open popup blocked:', e);
    }

    // 2. If popup was blocked by browser, provide the fallback direct button/link
    setFallbackPrintUrl(url);

    // 3. Also try standard window.print()
    try {
      window.print();
    } catch (e) {
      console.warn('Native window.print failed:', e);
    }
  };

  return (
    <div id="view-statement" className="space-y-6 max-w-4xl mx-auto animate-in fade-in">
      {/* Action Bar (hidden in print) */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 print:hidden no-print print-hide">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Borrower Account Statement</h2>
          <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-1 font-medium">
            Official loan status and payment history statement
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 shadow-lg shadow-indigo-600/20 cursor-pointer active:scale-[0.98]"
          >
            <Printer className="w-4 h-4" />
            <span>Print Statement</span>
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

      {/* Fallback notification if browser blocked the popup */}
      {fallbackPrintUrl && (
        <div className="bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 p-3.5 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs print:hidden no-print print-hide">
          <div className="flex items-center gap-2">
            <span className="font-semibold">Print Window Blocked:</span>
            <span>Your browser blocked the print pop-up. Click the button to open and print your statement.</span>
          </div>
          <a
            href={fallbackPrintUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-amber-600 hover:bg-amber-700 text-white font-semibold px-3.5 py-1.5 rounded-lg shrink-0 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Open & Print Statement</span>
          </a>
        </div>
      )}

      {/* Main Statement Document */}
      <div
        id="statement-card-content"
        className="card-bg p-8 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-6 shadow-sm text-slate-700 dark:text-slate-300 text-xs"
      >
        {/* Document Header */}
        <div className="flex justify-between items-start border-b border-slate-200 dark:border-slate-800 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-indigo-600/10 text-indigo-600 dark:text-indigo-400 font-bold flex items-center justify-center text-sm border border-indigo-600/20">
                ₱
              </div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                LENDGROWER PORTFOLIO
              </h1>
            </div>
            <p className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold uppercase tracking-wider mt-1">
              Official Borrower Statement of Account
            </p>
          </div>
          <div className="text-right text-xs text-slate-500 dark:text-slate-400">
            <p>
              Date Generated: <span className="text-slate-900 dark:text-white font-semibold">{formatDateToWords(getTodayIsoString())}</span>
            </p>
            <p className="text-[10px] text-slate-400 dark:text-slate-500">Document Ref: LG-SOA-{borrower.id.toUpperCase()}</p>
          </div>
        </div>

        {/* Borrower & Loan Metadata */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-slate-50/80 dark:bg-slate-900/60 p-5 rounded-xl border border-slate-200 dark:border-slate-800">
          <div>
            <span className="text-slate-500 dark:text-slate-400 block text-[11px]">Borrower Name:</span>
            <span className="text-slate-900 dark:text-white font-bold text-sm">{borrower.name}</span>
          </div>
          <div>
            <span className="text-slate-500 dark:text-slate-400 block text-[11px]">Contact Number:</span>
            <span className="text-slate-900 dark:text-white font-semibold">{borrower.contact}</span>
          </div>
          <div>
            <span className="text-slate-500 dark:text-slate-400 block text-[11px]">Address:</span>
            <span className="text-slate-900 dark:text-white font-semibold">{borrower.address}</span>
          </div>
          <div>
            <span className="text-slate-500 dark:text-slate-400 block text-[11px]">Loan Principal:</span>
            <span className="text-indigo-600 dark:text-indigo-400 font-bold text-sm">{formatCurrency(borrower.amount)}</span>
          </div>
          <div>
            <span className="text-slate-500 dark:text-slate-400 block text-[11px]">Total Payable:</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-bold text-sm">
              {formatCurrency(borrower.total_payable)}
            </span>
          </div>
          <div>
            <span className="text-slate-500 dark:text-slate-400 block text-[11px]">Total Paid:</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{formatCurrency(totalPaid)}</span>
          </div>
          <div>
            <span className="text-slate-500 dark:text-slate-400 block text-[11px]">Outstanding Balance:</span>
            <span className="text-rose-600 dark:text-rose-400 font-bold text-sm">{formatCurrency(totalUnpaid)}</span>
          </div>
          <div>
            <span className="text-slate-500 dark:text-slate-400 block text-[11px]">Interest Rate:</span>
            <span className="text-amber-600 dark:text-amber-400 font-semibold">{borrower.interest_rate}% flat</span>
          </div>
        </div>

        {/* Custom Column Visibility Controls (Hidden on Print) */}
        <div className="space-y-3 pt-2">
          <div className="flex flex-wrap items-center gap-4 text-xs bg-slate-50 dark:bg-slate-900/60 p-3 rounded-xl border border-slate-200 dark:border-slate-800 print:hidden no-print print-hide">
            <span className="text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-[10px]">
              Display Columns:
            </span>
            <label className="flex items-center gap-1.5 cursor-pointer text-slate-700 dark:text-slate-300 select-none">
              <input
                type="checkbox"
                checked={showDueDate}
                onChange={(e) => setShowDueDate(e.target.checked)}
                className="accent-indigo-600 cursor-pointer"
              />
              <span>Due Date</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer text-slate-700 dark:text-slate-300 select-none">
              <input
                type="checkbox"
                checked={showAmountDue}
                onChange={(e) => setShowAmountDue(e.target.checked)}
                className="accent-indigo-600 cursor-pointer"
              />
              <span>Amount Due</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer text-slate-700 dark:text-slate-300 select-none">
              <input
                type="checkbox"
                checked={showAmountPaid}
                onChange={(e) => setShowAmountPaid(e.target.checked)}
                className="accent-indigo-600 cursor-pointer"
              />
              <span>Amount Paid</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer text-slate-700 dark:text-slate-300 select-none">
              <input
                type="checkbox"
                checked={showStatus}
                onChange={(e) => setShowStatus(e.target.checked)}
                className="accent-indigo-600 cursor-pointer"
              />
              <span>Status</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer text-slate-700 dark:text-slate-300 select-none">
              <input
                type="checkbox"
                checked={showSignature}
                onChange={(e) => setShowSignature(e.target.checked)}
                className="accent-indigo-600 cursor-pointer"
              />
              <span>Signature / Blank</span>
            </label>
          </div>

          <h3 className="text-slate-900 dark:text-white font-bold text-xs uppercase tracking-wider mb-2">
            Installment Schedule & Verified Receipts
          </h3>

          <div
            id="stmt-schedule-container"
            className="grid grid-cols-1 md:grid-cols-2 gap-4 print:grid print:grid-cols-2"
          >
            <div>{renderScheduleTable(leftSchedules)}</div>
            <div>{renderScheduleTable(rightSchedules)}</div>
          </div>
        </div>

        {/* Official Signatures Block */}
        <div className="pt-10 mt-6 border-t border-slate-200 dark:border-slate-800 grid grid-cols-2 gap-10 text-center">
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
