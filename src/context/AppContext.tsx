import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import {
  Borrower,
  CapitalSource,
  Collector,
  LoanAssignment,
  CollectorCashout,
  ViewType,
  SettingsSection,
  DashboardStats,
  PaymentMethod,
} from '../types';
import {
  INITIAL_BORROWERS,
  INITIAL_CAPITAL,
  INITIAL_COLLECTORS,
  INITIAL_ASSIGNMENTS,
  INITIAL_CASHOUTS,
} from '../data/seedData';
import { getTodayIsoString } from '../utils/formatters';
import {
  getSupabaseConfig,
  saveSupabaseConfig,
  checkSupabaseConnection,
  pushDataToSupabase,
  pullDataFromSupabase,
  clearRemoteSupabasePortfolio,
} from '../lib/supabase';

const STORAGE_KEYS = {
  AUTH: 'lendgrower_logged_in',
  BORROWERS: 'lendgrower_borrowers_data',
  CAPITAL: 'lendgrower_capital_data',
  COLLECTORS: 'lendgrower_collectors_data',
  ASSIGNMENTS: 'lendgrower_assignments_data',
  CASHOUTS: 'lendgrower_collector_cashouts',
  THEME: 'lendgrower_theme_mode',
};

interface AppContextType {
  isLoggedIn: boolean;
  login: (username: string, pass: string) => boolean;
  logout: () => void;
  currentView: ViewType;
  setCurrentView: (view: ViewType) => void;
  themeMode: 'dark' | 'light';
  toggleThemeMode: () => void;
  globalSearch: string;
  setGlobalSearch: (q: string) => void;
  
  // Navigation contextual states
  selectedCollectorId: string | null;
  setSelectedCollectorId: (id: string | null) => void;
  selectedCapitalId: string | null;
  setSelectedCapitalId: (id: string | null) => void;
  selectedStatementBorrowerId: string | null;
  setSelectedStatementBorrowerId: (id: string | null) => void;
  selectedAgreementBorrowerId: string | null;
  setSelectedAgreementBorrowerId: (id: string | null) => void;
  selectedLedgerBorrowerId: string | null;
  setSelectedLedgerBorrowerId: (id: string | null) => void;
  activeSettingsSection: SettingsSection;
  setActiveSettingsSection: (section: SettingsSection) => void;

  // Data lists
  borrowers: Borrower[];
  capitalSources: CapitalSource[];
  collectors: Collector[];
  assignments: LoanAssignment[];
  collectorCashouts: CollectorCashout[];

  // CRUD actions
  addBorrower: (borrower: Borrower) => void;
  deleteBorrower: (id: string) => void;
  recordPayment: (
    borrowerId: string,
    scheduleId: string,
    paymentAmount: number,
    method: PaymentMethod,
    date: string,
    reference?: string,
    notes?: string
  ) => void;

  addCapitalSource: (name: string, amount: number, date: string) => void;
  deleteCapitalSource: (id: string) => void;
  addCapitalTransaction: (capitalId: string, amount: number, date: string, notes: string) => void;
  deleteCapitalTransaction: (capitalId: string, txId: string) => void;

  addCollector: (name: string, contact: string, address: string) => void;
  deleteCollector: (id: string) => void;
  assignLoan: (collectorId: string, borrowerId: string) => void;
  unassignLoan: (assignmentId: string) => void;

  addCollectorCashout: (collectorId: string, amount: number, date: string, notes: string) => boolean;
  deleteCollectorCashout: (id: string) => void;

  // Stats & Helpers
  stats: DashboardStats;
  getCollectorStats: (collectorId: string) => {
    assignedCount: number;
    fullyPaidCount: number;
    totalAssignedAmount: number;
    totalUnpaid: number;
    earnedCommission: number;
    cashedOutCommission: number;
    availableCommission: number;
  };

  // Database Backup/Restore & Reset
  exportDatabase: () => void;
  importDatabase: (jsonContent: string) => boolean;
  resetAllData: () => Promise<{ success: boolean; supabaseReset: boolean; supabaseError?: string; isRlsError?: boolean }>;
  resetToDefaultSeed: () => Promise<{ success: boolean; supabaseReset: boolean; supabaseError?: string; isRlsError?: boolean }>;

  // Supabase Integration
  isSupabaseConfigured: boolean;
  supabaseSyncStatus: {
    connected: boolean;
    syncing: boolean;
    lastSynced: string | null;
    message: string;
  };
  syncWithSupabase: () => Promise<{ success: boolean; message: string }>;
  pushToSupabase: () => Promise<{ success: boolean; message: string }>;
  pullFromSupabase: () => Promise<{ success: boolean; message: string }>;
  saveSupabaseSettings: (url: string, key: string) => Promise<{ success: boolean; message: string }>;
}

const AppContext = createContext<AppContextType | null>(null);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    return localStorage.getItem(STORAGE_KEYS.AUTH) === 'true';
  });

  const [themeMode, setThemeMode] = useState<'dark' | 'light'>(() => {
    return (localStorage.getItem(STORAGE_KEYS.THEME) as 'dark' | 'light') || 'dark';
  });

  const [currentView, setCurrentView] = useState<ViewType>('dashboard');
  const [globalSearch, setGlobalSearch] = useState<string>('');
  
  const [selectedCollectorId, setSelectedCollectorId] = useState<string | null>(null);
  const [selectedCapitalId, setSelectedCapitalId] = useState<string | null>(null);
  const [selectedStatementBorrowerId, setSelectedStatementBorrowerId] = useState<string | null>(null);
  const [selectedAgreementBorrowerId, setSelectedAgreementBorrowerId] = useState<string | null>(null);
  const [selectedLedgerBorrowerId, setSelectedLedgerBorrowerId] = useState<string | null>(null);
  const [activeSettingsSection, setActiveSettingsSection] = useState<SettingsSection>('backup');

  // Core Data
  const isPreviouslyCleared = localStorage.getItem('lendgrower_portfolio_cleared') === 'true';

  const [borrowers, setBorrowers] = useState<Borrower[]>(() => {
    if (isPreviouslyCleared) return [];
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.BORROWERS);
      if (stored !== null) return JSON.parse(stored);
    } catch {
      // fallback
    }
    return INITIAL_BORROWERS;
  });

  const [capitalSources, setCapitalSources] = useState<CapitalSource[]>(() => {
    if (isPreviouslyCleared) return [];
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.CAPITAL);
      if (stored !== null) return JSON.parse(stored);
    } catch {
      // fallback
    }
    return INITIAL_CAPITAL;
  });

  const [collectors, setCollectors] = useState<Collector[]>(() => {
    if (isPreviouslyCleared) return [];
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.COLLECTORS);
      if (stored !== null) return JSON.parse(stored);
    } catch {
      // fallback
    }
    return INITIAL_COLLECTORS;
  });

  const [assignments, setAssignments] = useState<LoanAssignment[]>(() => {
    if (isPreviouslyCleared) return [];
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.ASSIGNMENTS);
      if (stored !== null) return JSON.parse(stored);
    } catch {
      // fallback
    }
    return INITIAL_ASSIGNMENTS;
  });

  const [collectorCashouts, setCollectorCashouts] = useState<CollectorCashout[]>(() => {
    if (isPreviouslyCleared) return [];
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.CASHOUTS);
      if (stored !== null) return JSON.parse(stored);
    } catch {
      // fallback
    }
    return INITIAL_CASHOUTS;
  });

  // Sync to LocalStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.BORROWERS, JSON.stringify(borrowers));
  }, [borrowers]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CAPITAL, JSON.stringify(capitalSources));
  }, [capitalSources]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.COLLECTORS, JSON.stringify(collectors));
  }, [collectors]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ASSIGNMENTS, JSON.stringify(assignments));
  }, [assignments]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CASHOUTS, JSON.stringify(collectorCashouts));
  }, [collectorCashouts]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.THEME, themeMode);
    if (themeMode === 'light') {
      document.body.classList.add('light-mode');
      document.documentElement.classList.remove('dark');
    } else {
      document.body.classList.remove('light-mode');
      document.documentElement.classList.add('dark');
    }
  }, [themeMode]);

  const toggleThemeMode = () => {
    setThemeMode((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const login = (u: string, p: string) => {
    if (u === 'bosxzjm' && p === 'premium1') {
      setIsLoggedIn(true);
      localStorage.setItem(STORAGE_KEYS.AUTH, 'true');
      return true;
    }
    return false;
  };

  const logout = () => {
    setIsLoggedIn(false);
    localStorage.setItem(STORAGE_KEYS.AUTH, 'false');
  };

  // Borrower Operations
  const addBorrower = (newBorrower: Borrower) => {
    setBorrowers((prev) => [newBorrower, ...prev]);
  };

  const deleteBorrower = (id: string) => {
    setBorrowers((prev) => prev.filter((b) => b.id !== id));
    setAssignments((prev) => prev.filter((a) => a.borrowerId !== id));
  };

  const recordPayment = (
    borrowerId: string,
    scheduleId: string,
    paymentAmount: number,
    method: PaymentMethod,
    date: string,
    reference?: string,
    notes?: string
  ) => {
    setBorrowers((prev) =>
      prev.map((borrower) => {
        if (borrower.id !== borrowerId) return borrower;

        const updatedSchedules = borrower.schedules.map((sched) => {
          if (sched.id !== scheduleId) return sched;

          const newPaid = sched.amount_paid + paymentAmount;
          const newStatus: 'Pending' | 'Partial' | 'Paid' =
            newPaid >= sched.amount_due ? 'Paid' : 'Partial';

          const newPaymentRecord = {
            id: `pay_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            amount: paymentAmount,
            method,
            date: date || getTodayIsoString(),
            reference,
            notes,
          };

          return {
            ...sched,
            amount_paid: newPaid,
            status: newStatus,
            payments: [...(sched.payments || []), newPaymentRecord],
          };
        });

        const allPaid = updatedSchedules.every((s) => s.status === 'Paid');

        return {
          ...borrower,
          schedules: updatedSchedules,
          is_fully_paid: allPaid,
        };
      })
    );
  };

  // Capital Operations
  const addCapitalSource = (name: string, amount: number, date: string) => {
    const newCap: CapitalSource = {
      id: `c_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
      name,
      amount,
      date,
      transactions: [
        {
          id: `tx_${Date.now()}_init`,
          amount,
          date,
          notes: 'Initial capital investment',
        },
      ],
    };
    setCapitalSources((prev) => [newCap, ...prev]);
  };

  const deleteCapitalSource = (id: string) => {
    setCapitalSources((prev) => prev.filter((c) => c.id !== id));
  };

  const addCapitalTransaction = (
    capitalId: string,
    amount: number,
    date: string,
    notes: string
  ) => {
    setCapitalSources((prev) =>
      prev.map((cap) => {
        if (cap.id !== capitalId) return cap;
        const newTx = {
          id: `tx_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
          amount,
          date,
          notes: notes || 'Additional capital injection',
        };
        const newTransactions = [...cap.transactions, newTx];
        const newTotalAmount = newTransactions.reduce((sum, t) => sum + t.amount, 0);
        return {
          ...cap,
          amount: newTotalAmount,
          date,
          transactions: newTransactions,
        };
      })
    );
  };

  const deleteCapitalTransaction = (capitalId: string, txId: string) => {
    setCapitalSources((prev) =>
      prev.map((cap) => {
        if (cap.id !== capitalId) return cap;
        const newTransactions = cap.transactions.filter((t) => t.id !== txId);
        const newTotalAmount = newTransactions.reduce((sum, t) => sum + t.amount, 0);
        return {
          ...cap,
          amount: newTotalAmount,
          transactions: newTransactions,
        };
      })
    );
  };

  // Collector Operations
  const addCollector = (name: string, contact: string, address: string) => {
    const newCol: Collector = {
      id: `col_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
      name,
      contact,
      address,
    };
    setCollectors((prev) => [newCol, ...prev]);
  };

  const deleteCollector = (id: string) => {
    setCollectors((prev) => prev.filter((c) => c.id !== id));
    setAssignments((prev) => prev.filter((a) => a.collectorId !== id));
    setCollectorCashouts((prev) => prev.filter((co) => co.collectorId !== id));
  };

  const assignLoan = (collectorId: string, borrowerId: string) => {
    // Check if already assigned
    const exists = assignments.some((a) => a.borrowerId === borrowerId);
    if (exists) {
      setAssignments((prev) =>
        prev.map((a) => (a.borrowerId === borrowerId ? { ...a, collectorId } : a))
      );
    } else {
      const newAsg: LoanAssignment = {
        id: `asg_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
        collectorId,
        borrowerId,
      };
      setAssignments((prev) => [newAsg, ...prev]);
    }
  };

  const unassignLoan = (assignmentId: string) => {
    setAssignments((prev) => prev.filter((a) => a.id !== assignmentId));
  };

  const addCollectorCashout = (
    collectorId: string,
    amount: number,
    date: string,
    notes: string
  ) => {
    const colStats = getCollectorStats(collectorId);
    if (amount <= 0 || amount > colStats.availableCommission) {
      return false;
    }

    const newCashout: CollectorCashout = {
      id: `co_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
      collectorId,
      amount,
      date,
      notes: notes || 'Commission cash out payout',
    };
    setCollectorCashouts((prev) => [newCashout, ...prev]);
    return true;
  };

  const deleteCollectorCashout = (id: string) => {
    setCollectorCashouts((prev) => prev.filter((c) => c.id !== id));
  };

  // Collector Statistics Calculation
  const getCollectorStats = (collectorId: string) => {
    const assignedLoans = assignments.filter((a) => a.collectorId === collectorId);
    let totalAssignedAmount = 0;
    let totalUnpaid = 0;
    let totalCommissionEarned = 0;
    let fullyPaidCount = 0;

    assignedLoans.forEach((asg) => {
      const borrower = borrowers.find((b) => b.id === asg.borrowerId);
      if (borrower) {
        totalAssignedAmount += borrower.amount;
        if (borrower.is_fully_paid) {
          fullyPaidCount++;
        }

        const totalInterest = borrower.total_payable - borrower.amount;
        const interestRatio = borrower.total_payable > 0 ? totalInterest / borrower.total_payable : 0;

        let borrowerCollected = 0;
        let borrowerRemaining = borrower.total_payable;

        borrower.schedules.forEach((s) => {
          borrowerCollected += s.amount_paid;
          borrowerRemaining -= s.amount_paid;
        });

        totalUnpaid += Math.max(0, borrowerRemaining);
        const interestPortionCollected = borrowerCollected * interestRatio;
        totalCommissionEarned += interestPortionCollected * 0.25; // 25% collector share
      }
    });

    const cashedOut = collectorCashouts
      .filter((co) => co.collectorId === collectorId)
      .reduce((sum, co) => sum + co.amount, 0);

    const available = Math.max(0, totalCommissionEarned - cashedOut);

    return {
      assignedCount: assignedLoans.length,
      fullyPaidCount,
      totalAssignedAmount,
      totalUnpaid,
      earnedCommission: totalCommissionEarned,
      cashedOutCommission: cashedOut,
      availableCommission: available,
    };
  };

  // Overall Dashboard Statistics
  const stats: DashboardStats = useMemo(() => {
    let totalOutstanding = 0;
    let activeLoansCount = 0;
    let overdueAccountsCount = 0;
    let totalCollected = 0;
    let totalProfit = 0;
    let totalCapitalDisbursed = 0;
    let totalInterestEarnedFromPayments = 0;

    const today = new Date().toISOString().split('T')[0];

    borrowers.forEach((b) => {
      const loanTotalInterest = b.total_payable - b.amount;
      totalProfit += loanTotalInterest;

      const interestRatio = b.total_payable > 0 ? loanTotalInterest / b.total_payable : 0;
      let borrowerCollected = 0;

      if (!b.is_fully_paid) {
        activeLoansCount++;
        totalCapitalDisbursed += b.amount;
        let borrowerRemaining = b.total_payable;

        b.schedules.forEach((s) => {
          borrowerCollected += s.amount_paid;
          borrowerRemaining -= s.amount_paid;

          if (s.status !== 'Paid' && s.due_date < today) {
            overdueAccountsCount++;
          }
        });

        totalOutstanding += Math.max(0, borrowerRemaining);
      } else {
        b.schedules.forEach((s) => {
          borrowerCollected += s.amount_paid;
        });
      }

      totalCollected += borrowerCollected;
      totalInterestEarnedFromPayments += borrowerCollected * interestRatio;
    });

    const totalCapitalPool = capitalSources.reduce((sum, c) => sum + c.amount, 0);
    const collectorProfit = totalInterestEarnedFromPayments * 0.25;
    const ownerInterest = totalInterestEarnedFromPayments * 0.75;
    const totalInterestEarned = totalInterestEarnedFromPayments;

    return {
      totalCapitalPool,
      totalCapitalDisbursed,
      totalOutstanding,
      overdueAccountsCount,
      activeLoansCount,
      totalCollected,
      totalProfit,
      totalInterestEarned,
      ownerInterest,
      collectorProfit,
    };
  }, [borrowers, capitalSources]);

  // Database Backup / Import / Reset
  const exportDatabase = () => {
    const data = {
      version: '2.0',
      exportDate: new Date().toISOString(),
      borrowers,
      capital: capitalSources,
      collectors,
      assignments,
      cashouts: collectorCashouts,
    };

    const jsonStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(data, null, 2));
    const a = document.createElement('a');
    a.href = jsonStr;
    a.download = `lendgrower_backup_${getTodayIsoString()}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const importDatabase = (jsonContent: string) => {
    try {
      const parsed = JSON.parse(jsonContent);
      if (parsed.borrowers && Array.isArray(parsed.borrowers)) {
        setBorrowers(parsed.borrowers);
      }
      if (parsed.capital && Array.isArray(parsed.capital)) {
        setCapitalSources(parsed.capital);
      }
      if (parsed.collectors && Array.isArray(parsed.collectors)) {
        setCollectors(parsed.collectors);
      }
      if (parsed.assignments && Array.isArray(parsed.assignments)) {
        setAssignments(parsed.assignments);
      }
      if (parsed.cashouts && Array.isArray(parsed.cashouts)) {
        setCollectorCashouts(parsed.cashouts);
      }
      return true;
    } catch {
      return false;
    }
  };

  const resetAllData = async (): Promise<{ success: boolean; supabaseReset: boolean; supabaseError?: string; isRlsError?: boolean }> => {
    // 1. Wipe React memory state
    setBorrowers([]);
    setCapitalSources([]);
    setCollectors([]);
    setAssignments([]);
    setCollectorCashouts([]);

    // 2. Persist empty state to local storage and mark as cleared
    localStorage.setItem(STORAGE_KEYS.BORROWERS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.CAPITAL, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.COLLECTORS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.ASSIGNMENTS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.CASHOUTS, JSON.stringify([]));
    localStorage.setItem('lendgrower_portfolio_cleared', 'true');

    // 3. Reset remote Supabase database if connected
    let supabaseReset = false;
    let supabaseError: string | undefined;
    let isRlsError = false;

    if (isSupabaseConfigured) {
      setSupabaseSyncStatus((prev) => ({ ...prev, syncing: true }));
      const res = await clearRemoteSupabasePortfolio({
        borrowers: [],
        capitalSources: [],
        collectors: [],
        assignments: [],
        collectorCashouts: [],
      });
      supabaseReset = res.success;
      if (!res.success) {
        supabaseError = res.error;
        isRlsError = res.isRlsError || false;
        setSupabaseSyncStatus((prev) => ({
          ...prev,
          syncing: false,
          message: res.error || 'Failed to wipe remote Supabase',
        }));
      } else {
        setSupabaseSyncStatus((prev) => ({
          ...prev,
          syncing: false,
          lastSynced: new Date().toLocaleTimeString(),
          message: 'Portfolio fully wiped from Supabase (0 records)',
        }));
      }
    }

    return { success: true, supabaseReset, supabaseError, isRlsError };
  };

  const resetToDefaultSeed = async (): Promise<{ success: boolean; supabaseReset: boolean; supabaseError?: string; isRlsError?: boolean }> => {
    localStorage.removeItem('lendgrower_portfolio_cleared');
    setBorrowers(INITIAL_BORROWERS);
    setCapitalSources(INITIAL_CAPITAL);
    setCollectors(INITIAL_COLLECTORS);
    setAssignments(INITIAL_ASSIGNMENTS);
    setCollectorCashouts(INITIAL_CASHOUTS);

    localStorage.setItem(STORAGE_KEYS.BORROWERS, JSON.stringify(INITIAL_BORROWERS));
    localStorage.setItem(STORAGE_KEYS.CAPITAL, JSON.stringify(INITIAL_CAPITAL));
    localStorage.setItem(STORAGE_KEYS.COLLECTORS, JSON.stringify(INITIAL_COLLECTORS));
    localStorage.setItem(STORAGE_KEYS.ASSIGNMENTS, JSON.stringify(INITIAL_ASSIGNMENTS));
    localStorage.setItem(STORAGE_KEYS.CASHOUTS, JSON.stringify(INITIAL_CASHOUTS));

    let supabaseReset = false;
    let supabaseError: string | undefined;
    let isRlsError = false;

    if (isSupabaseConfigured) {
      setSupabaseSyncStatus((prev) => ({ ...prev, syncing: true }));
      const res = await clearRemoteSupabasePortfolio({
        borrowers: INITIAL_BORROWERS,
        capitalSources: INITIAL_CAPITAL,
        collectors: INITIAL_COLLECTORS,
        assignments: INITIAL_ASSIGNMENTS,
        collectorCashouts: INITIAL_CASHOUTS,
      });
      supabaseReset = res.success;
      if (!res.success) {
        supabaseError = res.error;
        isRlsError = res.isRlsError || false;
        setSupabaseSyncStatus((prev) => ({
          ...prev,
          syncing: false,
          message: res.error || 'Failed to seed remote Supabase',
        }));
      } else {
        setSupabaseSyncStatus((prev) => ({
          ...prev,
          syncing: false,
          lastSynced: new Date().toLocaleTimeString(),
          message: 'Demo seed data pushed to Supabase cloud',
        }));
      }
    }

    return { success: true, supabaseReset, supabaseError, isRlsError };
  };

  // Supabase state and operations
  const [supabaseSyncStatus, setSupabaseSyncStatus] = useState<{
    connected: boolean;
    syncing: boolean;
    lastSynced: string | null;
    message: string;
  }>({
    connected: false,
    syncing: false,
    lastSynced: null,
    message: 'Supabase ready to connect',
  });

  const { url: currentSupabaseUrl, key: currentSupabaseKey } = getSupabaseConfig();
  const isSupabaseConfigured = Boolean(currentSupabaseUrl && currentSupabaseKey);

  // Check Supabase connection on load if configured
  useEffect(() => {
    if (isSupabaseConfigured) {
      checkSupabaseConnection().then(async (res) => {
        setSupabaseSyncStatus((prev) => ({
          ...prev,
          connected: res.connected,
          message: res.message,
        }));

        if (res.connected) {
          try {
            // If user explicitly cleared data, never auto-resurrect old remote records
            const isCleared = localStorage.getItem('lendgrower_portfolio_cleared') === 'true';
            if (isCleared) {
              return;
            }

            const remote = await pullDataFromSupabase();
            if (remote.success && remote.data && remote.data.borrowers && remote.data.borrowers.length > 0) {
              setBorrowers(remote.data.borrowers);
              if (remote.data.capitalSources) setCapitalSources(remote.data.capitalSources);
              if (remote.data.collectors) setCollectors(remote.data.collectors);
              if (remote.data.assignments) setAssignments(remote.data.assignments);
              if (remote.data.collectorCashouts) setCollectorCashouts(remote.data.collectorCashouts);
              setSupabaseSyncStatus((prev) => ({
                ...prev,
                lastSynced: new Date().toLocaleTimeString(),
                message: 'Connected & synchronized with Supabase cloud database',
              }));
            }
          } catch (syncErr) {
            console.warn('Initial Supabase sync notice:', syncErr);
          }
        }
      });
    }
  }, [isSupabaseConfigured]);

  const pushToSupabase = async () => {
    setSupabaseSyncStatus((prev) => ({ ...prev, syncing: true }));
    const result = await pushDataToSupabase({
      borrowers,
      capitalSources,
      collectors,
      assignments,
      collectorCashouts,
    });
    setSupabaseSyncStatus((prev) => ({
      ...prev,
      syncing: false,
      connected: result.success,
      lastSynced: result.success ? new Date().toLocaleTimeString() : prev.lastSynced,
      message: result.success ? 'Synced to Supabase successfully!' : (result.error || 'Failed to sync to Supabase'),
    }));
    return {
      success: result.success,
      message: result.success ? 'Synced to Supabase successfully!' : (result.error || 'Failed to sync to Supabase'),
    };
  };

  const pullFromSupabase = async () => {
    setSupabaseSyncStatus((prev) => ({ ...prev, syncing: true }));
    const result = await pullDataFromSupabase();
    if (result.success && result.data) {
      localStorage.removeItem('lendgrower_portfolio_cleared');
      if (result.data.borrowers) setBorrowers(result.data.borrowers);
      if (result.data.capitalSources) setCapitalSources(result.data.capitalSources);
      if (result.data.collectors) setCollectors(result.data.collectors);
      if (result.data.assignments) setAssignments(result.data.assignments);
      if (result.data.collectorCashouts) setCollectorCashouts(result.data.collectorCashouts);

      setSupabaseSyncStatus((prev) => ({
        ...prev,
        syncing: false,
        connected: true,
        lastSynced: new Date().toLocaleTimeString(),
        message: 'Pulled fresh records from Supabase!',
      }));
      return { success: true, message: 'Pulled fresh records from Supabase!' };
    } else {
      setSupabaseSyncStatus((prev) => ({
        ...prev,
        syncing: false,
        message: result.error || 'Failed to pull from Supabase',
      }));
      return { success: false, message: result.error || 'Failed to pull from Supabase' };
    }
  };

  const syncWithSupabase = async () => {
    return pushToSupabase();
  };

  const saveSupabaseSettings = async (url: string, key: string) => {
    saveSupabaseConfig(url, key);
    if (!url || !key) {
      setSupabaseSyncStatus({
        connected: false,
        syncing: false,
        lastSynced: null,
        message: 'Supabase credentials cleared',
      });
      return { success: true, message: 'Supabase credentials cleared' };
    }

    setSupabaseSyncStatus((prev) => ({ ...prev, syncing: true, message: 'Connecting to Supabase...' }));
    const res = await checkSupabaseConnection();
    setSupabaseSyncStatus({
      connected: res.connected,
      syncing: false,
      lastSynced: null,
      message: res.message,
    });
    return { success: res.connected, message: res.message };
  };

  return (
    <AppContext.Provider
      value={{
        isLoggedIn,
        login,
        logout,
        currentView,
        setCurrentView,
        themeMode,
        toggleThemeMode,
        globalSearch,
        setGlobalSearch,
        selectedCollectorId,
        setSelectedCollectorId,
        selectedCapitalId,
        setSelectedCapitalId,
        selectedStatementBorrowerId,
        setSelectedStatementBorrowerId,
        selectedAgreementBorrowerId,
        setSelectedAgreementBorrowerId,
        selectedLedgerBorrowerId,
        setSelectedLedgerBorrowerId,
        activeSettingsSection,
        setActiveSettingsSection,
        borrowers,
        capitalSources,
        collectors,
        assignments,
        collectorCashouts,
        addBorrower,
        deleteBorrower,
        recordPayment,
        addCapitalSource,
        deleteCapitalSource,
        addCapitalTransaction,
        deleteCapitalTransaction,
        addCollector,
        deleteCollector,
        assignLoan,
        unassignLoan,
        addCollectorCashout,
        deleteCollectorCashout,
        stats,
        getCollectorStats,
        exportDatabase,
        importDatabase,
        resetAllData,
        resetToDefaultSeed,
        isSupabaseConfigured,
        supabaseSyncStatus,
        syncWithSupabase,
        pushToSupabase,
        pullFromSupabase,
        saveSupabaseSettings,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
