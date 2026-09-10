import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { User, KeyRound, ArrowRight, Search, RefreshCw, Smartphone } from 'lucide-react';
import { fetchBorrowerFromSupabase } from '../lib/supabase';

export const LoginView: React.FC = () => {
  const { login, borrowers, setSelectedPortalBorrowerId, setCurrentView } = useApp();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Borrower Loan ID search state
  const [loanSearchId, setLoanSearchId] = useState('');
  const [loanSearchError, setLoanSearchError] = useState('');
  const [isSearchingLoan, setIsSearchingLoan] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const success = await login(username.trim(), password);
      if (!success) {
        setError('Invalid username or password. Please check your credentials.');
      }
    } catch {
      setError('An error occurred during sign in. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLoanSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoanSearchError('');
    const rawInput = loanSearchId.trim();
    if (!rawInput) {
      setLoanSearchError('Please enter your 6-digit Loan ID');
      return;
    }

    const cleanInput = rawInput.replace(/^[#\s]+/, '').toLowerCase();

    // 1. Search existing borrowers in state
    const localMatch = borrowers.find((b) => {
      const bLoanId = (b.loan_id || '').toLowerCase();
      const bId = b.id.toLowerCase();
      return bLoanId === cleanInput || bId === cleanInput;
    });

    if (localMatch) {
      const portalUrl = `${window.location.pathname}?portal=${encodeURIComponent(localMatch.id)}`;
      window.history.pushState(null, '', portalUrl);
      setSelectedPortalBorrowerId(localMatch.id);
      setCurrentView('borrower-portal');
      window.dispatchEvent(new Event('popstate'));
      return;
    }

    // 2. Search Supabase cloud database if available
    setIsSearchingLoan(true);
    try {
      const res = await fetchBorrowerFromSupabase(cleanInput);
      if (res.success && res.borrower) {
        const found = res.borrower;
        const portalUrl = `${window.location.pathname}?portal=${encodeURIComponent(found.id)}`;
        window.history.pushState(null, '', portalUrl);
        setSelectedPortalBorrowerId(found.id);
        setCurrentView('borrower-portal');
        window.dispatchEvent(new Event('popstate'));
        return;
      }
      setLoanSearchError(`No active loan record found for Loan ID ${rawInput}.`);
    } catch {
      setLoanSearchError(`No active loan record found for Loan ID ${rawInput}.`);
    } finally {
      setIsSearchingLoan(false);
    }
  };

  return (
    <div
      id="view-login"
      className="fixed inset-0 bg-slate-900/95 backdrop-blur-md flex items-center justify-center z-50 p-4 overflow-y-auto"
    >
      <div className="w-full max-w-md p-8 rounded-2xl border border-slate-700/80 bg-slate-900 shadow-2xl space-y-5 relative overflow-hidden my-auto">
        {/* Glow accent */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none -mr-16 -mt-16"></div>

        <div className="text-center space-y-1.5 relative">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-indigo-600 text-white shadow-lg shadow-indigo-500/30 mb-1">
            <span className="text-2xl font-bold">₱</span>
          </div>
          <h1 className="text-white font-bold text-2xl tracking-tight">LendGrower</h1>
          <p className="text-xs text-indigo-400 uppercase tracking-wider font-semibold">
            Admin & Borrower Access Portal
          </p>
        </div>

        {error && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-400 text-center animate-in fade-in">
            {error}
          </div>
        )}

        {/* Admin / User Login Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          <div>
            <label className="block text-slate-400 mb-1 font-medium">
              Username
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                id="login-email"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="w-full bg-slate-950/70 border border-slate-800 rounded-xl pl-10 pr-3.5 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                placeholder="Enter username"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-400 mb-1 font-medium">
              Password
            </label>
            <div className="relative">
              <KeyRound className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                id="login-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full bg-slate-950/70 border border-slate-800 rounded-xl pl-10 pr-3.5 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            id="login-submit-button"
            disabled={isSubmitting}
            className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-semibold text-xs transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/25 cursor-pointer active:scale-[0.99]"
          >
            {isSubmitting ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Signing In...</span>
              </>
            ) : (
              <>
                <span>Sign In to Portfolio</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Borrower Loan ID Lookup Section - Enlarged */}
        <div className="pt-4 border-t border-slate-800/90 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400">
                <Smartphone className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div>
                <span className="text-white font-bold text-sm sm:text-base tracking-tight block">
                  Borrower Portal Access
                </span>
                <span className="text-[11px] text-slate-400 font-normal">
                  View your schedule, payments & balance
                </span>
              </div>
            </div>
          </div>

          <form onSubmit={handleLoanSearch} className="space-y-3">
            <div className="relative">
              <Search className="w-5 h-5 text-slate-400 absolute left-3.5 sm:left-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                id="search-loan-id"
                value={loanSearchId}
                onChange={(e) => {
                  setLoanSearchId(e.target.value);
                  if (loanSearchError) setLoanSearchError('');
                }}
                maxLength={12}
                className="w-full bg-slate-950/80 border border-slate-700/90 rounded-xl pl-11 sm:pl-12 pr-4 py-3 sm:py-3.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all font-mono font-semibold tracking-wider text-base sm:text-lg"
                placeholder="Enter 6-digit Loan ID (e.g. 482910)"
              />
            </div>

            {loanSearchError && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-400 text-center animate-in fade-in">
                {loanSearchError}
              </div>
            )}

            <button
              type="submit"
              disabled={isSearchingLoan}
              className="w-full py-3 sm:py-3.5 rounded-xl bg-indigo-950/60 hover:bg-indigo-900/80 text-indigo-300 hover:text-white border border-indigo-500/40 hover:border-indigo-400 font-semibold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer active:scale-[0.99] disabled:opacity-50"
            >
              {isSearchingLoan ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-indigo-400" />
                  <span>Verifying Loan ID...</span>
                </>
              ) : (
                <>
                  <Search className="w-4 h-4 text-indigo-400" />
                  <span>Search Loan ID & Open Portal</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
