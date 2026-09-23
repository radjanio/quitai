/**
 * QuitaÍ — Painel de Administração e Gestão de Assinaturas
 * Permite alterar preços, limites, recursos, usuários e gateways sem mexer em código
 */

import React, { useState } from 'react';
import {
  ShieldAlert,
  Settings,
  Users,
  DollarSign,
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
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useSubscription } from '../../context/SubscriptionContext';
import { useFinance } from '../../context/FinanceContext';
import { AuthStorageService } from '../../services/authStorage';
import { SubscriptionService } from '../../services/subscriptionService';
import { PlanConfig, PlanTier } from '../../types/subscription';
import { formatCurrencyCents } from '../../utils/currency';

interface AdminDashboardViewProps {
  onBackToDashboard: () => void;
}

export const AdminDashboardView: React.FC<AdminDashboardViewProps> = ({ onBackToDashboard }) => {
  const { user, isAdmin } = useAuth();
  const {
    plans,
    adminUpdatePlan,
    adminResetPlans,
    gatewayConfig,
    adminUpdateGatewayConfig,
  } = useSubscription();
  const { showToast } = useFinance();

  const [activeTab, setActiveTab] = useState<'plans' | 'users' | 'gateway' | 'metrics'>('plans');
  const [selectedPlanId, setSelectedPlanId] = useState<PlanTier>('plus');
  const [allUsers, setAllUsers] = useState(() => AuthStorageService.getUsers());

  // Editing copy of selected plan
  const activePlanToEdit = plans.find((p) => p.id === selectedPlanId) || plans[0];
  const [formData, setFormData] = useState<PlanConfig>(activePlanToEdit);

  // When selected plan changes, update form data
  const handleSelectPlanToEdit = (id: PlanTier) => {
    setSelectedPlanId(id);
    const target = plans.find((p) => p.id === id) || plans[0];
    setFormData({ ...target });
  };

  // Gateway form state
  const [gatewayForm, setGatewayForm] = useState({ ...gatewayConfig });

  // Webhook Simulator state
  const [simulatedEvent, setSimulatedEvent] = useState('checkout.session.completed');
  const [simulatedUserId, setSimulatedUserId] = useState(user?.id || 'usr_demo_quitai');
  const [webhookLog, setWebhookLog] = useState<string | null>(null);

  // Security check: if not admin, show Access Denied
  if (!isAdmin) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="w-16 h-16 rounded-3xl bg-red-500/10 text-red-500 flex items-center justify-center mx-auto mb-4">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Acesso Restrito</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
          Esta área é restrita a administradores autorizados do QuitaÍ.
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

  const handleSavePlan = (e: React.FormEvent) => {
    e.preventDefault();
    adminUpdatePlan(formData);
  };

  const handleSaveGateway = (e: React.FormEvent) => {
    e.preventDefault();
    adminUpdateGatewayConfig(gatewayForm);
  };

  const handleSimulateWebhook = () => {
    const timestamp = new Date().toLocaleTimeString();
    if (simulatedEvent === 'checkout.session.completed') {
      SubscriptionService.subscribeUser(
        simulatedUserId,
        'Usuário Simulado',
        'simulado@quitai.com.br',
        'plus',
        'monthly',
        'pix'
      );
      setWebhookLog(
        `[${timestamp}] 200 OK — Event: checkout.session.completed | User: ${simulatedUserId} upgraded to 'plus' via webhook.`
      );
      showToast('Webhook simulado processado com sucesso!', 'success');
    } else if (simulatedEvent === 'customer.subscription.deleted') {
      SubscriptionService.cancelUserSubscription(simulatedUserId);
      setWebhookLog(
        `[${timestamp}] 200 OK — Event: customer.subscription.deleted | User: ${simulatedUserId} status updated to cancelAtPeriodEnd.`
      );
      showToast('Webhook de cancelamento processado.', 'info');
    }
  };

  const handleManuallyChangeUserPlan = (userId: string, newPlan: PlanTier) => {
    const targetUser = allUsers.find((u) => u.id === userId);
    if (!targetUser) return;
    SubscriptionService.subscribeUser(
      userId,
      targetUser.name,
      targetUser.email,
      newPlan,
      'monthly',
      'pix'
    );
    showToast(`Plano do usuário ${targetUser.name} alterado para ${newPlan.toUpperCase()}.`, 'success');
    setAllUsers([...AuthStorageService.getUsers()]);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in duration-300">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800 mb-8">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400 bg-purple-500/10 px-2.5 py-0.5 rounded-full flex items-center gap-1">
              <Lock className="w-3 h-3" />
              Painel Administrativo
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Ambiente de Governança
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-1">
            Gestão de Planos, Preços e Gateways
          </h1>
        </div>

        <button
          onClick={onBackToDashboard}
          className="self-start sm:self-auto py-2 px-4 rounded-xl text-xs font-bold bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors"
        >
          Voltar ao App
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-200 dark:border-slate-800 mb-8">
        <button
          onClick={() => setActiveTab('plans')}
          className={`flex items-center gap-2 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all shrink-0 ${
            activeTab === 'plans'
              ? 'bg-purple-600 text-white shadow-md shadow-purple-500/20'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Settings className="w-4 h-4" />
          Planos e Limites
        </button>

        <button
          onClick={() => setActiveTab('users')}
          className={`flex items-center gap-2 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all shrink-0 ${
            activeTab === 'users'
              ? 'bg-purple-600 text-white shadow-md shadow-purple-500/20'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Users className="w-4 h-4" />
          Usuários e Assinaturas
        </button>

        <button
          onClick={() => setActiveTab('gateway')}
          className={`flex items-center gap-2 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all shrink-0 ${
            activeTab === 'gateway'
              ? 'bg-purple-600 text-white shadow-md shadow-purple-500/20'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          Provedores de Pagamento
        </button>

        <button
          onClick={() => setActiveTab('metrics')}
          className={`flex items-center gap-2 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all shrink-0 ${
            activeTab === 'metrics'
              ? 'bg-purple-600 text-white shadow-md shadow-purple-500/20'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Activity className="w-4 h-4" />
          Métricas e Faturamento
        </button>
      </div>

      {/* TAB 1: Planos e Limites */}
      {activeTab === 'plans' && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Plan Selector Sidebar */}
          <div className="lg:col-span-1 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              Selecione o Plano para Editar
            </h3>
            {plans.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => handleSelectPlanToEdit(p.id)}
                className={`w-full p-4 rounded-2xl border text-left transition-all ${
                  selectedPlanId === p.id
                    ? 'border-purple-500 bg-purple-500/10 text-purple-700 dark:text-purple-300 shadow-sm ring-2 ring-purple-500/20'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm">{p.name}</span>
                  <span className="text-xs font-semibold">
                    {formatCurrencyCents(p.monthlyPriceCents)}/mês
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 truncate">
                  {p.tagline}
                </p>
              </button>
            ))}

            <button
              type="button"
              onClick={adminResetPlans}
              className="w-full mt-4 py-2.5 px-4 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Restaurar Padrões de Fábrica
            </button>
          </div>

          {/* Plan Editor Form */}
          <div className="lg:col-span-3">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm">
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                    Configurando: {formData.name}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Modifique preços, limites de armazenamento e liberação de recursos sem alterar código.
                  </p>
                </div>
                <span className="text-xs font-mono bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-md text-slate-600 dark:text-slate-400">
                  ID: {formData.id}
                </span>
              </div>

              <form onSubmit={handleSavePlan} className="space-y-6">
                {/* Basic info */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Nome de Exibição
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-2 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Badge Promocional
                    </label>
                    <input
                      type="text"
                      value={formData.badge || ''}
                      onChange={(e) => setFormData({ ...formData, badge: e.target.value })}
                      placeholder="Ex: Mais Popular, VIP"
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-2 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Descrição Curta (Tagline)
                  </label>
                  <input
                    type="text"
                    value={formData.tagline}
                    onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-2 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  />
                </div>

                {/* Pricing in Cents */}
                <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Preços e Cobrança
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Preço Mensal (em centavos de Real)
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="10"
                        value={formData.monthlyPriceCents}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            monthlyPriceCents: parseInt(e.target.value, 10) || 0,
                          })
                        }
                        className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-2 text-sm text-slate-900 dark:text-white font-mono focus:ring-2 focus:ring-purple-500 focus:outline-none"
                      />
                      <p className="text-[11px] text-slate-500 mt-1">
                        Equivalente: {formatCurrencyCents(formData.monthlyPriceCents)}/mês
                      </p>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Preço Anual (em centavos de Real)
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="10"
                        value={formData.annualPriceCents}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            annualPriceCents: parseInt(e.target.value, 10) || 0,
                          })
                        }
                        className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-2 text-sm text-slate-900 dark:text-white font-mono focus:ring-2 focus:ring-purple-500 focus:outline-none"
                      />
                      <p className="text-[11px] text-slate-500 mt-1">
                        Equivalente: {formatCurrencyCents(formData.annualPriceCents)}/ano
                      </p>
                    </div>
                  </div>
                </div>

                {/* Usage Limits */}
                <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Limites de Uso (-1 = Ilimitado)
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Máximo de Dívidas
                      </label>
                      <input
                        type="number"
                        value={formData.limits.maxDebts}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            limits: {
                              ...formData.limits,
                              maxDebts: parseInt(e.target.value, 10) || -1,
                            },
                          })
                        }
                        className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-2 text-sm text-slate-900 dark:text-white font-mono focus:ring-2 focus:ring-purple-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Máximo de Anexos
                      </label>
                      <input
                        type="number"
                        value={formData.limits.maxAttachments}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            limits: {
                              ...formData.limits,
                              maxAttachments: parseInt(e.target.value, 10) || -1,
                            },
                          })
                        }
                        className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-2 text-sm text-slate-900 dark:text-white font-mono focus:ring-2 focus:ring-purple-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Armazenamento (MB)
                      </label>
                      <input
                        type="number"
                        value={formData.limits.maxStorageMb}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            limits: {
                              ...formData.limits,
                              maxStorageMb: parseInt(e.target.value, 10) || 15,
                            },
                          })
                        }
                        className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-2 text-sm text-slate-900 dark:text-white font-mono focus:ring-2 focus:ring-purple-500 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Feature Flags */}
                <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Controle de Acesso a Recursos (Feature Flags)
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <label className="flex items-center gap-3 p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.flags.hasInvestments}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            flags: { ...formData.flags, hasInvestments: e.target.checked },
                          })
                        }
                        className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500"
                      />
                      <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Módulo de Investimentos
                      </span>
                    </label>

                    <label className="flex items-center gap-3 p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.flags.hasAdvancedReports}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            flags: { ...formData.flags, hasAdvancedReports: e.target.checked },
                          })
                        }
                        className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500"
                      />
                      <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Relatórios Financeiros Avançados
                      </span>
                    </label>

                    <label className="flex items-center gap-3 p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.flags.hasDebtPayoffSimulator}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            flags: { ...formData.flags, hasDebtPayoffSimulator: e.target.checked },
                          })
                        }
                        className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500"
                      />
                      <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Simulador de Quitação Acelerada
                      </span>
                    </label>

                    <label className="flex items-center gap-3 p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.flags.hasPdfExport}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            flags: { ...formData.flags, hasPdfExport: e.target.checked },
                          })
                        }
                        className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500"
                      />
                      <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Exportação em PDF
                      </span>
                    </label>
                  </div>
                </div>

                <div className="flex justify-end pt-4">
                  <button
                    type="submit"
                    className="py-3 px-6 bg-purple-600 hover:bg-purple-700 text-white rounded-2xl font-bold text-sm shadow-md shadow-purple-500/20 flex items-center gap-2 transition-all"
                  >
                    <Save className="w-4 h-4" />
                    Salvar Alterações do {formData.name}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Usuários e Assinaturas */}
      {activeTab === 'users' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm">
          <div className="mb-6">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Usuários e Assinaturas Ativas
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Gerencie assinaturas diretamente, conceda upgrades manuais e audite o status de cada conta.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-xs font-bold uppercase tracking-wider text-slate-400">
                  <th className="py-3 px-4">Nome / E-mail</th>
                  <th className="py-3 px-4">Plano Atual</th>
                  <th className="py-3 px-4">Status da Assinatura</th>
                  <th className="py-3 px-4">Ações do Administrador</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {allUsers.map((u) => {
                  const sub = SubscriptionService.getUserSubscription(u.id);
                  const plan = SubscriptionService.getPlanById(sub.planId);

                  return (
                    <tr key={u.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                      <td className="py-3 px-4">
                        <p className="font-bold text-slate-900 dark:text-white text-xs">{u.name}</p>
                        <p className="text-[11px] text-slate-400">{u.email}</p>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${
                            sub.planId === 'premium'
                              ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400'
                              : sub.planId === 'plus'
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                          }`}
                        >
                          {plan.name}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                          <CheckCircle className="w-3.5 h-3.5" />
                          {sub.cancelAtPeriodEnd ? 'Cancelamento Agendado' : 'Ativo'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleManuallyChangeUserPlan(u.id, 'gratis')}
                            className="text-[11px] font-semibold py-1 px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
                          >
                            Set Grátis
                          </button>
                          <button
                            type="button"
                            onClick={() => handleManuallyChangeUserPlan(u.id, 'plus')}
                            className="text-[11px] font-semibold py-1 px-2.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300"
                          >
                            Set Plus
                          </button>
                          <button
                            type="button"
                            onClick={() => handleManuallyChangeUserPlan(u.id, 'premium')}
                            className="text-[11px] font-semibold py-1 px-2.5 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 text-purple-700 dark:text-purple-300"
                          >
                            Set Premium
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: Provedores de Pagamento e Webhooks */}
      {activeTab === 'gateway' && (
        <div className="space-y-8">
          {/* Gateway Settings Form */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm">
            <div className="mb-6">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Configuração dos Provedores (Stripe & Mercado Pago)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Ative o modo Sandbox para testes instantâneos ou configure as credenciais de produção.
              </p>
            </div>

            <form onSubmit={handleSaveGateway} className="space-y-6">
              {/* Active Provider & Sandbox Toggle */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Provedor Ativo
                  </label>
                  <select
                    value={gatewayForm.activeProvider}
                    onChange={(e) =>
                      setGatewayForm({
                        ...gatewayForm,
                        activeProvider: e.target.value as any,
                      })
                    }
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  >
                    <option value="sandbox">Sandbox Integrado (Ambiente de Testes)</option>
                    <option value="stripe">Stripe Payments (Brasil e Internacional)</option>
                    <option value="mercadopago">Mercado Pago (PIX e Cartões Locais)</option>
                  </select>
                </div>

                <div className="flex items-center">
                  <label className="flex items-center gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 w-full cursor-pointer">
                    <input
                      type="checkbox"
                      checked={gatewayForm.sandboxMode}
                      onChange={(e) =>
                        setGatewayForm({ ...gatewayForm, sandboxMode: e.target.checked })
                      }
                      className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500"
                    />
                    <div>
                      <span className="text-xs font-bold text-slate-900 dark:text-white block">
                        Modo Sandbox Ativo
                      </span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">
                        Simula aprovação de PIX e cartões de teste sem cobrança bancária real
                      </span>
                    </div>
                  </label>
                </div>
              </div>

              {/* Stripe Credentials */}
              <div className="p-5 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Credenciais Stripe
                  </h4>
                  <span className="text-[11px] text-emerald-600 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded-full">
                    Suporta PIX & Cartão
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Stripe Publishable Key
                    </label>
                    <input
                      type="text"
                      placeholder="pk_test_..."
                      value={gatewayForm.stripePublishableKey}
                      onChange={(e) =>
                        setGatewayForm({ ...gatewayForm, stripePublishableKey: e.target.value })
                      }
                      className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-2 text-xs font-mono text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Endpoint de Webhook do Servidor
                    </label>
                    <input
                      type="text"
                      readOnly
                      value={gatewayForm.webhookEndpointUrl}
                      className="w-full bg-slate-100 dark:bg-slate-800/60 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-2 text-xs font-mono text-slate-600 dark:text-slate-400 select-all"
                    />
                  </div>
                </div>
              </div>

              {/* Mercado Pago Credentials */}
              <div className="p-5 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Credenciais Mercado Pago
                  </h4>
                  <span className="text-[11px] text-sky-600 font-semibold bg-sky-500/10 px-2 py-0.5 rounded-full">
                    PIX Nativo Brasil
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Public Key Mercado Pago
                  </label>
                  <input
                    type="text"
                    placeholder="TEST-..."
                    value={gatewayForm.mercadoPagoPublicKey}
                    onChange={(e) =>
                      setGatewayForm({ ...gatewayForm, mercadoPagoPublicKey: e.target.value })
                    }
                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-2 text-xs font-mono text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  className="py-3 px-6 bg-purple-600 hover:bg-purple-700 text-white rounded-2xl font-bold text-sm shadow-md shadow-purple-500/20 flex items-center gap-2 transition-all"
                >
                  <Save className="w-4 h-4" />
                  Salvar Configurações de Pagamento
                </button>
              </div>
            </form>
          </div>

          {/* Webhook Testing Simulator */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">
              Simulador de Eventos de Webhook (Stripe / Mercado Pago)
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
              Teste como o QuitaÍ reage a notificações assíncronas de pagamento recebidas do provedor.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Evento Webhook
                </label>
                <select
                  value={simulatedEvent}
                  onChange={(e) => setSimulatedEvent(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-2 text-xs text-slate-900 dark:text-white"
                >
                  <option value="checkout.session.completed">
                    checkout.session.completed (Pagamento Aprovado)
                  </option>
                  <option value="customer.subscription.deleted">
                    customer.subscription.deleted (Cancelamento)
                  </option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  ID do Usuário Alvo
                </label>
                <input
                  type="text"
                  value={simulatedUserId}
                  onChange={(e) => setSimulatedUserId(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-2 text-xs font-mono text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex items-end">
                <button
                  type="button"
                  onClick={handleSimulateWebhook}
                  className="w-full py-2.5 px-4 bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-white text-white dark:text-slate-900 rounded-xl text-xs font-bold transition-all"
                >
                  Disparar Webhook
                </button>
              </div>
            </div>

            {webhookLog && (
              <div className="p-3 bg-slate-950 text-emerald-400 rounded-xl text-xs font-mono border border-slate-800">
                {webhookLog}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: Métricas e Faturamento */}
      {activeTab === 'metrics' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                MRR (Receita Recorrente Mensal)
              </span>
              <p className="text-3xl font-black text-slate-900 dark:text-white mt-2">
                R$ 1.480,00
              </p>
              <span className="text-[11px] text-emerald-600 font-semibold mt-1 inline-flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5" />
                +18.4% este mês
              </span>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Assinantes Pagos Ativos
              </span>
              <p className="text-3xl font-black text-slate-900 dark:text-white mt-2">42</p>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 block">
                31 Plus | 11 Premium
              </span>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Taxa de Churn (Cancelamentos)
              </span>
              <p className="text-3xl font-black text-slate-900 dark:text-white mt-2">1.2%</p>
              <span className="text-[11px] text-emerald-600 font-semibold mt-1 block">
                Abaixo da média de mercado (5%)
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
