export type PaymentMethod = 'Cash' | 'GCash' | 'Bank Transfer';

export interface PaymentRecord {
  id: string;
  amount: number;
  method: PaymentMethod;
  date: string;
  reference?: string;
  notes?: string;
}

export interface ScheduleItem {
  id: string;
  borrower_id?: string;
  installment_no: number;
  due_date: string;
  amount_due: number;
  amount_paid: number;
  status: 'Pending' | 'Partial' | 'Paid';
  payments: PaymentRecord[];
}

export type LoanFrequency = 'daily' | 'weekly' | 'monthly';

export interface Borrower {
  id: string;
  name: string;
  contact: string;
  address: string;
  amount: number; // Principal
  interest_rate: number; // e.g. 20 for 20%
  start_date: string;
  frequency: LoanFrequency;
  installments: number;
  total_payable: number;
  is_fully_paid: boolean;
  schedules: ScheduleItem[];
  notes?: string;
}

export interface CapitalTransaction {
  id: string;
  amount: number;
  date: string;
  notes: string;
}

export interface CapitalSource {
  id: string;
  name: string;
  amount: number;
  date: string;
  transactions: CapitalTransaction[];
}

export interface Collector {
  id: string;
  name: string;
  contact: string;
  address: string;
}

export interface LoanAssignment {
  id: string;
  collectorId: string;
  borrowerId: string;
}

export interface CollectorCashout {
  id: string;
  collectorId: string;
  amount: number;
  date: string;
  notes: string;
}

export type ViewType =
  | 'dashboard'
  | 'borrowers'
  | 'capital'
  | 'capital-detail'
  | 'collectors'
  | 'cashouts'
  | 'collector-loans'
  | 'ledger'
  | 'past-ledger'
  | 'statement'
  | 'agreement'
  | 'collection-sheet'
  | 'settings';

export type SettingsSection = 'backup' | 'supabase' | 'dcs' | 'danger';

export interface DashboardStats {
  totalCapitalPool: number;
  totalCapitalDisbursed: number;
  totalOutstanding: number;
  overdueAccountsCount: number;
  activeLoansCount: number;
  totalCollected: number;
  totalProfit: number;
  totalInterestEarned: number;
  ownerInterest: number;
  collectorProfit: number;
}
