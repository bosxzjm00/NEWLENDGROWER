import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { LoanFrequency, Borrower } from '../../types';
import { formatCurrency, formatDateToWords, getTodayIsoString, calculateLoanInstallments } from '../../utils/formatters';
import { UserPlus, X, Calculator, Calendar, DollarSign, Percent, Clock } from 'lucide-react';

interface AddBorrowerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AddBorrowerModal: React.FC<AddBorrowerModalProps> = ({ isOpen, onClose }) => {
  const { addBorrower } = useApp();

  const [name, setName] = useState('');
  const [contact, setContact] = useState('');
  const [address, setAddress] = useState('');
  const [amount, setAmount] = useState<number | ''>(5000);
  const [interestRate, setInterestRate] = useState<number | ''>(20);
  const [startDate, setStartDate] = useState(getTodayIsoString());
  const [frequency, setFrequency] = useState<LoanFrequency>('monthly');
  const [installments, setInstallments] = useState<number | ''>(1);

  const numAmount = typeof amount === 'number' ? amount : 0;
  const numRate = typeof interestRate === 'number' ? interestRate : 0;
  const numInst = typeof installments === 'number' && installments > 0 ? installments : 1;

  // Live calculation
  const summary = useMemo(() => {
    const totalInterest = numAmount * (numRate / 100);
    const totalPayable = numAmount + totalInterest;
    const installmentDue = totalPayable / numInst;
    return {
      totalInterest,
      totalPayable,
      installmentDue,
    };
  }, [numAmount, numRate, numInst]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || numAmount <= 0) return;

    const newBorrowerId = `b_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newLoanId = Math.floor(100000 + Math.random() * 900000).toString();
    const calc = calculateLoanInstallments(
      newBorrowerId,
      numAmount,
      numRate,
      startDate,
      frequency,
      numInst
    );

    const newBorrower: Borrower = {
      id: newBorrowerId,
      loan_id: newLoanId,
      name: name.trim(),
      contact: contact.trim(),
      address: address.trim(),
      amount: numAmount,
      interest_rate: numRate,
      start_date: startDate,
      frequency,
      installments: numInst,
      total_payable: calc.totalPayable,
      is_fully_paid: false,
      schedules: calc.schedules,
    };

    addBorrower(newBorrower);
    onClose();
    // Reset form
    setName('');
    setContact('');
    setAddress('');
    setAmount(5000);
    setInterestRate(20);
    setInstallments(1);
    setFrequency('monthly');
  };

  const getFreqLabel = () => {
    if (frequency === 'daily') return 'Per Day';
    if (frequency === 'weekly') return 'Per Week';
    return 'Per Month';
  };

  return (
    <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in">
      <div className="card-bg w-full max-w-lg p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl max-h-[92vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-600/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <UserPlus className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-slate-900 dark:text-white font-bold text-sm leading-tight">
                New Borrower & Loan Registration
              </h3>
              <p className="text-[11px] text-indigo-600 dark:text-indigo-400 font-medium">
                Register account and automatically generate amortization schedules
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          <div>
            <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">Borrower Full Name *</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Juan Dela Cruz"
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 font-medium"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">Contact Number *</label>
              <input
                type="text"
                required
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                placeholder="e.g., 0917-123-4567"
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 font-medium"
              />
            </div>
            <div>
              <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">Address *</label>
              <input
                type="text"
                required
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="e.g., Brgy. Santa Cruz, Manila"
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 font-medium"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">Loan Amount (Principal ₱) *</label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-slate-400">₱</span>
                <input
                  type="number"
                  step="0.01"
                  required
                  min="1"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value === '' ? '' : parseFloat(e.target.value))}
                  placeholder="5000"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-7 pr-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 font-medium"
                />
              </div>
            </div>
            <div>
              <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">Percent Interest (%) *</label>
              <div className="relative">
                <input
                  type="number"
                  step="0.1"
                  required
                  min="0"
                  value={interestRate}
                  onChange={(e) =>
                    setInterestRate(e.target.value === '' ? '' : parseFloat(e.target.value))
                  }
                  placeholder="20"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 font-medium"
                />
                <span className="absolute right-3 top-2 text-slate-400">%</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">Start Date *</label>
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 font-medium"
              />
              <span className="text-[10px] text-indigo-600 dark:text-indigo-400 block mt-1 font-medium">
                Selected: {formatDateToWords(startDate)}
              </span>
            </div>
            <div>
              <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">Payment Frequency</label>
              <select
                value={frequency}
                onChange={(e) => setFrequency(e.target.value as LoanFrequency)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 font-medium cursor-pointer"
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">Number of Installments *</label>
            <input
              type="number"
              min="1"
              max="60"
              required
              value={installments}
              onChange={(e) =>
                setInstallments(e.target.value === '' ? '' : parseInt(e.target.value, 10))
              }
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 font-medium"
            />
          </div>

          {/* Live Loan Summary Review Card */}
          <div className="p-4 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2.5 mt-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
              <span className="text-[11px] uppercase font-bold text-indigo-600 dark:text-indigo-400 tracking-wider flex items-center gap-1.5">
                <Calculator className="w-3.5 h-3.5" />
                Loan Summary Review
              </span>
              <span className="text-[10px] text-slate-400">Pre-computed Amortization</span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-slate-600 dark:text-slate-300">
              <div>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-medium">Principal Amount:</span>
                <span className="text-slate-900 dark:text-white font-semibold">{formatCurrency(numAmount)}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-medium">Interest Rate:</span>
                <span className="text-indigo-600 dark:text-indigo-400 font-semibold">{numRate}% flat</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-slate-600 dark:text-slate-300 border-t border-slate-200/80 dark:border-slate-800 pt-2">
              <div>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-medium">Total Interest:</span>
                <span className="text-amber-600 dark:text-amber-400 font-semibold">
                  {formatCurrency(summary.totalInterest)}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-medium">Total Payable:</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                  {formatCurrency(summary.totalPayable)}
                </span>
              </div>
            </div>

            <div className="border-t border-slate-200/80 dark:border-slate-800 pt-2 flex justify-between items-center">
              <span className="font-medium text-slate-600 dark:text-slate-400">
                Installment Payment ({getFreqLabel()}):
              </span>
              <span className="text-indigo-600 dark:text-indigo-400 font-bold text-sm">
                {formatCurrency(summary.installmentDue)}
              </span>
            </div>
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
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold transition-all shadow-lg shadow-indigo-600/20 active:scale-[0.98] cursor-pointer"
            >
              Confirm & Save Loan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
