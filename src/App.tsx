/**
 * QuitaÍ — Gestão Inteligente de Dívidas, Entradas, Despesas e Investimentos
 * Main Application Component with Supabase RLS User Isolation
 */

import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SubscriptionProvider, useSubscription } from './context/SubscriptionContext';
import { FinanceProvider, useFinance } from './context/FinanceContext';
import { Navbar, AppNavView } from './components/layout/Navbar';
import { DashboardView } from './components/dashboard/DashboardView';
import { DebtListView } from './components/debts/DebtListView';
import { DebtDetailView } from './components/debt-detail/DebtDetailView';
import { IncomeListView } from './components/incomes/IncomeListView';
import { IncomeFormModal } from './components/incomes/IncomeFormModal';
import { ExpenseListView } from './components/expenses/ExpenseListView';
import { ExpenseFormModal } from './components/expenses/ExpenseFormModal';
import { InvestmentListView } from './components/investments/InvestmentListView';
import { InvestmentFormModal } from './components/investments/InvestmentFormModal';
import { FinancialCalendarView } from './components/calendar/FinancialCalendarView';
import { ReportsView } from './components/reports/ReportsView';
import { UserProfileView } from './components/profile/UserProfileView';
import { PlansView } from './components/subscription/PlansView';
import { AdminDashboardView } from './components/admin/AdminDashboardView';
import { UpgradeNoticeModal } from './components/subscription/UpgradeNoticeModal';
import { CheckoutModal } from './components/subscription/CheckoutModal';
import { LoginView } from './components/auth/LoginView';
import { RegisterView } from './components/auth/RegisterView';
import { SessionExpiredModal } from './components/auth/SessionExpiredModal';
import { DebtFormModal } from './components/debts/DebtFormModal';
import { PaymentModal } from './components/debt-detail/PaymentModal';
import { ToastContainer } from './components/common/ToastContainer';
import { Debt, Installment, PaymentMethod } from './types/finance';
import { TrendingDown } from 'lucide-react';

function MainApp() {
  const { isAuthenticated, isLoading } = useAuth();
  const {
    debts,
    addDebt,
    updateDebt,
    addIncome,
    addExpense,
    addInvestment,
    registerInstallmentPayment,
    loadDemoData,
    clearAllData,
  } = useFinance();

  // Auth mode switch
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');

  // Navigation state
  const [currentView, setCurrentView] = useState<AppNavView>('dashboard');
  const [selectedDebtId, setSelectedDebtId] = useState<string | null>(null);

  // Dark mode state
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('finantrack_dark_mode');
    if (saved !== null) return saved === 'true';
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('finantrack_dark_mode', darkMode.toString());
  }, [darkMode]);

  const handleToggleDarkMode = () => {
    setDarkMode((prev) => !prev);
  };

  // Modals state
  const [isDebtModalOpen, setIsDebtModalOpen] = useState(false);
  const [debtToEdit, setDebtToEdit] = useState<Debt | null>(null);

  const [isIncomeModalOpen, setIsIncomeModalOpen] = useState(false);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [isInvestmentModalOpen, setIsInvestmentModalOpen] = useState(false);

  // Quick Pay Modal from dashboard/list
  const [quickPayState, setQuickPayState] = useState<{
    isOpen: boolean;
    installment: Installment | null;
    debt: Debt | null;
  }>({ isOpen: false, installment: null, debt: null });

  // Navigation handlers
  const handleNavigate = (view: AppNavView) => {
    setCurrentView(view);
    setSelectedDebtId(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectDebt = (debtId: string) => {
    setSelectedDebtId(debtId);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBackFromDetail = () => {
    setSelectedDebtId(null);
  };

  // Debt CRUD triggers
  const handleOpenCreateDebt = () => {
    setDebtToEdit(null);
    setIsDebtModalOpen(true);
  };

  const handleOpenEditDebt = (debt: Debt) => {
    setDebtToEdit(debt);
    setIsDebtModalOpen(true);
  };

  const handleSaveDebt = (
    debtData: Omit<Debt, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'financedAmountCents'>,
    customAmounts?: number[]
  ) => {
    if (debtToEdit) {
      updateDebt(debtToEdit.id, debtData);
    } else {
      addDebt(debtData, customAmounts);
    }
  };

  // Quick Pay handler
  const handleQuickPay = (inst: Installment, debt: Debt) => {
    setQuickPayState({
      isOpen: true,
      installment: inst,
      debt,
    });
  };

  const handleConfirmQuickPay = async (
    amountCents: number,
    paymentDate: string,
    paymentMethod: PaymentMethod,
    notes?: string,
    receiptFile?: { fileName: string; fileType: string; dataUrl: string; description?: string }
  ) => {
    if (quickPayState.installment) {
      await registerInstallmentPayment(
        quickPayState.installment.id,
        amountCents,
        paymentDate,
        paymentMethod,
        notes,
        receiptFile
      );
    }
  };

  // If verifying session
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center animate-pulse shadow-lg shadow-emerald-500/20">
          <TrendingDown className="w-6 h-6" />
        </div>
        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
          Carregando QuitaÍ...
        </p>
      </div>
    );
  }

  // If not authenticated, show Login or Register view
  if (!isAuthenticated) {
    return (
      <>
        {authMode === 'login' ? (
          <LoginView
            onSwitchToRegister={() => setAuthMode('register')}
            onSuccess={() => {
              setCurrentView('dashboard');
            }}
          />
        ) : (
          <RegisterView
            onSwitchToLogin={() => setAuthMode('login')}
            onSuccess={() => {
              setCurrentView('dashboard');
            }}
          />
        )}
        <SessionExpiredModal />
        <ToastContainer />
      </>
    );
  }

  // Authenticated Protected App
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors pb-24 lg:pb-12">
      {/* Header */}
      <Navbar
        currentView={selectedDebtId ? 'debts' : currentView}
        onNavigate={handleNavigate}
        onOpenCreateDebt={handleOpenCreateDebt}
        onOpenCreateIncome={() => setIsIncomeModalOpen(true)}
        onOpenCreateExpense={() => setIsExpenseModalOpen(true)}
        onOpenCreateInvestment={() => setIsInvestmentModalOpen(true)}
        darkMode={darkMode}
        onToggleDarkMode={handleToggleDarkMode}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {selectedDebtId ? (
          <DebtDetailView
            debtId={selectedDebtId}
            onBack={handleBackFromDetail}
            onEditDebt={handleOpenEditDebt}
          />
        ) : (
          <>
            {currentView === 'dashboard' && (
              <DashboardView
                onNavigateToDebts={() => {
                  setCurrentView('debts');
                }}
                onSelectDebt={handleSelectDebt}
                onOpenCreateDebt={handleOpenCreateDebt}
                onOpenCreateIncome={() => setIsIncomeModalOpen(true)}
                onOpenCreateExpense={() => setIsExpenseModalOpen(true)}
                onOpenCreateInvestment={() => setIsInvestmentModalOpen(true)}
                onQuickPayInstallment={handleQuickPay}
              />
            )}

            {currentView === 'debts' && (
              <DebtListView
                onSelectDebt={handleSelectDebt}
                onOpenCreateDebt={handleOpenCreateDebt}
                onQuickPay={handleQuickPay}
              />
            )}

            {currentView === 'incomes' && <IncomeListView />}

            {currentView === 'expenses' && <ExpenseListView />}

            {currentView === 'investments' && <InvestmentListView />}

            {currentView === 'calendar' && (
              <FinancialCalendarView onQuickPayInstallment={handleQuickPay} />
            )}

            {currentView === 'reports' && <ReportsView />}

            {currentView === 'profile' && (
              <UserProfileView
                onBackToDashboard={() => setCurrentView('dashboard')}
                onOpenPlans={() => setCurrentView('plans')}
                initialTab="profile"
              />
            )}

            {currentView === 'plans' && (
              <UserProfileView
                onBackToDashboard={() => setCurrentView('dashboard')}
                onOpenPlans={() => setCurrentView('plans')}
                initialTab="plans"
              />
            )}

            {currentView === 'admin' && (
              <AdminDashboardView onBackToDashboard={() => setCurrentView('dashboard')} />
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800/80 py-6 text-xs text-slate-400 dark:text-slate-500 text-center max-w-7xl mx-auto w-full px-4 print:hidden">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>
            <strong>QuitaÍ</strong> — Sistema Integrado com Supabase & Row Level Security (RLS)
          </p>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={loadDemoData}
              className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors cursor-pointer"
            >
              Recarregar Exemplos
            </button>
            <button
              type="button"
              onClick={() => {
                if (confirm('Deseja limpar todos os seus registros cadastrados e começar do zero?')) {
                  clearAllData();
                }
              }}
              className="hover:text-rose-500 transition-colors cursor-pointer"
            >
              Resetar Tudo
            </button>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <DebtFormModal
        isOpen={isDebtModalOpen}
        onClose={() => setIsDebtModalOpen(false)}
        onSave={handleSaveDebt}
        debtToEdit={debtToEdit}
      />

      <IncomeFormModal
        isOpen={isIncomeModalOpen}
        onClose={() => setIsIncomeModalOpen(false)}
        onSave={(data) => addIncome(data)}
      />

      <ExpenseFormModal
        isOpen={isExpenseModalOpen}
        onClose={() => setIsExpenseModalOpen(false)}
        onSave={(data) => addExpense(data)}
      />

      <InvestmentFormModal
        isOpen={isInvestmentModalOpen}
        onClose={() => setIsInvestmentModalOpen(false)}
        onSave={(data) => addInvestment(data)}
      />

      <PaymentModal
        isOpen={quickPayState.isOpen}
        onClose={() => setQuickPayState({ isOpen: false, installment: null, debt: null })}
        installment={quickPayState.installment}
        debt={quickPayState.debt}
        onConfirmPayment={handleConfirmQuickPay}
      />

      {/* Subscription Limit Enforcer & Checkout Modals */}
      <UpgradeNoticeModal onOpenPlans={() => setCurrentView('plans')} />
      <CheckoutModal />

      {/* Session Expired & Toast Feedback */}
      <SessionExpiredModal />
      <ToastContainer />
    </div>
  );
}

export function App() {
  return (
    <AuthProvider>
      <FinanceProvider>
        <SubscriptionProvider>
          <MainApp />
        </SubscriptionProvider>
      </FinanceProvider>
    </AuthProvider>
  );
}

export default App;
