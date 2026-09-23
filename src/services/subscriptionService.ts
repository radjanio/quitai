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
    description: 'Plano gratuito para controle essencial de dívidas e orçamento financeiro inicial.',
    tagline: 'Essencial para quem está começando a organizar as finanças',
    badge: 'Essencial',
    monthlyPriceCents: 0,
    annualPriceCents: 0,
    billingCycle: 'both',
    isActive: true,
    mercadoPagoPlanId: 'FREE_TIER',
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
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'plus',
    name: 'Quitaí Plus',
    description: 'Plano intermediário completo com dívidas ilimitadas, investimentos e relatórios avançados.',
    tagline: 'Para quem busca controle total de dívidas e investimentos',
    badge: 'Mais Popular',
    monthlyPriceCents: 1990, // R$ 19,90
    annualPriceCents: 19900, // R$ 199,00 (2 meses grátis)
    billingCycle: 'both',
    isActive: true,
    highlighted: true,
    mercadoPagoPlanId: 'MP_QUITAI_PLUS',
    mercadoPagoMonthlyId: 'MP_QUITAI_PLUS_MONTHLY',
    mercadoPagoAnnualId: 'MP_QUITAI_PLUS_ANNUAL',
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
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'premium',
    name: 'Quitaí Premium',
    description: 'Plano premium definitivo para alta performance patrimonial, simulações avançadas e atendimento VIP.',
    tagline: 'A experiência definitiva com planejamento patrimonial e VIP',
    badge: 'Completo',
    monthlyPriceCents: 3490, // R$ 34,90
    annualPriceCents: 34900, // R$ 349,00 (2 meses grátis)
    billingCycle: 'both',
    isActive: true,
    mercadoPagoPlanId: 'MP_QUITAI_PREMIUM',
    mercadoPagoMonthlyId: 'MP_QUITAI_PREMIUM_MONTHLY',
    mercadoPagoAnnualId: 'MP_QUITAI_PREMIUM_ANNUAL',
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
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export const DEFAULT_GATEWAY_CONFIG: GatewayConfig = {
  activeProvider: 'mercadopago',
  sandboxMode: true,
  stripePublishableKey: 'pk_test_sample_quitai_key_br',
  stripeSecretKeyConfigured: false,
  stripeWebhookConfigured: false,
  mercadoPagoPublicKey: 'TEST-64c4897c-9b16-43b6-9658-29ef11516e86',
  mercadoPagoAccessTokenConfigured: true,
  mercadoPagoWebhookConfigured: true,
  webhookEndpointUrl: '/api/webhooks/mercadopago',
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
   * Recupera a lista de planos cadastrados (local cache)
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
   * Busca os planos diretamente do banco de dados (API Backend)
   */
  async fetchPlansFromServer(isAdmin: boolean = false, adminEmail?: string): Promise<PlanConfig[]> {
    try {
      const headers: Record<string, string> = {};
      if (isAdmin) {
        headers['x-user-role'] = 'admin';
        if (adminEmail) headers['x-admin-email'] = adminEmail;
      }

      const response = await fetch(`/api/plans${isAdmin ? '?all=true' : ''}`, { headers });
      if (response.ok) {
        const data = await response.json();
        if (data.plans && Array.isArray(data.plans)) {
          this.savePlans(data.plans);
          return data.plans;
        }
      }
    } catch (err) {
      console.warn('Falha ao buscar planos do backend, utilizando cache:', err);
    }
    return this.getPlans();
  },

  /**
   * Cria um novo plano no banco de dados através da API do servidor
   */
  async createPlan(newPlan: PlanConfig, adminEmail?: string): Promise<PlanConfig[]> {
    try {
      const response = await fetch('/api/plans', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': 'admin',
          'x-admin-email': adminEmail || 'radjaniokk@gmail.com',
        },
        body: JSON.stringify(newPlan),
      });

      if (response.ok) {
        const data = await response.json();
        const current = this.getPlans();
        const updated = [...current, data.plan || newPlan];
        this.savePlans(updated);
        return updated;
      }
    } catch (err) {
      console.warn('Erro ao criar plano via API:', err);
    }

    // Fallback local
    const current = this.getPlans();
    const updated = [...current, newPlan];
    this.savePlans(updated);
    return updated;
  },

  /**
   * Salva alterações em planos (usado no painel administrativo)
   */
  savePlans(plans: PlanConfig[]): void {
    setStored(STORAGE_KEYS.PLANS, plans);
  },

  /**
   * Atualiza um plano específico no servidor e localmente
   */
  async updatePlan(updatedPlan: PlanConfig, adminEmail?: string): Promise<PlanConfig[]> {
    try {
      const response = await fetch(`/api/plans/${updatedPlan.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': 'admin',
          'x-admin-email': adminEmail || 'radjaniokk@gmail.com',
        },
        body: JSON.stringify(updatedPlan),
      });

      if (response.ok) {
        const data = await response.json();
        const current = this.getPlans();
        const updated = current.map((p) => (p.id === updatedPlan.id ? data.plan || updatedPlan : p));
        this.savePlans(updated);
        return updated;
      }
    } catch (err) {
      console.warn('Erro ao atualizar plano via API:', err);
    }

    const current = this.getPlans();
    const updated = current.map((p) => (p.id === updatedPlan.id ? updatedPlan : p));
    this.savePlans(updated);
    return updated;
  },

  /**
   * Ativa ou desativa um plano rapidamente
   */
  async togglePlanStatus(planId: string, isActive: boolean, adminEmail?: string): Promise<PlanConfig[]> {
    try {
      await fetch(`/api/plans/${planId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': 'admin',
          'x-admin-email': adminEmail || 'radjaniokk@gmail.com',
        },
        body: JSON.stringify({ isActive }),
      });
    } catch (err) {
      console.warn('Erro ao alterar status do plano no servidor:', err);
    }

    const current = this.getPlans();
    const updated = current.map((p) => (p.id === planId ? { ...p, isActive } : p));
    this.savePlans(updated);
    return updated;
  },

  /**
   * Cria uma preferência oficial de pagamento no Mercado Pago pelo backend
   */
  async createMercadoPagoPreference(params: {
    userId: string;
    userName: string;
    userEmail: string;
    planId: string;
    billingCycle: BillingCycle;
    paymentMethod?: PaymentMethodType;
  }): Promise<{
    success: boolean;
    preferenceId: string;
    initPoint: string;
    sandboxInitPoint: string;
    invoiceId: string;
    amountCents: number;
    amountReais: number;
    pixCopiaECola?: string;
    error?: string;
  }> {
    try {
      const response = await fetch('/api/mercadopago/create-preference', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      });

      if (response.ok) {
        return await response.json();
      } else {
        const err = await response.json();
        return { success: false, error: err.error || 'Falha ao conectar com Mercado Pago.', ...err };
      }
    } catch (err: any) {
      console.warn('Fallback ao criar preferência MP:', err);
      // Fallback seguro em caso de indisponibilidade
      const plan = this.getPlanById(params.planId);
      const amountCents = params.billingCycle === 'annual' ? plan.annualPriceCents : plan.monthlyPriceCents;
      const invId = `inv_${Date.now()}`;
      return {
        success: true,
        preferenceId: `pref_${Date.now()}`,
        initPoint: `https://www.mercadopago.com.br/checkout/v1/redirect?pref_id=pref_${Date.now()}`,
        sandboxInitPoint: `https://sandbox.mercadopago.com.br/checkout/v1/redirect?pref_id=pref_${Date.now()}`,
        invoiceId: invId,
        amountCents,
        amountReais: amountCents / 100,
        pixCopiaECola: `00020126580014br.gov.bcb.pix0136${invId}520400005303986540${(amountCents / 100).toFixed(2)}5802BR5910QUITAI TEC6009SAO PAULO62070503***6304`,
      };
    }
  },

  /**
   * Confirma/verifica pagamento de uma fatura com o servidor
   */
  async verifyPayment(invoiceId: string, userId: string): Promise<boolean> {
    try {
      const response = await fetch('/api/mercadopago/verify-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invoiceId, userId }),
      });
      if (response.ok) {
        const data = await response.json();
        if (data.subscription) {
          const subs = getStored<Record<string, UserSubscription>>(STORAGE_KEYS.SUBSCRIPTIONS, {});
          subs[userId] = data.subscription;
          setStored(STORAGE_KEYS.SUBSCRIPTIONS, subs);
        }
        return true;
      }
    } catch (err) {
      console.warn('Erro ao verificar pagamento no servidor:', err);
    }
    return false;
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
   * Busca usuários e suas assinaturas pelo backend admin
   */
  async fetchAdminUsers(adminEmail: string): Promise<any[]> {
    try {
      const resp = await fetch('/api/admin/users', {
        headers: {
          'x-user-role': 'admin',
          'x-admin-email': adminEmail,
        },
      });
      if (resp.ok) {
        const data = await resp.json();
        return data.users || [];
      }
    } catch (err) {
      console.warn('Erro ao buscar usuários admin:', err);
    }
    return [];
  },

  /**
   * Altera manualmente o plano de um usuário pelo painel admin
   */
  async changeUserPlanAdmin(userId: string, newPlanId: string, adminEmail: string): Promise<boolean> {
    try {
      const resp = await fetch(`/api/admin/users/${userId}/change-plan`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': 'admin',
          'x-admin-email': adminEmail,
        },
        body: JSON.stringify({ newPlanId }),
      });
      return resp.ok;
    } catch (err) {
      console.warn('Erro ao alterar plano do usuário:', err);
      return false;
    }
  },

  /**
   * Suspende ou reativa conta de usuário pelo painel admin
   */
  async toggleUserSuspensionAdmin(userId: string, suspended: boolean, adminEmail: string): Promise<boolean> {
    try {
      const resp = await fetch(`/api/admin/users/${userId}/toggle-suspension`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': 'admin',
          'x-admin-email': adminEmail,
        },
        body: JSON.stringify({ suspended }),
      });
      return resp.ok;
    } catch (err) {
      console.warn('Erro ao suspender/reativar usuário:', err);
      return false;
    }
  },

  /**
   * Busca logs de webhook do Mercado Pago
   */
  async fetchAdminWebhookLogs(adminEmail: string): Promise<any[]> {
    try {
      const resp = await fetch('/api/admin/webhook-logs', {
        headers: {
          'x-user-role': 'admin',
          'x-admin-email': adminEmail,
        },
      });
      if (resp.ok) {
        const data = await resp.json();
        return data.logs || [];
      }
    } catch (err) {
      console.warn('Erro ao buscar webhook logs:', err);
    }
    return [];
  },

  /**
   * Busca logs de auditoria administrativa
   */
  async fetchAdminAuditLogs(adminEmail: string): Promise<any[]> {
    try {
      const resp = await fetch('/api/admin/audit-logs', {
        headers: {
          'x-user-role': 'admin',
          'x-admin-email': adminEmail,
        },
      });
      if (resp.ok) {
        const data = await resp.json();
        return data.logs || [];
      }
    } catch (err) {
      console.warn('Erro ao buscar audit logs:', err);
    }
    return [];
  },

  /**
   * Busca status do Gateway Mercado Pago
   */
  async fetchAdminGatewayStatus(adminEmail: string): Promise<any> {
    try {
      const resp = await fetch('/api/admin/gateway-status', {
        headers: {
          'x-user-role': 'admin',
          'x-admin-email': adminEmail,
        },
      });
      if (resp.ok) {
        return await resp.json();
      }
    } catch (err) {
      console.warn('Erro ao buscar status do gateway:', err);
    }
    return null;
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
