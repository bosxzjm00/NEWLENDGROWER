import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { formatCurrency, getTodayIsoString } from '../../utils/formatters';
import { TrendingDown, X, AlertCircle } from 'lucide-react';

interface CollectorCashoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedCollectorId?: string | null;
}

export const CollectorCashoutModal: React.FC<CollectorCashoutModalProps> = ({
  isOpen,
  onClose,
  preselectedCollectorId,
}) => {
  const { collectors, getCollectorStats, addCollectorCashout } = useApp();

  const [collectorId, setCollectorId] = useState<string>('');
  const [amount, setAmount] = useState<number | ''>('');
  const [date, setDate] = useState(getTodayIsoString());
  const [notes, setNotes] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (isOpen) {
      if (preselectedCollectorId) {
        setCollectorId(preselectedCollectorId);
      } else if (collectors.length > 0) {
        setCollectorId(collectors[0].id);
      }
      setAmount('');
      setNotes('');
      setErrorMessage('');
      setDate(getTodayIsoString());
    }
  }, [isOpen, preselectedCollectorId, collectors]);

  if (!isOpen) return null;

  const currentStats = collectorId ? getCollectorStats(collectorId) : null;
  const availableCommission = currentStats?.availableCommission || 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!collectorId) {
      setErrorMessage('Please select a collector.');
      return;
    }

    if (typeof amount !== 'number' || amount <= 0) {
      setErrorMessage('Please enter a valid cash out amount.');
      return;
    }

    if (amount > availableCommission) {
      setErrorMessage(
        `Cash out amount (${formatCurrency(amount)}) cannot exceed available commission (${formatCurrency(
          availableCommission
        )}).`
      );
      return;
    }

    const success = addCollectorCashout(collectorId, amount, date, notes);
    if (success) {
      onClose();
    } else {
      setErrorMessage('Could not record cash out. Please check available balance.');
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in">
      <div className="card-bg w-full max-w-md p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl">
        <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-600/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <TrendingDown className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-slate-900 dark:text-white font-bold text-sm">Collector Commission Cash Out</h3>
              <p className="text-[11px] text-indigo-600 dark:text-indigo-400 font-medium">Record commission payout to collector</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMessage && (
          <div className="p-3 mb-3 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 rounded-xl text-xs text-rose-600 dark:text-rose-400 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          <div>
            <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">Select Collector *</label>
            <select
              required
              value={collectorId}
              onChange={(e) => setCollectorId(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 cursor-pointer font-medium"
            >
              {collectors.length === 0 ? (
                <option value="">No collectors registered</option>
              ) : (
                collectors.map((c) => {
                  const s = getCollectorStats(c.id);
                  return (
                    <option key={c.id} value={c.id}>
                      {c.name} (Available: {formatCurrency(s.availableCommission)})
                    </option>
                  );
                })
              )}
            </select>
          </div>

          <div>
            <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">Cash Out Amount (₱) *</label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-slate-400">₱</span>
              <input
                type="number"
                step="0.01"
                min="0.01"
                max={availableCommission > 0 ? availableCommission : undefined}
                required
                value={amount}
                onChange={(e) =>
                  setAmount(e.target.value === '' ? '' : parseFloat(e.target.value))
                }
                placeholder="1500"
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-7 pr-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 font-medium"
              />
            </div>
            <div className="flex justify-between items-center mt-1">
              <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-medium">
                Available Commission: {formatCurrency(availableCommission)}
              </span>
              {availableCommission > 0 && (
                <button
                  type="button"
                  onClick={() => setAmount(availableCommission)}
                  className="text-[10px] text-indigo-600 dark:text-indigo-400 underline hover:text-indigo-700 dark:hover:text-indigo-300 cursor-pointer font-medium"
                >
                  Max Available
                </button>
              )}
            </div>
          </div>

          <div>
            <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">Date *</label>
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 font-medium"
            />
          </div>

          <div>
            <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">Notes / Remarks</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g., Weekly commission payout"
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
              disabled={availableCommission <= 0}
              className={`px-4 py-2 rounded-xl font-semibold transition-all cursor-pointer ${
                availableCommission <= 0
                  ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed'
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-600/20 active:scale-[0.98]'
              }`}
            >
              Confirm Cash Out
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
