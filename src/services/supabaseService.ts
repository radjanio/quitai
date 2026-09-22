/**
 * QuitaÍ — Supabase Data Sync Service (PostgreSQL + RLS)
 * Project: ybdnhrtetahnvvtbapwm
 */

import { supabase } from '../lib/supabase';
import {
  Debt,
  Installment,
  PaymentRecord,
  Attachment,
  HistoryEvent,
  DebtAdjustmentRule,
  Income,
  Expense,
  Investment,
  InvestmentTransaction,
} from '../types/finance';

export const SupabaseService = {
  /**
   * Fetch all user data protected by RLS
   */
  async fetchUserData(userId: string): Promise<{
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
    isOnline: boolean;
  }> {
    try {
      // 1. Debts
      const { data: debtsData, error: debtsErr } = await supabase
        .from('debts')
        .select('*')
        .eq('user_id', userId);

      if (debtsErr) {
        console.warn('Supabase fetch debts warning:', debtsErr.message);
        return {
          debts: [],
          installments: [],
          payments: [],
          attachments: [],
          history: [],
          adjustmentRules: [],
          incomes: [],
          expenses: [],
          investments: [],
          investmentTransactions: [],
          isOnline: false,
        };
      }

      const debts: Debt[] = (debtsData || []).map((d: any) => ({
        id: d.id,
        userId: d.user_id,
        title: d.title,
        description: d.description,
        category: d.category,
        creditor: d.creditor,
        contractNumber: d.contract_number,
        totalAmountCents: Number(d.total_amount_cents),
        downPaymentCents: Number(d.down_payment_cents),
        downPaymentPaid: Boolean(d.down_payment_paid),
        downPaymentPaidDate: d.down_payment_paid_date,
        financedAmountCents: Number(d.financed_amount_cents),
        installmentCount: Number(d.installment_count),
        defaultInstallmentAmountCents: Number(d.default_installment_amount_cents),
        interestRateAnnual: d.interest_rate_annual ? Number(d.interest_rate_annual) : undefined,
        startDate: d.start_date,
        dueDay: Number(d.due_day),
        paymentMethod: d.payment_method,
        status: d.status,
        isDemo: Boolean(d.is_demo),
        createdAt: d.created_at,
        updatedAt: d.updated_at,
      }));

      // 2. Installments
      const { data: instData } = await supabase
        .from('installments')
        .select('*')
        .eq('user_id', userId);

      const installments: Installment[] = (instData || []).map((i: any) => ({
        id: i.id,
        debtId: i.debt_id,
        installmentNumber: Number(i.installment_number),
        dueDate: i.due_date,
        expectedAmountCents: Number(i.expected_amount_cents),
        paidAmountCents: Number(i.paid_amount_cents),
        paidDate: i.paid_date,
        status: i.status,
        notes: i.notes,
        originalAmountCents: i.original_amount_cents ? Number(i.original_amount_cents) : undefined,
        createdAt: i.created_at,
        updatedAt: i.updated_at,
      }));

      // 3. Payments
      const { data: payData } = await supabase
        .from('payment_records')
        .select('*')
        .eq('user_id', userId);

      const payments: PaymentRecord[] = (payData || []).map((p: any) => ({
        id: p.id,
        debtId: p.debt_id,
        installmentId: p.installment_id,
        amountCents: Number(p.amount_cents),
        paymentDate: p.payment_date,
        paymentMethod: p.payment_method,
        notes: p.notes,
        createdAt: p.created_at,
      }));

      // 4. Attachments
      const { data: attData } = await supabase
        .from('attachments')
        .select('*')
        .eq('user_id', userId);

      const attachments: Attachment[] = (attData || []).map((a: any) => ({
        id: a.id,
        debtId: a.debt_id,
        installmentId: a.installment_id,
        fileName: a.file_name,
        fileType: a.file_type,
        fileSize: Number(a.file_size),
        category: a.category,
        description: a.description,
        dataUrl: a.data_url,
        createdAt: a.created_at,
      }));

      // 5. History
      const { data: histData } = await supabase
        .from('history_events')
        .select('*')
        .eq('user_id', userId);

      const history: HistoryEvent[] = (histData || []).map((h: any) => ({
        id: h.id,
        debtId: h.debt_id,
        installmentId: h.installment_id,
        type: h.type,
        title: h.title,
        description: h.description,
        amountCents: h.amount_cents ? Number(h.amount_cents) : undefined,
        timestamp: h.timestamp,
      }));

      // 6. Adjustment Rules
      const { data: rulesData } = await supabase
        .from('debt_adjustment_rules')
        .select('*')
        .eq('user_id', userId);

      const adjustmentRules: DebtAdjustmentRule[] = (rulesData || []).map((r: any) => ({
        id: r.id,
        debtId: r.debt_id,
        type: r.type || 'outro',
        indexName: r.index_name,
        periodicity: r.periodicity,
        applicationDate: r.application_date,
        notes: r.notes,
        createdAt: r.created_at,
      }));

      // 7. Incomes
      let incomes: Income[] = [];
      try {
        const { data: incData } = await supabase
          .from('incomes')
          .select('*')
          .eq('user_id', userId);
        if (incData) {
          incomes = incData.map((inc: any) => ({
            id: inc.id,
            userId: inc.user_id,
            description: inc.description,
            amountCents: Number(inc.amount_cents),
            category: inc.category,
            flowType: inc.flow_type,
            date: inc.date,
            accountOrOrigin: inc.account_or_origin || 'Conta Principal',
            isRecurring: Boolean(inc.is_recurring),
            recurrenceFrequency: inc.recurrence_frequency,
            notes: inc.notes,
            createdAt: inc.created_at,
            updatedAt: inc.updated_at,
          }));
        }
      } catch {
        // Table might not exist yet
      }

      // 8. Expenses
      let expenses: Expense[] = [];
      try {
        const { data: expData } = await supabase
          .from('expenses')
          .select('*')
          .eq('user_id', userId);
        if (expData) {
          expenses = expData.map((exp: any) => ({
            id: exp.id,
            userId: exp.user_id,
            description: exp.description,
            amountCents: Number(exp.amount_cents),
            category: exp.category,
            date: exp.date,
            paymentMethod: exp.payment_method || 'pix',
            account: exp.account || 'Conta Corrente',
            isFixed: Boolean(exp.is_fixed),
            isRecurring: Boolean(exp.is_recurring),
            recurrenceFrequency: exp.recurrence_frequency,
            linkedDebtPaymentId: exp.linked_debt_payment_id,
            notes: exp.notes,
            createdAt: exp.created_at,
            updatedAt: exp.updated_at,
          }));
        }
      } catch {
        // Table might not exist yet
      }

      // 9. Investments
      let investments: Investment[] = [];
      try {
        const { data: invData } = await supabase
          .from('investments')
          .select('*')
          .eq('user_id', userId);
        if (invData) {
          investments = invData.map((inv: any) => ({
            id: inv.id,
            userId: inv.user_id,
            name: inv.name,
            type: inv.type,
            institution: inv.institution,
            initialAmountCents: Number(inv.initial_amount_cents),
            currentAmountCents: Number(inv.current_amount_cents),
            totalInvestedCents: Number(inv.total_invested_cents),
            totalYieldCents: Number(inv.total_yield_cents),
            applicationDate: inv.application_date,
            notes: inv.notes,
            createdAt: inv.created_at,
            updatedAt: inv.updated_at,
          }));
        }
      } catch {
        // Table might not exist yet
      }

      // 10. Investment Transactions
      let investmentTransactions: InvestmentTransaction[] = [];
      try {
        const { data: txData } = await supabase
          .from('investment_transactions')
          .select('*')
          .eq('user_id', userId);
        if (txData) {
          investmentTransactions = txData.map((tx: any) => ({
            id: tx.id,
            investmentId: tx.investment_id,
            userId: tx.user_id,
            type: tx.type,
            amountCents: Number(tx.amount_cents),
            date: tx.date,
            notes: tx.notes,
            createdAt: tx.created_at,
          }));
        }
      } catch {
        // Table might not exist yet
      }

      return {
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
        isOnline: true,
      };
    } catch (err) {
      console.warn('Supabase fetch error, fallback active:', err);
      return {
        debts: [],
        installments: [],
        payments: [],
        attachments: [],
        history: [],
        adjustmentRules: [],
        incomes: [],
        expenses: [],
        investments: [],
        investmentTransactions: [],
        isOnline: false,
      };
    }
  },

  /**
   * Sync complete state to Supabase respecting RLS
   */
  async syncAll(
    userId: string,
    debts: Debt[],
    installments: Installment[],
    payments: PaymentRecord[],
    attachments: Attachment[],
    history: HistoryEvent[],
    rules: DebtAdjustmentRule[],
    incomes: Income[] = [],
    expenses: Expense[] = [],
    investments: Investment[] = [],
    investmentTransactions: InvestmentTransaction[] = []
  ): Promise<boolean> {
    try {
      // Upsert debts
      if (debts.length > 0) {
        const debtsRows = debts.map((d) => ({
          id: d.id,
          user_id: userId,
          title: d.title,
          description: d.description || null,
          category: d.category,
          creditor: d.creditor,
          contract_number: d.contractNumber || null,
          total_amount_cents: d.totalAmountCents,
          down_payment_cents: d.downPaymentCents,
          down_payment_paid: d.downPaymentPaid,
          down_payment_paid_date: d.downPaymentPaidDate || null,
          financed_amount_cents: d.financedAmountCents,
          installment_count: d.installmentCount,
          default_installment_amount_cents: d.defaultInstallmentAmountCents,
          interest_rate_annual: d.interestRateAnnual || null,
          start_date: d.startDate,
          due_day: d.dueDay,
          payment_method: d.paymentMethod,
          status: d.status,
          is_demo: Boolean(d.isDemo),
          updated_at: new Date().toISOString(),
        }));
        await supabase.from('debts').upsert(debtsRows);
      }

      // Upsert installments
      if (installments.length > 0) {
        const instRows = installments.map((i) => ({
          id: i.id,
          debt_id: i.debtId,
          user_id: userId,
          installment_number: i.installmentNumber,
          due_date: i.dueDate,
          expected_amount_cents: i.expectedAmountCents,
          paid_amount_cents: i.paidAmountCents,
          paid_date: i.paidDate || null,
          status: i.status,
          notes: i.notes || null,
          original_amount_cents: i.originalAmountCents || null,
          updated_at: new Date().toISOString(),
        }));
        await supabase.from('installments').upsert(instRows);
      }

      // Upsert payments
      if (payments.length > 0) {
        const payRows = payments.map((p) => ({
          id: p.id,
          debt_id: p.debtId,
          installment_id: p.installmentId || null,
          user_id: userId,
          amount_cents: p.amountCents,
          payment_date: p.paymentDate,
          payment_method: p.paymentMethod,
          notes: p.notes || null,
        }));
        await supabase.from('payment_records').upsert(payRows);
      }

      // Upsert attachments
      if (attachments.length > 0) {
        const attRows = attachments.map((a) => ({
          id: a.id,
          debt_id: a.debtId || null,
          installment_id: a.installmentId || null,
          user_id: userId,
          file_name: a.fileName,
          file_type: a.fileType,
          file_size: a.fileSize,
          category: a.category,
          description: a.description || null,
          data_url: a.dataUrl || null,
        }));
        await supabase.from('attachments').upsert(attRows);
      }

      // Upsert history
      if (history.length > 0) {
        const histRows = history.map((h) => ({
          id: h.id,
          debt_id: h.debtId,
          installment_id: h.installmentId || null,
          user_id: userId,
          type: h.type,
          title: h.title,
          description: h.description || null,
          amount_cents: h.amountCents || null,
          timestamp: h.timestamp,
        }));
        await supabase.from('history_events').upsert(histRows);
      }

      // Upsert rules
      if (rules.length > 0) {
        const rulesRows = rules.map((r) => ({
          id: r.id,
          debt_id: r.debtId,
          user_id: userId,
          type: r.type,
          index_name: r.indexName || null,
          periodicity: r.periodicity,
          application_date: r.applicationDate || null,
          notes: r.notes || null,
        }));
        await supabase.from('debt_adjustment_rules').upsert(rulesRows);
      }

      // Upsert incomes
      if (incomes.length > 0) {
        const incRows = incomes.map((inc) => ({
          id: inc.id,
          user_id: userId,
          description: inc.description,
          amount_cents: inc.amountCents,
          category: inc.category,
          flow_type: inc.flowType,
          date: inc.date,
          account_or_origin: inc.accountOrOrigin,
          is_recurring: inc.isRecurring,
          recurrence_frequency: inc.recurrenceFrequency || null,
          notes: inc.notes || null,
          updated_at: new Date().toISOString(),
        }));
        await supabase.from('incomes').upsert(incRows);
      }

      // Upsert expenses
      if (expenses.length > 0) {
        const expRows = expenses.map((exp) => ({
          id: exp.id,
          user_id: userId,
          description: exp.description,
          amount_cents: exp.amountCents,
          category: exp.category,
          date: exp.date,
          payment_method: exp.paymentMethod,
          account: exp.account,
          is_fixed: exp.isFixed,
          is_recurring: exp.isRecurring,
          recurrence_frequency: exp.recurrenceFrequency || null,
          linked_debt_payment_id: exp.linkedDebtPaymentId || null,
          notes: exp.notes || null,
          updated_at: new Date().toISOString(),
        }));
        await supabase.from('expenses').upsert(expRows);
      }

      // Upsert investments
      if (investments.length > 0) {
        const invRows = investments.map((inv) => ({
          id: inv.id,
          user_id: userId,
          name: inv.name,
          type: inv.type,
          institution: inv.institution,
          initial_amount_cents: inv.initialAmountCents,
          current_amount_cents: inv.currentAmountCents,
          total_invested_cents: inv.totalInvestedCents,
          total_yield_cents: inv.totalYieldCents,
          application_date: inv.applicationDate,
          notes: inv.notes || null,
          updated_at: new Date().toISOString(),
        }));
        await supabase.from('investments').upsert(invRows);
      }

      // Upsert investment transactions
      if (investmentTransactions.length > 0) {
        const txRows = investmentTransactions.map((tx) => ({
          id: tx.id,
          investment_id: tx.investmentId,
          user_id: userId,
          type: tx.type,
          amount_cents: tx.amountCents,
          date: tx.date,
          notes: tx.notes || null,
        }));
        await supabase.from('investment_transactions').upsert(txRows);
      }

      return true;
    } catch (err) {
      console.warn('Supabase sync warning:', err);
      return false;
    }
  },

  /**
   * Delete debt by ID
   */
  async deleteDebt(debtId: string, userId: string): Promise<boolean> {
    try {
      await supabase
        .from('debts')
        .delete()
        .eq('id', debtId)
        .eq('user_id', userId);
      return true;
    } catch (err) {
      console.warn('Supabase delete debt error:', err);
      return false;
    }
  },

  /**
   * Cascade purge user's remote records
   */
  async purgeUserData(userId: string): Promise<boolean> {
    try {
      await supabase.from('debts').delete().eq('user_id', userId);
      return true;
    } catch (err) {
      console.warn('Supabase purge error:', err);
      return false;
    }
  },
};
