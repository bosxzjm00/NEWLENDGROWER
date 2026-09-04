import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { formatCurrency, formatDateToWords, getTodayIsoString } from '../utils/formatters';
import { Printer, ArrowLeft, CalendarCheck } from 'lucide-react';

export const CollectionSheetView: React.FC = () => {
  const {
    borrowers,
    collectors,
    assignments,
    setCurrentView,
  } = useApp();

  const [selectedDate, setSelectedDate] = useState(getTodayIsoString());

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

  return (
    <div id="view-collection-sheet" className="space-y-6 max-w-4xl mx-auto animate-in fade-in">
      {/* Action Controls (Hidden on Print) */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 print:hidden">
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
            onClick={() => window.print()}
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
