/**
 * QuitaÍ — Serviço de Planos, Assinaturas e Controle de Acesso
 * Suporta Sandbox de Testes, Stripe e Mercado Pago com persistência configurável
 */

import {
  PlanTier,
  BillingCycle,
  SubscriptionStatus,
  PlanConfig,
  UserSubscription,
  PaymentInvoice,
  GatewayConfig,
  PaymentMethodType,
  UsageMetrics,
} from '../types/subscription';

const STORAGE_KEYS = {
  PLANS: 'quitai_plans_config_v1',
  SUBSCRIPTIONS: 'quitai_user_subscriptions_v1',
  INVOICES: 'quitai_payment_invoices_v1',
  GATEWAY: 'quitai_gateway_config_v1',
};

export const DEFAULT_PLANS: PlanConfig[] = [
  {
    id: 'gratis',
    name: 'Quitaí Grátis',
    tagline: 'Essencial para quem está começando a organizar as finanças',
    badge: 'Essencial',
    monthlyPriceCents: 0,
    annualPriceCents: 0,
    limits: {
      maxDebts: 3,
      maxAttachments: 5,
      maxStorageMb: 15,
      maxMonthlyIncomes: -1,
      maxMonthlyExpenses: -1,
    },
    flags: {
      hasInvestments: false,
      hasAdvancedReports: false,
      hasCompleteCharts: false,
      hasCsvExport: true,
      hasPdfExport: false,
      hasFinancialPlanning: false,
      hasDebtPayoffSimulator: false,
      hasPrioritySupport: false,
      hasCloudBackupPriority: false,
    },
    features: [
      'Até 3 dívidas ativas cadastradas',
      'Controle completo de Entradas e Despesas',
      'Dashboard com indicadores essenciais',
      'Até 5 comprovantes e anexos (15 MB)',
      'Calendário financeiro básico',
      'Exportação simples para CSV',
    ],
  },
  {
    id: 'plus',
    name: 'Quitaí Plus',
    tagline: 'Para quem busca controle total de dívidas e investimentos',
    badge: 'Mais Popular',
    monthlyPriceCents: 1990, // R$ 19,90
    annualPriceCents: 19900, // R$ 199,00 (2 meses grátis)
    highlighted: true,
    limits: {
      maxDebts: -1, // ilimitado
      maxAttachments: 50,
      maxStorageMb: 150,
      maxMonthlyIncomes: -1,
      maxMonthlyExpenses: -1,
    },
    flags: {
      hasInvestments: true,
      hasAdvancedReports: true,
      hasCompleteCharts: true,
      hasCsvExport: true,
      hasPdfExport: true,
      hasFinancialPlanning: false,
      hasDebtPayoffSimulator: true,
      hasPrioritySupport: true,
      hasCloudBackupPriority: true,
    },
    features: [
      'Dívidas e contratos ilimitados',
      'Módulo completo de Investimentos e Rendimentos',
      'Relatórios financeiros avançados e gráficos detalhados',
      'Exportação em PDF e planilhas CSV completas',
      'Até 50 comprovantes e anexos (150 MB)',
      'Simulador de Quitação Acelerada',
      'Suporte prioritário via e-mail e WhatsApp',
    ],
  },
  {
    id: 'premium',
    name: 'Quitaí Premium',
    tagline: 'A experiência definitiva com planejamento patrimonial e VIP',
    badge: 'Completo',
    monthlyPriceCents: 3490, // R$ 34,90
    annualPriceCents: 34900, // R$ 349,00 (2 meses grátis)
    limits: {
      maxDebts: -1,
      maxAttachments: 500,
      maxStorageMb: 1024, // 1 GB
      maxMonthlyIncomes: -1,
      maxMonthlyExpenses: -1,
    },
    flags: {
      hasInvestments: true,
      hasAdvancedReports: true,
      hasCompleteCharts: true,
      hasCsvExport: true,
      hasPdfExport: true,
      hasFinancialPlanning: true,
      hasDebtPayoffSimulator: true,
      hasPrioritySupport: true,
      hasCloudBackupPriority: true,
    },
    features: [
      'Tudo do Plano Plus incluído',
      'Recursos avançados de Planejamento Patrimonial',
      'Armazenamento amplo para documentos (1 GB)',
      'Simulador de Amortização Extraordinária e juros compostos',
      'Acesso antecipado a novas funcionalidades',
      'Exportações fiscais para Imposto de Renda',
      'Atendimento VIP com especialista financeiro',
    ],
  },
];

export const DEFAULT_GATEWAY_CONFIG: GatewayConfig = {
  activeProvider: 'sandbox',
  sandboxMode: true,
  stripePublishableKey: 'pk_test_sample_quitai_key_br',
  stripeSecretKeyConfigured: false,
  stripeWebhookConfigured: false,
  mercadoPagoPublicKey: 'TEST-sample-public-key',
  mercadoPagoAccessTokenConfigured: false,
  mercadoPagoWebhookConfigured: false,
  webhookEndpointUrl: 'https://ais-dev-vnej4t7gzgi2kzo7bwprwc-439961569105.us-west1.run.app/api/webhooks/billing',
};

function getStored<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function setStored<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.error('Failed to write storage key', key, err);
  }
}

export const SubscriptionService = {
  /**
   * Recupera a lista de planos cadastrados
   */
  getPlans(): PlanConfig[] {
    const custom = getStored<PlanConfig[] | null>(STORAGE_KEYS.PLANS, null);
    if (!custom || custom.length === 0) {
      setStored(STORAGE_KEYS.PLANS, DEFAULT_PLANS);
      return DEFAULT_PLANS;
    }
    return custom;
  },

  /**
   * Salva alterações em planos (usado no painel administrativo)
   */
  savePlans(plans: PlanConfig[]): void {
    setStored(STORAGE_KEYS.PLANS, plans);
  },

  /**
   * Atualiza um plano específico
   */
  updatePlan(updatedPlan: PlanConfig): PlanConfig[] {
    const current = this.getPlans();
    const updated = current.map((p) => (p.id === updatedPlan.id ? updatedPlan : p));
    this.savePlans(updated);
    return updated;
  },

  /**
   * Reseta os planos para os padrões de fábrica
   */
  resetPlansToDefault(): PlanConfig[] {
    setStored(STORAGE_KEYS.PLANS, DEFAULT_PLANS);
    return DEFAULT_PLANS;
  },

  /**
   * Busca um plano pelo identificador
   */
  getPlanById(planId: PlanTier): PlanConfig {
    const plans = this.getPlans();
    return plans.find((p) => p.id === planId) || DEFAULT_PLANS[0];
  },

  /**
   * Busca a assinatura do usuário
   */
  getUserSubscription(userId: string): UserSubscription {
    const subs = getStored<Record<string, UserSubscription>>(STORAGE_KEYS.SUBSCRIPTIONS, {});
    const existing = subs[userId];

    if (existing) {
      // Verificar se o período expirou
      const now = new Date();
      const periodEnd = new Date(existing.currentPeriodEnd);
      if (now > periodEnd && existing.status === 'active' && existing.cancelAtPeriodEnd) {
        existing.status = 'canceled';
        existing.planId = 'gratis';
        subs[userId] = existing;
        setStored(STORAGE_KEYS.SUBSCRIPTIONS, subs);
      }
      return existing;
    }

    // Default: Quitaí Grátis
    const defaultSub: UserSubscription = {
      id: `sub_${userId}_gratis`,
      userId,
      planId: 'gratis',
      status: 'active',
      billingCycle: 'monthly',
      amountCents: 0,
      currentPeriodStart: new Date().toISOString(),
      currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      cancelAtPeriodEnd: false,
      paymentProvider: 'sandbox',
      paymentMethod: 'pix',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    subs[userId] = defaultSub;
    setStored(STORAGE_KEYS.SUBSCRIPTIONS, subs);
    return defaultSub;
  },

  /**
   * Atualiza ou assina um novo plano para o usuário
   */
  subscribeUser(
    userId: string,
    userName: string,
    userEmail: string,
    planId: PlanTier,
    billingCycle: BillingCycle,
    paymentMethod: PaymentMethodType = 'pix'
  ): { subscription: UserSubscription; invoice: PaymentInvoice } {
    const plan = this.getPlanById(planId);
    const amountCents = billingCycle === 'annual' ? plan.annualPriceCents : plan.monthlyPriceCents;
    const now = new Date();
    const periodDays = billingCycle === 'annual' ? 365 : 30;
    const periodEnd = new Date(now.getTime() + periodDays * 24 * 60 * 60 * 1000);

    const subs = getStored<Record<string, UserSubscription>>(STORAGE_KEYS.SUBSCRIPTIONS, {});
    const gateway = this.getGatewayConfig();

    const newSub: UserSubscription = {
      id: `sub_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      userId,
      planId,
      status: 'active',
      billingCycle,
      amountCents,
      currentPeriodStart: now.toISOString(),
      currentPeriodEnd: periodEnd.toISOString(),
      cancelAtPeriodEnd: false,
      paymentProvider: gateway.activeProvider,
      paymentMethod,
      providerSubscriptionId: `prov_sub_${Math.random().toString(36).substring(2, 9)}`,
      providerCustomerId: `cust_${userId}`,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };

    subs[userId] = newSub;
    setStored(STORAGE_KEYS.SUBSCRIPTIONS, subs);

    // Gerar fatura de pagamento
    const invoiceId = `inv_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const randomReceipt = Math.floor(100000 + Math.random() * 900000).toString();

    // Simulação do payload PIX se método for PIX
    const pixCopiaECola =
      paymentMethod === 'pix'
        ? `00020126580014br.gov.bcb.pix0136${invoiceId}520400005303986540${(amountCents / 100).toFixed(2)}5802BR5910QUITAI PAG6009SAO PAULO62070503***6304`
        : undefined;

    const newInvoice: PaymentInvoice = {
      id: invoiceId,
      subscriptionId: newSub.id,
      userId,
      userName,
      userEmail,
      planId,
      planName: plan.name,
      amountCents,
      billingCycle,
      status: 'paid',
      paymentMethod,
      paymentProvider: gateway.activeProvider,
      pixCopiaECola,
      paidAt: now.toISOString(),
      receiptNumber: `REC-${randomReceipt}`,
      createdAt: now.toISOString(),
    };

    const invoices = getStored<PaymentInvoice[]>(STORAGE_KEYS.INVOICES, []);
    invoices.unshift(newInvoice);
    setStored(STORAGE_KEYS.INVOICES, invoices);

    return { subscription: newSub, invoice: newInvoice };
  },

  /**
   * Cancelar assinatura ao término do período
   */
  cancelUserSubscription(userId: string): UserSubscription {
    const subs = getStored<Record<string, UserSubscription>>(STORAGE_KEYS.SUBSCRIPTIONS, {});
    const current = subs[userId] || this.getUserSubscription(userId);

    current.cancelAtPeriodEnd = true;
    current.canceledAt = new Date().toISOString();
    current.updatedAt = new Date().toISOString();

    subs[userId] = current;
    setStored(STORAGE_KEYS.SUBSCRIPTIONS, subs);
    return current;
  },

  /**
   * Reativar assinatura cancelada
   */
  reactivateUserSubscription(userId: string): UserSubscription {
    const subs = getStored<Record<string, UserSubscription>>(STORAGE_KEYS.SUBSCRIPTIONS, {});
    const current = subs[userId] || this.getUserSubscription(userId);

    current.cancelAtPeriodEnd = false;
    current.canceledAt = undefined;
    current.updatedAt = new Date().toISOString();

    subs[userId] = current;
    setStored(STORAGE_KEYS.SUBSCRIPTIONS, subs);
    return current;
  },

  /**
   * Recupera histórico de faturas do usuário
   */
  getUserInvoices(userId: string): PaymentInvoice[] {
    const all = getStored<PaymentInvoice[]>(STORAGE_KEYS.INVOICES, []);
    return all.filter((inv) => inv.userId === userId);
  },

  /**
   * Recupera todas as faturas (para o painel administrativo)
   */
  getAllInvoices(): PaymentInvoice[] {
    return getStored<PaymentInvoice[]>(STORAGE_KEYS.INVOICES, []);
  },

  /**
   * Recupera todas as assinaturas ativas (para o painel administrativo)
   */
  getAllSubscriptions(): Record<string, UserSubscription> {
    return getStored<Record<string, UserSubscription>>(STORAGE_KEYS.SUBSCRIPTIONS, {});
  },

  /**
   * Configuração de Gateways (Stripe, Mercado Pago, Sandbox)
   */
  getGatewayConfig(): GatewayConfig {
    return getStored<GatewayConfig>(STORAGE_KEYS.GATEWAY, DEFAULT_GATEWAY_CONFIG);
  },

  saveGatewayConfig(config: Partial<GatewayConfig>): GatewayConfig {
    const current = this.getGatewayConfig();
    const updated = { ...current, ...config };
    setStored(STORAGE_KEYS.GATEWAY, updated);
    return updated;
  },

  /**
   * Calcula as métricas de uso e limites
   */
  calculateUsage(
    plan: PlanConfig,
    debtsCount: number,
    attachmentsCount: number,
    storageBytesUsed: number,
    incomesCount: number,
    expensesCount: number,
    investmentsCount: number
  ): UsageMetrics {
    const debtsLimit = plan.limits.maxDebts;
    const debtsPercentage =
      debtsLimit === -1 ? 0 : Math.min(100, Math.round((debtsCount / debtsLimit) * 100));

    const attachmentsLimit = plan.limits.maxAttachments;
    const attachmentsPercentage =
      attachmentsLimit === -1
        ? 0
        : Math.min(100, Math.round((attachmentsCount / attachmentsLimit) * 100));

    const storageMbUsed = Number((storageBytesUsed / (1024 * 1024)).toFixed(2));
    const storageMbLimit = plan.limits.maxStorageMb;
    const storagePercentage = Math.min(
      100,
      Math.round((storageMbUsed / Math.max(1, storageMbLimit)) * 100)
    );

    return {
      debtsCount,
      debtsLimit,
      debtsPercentage,
      attachmentsCount,
      attachmentsLimit,
      attachmentsPercentage,
      storageMbUsed,
      storageMbLimit,
      storagePercentage,
      incomesCount,
      expensesCount,
      investmentsCount,
    };
  },
};
