/**
 * QuitaÍ — Sistema de Planos, Assinaturas e Gestão de Acesso
 * Domain types & interfaces for Plans, Subscriptions, Payments and Gateways
 */

export type PlanTier = string;

export type BillingCycle = 'monthly' | 'annual';

export type SubscriptionStatus =
  | 'active'
  | 'trialing'
  | 'past_due'
  | 'canceled'
  | 'incomplete'
  | 'none';

export type PaymentMethodType = 'pix' | 'cartao' | 'boleto';

export type PaymentProviderType = 'mercadopago' | 'sandbox' | 'stripe' | 'manual_admin';

export interface PlanLimits {
  maxDebts: number; // -1 = ilimitado
  maxAttachments: number; // -1 = ilimitado
  maxStorageMb: number; // em megabytes
  maxMonthlyIncomes: number; // -1 = ilimitado
  maxMonthlyExpenses: number; // -1 = ilimitado
}

export interface PlanFeatureFlags {
  hasInvestments: boolean;
  hasAdvancedReports: boolean;
  hasCompleteCharts: boolean;
  hasCsvExport: boolean;
  hasPdfExport: boolean;
  hasFinancialPlanning: boolean;
  hasDebtPayoffSimulator: boolean;
  hasPrioritySupport: boolean;
  hasCloudBackupPriority: boolean;
}

export interface PlanConfig {
  id: PlanTier;
  name: string;
  description?: string;
  tagline: string;
  badge?: string;
  monthlyPriceCents: number;
  annualPriceCents: number;
  billingCycle?: 'monthly' | 'annual' | 'both';
  isActive: boolean;
  limits: PlanLimits;
  flags: PlanFeatureFlags;
  features: string[];
  highlighted?: boolean;
  mercadoPagoPlanId?: string; // ID do plano no Mercado Pago
  mercadoPagoMonthlyId?: string;
  mercadoPagoAnnualId?: string;
  sortOrder?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface UserSubscription {
  id: string;
  userId: string;
  planId: PlanTier;
  status: SubscriptionStatus;
  billingCycle: BillingCycle;
  amountCents: number;
  currentPeriodStart: string; // ISO string
  currentPeriodEnd: string; // ISO string
  cancelAtPeriodEnd: boolean;
  canceledAt?: string;
  paymentProvider: PaymentProviderType;
  paymentMethod: PaymentMethodType;
  providerSubscriptionId?: string;
  providerCustomerId?: string;
  mercadoPagoPaymentId?: string;
  mercadoPagoSubscriptionId?: string;
  mercadoPagoPreferenceId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentInvoice {
  id: string;
  subscriptionId: string;
  userId: string;
  userEmail: string;
  userName: string;
  planId: PlanTier;
  planName: string;
  amountCents: number;
  billingCycle: BillingCycle;
  status: 'paid' | 'pending' | 'failed' | 'canceled';
  paymentMethod: PaymentMethodType;
  paymentProvider: PaymentProviderType;
  mercadoPagoPaymentId?: string;
  mercadoPagoPreferenceId?: string;
  mercadoPagoTicketUrl?: string;
  pixQrCode?: string;
  pixCopiaECola?: string;
  paidAt?: string;
  receiptNumber: string;
  createdAt: string;
}

export interface AdminAuditLog {
  id: string;
  adminId?: string;
  adminEmail: string;
  action: string;
  targetId?: string;
  targetType: 'plan' | 'user' | 'subscription' | 'system';
  details?: Record<string, any>;
  ipAddress?: string;
  createdAt: string;
}

export interface MercadoPagoWebhookLog {
  id: string;
  eventType: string;
  resourceId?: string;
  status?: string;
  payload?: any;
  processedAt: string;
  errorMessage?: string;
}

export interface GatewayConfig {
  activeProvider: 'sandbox' | 'stripe' | 'mercadopago';
  sandboxMode: boolean;
  stripePublishableKey: string;
  stripeSecretKeyConfigured: boolean;
  stripeWebhookConfigured: boolean;
  mercadoPagoPublicKey: string;
  mercadoPagoAccessTokenConfigured: boolean;
  mercadoPagoWebhookConfigured: boolean;
  webhookEndpointUrl: string;
}

export interface UsageMetrics {
  debtsCount: number;
  debtsLimit: number;
  debtsPercentage: number;
  attachmentsCount: number;
  attachmentsLimit: number;
  attachmentsPercentage: number;
  storageMbUsed: number;
  storageMbLimit: number;
  storagePercentage: number;
  incomesCount: number;
  expensesCount: number;
  investmentsCount: number;
}
