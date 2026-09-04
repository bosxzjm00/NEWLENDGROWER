import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { getTodayIsoString } from '../../utils/formatters';
import { PlusCircle, X } from 'lucide-react';

interface AddCapitalInvestModalProps {
  isOpen: boolean;
  onClose: () => void;
  capitalId: string | null;
}

export const AddCapitalInvestModal: React.FC<AddCapitalInvestModalProps> = ({
  isOpen,
  onClose,
  capitalId,
}) => {
  const { addCapitalTransaction, capitalSources } = useApp();
  const [amount, setAmount] = useState<number | ''>('');
  const [date, setDate] = useState(getTodayIsoString());
  const [notes, setNotes] = useState('');

  if (!isOpen || !capitalId) return null;

  const currentCap = capitalSources.find((c) => c.id === capitalId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (typeof amount !== 'number' || amount <= 0) return;

    addCapitalTransaction(capitalId, amount, date, notes.trim() || 'Additional investment');
    onClose();
    setAmount('');
    setNotes('');
  };

  return (
    <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in">
      <div className="card-bg w-full max-w-md p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl">
        <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-600/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <PlusCircle className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-slate-900 dark:text-white font-bold text-sm">Add Investment Transaction</h3>
              <p className="text-[11px] text-indigo-600 dark:text-indigo-400 font-medium">{currentCap?.name}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          <div>
            <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">Investment Amount (₱) *</label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-slate-400">₱</span>
              <input
                type="number"
                step="0.01"
                min="1"
                required
                value={amount}
                onChange={(e) =>
                  setAmount(e.target.value === '' ? '' : parseFloat(e.target.value))
                }
                placeholder="10000"
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-7 pr-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 font-medium"
              />
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
            <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">Notes / Description</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g., Additional injection tranche B"
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
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold transition-all shadow-lg shadow-indigo-600/20 active:scale-[0.98] cursor-pointer"
            >
              Save Investment
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
