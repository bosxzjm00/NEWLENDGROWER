import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { LoginView } from './components/LoginView';

// Views
import { DashboardView } from './views/DashboardView';
import { BorrowersView } from './views/BorrowersView';
import { CapitalView } from './views/CapitalView';
import { CapitalDetailView } from './views/CapitalDetailView';
import { CollectorsView } from './views/CollectorsView';
import { CashoutsView } from './views/CashoutsView';
import { CollectorLoansView } from './views/CollectorLoansView';
import { LedgerView } from './views/LedgerView';
import { PastLedgerView } from './views/PastLedgerView';
import { StatementView } from './views/StatementView';
import { AgreementView } from './views/AgreementView';
import { CollectionSheetView } from './views/CollectionSheetView';
import { SettingsView } from './views/SettingsView';

// Modals
import { AddBorrowerModal } from './components/modals/AddBorrowerModal';
import { AddCapitalModal } from './components/modals/AddCapitalModal';
import { AddCapitalInvestModal } from './components/modals/AddCapitalInvestModal';
import { AddCollectorModal } from './components/modals/AddCollectorModal';
import { CollectorCashoutModal } from './components/modals/CollectorCashoutModal';
import { AssignLoanModal } from './components/modals/AssignLoanModal';
import { PaymentModal } from './components/modals/PaymentModal';
import { ResetDataModal } from './components/modals/ResetDataModal';

const MainLayout: React.FC = () => {
  const { isLoggedIn, currentView, selectedCapitalId } = useApp();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Modals state
  const [isAddBorrowerOpen, setIsAddBorrowerOpen] = useState(false);
  const [isAddCapitalOpen, setIsAddCapitalOpen] = useState(false);
  const [isAddCapitalInvestOpen, setIsAddCapitalInvestOpen] = useState(false);
  const [isAddCollectorOpen, setIsAddCollectorOpen] = useState(false);
  const [isCollectorCashoutOpen, setIsCollectorCashoutOpen] = useState(false);
  const [cashoutPreselectedCollectorId, setCashoutPreselectedCollectorId] = useState<string | null>(
    null
  );
  const [isAssignLoanOpen, setIsAssignLoanOpen] = useState(false);
  const [assignCollectorId, setAssignCollectorId] = useState<string | null>(null);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [paymentBorrowerId, setPaymentBorrowerId] = useState<string | null>(null);
  const [paymentScheduleId, setPaymentScheduleId] = useState<string | null>(null);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);

  if (!isLoggedIn) {
    return <LoginView />;
  }

  const handleOpenAssignLoan = (collectorId: string) => {
    setAssignCollectorId(collectorId);
    setIsAssignLoanOpen(true);
  };

  const handleOpenCashout = (collectorId?: string) => {
    setCashoutPreselectedCollectorId(collectorId || null);
    setIsCollectorCashoutOpen(true);
  };

  const handleOpenPayment = (borrowerId: string, scheduleId: string) => {
    setPaymentBorrowerId(borrowerId);
    setPaymentScheduleId(scheduleId);
    setIsPaymentOpen(true);
  };

  const renderCurrentView = () => {
    switch (currentView) {
      case 'dashboard':
        return (
          <DashboardView
            onOpenAddBorrower={() => setIsAddBorrowerOpen(true)}
            onOpenAddCapital={() => setIsAddCapitalOpen(true)}
          />
        );
      case 'borrowers':
        return <BorrowersView onOpenAddBorrower={() => setIsAddBorrowerOpen(true)} />;
      case 'capital':
        return <CapitalView onOpenAddCapital={() => setIsAddCapitalOpen(true)} />;
      case 'capital-detail':
        return (
          <CapitalDetailView onOpenAddInvestment={() => setIsAddCapitalInvestOpen(true)} />
        );
      case 'collectors':
        return (
          <CollectorsView
            onOpenAddCollector={() => setIsAddCollectorOpen(true)}
            onOpenAssignLoan={handleOpenAssignLoan}
          />
        );
      case 'cashouts':
        return <CashoutsView onOpenCashout={() => handleOpenCashout()} />;
      case 'collector-loans':
        return <CollectorLoansView onOpenAssignLoan={handleOpenAssignLoan} />;
      case 'ledger':
        return <LedgerView onOpenPaymentModal={handleOpenPayment} />;
      case 'past-ledger':
        return <PastLedgerView />;
      case 'statement':
        return <StatementView />;
      case 'agreement':
        return <AgreementView />;
      case 'collection-sheet':
        return <CollectionSheetView />;
      case 'settings':
        return <SettingsView onOpenResetModal={() => setIsResetModalOpen(true)} />;
      default:
        return (
          <DashboardView
            onOpenAddBorrower={() => setIsAddBorrowerOpen(true)}
            onOpenAddCapital={() => setIsAddCapitalOpen(true)}
          />
        );
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 text-slate-800 dark:bg-[#0b1120] dark:text-slate-400">
      {/* Desktop Sidebar */}
      <div className="hidden md:block shrink-0">
        <Sidebar />
      </div>

      {/* Mobile Drawer Sidebar */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setIsMobileMenuOpen(false)}
          ></div>
          <div className="relative z-10">
            <Sidebar onCloseMobile={() => setIsMobileMenuOpen(false)} />
          </div>
        </div>
      )}

      {/* Main Viewport */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <Header
          isMobileMenuOpen={isMobileMenuOpen}
          onToggleMobileMenu={() => setIsMobileMenuOpen((prev) => !prev)}
        />

        <main id="app-main" className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 relative">
          <div className="max-w-7xl mx-auto">{renderCurrentView()}</div>
        </main>
      </div>

      {/* Global Modals */}
      <AddBorrowerModal
        isOpen={isAddBorrowerOpen}
        onClose={() => setIsAddBorrowerOpen(false)}
      />

      <AddCapitalModal
        isOpen={isAddCapitalOpen}
        onClose={() => setIsAddCapitalOpen(false)}
      />

      <AddCapitalInvestModal
        isOpen={isAddCapitalInvestOpen}
        onClose={() => setIsAddCapitalInvestOpen(false)}
        capitalId={selectedCapitalId}
      />

      <AddCollectorModal
        isOpen={isAddCollectorOpen}
        onClose={() => setIsAddCollectorOpen(false)}
      />

      <CollectorCashoutModal
        isOpen={isCollectorCashoutOpen}
        onClose={() => setIsCollectorCashoutOpen(false)}
        preselectedCollectorId={cashoutPreselectedCollectorId}
      />

      <AssignLoanModal
        isOpen={isAssignLoanOpen}
        onClose={() => setIsAssignLoanOpen(false)}
        collectorId={assignCollectorId}
      />

      <PaymentModal
        isOpen={isPaymentOpen}
        onClose={() => setIsPaymentOpen(false)}
        borrowerId={paymentBorrowerId}
        scheduleId={paymentScheduleId}
      />

      <ResetDataModal
        isOpen={isResetModalOpen}
        onClose={() => setIsResetModalOpen(false)}
      />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainLayout />
    </AppProvider>
  );
}
