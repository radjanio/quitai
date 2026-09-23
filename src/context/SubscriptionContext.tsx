/**
 * QuitaÍ — Contexto de Assinaturas e Controle de Acesso
 * Fornece estado de planos, limites de uso, checkout e administração
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from './AuthContext';
import { useFinance } from './FinanceContext';
import {
  PlanTier,
  BillingCycle,
  PlanConfig,
  UserSubscription,
  PaymentInvoice,
  GatewayConfig,
  PaymentMethodType,
  UsageMetrics,
  PlanFeatureFlags,
} from '../types/subscription';
import { SubscriptionService } from '../services/subscriptionService';

interface SubscriptionContextType {
  plans: PlanConfig[];
  currentPlan: PlanConfig;
  userSubscription: UserSubscription | null;
  invoices: PaymentInvoice[];
  usageMetrics: UsageMetrics;
  isUpgradeModalOpen: boolean;
  upgradeModalReason: string;
  openUpgradeModal: (reason?: string) => void;
  closeUpgradeModal: () => void;
  isCheckoutModalOpen: boolean;
  checkoutPlan: PlanConfig | null;
  checkoutCycle: BillingCycle;
  openCheckout: (plan: PlanConfig, cycle?: BillingCycle) => void;
  closeCheckout: () => void;
  confirmSubscription: (
    planId: PlanTier,
    cycle: BillingCycle,
    paymentMethod: PaymentMethodType
  ) => Promise<PaymentInvoice>;
  cancelSubscription: () => Promise<void>;
  reactivateSubscription: () => Promise<void>;
  canAccess: (feature: keyof PlanFeatureFlags) => boolean;
  checkCanAddDebt: () => { allowed: boolean; message?: string };
  checkCanAddAttachment: (additionalSizeBytes?: number) => { allowed: boolean; message?: string };
  triggerUpgradeNotice: (reason?: string) => void;
  adminUpdatePlan: (plan: PlanConfig) => void;
  adminResetPlans: () => void;
  adminUpdateGatewayConfig: (config: Partial<GatewayConfig>) => void;
  gatewayConfig: GatewayConfig;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export const SubscriptionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { debts, attachments, incomes, expenses, investments, showToast } = useFinance();

  const [plans, setPlans] = useState<PlanConfig[]>(() => SubscriptionService.getPlans());
  const [gatewayConfig, setGatewayConfig] = useState<GatewayConfig>(() =>
    SubscriptionService.getGatewayConfig()
  );
  const [userSubscription, setUserSubscription] = useState<UserSubscription | null>(null);
  const [invoices, setInvoices] = useState<PaymentInvoice[]>([]);

  // Upgrade modal state
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [upgradeModalReason, setUpgradeModalReason] = useState(
    'Desbloqueie recursos avançados para acelerar a quitação das suas dívidas.'
  );

  // Checkout modal state
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [checkoutPlan, setCheckoutPlan] = useState<PlanConfig | null>(null);
  const [checkoutCycle, setCheckoutCycle] = useState<BillingCycle>('monthly');

  // Load user subscription and invoices when user changes
  useEffect(() => {
    if (!user) {
      setUserSubscription(null);
      setInvoices([]);
      return;
    }

    const sub = SubscriptionService.getUserSubscription(user.id);
    setUserSubscription(sub);
    const userInvoices = SubscriptionService.getUserInvoices(user.id);
    setInvoices(userInvoices);
  }, [user]);

  // Current active plan
  const currentPlan = useMemo(() => {
    if (!userSubscription) {
      return SubscriptionService.getPlanById('gratis');
    }
    return SubscriptionService.getPlanById(userSubscription.planId);
  }, [userSubscription, plans]);

  // Compute storage bytes used
  const totalAttachmentBytes = useMemo(() => {
    return attachments.reduce((acc, curr) => acc + (curr.fileSize || 0), 0);
  }, [attachments]);

  // Real-time usage metrics
  const usageMetrics: UsageMetrics = useMemo(() => {
    return SubscriptionService.calculateUsage(
      currentPlan,
      debts.length,
      attachments.length,
      totalAttachmentBytes,
      incomes.length,
      expenses.length,
      investments.length
    );
  }, [currentPlan, debts.length, attachments.length, totalAttachmentBytes, incomes.length, expenses.length, investments.length]);

  // Feature gate checker
  const canAccess = useCallback(
    (feature: keyof PlanFeatureFlags): boolean => {
      return Boolean(currentPlan.flags[feature]);
    },
    [currentPlan]
  );

  // Check if debt limit allows adding new debt
  const checkCanAddDebt = useCallback((): { allowed: boolean; message?: string } => {
    const limit = currentPlan.limits.maxDebts;
    if (limit === -1) return { allowed: true };
    if (debts.length >= limit) {
      return {
        allowed: false,
        message: `Você atingiu o limite de ${limit} dívidas do seu plano ${currentPlan.name}. Faça upgrade para o Quitaí Plus para cadastrar dívidas ilimitadas!`,
      };
    }
    return { allowed: true };
  }, [currentPlan, debts.length]);

  // Check if attachment limit allows adding new attachment
  const checkCanAddAttachment = useCallback(
    (additionalSizeBytes?: number): { allowed: boolean; message?: string } => {
      const countLimit = currentPlan.limits.maxAttachments;
      if (countLimit !== -1 && attachments.length >= countLimit) {
        return {
          allowed: false,
          message: `Você atingiu o limite de ${countLimit} anexos do plano ${currentPlan.name}. Faça upgrade para o Quitaí Plus para salvar documentos ilimitados!`,
        };
      }

      if (additionalSizeBytes) {
        const storageLimitMb = currentPlan.limits.maxStorageMb;
        const currentBytes = attachments.reduce((sum, a) => sum + (a.fileSize || 0), 0);
        const newTotalMb = (currentBytes + additionalSizeBytes) / (1024 * 1024);
        if (newTotalMb > storageLimitMb) {
          return {
            allowed: false,
            message: `O arquivo ultrapassa o limite de armazenamento de ${storageLimitMb}MB do seu plano ${currentPlan.name}. Faça upgrade para mais espaço!`,
          };
        }
      }

      return { allowed: true };
    },
    [currentPlan, attachments]
  );

  // Upgrade Modal Handlers
  const openUpgradeModal = useCallback((reason?: string) => {
    if (reason) setUpgradeModalReason(reason);
    setIsUpgradeModalOpen(true);
  }, []);

  const closeUpgradeModal = useCallback(() => {
    setIsUpgradeModalOpen(false);
  }, []);

  // Checkout Modal Handlers
  const openCheckout = useCallback((plan: PlanConfig, cycle: BillingCycle = 'monthly') => {
    setCheckoutPlan(plan);
    setCheckoutCycle(cycle);
    setIsCheckoutModalOpen(true);
  }, []);

  const closeCheckout = useCallback(() => {
    setIsCheckoutModalOpen(false);
    setCheckoutPlan(null);
  }, []);

  // Confirm subscription payment
  const confirmSubscription = useCallback(
    async (
      planId: PlanTier,
      cycle: BillingCycle,
      paymentMethod: PaymentMethodType
    ): Promise<PaymentInvoice> => {
      if (!user) throw new Error('Usuário precisa estar autenticado.');

      const { subscription, invoice } = SubscriptionService.subscribeUser(
        user.id,
        user.name,
        user.email,
        planId,
        cycle,
        paymentMethod
      );

      setUserSubscription(subscription);
      setInvoices((prev) => [invoice, ...prev]);
      setIsCheckoutModalOpen(false);
      setIsUpgradeModalOpen(false);

      const targetPlan = SubscriptionService.getPlanById(planId);
      showToast(`Parabéns! Sua assinatura do ${targetPlan.name} foi ativada com sucesso!`, 'success');
      return invoice;
    },
    [user, showToast]
  );

  // Cancel subscription
  const cancelSubscription = useCallback(async () => {
    if (!user) return;
    const updated = SubscriptionService.cancelUserSubscription(user.id);
    setUserSubscription({ ...updated });
    showToast('Sua assinatura não será renovada no próximo ciclo. Seus dados permanecem intactos.', 'info');
  }, [user, showToast]);

  // Reactivate subscription
  const reactivateSubscription = useCallback(async () => {
    if (!user) return;
    const updated = SubscriptionService.reactivateUserSubscription(user.id);
    setUserSubscription({ ...updated });
    showToast('Assinatura reativada com sucesso!', 'success');
  }, [user, showToast]);

  // Admin: Update Plan configuration
  const adminUpdatePlan = useCallback(
    (updatedPlan: PlanConfig) => {
      const updated = SubscriptionService.updatePlan(updatedPlan);
      setPlans([...updated]);
      showToast(`Configurações do ${updatedPlan.name} salvas com sucesso!`, 'success');
    },
    [showToast]
  );

  // Admin: Reset plans to default
  const adminResetPlans = useCallback(() => {
    const defaults = SubscriptionService.resetPlansToDefault();
    setPlans([...defaults]);
    showToast('Planos restaurados para a configuração padrão.', 'info');
  }, [showToast]);

  // Admin: Update Gateway config
  const adminUpdateGatewayConfig = useCallback(
    (newConfig: Partial<GatewayConfig>) => {
      const updated = SubscriptionService.saveGatewayConfig(newConfig);
      setGatewayConfig({ ...updated });
      showToast('Configurações de pagamento atualizadas.', 'success');
    },
    [showToast]
  );

  const value = {
    plans,
    currentPlan,
    userSubscription,
    invoices,
    usageMetrics,
    isUpgradeModalOpen,
    upgradeModalReason,
    openUpgradeModal,
    closeUpgradeModal,
    isCheckoutModalOpen,
    checkoutPlan,
    checkoutCycle,
    openCheckout,
    closeCheckout,
    confirmSubscription,
    cancelSubscription,
    reactivateSubscription,
    canAccess,
    checkCanAddDebt,
    checkCanAddAttachment,
    triggerUpgradeNotice: openUpgradeModal,
    adminUpdatePlan,
    adminResetPlans,
    adminUpdateGatewayConfig,
    gatewayConfig,
  };

  return <SubscriptionContext.Provider value={value}>{children}</SubscriptionContext.Provider>;
};

export const useSubscription = () => {
  const context = useContext(SubscriptionContext);
  if (!context) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
};
