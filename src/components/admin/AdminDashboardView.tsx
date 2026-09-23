/**
 * QuitaÍ — Painel de Administração e Gestão de Assinaturas
 * Permite cadastrar, editar, ativar/desativar planos, gerenciar usuários, assinaturas e webhooks Mercado Pago
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  ShieldAlert,
  Settings,
  Users,
  CreditCard,
  Save,
  RotateCcw,
  CheckCircle,
  AlertCircle,
  Sparkles,
  ExternalLink,
  Lock,
  Layers,
  TrendingUp,
  Activity,
  ArrowRight,
  Plus,
  Search,
  Filter,
  Eye,
  UserX,
  UserCheck,
  Calendar,
  DollarSign,
  Clock,
  FileText,
  Radio,
  Check,
  X,
  RefreshCw,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useSubscription } from '../../context/SubscriptionContext';
import { useFinance } from '../../context/FinanceContext';
import { SubscriptionService } from '../../services/subscriptionService';
import { PlanConfig, UserSubscription, PaymentInvoice, BillingCycle } from '../../types/subscription';
import { formatCurrencyCents } from '../../utils/currency';

interface AdminDashboardViewProps {
  onBackToDashboard: () => void;
}

export const AdminDashboardView: React.FC<AdminDashboardViewProps> = ({ onBackToDashboard }) => {
  const { user, isAdmin } = useAuth();
  const {
    plans,
    adminCreatePlan,
    adminUpdatePlan,
    adminTogglePlanStatus,
    adminResetPlans,
    refreshPlans,
    gatewayConfig,
    adminUpdateGatewayConfig,
  } = useSubscription();
  const { showToast } = useFinance();

  const [activeTab, setActiveTab] = useState<'plans' | 'users' | 'subscriptions' | 'mercadopago'>('plans');

  // Plan editing & creation state
  const [selectedPlanId, setSelectedPlanId] = useState<string>(plans[0]?.id || 'plus');
  const [isCreatingNewPlan, setIsCreatingNewPlan] = useState(false);
  const activePlanToEdit = plans.find((p) => p.id === selectedPlanId) || plans[0] || {
    id: 'novo_plano',
    name: 'Novo Plano',
    description: 'Descrição do novo plano',
    tagline: 'Ideal para...',
    monthlyPriceCents: 2990,
    annualPriceCents: 29900,
    mercadoPagoPlanId: '',
    isActive: true,
    highlighted: false,
    badge: 'Novo',
    features: ['Acesso completo'],
    limits: { maxDebts: -1, maxAttachments: 50, maxStorageMb: 200 },
    flags: { aiAssistant: true, prioritySupport: true, pdfExport: true, debtNegotiationTips: true, cloudBackup: true },
  };

  const [formData, setFormData] = useState<PlanConfig>(activePlanToEdit);
  const [newPlanData, setNewPlanData] = useState<Partial<PlanConfig>>({
    id: '',
    name: '',
    description: '',
    tagline: '',
    monthlyPriceCents: 2990,
    annualPriceCents: 29900,
    mercadoPagoPlanId: '',
    isActive: true,
    highlighted: false,
    badge: 'Popular',
    features: ['Dívidas ilimitadas', 'Exportação avançada', 'Suporte prioritário'],
    limits: {
      maxDebts: -1,
      maxAttachments: 100,
      maxStorageMb: 500,
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
  });

  // When selected plan changes, update form data
  useEffect(() => {
    const target = plans.find((p) => p.id === selectedPlanId);
    if (target) {
      setFormData({ ...target });
    }
  }, [selectedPlanId, plans]);

  // Admin Users & Subscriptions data loaded from backend
  const [adminUsers, setAdminUsers] = useState<any[]>([]);
  const [adminSubscriptions, setAdminSubscriptions] = useState<Record<string, UserSubscription>>({});
  const [adminInvoices, setAdminInvoices] = useState<PaymentInvoice[]>([]);
  const [adminWebhookLogs, setAdminWebhookLogs] = useState<any[]>([]);
  const [adminAuditLogs, setAdminAuditLogs] = useState<any[]>([]);
  const [gatewayStatus, setGatewayStatus] = useState<any>(null);
  const [isLoadingData, setIsLoadingData] = useState(false);

  // Filters
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [userPlanFilter, setUserPlanFilter] = useState('all');
  const [subscriptionStatusFilter, setSubscriptionStatusFilter] = useState('all');

  // Selected user for details modal
  const [selectedUserForInvoices, setSelectedUserForInvoices] = useState<any | null>(null);

  // Load all backend admin data
  const loadAdminData = useCallback(async () => {
    if (!isAdmin || !user?.email) return;
    setIsLoadingData(true);
    try {
      const [users, webhooks, audits, gw] = await Promise.all([
        SubscriptionService.fetchAdminUsers(user.email),
        SubscriptionService.fetchAdminWebhookLogs(user.email),
        SubscriptionService.fetchAdminAuditLogs(user.email),
        SubscriptionService.fetchAdminGatewayStatus(user.email),
      ]);
      setAdminUsers(users);
      setAdminWebhookLogs(webhooks);
      setAdminAuditLogs(audits);
      setGatewayStatus(gw);

      // Local/mock fallback invoices & subscriptions
      setAdminSubscriptions(SubscriptionService.getAllSubscriptions());
      setAdminInvoices(SubscriptionService.getAllInvoices());
    } finally {
      setIsLoadingData(false);
    }
  }, [isAdmin, user?.email]);

  useEffect(() => {
    loadAdminData();
  }, [loadAdminData]);

  // Security check: if not admin, show Access Denied
  if (!isAdmin) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="w-16 h-16 rounded-3xl bg-red-500/10 text-red-500 flex items-center justify-center mx-auto mb-4">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Acesso Restrito</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
          Esta área é restrita a administradores autorizados do QuitaÍ. As permissões são validadas de forma estrita no backend.
        </p>
        <button
          onClick={onBackToDashboard}
          className="mt-6 py-2.5 px-6 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-xl text-xs font-bold"
        >
          Voltar para o Dashboard
        </button>
      </div>
    );
  }

  // --- Handlers para Planos ---
  const handleSavePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    await adminUpdatePlan(formData);
    await loadAdminData();
  };

  const handleTogglePlan = async (planId: string, currentStatus: boolean) => {
    await adminTogglePlanStatus(planId, !currentStatus);
    await loadAdminData();
  };

  const handleCreateNewPlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlanData.id || !newPlanData.name) {
      showToast('Preencha ao menos o identificador (ID) e o nome do plano.', 'warning');
      return;
    }

    const createdPlan: PlanConfig = {
      id: newPlanData.id.toLowerCase().trim().replace(/\s+/g, '_'),
      name: newPlanData.name,
      description: newPlanData.description || '',
      tagline: newPlanData.tagline || '',
      badge: newPlanData.badge || 'Novo',
      monthlyPriceCents: Number(newPlanData.monthlyPriceCents) || 0,
      annualPriceCents: Number(newPlanData.annualPriceCents) || 0,
      mercadoPagoPlanId: newPlanData.mercadoPagoPlanId || '',
      isActive: true,
      highlighted: Boolean(newPlanData.highlighted),
      features: newPlanData.features || ['Recurso padrão'],
      limits: (newPlanData.limits as any) || {
        maxDebts: -1,
        maxAttachments: 50,
        maxStorageMb: 200,
        maxMonthlyIncomes: -1,
        maxMonthlyExpenses: -1,
      },
      flags: (newPlanData.flags as any) || {
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
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await adminCreatePlan(createdPlan);
    setIsCreatingNewPlan(false);
    setSelectedPlanId(createdPlan.id);
    await loadAdminData();
  };

  // --- Handlers para Usuários ---
  const handleChangeUserPlan = async (userId: string, newPlanId: string) => {
    if (!user?.email) return;
    const ok = await SubscriptionService.changeUserPlanAdmin(userId, newPlanId, user.email);
    if (ok) {
      showToast('Plano do usuário atualizado com sucesso no backend!', 'success');
      await loadAdminData();
    } else {
      showToast('Erro ao atualizar plano do usuário.', 'error');
    }
  };

  const handleToggleUserSuspension = async (userId: string, currentSuspended: boolean) => {
    if (!user?.email) return;
    const ok = await SubscriptionService.toggleUserSuspensionAdmin(userId, !currentSuspended, user.email);
    if (ok) {
      showToast(!currentSuspended ? 'Conta do usuário suspensa com sucesso.' : 'Conta reativada com sucesso.', 'info');
      await loadAdminData();
    } else {
      showToast('Erro ao alterar status da conta.', 'error');
    }
  };

  // Usuários filtrados
  const filteredUsers = adminUsers.filter((u) => {
    const matchesSearch =
      (u.name && u.name.toLowerCase().includes(userSearchQuery.toLowerCase())) ||
      (u.email && u.email.toLowerCase().includes(userSearchQuery.toLowerCase())) ||
      u.id.toLowerCase().includes(userSearchQuery.toLowerCase());

    const matchesPlan = userPlanFilter === 'all' || u.planId === userPlanFilter;
    return matchesSearch && matchesPlan;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in duration-300">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800 mb-8">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400 bg-purple-500/10 px-2.5 py-0.5 rounded-full flex items-center gap-1">
              <Lock className="w-3 h-3" />
              Painel Administrativo QuitaÍ
            </span>
            <span className="text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full font-semibold">
              Mercado Pago Integrado
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-1">
            Gestão de Planos, Usuários & Assinaturas
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Administrador autenticado: <strong className="text-slate-700 dark:text-slate-300">{user?.email}</strong>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              refreshPlans();
              loadAdminData();
              showToast('Dados sincronizados com o backend.', 'info');
            }}
            className="py-2.5 px-3.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
            title="Recarregar dados"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoadingData ? 'animate-spin' : ''}`} />
            Sincronizar
          </button>
          <button
            onClick={onBackToDashboard}
            className="py-2.5 px-4 bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 rounded-xl text-xs font-bold transition-all"
          >
            Voltar ao App
          </button>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex flex-wrap gap-2 mb-8 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('plans')}
          className={`py-2 px-4 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'plans'
              ? 'bg-purple-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Layers className="w-4 h-4" />
          Gerenciar Planos ({plans.length})
        </button>

        <button
          onClick={() => setActiveTab('users')}
          className={`py-2 px-4 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'users'
              ? 'bg-purple-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Users className="w-4 h-4" />
          Usuários ({adminUsers.length})
        </button>

        <button
          onClick={() => setActiveTab('subscriptions')}
          className={`py-2 px-4 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'subscriptions'
              ? 'bg-purple-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          Assinaturas & Faturas
        </button>

        <button
          onClick={() => setActiveTab('mercadopago')}
          className={`py-2 px-4 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'mercadopago'
              ? 'bg-purple-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Activity className="w-4 h-4" />
          Mercado Pago & Logs ({adminWebhookLogs.length})
        </button>
      </div>

      {/* ========================================================= */}
      {/* TAB 1: GERENCIAMENTO DE PLANOS */}
      {/* ========================================================= */}
      {activeTab === 'plans' && (
        <div className="space-y-8">
          {/* Quick Actions & Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Planos Cadastrados no Banco de Dados
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Crie novos planos, edite preços, altere recursos e associe identificadores do Mercado Pago sem alterar o código.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsCreatingNewPlan(true)}
                className="py-2 px-3.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                Cadastrar Novo Plano
              </button>
              <button
                type="button"
                onClick={adminResetPlans}
                className="py-2 px-3 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold transition-all flex items-center gap-1"
                title="Restaurar padrões de fábrica"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Restaurar Padrão
              </button>
            </div>
          </div>

          {/* Modal de Criação de Novo Plano */}
          {isCreatingNewPlan && (
            <div className="p-6 bg-purple-500/5 border-2 border-purple-500/30 rounded-3xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-purple-500/20">
                <h4 className="text-base font-bold text-purple-900 dark:text-purple-300 flex items-center gap-2">
                  <Plus className="w-4 h-4 text-purple-500" />
                  Cadastrar Novo Plano no Banco de Dados
                </h4>
                <button
                  onClick={() => setIsCreatingNewPlan(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCreateNewPlan} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Identificador (ID do Plano) *
                    </label>
                    <input
                      type="text"
                      placeholder="ex: familia, empresarial"
                      value={newPlanData.id || ''}
                      onChange={(e) => setNewPlanData({ ...newPlanData, id: e.target.value })}
                      required
                      className="w-full text-xs p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Nome de Exibição *
                    </label>
                    <input
                      type="text"
                      placeholder="ex: QuitaÍ Família"
                      value={newPlanData.name || ''}
                      onChange={(e) => setNewPlanData({ ...newPlanData, name: e.target.value })}
                      required
                      className="w-full text-xs p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Badge / Selo Visual
                    </label>
                    <input
                      type="text"
                      placeholder="ex: Mais Vendido, VIP"
                      value={newPlanData.badge || ''}
                      onChange={(e) => setNewPlanData({ ...newPlanData, badge: e.target.value })}
                      className="w-full text-xs p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Preço Mensal (em centavos: R$ 29,90 = 2990)
                    </label>
                    <input
                      type="number"
                      value={newPlanData.monthlyPriceCents || 0}
                      onChange={(e) =>
                        setNewPlanData({ ...newPlanData, monthlyPriceCents: Number(e.target.value) })
                      }
                      className="w-full text-xs p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                    />
                    <p className="text-[10px] text-slate-500 mt-1">
                      Equivalente: {formatCurrencyCents(newPlanData.monthlyPriceCents || 0)}
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Preço Anual (em centavos: R$ 299,00 = 29900)
                    </label>
                    <input
                      type="number"
                      value={newPlanData.annualPriceCents || 0}
                      onChange={(e) =>
                        setNewPlanData({ ...newPlanData, annualPriceCents: Number(e.target.value) })
                      }
                      className="w-full text-xs p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                    />
                    <p className="text-[10px] text-slate-500 mt-1">
                      Equivalente: {formatCurrencyCents(newPlanData.annualPriceCents || 0)}
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      ID Plano Mercado Pago (Opcional)
                    </label>
                    <input
                      type="text"
                      placeholder="ex: 2c93808479..."
                      value={newPlanData.mercadoPagoPlanId || ''}
                      onChange={(e) =>
                        setNewPlanData({ ...newPlanData, mercadoPagoPlanId: e.target.value })
                      }
                      className="w-full text-xs p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Descrição do Plano
                  </label>
                  <input
                    type="text"
                    placeholder="Descrição detalhada exibida na tela de contratação"
                    value={newPlanData.description || ''}
                    onChange={(e) => setNewPlanData({ ...newPlanData, description: e.target.value })}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsCreatingNewPlan(false)}
                    className="py-2 px-4 rounded-xl text-xs font-bold bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="py-2 px-5 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white shadow-md flex items-center gap-1.5"
                  >
                    <Save className="w-3.5 h-3.5" />
                    Salvar no Banco de Dados
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Cards dos Planos e Seletor */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {plans.map((p) => {
              const isSelected = p.id === selectedPlanId;
              const usersInPlan = adminUsers.filter((u) => u.planId === p.id).length;

              return (
                <div
                  key={p.id}
                  onClick={() => setSelectedPlanId(p.id)}
                  className={`p-5 rounded-2xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'border-purple-500 bg-purple-500/5 ring-2 ring-purple-500/20 shadow-md'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                        p.isActive !== false
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                          : 'bg-red-500/10 text-red-600 dark:text-red-400'
                      }`}
                    >
                      {p.isActive !== false ? 'Ativo' : 'Desativado'}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleTogglePlan(p.id, p.isActive !== false);
                      }}
                      className="text-[10px] font-bold text-slate-500 hover:text-purple-600 underline"
                    >
                      {p.isActive !== false ? 'Desativar' : 'Ativar'}
                    </button>
                  </div>

                  <h4 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-1">
                    {p.name}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {formatCurrencyCents(p.monthlyPriceCents)}/mês
                  </p>

                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-purple-500" />
                      {usersInPlan} usuário(s)
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">ID: {p.id}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Form de Edição do Plano Selecionado */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800 mb-6">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Editar Plano: {formData.name}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Alterações salvas serão propagadas imediatamente para a tela de contratação e para o banco de dados.
                </p>
              </div>
              <span className="text-xs font-mono bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-xl text-slate-600 dark:text-slate-300">
                Código: {formData.id}
              </span>
            </div>

            <form onSubmit={handleSavePlan} className="space-y-6">
              {/* Informações Básicas */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Nome do Plano
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Preço Mensal (Centavos)
                  </label>
                  <input
                    type="number"
                    value={formData.monthlyPriceCents}
                    onChange={(e) =>
                      setFormData({ ...formData, monthlyPriceCents: Number(e.target.value) })
                    }
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    Valor: {formatCurrencyCents(formData.monthlyPriceCents)}
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Preço Anual (Centavos)
                  </label>
                  <input
                    type="number"
                    value={formData.annualPriceCents}
                    onChange={(e) =>
                      setFormData({ ...formData, annualPriceCents: Number(e.target.value) })
                    }
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    Valor: {formatCurrencyCents(formData.annualPriceCents)}
                  </p>
                </div>
              </div>

              {/* Mercado Pago & Descrição */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Identificador no Mercado Pago (Preapproval / Plan ID)
                  </label>
                  <input
                    type="text"
                    value={formData.mercadoPagoPlanId || ''}
                    placeholder="ex: 2c93808479..."
                    onChange={(e) => setFormData({ ...formData, mercadoPagoPlanId: e.target.value })}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    Utilizado para associar com o plano de assinatura recorrente no Mercado Pago.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Tagline de Vendas
                  </label>
                  <input
                    type="text"
                    value={formData.tagline || ''}
                    onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Limites de Utilização */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-700/60 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                  Limites Operacionais do Plano
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                      Limite de Dívidas (-1 = Ilimitado)
                    </label>
                    <input
                      type="number"
                      value={formData.limits.maxDebts}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          limits: { ...formData.limits, maxDebts: Number(e.target.value) },
                        })
                      }
                      className="w-full text-xs p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                      Limite de Anexos (-1 = Ilimitado)
                    </label>
                    <input
                      type="number"
                      value={formData.limits.maxAttachments}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          limits: { ...formData.limits, maxAttachments: Number(e.target.value) },
                        })
                      }
                      className="w-full text-xs p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                      Armazenamento em Nuvem (MB)
                    </label>
                    <input
                      type="number"
                      value={formData.limits.maxStorageMb}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          limits: { ...formData.limits, maxStorageMb: Number(e.target.value) },
                        })
                      }
                      className="w-full text-xs p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Botão de Salvar */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-800">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isActive !== false}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="w-4 h-4 text-purple-600 rounded"
                  />
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Plano Ativo (Disponível para novos usuários na tela de planos)
                  </span>
                </label>

                <button
                  type="submit"
                  className="py-3 px-6 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold shadow-md shadow-purple-500/25 transition-all flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  Salvar Alterações no Banco de Dados
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 2: GERENCIAMENTO DE USUÁRIOS */}
      {/* ========================================================= */}
      {activeTab === 'users' && (
        <div className="space-y-6">
          {/* Barra de Pesquisa e Filtros */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Pesquisar por nome, email ou ID do usuário..."
                value={userSearchQuery}
                onChange={(e) => setUserSearchQuery(e.target.value)}
                className="w-full text-xs pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Filtrar Plano:</span>
              <select
                value={userPlanFilter}
                onChange={(e) => setUserPlanFilter(e.target.value)}
                className="text-xs py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white"
              >
                <option value="all">Todos os Planos</option>
                {plans.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Tabela de Usuários */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 uppercase font-bold text-[10px]">
                  <tr>
                    <th className="py-3.5 px-4">Usuário</th>
                    <th className="py-3.5 px-4">Plano Atual</th>
                    <th className="py-3.5 px-4">Status Assinatura</th>
                    <th className="py-3.5 px-4">Cadastro</th>
                    <th className="py-3.5 px-4 text-right">Ações Administrativas</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-400">
                        Nenhum usuário encontrado com os filtros selecionados.
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((u) => {
                      const userPlan = plans.find((p) => p.id === u.planId) || { name: u.planId || 'Grátis' };
                      const isSuspended = Boolean(u.isSuspended);

                      return (
                        <tr key={u.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                          <td className="py-3.5 px-4">
                            <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                              {u.name}
                              {u.role === 'admin' && (
                                <span className="text-[9px] font-black uppercase tracking-wider bg-purple-500/10 text-purple-600 px-1.5 py-0.5 rounded">
                                  Admin
                                </span>
                              )}
                            </div>
                            <div className="text-slate-400 text-[11px] font-mono">{u.email}</div>
                          </td>

                          <td className="py-3.5 px-4">
                            <span className="inline-flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-300">
                              <Sparkles className="w-3 h-3 text-purple-500" />
                              {userPlan.name}
                            </span>
                          </td>

                          <td className="py-3.5 px-4">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                isSuspended
                                  ? 'bg-red-500/10 text-red-600'
                                  : u.subscriptionStatus === 'active'
                                  ? 'bg-emerald-500/10 text-emerald-600'
                                  : 'bg-amber-500/10 text-amber-600'
                              }`}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${
                                  isSuspended ? 'bg-red-500' : 'bg-emerald-500'
                                }`}
                              />
                              {isSuspended ? 'Conta Suspensa' : u.subscriptionStatus || 'Ativa'}
                            </span>
                          </td>

                          <td className="py-3.5 px-4 text-slate-500 text-[11px]">
                            {u.createdAt ? new Date(u.createdAt).toLocaleDateString('pt-BR') : '—'}
                          </td>

                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {/* Seletor de Mudança de Plano */}
                              <select
                                value={u.planId || 'gratis'}
                                onChange={(e) => handleChangeUserPlan(u.id, e.target.value)}
                                className="text-[11px] py-1 px-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300"
                                title="Alterar plano do usuário"
                              >
                                {plans.map((p) => (
                                  <option key={p.id} value={p.id}>
                                    Mudar p/ {p.name}
                                  </option>
                                ))}
                              </select>

                              {/* Suspender / Reativar */}
                              <button
                                type="button"
                                onClick={() => handleToggleUserSuspension(u.id, isSuspended)}
                                className={`p-1.5 rounded-lg text-xs font-semibold transition-all ${
                                  isSuspended
                                    ? 'bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20'
                                    : 'bg-red-500/10 text-red-600 hover:bg-red-500/20'
                                }`}
                                title={isSuspended ? 'Reativar conta' : 'Suspender conta'}
                              >
                                {isSuspended ? <UserCheck className="w-3.5 h-3.5" /> : <UserX className="w-3.5 h-3.5" />}
                              </button>

                              {/* Ver histórico de pagamentos */}
                              <button
                                type="button"
                                onClick={() => setSelectedUserForInvoices(u)}
                                className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300"
                                title="Consultar faturas"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Modal de Histórico de Faturas do Usuário */}
          {selectedUserForInvoices && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden p-6 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      Histórico Financeiro: {selectedUserForInvoices.name}
                    </h3>
                    <p className="text-xs text-slate-500">{selectedUserForInvoices.email}</p>
                  </div>
                  <button
                    onClick={() => setSelectedUserForInvoices(null)}
                    className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="overflow-y-auto space-y-3">
                  {adminInvoices.filter((inv) => inv.userId === selectedUserForInvoices.id).length === 0 ? (
                    <div className="py-8 text-center text-slate-400 text-xs">
                      Nenhum registro de pagamento financeiro registrado para este usuário.
                    </div>
                  ) : (
                    adminInvoices
                      .filter((inv) => inv.userId === selectedUserForInvoices.id)
                      .map((inv) => (
                        <div
                          key={inv.id}
                          className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 flex items-center justify-between text-xs"
                        >
                          <div>
                            <div className="font-bold text-slate-900 dark:text-white">{inv.planName}</div>
                            <div className="text-[11px] text-slate-400">
                              {new Date(inv.createdAt).toLocaleString('pt-BR')} • Recibo: {inv.receiptNumber}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-black text-emerald-600 dark:text-emerald-400">
                              {formatCurrencyCents(inv.amountCents)}
                            </div>
                            <span className="text-[10px] uppercase font-bold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                              {inv.status}
                            </span>
                          </div>
                        </div>
                      ))
                  )}
                </div>

                <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end">
                  <button
                    onClick={() => setSelectedUserForInvoices(null)}
                    className="py-2 px-4 bg-slate-900 text-white rounded-xl text-xs font-bold"
                  >
                    Fechar
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 3: GERENCIAMENTO DE ASSINATURAS & FATURAS */}
      {/* ========================================================= */}
      {activeTab === 'subscriptions' && (
        <div className="space-y-6">
          {/* Header & Status Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4">
              <span className="text-xs text-slate-500">Assinaturas Ativas</span>
              <p className="text-2xl font-black text-emerald-600 mt-1">
                {Object.values(adminSubscriptions).filter((s) => s.status === 'active').length || adminUsers.length}
              </p>
            </div>
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4">
              <span className="text-xs text-slate-500">Pagamentos Confirmados</span>
              <p className="text-2xl font-black text-sky-600 mt-1">
                {adminInvoices.filter((i) => i.status === 'paid').length}
              </p>
            </div>
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4">
              <span className="text-xs text-slate-500">Recusados / Falhas</span>
              <p className="text-2xl font-black text-red-500 mt-1">
                {adminInvoices.filter((i) => i.status === 'failed').length}
              </p>
            </div>
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4">
              <span className="text-xs text-slate-500">Receita Total Confirmada</span>
              <p className="text-2xl font-black text-purple-600 mt-1">
                {formatCurrencyCents(
                  adminInvoices
                    .filter((i) => i.status === 'paid')
                    .reduce((acc, curr) => acc + curr.amountCents, 0)
                )}
              </p>
            </div>
          </div>

          {/* Histórico Completo de Faturas */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-purple-500" />
                Histórico Consolidado de Pagamentos (Mercado Pago)
              </h3>
              <span className="text-[11px] text-slate-500">
                Os dados financeiros nunca são excluídos após downgrades ou cancelamentos.
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 uppercase font-bold text-[10px]">
                  <tr>
                    <th className="py-3 px-4">Recibo / ID</th>
                    <th className="py-3 px-4">Cliente</th>
                    <th className="py-3 px-4">Plano</th>
                    <th className="py-3 px-4">Valor</th>
                    <th className="py-3 px-4">Método</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Data Pagamento</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {adminInvoices.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400">
                        Nenhuma fatura registrada no banco de dados.
                      </td>
                    </tr>
                  ) : (
                    adminInvoices.map((inv) => (
                      <tr key={inv.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                        <td className="py-3 px-4 font-mono text-[11px] text-slate-600 dark:text-slate-400">
                          {inv.receiptNumber || inv.id}
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-900 dark:text-white">{inv.userName}</div>
                          <div className="text-[10px] text-slate-400">{inv.userEmail}</div>
                        </td>
                        <td className="py-3 px-4 font-medium text-slate-700 dark:text-slate-300">
                          {inv.planName} ({inv.billingCycle === 'annual' ? 'Anual' : 'Mensal'})
                        </td>
                        <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                          {formatCurrencyCents(inv.amountCents)}
                        </td>
                        <td className="py-3 px-4 uppercase text-[10px] font-bold text-slate-500">
                          {inv.paymentMethod}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              inv.status === 'paid'
                                ? 'bg-emerald-500/10 text-emerald-600'
                                : inv.status === 'pending'
                                ? 'bg-amber-500/10 text-amber-600'
                                : 'bg-red-500/10 text-red-600'
                            }`}
                          >
                            {inv.status === 'paid' ? 'Confirmado' : inv.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-500 text-[11px]">
                          {inv.paidAt ? new Date(inv.paidAt).toLocaleString('pt-BR') : '—'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 4: MERCADO PAGO, WEBHOOKS & AUDITORIA */}
      {/* ========================================================= */}
      {activeTab === 'mercadopago' && (
        <div className="space-y-8">
          {/* Status do Gateway Mercado Pago */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center font-black">
                  MP
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Integração Oficial com Mercado Pago
                  </h3>
                  <p className="text-xs text-slate-500">
                    Credenciais seguras gerenciadas exclusivamente pelo servidor backend.
                  </p>
                </div>
              </div>

              <span
                className={`text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1.5 ${
                  gatewayStatus?.configured
                    ? 'bg-emerald-500/10 text-emerald-600'
                    : 'bg-amber-500/10 text-amber-600'
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    gatewayStatus?.configured ? 'bg-emerald-500' : 'bg-amber-500'
                  }`}
                />
                {gatewayStatus?.configured ? 'Chave de Produção Configurada' : 'Modo Seguro / Sandbox'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl">
                <span className="text-slate-400 block mb-1">Webhook URL Oficial:</span>
                <span className="font-mono text-purple-600 dark:text-purple-400 font-semibold break-all">
                  /api/webhooks/mercadopago
                </span>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl">
                <span className="text-slate-400 block mb-1">Chave Pública Mercado Pago:</span>
                <span className="font-mono text-slate-700 dark:text-slate-300">
                  {gatewayStatus?.publicKeyMasked || 'APP_USR-***'}
                </span>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl">
                <span className="text-slate-400 block mb-1">Access Token Backend:</span>
                <span className="font-mono text-slate-700 dark:text-slate-300">
                  {gatewayStatus?.hasAccessToken ? '●●●●●●●●●●●● (Protegido)' : 'Não configurado'}
                </span>
              </div>
            </div>
          </div>

          {/* Webhook Logs */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Activity className="w-4 h-4 text-sky-500" />
                Registros de Notificações Recebidas (Webhook Logs)
              </h3>
              <span className="text-[11px] text-slate-500">Últimos eventos do Mercado Pago</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 uppercase font-bold text-[10px]">
                  <tr>
                    <th className="py-2.5 px-4">Data/Hora</th>
                    <th className="py-2.5 px-4">Tipo de Ação</th>
                    <th className="py-2.5 px-4">Recurso / ID</th>
                    <th className="py-2.5 px-4">Status Retornado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono text-[11px]">
                  {adminWebhookLogs.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-6 text-center text-slate-400 font-sans">
                        Nenhuma notificação de webhook recebida ainda.
                      </td>
                    </tr>
                  ) : (
                    adminWebhookLogs.map((log, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                        <td className="py-2.5 px-4 text-slate-500">
                          {new Date(log.receivedAt).toLocaleString('pt-BR')}
                        </td>
                        <td className="py-2.5 px-4 font-bold text-purple-600 dark:text-purple-400">
                          {log.action || log.type}
                        </td>
                        <td className="py-2.5 px-4 text-slate-700 dark:text-slate-300">
                          {log.dataId || '—'}
                        </td>
                        <td className="py-2.5 px-4">
                          <span className="text-emerald-600 font-bold bg-emerald-500/10 px-2 py-0.5 rounded">
                            {log.status || 'processed'}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Audit Logs */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-amber-500" />
                Trilha de Auditoria Administrativa (Audit Logs)
              </h3>
              <span className="text-[11px] text-slate-500">
                Ações de administradores registradas para fins de conformidade
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 uppercase font-bold text-[10px]">
                  <tr>
                    <th className="py-2.5 px-4">Data/Hora</th>
                    <th className="py-2.5 px-4">Administrador</th>
                    <th className="py-2.5 px-4">Ação</th>
                    <th className="py-2.5 px-4">Alvo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono text-[11px]">
                  {adminAuditLogs.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-6 text-center text-slate-400 font-sans">
                        Nenhuma ação de auditoria registrada até o momento.
                      </td>
                    </tr>
                  ) : (
                    adminAuditLogs.map((log, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                        <td className="py-2.5 px-4 text-slate-500">
                          {new Date(log.timestamp).toLocaleString('pt-BR')}
                        </td>
                        <td className="py-2.5 px-4 text-slate-700 dark:text-slate-300 font-bold">
                          {log.adminEmail}
                        </td>
                        <td className="py-2.5 px-4 text-purple-600 dark:text-purple-400">
                          {log.action}
                        </td>
                        <td className="py-2.5 px-4 text-slate-500">
                          {log.target || '—'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
