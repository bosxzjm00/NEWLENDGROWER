import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { formatCurrency, formatDateToWords, getTodayIsoString } from '../utils/formatters';
import { Printer, ArrowLeft, CalendarCheck, ExternalLink } from 'lucide-react';

export const CollectionSheetView: React.FC = () => {
  const {
    borrowers,
    collectors,
    assignments,
    setCurrentView,
  } = useApp();

  const [selectedDate, setSelectedDate] = useState(getTodayIsoString());
  const [fallbackPrintUrl, setFallbackPrintUrl] = useState<string | null>(null);

  // Find all active installment schedules due on selectedDate
  const dueItems: {
    borrowerName: string;
    contact: string;
    collectorName: string;
    installmentNo: number;
    amountDue: number;
    amountPaid: number;
    balance: number;
    status: string;
  }[] = [];

  borrowers.forEach((b) => {
    if (b.is_fully_paid) return;
    const asg = assignments.find((a) => a.borrowerId === b.id);
    const col = asg ? collectors.find((c) => c.id === asg.collectorId) : null;
    const collectorName = col ? col.name : 'Unassigned';

    b.schedules.forEach((s) => {
      if (s.due_date === selectedDate) {
        const balance = Math.max(0, s.amount_due - s.amount_paid);
        dueItems.push({
          borrowerName: b.name,
          contact: b.contact,
          collectorName,
          installmentNo: s.installment_no,
          amountDue: s.amount_due,
          amountPaid: s.amount_paid,
          balance,
          status: s.status,
        });
      }
    });
  });

  const generatePrintableCollectionSheetHtml = () => {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Daily Collection Sheet - ${selectedDate}</title>
  <style>
    @page {
      size: A4 landscape;
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
    .sheet-card {
      max-width: 1050px;
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
    .accounts-count {
      font-size: 10px;
      color: #94a3b8;
      margin-top: 3px;
    }
    .sheet-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 11px;
      text-align: left;
      margin-bottom: 26px;
    }
    .sheet-table th {
      background: #f8fafc;
      color: #475569;
      font-weight: 700;
      text-transform: uppercase;
      font-size: 9px;
      border: 1px solid #cbd5e1;
      padding: 8px 10px;
    }
    .sheet-table td {
      border: 1px solid #cbd5e1;
      padding: 7px 10px;
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
      gap: 60px;
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
      .sheet-card {
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
    <button onclick="window.print()" class="btn btn-primary">🖨️ Print Sheet</button>
    <button onclick="window.close()" class="btn">✕ Close</button>
  </div>

  <div class="sheet-card">
    <div class="doc-header">
      <div class="brand-wrap">
        <div class="brand-icon">₱</div>
        <div>
          <div class="brand-title">LENDGROWER PORTFOLIO</div>
          <div class="brand-sub">Daily Collection Schedule & Field Remittance Sheet</div>
        </div>
      </div>
      <div class="header-info">
        <div>Collection Date: <strong>${formatDateToWords(selectedDate)}</strong></div>
        <div class="accounts-count">${dueItems.length} accounts scheduled</div>
      </div>
    </div>

    <table class="sheet-table">
      <thead>
        <tr>
          <th>Borrower Name</th>
          <th>Contact No.</th>
          <th>Collector</th>
          <th>Inst. #</th>
          <th>Amount Due / Balance</th>
          <th>Status</th>
          <th style="width: 140px;">Signature / Remarks</th>
        </tr>
      </thead>
      <tbody>
        ${
          dueItems.length > 0
            ? dueItems
                .map((item) => {
                  const statusClass =
                    item.status === 'Paid'
                      ? 'status-paid'
                      : item.status === 'Partial'
                      ? 'status-partial'
                      : 'status-pending';

                  return `
          <tr>
            <td style="font-weight: 700; color: #0f172a;">${item.borrowerName}</td>
            <td style="color: #64748b;">${item.contact}</td>
            <td style="color: #4f46e5; font-weight: 500;">${item.collectorName}</td>
            <td style="color: #475569;">#${item.installmentNo}</td>
            <td style="font-weight: 700; color: #059669;">
              ${formatCurrency(item.balance)} <span style="font-size: 9px; color: #94a3b8; font-weight: 400;">(Due: ${formatCurrency(item.amountDue)})</span>
            </td>
            <td class="${statusClass}">${item.status}</td>
            <td style="border: 1px solid #cbd5e1;"></td>
          </tr>
        `;
                })
                .join('')
            : `
          <tr>
            <td colspan="7" style="text-align: center; color: #94a3b8; padding: 24px;">
              No installment payments due on ${formatDateToWords(selectedDate)}.
            </td>
          </tr>
        `
        }
      </tbody>
    </table>

    <div class="signatures-row">
      <div>
        <div class="sig-line"></div>
        <div class="sig-name">Field Collector / Remitter</div>
        <div class="sig-label">Signature Over Printed Name</div>
      </div>
      <div>
        <div class="sig-line"></div>
        <div class="sig-name">Admin Receiving Officer</div>
        <div class="sig-label">Acknowledged & Audited</div>
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
    const htmlContent = generatePrintableCollectionSheetHtml();
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
      console.warn('Collection sheet window.open popup blocked:', e);
    }

    setFallbackPrintUrl(url);

    try {
      window.print();
    } catch (e) {
      console.warn('Native window.print failed:', e);
    }
  };

  return (
    <div id="view-collection-sheet" className="space-y-6 max-w-4xl mx-auto animate-in fade-in">
      {/* Action Controls (Hidden on Print) */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 print:hidden no-print print-hide">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Daily Collection Sheet</h2>
          <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-1 font-medium">Official collection schedule report for field agents</p>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
            <span className="text-slate-500 dark:text-slate-400 text-xs font-medium">Date:</span>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent text-slate-900 dark:text-white text-xs focus:outline-none cursor-pointer font-medium"
            />
          </div>

          <button
            onClick={handlePrint}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 shadow-lg shadow-indigo-600/20 cursor-pointer active:scale-[0.98]"
          >
            <Printer className="w-4 h-4" />
            <span>Print Sheet</span>
          </button>

          <button
            onClick={() => setCurrentView('dashboard')}
            className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </button>
        </div>
      </div>

      {/* Fallback notification if browser blocked the popup */}
      {fallbackPrintUrl && (
        <div className="bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 p-3.5 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs print:hidden no-print print-hide">
          <div className="flex items-center gap-2">
            <span className="font-semibold">Print Window Blocked:</span>
            <span>Your browser blocked the print pop-up. Click the button to open and print your collection sheet.</span>
          </div>
          <a
            href={fallbackPrintUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-amber-600 hover:bg-amber-700 text-white font-semibold px-3.5 py-1.5 rounded-lg shrink-0 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Open & Print Sheet</span>
          </a>
        </div>
      )}

      {/* Main Printable Document Card */}
      <div
        id="collection-sheet-card-content"
        className="card-bg p-8 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-6 shadow-sm text-xs text-slate-700 dark:text-slate-300"
      >
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
              Daily Collection Schedule & Field Remittance Sheet
            </p>
          </div>
          <div className="text-right text-xs text-slate-500 dark:text-slate-400">
            <p>
              Collection Date:{' '}
              <span className="text-slate-900 dark:text-white font-bold">{formatDateToWords(selectedDate)}</span>
            </p>
            <p className="text-[10px] text-slate-400 dark:text-slate-500">{dueItems.length} accounts scheduled</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300 border-collapse">
            <thead className="bg-slate-50 dark:bg-slate-900/90 uppercase text-[10px] text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-800 font-semibold">
              <tr>
                <th className="border border-slate-200 dark:border-slate-800 px-3 py-2.5">Borrower Name</th>
                <th className="border border-slate-200 dark:border-slate-800 px-3 py-2.5">Contact No.</th>
                <th className="border border-slate-200 dark:border-slate-800 px-3 py-2.5">Collector</th>
                <th className="border border-slate-200 dark:border-slate-800 px-3 py-2.5">Inst. #</th>
                <th className="border border-slate-200 dark:border-slate-800 px-3 py-2.5">Amount Due / Balance</th>
                <th className="border border-slate-200 dark:border-slate-800 px-3 py-2.5">Status</th>
                <th className="border border-slate-200 dark:border-slate-800 px-3 py-2.5 w-32">Signature / Remarks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {dueItems.map((item, idx) => {
                const statusColor =
                  item.status === 'Paid'
                    ? 'text-emerald-600 dark:text-emerald-400 font-semibold'
                    : item.status === 'Partial'
                    ? 'text-amber-600 dark:text-amber-400 font-semibold'
                    : 'text-slate-500 dark:text-slate-400';

                return (
                  <tr key={idx} className="border border-slate-200 dark:border-slate-800">
                    <td className="border border-slate-200 dark:border-slate-800 px-3 py-2.5 font-semibold text-slate-900 dark:text-white">
                      {item.borrowerName}
                    </td>
                    <td className="border border-slate-200 dark:border-slate-800 px-3 py-2.5 text-slate-500 dark:text-slate-400">
                      {item.contact}
                    </td>
                    <td className="border border-slate-200 dark:border-slate-800 px-3 py-2.5 text-indigo-600 dark:text-indigo-400 font-medium">
                      {item.collectorName}
                    </td>
                    <td className="border border-slate-200 dark:border-slate-800 px-3 py-2.5 text-slate-600 dark:text-slate-400">
                      #{item.installmentNo}
                    </td>
                    <td className="border border-slate-200 dark:border-slate-800 px-3 py-2.5 font-semibold text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(item.balance)}{' '}
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 font-normal">
                        (Due: {formatCurrency(item.amountDue)})
                      </span>
                    </td>
                    <td className={`border border-slate-200 dark:border-slate-800 px-3 py-2.5 ${statusColor}`}>
                      {item.status}
                    </td>
                    <td className="border border-slate-200 dark:border-slate-800 px-3 py-2.5"></td>
                  </tr>
                );
              })}

              {dueItems.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="border border-slate-200 dark:border-slate-800 px-4 py-8 text-center text-slate-400"
                  >
                    No installment payments due on {formatDateToWords(selectedDate)}.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Verification Section */}
        <div className="pt-8 border-t border-slate-200 dark:border-slate-800 grid grid-cols-2 gap-8 text-center">
          <div>
            <div className="border-b border-slate-300 dark:border-slate-700 pb-8 mb-2"></div>
            <p className="text-slate-900 dark:text-white font-bold text-xs">Field Collector / Remitter</p>
            <p className="text-[10px] text-slate-400">Signature Over Printed Name</p>
          </div>
          <div>
            <div className="border-b border-slate-300 dark:border-slate-700 pb-8 mb-2"></div>
            <p className="text-slate-900 dark:text-white font-bold text-xs">Admin Receiving Officer</p>
            <p className="text-[10px] text-slate-400">Acknowledged & Audited</p>
          </div>
        </div>
      </div>
    </div>
  );
};
