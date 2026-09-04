import { Borrower, CapitalSource, Collector, LoanAssignment, CollectorCashout } from '../types';

export const INITIAL_CAPITAL: CapitalSource[] = [
  {
    id: 'c_101',
    name: 'Personal Equity Fund',
    amount: 150000,
    date: '2026-07-01',
    transactions: [
      {
        id: 'tx_101_1',
        amount: 100000,
        date: '2026-07-01',
        notes: 'Initial seed capital injection',
      },
      {
        id: 'tx_101_2',
        amount: 50000,
        date: '2026-08-01',
        notes: 'Secondary expansion capital',
      },
    ],
  },
  {
    id: 'c_102',
    name: 'Angel Investor Partner (V. Reyes)',
    amount: 100000,
    date: '2026-07-15',
    transactions: [
      {
        id: 'tx_102_1',
        amount: 100000,
        date: '2026-07-15',
        notes: 'Syndicate lending partnership tranche 1',
      },
    ],
  },
];

export const INITIAL_COLLECTORS: Collector[] = [
  {
    id: 'col_1',
    name: 'Pedro Santos',
    contact: '0917-889-1234',
    address: 'Brgy. San Antonio, Pasig City',
  },
  {
    id: 'col_2',
    name: 'Eduardo Manalo',
    contact: '0928-554-7711',
    address: 'Brgy. Maligaya, Quezon City',
  },
];

export const INITIAL_BORROWERS: Borrower[] = [
  {
    id: 'b_1',
    name: 'Lizel Dizon',
    contact: '0919-456-7890',
    address: 'Blk 12 Lot 4, Villa Verde, Caloocan',
    amount: 10000,
    interest_rate: 20,
    start_date: '2026-08-01',
    frequency: 'monthly',
    installments: 3,
    total_payable: 12000,
    is_fully_paid: false,
    schedules: [
      {
        id: 's_1_1',
        borrower_id: 'b_1',
        installment_no: 1,
        due_date: '2026-08-31',
        amount_due: 4000,
        amount_paid: 4000,
        status: 'Paid',
        payments: [
          {
            id: 'p_1_1_1',
            amount: 4000,
            method: 'GCash',
            date: '2026-08-30',
            reference: 'GC89230198',
            notes: 'On-time mobile transfer payment',
          },
        ],
      },
      {
        id: 's_1_2',
        borrower_id: 'b_1',
        installment_no: 2,
        due_date: '2026-09-30',
        amount_due: 4000,
        amount_paid: 2000,
        status: 'Partial',
        payments: [
          {
            id: 'p_1_2_1',
            amount: 2000,
            method: 'Cash',
            date: '2026-09-02',
            reference: '',
            notes: 'Partial cash collection via Pedro',
          },
        ],
      },
      {
        id: 's_1_3',
        borrower_id: 'b_1',
        installment_no: 3,
        due_date: '2026-10-30',
        amount_due: 4000,
        amount_paid: 0,
        status: 'Pending',
        payments: [],
      },
    ],
  },
  {
    id: 'b_2',
    name: 'Juan Dela Cruz',
    contact: '0922-334-5566',
    address: '77 Rizal Ave, Santa Cruz, Manila',
    amount: 15000,
    interest_rate: 20,
    start_date: '2026-08-15',
    frequency: 'monthly',
    installments: 2,
    total_payable: 18000,
    is_fully_paid: false,
    schedules: [
      {
        id: 's_2_1',
        borrower_id: 'b_2',
        installment_no: 1,
        due_date: '2026-09-14',
        amount_due: 9000,
        amount_paid: 0,
        status: 'Pending',
        payments: [],
      },
      {
        id: 's_2_2',
        borrower_id: 'b_2',
        installment_no: 2,
        due_date: '2026-10-14',
        amount_due: 9000,
        amount_paid: 0,
        status: 'Pending',
        payments: [],
      },
    ],
  },
  {
    id: 'b_3',
    name: 'Maria Clara Santos',
    contact: '0918-776-9012',
    address: '14 Mabini St, Ermita, Manila',
    amount: 5000,
    interest_rate: 20,
    start_date: '2026-07-01',
    frequency: 'monthly',
    installments: 1,
    total_payable: 6000,
    is_fully_paid: true,
    schedules: [
      {
        id: 's_3_1',
        borrower_id: 'b_3',
        installment_no: 1,
        due_date: '2026-07-31',
        amount_due: 6000,
        amount_paid: 6000,
        status: 'Paid',
        payments: [
          {
            id: 'p_3_1_1',
            amount: 6000,
            method: 'Bank Transfer',
            date: '2026-07-28',
            reference: 'BPI-TR-990182',
            notes: 'Paid in full ahead of time',
          },
        ],
      },
    ],
  },
];

export const INITIAL_ASSIGNMENTS: LoanAssignment[] = [
  {
    id: 'asg_1',
    collectorId: 'col_1',
    borrowerId: 'b_1',
  },
  {
    id: 'asg_2',
    collectorId: 'col_2',
    borrowerId: 'b_2',
  },
];

export const INITIAL_CASHOUTS: CollectorCashout[] = [
  {
    id: 'co_1',
    collectorId: 'col_1',
    amount: 300,
    date: '2026-08-31',
    notes: 'August collection commission disbursement',
  },
];
