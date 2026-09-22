/**
 * FinanceContext - Central Reactive State Management for FinanTrack
 */

import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import {
  Debt,
  Installment,
  PaymentRecord,
  Attachment,
  HistoryEvent,
  DebtAdjustmentRule,
  UserProfile,
  DebtFinancialSummary,
  GlobalDashboardMetrics,
  PaymentMethod,
  Income,
  Expense,
  Investment,
  InvestmentTransaction,
  InvestmentTransactionType,
} from '../types/finance';
import {
  StorageService,
  DEFAULT_USER,
  calculateDebtSummary,
  calculateGlobalMetrics,
  saveAttachmentData,
  deleteAttachmentData,
} from '../services/storage';
import { generateInstallmentDueDates, getTodayIso, isOverdue } from '../utils/dates';
import { useAuth } from './AuthContext';
import { SupabaseService } from '../services/supabaseService';

export interface ToastItem {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
}

interface FinanceContextType {
  debts: Debt[];
  installments: Installment[];
  payments: PaymentRecord[];
  attachments: Attachment[];
  history: HistoryEvent[];
  adjustmentRules: DebtAdjustmentRule[];
  incomes: Income[];
  expenses: Expense[];
  investments: Investment[];
  investmentTransactions: InvestmentTransaction[];
  userProfile: UserProfile;
  hasDemoData: boolean;
  globalMetrics: GlobalDashboardMetrics;
  theme: 'light' | 'dark';
  toasts: ToastItem[];
  
  toggleTheme: () => void;
  showToast: (message: string, type?: ToastItem['type']) => void;
  removeToast: (id: string) => void;

  // Incomes CRUD
  addIncome: (incomeData: Omit<Income, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => string;
  updateIncome: (incomeId: string, updates: Partial<Income>) => void;
  deleteIncome: (incomeId: string) => void;

  // Expenses CRUD
  addExpense: (expenseData: Omit<Expense, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => string;
  updateExpense: (expenseId: string, updates: Partial<Expense>) => void;
  deleteExpense: (expenseId: string) => void;

  // Investments CRUD
  addInvestment: (
    investmentData: Omit<Investment, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'totalInvestedCents' | 'totalYieldCents'>
  ) => string;
  updateInvestment: (investmentId: string, updates: Partial<Investment>) => void;
  deleteInvestment: (investmentId: string) => void;
  addInvestmentTransaction: (
    investmentId: string,
    type: InvestmentTransactionType,
    amountCents: number,
    date: string,
    notes?: string
  ) => void;

  // Generic Attachment
  addGeneralAttachment: (attachmentData: Omit<Attachment, 'id' | 'createdAt'>) => Promise<Attachment>;

  // CRUD & Operations
  addDebt: (
    debtData: Omit<Debt, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'financedAmountCents'>,
    customAmounts?: number[]
  ) => string;
  updateDebt: (debtId: string, updates: Partial<Debt>) => void;
  deleteDebt: (debtId: string) => void;

  registerInstallmentPayment: (
    installmentId: string,
    amountCents: number,
    paymentDate: string,
    paymentMethod: PaymentMethod,
    notes?: string,
    receiptFile?: { fileName: string; fileType: string; dataUrl: string; description?: string }
  ) => Promise<void>;

  registerPartialPayment: (
    installmentId: string,
    partialAmountCents: number,
    paymentDate: string,
    paymentMethod: PaymentMethod,
    notes?: string
  ) => void;

  registerDownPayment: (
    debtId: string,
    paymentDate: string,
    paymentMethod: PaymentMethod,
    notes?: string
  ) => void;

  undoPayment: (paymentId: string) => void;

  editInstallment: (
    installmentId: string,
    updates: {
      dueDate?: string;
      expectedAmountCents?: number;
      notes?: string;
      penaltyInterestCents?: number;
      discountCents?: number;
      reason?: string;
    }
  ) => void;

  addAttachment: (
    debtId: string,
    fileInfo: {
      fileName: string;
      fileType: string;
      fileSize: number;
      dataUrl: string;
      category: Attachment['category'];
      description?: string;
      installmentId?: string;
    }
  ) => Promise<Attachment>;

  deleteAttachment: (attachmentId: string) => Promise<void>;

  addAdjustmentRule: (rule: Omit<DebtAdjustmentRule, 'id' | 'createdAt'>) => void;
  applyBatchAdjustment: (
    debtId: string,
    percentage: number,
    startFromInstallmentNum: number,
    reason: string
  ) => void;

  loadDemoData: () => void;
  clearDemoData: () => void;
  clearAllData: () => void;
  exportBackup: () => void;
  importBackup: (jsonStr: string) => boolean;

  getDebtSummary: (debtId: string) => DebtFinancialSummary | null;
  getDebtInstallments: (debtId: string) => Installment[];
  getDebtPayments: (debtId: string) => PaymentRecord[];
  getDebtAttachments: (debtId: string) => Attachment[];
  getDebtHistory: (debtId: string) => HistoryEvent[];
}

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

export const FinanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();

  // User Profile derived from authenticated user
  const userProfile: UserProfile = useMemo(() => {
    if (user) {
      return {
        id: user.id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt,
      };
    }
    return DEFAULT_USER;
  }, [user]);

  // Theme state
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    try {
      const saved = localStorage.getItem('finantrack_theme');
      if (saved === 'dark' || saved === 'light') return saved;
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    } catch {
      return 'light';
    }
  });

  // Apply theme class to documentElement
  useEffect(() => {
    try {
      if (theme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      localStorage.setItem('finantrack_theme', theme);
    } catch (e) {
      console.error(e);
    }
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  }, []);

  // Toasts
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const showToast = useCallback((message: string, type: ToastItem['type'] = 'info') => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Main Entities State (isolated per active user)
  const [debts, setDebts] = useState<Debt[]>([]);
  const [installments, setInstallments] = useState<Installment[]>([]);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [history, setHistory] = useState<HistoryEvent[]>([]);
  const [adjustmentRules, setAdjustmentRules] = useState<DebtAdjustmentRule[]>([]);
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [investmentTransactions, setInvestmentTransactions] = useState<InvestmentTransaction[]>([]);
  const [hasDemoData, setHasDemoData] = useState<boolean>(false);

  // Reload user data when user changes
  const reloadUserData = useCallback((currentUserId?: string) => {
    if (!currentUserId) {
      setDebts([]);
      setInstallments([]);
      setPayments([]);
      setAttachments([]);
      setHistory([]);
      setAdjustmentRules([]);
      setIncomes([]);
      setExpenses([]);
      setInvestments([]);
      setInvestmentTransactions([]);
      setHasDemoData(false);
      return;
    }

    const allDebts = StorageService.getDebts();
    let userDebts = allDebts.filter((d) => d.userId === currentUserId);

    // If demo user and has no debts yet, auto seed demo debts for them
    if (userDebts.length === 0 && currentUserId === 'usr_demo_quitai') {
      StorageService.loadDemoData(currentUserId);
      const reloadedDebts = StorageService.getDebts();
      userDebts = reloadedDebts.filter((d) => d.userId === currentUserId);
    }

    const userDebtIds = new Set(userDebts.map((d) => d.id));
    const allInstallments = StorageService.getInstallments();
    const allPayments = StorageService.getPayments();
    const allAttachments = StorageService.getAttachments();
    const allHistory = StorageService.getHistory();
    const allRules = StorageService.getAdjustmentRules();
    const allIncomes = StorageService.getIncomes();
    const allExpenses = StorageService.getExpenses();
    const allInvestments = StorageService.getInvestments();
    const allTxs = StorageService.getInvestmentTransactions();

    setDebts(userDebts);
    setInstallments(allInstallments.filter((i) => userDebtIds.has(i.debtId)));
    setPayments(allPayments.filter((p) => userDebtIds.has(p.debtId)));
    setAttachments(allAttachments.filter((a) => !a.debtId || userDebtIds.has(a.debtId)));
    setHistory(allHistory.filter((h) => userDebtIds.has(h.debtId)));
    setAdjustmentRules(allRules.filter((r) => userDebtIds.has(r.debtId)));
    setIncomes(allIncomes.filter((inc) => inc.userId === currentUserId));
    setExpenses(allExpenses.filter((exp) => exp.userId === currentUserId));
    setInvestments(allInvestments.filter((inv) => inv.userId === currentUserId));
    setInvestmentTransactions(allTxs.filter((tx) => tx.userId === currentUserId));
    setHasDemoData(userDebts.some((d) => d.isDemo));

    // Asynchronously fetch from Supabase (protected by RLS)
    SupabaseService.fetchUserData(currentUserId)
      .then((supa) => {
        if (supa.isOnline) {
          if (supa.debts.length > 0) {
            setDebts(supa.debts);
            setInstallments(supa.installments);
            setPayments(supa.payments);
            setAttachments(supa.attachments);
            setHistory(supa.history);
            setAdjustmentRules(supa.adjustmentRules);
            setHasDemoData(supa.debts.some((d) => d.isDemo));
          }
          if (supa.incomes.length > 0) setIncomes(supa.incomes);
          if (supa.expenses.length > 0) setExpenses(supa.expenses);
          if (supa.investments.length > 0) setInvestments(supa.investments);
          if (supa.investmentTransactions.length > 0) setInvestmentTransactions(supa.investmentTransactions);
        }
      })
      .catch((err) => console.warn('Supabase fetch notice:', err));
  }, []);

  useEffect(() => {
    reloadUserData(user?.id);
  }, [user?.id, reloadUserData]);

  // Auto-sync state to Storage while strictly isolating current user's records
  const persistState = useCallback(
    (
      newDebts: Debt[],
      newInstallments: Installment[],
      newPayments: PaymentRecord[],
      newAttachments: Attachment[],
      newHistory: HistoryEvent[],
      newRules: DebtAdjustmentRule[],
      newIncomes: Income[] = incomes,
      newExpenses: Expense[] = expenses,
      newInvestments: Investment[] = investments,
      newTxs: InvestmentTransaction[] = investmentTransactions
    ) => {
      const currentUserId = user?.id;
      if (!currentUserId) return;

      const allDebts = StorageService.getDebts();
      const otherDebts = allDebts.filter((d) => d.userId !== currentUserId);
      const otherDebtIds = new Set(otherDebts.map((d) => d.id));

      const otherInstallments = StorageService.getInstallments().filter((i) => otherDebtIds.has(i.debtId));
      const otherPayments = StorageService.getPayments().filter((p) => otherDebtIds.has(p.debtId));
      const otherAttachments = StorageService.getAttachments().filter((a) => a.debtId ? otherDebtIds.has(a.debtId) : false);
      const otherHistory = StorageService.getHistory().filter((h) => otherDebtIds.has(h.debtId));
      const otherRules = StorageService.getAdjustmentRules().filter((r) => otherDebtIds.has(r.debtId));
      const otherIncomes = StorageService.getIncomes().filter((inc) => inc.userId !== currentUserId);
      const otherExpenses = StorageService.getExpenses().filter((exp) => exp.userId !== currentUserId);
      const otherInvestments = StorageService.getInvestments().filter((inv) => inv.userId !== currentUserId);
      const otherTxs = StorageService.getInvestmentTransactions().filter((tx) => tx.userId !== currentUserId);

      StorageService.saveAll(
        [...otherDebts, ...newDebts],
        [...otherInstallments, ...newInstallments],
        [...otherPayments, ...newPayments],
        [...otherAttachments, ...newAttachments],
        [...otherHistory, ...newHistory],
        [...otherRules, ...newRules],
        [...otherIncomes, ...newIncomes],
        [...otherExpenses, ...newExpenses],
        [...otherInvestments, ...newInvestments],
        [...otherTxs, ...newTxs]
      );

      setDebts(newDebts);
      setInstallments(newInstallments);
      setPayments(newPayments);
      setAttachments(newAttachments);
      setHistory(newHistory);
      setAdjustmentRules(newRules);
      setIncomes(newIncomes);
      setExpenses(newExpenses);
      setInvestments(newInvestments);
      setInvestmentTransactions(newTxs);
      setHasDemoData(newDebts.some((d) => d.isDemo));

      // Asynchronously sync to Supabase with RLS
      SupabaseService.syncAll(
        currentUserId,
        newDebts,
        newInstallments,
        newPayments,
        newAttachments,
        newHistory,
        newRules,
        newIncomes,
        newExpenses,
        newInvestments,
        newTxs
      ).catch((err) => console.warn('Supabase sync notice:', err));
    },
    [user?.id, incomes, expenses, investments, investmentTransactions]
  );

  // Re-check overdue statuses automatically against current calendar
  useEffect(() => {
    let hasChanges = false;
    const updated = installments.map((inst) => {
      if (inst.status === 'pendente' && isOverdue(inst.dueDate, inst.status)) {
        hasChanges = true;
        return { ...inst, status: 'vencida' as const };
      }
      return inst;
    });
    if (hasChanges) {
      setInstallments(updated);
      persistState(debts, updated, payments, attachments, history, adjustmentRules);
    }
  }, []);

  // Incomes CRUD
  const addIncome = useCallback(
    (incomeData: Omit<Income, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): string => {
      const incomeId = `inc-${Date.now()}`;
      const now = new Date().toISOString();
      const newIncome: Income = {
        ...incomeData,
        id: incomeId,
        userId: userProfile.id,
        createdAt: now,
        updatedAt: now,
      };
      const updated = [newIncome, ...incomes];
      setIncomes(updated);
      persistState(debts, installments, payments, attachments, history, adjustmentRules, updated, expenses, investments, investmentTransactions);
      showToast(`Entrada "${newIncome.description}" registrada com sucesso!`, 'success');
      return incomeId;
    },
    [userProfile.id, incomes, debts, installments, payments, attachments, history, adjustmentRules, expenses, investments, investmentTransactions, persistState, showToast]
  );

  const updateIncome = useCallback(
    (incomeId: string, updates: Partial<Income>) => {
      const now = new Date().toISOString();
      const updated = incomes.map((inc) => (inc.id === incomeId ? { ...inc, ...updates, updatedAt: now } : inc));
      setIncomes(updated);
      persistState(debts, installments, payments, attachments, history, adjustmentRules, updated, expenses, investments, investmentTransactions);
      showToast('Entrada atualizada com sucesso!', 'info');
    },
    [incomes, debts, installments, payments, attachments, history, adjustmentRules, expenses, investments, investmentTransactions, persistState, showToast]
  );

  const deleteIncome = useCallback(
    (incomeId: string) => {
      const updated = incomes.filter((inc) => inc.id !== incomeId);
      setIncomes(updated);
      persistState(debts, installments, payments, attachments, history, adjustmentRules, updated, expenses, investments, investmentTransactions);
      showToast('Entrada excluída.', 'info');
    },
    [incomes, debts, installments, payments, attachments, history, adjustmentRules, expenses, investments, investmentTransactions, persistState, showToast]
  );

  // Expenses CRUD
  const addExpense = useCallback(
    (expenseData: Omit<Expense, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): string => {
      const expenseId = `exp-${Date.now()}`;
      const now = new Date().toISOString();
      const newExpense: Expense = {
        ...expenseData,
        id: expenseId,
        userId: userProfile.id,
        createdAt: now,
        updatedAt: now,
      };
      const updated = [newExpense, ...expenses];
      setExpenses(updated);
      persistState(debts, installments, payments, attachments, history, adjustmentRules, incomes, updated, investments, investmentTransactions);
      showToast(`Despesa "${newExpense.description}" registrada com sucesso!`, 'success');
      return expenseId;
    },
    [userProfile.id, expenses, debts, installments, payments, attachments, history, adjustmentRules, incomes, investments, investmentTransactions, persistState, showToast]
  );

  const updateExpense = useCallback(
    (expenseId: string, updates: Partial<Expense>) => {
      const now = new Date().toISOString();
      const updated = expenses.map((exp) => (exp.id === expenseId ? { ...exp, ...updates, updatedAt: now } : exp));
      setExpenses(updated);
      persistState(debts, installments, payments, attachments, history, adjustmentRules, incomes, updated, investments, investmentTransactions);
      showToast('Despesa atualizada com sucesso!', 'info');
    },
    [expenses, debts, installments, payments, attachments, history, adjustmentRules, incomes, investments, investmentTransactions, persistState, showToast]
  );

  const deleteExpense = useCallback(
    (expenseId: string) => {
      const updated = expenses.filter((exp) => exp.id !== expenseId);
      setExpenses(updated);
      persistState(debts, installments, payments, attachments, history, adjustmentRules, incomes, updated, investments, investmentTransactions);
      showToast('Despesa excluída.', 'info');
    },
    [expenses, debts, installments, payments, attachments, history, adjustmentRules, incomes, investments, investmentTransactions, persistState, showToast]
  );

  // Investments CRUD
  const addInvestment = useCallback(
    (
      investmentData: Omit<Investment, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'totalInvestedCents' | 'totalYieldCents'>
    ): string => {
      const investmentId = `inv-${Date.now()}`;
      const now = new Date().toISOString();
      const initialInvested = investmentData.initialAmountCents;
      const initialCurrent = investmentData.currentAmountCents || initialInvested;
      const initialYield = Math.max(0, initialCurrent - initialInvested);

      const newInv: Investment = {
        ...investmentData,
        id: investmentId,
        userId: userProfile.id,
        currentAmountCents: initialCurrent,
        totalInvestedCents: initialInvested,
        totalYieldCents: initialYield,
        createdAt: now,
        updatedAt: now,
      };

      const initialTx: InvestmentTransaction = {
        id: `tx-${Date.now()}`,
        investmentId,
        userId: userProfile.id,
        type: 'aporte',
        amountCents: initialInvested,
        date: investmentData.applicationDate,
        notes: 'Aporte de abertura',
        createdAt: now,
      };

      const updatedInvs = [newInv, ...investments];
      const updatedTxs = [initialTx, ...investmentTransactions];
      setInvestments(updatedInvs);
      setInvestmentTransactions(updatedTxs);
      persistState(debts, installments, payments, attachments, history, adjustmentRules, incomes, expenses, updatedInvs, updatedTxs);
      showToast(`Investimento "${newInv.name}" cadastrado!`, 'success');
      return investmentId;
    },
    [userProfile.id, investments, investmentTransactions, debts, installments, payments, attachments, history, adjustmentRules, incomes, expenses, persistState, showToast]
  );

  const updateInvestment = useCallback(
    (investmentId: string, updates: Partial<Investment>) => {
      const now = new Date().toISOString();
      const updated = investments.map((inv) => (inv.id === investmentId ? { ...inv, ...updates, updatedAt: now } : inv));
      setInvestments(updated);
      persistState(debts, installments, payments, attachments, history, adjustmentRules, incomes, expenses, updated, investmentTransactions);
      showToast('Investimento atualizado!', 'info');
    },
    [investments, investmentTransactions, debts, installments, payments, attachments, history, adjustmentRules, incomes, expenses, persistState, showToast]
  );

  const deleteInvestment = useCallback(
    (investmentId: string) => {
      const updatedInvs = investments.filter((inv) => inv.id !== investmentId);
      const updatedTxs = investmentTransactions.filter((tx) => tx.investmentId !== investmentId);
      setInvestments(updatedInvs);
      setInvestmentTransactions(updatedTxs);
      persistState(debts, installments, payments, attachments, history, adjustmentRules, incomes, expenses, updatedInvs, updatedTxs);
      showToast('Investimento excluído.', 'info');
    },
    [investments, investmentTransactions, debts, installments, payments, attachments, history, adjustmentRules, incomes, expenses, persistState, showToast]
  );

  const addInvestmentTransaction = useCallback(
    (investmentId: string, type: InvestmentTransactionType, amountCents: number, date: string, notes?: string) => {
      const inv = investments.find((i) => i.id === investmentId);
      if (!inv) return;
      const now = new Date().toISOString();
      const tx: InvestmentTransaction = {
        id: `tx-${Date.now()}`,
        investmentId,
        userId: userProfile.id,
        type,
        amountCents,
        date,
        notes,
        createdAt: now,
      };

      let newTotalInvested = inv.totalInvestedCents;
      let newCurrentAmount = inv.currentAmountCents;
      let newYield = inv.totalYieldCents;

      if (type === 'aporte') {
        newTotalInvested += amountCents;
        newCurrentAmount += amountCents;
      } else if (type === 'resgate') {
        newCurrentAmount = Math.max(0, newCurrentAmount - amountCents);
        newTotalInvested = Math.max(0, newTotalInvested - amountCents);
      } else if (type === 'rendimento') {
        newYield += amountCents;
        newCurrentAmount += amountCents;
      }

      const updatedInvs = investments.map((i) =>
        i.id === investmentId
          ? {
              ...i,
              totalInvestedCents: newTotalInvested,
              currentAmountCents: newCurrentAmount,
              totalYieldCents: newYield,
              updatedAt: now,
            }
          : i
      );

      const updatedTxs = [tx, ...investmentTransactions];
      setInvestments(updatedInvs);
      setInvestmentTransactions(updatedTxs);
      persistState(debts, installments, payments, attachments, history, adjustmentRules, incomes, expenses, updatedInvs, updatedTxs);
      showToast(`Movimentação de ${type} registrada!`, 'success');
    },
    [userProfile.id, investments, investmentTransactions, debts, installments, payments, attachments, history, adjustmentRules, incomes, expenses, persistState, showToast]
  );

  // Generic Attachment
  const addGeneralAttachment = useCallback(
    async (attachmentData: Omit<Attachment, 'id' | 'createdAt'>): Promise<Attachment> => {
      const attachmentId = `att-${Date.now()}`;
      const now = new Date().toISOString();

      if (attachmentData.dataUrl) {
        await saveAttachmentData(attachmentId, attachmentData.dataUrl);
      }

      const newAttachment: Attachment = {
        ...attachmentData,
        id: attachmentId,
        createdAt: now,
      };

      const updated = [newAttachment, ...attachments];
      setAttachments(updated);
      persistState(debts, installments, payments, updated, history, adjustmentRules, incomes, expenses, investments, investmentTransactions);
      showToast('Documento anexado com sucesso!', 'success');
      return newAttachment;
    },
    [attachments, debts, installments, payments, history, adjustmentRules, incomes, expenses, investments, investmentTransactions, persistState, showToast]
  );

  // Add Debt
  const addDebt = useCallback(
    (
      debtData: Omit<Debt, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'financedAmountCents'>,
      customAmounts?: number[]
    ): string => {
      const debtId = `debt-${Date.now()}`;
      const now = new Date().toISOString();
      const financedAmountCents = Math.max(0, debtData.totalAmountCents - debtData.downPaymentCents);

      const newDebt: Debt = {
        ...debtData,
        id: debtId,
        userId: userProfile.id,
        financedAmountCents,
        createdAt: now,
        updatedAt: now,
      };

      // Generate Installments
      const firstDueDate = debtData.startDate || getTodayIso();
      const dueDates = generateInstallmentDueDates(firstDueDate, debtData.dueDay, debtData.installmentCount);
      const newInstallments: Installment[] = [];

      for (let i = 0; i < debtData.installmentCount; i++) {
        const num = i + 1;
        const dueDate = dueDates[i];
        const expectedAmount =
          customAmounts && customAmounts[i] !== undefined
            ? customAmounts[i]
            : debtData.defaultInstallmentAmountCents;

        const isInstOverdue = isOverdue(dueDate, 'pendente');

        newInstallments.push({
          id: `inst-${debtId}-${num}`,
          debtId,
          installmentNumber: num,
          dueDate,
          expectedAmountCents: expectedAmount,
          paidAmountCents: 0,
          status: isInstOverdue ? 'vencida' : 'pendente',
          createdAt: now,
          updatedAt: now,
        });
      }

      // History event
      const historyEvent: HistoryEvent = {
        id: `hist-${Date.now()}`,
        debtId,
        type: 'criacao',
        title: 'Dívida cadastrada',
        description: `Cadastro de "${newDebt.title}" no valor total de R$ ${(newDebt.totalAmountCents / 100).toFixed(2)} com ${newDebt.installmentCount} parcelas.`,
        amountCents: newDebt.totalAmountCents,
        timestamp: now,
      };

      const updatedDebts = [newDebt, ...debts];
      const updatedInstallments = [...newInstallments, ...installments];
      const updatedHistory = [historyEvent, ...history];

      // If down payment was marked as already paid during creation
      let updatedPayments = payments;
      if (newDebt.downPaymentPaid && newDebt.downPaymentCents > 0) {
        const downPaymentRecord: PaymentRecord = {
          id: `pay-down-${debtId}`,
          debtId,
          amountCents: newDebt.downPaymentCents,
          paymentDate: newDebt.downPaymentPaidDate || debtData.startDate,
          paymentMethod: newDebt.paymentMethod,
          notes: 'Entrada contratual paga',
          isDownPayment: true,
          createdAt: now,
        };
        updatedPayments = [downPaymentRecord, ...payments];
      }

      setDebts(updatedDebts);
      setInstallments(updatedInstallments);
      setPayments(updatedPayments);
      setHistory(updatedHistory);

      persistState(updatedDebts, updatedInstallments, updatedPayments, attachments, updatedHistory, adjustmentRules);
      showToast(`Dívida "${newDebt.title}" cadastrada com sucesso!`, 'success');

      return debtId;
    },
    [debts, installments, payments, attachments, history, adjustmentRules, userProfile, persistState, showToast]
  );

  // Update Debt
  const updateDebt = useCallback(
    (debtId: string, updates: Partial<Debt>) => {
      const now = new Date().toISOString();
      const updatedDebts = debts.map((d) => (d.id === debtId ? { ...d, ...updates, updatedAt: now } : d));
      setDebts(updatedDebts);
      persistState(updatedDebts, installments, payments, attachments, history, adjustmentRules);
      showToast('Informações da dívida atualizadas.', 'success');
    },
    [debts, installments, payments, attachments, history, adjustmentRules, persistState, showToast]
  );

  // Delete Debt
  const deleteDebt = useCallback(
    (debtId: string) => {
      const debtToDelete = debts.find((d) => d.id === debtId);
      const updatedDebts = debts.filter((d) => d.id !== debtId);
      const updatedInstallments = installments.filter((i) => i.debtId !== debtId);
      const updatedPayments = payments.filter((p) => p.debtId !== debtId);
      const updatedAttachments = attachments.filter((a) => a.debtId !== debtId);
      const updatedHistory = history.filter((h) => h.debtId !== debtId);
      const updatedRules = adjustmentRules.filter((r) => r.debtId !== debtId);

      setDebts(updatedDebts);
      setInstallments(updatedInstallments);
      setPayments(updatedPayments);
      setAttachments(updatedAttachments);
      setHistory(updatedHistory);
      setAdjustmentRules(updatedRules);

      persistState(updatedDebts, updatedInstallments, updatedPayments, updatedAttachments, updatedHistory, updatedRules);
      SupabaseService.deleteDebt(debtId, userProfile.id).catch((err) => console.warn('Supabase delete error:', err));
      showToast(`Dívida "${debtToDelete?.title || ''}" excluída com sucesso.`, 'info');
    },
    [debts, installments, payments, attachments, history, adjustmentRules, persistState, showToast]
  );

  // Register Installment Payment
  const registerInstallmentPayment = useCallback(
    async (
      installmentId: string,
      amountCents: number,
      paymentDate: string,
      paymentMethod: PaymentMethod,
      notes?: string,
      receiptFile?: { fileName: string; fileType: string; dataUrl: string; description?: string }
    ) => {
      const inst = installments.find((i) => i.id === installmentId);
      if (!inst) {
        showToast('Parcela não encontrada.', 'error');
        return;
      }

      const debt = debts.find((d) => d.id === inst.debtId);
      const now = new Date().toISOString();
      const paymentId = `pay-${Date.now()}`;

      // Create Payment Record
      const newPayment: PaymentRecord = {
        id: paymentId,
        debtId: inst.debtId,
        installmentId: inst.id,
        amountCents,
        paymentDate,
        paymentMethod,
        notes: notes || `Pagamento da Parcela #${inst.installmentNumber}`,
        createdAt: now,
      };

      // Determine installment status
      const totalPaidSoFar = (inst.paidAmountCents || 0) + amountCents;
      const isFull = totalPaidSoFar >= inst.expectedAmountCents;
      const newStatus = isFull ? 'paga' : 'parcialmente_paga';

      const updatedInstallments = installments.map((i) =>
        i.id === installmentId
          ? {
              ...i,
              paidAmountCents: totalPaidSoFar,
              paidDate: paymentDate,
              status: newStatus as Installment['status'],
              notes: notes || i.notes,
              updatedAt: now,
            }
          : i
      );

      // Create History Event
      const historyEvent: HistoryEvent = {
        id: `hist-${Date.now()}`,
        debtId: inst.debtId,
        installmentId: inst.id,
        type: isFull ? 'pagamento_parcela' : 'pagamento_parcial',
        title: isFull ? `Parcela #${inst.installmentNumber} quitada` : `Pagamento parcial Parcela #${inst.installmentNumber}`,
        description: `Valor pago: R$ ${(amountCents / 100).toFixed(2)} via ${paymentMethod}.`,
        amountCents,
        timestamp: now,
      };

      let updatedAttachments = attachments;
      if (receiptFile) {
        const attId = `att-${Date.now()}`;
        const newAtt: Attachment = {
          id: attId,
          debtId: inst.debtId,
          installmentId: inst.id,
          paymentId,
          fileName: receiptFile.fileName,
          fileType: receiptFile.fileType,
          fileSize: Math.round(receiptFile.dataUrl.length * 0.75),
          category: 'comprovante_parcela',
          description: receiptFile.description || `Comprovante da Parcela #${inst.installmentNumber}`,
          createdAt: now,
        };
        await saveAttachmentData(attId, receiptFile.dataUrl);
        updatedAttachments = [newAtt, ...attachments];
      }

      // Check if all installments for this debt are paid
      const remainingForDebt = updatedInstallments.filter(
        (i) => i.debtId === inst.debtId && i.status !== 'paga' && i.status !== 'cancelada'
      );
      let updatedDebts = debts;
      if (remainingForDebt.length === 0 && (!debt || debt.downPaymentPaid)) {
        updatedDebts = debts.map((d) => (d.id === inst.debtId ? { ...d, status: 'quitada' as const, updatedAt: now } : d));
      }

      const updatedPayments = [newPayment, ...payments];
      const updatedHistory = [historyEvent, ...history];

      setDebts(updatedDebts);
      setInstallments(updatedInstallments);
      setPayments(updatedPayments);
      setAttachments(updatedAttachments);
      setHistory(updatedHistory);

      persistState(updatedDebts, updatedInstallments, updatedPayments, updatedAttachments, updatedHistory, adjustmentRules);
      showToast(`Pagamento da parcela #${inst.installmentNumber} registrado com sucesso!`, 'success');
    },
    [installments, debts, payments, attachments, history, adjustmentRules, persistState, showToast]
  );

  // Partial Payment
  const registerPartialPayment = useCallback(
    (
      installmentId: string,
      partialAmountCents: number,
      paymentDate: string,
      paymentMethod: PaymentMethod,
      notes?: string
    ) => {
      registerInstallmentPayment(installmentId, partialAmountCents, paymentDate, paymentMethod, notes);
    },
    [registerInstallmentPayment]
  );

  // Down Payment
  const registerDownPayment = useCallback(
    (debtId: string, paymentDate: string, paymentMethod: PaymentMethod, notes?: string) => {
      const debt = debts.find((d) => d.id === debtId);
      if (!debt) return;

      const now = new Date().toISOString();
      const paymentRecord: PaymentRecord = {
        id: `pay-down-${Date.now()}`,
        debtId,
        amountCents: debt.downPaymentCents,
        paymentDate,
        paymentMethod,
        notes: notes || 'Pagamento da entrada contratual',
        isDownPayment: true,
        createdAt: now,
      };

      const updatedDebts = debts.map((d) =>
        d.id === debtId ? { ...d, downPaymentPaid: true, downPaymentPaidDate: paymentDate, updatedAt: now } : d
      );

      const historyEvent: HistoryEvent = {
        id: `hist-${Date.now()}`,
        debtId,
        type: 'pagamento_entrada',
        title: 'Entrada contratual paga',
        description: `Entrada de R$ ${(debt.downPaymentCents / 100).toFixed(2)} quitada via ${paymentMethod}.`,
        amountCents: debt.downPaymentCents,
        timestamp: now,
      };

      const updatedPayments = [paymentRecord, ...payments];
      const updatedHistory = [historyEvent, ...history];

      setDebts(updatedDebts);
      setPayments(updatedPayments);
      setHistory(updatedHistory);

      persistState(updatedDebts, installments, updatedPayments, attachments, updatedHistory, adjustmentRules);
      showToast('Pagamento da entrada registrado com sucesso!', 'success');
    },
    [debts, installments, payments, attachments, history, adjustmentRules, persistState, showToast]
  );

  // Undo / Delete Payment Record
  const undoPayment = useCallback(
    (paymentId: string) => {
      const payment = payments.find((p) => p.id === paymentId);
      if (!payment) return;

      const now = new Date().toISOString();
      let updatedInstallments = installments;
      let updatedDebts = debts;

      if (payment.isDownPayment) {
        // Revert down payment
        updatedDebts = debts.map((d) =>
          d.id === payment.debtId ? { ...d, downPaymentPaid: false, downPaymentPaidDate: undefined, status: 'em_andamento' as const, updatedAt: now } : d
        );
      } else if (payment.installmentId) {
        // Revert installment
        const inst = installments.find((i) => i.id === payment.installmentId);
        if (inst) {
          const newPaidAmount = Math.max(0, (inst.paidAmountCents || 0) - payment.amountCents);
          let newStatus: Installment['status'] = 'pendente';
          if (newPaidAmount > 0) {
            newStatus = 'parcialmente_paga';
          } else if (isOverdue(inst.dueDate, 'pendente')) {
            newStatus = 'vencida';
          }

          updatedInstallments = installments.map((i) =>
            i.id === inst.id
              ? {
                  ...i,
                  paidAmountCents: newPaidAmount,
                  paidDate: newPaidAmount > 0 ? i.paidDate : undefined,
                  status: newStatus,
                  updatedAt: now,
                }
              : i
          );

          // If debt was marked as quitada, revert to em_andamento
          updatedDebts = debts.map((d) =>
            d.id === payment.debtId && d.status === 'quitada' ? { ...d, status: 'em_andamento' as const, updatedAt: now } : d
          );
        }
      }

      const historyEvent: HistoryEvent = {
        id: `hist-${Date.now()}`,
        debtId: payment.debtId,
        type: 'estorno_pagamento',
        title: 'Pagamento estornado/cancelado',
        description: `Estorno do lançamento de R$ ${(payment.amountCents / 100).toFixed(2)}.`,
        amountCents: payment.amountCents,
        timestamp: now,
      };

      const updatedPayments = payments.filter((p) => p.id !== paymentId);
      const updatedHistory = [historyEvent, ...history];

      setDebts(updatedDebts);
      setInstallments(updatedInstallments);
      setPayments(updatedPayments);
      setHistory(updatedHistory);

      persistState(updatedDebts, updatedInstallments, updatedPayments, attachments, updatedHistory, adjustmentRules);
      showToast('Lançamento de pagamento estornado.', 'info');
    },
    [payments, installments, debts, attachments, history, adjustmentRules, persistState, showToast]
  );

  // Edit Installment
  const editInstallment = useCallback(
    (
      installmentId: string,
      updates: {
        dueDate?: string;
        expectedAmountCents?: number;
        notes?: string;
        penaltyInterestCents?: number;
        discountCents?: number;
        reason?: string;
      }
    ) => {
      const inst = installments.find((i) => i.id === installmentId);
      if (!inst) return;

      const now = new Date().toISOString();
      const updatedInstallments = installments.map((i) => {
        if (i.id !== installmentId) return i;
        const newDueDate = updates.dueDate || i.dueDate;
        let newStatus = i.status;
        if (i.status !== 'paga') {
          newStatus = isOverdue(newDueDate, i.status) ? 'vencida' : 'pendente';
        }

        return {
          ...i,
          dueDate: newDueDate,
          expectedAmountCents: updates.expectedAmountCents !== undefined ? updates.expectedAmountCents : i.expectedAmountCents,
          originalAmountCents: i.originalAmountCents || i.expectedAmountCents,
          penaltyInterestCents: updates.penaltyInterestCents !== undefined ? updates.penaltyInterestCents : i.penaltyInterestCents,
          discountCents: updates.discountCents !== undefined ? updates.discountCents : i.discountCents,
          notes: updates.notes !== undefined ? updates.notes : i.notes,
          status: newStatus,
          updatedAt: now,
        };
      });

      const historyEvent: HistoryEvent = {
        id: `hist-${Date.now()}`,
        debtId: inst.debtId,
        installmentId: inst.id,
        type: 'reajuste_valor',
        title: `Parcela #${inst.installmentNumber} alterada`,
        description: updates.reason || 'Ajuste manual de vencimento/valor da parcela.',
        timestamp: now,
      };

      const updatedHistory = [historyEvent, ...history];
      setInstallments(updatedInstallments);
      setHistory(updatedHistory);

      persistState(debts, updatedInstallments, payments, attachments, updatedHistory, adjustmentRules);
      showToast(`Parcela #${inst.installmentNumber} atualizada.`, 'success');
    },
    [installments, debts, payments, attachments, history, adjustmentRules, persistState, showToast]
  );

  // Add Attachment
  const addAttachment = useCallback(
    async (
      debtId: string,
      fileInfo: {
        fileName: string;
        fileType: string;
        fileSize: number;
        dataUrl: string;
        category: Attachment['category'];
        description?: string;
        installmentId?: string;
      }
    ): Promise<Attachment> => {
      const now = new Date().toISOString();
      const attId = `att-${Date.now()}`;
      const newAtt: Attachment = {
        id: attId,
        debtId,
        installmentId: fileInfo.installmentId,
        fileName: fileInfo.fileName,
        fileType: fileInfo.fileType,
        fileSize: fileInfo.fileSize,
        category: fileInfo.category,
        description: fileInfo.description,
        createdAt: now,
      };

      await saveAttachmentData(attId, fileInfo.dataUrl);

      const updatedAttachments = [newAtt, ...attachments];
      const historyEvent: HistoryEvent = {
        id: `hist-${Date.now()}`,
        debtId,
        installmentId: fileInfo.installmentId,
        type: 'anexo_adicionado',
        title: 'Documento anexado',
        description: `Arquivo "${fileInfo.fileName}" adicionado aos comprovantes.`,
        timestamp: now,
      };
      const updatedHistory = [historyEvent, ...history];

      setAttachments(updatedAttachments);
      setHistory(updatedHistory);

      persistState(debts, installments, payments, updatedAttachments, updatedHistory, adjustmentRules);
      showToast('Documento anexado com sucesso!', 'success');
      return newAtt;
    },
    [attachments, debts, installments, payments, history, adjustmentRules, persistState, showToast]
  );

  // Delete Attachment
  const deleteAttachment = useCallback(
    async (attachmentId: string) => {
      await deleteAttachmentData(attachmentId);
      const updatedAttachments = attachments.filter((a) => a.id !== attachmentId);
      setAttachments(updatedAttachments);
      persistState(debts, installments, payments, updatedAttachments, history, adjustmentRules);
      showToast('Documento removido.', 'info');
    },
    [attachments, debts, installments, payments, history, adjustmentRules, persistState, showToast]
  );

  // Add Adjustment Rule
  const addAdjustmentRule = useCallback(
    (ruleData: Omit<DebtAdjustmentRule, 'id' | 'createdAt'>) => {
      const now = new Date().toISOString();
      const newRule: DebtAdjustmentRule = {
        ...ruleData,
        id: `rule-${Date.now()}`,
        createdAt: now,
      };
      const updatedRules = [newRule, ...adjustmentRules];
      setAdjustmentRules(updatedRules);
      persistState(debts, installments, payments, attachments, history, updatedRules);
      showToast('Regra de reajuste registrada com sucesso!', 'success');
    },
    [adjustmentRules, debts, installments, payments, attachments, history, persistState, showToast]
  );

  // Batch Adjustment to future installments
  const applyBatchAdjustment = useCallback(
    (debtId: string, percentage: number, startFromInstallmentNum: number, reason: string) => {
      const now = new Date().toISOString();
      const factor = 1 + percentage / 100;

      const updatedInstallments = installments.map((i) => {
        if (i.debtId === debtId && i.installmentNumber >= startFromInstallmentNum && i.status !== 'paga') {
          const original = i.originalAmountCents || i.expectedAmountCents;
          const adjusted = Math.round(i.expectedAmountCents * factor);
          return {
            ...i,
            originalAmountCents: original,
            expectedAmountCents: adjusted,
            notes: i.notes ? `${i.notes} | ${reason}` : reason,
            updatedAt: now,
          };
        }
        return i;
      });

      const historyEvent: HistoryEvent = {
        id: `hist-${Date.now()}`,
        debtId,
        type: 'reajuste_valor',
        title: `Reajuste contratual de ${percentage > 0 ? '+' : ''}${percentage.toFixed(2)}%`,
        description: `Aplicado a partir da parcela #${startFromInstallmentNum}. Motivo: ${reason}`,
        timestamp: now,
      };

      const updatedHistory = [historyEvent, ...history];
      setInstallments(updatedInstallments);
      setHistory(updatedHistory);

      persistState(debts, updatedInstallments, payments, attachments, updatedHistory, adjustmentRules);
      showToast(`Reajuste de ${percentage.toFixed(2)}% aplicado às parcelas futuras.`, 'success');
    },
    [installments, debts, payments, attachments, history, adjustmentRules, persistState, showToast]
  );

  // Demo Data Load / Clear
  const loadDemoData = useCallback(() => {
    if (!user) return;
    StorageService.loadDemoData(user.id);
    reloadUserData(user.id);
    showToast('Dados de demonstração carregados com sucesso!', 'success');
  }, [user, reloadUserData, showToast]);

  const clearDemoData = useCallback(() => {
    if (!user) return;
    const currentUserId = user.id;
    const allDebts = StorageService.getDebts();
    const userDemoDebtIds = new Set(allDebts.filter((d) => d.userId === currentUserId && d.isDemo).map((d) => d.id));

    const remainingDebts = allDebts.filter((d) => !(d.userId === currentUserId && d.isDemo));
    const remainingInstallments = StorageService.getInstallments().filter((i) => !userDemoDebtIds.has(i.debtId));
    const remainingPayments = StorageService.getPayments().filter((p) => !userDemoDebtIds.has(p.debtId));
    const remainingAttachments = StorageService.getAttachments().filter((a) => a.debtId ? !userDemoDebtIds.has(a.debtId) : true);
    const remainingHistory = StorageService.getHistory().filter((h) => !userDemoDebtIds.has(h.debtId));
    const remainingRules = StorageService.getAdjustmentRules().filter((r) => !userDemoDebtIds.has(r.debtId));

    StorageService.saveAll(
      remainingDebts,
      remainingInstallments,
      remainingPayments,
      remainingAttachments,
      remainingHistory,
      remainingRules
    );
    reloadUserData(currentUserId);
    showToast('Dados de demonstração removidos.', 'info');
  }, [user, reloadUserData, showToast]);

  // Export / Import
  const clearAllData = useCallback(() => {
    if (!user) return;
    StorageService.cascadeDeleteUserFinancialData(user.id);
    reloadUserData(user.id);
    showToast('Todos os seus registros financeiros foram limpos.', 'info');
  }, [user, reloadUserData, showToast]);

  const exportBackup = useCallback(() => {
    const json = StorageService.exportBackupJson();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `quitai-backup-${getTodayIso()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Backup exportado com sucesso!', 'success');
  }, [showToast]);

  const importBackup = useCallback(
    (jsonStr: string): boolean => {
      const ok = StorageService.importBackupJson(jsonStr);
      if (ok) {
        if (user) {
          reloadUserData(user.id);
        }
        showToast('Backup restaurado com sucesso!', 'success');
        return true;
      }
      showToast('Falha ao restaurar arquivo de backup.', 'error');
      return false;
    },
    [user, reloadUserData, showToast]
  );

  // Getters for individual debt components
  const getDebtSummary = useCallback(
    (debtId: string): DebtFinancialSummary | null => {
      const debt = debts.find((d) => d.id === debtId);
      if (!debt) return null;
      const dInstallments = installments.filter((i) => i.debtId === debtId);
      const dPayments = payments.filter((p) => p.debtId === debtId);
      return calculateDebtSummary(debt, dInstallments, dPayments);
    },
    [debts, installments, payments]
  );

  const getDebtInstallments = useCallback(
    (debtId: string): Installment[] => {
      return installments
        .filter((i) => i.debtId === debtId)
        .sort((a, b) => a.installmentNumber - b.installmentNumber);
    },
    [installments]
  );

  const getDebtPayments = useCallback(
    (debtId: string): PaymentRecord[] => {
      return payments
        .filter((p) => p.debtId === debtId)
        .sort((a, b) => b.paymentDate.localeCompare(a.paymentDate));
    },
    [payments]
  );

  const getDebtAttachments = useCallback(
    (debtId: string): Attachment[] => {
      return attachments.filter((a) => a.debtId === debtId);
    },
    [attachments]
  );

  const getDebtHistory = useCallback(
    (debtId: string): HistoryEvent[] => {
      return history
        .filter((h) => h.debtId === debtId)
        .sort((a, b) => b.timestamp.localeCompare(a.timestamp));
    },
    [history]
  );

  // Global Dashboard Metrics calculation
  const globalMetrics = useMemo(() => {
    return calculateGlobalMetrics(debts, installments, payments);
  }, [debts, installments, payments]);

  return (
    <FinanceContext.Provider
      value={{
        debts,
        installments,
        payments,
        attachments,
        history,
        adjustmentRules,
        incomes,
        expenses,
        investments,
        investmentTransactions,
        userProfile,
        hasDemoData,
        globalMetrics,
        theme,
        toasts,
        toggleTheme,
        showToast,
        removeToast,
        addIncome,
        updateIncome,
        deleteIncome,
        addExpense,
        updateExpense,
        deleteExpense,
        addInvestment,
        updateInvestment,
        deleteInvestment,
        addInvestmentTransaction,
        addGeneralAttachment,
        addDebt,
        updateDebt,
        deleteDebt,
        registerInstallmentPayment,
        registerPartialPayment,
        registerDownPayment,
        undoPayment,
        editInstallment,
        addAttachment,
        deleteAttachment,
        addAdjustmentRule,
        applyBatchAdjustment,
        loadDemoData,
        clearDemoData,
        clearAllData,
        exportBackup,
        importBackup,
        getDebtSummary,
        getDebtInstallments,
        getDebtPayments,
        getDebtAttachments,
        getDebtHistory,
      }}
    >
      {children}
    </FinanceContext.Provider>
  );
};

export const useFinance = () => {
  const context = useContext(FinanceContext);
  if (!context) {
    throw new Error('useFinance must be used within a FinanceProvider');
  }
  return context;
};
