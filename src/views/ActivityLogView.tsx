import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import {
  formatCurrency,
  formatActivityDateTime,
  getTodayIsoString,
  formatDateToWords,
} from '../utils/formatters';
import {
  History,
  Calendar,
  Receipt,
  UserPlus,
  Trash2,
  Edit3,
  Filter,
  X,
  Clock,
  Coins,
  CheckCircle2,
  CalendarDays,
  Search,
} from 'lucide-react';
import { ActivityType, ActivityLog } from '../types';

export const ActivityLogView: React.FC = () => {
  const { activityLogs, globalSearch } = useApp();

  const todayStr = getTodayIsoString();
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [selectedType, setSelectedType] = useState<'all' | ActivityType>('all');

  // Compute yesterday's date string
  const yesterdayStr = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d.toISOString().split('T')[0];
  }, []);

  // Filtered activity logs
  const filteredActivities = useMemo(() => {
    return activityLogs.filter((log) => {
      // Date filter
      if (selectedDate) {
        // Match YYYY-MM-DD prefix
        const logDatePrefix = log.date ? log.date.split('T')[0] : '';
        if (logDatePrefix !== selectedDate) {
          return false;
        }
      }

      // Type filter
      if (selectedType !== 'all' && log.type !== selectedType) {
        return false;
      }

      // Global search filter
      if (globalSearch) {
        const query = globalSearch.toLowerCase().trim();
        const titleMatch = log.title?.toLowerCase().includes(query);
        const descMatch = log.description?.toLowerCase().includes(query);
        const borrowerMatch = log.borrowerName?.toLowerCase().includes(query);
        const refMatch = log.reference?.toLowerCase().includes(query);
        if (!titleMatch && !descMatch && !borrowerMatch && !refMatch) {
          return false;
        }
      }

      return true;
    });
  }, [activityLogs, selectedDate, selectedType, globalSearch]);

  // Aggregate stats for the currently filtered view
  const summaryStats = useMemo(() => {
    let paymentCount = 0;
    let paymentTotal = 0;
    let addedCount = 0;
    let addedTotal = 0;
    let deletedCount = 0;

    filteredActivities.forEach((log) => {
      if (log.type === 'payment') {
        paymentCount += 1;
        paymentTotal += log.amount || 0;
      } else if (log.type === 'add_borrower') {
        addedCount += 1;
        addedTotal += log.amount || 0;
      } else if (log.type === 'delete') {
        deletedCount += 1;
      }
    });

    return {
      paymentCount,
      paymentTotal,
      addedCount,
      addedTotal,
      deletedCount,
      totalCount: filteredActivities.length,
    };
  }, [filteredActivities]);

  return (
    <div id="view-activity-log" className="space-y-6 animate-in fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-500/20">
              <History className="w-4 h-4" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              Activity Log
            </h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
            Chronological audit trail of added borrowers, collected installment payments, and deletions
          </p>
        </div>

        {/* Total records counter pill */}
        <div className="flex items-center gap-2">
          <span className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center gap-1.5 shadow-xs">
            <Clock className="w-3.5 h-3.5 text-indigo-500" />
            <span>{filteredActivities.length} {filteredActivities.length === 1 ? 'Record' : 'Records'}</span>
          </span>
        </div>
      </div>

      {/* Date Picker & Filter Toolbar */}
      <div className="card-bg p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Date Picker with Quick Select Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-900/80 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
              <Calendar className="w-4 h-4 text-indigo-500 shrink-0" />
              <label htmlFor="activity-date-picker" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Date:
              </label>
              <input
                id="activity-date-picker"
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-transparent text-xs text-slate-900 dark:text-white font-medium focus:outline-none cursor-pointer"
              />
              {selectedDate && (
                <button
                  type="button"
                  onClick={() => setSelectedDate('')}
                  className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded transition-colors"
                  title="Clear date filter"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Quick Date Presets */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setSelectedDate('')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  !selectedDate
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                All Dates
              </button>
              <button
                type="button"
                onClick={() => setSelectedDate(todayStr)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  selectedDate === todayStr
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                Today
              </button>
              <button
                type="button"
                onClick={() => setSelectedDate(yesterdayStr)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  selectedDate === yesterdayStr
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                Yesterday
              </button>
            </div>
          </div>

          {/* Action Type Filter Pills */}
          <div className="flex items-center gap-1.5 flex-wrap bg-slate-100 dark:bg-slate-900/60 p-1 rounded-xl border border-slate-200/80 dark:border-slate-800 text-xs">
            <button
              type="button"
              onClick={() => setSelectedType('all')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                selectedType === 'all'
                  ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              All Types
            </button>
            <button
              type="button"
              onClick={() => setSelectedType('payment')}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                selectedType === 'payment'
                  ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-xs font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Receipt className="w-3 h-3" />
              <span>Payments</span>
            </button>
            <button
              type="button"
              onClick={() => setSelectedType('add_borrower')}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                selectedType === 'add_borrower'
                  ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-xs font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <UserPlus className="w-3 h-3" />
              <span>Added</span>
            </button>
            <button
              type="button"
              onClick={() => setSelectedType('delete')}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                selectedType === 'delete'
                  ? 'bg-white dark:bg-slate-800 text-rose-600 dark:text-rose-400 shadow-xs font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Trash2 className="w-3 h-3" />
              <span>Deleted</span>
            </button>
          </div>
        </div>

        {/* Active Filter Indicator Banner */}
        {selectedDate && (
          <div className="flex items-center justify-between bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200/80 dark:border-indigo-500/20 px-3.5 py-2 rounded-xl text-xs">
            <div className="flex items-center gap-2">
              <CalendarDays className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span className="text-slate-700 dark:text-slate-300">
                Viewing activity log for{' '}
                <strong className="text-slate-900 dark:text-white font-semibold">
                  {formatDateToWords(selectedDate)}
                </strong>
                {selectedDate === todayStr && ' (Today)'}
                {selectedDate === yesterdayStr && ' (Yesterday)'}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setSelectedDate('')}
              className="text-indigo-600 dark:text-indigo-400 hover:underline font-semibold text-[11px] flex items-center gap-1"
            >
              <span>Show all dates</span>
              <X className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>

      {/* Summary Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card-bg p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Payments Collected
            </span>
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Receipt className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-xl font-bold text-slate-900 dark:text-white mt-1">
            {formatCurrency(summaryStats.paymentTotal)}
          </div>
          <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-0.5">
            {summaryStats.paymentCount} {summaryStats.paymentCount === 1 ? 'transaction' : 'transactions'}
          </p>
        </div>

        <div className="card-bg p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Borrowers Added
            </span>
            <div className="w-7 h-7 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <UserPlus className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-xl font-bold text-slate-900 dark:text-white mt-1">
            {formatCurrency(summaryStats.addedTotal)}
          </div>
          <p className="text-[11px] text-blue-600 dark:text-blue-400 mt-0.5">
            {summaryStats.addedCount} {summaryStats.addedCount === 1 ? 'new loan registered' : 'new loans registered'}
          </p>
        </div>

        <div className="card-bg p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Deleted Records
            </span>
            <div className="w-7 h-7 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <Trash2 className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-xl font-bold text-slate-900 dark:text-white mt-1">
            {summaryStats.deletedCount}
          </div>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
            Removed from active portfolio
          </p>
        </div>
      </div>

      {/* Activity Log List (Compact Small List) */}
      <div className="card-bg rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs divide-y divide-slate-100 dark:divide-slate-800/80 overflow-hidden">
        {filteredActivities.map((log) => {
          let badgeClass = 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700';
          let icon = <History className="w-3.5 h-3.5" />;
          let badgeLabel = 'Activity';

          if (log.type === 'payment') {
            badgeClass = 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/60';
            icon = <Receipt className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />;
            badgeLabel = 'Payment';
          } else if (log.type === 'add_borrower') {
            badgeClass = 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400 border-blue-200 dark:border-blue-800/60';
            icon = <UserPlus className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />;
            badgeLabel = 'New Borrower';
          } else if (log.type === 'delete') {
            badgeClass = 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border-rose-200 dark:border-rose-800/60';
            icon = <Trash2 className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />;
            badgeLabel = 'Deleted';
          } else if (log.type === 'edit_borrower') {
            badgeClass = 'bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-400 border-sky-200 dark:border-sky-800/60';
            icon = <Edit3 className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />;
            badgeLabel = 'Updated';
          }

          return (
            <div
              key={log.id}
              className="px-4 py-2.5 hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-2"
            >
              {/* Left Details: Badge, Title, Description, Ref */}
              <div className="flex items-start sm:items-center gap-2.5 min-w-0 flex-1">
                <span
                  className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-md border shrink-0 ${badgeClass}`}
                >
                  {icon}
                  <span>{badgeLabel}</span>
                </span>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-xs text-slate-800 dark:text-white truncate">
                      {log.title}
                    </span>
                    {log.reference && (
                      <span className="font-mono text-[9px] bg-slate-100 dark:bg-slate-800 px-1.5 py-0.2 rounded text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                        Ref: {log.reference}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                    {log.description}
                  </p>
                </div>
              </div>

              {/* Right Details: Amount & Date/Time */}
              <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center shrink-0 pl-7 sm:pl-0">
                {typeof log.amount === 'number' && log.amount > 0 ? (
                  <span
                    className={`text-xs font-bold ${
                      log.type === 'payment'
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : log.type === 'delete'
                        ? 'text-rose-600 dark:text-rose-400 line-through'
                        : 'text-indigo-600 dark:text-indigo-400'
                    }`}
                  >
                    {log.type === 'payment' ? `+${formatCurrency(log.amount)}` : formatCurrency(log.amount)}
                  </span>
                ) : (
                  <span className="text-xs text-slate-400 dark:text-slate-500">—</span>
                )}
                <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-slate-400" />
                  <span>{formatActivityDateTime(log.date)}</span>
                </span>
              </div>
            </div>
          );
        })}

        {filteredActivities.length === 0 && (
          <div className="p-10 text-center space-y-3">
            <History className="w-9 h-9 text-slate-300 dark:text-slate-600 mx-auto" />
            <div>
              <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                No activity logs found
              </h4>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                {selectedDate
                  ? `There are no actions logged for ${formatDateToWords(selectedDate)}. Try selecting another date or clearing the filter.`
                  : 'There are no activities matching your current filter criteria.'}
              </p>
            </div>
            {(selectedDate || selectedType !== 'all' || globalSearch) && (
              <button
                type="button"
                onClick={() => {
                  setSelectedDate('');
                  setSelectedType('all');
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition-colors shadow-xs cursor-pointer"
              >
                <span>Reset Filters</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
