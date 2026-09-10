import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { PaymentMethod } from '../../types';
import { formatCurrency, formatDateToWords, getTodayIsoString } from '../../utils/formatters';
import { CheckCircle2, X, CreditCard, Calendar, Hash, FileText } from 'lucide-react';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  borrowerId: string | null;
  scheduleId?: string | null;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  borrowerId,
  scheduleId,
}) => {
  const { borrowers, recordPayment } = useApp();

  const [activeScheduleId, setActiveScheduleId] = useState<string | null>(null);
  const [amount, setAmount] = useState<number | ''>('');
  const [method, setMethod] = useState<PaymentMethod>('Cash');
  const [date, setDate] = useState(getTodayIsoString());
  const [reference, setReference] = useState('');
  const [notes, setNotes] = useState('');

  const borrower = borrowers.find((b) => b.id === borrowerId);

  // Initialize or update active schedule
  useEffect(() => {
    if (isOpen && borrower && borrower.schedules.length > 0) {
      if (scheduleId && borrower.schedules.some((s) => s.id === scheduleId)) {
        setActiveScheduleId(scheduleId);
      } else {
        // Default to earliest unpaid or partially paid installment
        const nextUnpaid = borrower.schedules.find((s) => s.status !== 'Paid');
        setActiveScheduleId(nextUnpaid ? nextUnpaid.id : borrower.schedules[0].id);
      }
      setMethod('Cash');
      setDate(getTodayIsoString());
      setReference('');
      setNotes('');
    }
  }, [isOpen, borrowerId, scheduleId, borrower]);

  const schedule = borrower?.schedules.find((s) => s.id === activeScheduleId) || borrower?.schedules[0];

  const amountDue = schedule?.amount_due || 0;
  const alreadyPaid = schedule?.amount_paid || 0;
  const balance = Math.max(0, amountDue - alreadyPaid);

  useEffect(() => {
    if (isOpen && schedule) {
      setAmount(balance > 0 ? balance : 0);
    }
  }, [isOpen, activeScheduleId, balance]);

  if (!isOpen || !borrower || !schedule) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (typeof amount !== 'number' || amount <= 0) return;

    recordPayment(borrower.id, schedule.id, amount, method, date, reference, notes);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in">
      <div className="card-bg w-full max-w-md p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl max-h-[92vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-600/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <CreditCard className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-slate-900 dark:text-white font-bold text-sm">
                Log Payment — Installment #{schedule.installment_no}
              </h3>
              <p className="text-[11px] text-indigo-600 dark:text-indigo-400 font-medium">Borrower: {borrower.name}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {borrower.schedules.length > 1 && (
            <div>
              <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">
                Installment Schedule
              </label>
              <select
                value={schedule.id}
                onChange={(e) => setActiveScheduleId(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 font-medium cursor-pointer"
              >
                {borrower.schedules.map((s) => {
                  const rem = Math.max(0, s.amount_due - s.amount_paid);
                  return (
                    <option key={s.id} value={s.id}>
                      #{s.installment_no} • Due {s.due_date} • {formatCurrency(s.amount_due)} (Bal: {formatCurrency(rem)}) {s.status === 'Paid' ? '✓ Paid' : s.status === 'Partial' ? '⏳ Partial' : ''}
                    </option>
                  );
                })}
              </select>
            </div>
          )}

          {/* Summary Breakdown Card */}
          <div className="p-4 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2 text-slate-600 dark:text-slate-300">
            <div className="flex justify-between items-center">
              <span className="text-slate-500 dark:text-slate-400 font-medium">Borrower</span>
              <span className="text-slate-900 dark:text-white font-semibold">{borrower.name}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500 dark:text-slate-400 font-medium">Due Date</span>
              <span className="text-slate-900 dark:text-white font-medium">{formatDateToWords(schedule.due_date)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500 dark:text-slate-400 font-medium">Installment Due</span>
              <span className="text-slate-900 dark:text-white font-semibold">{formatCurrency(amountDue)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500 dark:text-slate-400 font-medium">Already Paid</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{formatCurrency(alreadyPaid)}</span>
            </div>
            <div className="border-t border-slate-200/80 dark:border-slate-800 pt-2 flex justify-between items-center">
              <span className="text-slate-600 dark:text-slate-400 font-medium">Remaining Balance</span>
              <span className="text-rose-600 dark:text-rose-400 font-bold text-sm">{formatCurrency(balance)}</span>
            </div>
          </div>

          <div>
            <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">
              Amount to Record (₱) <span className="text-rose-500">*</span>
            </label>
            <p className="text-[10px] text-slate-400 mb-1.5">
              Enter the exact amount received. Partial & overpayments are supported.
            </p>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-slate-400">₱</span>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                value={amount}
                onChange={(e) =>
                  setAmount(e.target.value === '' ? '' : parseFloat(e.target.value))
                }
                placeholder="1000"
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-8 pr-3 py-2 text-slate-900 dark:text-white font-semibold focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">Payment Method</label>
              <select
                value={method}
                onChange={(e) => setMethod(e.target.value as PaymentMethod)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 cursor-pointer font-medium"
              >
                <option value="Cash">Cash</option>
                <option value="GCash">GCash</option>
                <option value="Bank Transfer">Bank Transfer</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">Date Received</label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 font-medium"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">Reference No.</label>
            <p className="text-[10px] text-slate-400 mb-1">For GCash / Bank (leave blank for cash)</p>
            <input
              type="text"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="e.g., GC2608-XXXX or TXN-88910"
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 font-medium"
            />
          </div>

          <div>
            <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">Notes & Remarks</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any remarks about this transaction..."
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 font-medium"
            />
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
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold flex items-center gap-1.5 shadow-lg shadow-indigo-600/20 active:scale-[0.98] transition-all cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Record Payment</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
