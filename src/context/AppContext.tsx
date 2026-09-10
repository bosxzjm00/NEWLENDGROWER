import React, { createContext, useContext, useState, useEffect, useMemo, useRef } from 'react';
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
  ActivityLog,
  ActivityType,
  UserAccount,
} from '../types';
import {
  INITIAL_BORROWERS,
  INITIAL_CAPITAL,
  INITIAL_COLLECTORS,
  INITIAL_ASSIGNMENTS,
  INITIAL_CASHOUTS,
  INITIAL_ACTIVITIES,
} from '../data/seedData';
import { getTodayIsoString, formatCurrency } from '../utils/formatters';
import {
  getSupabaseConfig,
  saveSupabaseConfig,
  checkSupabaseConnection,
  pushDataToSupabase,
  pullDataFromSupabase,
  clearRemoteSupabasePortfolio,
  pushUsersRegistryToSupabase,
  pullUsersRegistryFromSupabase,
} from '../lib/supabase';

const STORAGE_KEYS = {
  AUTH: 'lendgrower_logged_in',
  CURRENT_USER: 'lendgrower_current_username',
  USERS_REGISTRY: 'lendgrower_users_registry',
  BORROWERS: 'lendgrower_borrowers_data',
  CAPITAL: 'lendgrower_capital_data',
  COLLECTORS: 'lendgrower_collectors_data',
  ASSIGNMENTS: 'lendgrower_assignments_data',
  CASHOUTS: 'lendgrower_collector_cashouts',
  ACTIVITIES: 'lendgrower_activity_logs',
  THEME: 'lendgrower_theme_mode',
};

export const getUserStorageKey = (username: string, key: string): string => {
  const cleanUser = (username || 'bosxzjm').trim().toLowerCase();
  if (cleanUser === 'bosxzjm') {
    return key;
  }
  return `${key}_u_${cleanUser}`;
};

export const getStoredUsers = (): Record<string, { password: string; createdAt: string; role?: string; status?: string }> => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.USERS_REGISTRY);
    if (raw) return JSON.parse(raw);
  } catch {
    // fallback
  }
  return {};
};

export const buildAccountsList = (users: Record<string, { password: string; createdAt: string; role?: string; status?: string }>): UserAccount[] => {
  const master: UserAccount = {
    username: 'bosxzjm',
    password: '••••••••',
    role: 'admin',
    createdAt: '2026-01-01T00:00:00.000Z',
    status: 'active',
  };

  const userList: UserAccount[] = Object.entries(users).map(([u, info]) => ({
    username: u,
    password: info.password,
    role: (info.role as 'admin' | 'user') || 'user',
    createdAt: info.createdAt || new Date().toISOString(),
    status: (info.status as 'active' | 'inactive') || 'active',
  }));

  return [master, ...userList];
};

interface AppContextType {
  isLoggedIn: boolean;
  currentUsername: string;
  isMasterAdmin: boolean;
  userRole: 'admin' | 'user';
  login: (username: string, pass: string) => Promise<boolean> | boolean;
  registerUser: (username: string, pass: string) => { success: boolean; error?: string };
  createUserAccount: (username: string, pass: string) => { success: boolean; error?: string };
  deleteUserAccount: (username: string) => { success: boolean; error?: string };
  accountsList: UserAccount[];
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
  selectedPortalBorrowerId: string | null;
  setSelectedPortalBorrowerId: (id: string | null) => void;
  activeSettingsSection: SettingsSection;
  setActiveSettingsSection: (section: SettingsSection) => void;

  // Data lists
  borrowers: Borrower[];
  capitalSources: CapitalSource[];
  collectors: Collector[];
  assignments: LoanAssignment[];
  collectorCashouts: CollectorCashout[];
  activityLogs: ActivityLog[];

  // CRUD actions
  addBorrower: (borrower: Borrower) => void;
  updateBorrowerInfo: (
    id: string,
    updates: { name?: string; contact?: string; address?: string; notes?: string }
  ) => void;
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
  addActivityLog: (log: Omit<ActivityLog, 'id'>) => void;
  clearActivityLogs: () => void;

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
    totalAmountCollected: number;
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

export const getPortalBorrowerIdFromUrl = (): string | null => {
  if (typeof window === 'undefined') return null;
  try {
    const params = new URLSearchParams(window.location.search);
    const fromQuery = params.get('portal') || params.get('borrower');
    if (fromQuery) return fromQuery.trim();

    const hash = window.location.hash;
    if (hash) {
      const hashClean = hash.replace(/^#\/?/, '');
      const hashParams = new URLSearchParams(hashClean);
      const fromHash = hashParams.get('portal') || hashParams.get('borrower');
      if (fromHash) return fromHash.trim();

      const match = hash.match(/(?:portal|borrower)\/([^&/?]+)/);
      if (match && match[1]) return decodeURIComponent(match[1]).trim();
    }
  } catch {
    // fallback
  }
  return null;
};

// Helper: Generate unique 6-digit random loan ID
export const generateUniqueLoanId = (existingList: Borrower[] = []): string => {
  const existing = new Set(existingList.map((b) => b.loan_id).filter(Boolean));
  let attempts = 0;
  while (attempts < 2000) {
    const randomNum = Math.floor(100000 + Math.random() * 900000).toString();
    if (!existing.has(randomNum)) {
      return randomNum;
    }
    attempts++;
  }
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Helper: Ensure all borrowers in list have a 6-digit unique random loan ID
export const ensureLoanIds = (list: Borrower[]): Borrower[] => {
  const existing = new Set<string>();
  list.forEach((b) => {
    if (b.loan_id && /^\d{6}$/.test(b.loan_id)) {
      existing.add(b.loan_id);
    }
  });

  return list.map((b) => {
    if (b.loan_id && /^\d{6}$/.test(b.loan_id)) {
      return b;
    }
    let id = '';
    while (!id || existing.has(id)) {
      id = Math.floor(100000 + Math.random() * 900000).toString();
    }
    existing.add(id);
    return { ...b, loan_id: id };
  });
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const initialPortalId = getPortalBorrowerIdFromUrl();

  const [currentUsername, setCurrentUsername] = useState<string>(() => {
    return localStorage.getItem(STORAGE_KEYS.CURRENT_USER) || 'bosxzjm';
  });

  const [accountsList, setAccountsList] = useState<UserAccount[]>(() =>
    buildAccountsList(getStoredUsers())
  );

  const isMasterAdmin = currentUsername.trim().toLowerCase() === 'bosxzjm';
  const userRole: 'admin' | 'user' = isMasterAdmin ? 'admin' : 'user';

  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    return localStorage.getItem(STORAGE_KEYS.AUTH) === 'true';
  });

  const [themeMode, setThemeMode] = useState<'dark' | 'light'>(() => {
    return (localStorage.getItem(STORAGE_KEYS.THEME) as 'dark' | 'light') || 'dark';
  });

  const [currentView, setCurrentView] = useState<ViewType>(() => {
    return initialPortalId ? 'borrower-portal' : 'dashboard';
  });
  const [globalSearch, setGlobalSearch] = useState<string>('');
  
  const [selectedCollectorId, setSelectedCollectorId] = useState<string | null>(null);
  const [selectedCapitalId, setSelectedCapitalId] = useState<string | null>(null);
  const [selectedStatementBorrowerId, setSelectedStatementBorrowerId] = useState<string | null>(null);
  const [selectedAgreementBorrowerId, setSelectedAgreementBorrowerId] = useState<string | null>(null);
  const [selectedLedgerBorrowerId, setSelectedLedgerBorrowerId] = useState<string | null>(null);
  const [selectedPortalBorrowerId, setSelectedPortalBorrowerId] = useState<string | null>(initialPortalId);
  const [activeSettingsSection, setActiveSettingsSection] = useState<SettingsSection>('backup');

  // Core Data - Per user isolated storage
  const [borrowers, setBorrowers] = useState<Borrower[]>(() => {
    const activeUser = localStorage.getItem(STORAGE_KEYS.CURRENT_USER) || 'bosxzjm';
    const isMaster = activeUser.trim().toLowerCase() === 'bosxzjm';
    try {
      const stored = localStorage.getItem(getUserStorageKey(activeUser, STORAGE_KEYS.BORROWERS));
      if (stored !== null) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) return ensureLoanIds(parsed);
      }
    } catch {
      // fallback
    }
    if (!isMaster) return [];
    if (localStorage.getItem('lendgrower_portfolio_cleared') === 'true') return [];
    return ensureLoanIds(INITIAL_BORROWERS);
  });

  const [capitalSources, setCapitalSources] = useState<CapitalSource[]>(() => {
    const activeUser = localStorage.getItem(STORAGE_KEYS.CURRENT_USER) || 'bosxzjm';
    const isMaster = activeUser.trim().toLowerCase() === 'bosxzjm';
    try {
      const stored = localStorage.getItem(getUserStorageKey(activeUser, STORAGE_KEYS.CAPITAL));
      if (stored !== null) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // fallback
    }
    if (!isMaster) return [];
    if (localStorage.getItem('lendgrower_portfolio_cleared') === 'true') return [];
    return INITIAL_CAPITAL;
  });

  const [collectors, setCollectors] = useState<Collector[]>(() => {
    const activeUser = localStorage.getItem(STORAGE_KEYS.CURRENT_USER) || 'bosxzjm';
    const isMaster = activeUser.trim().toLowerCase() === 'bosxzjm';
    try {
      const stored = localStorage.getItem(getUserStorageKey(activeUser, STORAGE_KEYS.COLLECTORS));
      if (stored !== null) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // fallback
    }
    if (!isMaster) return [];
    if (localStorage.getItem('lendgrower_portfolio_cleared') === 'true') return [];
    return INITIAL_COLLECTORS;
  });

  const [assignments, setAssignments] = useState<LoanAssignment[]>(() => {
    const activeUser = localStorage.getItem(STORAGE_KEYS.CURRENT_USER) || 'bosxzjm';
    const isMaster = activeUser.trim().toLowerCase() === 'bosxzjm';
    try {
      const stored = localStorage.getItem(getUserStorageKey(activeUser, STORAGE_KEYS.ASSIGNMENTS));
      if (stored !== null) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // fallback
    }
    if (!isMaster) return [];
    if (localStorage.getItem('lendgrower_portfolio_cleared') === 'true') return [];
    return INITIAL_ASSIGNMENTS;
  });

  const [collectorCashouts, setCollectorCashouts] = useState<CollectorCashout[]>(() => {
    const activeUser = localStorage.getItem(STORAGE_KEYS.CURRENT_USER) || 'bosxzjm';
    const isMaster = activeUser.trim().toLowerCase() === 'bosxzjm';
    try {
      const stored = localStorage.getItem(getUserStorageKey(activeUser, STORAGE_KEYS.CASHOUTS));
      if (stored !== null) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // fallback
    }
    if (!isMaster) return [];
    if (localStorage.getItem('lendgrower_portfolio_cleared') === 'true') return [];
    return INITIAL_CASHOUTS;
  });

  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>(() => {
    const activeUser = localStorage.getItem(STORAGE_KEYS.CURRENT_USER) || 'bosxzjm';
    const isMaster = activeUser.trim().toLowerCase() === 'bosxzjm';
    try {
      const stored = localStorage.getItem(getUserStorageKey(activeUser, STORAGE_KEYS.ACTIVITIES));
      if (stored !== null) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // fallback
    }
    if (!isMaster) return [];
    if (localStorage.getItem('lendgrower_portfolio_cleared') === 'true') return [];
    return INITIAL_ACTIVITIES;
  });

  // Track active user reference to prevent cross-user writes when switching accounts
  const activeUserRef = useRef(currentUsername);

  useEffect(() => {
    activeUserRef.current = currentUsername;
    if (currentUsername) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, currentUsername);
    }
  }, [currentUsername]);

  // Sync to per-user LocalStorage
  useEffect(() => {
    if (!currentUsername) return;
    localStorage.setItem(getUserStorageKey(currentUsername, STORAGE_KEYS.BORROWERS), JSON.stringify(borrowers));
  }, [borrowers, currentUsername]);

  useEffect(() => {
    if (!currentUsername) return;
    localStorage.setItem(getUserStorageKey(currentUsername, STORAGE_KEYS.CAPITAL), JSON.stringify(capitalSources));
  }, [capitalSources, currentUsername]);

  useEffect(() => {
    if (!currentUsername) return;
    localStorage.setItem(getUserStorageKey(currentUsername, STORAGE_KEYS.COLLECTORS), JSON.stringify(collectors));
  }, [collectors, currentUsername]);

  useEffect(() => {
    if (!currentUsername) return;
    localStorage.setItem(getUserStorageKey(currentUsername, STORAGE_KEYS.ASSIGNMENTS), JSON.stringify(assignments));
  }, [assignments, currentUsername]);

  useEffect(() => {
    if (!currentUsername) return;
    localStorage.setItem(getUserStorageKey(currentUsername, STORAGE_KEYS.CASHOUTS), JSON.stringify(collectorCashouts));
  }, [collectorCashouts, currentUsername]);

  useEffect(() => {
    if (!currentUsername) return;
    localStorage.setItem(getUserStorageKey(currentUsername, STORAGE_KEYS.ACTIVITIES), JSON.stringify(activityLogs));
  }, [activityLogs, currentUsername]);

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

  // Handle URL changes and link navigation for borrower portal
  useEffect(() => {
    const handleUrlChange = () => {
      const portalId = getPortalBorrowerIdFromUrl();
      if (portalId) {
        setSelectedPortalBorrowerId(portalId);
        setCurrentView('borrower-portal');
      }
    };

    window.addEventListener('popstate', handleUrlChange);
    window.addEventListener('hashchange', handleUrlChange);
    return () => {
      window.removeEventListener('popstate', handleUrlChange);
      window.removeEventListener('hashchange', handleUrlChange);
    };
  }, []);

  const toggleThemeMode = () => {
    setThemeMode((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const loadUserData = (usernameToLoad: string) => {
    const clean = (usernameToLoad || 'bosxzjm').trim().toLowerCase();
    const isMaster = clean === 'bosxzjm';
    const getK = (k: string) => getUserStorageKey(clean, k);

    let loadedBorrowers: Borrower[] = [];
    try {
      const raw = localStorage.getItem(getK(STORAGE_KEYS.BORROWERS));
      if (raw !== null) {
        loadedBorrowers = ensureLoanIds(JSON.parse(raw));
      } else if (isMaster && localStorage.getItem('lendgrower_portfolio_cleared') !== 'true') {
        loadedBorrowers = ensureLoanIds(INITIAL_BORROWERS);
      }
    } catch {
      loadedBorrowers = isMaster ? ensureLoanIds(INITIAL_BORROWERS) : [];
    }

    let loadedCapital: CapitalSource[] = [];
    try {
      const raw = localStorage.getItem(getK(STORAGE_KEYS.CAPITAL));
      if (raw !== null) {
        loadedCapital = JSON.parse(raw);
      } else if (isMaster && localStorage.getItem('lendgrower_portfolio_cleared') !== 'true') {
        loadedCapital = INITIAL_CAPITAL;
      }
    } catch {
      loadedCapital = isMaster ? INITIAL_CAPITAL : [];
    }

    let loadedCollectors: Collector[] = [];
    try {
      const raw = localStorage.getItem(getK(STORAGE_KEYS.COLLECTORS));
      if (raw !== null) {
        loadedCollectors = JSON.parse(raw);
      } else if (isMaster && localStorage.getItem('lendgrower_portfolio_cleared') !== 'true') {
        loadedCollectors = INITIAL_COLLECTORS;
      }
    } catch {
      loadedCollectors = isMaster ? INITIAL_COLLECTORS : [];
    }

    let loadedAssignments: LoanAssignment[] = [];
    try {
      const raw = localStorage.getItem(getK(STORAGE_KEYS.ASSIGNMENTS));
      if (raw !== null) {
        loadedAssignments = JSON.parse(raw);
      } else if (isMaster && localStorage.getItem('lendgrower_portfolio_cleared') !== 'true') {
        loadedAssignments = INITIAL_ASSIGNMENTS;
      }
    } catch {
      loadedAssignments = isMaster ? INITIAL_ASSIGNMENTS : [];
    }

    let loadedCashouts: CollectorCashout[] = [];
    try {
      const raw = localStorage.getItem(getK(STORAGE_KEYS.CASHOUTS));
      if (raw !== null) {
        loadedCashouts = JSON.parse(raw);
      } else if (isMaster && localStorage.getItem('lendgrower_portfolio_cleared') !== 'true') {
        loadedCashouts = INITIAL_CASHOUTS;
      }
    } catch {
      loadedCashouts = isMaster ? INITIAL_CASHOUTS : [];
    }

    let loadedActivities: ActivityLog[] = [];
    try {
      const raw = localStorage.getItem(getK(STORAGE_KEYS.ACTIVITIES));
      if (raw !== null) {
        loadedActivities = JSON.parse(raw);
      } else if (isMaster && localStorage.getItem('lendgrower_portfolio_cleared') !== 'true') {
        loadedActivities = INITIAL_ACTIVITIES;
      }
    } catch {
      loadedActivities = isMaster ? INITIAL_ACTIVITIES : [];
    }

    activeUserRef.current = clean;
    setBorrowers(loadedBorrowers);
    setCapitalSources(loadedCapital);
    setCollectors(loadedCollectors);
    setAssignments(loadedAssignments);
    setCollectorCashouts(loadedCashouts);
    setActivityLogs(loadedActivities);
    setCurrentUsername(clean);
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, clean);
  };

  const login = async (u: string, p: string): Promise<boolean> => {
    const clean = u.trim().toLowerCase();
    const users = getStoredUsers();

    if (clean === 'bosxzjm' && p === 'premium1') {
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, 'bosxzjm');
      localStorage.setItem(STORAGE_KEYS.AUTH, 'true');
      setIsLoggedIn(true);
      loadUserData('bosxzjm');
      return true;
    }

    if (users[clean] && users[clean].password === p) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, clean);
      localStorage.setItem(STORAGE_KEYS.AUTH, 'true');
      setIsLoggedIn(true);
      loadUserData(clean);
      return true;
    }

    // Check cloud database if account was recently created from another device
    if (isSupabaseConfigured) {
      try {
        const cloud = await pullUsersRegistryFromSupabase();
        if (cloud.success && cloud.users && cloud.users[clean]) {
          const cloudAccount = cloud.users[clean];
          if (cloudAccount.password === p) {
            const merged = { ...users, ...cloud.users };
            localStorage.setItem(STORAGE_KEYS.USERS_REGISTRY, JSON.stringify(merged));
            setAccountsList(buildAccountsList(merged));

            localStorage.setItem(STORAGE_KEYS.CURRENT_USER, clean);
            localStorage.setItem(STORAGE_KEYS.AUTH, 'true');
            setIsLoggedIn(true);
            loadUserData(clean);
            return true;
          }
        }
      } catch (err) {
        console.warn('Could not probe Supabase user registry:', err);
      }
    }

    return false;
  };

  const registerUser = (u: string, p: string): { success: boolean; error?: string } => {
    const clean = u.trim().toLowerCase();
    if (!clean || clean.length < 3) {
      return { success: false, error: 'Username must be at least 3 characters long.' };
    }
    if (!p || p.length < 4) {
      return { success: false, error: 'Password must be at least 4 characters long.' };
    }
    if (clean === 'bosxzjm') {
      return { success: false, error: 'Username "bosxzjm" is already reserved. Please sign in.' };
    }

    const users = getStoredUsers();
    if (users[clean]) {
      return { success: false, error: 'Username already exists. Please choose another or sign in.' };
    }

    users[clean] = { password: p, createdAt: new Date().toISOString() };
    localStorage.setItem(STORAGE_KEYS.USERS_REGISTRY, JSON.stringify(users));

    // Initialize fresh empty arrays for this new user in storage
    const getK = (k: string) => getUserStorageKey(clean, k);
    localStorage.setItem(getK(STORAGE_KEYS.BORROWERS), JSON.stringify([]));
    localStorage.setItem(getK(STORAGE_KEYS.CAPITAL), JSON.stringify([]));
    localStorage.setItem(getK(STORAGE_KEYS.COLLECTORS), JSON.stringify([]));
    localStorage.setItem(getK(STORAGE_KEYS.ASSIGNMENTS), JSON.stringify([]));
    localStorage.setItem(getK(STORAGE_KEYS.CASHOUTS), JSON.stringify([]));
    localStorage.setItem(getK(STORAGE_KEYS.ACTIVITIES), JSON.stringify([]));

    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, clean);
    localStorage.setItem(STORAGE_KEYS.AUTH, 'true');
    setIsLoggedIn(true);
    setAccountsList(buildAccountsList(users));
    loadUserData(clean);

    return { success: true };
  };

  const createUserAccount = (u: string, p: string): { success: boolean; error?: string } => {
    const clean = u.trim().toLowerCase();
    if (!clean || clean.length < 3) {
      return { success: false, error: 'Username must be at least 3 characters long.' };
    }
    if (!/^[a-z0-9_.-]+$/.test(clean)) {
      return { success: false, error: 'Username can only contain lowercase letters, numbers, hyphens, and underscores.' };
    }
    if (!p || p.length < 4) {
      return { success: false, error: 'Password must be at least 4 characters long.' };
    }
    if (clean === 'bosxzjm') {
      return { success: false, error: 'Username "bosxzjm" is reserved for Master Admin.' };
    }

    const users = getStoredUsers();
    if (users[clean]) {
      return { success: false, error: `Account with username "${clean}" already exists.` };
    }

    users[clean] = {
      password: p,
      createdAt: new Date().toISOString(),
      role: 'user',
      status: 'active',
    };
    localStorage.setItem(STORAGE_KEYS.USERS_REGISTRY, JSON.stringify(users));

    // Initialize fresh empty portfolio storage for this user
    const getK = (k: string) => getUserStorageKey(clean, k);
    localStorage.setItem(getK(STORAGE_KEYS.BORROWERS), JSON.stringify([]));
    localStorage.setItem(getK(STORAGE_KEYS.CAPITAL), JSON.stringify([]));
    localStorage.setItem(getK(STORAGE_KEYS.COLLECTORS), JSON.stringify([]));
    localStorage.setItem(getK(STORAGE_KEYS.ASSIGNMENTS), JSON.stringify([]));
    localStorage.setItem(getK(STORAGE_KEYS.CASHOUTS), JSON.stringify([]));
    localStorage.setItem(getK(STORAGE_KEYS.ACTIVITIES), JSON.stringify([]));
    localStorage.removeItem(getK('lendgrower_portfolio_cleared'));

    setAccountsList(buildAccountsList(users));
    if (isSupabaseConfigured) {
      pushUsersRegistryToSupabase(users).catch(() => {});
    }
    return { success: true };
  };

  const deleteUserAccount = (u: string): { success: boolean; error?: string } => {
    const clean = u.trim().toLowerCase();
    if (clean === 'bosxzjm') {
      return { success: false, error: 'Cannot delete the Master Admin account.' };
    }

    const users = getStoredUsers();
    if (!users[clean]) {
      return { success: false, error: 'User account not found.' };
    }

    delete users[clean];
    localStorage.setItem(STORAGE_KEYS.USERS_REGISTRY, JSON.stringify(users));

    // Clean user keys from storage
    const getK = (k: string) => getUserStorageKey(clean, k);
    localStorage.removeItem(getK(STORAGE_KEYS.BORROWERS));
    localStorage.removeItem(getK(STORAGE_KEYS.CAPITAL));
    localStorage.removeItem(getK(STORAGE_KEYS.COLLECTORS));
    localStorage.removeItem(getK(STORAGE_KEYS.ASSIGNMENTS));
    localStorage.removeItem(getK(STORAGE_KEYS.CASHOUTS));
    localStorage.removeItem(getK(STORAGE_KEYS.ACTIVITIES));
    localStorage.removeItem(getK('lendgrower_portfolio_cleared'));

    // If Supabase is configured, also clear remote portfolio record and sync registry
    if (isSupabaseConfigured) {
      clearRemoteSupabasePortfolio(undefined, `portfolio_${clean}`).catch(() => {});
      pushUsersRegistryToSupabase(users).catch(() => {});
    }

    setAccountsList(buildAccountsList(users));
    return { success: true };
  };

  const logout = () => {
    setIsLoggedIn(false);
    localStorage.setItem(STORAGE_KEYS.AUTH, 'false');
  };

  // Activity Log Operations
  const addActivityLog = (logData: Omit<ActivityLog, 'id'>) => {
    const newLog: ActivityLog = {
      id: `act_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      ...logData,
    };
    setActivityLogs((prev) => [newLog, ...prev]);
  };

  const clearActivityLogs = () => {
    setActivityLogs([]);
    localStorage.setItem(getUserStorageKey(currentUsername, STORAGE_KEYS.ACTIVITIES), JSON.stringify([]));
  };

  // Borrower Operations
  const addBorrower = (newBorrower: Borrower) => {
    localStorage.removeItem('lendgrower_portfolio_cleared');
    localStorage.removeItem(getUserStorageKey(currentUsername, 'lendgrower_portfolio_cleared'));

    const preparedBorrower: Borrower = {
      ...newBorrower,
      loan_id: newBorrower.loan_id && /^\d{6}$/.test(newBorrower.loan_id)
        ? newBorrower.loan_id
        : generateUniqueLoanId(borrowers),
    };

    const updatedBorrowers = [preparedBorrower, ...borrowers];
    setBorrowers(updatedBorrowers);
    try {
      localStorage.setItem(
        getUserStorageKey(currentUsername, STORAGE_KEYS.BORROWERS),
        JSON.stringify(updatedBorrowers)
      );
    } catch {
      // ignore
    }

    // Record activity log with date
    const nowIso = new Date().toISOString();
    const actDate = preparedBorrower.start_date
      ? `${preparedBorrower.start_date}T${nowIso.split('T')[1] || '08:00:00'}`
      : nowIso;
    const newLog: ActivityLog = {
      id: `act_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      type: 'add_borrower',
      title: `Added Borrower: ${preparedBorrower.name}`,
      description: `Loan ID: ${preparedBorrower.loan_id} • Loan amount ${formatCurrency(preparedBorrower.amount)} • ${preparedBorrower.frequency} (${preparedBorrower.installments} installments)`,
      amount: preparedBorrower.amount,
      date: actDate,
      borrowerName: preparedBorrower.name,
    };
    const updatedLogs = [newLog, ...activityLogs];
    setActivityLogs(updatedLogs);
    try {
      localStorage.setItem(
        getUserStorageKey(currentUsername, STORAGE_KEYS.ACTIVITIES),
        JSON.stringify(updatedLogs)
      );
    } catch {
      // ignore
    }

    if (isSupabaseConfigured) {
      const currentPortfolioId = currentUsername.trim().toLowerCase() === 'bosxzjm'
        ? 'main_portfolio'
        : `portfolio_${currentUsername.trim().toLowerCase()}`;
      pushDataToSupabase({
        borrowers: updatedBorrowers,
        capitalSources,
        collectors,
        assignments,
        collectorCashouts,
        activityLogs: updatedLogs,
      }, currentPortfolioId).catch(() => {});
    }
  };

  const updateBorrowerInfo = (
    id: string,
    updates: { name?: string; contact?: string; address?: string; notes?: string }
  ) => {
    localStorage.removeItem('lendgrower_portfolio_cleared');
    localStorage.removeItem(getUserStorageKey(currentUsername, 'lendgrower_portfolio_cleared'));

    const updated = borrowers.map((b) => {
      if (b.id !== id) return b;
      return {
        ...b,
        name: updates.name !== undefined ? updates.name.trim() : b.name,
        contact: updates.contact !== undefined ? updates.contact.trim() : b.contact,
        address: updates.address !== undefined ? updates.address.trim() : b.address,
        notes: updates.notes !== undefined ? updates.notes.trim() : b.notes,
      };
    });

    setBorrowers(updated);
    try {
      localStorage.setItem(
        getUserStorageKey(currentUsername, STORAGE_KEYS.BORROWERS),
        JSON.stringify(updated)
      );
    } catch {
      // ignore
    }

    const targetBorrower = borrowers.find((b) => b.id === id);
    const bName = updates.name?.trim() || targetBorrower?.name || 'Borrower';

    const newLog: ActivityLog = {
      id: `act_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      type: 'edit_borrower',
      title: `Updated Borrower Info: ${bName}`,
      description: `Updated contact, address, or notes information`,
      date: new Date().toISOString(),
      borrowerName: bName,
    };
    const updatedLogs = [newLog, ...activityLogs];
    setActivityLogs(updatedLogs);
    try {
      localStorage.setItem(
        getUserStorageKey(currentUsername, STORAGE_KEYS.ACTIVITIES),
        JSON.stringify(updatedLogs)
      );
    } catch {
      // ignore
    }

    if (isSupabaseConfigured) {
      const currentPortfolioId = currentUsername.trim().toLowerCase() === 'bosxzjm'
        ? 'main_portfolio'
        : `portfolio_${currentUsername.trim().toLowerCase()}`;
      pushDataToSupabase({
        borrowers: updated,
        capitalSources,
        collectors,
        assignments,
        collectorCashouts,
        activityLogs: updatedLogs,
      }, currentPortfolioId).catch(() => {});
    }
  };

  const deleteBorrower = (id: string) => {
    const targetBorrower = borrowers.find((b) => b.id === id);
    const bName = targetBorrower ? targetBorrower.name : 'Borrower';

    const updatedBorrowers = borrowers.filter((b) => b.id !== id);
    setBorrowers(updatedBorrowers);
    try {
      localStorage.setItem(
        getUserStorageKey(currentUsername, STORAGE_KEYS.BORROWERS),
        JSON.stringify(updatedBorrowers)
      );
    } catch {
      // ignore
    }

    const updatedAssignments = assignments.filter((a) => a.borrowerId !== id);
    setAssignments(updatedAssignments);
    try {
      localStorage.setItem(
        getUserStorageKey(currentUsername, STORAGE_KEYS.ASSIGNMENTS),
        JSON.stringify(updatedAssignments)
      );
    } catch {
      // ignore
    }

    setSelectedLedgerBorrowerId((prev) => (prev === id ? '' : prev));
    setSelectedStatementBorrowerId((prev) => (prev === id ? '' : prev));
    setSelectedAgreementBorrowerId((prev) => (prev === id ? '' : prev));

    // Record delete activity log with date
    const newLog: ActivityLog = {
      id: `act_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      type: 'delete',
      title: `Deleted Borrower: ${bName}`,
      description: `Removed borrower record and loan schedule from portfolio`,
      amount: targetBorrower?.amount,
      date: new Date().toISOString(),
      borrowerName: bName,
    };
    const updatedLogs = [newLog, ...activityLogs];
    setActivityLogs(updatedLogs);
    try {
      localStorage.setItem(
        getUserStorageKey(currentUsername, STORAGE_KEYS.ACTIVITIES),
        JSON.stringify(updatedLogs)
      );
    } catch {
      // ignore
    }

    if (isSupabaseConfigured) {
      const currentPortfolioId = currentUsername.trim().toLowerCase() === 'bosxzjm'
        ? 'main_portfolio'
        : `portfolio_${currentUsername.trim().toLowerCase()}`;
      pushDataToSupabase({
        borrowers: updatedBorrowers,
        capitalSources,
        collectors,
        assignments: updatedAssignments,
        collectorCashouts,
        activityLogs: updatedLogs,
      }, currentPortfolioId).catch(() => {});
    }
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
    localStorage.removeItem('lendgrower_portfolio_cleared');
    localStorage.removeItem(getUserStorageKey(currentUsername, 'lendgrower_portfolio_cleared'));

    const targetBorrower = borrowers.find((b) => b.id === borrowerId);
    const sched = targetBorrower?.schedules.find((s) => s.id === scheduleId);
    const schedLabel = sched ? `Installment #${sched.installment_no}` : 'Installment';
    const refText = reference ? ` (Ref: ${reference})` : '';

    const updatedBorrowers = borrowers.map((borrower) => {
      if (borrower.id !== borrowerId) return borrower;

      const updatedSchedules = borrower.schedules.map((schedItem) => {
        if (schedItem.id !== scheduleId) return schedItem;

        const newPaid = schedItem.amount_paid + paymentAmount;
        const newStatus: 'Pending' | 'Partial' | 'Paid' =
          newPaid >= schedItem.amount_due ? 'Paid' : 'Partial';

        const newPaymentRecord = {
          id: `pay_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          amount: paymentAmount,
          method,
          date: date || getTodayIsoString(),
          reference,
          notes,
        };

        return {
          ...schedItem,
          amount_paid: newPaid,
          status: newStatus,
          payments: [...(schedItem.payments || []), newPaymentRecord],
        };
      });

      const allPaid = updatedSchedules.every((s) => s.status === 'Paid');

      return {
        ...borrower,
        schedules: updatedSchedules,
        is_fully_paid: allPaid,
      };
    });

    setBorrowers(updatedBorrowers);
    try {
      localStorage.setItem(
        getUserStorageKey(currentUsername, STORAGE_KEYS.BORROWERS),
        JSON.stringify(updatedBorrowers)
      );
    } catch {
      // ignore
    }

    // Record payment activity log with date
    const nowIso = new Date().toISOString();
    const paymentTimeStr = date ? `${date}T${nowIso.split('T')[1] || '12:00:00'}` : nowIso;
    const newLog: ActivityLog = {
      id: `act_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      type: 'payment',
      title: `Payment: ${targetBorrower?.name || 'Borrower'}`,
      description: `Paid ${formatCurrency(paymentAmount)} via ${method}${refText} for ${schedLabel}`,
      amount: paymentAmount,
      date: paymentTimeStr,
      borrowerName: targetBorrower?.name,
      reference,
    };
    const updatedLogs = [newLog, ...activityLogs];
    setActivityLogs(updatedLogs);
    try {
      localStorage.setItem(
        getUserStorageKey(currentUsername, STORAGE_KEYS.ACTIVITIES),
        JSON.stringify(updatedLogs)
      );
    } catch {
      // ignore
    }

    if (isSupabaseConfigured) {
      const currentPortfolioId = currentUsername.trim().toLowerCase() === 'bosxzjm'
        ? 'main_portfolio'
        : `portfolio_${currentUsername.trim().toLowerCase()}`;
      pushDataToSupabase({
        borrowers: updatedBorrowers,
        capitalSources,
        collectors,
        assignments,
        collectorCashouts,
        activityLogs: updatedLogs,
      }, currentPortfolioId).catch(() => {});
    }
  };

  // Capital Operations
  const addCapitalSource = (name: string, amount: number, date: string) => {
    localStorage.removeItem('lendgrower_portfolio_cleared');
    localStorage.removeItem(getUserStorageKey(currentUsername, 'lendgrower_portfolio_cleared'));
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
    const updated = [newCap, ...capitalSources];
    setCapitalSources(updated);
    try {
      localStorage.setItem(
        getUserStorageKey(currentUsername, STORAGE_KEYS.CAPITAL),
        JSON.stringify(updated)
      );
    } catch {
      // ignore
    }

    if (isSupabaseConfigured) {
      const currentPortfolioId = currentUsername.trim().toLowerCase() === 'bosxzjm'
        ? 'main_portfolio'
        : `portfolio_${currentUsername.trim().toLowerCase()}`;
      pushDataToSupabase({
        borrowers,
        capitalSources: updated,
        collectors,
        assignments,
        collectorCashouts,
        activityLogs,
      }, currentPortfolioId).catch(() => {});
    }
  };

  const deleteCapitalSource = (id: string) => {
    const updated = capitalSources.filter((c) => c.id !== id);
    setCapitalSources(updated);
    try {
      localStorage.setItem(
        getUserStorageKey(currentUsername, STORAGE_KEYS.CAPITAL),
        JSON.stringify(updated)
      );
    } catch {
      // ignore
    }

    if (isSupabaseConfigured) {
      const currentPortfolioId = currentUsername.trim().toLowerCase() === 'bosxzjm'
        ? 'main_portfolio'
        : `portfolio_${currentUsername.trim().toLowerCase()}`;
      pushDataToSupabase({
        borrowers,
        capitalSources: updated,
        collectors,
        assignments,
        collectorCashouts,
        activityLogs,
      }, currentPortfolioId).catch(() => {});
    }
  };

  const addCapitalTransaction = (
    capitalId: string,
    amount: number,
    date: string,
    notes: string
  ) => {
    localStorage.removeItem('lendgrower_portfolio_cleared');
    localStorage.removeItem(getUserStorageKey(currentUsername, 'lendgrower_portfolio_cleared'));

    const updated = capitalSources.map((cap) => {
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
    });

    setCapitalSources(updated);
    try {
      localStorage.setItem(
        getUserStorageKey(currentUsername, STORAGE_KEYS.CAPITAL),
        JSON.stringify(updated)
      );
    } catch {
      // ignore
    }

    if (isSupabaseConfigured) {
      const currentPortfolioId = currentUsername.trim().toLowerCase() === 'bosxzjm'
        ? 'main_portfolio'
        : `portfolio_${currentUsername.trim().toLowerCase()}`;
      pushDataToSupabase({
        borrowers,
        capitalSources: updated,
        collectors,
        assignments,
        collectorCashouts,
        activityLogs,
      }, currentPortfolioId).catch(() => {});
    }
  };

  const deleteCapitalTransaction = (capitalId: string, txId: string) => {
    const updated = capitalSources.map((cap) => {
      if (cap.id !== capitalId) return cap;
      const newTransactions = cap.transactions.filter((t) => t.id !== txId);
      const newTotalAmount = newTransactions.reduce((sum, t) => sum + t.amount, 0);
      return {
        ...cap,
        amount: newTotalAmount,
        transactions: newTransactions,
      };
    });

    setCapitalSources(updated);
    try {
      localStorage.setItem(
        getUserStorageKey(currentUsername, STORAGE_KEYS.CAPITAL),
        JSON.stringify(updated)
      );
    } catch {
      // ignore
    }

    if (isSupabaseConfigured) {
      const currentPortfolioId = currentUsername.trim().toLowerCase() === 'bosxzjm'
        ? 'main_portfolio'
        : `portfolio_${currentUsername.trim().toLowerCase()}`;
      pushDataToSupabase({
        borrowers,
        capitalSources: updated,
        collectors,
        assignments,
        collectorCashouts,
        activityLogs,
      }, currentPortfolioId).catch(() => {});
    }
  };

  // Collector Operations
  const addCollector = (name: string, contact: string, address: string) => {
    localStorage.removeItem('lendgrower_portfolio_cleared');
    localStorage.removeItem(getUserStorageKey(currentUsername, 'lendgrower_portfolio_cleared'));

    const newCol: Collector = {
      id: `col_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
      name,
      contact,
      address,
    };
    const updated = [newCol, ...collectors];
    setCollectors(updated);
    try {
      localStorage.setItem(
        getUserStorageKey(currentUsername, STORAGE_KEYS.COLLECTORS),
        JSON.stringify(updated)
      );
    } catch {
      // ignore
    }

    if (isSupabaseConfigured) {
      const currentPortfolioId = currentUsername.trim().toLowerCase() === 'bosxzjm'
        ? 'main_portfolio'
        : `portfolio_${currentUsername.trim().toLowerCase()}`;
      pushDataToSupabase({
        borrowers,
        capitalSources,
        collectors: updated,
        assignments,
        collectorCashouts,
        activityLogs,
      }, currentPortfolioId).catch(() => {});
    }
  };

  const deleteCollector = (id: string) => {
    const updatedCols = collectors.filter((c) => c.id !== id);
    const updatedAsg = assignments.filter((a) => a.collectorId !== id);
    const updatedCashouts = collectorCashouts.filter((co) => co.collectorId !== id);

    setCollectors(updatedCols);
    setAssignments(updatedAsg);
    setCollectorCashouts(updatedCashouts);

    try {
      localStorage.setItem(
        getUserStorageKey(currentUsername, STORAGE_KEYS.COLLECTORS),
        JSON.stringify(updatedCols)
      );
      localStorage.setItem(
        getUserStorageKey(currentUsername, STORAGE_KEYS.ASSIGNMENTS),
        JSON.stringify(updatedAsg)
      );
      localStorage.setItem(
        getUserStorageKey(currentUsername, STORAGE_KEYS.CASHOUTS),
        JSON.stringify(updatedCashouts)
      );
    } catch {
      // ignore
    }

    if (isSupabaseConfigured) {
      const currentPortfolioId = currentUsername.trim().toLowerCase() === 'bosxzjm'
        ? 'main_portfolio'
        : `portfolio_${currentUsername.trim().toLowerCase()}`;
      pushDataToSupabase({
        borrowers,
        capitalSources,
        collectors: updatedCols,
        assignments: updatedAsg,
        collectorCashouts: updatedCashouts,
        activityLogs,
      }, currentPortfolioId).catch(() => {});
    }
  };

  const assignLoan = (collectorId: string, borrowerId: string) => {
    localStorage.removeItem('lendgrower_portfolio_cleared');
    localStorage.removeItem(getUserStorageKey(currentUsername, 'lendgrower_portfolio_cleared'));

    let updatedAssignments: LoanAssignment[];
    const exists = assignments.some((a) => a.borrowerId === borrowerId);
    if (exists) {
      updatedAssignments = assignments.map((a) =>
        a.borrowerId === borrowerId ? { ...a, collectorId } : a
      );
    } else {
      const newAsg: LoanAssignment = {
        id: `asg_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
        collectorId,
        borrowerId,
      };
      updatedAssignments = [newAsg, ...assignments];
    }

    setAssignments(updatedAssignments);
    try {
      localStorage.setItem(
        getUserStorageKey(currentUsername, STORAGE_KEYS.ASSIGNMENTS),
        JSON.stringify(updatedAssignments)
      );
    } catch {
      // ignore
    }

    if (isSupabaseConfigured) {
      const currentPortfolioId = currentUsername.trim().toLowerCase() === 'bosxzjm'
        ? 'main_portfolio'
        : `portfolio_${currentUsername.trim().toLowerCase()}`;
      pushDataToSupabase({
        borrowers,
        capitalSources,
        collectors,
        assignments: updatedAssignments,
        collectorCashouts,
        activityLogs,
      }, currentPortfolioId).catch(() => {});
    }
  };

  const unassignLoan = (assignmentId: string) => {
    const updated = assignments.filter((a) => a.id !== assignmentId);
    setAssignments(updated);
    try {
      localStorage.setItem(
        getUserStorageKey(currentUsername, STORAGE_KEYS.ASSIGNMENTS),
        JSON.stringify(updated)
      );
    } catch {
      // ignore
    }

    if (isSupabaseConfigured) {
      const currentPortfolioId = currentUsername.trim().toLowerCase() === 'bosxzjm'
        ? 'main_portfolio'
        : `portfolio_${currentUsername.trim().toLowerCase()}`;
      pushDataToSupabase({
        borrowers,
        capitalSources,
        collectors,
        assignments: updated,
        collectorCashouts,
        activityLogs,
      }, currentPortfolioId).catch(() => {});
    }
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

    localStorage.removeItem('lendgrower_portfolio_cleared');
    localStorage.removeItem(getUserStorageKey(currentUsername, 'lendgrower_portfolio_cleared'));

    const newCashout: CollectorCashout = {
      id: `co_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
      collectorId,
      amount,
      date,
      notes: notes || 'Commission cash out payout',
    };
    const updated = [newCashout, ...collectorCashouts];
    setCollectorCashouts(updated);
    try {
      localStorage.setItem(
        getUserStorageKey(currentUsername, STORAGE_KEYS.CASHOUTS),
        JSON.stringify(updated)
      );
    } catch {
      // ignore
    }

    if (isSupabaseConfigured) {
      const currentPortfolioId = currentUsername.trim().toLowerCase() === 'bosxzjm'
        ? 'main_portfolio'
        : `portfolio_${currentUsername.trim().toLowerCase()}`;
      pushDataToSupabase({
        borrowers,
        capitalSources,
        collectors,
        assignments,
        collectorCashouts: updated,
        activityLogs,
      }, currentPortfolioId).catch(() => {});
    }
    return true;
  };

  const deleteCollectorCashout = (id: string) => {
    const updated = collectorCashouts.filter((c) => c.id !== id);
    setCollectorCashouts(updated);
    try {
      localStorage.setItem(
        getUserStorageKey(currentUsername, STORAGE_KEYS.CASHOUTS),
        JSON.stringify(updated)
      );
    } catch {
      // ignore
    }

    if (isSupabaseConfigured) {
      const currentPortfolioId = currentUsername.trim().toLowerCase() === 'bosxzjm'
        ? 'main_portfolio'
        : `portfolio_${currentUsername.trim().toLowerCase()}`;
      pushDataToSupabase({
        borrowers,
        capitalSources,
        collectors,
        assignments,
        collectorCashouts: updated,
        activityLogs,
      }, currentPortfolioId).catch(() => {});
    }
  };

  // Collector Statistics Calculation
  const getCollectorStats = (collectorId: string) => {
    const assignedLoans = assignments.filter((a) => a.collectorId === collectorId);
    let totalAssignedAmount = 0;
    let totalUnpaid = 0;
    let totalCommissionEarned = 0;
    let fullyPaidCount = 0;
    let totalAmountCollected = 0;

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

        totalAmountCollected += borrowerCollected;
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
      totalAmountCollected,
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
      activities: activityLogs,
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
      if (parsed.activities && Array.isArray(parsed.activities)) {
        setActivityLogs(parsed.activities);
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
    setActivityLogs([]);

    // 2. Persist empty state to user local storage and mark as cleared
    const getK = (k: string) => getUserStorageKey(currentUsername, k);
    localStorage.setItem(getK(STORAGE_KEYS.BORROWERS), JSON.stringify([]));
    localStorage.setItem(getK(STORAGE_KEYS.CAPITAL), JSON.stringify([]));
    localStorage.setItem(getK(STORAGE_KEYS.COLLECTORS), JSON.stringify([]));
    localStorage.setItem(getK(STORAGE_KEYS.ASSIGNMENTS), JSON.stringify([]));
    localStorage.setItem(getK(STORAGE_KEYS.CASHOUTS), JSON.stringify([]));
    localStorage.setItem(getK(STORAGE_KEYS.ACTIVITIES), JSON.stringify([]));
    localStorage.setItem(getK('lendgrower_portfolio_cleared'), 'true');

    // 3. Reset remote Supabase database if connected
    let supabaseReset = false;
    let supabaseError: string | undefined;
    let isRlsError = false;

    const currentPortfolioId = currentUsername.trim().toLowerCase() === 'bosxzjm'
      ? 'main_portfolio'
      : `portfolio_${currentUsername.trim().toLowerCase()}`;

    if (isSupabaseConfigured) {
      setSupabaseSyncStatus((prev) => ({ ...prev, syncing: true }));
      const res = await clearRemoteSupabasePortfolio({
        borrowers: [],
        capitalSources: [],
        collectors: [],
        assignments: [],
        collectorCashouts: [],
        activityLogs: [],
      }, currentPortfolioId);
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
          message: `Portfolio fully wiped from Supabase (${currentUsername})`,
        }));
      }
    }

    return { success: true, supabaseReset, supabaseError, isRlsError };
  };

  const resetToDefaultSeed = async (): Promise<{ success: boolean; supabaseReset: boolean; supabaseError?: string; isRlsError?: boolean }> => {
    const isMaster = currentUsername.trim().toLowerCase() === 'bosxzjm';
    const currentPortfolioId = isMaster ? 'main_portfolio' : `portfolio_${currentUsername.trim().toLowerCase()}`;
    const getK = (k: string) => getUserStorageKey(currentUsername, k);
    localStorage.removeItem(getK('lendgrower_portfolio_cleared'));

    const seedBorrowers = isMaster ? INITIAL_BORROWERS : [];
    const seedCapital = isMaster ? INITIAL_CAPITAL : [];
    const seedCollectors = isMaster ? INITIAL_COLLECTORS : [];
    const seedAssignments = isMaster ? INITIAL_ASSIGNMENTS : [];
    const seedCashouts = isMaster ? INITIAL_CASHOUTS : [];
    const seedActivities = isMaster ? INITIAL_ACTIVITIES : [];

    setBorrowers(seedBorrowers);
    setCapitalSources(seedCapital);
    setCollectors(seedCollectors);
    setAssignments(seedAssignments);
    setCollectorCashouts(seedCashouts);
    setActivityLogs(seedActivities);

    localStorage.setItem(getK(STORAGE_KEYS.BORROWERS), JSON.stringify(seedBorrowers));
    localStorage.setItem(getK(STORAGE_KEYS.CAPITAL), JSON.stringify(seedCapital));
    localStorage.setItem(getK(STORAGE_KEYS.COLLECTORS), JSON.stringify(seedCollectors));
    localStorage.setItem(getK(STORAGE_KEYS.ASSIGNMENTS), JSON.stringify(seedAssignments));
    localStorage.setItem(getK(STORAGE_KEYS.CASHOUTS), JSON.stringify(seedCashouts));
    localStorage.setItem(getK(STORAGE_KEYS.ACTIVITIES), JSON.stringify(seedActivities));

    let supabaseReset = false;
    let supabaseError: string | undefined;
    let isRlsError = false;

    if (isSupabaseConfigured) {
      setSupabaseSyncStatus((prev) => ({ ...prev, syncing: true }));
      const res = await clearRemoteSupabasePortfolio({
        borrowers: seedBorrowers,
        capitalSources: seedCapital,
        collectors: seedCollectors,
        assignments: seedAssignments,
        collectorCashouts: seedCashouts,
        activityLogs: seedActivities,
      }, currentPortfolioId);
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
          message: `Demo seed data pushed to Supabase cloud (${currentUsername})`,
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

  const hasLoadedInitialRef = useRef(false);

  // Sync user accounts registry from Supabase cloud so multi-device accounts match
  useEffect(() => {
    if (!isSupabaseConfigured) return;
    pullUsersRegistryFromSupabase().then((res) => {
      if (res.success && res.users && Object.keys(res.users).length > 0) {
        const local = getStoredUsers();
        const merged = { ...local, ...res.users };
        localStorage.setItem(STORAGE_KEYS.USERS_REGISTRY, JSON.stringify(merged));
        setAccountsList(buildAccountsList(merged));
      }
    }).catch(() => {});
  }, [isSupabaseConfigured]);

  // Check Supabase connection and pull user portfolio on load or user switch
  useEffect(() => {
    if (!isLoggedIn) return;
    const currentPortfolioId = currentUsername.trim().toLowerCase() === 'bosxzjm'
      ? 'main_portfolio'
      : `portfolio_${currentUsername.trim().toLowerCase()}`;

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
            const isCleared = localStorage.getItem(getUserStorageKey(currentUsername, 'lendgrower_portfolio_cleared')) === 'true';
            if (!isCleared) {
              const remote = await pullDataFromSupabase(currentPortfolioId);
              if (remote.success && remote.data) {
                const hasRemoteBorrowers = Array.isArray(remote.data.borrowers) && remote.data.borrowers.length > 0;
                const hasRemoteCapital = Array.isArray(remote.data.capitalSources) && remote.data.capitalSources.length > 0;
                const hasRemoteCollectors = Array.isArray(remote.data.collectors) && remote.data.collectors.length > 0;
                const hasRemoteActivities = Array.isArray(remote.data.activityLogs) && remote.data.activityLogs.length > 0;

                if (hasRemoteBorrowers) {
                  const prepared = ensureLoanIds(remote.data.borrowers);
                  setBorrowers(prepared);
                  localStorage.setItem(
                    getUserStorageKey(currentUsername, STORAGE_KEYS.BORROWERS),
                    JSON.stringify(prepared)
                  );
                } else {
                  // If remote has no borrowers but local has borrowers, sync local data to remote
                  const localRaw = localStorage.getItem(getUserStorageKey(currentUsername, STORAGE_KEYS.BORROWERS));
                  if (localRaw) {
                    try {
                      const localParsed = JSON.parse(localRaw);
                      if (Array.isArray(localParsed) && localParsed.length > 0) {
                        pushDataToSupabase({
                          borrowers: localParsed,
                          capitalSources,
                          collectors,
                          assignments,
                          collectorCashouts,
                          activityLogs,
                        }, currentPortfolioId).catch(() => {});
                      }
                    } catch {}
                  }
                }

                if (hasRemoteCapital) {
                  setCapitalSources(remote.data.capitalSources);
                  localStorage.setItem(
                    getUserStorageKey(currentUsername, STORAGE_KEYS.CAPITAL),
                    JSON.stringify(remote.data.capitalSources)
                  );
                }
                if (hasRemoteCollectors) {
                  setCollectors(remote.data.collectors);
                  localStorage.setItem(
                    getUserStorageKey(currentUsername, STORAGE_KEYS.COLLECTORS),
                    JSON.stringify(remote.data.collectors)
                  );
                }
                if (Array.isArray(remote.data.assignments) && remote.data.assignments.length > 0) {
                  setAssignments(remote.data.assignments);
                  localStorage.setItem(
                    getUserStorageKey(currentUsername, STORAGE_KEYS.ASSIGNMENTS),
                    JSON.stringify(remote.data.assignments)
                  );
                }
                if (Array.isArray(remote.data.collectorCashouts) && remote.data.collectorCashouts.length > 0) {
                  setCollectorCashouts(remote.data.collectorCashouts);
                  localStorage.setItem(
                    getUserStorageKey(currentUsername, STORAGE_KEYS.CASHOUTS),
                    JSON.stringify(remote.data.collectorCashouts)
                  );
                }
                if (hasRemoteActivities) {
                  setActivityLogs(remote.data.activityLogs);
                  localStorage.setItem(
                    getUserStorageKey(currentUsername, STORAGE_KEYS.ACTIVITIES),
                    JSON.stringify(remote.data.activityLogs)
                  );
                }

                if (hasRemoteBorrowers || hasRemoteCapital || hasRemoteCollectors || hasRemoteActivities) {
                  setSupabaseSyncStatus((prev) => ({
                    ...prev,
                    lastSynced: new Date().toLocaleTimeString(),
                    message: `Connected & synchronized with Supabase (${currentUsername})`,
                  }));
                }
              }
            }
          } catch (syncErr) {
            console.warn('Initial Supabase sync notice:', syncErr);
          } finally {
            hasLoadedInitialRef.current = true;
          }
        } else {
          hasLoadedInitialRef.current = true;
        }
      });
    } else {
      hasLoadedInitialRef.current = true;
    }
  }, [isSupabaseConfigured, currentUsername, isLoggedIn]);

  // Fast debounced auto-save to Supabase whenever portfolio data changes
  useEffect(() => {
    if (!hasLoadedInitialRef.current) return;
    if (!isSupabaseConfigured) return;
    if (!isLoggedIn) return;

    const currentPortfolioId = currentUsername.trim().toLowerCase() === 'bosxzjm'
      ? 'main_portfolio'
      : `portfolio_${currentUsername.trim().toLowerCase()}`;

    // If portfolio was wiped and is empty, skip debounced re-save (wiping is handled by resetAllData)
    const isCleared = localStorage.getItem(getUserStorageKey(currentUsername, 'lendgrower_portfolio_cleared')) === 'true';
    if (isCleared && borrowers.length === 0 && capitalSources.length === 0 && collectors.length === 0) {
      return;
    }

    const timer = setTimeout(async () => {
      setSupabaseSyncStatus((prev) => ({ ...prev, syncing: true }));
      const result = await pushDataToSupabase({
        borrowers,
        capitalSources,
        collectors,
        assignments,
        collectorCashouts,
        activityLogs,
      }, currentPortfolioId);

      setSupabaseSyncStatus((prev) => ({
        ...prev,
        syncing: false,
        connected: result.success,
        lastSynced: result.success ? new Date().toLocaleTimeString() : prev.lastSynced,
        message: result.success
          ? `All changes saved to Supabase (${currentUsername})`
          : (result.error || 'Failed to auto-save to Supabase'),
      }));
    }, 500);

    return () => clearTimeout(timer);
  }, [borrowers, capitalSources, collectors, assignments, collectorCashouts, activityLogs, isSupabaseConfigured, currentUsername, isLoggedIn]);

  // Window beforeunload safeguard to flush any pending save
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (isSupabaseConfigured && hasLoadedInitialRef.current && isLoggedIn) {
        const currentPortfolioId = currentUsername.trim().toLowerCase() === 'bosxzjm'
          ? 'main_portfolio'
          : `portfolio_${currentUsername.trim().toLowerCase()}`;

        pushDataToSupabase({
          borrowers,
          capitalSources,
          collectors,
          assignments,
          collectorCashouts,
          activityLogs,
        }, currentPortfolioId);
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [borrowers, capitalSources, collectors, assignments, collectorCashouts, activityLogs, isSupabaseConfigured, currentUsername, isLoggedIn]);

  const pushToSupabase = async () => {
    const currentPortfolioId = currentUsername.trim().toLowerCase() === 'bosxzjm'
      ? 'main_portfolio'
      : `portfolio_${currentUsername.trim().toLowerCase()}`;

    setSupabaseSyncStatus((prev) => ({ ...prev, syncing: true }));
    const result = await pushDataToSupabase({
      borrowers,
      capitalSources,
      collectors,
      assignments,
      collectorCashouts,
      activityLogs,
    }, currentPortfolioId);
    setSupabaseSyncStatus((prev) => ({
      ...prev,
      syncing: false,
      connected: result.success,
      lastSynced: result.success ? new Date().toLocaleTimeString() : prev.lastSynced,
      message: result.success ? `Synced to Supabase successfully (${currentUsername})!` : (result.error || 'Failed to sync to Supabase'),
    }));
    return {
      success: result.success,
      message: result.success ? `Synced to Supabase successfully (${currentUsername})!` : (result.error || 'Failed to sync to Supabase'),
    };
  };

  const pullFromSupabase = async () => {
    const currentPortfolioId = currentUsername.trim().toLowerCase() === 'bosxzjm'
      ? 'main_portfolio'
      : `portfolio_${currentUsername.trim().toLowerCase()}`;

    setSupabaseSyncStatus((prev) => ({ ...prev, syncing: true }));
    const result = await pullDataFromSupabase(currentPortfolioId);
    if (result.success && result.data) {
      localStorage.removeItem(getUserStorageKey(currentUsername, 'lendgrower_portfolio_cleared'));
      if (result.data.borrowers) setBorrowers(result.data.borrowers);
      if (result.data.capitalSources) setCapitalSources(result.data.capitalSources);
      if (result.data.collectors) setCollectors(result.data.collectors);
      if (result.data.assignments) setAssignments(result.data.assignments);
      if (result.data.collectorCashouts) setCollectorCashouts(result.data.collectorCashouts);
      if (result.data.activityLogs) setActivityLogs(result.data.activityLogs);

      setSupabaseSyncStatus((prev) => ({
        ...prev,
        syncing: false,
        connected: true,
        lastSynced: new Date().toLocaleTimeString(),
        message: `Pulled fresh records from Supabase (${currentUsername})!`,
      }));
      return { success: true, message: `Pulled fresh records from Supabase (${currentUsername})!` };
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
        currentUsername,
        isMasterAdmin,
        userRole,
        login,
        registerUser,
        createUserAccount,
        deleteUserAccount,
        accountsList,
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
        selectedPortalBorrowerId,
        setSelectedPortalBorrowerId,
        activeSettingsSection,
        setActiveSettingsSection,
        borrowers,
        capitalSources,
        collectors,
        assignments,
        collectorCashouts,
        activityLogs,
        addBorrower,
        updateBorrowerInfo,
        deleteBorrower,
        recordPayment,
        addActivityLog,
        clearActivityLogs,
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
