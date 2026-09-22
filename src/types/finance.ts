/**
 * FinanTrack — Gestão de Dívidas
 * Domain Types and Interfaces
 */

export type DebtCategory =
  | 'terreno'
  | 'imovel'
  | 'veiculo'
  | 'emprestimo'
  | 'financiamento'
  | 'compra_parcelada'
  | 'outros';

export type DebtStatus =
  | 'em_andamento'
  | 'quitada'
  | 'suspensa'
  | 'cancelada';

export type InstallmentStatus =
  | 'pendente'
  | 'paga'
  | 'vencida'
  | 'parcialmente_paga'
  | 'cancelada';

export type PaymentMethod =
  | 'pix'
  | 'dinheiro'
  | 'transferencia'
  | 'boleto'
  | 'cartao'
  | 'debito_automatico'
  | 'outro'
  | 'outros';

export type AdjustmentType =
  | 'ipca'
  | 'igpm'
  | 'cdi'
  | 'taxa_fixa'
  | 'multa_mora'
  | 'outro';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

export interface DebtAdjustmentRule {
  id: string;
  debtId: string;
  type: AdjustmentType;
  ratePercentage?: number; // e.g. 5.5 (%)
  indexName?: string; // e.g. "IPCA Acumulado 12 meses"
  periodicity: 'mensal' | 'semestral' | 'anual' | 'pontual';
  applicationDate?: string;
  notes?: string;
  createdAt: string;
}

export interface Debt {
  id: string;
  userId: string;
  title: string;
  description?: string;
  category: DebtCategory;
  creditor: string;
  contractNumber?: string;
  
  // Amounts stored in CENTS for 100% precision
  totalAmountCents: number; // Valor contratado original
  downPaymentCents: number; // Valor da entrada
  downPaymentPaid: boolean;
  downPaymentPaidDate?: string;
  financedAmountCents: number; // totalAmountCents - downPaymentCents
  
  installmentCount: number;
  defaultInstallmentAmountCents: number;
  
  interestRateAnnual?: number;
  monetaryCorrectionIndex?: string;
  
  startDate: string; // YYYY-MM-DD
  dueDay: number; // 1-31
  paymentMethod: PaymentMethod;
  status: DebtStatus;
  
  isDemo?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Installment {
  id: string;
  debtId: string;
  installmentNumber: number;
  dueDate: string; // YYYY-MM-DD
  expectedAmountCents: number; // Valor previsto
  paidAmountCents: number; // Valor efetivamente pago
  paidDate?: string; // YYYY-MM-DD
  status: InstallmentStatus;
  notes?: string;
  
  // Adjustments specific to this installment
  originalAmountCents?: number;
  penaltyInterestCents?: number; // Juros ou encargos adicionados
  discountCents?: number;
  
  createdAt: string;
  updatedAt: string;
}

export interface PaymentRecord {
  id: string;
  debtId: string;
  installmentId?: string;
  amountCents: number;
  paymentDate: string; // YYYY-MM-DD
  paymentMethod: PaymentMethod;
  notes?: string;
  isDownPayment?: boolean;
  createdAt: string;
}

export interface Attachment {
  id: string;
  debtId?: string;
  installmentId?: string;
  paymentId?: string;
  relatedType?: 'debt' | 'installment' | 'income' | 'expense' | 'investment' | 'payment' | 'outro';
  relatedId?: string;
  fileName: string;
  fileType: string;
  fileSize: number; // bytes
  dataUrl?: string; // Base64 or Blob URL for local storage
  description?: string;
  category: 'contrato' | 'comprovante_entrada' | 'comprovante_parcela' | 'comprovante_despesa' | 'comprovante_recebimento' | 'comprovante_investimento' | 'outro';
  createdAt: string;
}

export interface HistoryEvent {
  id: string;
  debtId: string;
  installmentId?: string;
  type:
    | 'criacao'
    | 'pagamento_entrada'
    | 'pagamento_parcela'
    | 'pagamento_parcial'
    | 'estorno_pagamento'
    | 'reajuste_valor'
    | 'alteracao_vencimento'
    | 'anexo_adicionado'
    | 'status_alterado';
  title: string;
  description: string;
  amountCents?: number;
  timestamp: string;
}

export interface DebtFinancialSummary {
  debtId: string;
  totalContractedCents: number; // Original
  downPaymentCents: number;
  downPaymentPaidCents: number;
  totalExpectedCents: number; // Sum of all installment expected amounts + down payment
  totalPaidCents: number; // All payments made (including down payment if paid)
  remainingBalanceCents: number; // Expected remaining balance
  totalInstallments: number;
  paidInstallmentsCount: number;
  pendingInstallmentsCount: number;
  overdueInstallmentsCount: number;
  progressPercentage: number;
  nextDueInstallment?: Installment;
}

// -------------------------------------------------------------
// Entradas (Dinheiro que Entra)
// -------------------------------------------------------------
export type IncomeCategory =
  | 'salario'
  | 'dinheiro_recebido'
  | 'rendimentos'
  | 'renda_extra'
  | 'negocios'
  | 'freelance'
  | 'aluguel'
  | 'reembolso'
  | 'beneficios'
  | 'vendas'
  | 'outros';

export type IncomeFlowType =
  | 'receita'
  | 'rendimento_investimento'
  | 'resgate_capital'
  | 'transferencia'
  | 'transferencia_interna';

export interface Income {
  id: string;
  userId: string;
  description: string;
  amountCents: number;
  category: IncomeCategory | string;
  flowType: IncomeFlowType;
  date: string; // YYYY-MM-DD
  accountOrOrigin: string;
  isRecurring: boolean;
  recurrenceFrequency?: 'mensal' | 'quinzenal' | 'semanal' | 'anual';
  notes?: string;
  attachmentId?: string;
  createdAt: string;
  updatedAt: string;
}

// -------------------------------------------------------------
// Despesas (Dinheiro que Sai)
// -------------------------------------------------------------
export type ExpenseCategory =
  | 'alimentacao'
  | 'transporte'
  | 'moradia'
  | 'energia'
  | 'agua'
  | 'internet'
  | 'compras'
  | 'saude'
  | 'educacao'
  | 'lazer'
  | 'dividas'
  | 'investimentos'
  | 'servicos'
  | 'outros';

export interface Expense {
  id: string;
  userId: string;
  description: string;
  amountCents: number;
  category: ExpenseCategory | string;
  date: string; // YYYY-MM-DD
  paymentMethod: PaymentMethod;
  account: string;
  isFixed: boolean;
  isRecurring: boolean;
  recurrenceFrequency?: 'mensal' | 'quinzenal' | 'semanal' | 'anual';
  linkedDebtPaymentId?: string; // Evita contabilidade duplicada de pagamento de dívida
  notes?: string;
  attachmentId?: string;
  createdAt: string;
  updatedAt: string;
}

// -------------------------------------------------------------
// Investimentos
// -------------------------------------------------------------
export type InvestmentType =
  | 'poupanca'
  | 'renda_fixa'
  | 'cdb'
  | 'tesouro'
  | 'lci_lca'
  | 'fundo'
  | 'acoes'
  | 'previdencia'
  | 'cripto'
  | 'outro'
  | 'outros';

export type InvestmentTransactionType = 'aporte' | 'rendimento' | 'resgate';

export interface InvestmentTransaction {
  id: string;
  investmentId: string;
  userId: string;
  type: InvestmentTransactionType;
  amountCents: number;
  date: string; // YYYY-MM-DD
  notes?: string;
  createdAt: string;
}

export interface Investment {
  id: string;
  userId: string;
  name: string;
  type: InvestmentType;
  institution: string; // e.g. Nubank, XP, Rico, Tesouro
  initialAmountCents: number;
  currentAmountCents: number; // Informado manualmente pelo usuário
  totalInvestedCents: number; // Aportes líquidos acumulados
  totalYieldCents: number; // Rendimentos acumulados
  applicationDate: string; // YYYY-MM-DD
  notes?: string;
  attachmentId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface GlobalDashboardMetrics {
  totalDebtsCount: number;
  totalContractedCents: number;
  totalDownPaymentPaidCents: number;
  totalDownPaymentsPaidCents: number;
  totalInstallmentPaidCents: number;
  totalInstallmentsPaidCents: number;
  totalPaidOverallCents: number;
  totalRemainingBalanceCents: number;
  totalRemainingInstallmentsCount: number;
  pendingInstallmentsCount: number;
  paidInstallmentsCount: number;
  totalOverdueInstallmentsCount: number;
  overdueInstallmentsCount: number;
  totalOverdueAmountCents: number;
  currentMonthForecastCents: number;
  monthDueTotalCents: number;
  nextDueInstallment?: Installment;
  nextUpcomingInstallment?: {
    installment: Installment;
    debt: Debt;
    daysRemaining: number;
  };
}
