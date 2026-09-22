/**
 * Storage Service - Robust Persistence with LocalStorage + IndexedDB for Documents
 */

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
  Income,
  Expense,
  Investment,
  InvestmentTransaction,
} from '../types/finance';
import { generateInstallmentDueDates, getTodayIso, isOverdue, getDaysDifference } from '../utils/dates';

const STORAGE_KEYS = {
  DEBTS: 'finantrack_debts',
  INSTALLMENTS: 'finantrack_installments',
  PAYMENTS: 'finantrack_payments',
  ATTACHMENTS: 'finantrack_attachments',
  HISTORY: 'finantrack_history',
  ADJUSTMENT_RULES: 'finantrack_adjustment_rules',
  INCOMES: 'finantrack_incomes',
  EXPENSES: 'finantrack_expenses',
  INVESTMENTS: 'finantrack_investments',
  INVESTMENT_TRANSACTIONS: 'finantrack_investment_transactions',
  USER_PROFILE: 'finantrack_user_profile',
  HAS_DEMO: 'finantrack_has_demo',
  SETTINGS: 'finantrack_settings',
};

// Default User Profile
export const DEFAULT_USER: UserProfile = {
  id: 'usr_default_01',
  name: 'Investidor FinanTrack',
  email: 'usuario@finantrack.com.br',
  createdAt: '2026-01-01T00:00:00Z',
};

// Helper to get from local storage safely
function getLocalItem<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(key);
    return item ? (JSON.parse(item) as T) : defaultValue;
  } catch (e) {
    console.error(`Error reading ${key} from localStorage`, e);
    return defaultValue;
  }
}

function setLocalItem<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error(`Error writing ${key} to localStorage`, e);
  }
}

// IndexedDB setup for attachments to avoid LocalStorage quota limits
const IDB_NAME = 'FinanTrackDB';
const IDB_VERSION = 1;
const IDB_STORE_ATTACHMENTS = 'attachment_blobs';

function openIndexedDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(IDB_NAME, IDB_VERSION);
    request.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(IDB_STORE_ATTACHMENTS)) {
        db.createObjectStore(IDB_STORE_ATTACHMENTS, { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveAttachmentData(id: string, dataUrl: string): Promise<void> {
  try {
    const db = await openIndexedDB();
    const tx = db.transaction(IDB_STORE_ATTACHMENTS, 'readwrite');
    const store = tx.objectStore(IDB_STORE_ATTACHMENTS);
    store.put({ id, dataUrl });
    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('Could not store in IndexedDB, fallback to memory', err);
  }
}

export async function getAttachmentData(id: string): Promise<string | null> {
  try {
    const db = await openIndexedDB();
    const tx = db.transaction(IDB_STORE_ATTACHMENTS, 'readonly');
    const store = tx.objectStore(IDB_STORE_ATTACHMENTS);
    const req = store.get(id);
    return new Promise((resolve) => {
      req.onsuccess = () => resolve(req.result ? req.result.dataUrl : null);
      req.onerror = () => resolve(null);
    });
  } catch (err) {
    return null;
  }
}

export async function deleteAttachmentData(id: string): Promise<void> {
  try {
    const db = await openIndexedDB();
    const tx = db.transaction(IDB_STORE_ATTACHMENTS, 'readwrite');
    const store = tx.objectStore(IDB_STORE_ATTACHMENTS);
    store.delete(id);
  } catch (err) {
    console.warn('Failed to delete attachment from IndexedDB', err);
  }
}

/**
 * Generates initial demo data as requested by user
 */
export function generateDemoData(targetUserId?: string): {
  debts: Debt[];
  installments: Installment[];
  payments: PaymentRecord[];
  history: HistoryEvent[];
  attachments: Attachment[];
  incomes: Income[];
  expenses: Expense[];
  investments: Investment[];
  investmentTransactions: InvestmentTransaction[];
} {
  const effectiveUserId = targetUserId || DEFAULT_USER.id;
  const today = getTodayIso();
  const debts: Debt[] = [];
  const installments: Installment[] = [];
  const payments: PaymentRecord[] = [];
  const history: HistoryEvent[] = [];
  const attachments: Attachment[] = [];

  // 1. Dívida Exemplo do Prompt: Compra de Terreno
  // Total: R$ 80.000,00 (8.000.000 cents)
  // Entrada: R$ 10.000,00 (1.000.000 cents)
  // Parcelas: 100 de R$ 700,00 (70.000 cents) -> 100 x 700 = 70.000 + 10.000 = 80.000
  // Pagas: 20 parcelas (20 x 700 = 14.000,00)
  // Saldo restante parcelas: 80 x 700 = 56.000,00
  const debt1Id = `demo-debt-terreno-${effectiveUserId.slice(-4)}`;
  const debt1: Debt = {
    id: debt1Id,
    userId: effectiveUserId,
    title: 'Terreno Loteamento Jardim das Palmeiras',
    description: 'Lote 14, Quadra B - 360m² com infraestrutura de água e energia',
    category: 'terreno',
    creditor: 'Imobiliária & Urbanizadora Nova Terra Ltda',
    contractNumber: 'CTR-2024/0982-TER',
    totalAmountCents: 8000000,
    downPaymentCents: 1000000,
    downPaymentPaid: true,
    downPaymentPaidDate: '2024-05-10',
    financedAmountCents: 7000000,
    installmentCount: 100,
    defaultInstallmentAmountCents: 70000,
    interestRateAnnual: 6.0,
    monetaryCorrectionIndex: 'IPCA Anual',
    startDate: '2024-05-10',
    dueDay: 15,
    paymentMethod: 'boleto',
    status: 'em_andamento',
    isDemo: true,
    createdAt: '2024-05-10T10:00:00Z',
    updatedAt: '2026-09-15T14:30:00Z',
  };
  debts.push(debt1);

  // Generate 100 installments starting from 2024-06-15
  const dueDates1 = generateInstallmentDueDates('2024-06-15', 15, 100);
  for (let i = 0; i < 100; i++) {
    const num = i + 1;
    const dueDate = dueDates1[i];
    const isPaid = num <= 20; // 20 pagas
    const installmentId = `inst-d1-${String(num).padStart(3, '0')}`;
    
    // Status calculation
    let status: Installment['status'] = 'pendente';
    if (isPaid) {
      status = 'paga';
    } else if (isOverdue(dueDate, 'pendente')) {
      status = 'vencida';
    }

    const inst: Installment = {
      id: installmentId,
      debtId: debt1Id,
      installmentNumber: num,
      dueDate,
      expectedAmountCents: 70000,
      paidAmountCents: isPaid ? 70000 : 0,
      paidDate: isPaid ? dueDate : undefined,
      status,
      notes: isPaid ? 'Pago via boleto bancário' : undefined,
      createdAt: '2024-05-10T10:00:00Z',
      updatedAt: isPaid ? `${dueDate}T14:00:00Z` : '2024-05-10T10:00:00Z',
    };
    installments.push(inst);

    if (isPaid) {
      payments.push({
        id: `pay-d1-${num}`,
        debtId: debt1Id,
        installmentId: inst.id,
        amountCents: 70000,
        paymentDate: dueDate,
        paymentMethod: 'boleto',
        notes: `Pagamento da Parcela #${num}/100`,
        createdAt: `${dueDate}T14:00:00Z`,
      });
    }
  }

  // Down payment record for debt 1
  payments.push({
    id: 'pay-down-d1',
    debtId: debt1Id,
    amountCents: 1000000,
    paymentDate: '2024-05-10',
    paymentMethod: 'transferencia',
    notes: 'Entrada contratual de R$ 10.000,00 confirmada em cartório',
    isDownPayment: true,
    createdAt: '2024-05-10T11:00:00Z',
  });

  // History for debt 1
  history.push({
    id: 'hist-d1-1',
    debtId: debt1Id,
    type: 'criacao',
    title: 'Dívida cadastrada',
    description: 'Contratação de Terreno (100 parcelas de R$ 700,00 com entrada de R$ 10.000,00)',
    amountCents: 8000000,
    timestamp: '2024-05-10T10:00:00Z',
  });
  history.push({
    id: 'hist-d1-2',
    debtId: debt1Id,
    type: 'pagamento_entrada',
    title: 'Entrada quitada',
    description: 'Pagamento da entrada de R$ 10.000,00 registrado com sucesso',
    amountCents: 1000000,
    timestamp: '2024-05-10T11:00:00Z',
  });
  history.push({
    id: 'hist-d1-3',
    debtId: debt1Id,
    type: 'pagamento_parcela',
    title: 'Parcela #20 quitada',
    description: 'Último pagamento realizado de R$ 700,00',
    amountCents: 70000,
    timestamp: '2026-01-15T15:20:00Z',
  });

  // Attachment for debt 1
  attachments.push({
    id: 'att-d1-contrato',
    debtId: debt1Id,
    fileName: 'Contrato_Compra_Venda_Lote_14.pdf',
    fileType: 'application/pdf',
    fileSize: 245000,
    category: 'contrato',
    description: 'Contrato assinado em cartório com reconhecimento de firma',
    createdAt: '2024-05-10T10:30:00Z',
  });

  // 2. Dívida Exemplo 2: Financiamento de Veículo
  // Total: R$ 68.000,00, Entrada R$ 20.000,00, 48 parcelas de R$ 1.150,00 (Total previsto R$ 75.200 com encargos)
  const debt2Id = `demo-debt-veiculo-${effectiveUserId.slice(-4)}`;
  const debt2: Debt = {
    id: debt2Id,
    userId: effectiveUserId,
    title: 'Financiamento Toyota Corolla 2023',
    description: 'Veículo Sedan 2.0 Flex XEi, placa ABC-4E29',
    category: 'veiculo',
    creditor: 'Banco Santander Financiamentos',
    contractNumber: 'SF-994302-23',
    totalAmountCents: 6800000,
    downPaymentCents: 2000000,
    downPaymentPaid: true,
    downPaymentPaidDate: '2025-02-05',
    financedAmountCents: 4800000,
    installmentCount: 48,
    defaultInstallmentAmountCents: 115000,
    interestRateAnnual: 14.5,
    startDate: '2025-02-05',
    dueDay: 10,
    paymentMethod: 'debito_automatico',
    status: 'em_andamento',
    isDemo: true,
    createdAt: '2025-02-05T09:00:00Z',
    updatedAt: '2026-09-10T10:00:00Z',
  };
  debts.push(debt2);

  const dueDates2 = generateInstallmentDueDates('2025-03-10', 10, 48);
  for (let i = 0; i < 48; i++) {
    const num = i + 1;
    const dueDate = dueDates2[i];
    const isPaid = num <= 18; // 18 pagas
    const installmentId = `inst-d2-${String(num).padStart(3, '0')}`;
    
    let status: Installment['status'] = 'pendente';
    if (isPaid) {
      status = 'paga';
    } else if (isOverdue(dueDate, 'pendente')) {
      status = 'vencida';
    }

    const inst: Installment = {
      id: installmentId,
      debtId: debt2Id,
      installmentNumber: num,
      dueDate,
      expectedAmountCents: 115000,
      paidAmountCents: isPaid ? 115000 : 0,
      paidDate: isPaid ? dueDate : undefined,
      status,
      notes: isPaid ? 'Débito automático em conta corrente' : undefined,
      createdAt: '2025-02-05T09:00:00Z',
      updatedAt: isPaid ? `${dueDate}T08:00:00Z` : '2025-02-05T09:00:00Z',
    };
    installments.push(inst);

    if (isPaid) {
      payments.push({
        id: `pay-d2-${num}`,
        debtId: debt2Id,
        installmentId: inst.id,
        amountCents: 115000,
        paymentDate: dueDate,
        paymentMethod: 'debito_automatico',
        notes: `Débito da Parcela #${num}/48`,
        createdAt: `${dueDate}T08:00:00Z`,
      });
    }
  }

  // 3. Dívida Exemplo 3: Empréstimo Reforma Residencial (sem entrada)
  // Total: R$ 24.000,00, 24 parcelas de R$ 1.120,00
  const debt3Id = `demo-debt-reforma-${effectiveUserId.slice(-4)}`;
  const debt3: Debt = {
    id: debt3Id,
    userId: effectiveUserId,
    title: 'Empréstimo Reforma do Apartamento',
    description: 'Troca de piso, pintura e marcenaria da cozinha planejada',
    category: 'emprestimo',
    creditor: 'Caixa Econômica Federal',
    contractNumber: 'CEF-837190-25',
    totalAmountCents: 2400000,
    downPaymentCents: 0,
    downPaymentPaid: false,
    financedAmountCents: 2400000,
    installmentCount: 24,
    defaultInstallmentAmountCents: 112000,
    interestRateAnnual: 11.8,
    startDate: '2025-09-01',
    dueDay: 25,
    paymentMethod: 'pix',
    status: 'em_andamento',
    isDemo: true,
    createdAt: '2025-09-01T14:00:00Z',
    updatedAt: '2026-08-25T11:00:00Z',
  };
  debts.push(debt3);

  const dueDates3 = generateInstallmentDueDates('2025-10-25', 25, 24);
  for (let i = 0; i < 24; i++) {
    const num = i + 1;
    const dueDate = dueDates3[i];
    const isPaid = num <= 11;
    const installmentId = `inst-d3-${String(num).padStart(3, '0')}`;
    
    let status: Installment['status'] = 'pendente';
    if (isPaid) {
      status = 'paga';
    } else if (isOverdue(dueDate, 'pendente')) {
      status = 'vencida';
    }

    const inst: Installment = {
      id: installmentId,
      debtId: debt3Id,
      installmentNumber: num,
      dueDate,
      expectedAmountCents: 112000,
      paidAmountCents: isPaid ? 112000 : 0,
      paidDate: isPaid ? dueDate : undefined,
      status,
      notes: isPaid ? 'Transferência PIX' : undefined,
      createdAt: '2025-09-01T14:00:00Z',
      updatedAt: isPaid ? `${dueDate}T10:00:00Z` : '2025-09-01T14:00:00Z',
    };
    installments.push(inst);

    if (isPaid) {
      payments.push({
        id: `pay-d3-${num}`,
        debtId: debt3Id,
        installmentId: inst.id,
        amountCents: 112000,
        paymentDate: dueDate,
        paymentMethod: 'pix',
        notes: `PIX da Parcela #${num}/24`,
        createdAt: `${dueDate}T10:00:00Z`,
      });
    }
  }

  // 4. Demo Incomes
  const incomes: Income[] = [
    {
      id: 'inc-demo-01',
      userId: effectiveUserId,
      description: 'Salário Mensal CLT',
      amountCents: 520000,
      category: 'salario',
      flowType: 'receita',
      date: '2026-09-05',
      accountOrOrigin: 'Conta Salário Itaú',
      isRecurring: true,
      recurrenceFrequency: 'mensal',
      notes: 'Crédito mensal em conta',
      createdAt: '2026-09-05T08:00:00Z',
      updatedAt: '2026-09-05T08:00:00Z',
    },
    {
      id: 'inc-demo-02',
      userId: effectiveUserId,
      description: 'Projeto Freelance Design UI/UX',
      amountCents: 145000,
      category: 'freelance',
      flowType: 'receita',
      date: '2026-09-12',
      accountOrOrigin: 'Nubank PJ',
      isRecurring: false,
      notes: 'Entrega de telas para cliente',
      createdAt: '2026-09-12T14:30:00Z',
      updatedAt: '2026-09-12T14:30:00Z',
    },
    {
      id: 'inc-demo-03',
      userId: effectiveUserId,
      description: 'Rendimento Tesouro Selic 2029',
      amountCents: 18500,
      category: 'rendimentos',
      flowType: 'rendimento_investimento',
      date: '2026-09-15',
      accountOrOrigin: 'Corretora XP',
      isRecurring: true,
      recurrenceFrequency: 'mensal',
      notes: 'Rendimento mensal acumulado',
      createdAt: '2026-09-15T10:00:00Z',
      updatedAt: '2026-09-15T10:00:00Z',
    },
  ];

  // 5. Demo Expenses
  const expenses: Expense[] = [
    {
      id: 'exp-demo-01',
      userId: effectiveUserId,
      description: 'Supermercado e Feira Mensal',
      amountCents: 98000,
      category: 'alimentacao',
      date: '2026-09-06',
      paymentMethod: 'cartao',
      account: 'Cartão Nubank',
      isFixed: false,
      isRecurring: true,
      recurrenceFrequency: 'mensal',
      notes: 'Compras do mês',
      createdAt: '2026-09-06T18:00:00Z',
      updatedAt: '2026-09-06T18:00:00Z',
    },
    {
      id: 'exp-demo-02',
      userId: effectiveUserId,
      description: 'Conta de Energia Elétrica (Enel)',
      amountCents: 24550,
      category: 'energia',
      date: '2026-09-10',
      paymentMethod: 'pix',
      account: 'Itaú',
      isFixed: true,
      isRecurring: true,
      recurrenceFrequency: 'mensal',
      createdAt: '2026-09-10T09:00:00Z',
      updatedAt: '2026-09-10T09:00:00Z',
    },
    {
      id: 'exp-demo-03',
      userId: effectiveUserId,
      description: 'Internet Fibra 500MB',
      amountCents: 11990,
      category: 'internet',
      date: '2026-09-14',
      paymentMethod: 'debito_automatico',
      account: 'Itaú',
      isFixed: true,
      isRecurring: true,
      recurrenceFrequency: 'mensal',
      createdAt: '2026-09-14T08:00:00Z',
      updatedAt: '2026-09-14T08:00:00Z',
    },
    {
      id: 'exp-demo-04',
      userId: effectiveUserId,
      description: 'Combustível do Carro',
      amountCents: 28000,
      category: 'transporte',
      date: '2026-09-18',
      paymentMethod: 'cartao',
      account: 'Cartão Nubank',
      isFixed: false,
      isRecurring: false,
      createdAt: '2026-09-18T16:00:00Z',
      updatedAt: '2026-09-18T16:00:00Z',
    },
  ];

  // 6. Demo Investments
  const investments: Investment[] = [
    {
      id: 'inv-demo-01',
      userId: effectiveUserId,
      name: 'Tesouro Selic 2029',
      type: 'tesouro',
      institution: 'Tesouro Direto / XP',
      initialAmountCents: 1500000,
      currentAmountCents: 1642000,
      totalInvestedCents: 1500000,
      totalYieldCents: 142000,
      applicationDate: '2025-01-15',
      notes: 'Reserva de emergência com liquidez diária',
      createdAt: '2025-01-15T10:00:00Z',
      updatedAt: '2026-09-15T10:00:00Z',
    },
    {
      id: 'inv-demo-02',
      userId: effectiveUserId,
      name: 'CDB Liquidez 100% CDI',
      type: 'cdb',
      institution: 'Nubank',
      initialAmountCents: 800000,
      currentAmountCents: 875000,
      totalInvestedCents: 800000,
      totalYieldCents: 75000,
      applicationDate: '2025-03-10',
      notes: 'Fundo para manutenção do veículo',
      createdAt: '2025-03-10T10:00:00Z',
      updatedAt: '2026-09-10T10:00:00Z',
    },
    {
      id: 'inv-demo-03',
      userId: effectiveUserId,
      name: 'Fundo Imobiliário MXRF11',
      type: 'fundo',
      institution: 'XP Investimentos',
      initialAmountCents: 500000,
      currentAmountCents: 528000,
      totalInvestedCents: 500000,
      totalYieldCents: 28000,
      applicationDate: '2025-06-20',
      notes: 'Renda mensal de dividendos',
      createdAt: '2025-06-20T10:00:00Z',
      updatedAt: '2026-09-12T10:00:00Z',
    },
  ];

  const investmentTransactions: InvestmentTransaction[] = [
    {
      id: 'tx-demo-01',
      investmentId: 'inv-demo-01',
      userId: effectiveUserId,
      type: 'aporte',
      amountCents: 1500000,
      date: '2025-01-15',
      notes: 'Aporte inicial de constituição',
      createdAt: '2025-01-15T10:00:00Z',
    },
    {
      id: 'tx-demo-02',
      investmentId: 'inv-demo-02',
      userId: effectiveUserId,
      type: 'aporte',
      amountCents: 800000,
      date: '2025-03-10',
      notes: 'Aporte inicial',
      createdAt: '2025-03-10T10:00:00Z',
    },
  ];

  return {
    debts,
    installments,
    payments,
    history,
    attachments,
    incomes,
    expenses,
    investments,
    investmentTransactions,
  };
}

/**
 * Calculations engine for Debt summary
 */
export function calculateDebtSummary(
  debt: Debt,
  debtInstallments: Installment[],
  debtPayments: PaymentRecord[]
): DebtFinancialSummary {
  const downPaymentPaidCents = debt.downPaymentPaid ? debt.downPaymentCents : 0;
  
  // Total expected from installments
  const sumExpectedInstallments = debtInstallments.reduce(
    (sum, inst) => sum + (inst.status !== 'cancelada' ? inst.expectedAmountCents : 0),
    0
  );
  const totalExpectedCents = sumExpectedInstallments + debt.downPaymentCents;

  // Total paid from records
  const totalPaidCents = debtPayments.reduce((sum, p) => sum + p.amountCents, 0);

  // Remaining balance = sum of unpaid portions of active installments + unpaid downPayment
  const unpaidInstallmentsCents = debtInstallments.reduce((sum, inst) => {
    if (inst.status === 'cancelada') return sum;
    const remainingForInst = Math.max(0, inst.expectedAmountCents - (inst.paidAmountCents || 0));
    return sum + remainingForInst;
  }, 0);
  const unpaidDownPaymentCents = debt.downPaymentPaid ? 0 : debt.downPaymentCents;
  const remainingBalanceCents = unpaidInstallmentsCents + unpaidDownPaymentCents;

  // Counts
  const totalInstallments = debtInstallments.length;
  const paidInstallmentsCount = debtInstallments.filter((i) => i.status === 'paga').length;
  const overdueInstallmentsCount = debtInstallments.filter(
    (i) => i.status === 'vencida' || isOverdue(i.dueDate, i.status)
  ).length;
  const pendingInstallmentsCount = debtInstallments.filter(
    (i) => i.status === 'pendente' || i.status === 'parcialmente_paga'
  ).length;

  // Progress percentage based on amount paid vs total expected
  const progressPercentage =
    totalExpectedCents > 0
      ? Math.min(100, Math.max(0, (totalPaidCents / totalExpectedCents) * 100))
      : 0;

  // Find next due installment
  const sortedPending = debtInstallments
    .filter((i) => i.status === 'pendente' || i.status === 'vencida' || i.status === 'parcialmente_paga')
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  const nextDueInstallment = sortedPending[0];

  return {
    debtId: debt.id,
    totalContractedCents: debt.totalAmountCents,
    downPaymentCents: debt.downPaymentCents,
    downPaymentPaidCents,
    totalExpectedCents,
    totalPaidCents,
    remainingBalanceCents,
    totalInstallments,
    paidInstallmentsCount,
    pendingInstallmentsCount,
    overdueInstallmentsCount,
    progressPercentage,
    nextDueInstallment,
  };
}

/**
 * Global Dashboard calculations
 */
export function calculateGlobalMetrics(
  debts: Debt[],
  installments: Installment[],
  payments: PaymentRecord[]
): GlobalDashboardMetrics {
  const activeDebts = debts.filter((d) => d.status !== 'cancelada');

  let totalContractedCents = 0;
  let totalDownPaymentPaidCents = 0;
  let totalPaidOverallCents = 0;
  let totalRemainingBalanceCents = 0;
  let totalRemainingInstallmentsCount = 0;
  let totalOverdueInstallmentsCount = 0;
  let totalOverdueAmountCents = 0;

  // Current month forecast
  const today = getTodayIso();
  const [currentYear, currentMonth] = today.split('-');
  let currentMonthForecastCents = 0;

  let nextUpcomingInstallment: Installment | undefined = undefined;
  let nextUpcomingDebt: Debt | undefined = undefined;
  let nextUpcomingDays: number | undefined = undefined;
  let minDaysDiff = Infinity;

  // Sum payments
  totalPaidOverallCents = payments.reduce((sum, p) => sum + p.amountCents, 0);

  const installmentPaidTotal = payments
    .filter((p) => !p.isDownPayment)
    .reduce((sum, p) => sum + p.amountCents, 0);

  activeDebts.forEach((debt) => {
    totalContractedCents += debt.totalAmountCents;
    if (debt.downPaymentPaid) {
      totalDownPaymentPaidCents += debt.downPaymentCents;
    } else {
      totalRemainingBalanceCents += debt.downPaymentCents;
    }

    const dInstallments = installments.filter((i) => i.debtId === debt.id && i.status !== 'cancelada');

    dInstallments.forEach((inst) => {
      const remainingForInst = Math.max(0, inst.expectedAmountCents - (inst.paidAmountCents || 0));
      if (inst.status !== 'paga') {
        totalRemainingBalanceCents += remainingForInst;
        totalRemainingInstallmentsCount += 1;

        const isInstOverdue = isOverdue(inst.dueDate, inst.status);
        if (isInstOverdue) {
          totalOverdueInstallmentsCount += 1;
          totalOverdueAmountCents += remainingForInst;
        }

        // Current month forecast check
        const [instY, instM] = inst.dueDate.split('-');
        if (instY === currentYear && instM === currentMonth) {
          currentMonthForecastCents += inst.expectedAmountCents;
        }

        // Check for next upcoming
        const diffDays = getDaysDifference(inst.dueDate);
        if (diffDays >= 0 && diffDays < minDaysDiff) {
          minDaysDiff = diffDays;
          nextUpcomingInstallment = inst;
          nextUpcomingDebt = debt;
          nextUpcomingDays = diffDays;
        }
      }
    });
  });

  // Calculate overall paid installments count
  const paidInstallmentsCount = installments.filter((i) => i.status === 'paga').length;

  return {
    totalDebtsCount: activeDebts.length,
    totalContractedCents,
    totalDownPaymentPaidCents,
    totalDownPaymentsPaidCents: totalDownPaymentPaidCents,
    totalInstallmentPaidCents: installmentPaidTotal,
    totalInstallmentsPaidCents: installmentPaidTotal,
    totalPaidOverallCents,
    totalRemainingBalanceCents,
    totalRemainingInstallmentsCount,
    pendingInstallmentsCount: totalRemainingInstallmentsCount,
    paidInstallmentsCount,
    totalOverdueInstallmentsCount,
    overdueInstallmentsCount: totalOverdueInstallmentsCount,
    totalOverdueAmountCents,
    currentMonthForecastCents,
    monthDueTotalCents: currentMonthForecastCents,
    nextDueInstallment: nextUpcomingInstallment,
    nextUpcomingInstallment:
      nextUpcomingInstallment && nextUpcomingDebt && nextUpcomingDays !== undefined
        ? {
            installment: nextUpcomingInstallment,
            debt: nextUpcomingDebt,
            daysRemaining: nextUpcomingDays,
          }
        : undefined,
  };
}

export const StorageService = {
  // Read
  getDebts(): Debt[] {
    return getLocalItem<Debt[]>(STORAGE_KEYS.DEBTS, []);
  },
  getInstallments(): Installment[] {
    return getLocalItem<Installment[]>(STORAGE_KEYS.INSTALLMENTS, []);
  },
  getPayments(): PaymentRecord[] {
    return getLocalItem<PaymentRecord[]>(STORAGE_KEYS.PAYMENTS, []);
  },
  getAttachments(): Attachment[] {
    return getLocalItem<Attachment[]>(STORAGE_KEYS.ATTACHMENTS, []);
  },
  getHistory(): HistoryEvent[] {
    return getLocalItem<HistoryEvent[]>(STORAGE_KEYS.HISTORY, []);
  },
  getAdjustmentRules(): DebtAdjustmentRule[] {
    return getLocalItem<DebtAdjustmentRule[]>(STORAGE_KEYS.ADJUSTMENT_RULES, []);
  },
  getIncomes(): Income[] {
    return getLocalItem<Income[]>(STORAGE_KEYS.INCOMES, []);
  },
  getExpenses(): Expense[] {
    return getLocalItem<Expense[]>(STORAGE_KEYS.EXPENSES, []);
  },
  getInvestments(): Investment[] {
    return getLocalItem<Investment[]>(STORAGE_KEYS.INVESTMENTS, []);
  },
  getInvestmentTransactions(): InvestmentTransaction[] {
    return getLocalItem<InvestmentTransaction[]>(STORAGE_KEYS.INVESTMENT_TRANSACTIONS, []);
  },
  getUserProfile(): UserProfile {
    return getLocalItem<UserProfile>(STORAGE_KEYS.USER_PROFILE, DEFAULT_USER);
  },
  hasDemoData(): boolean {
    return getLocalItem<boolean>(STORAGE_KEYS.HAS_DEMO, false);
  },

  // Save full state
  saveAll(
    debts: Debt[],
    installments: Installment[],
    payments: PaymentRecord[],
    attachments: Attachment[],
    history: HistoryEvent[],
    rules: DebtAdjustmentRule[],
    incomes?: Income[],
    expenses?: Expense[],
    investments?: Investment[],
    investmentTransactions?: InvestmentTransaction[]
  ) {
    setLocalItem(STORAGE_KEYS.DEBTS, debts);
    setLocalItem(STORAGE_KEYS.INSTALLMENTS, installments);
    setLocalItem(STORAGE_KEYS.PAYMENTS, payments);
    setLocalItem(STORAGE_KEYS.ATTACHMENTS, attachments);
    setLocalItem(STORAGE_KEYS.HISTORY, history);
    setLocalItem(STORAGE_KEYS.ADJUSTMENT_RULES, rules);
    setLocalItem(STORAGE_KEYS.INCOMES, incomes !== undefined ? incomes : StorageService.getIncomes());
    setLocalItem(STORAGE_KEYS.EXPENSES, expenses !== undefined ? expenses : StorageService.getExpenses());
    setLocalItem(STORAGE_KEYS.INVESTMENTS, investments !== undefined ? investments : StorageService.getInvestments());
    setLocalItem(
      STORAGE_KEYS.INVESTMENT_TRANSACTIONS,
      investmentTransactions !== undefined ? investmentTransactions : StorageService.getInvestmentTransactions()
    );
  },

  // Demo data loaders
  loadDemoData(targetUserId?: string): void {
    const demo = generateDemoData(targetUserId);
    const existingDebts = this.getDebts().filter((d) => !d.isDemo);
    const existingInstallments = this.getInstallments().filter((i) => !i.id.startsWith('inst-d'));
    const existingPayments = this.getPayments().filter((p) => !p.id.startsWith('pay-d'));
    const existingHistory = this.getHistory().filter((h) => !h.id.startsWith('hist-d'));
    const existingAttachments = this.getAttachments().filter((a) => !a.id.startsWith('att-d'));
    const existingIncomes = this.getIncomes().filter((inc) => !inc.id.startsWith('inc-demo'));
    const existingExpenses = this.getExpenses().filter((exp) => !exp.id.startsWith('exp-demo'));
    const existingInvestments = this.getInvestments().filter((inv) => !inv.id.startsWith('inv-demo'));
    const existingTxs = this.getInvestmentTransactions().filter((tx) => !tx.id.startsWith('tx-demo'));

    const combinedDebts = [...demo.debts, ...existingDebts];
    const combinedInstallments = [...demo.installments, ...existingInstallments];
    const combinedPayments = [...demo.payments, ...existingPayments];
    const combinedHistory = [...demo.history, ...existingHistory];
    const combinedAttachments = [...demo.attachments, ...existingAttachments];
    const combinedIncomes = [...demo.incomes, ...existingIncomes];
    const combinedExpenses = [...demo.expenses, ...existingExpenses];
    const combinedInvestments = [...demo.investments, ...existingInvestments];
    const combinedTxs = [...demo.investmentTransactions, ...existingTxs];

    this.saveAll(
      combinedDebts,
      combinedInstallments,
      combinedPayments,
      combinedAttachments,
      combinedHistory,
      this.getAdjustmentRules(),
      combinedIncomes,
      combinedExpenses,
      combinedInvestments,
      combinedTxs
    );
    setLocalItem(STORAGE_KEYS.HAS_DEMO, true);
  },

  clearDemoData(): void {
    const realDebts = this.getDebts().filter((d) => !d.isDemo);
    const demoDebtIds = new Set(this.getDebts().filter((d) => d.isDemo).map((d) => d.id));
    
    const realInstallments = this.getInstallments().filter((i) => !demoDebtIds.has(i.debtId));
    const realPayments = this.getPayments().filter((p) => !demoDebtIds.has(p.debtId));
    const realHistory = this.getHistory().filter((h) => !demoDebtIds.has(h.debtId));
    const realAttachments = this.getAttachments().filter((a) => a.debtId ? !demoDebtIds.has(a.debtId) : true);
    const realIncomes = this.getIncomes().filter((inc) => !inc.id.startsWith('inc-demo'));
    const realExpenses = this.getExpenses().filter((exp) => !exp.id.startsWith('exp-demo'));
    const realInvestments = this.getInvestments().filter((inv) => !inv.id.startsWith('inv-demo'));
    const realTxs = this.getInvestmentTransactions().filter((tx) => !tx.id.startsWith('tx-demo'));

    this.saveAll(
      realDebts,
      realInstallments,
      realPayments,
      realAttachments,
      realHistory,
      this.getAdjustmentRules(),
      realIncomes,
      realExpenses,
      realInvestments,
      realTxs
    );
    setLocalItem(STORAGE_KEYS.HAS_DEMO, false);
  },

  // Purge all financial records belonging to a user (account deletion or reset)
  cascadeDeleteUserFinancialData(userId: string): void {
    const allDebts = this.getDebts();
    const userDebtIds = new Set(allDebts.filter((d) => d.userId === userId).map((d) => d.id));

    const remainingDebts = allDebts.filter((d) => d.userId !== userId);
    const remainingInstallments = this.getInstallments().filter((i) => !userDebtIds.has(i.debtId));
    const remainingPayments = this.getPayments().filter((p) => !userDebtIds.has(p.debtId));
    const remainingAttachments = this.getAttachments().filter((a) => a.debtId ? !userDebtIds.has(a.debtId) : true);
    const remainingHistory = this.getHistory().filter((h) => !userDebtIds.has(h.debtId));
    const remainingRules = this.getAdjustmentRules().filter((r) => !userDebtIds.has(r.debtId));
    const remainingIncomes = this.getIncomes().filter((inc) => inc.userId !== userId);
    const remainingExpenses = this.getExpenses().filter((exp) => exp.userId !== userId);
    const remainingInvestments = this.getInvestments().filter((inv) => inv.userId !== userId);
    const remainingTxs = this.getInvestmentTransactions().filter((tx) => tx.userId !== userId);

    this.saveAll(
      remainingDebts,
      remainingInstallments,
      remainingPayments,
      remainingAttachments,
      remainingHistory,
      remainingRules,
      remainingIncomes,
      remainingExpenses,
      remainingInvestments,
      remainingTxs
    );
  },

  clearAll(): void {
    this.saveAll([], [], [], [], [], [], [], [], [], []);
    setLocalItem(STORAGE_KEYS.HAS_DEMO, false);
  },

  // Export full JSON backup
  exportBackupJson(): string {
    const backup = {
      version: '2.0',
      exportedAt: new Date().toISOString(),
      user: this.getUserProfile(),
      debts: this.getDebts(),
      installments: this.getInstallments(),
      payments: this.getPayments(),
      attachments: this.getAttachments(),
      history: this.getHistory(),
      adjustmentRules: this.getAdjustmentRules(),
      incomes: this.getIncomes(),
      expenses: this.getExpenses(),
      investments: this.getInvestments(),
      investmentTransactions: this.getInvestmentTransactions(),
    };
    return JSON.stringify(backup, null, 2);
  },

  // Import full JSON backup
  importBackupJson(jsonString: string): boolean {
    try {
      const parsed = JSON.parse(jsonString);
      if (!parsed.debts || !Array.isArray(parsed.debts)) {
        throw new Error('Arquivo de backup inválido: lista de dívidas não encontrada.');
      }
      setLocalItem(STORAGE_KEYS.DEBTS, parsed.debts || []);
      setLocalItem(STORAGE_KEYS.INSTALLMENTS, parsed.installments || []);
      setLocalItem(STORAGE_KEYS.PAYMENTS, parsed.payments || []);
      setLocalItem(STORAGE_KEYS.ATTACHMENTS, parsed.attachments || []);
      setLocalItem(STORAGE_KEYS.HISTORY, parsed.history || []);
      setLocalItem(STORAGE_KEYS.ADJUSTMENT_RULES, parsed.adjustmentRules || []);
      setLocalItem(STORAGE_KEYS.INCOMES, parsed.incomes || []);
      setLocalItem(STORAGE_KEYS.EXPENSES, parsed.expenses || []);
      setLocalItem(STORAGE_KEYS.INVESTMENTS, parsed.investments || []);
      setLocalItem(STORAGE_KEYS.INVESTMENT_TRANSACTIONS, parsed.investmentTransactions || []);
      if (parsed.user) {
        setLocalItem(STORAGE_KEYS.USER_PROFILE, parsed.user);
      }
      return true;
    } catch (e) {
      console.error('Error importing backup JSON:', e);
      return false;
    }
  },
};
