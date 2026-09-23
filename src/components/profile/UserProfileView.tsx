import React, { useState, useEffect } from 'react';
import {
  User,
  Mail,
  Calendar,
  Lock,
  Eye,
  EyeOff,
  LogOut,
  Trash2,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Save,
  KeyRound,
  Database,
  Sparkles,
  CreditCard,
  Receipt,
  FileText,
  Check,
  ArrowRight,
  Clock,
  HardDrive,
  Layers,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useFinance } from '../../context/FinanceContext';
import { useSubscription } from '../../context/SubscriptionContext';
import { BillingCycle, PlanConfig } from '../../types/subscription';
import { formatDate } from '../../utils/dates';
import { formatCurrencyCents } from '../../utils/currency';
import { SupabaseConfigModal } from '../supabase/SupabaseConfigModal';

interface UserProfileViewProps {
  onBackToDashboard: () => void;
  onOpenPlans?: () => void;
  initialTab?: 'profile' | 'plans';
}

export const UserProfileView: React.FC<UserProfileViewProps> = ({
  onBackToDashboard,
  onOpenPlans,
  initialTab = 'profile',
}) => {
  const { user, updateName, changePassword, logout, deleteAccount } = useAuth();
  const { debts, installments, showToast } = useFinance();
  const {
    currentPlan,
    userSubscription,
    usageMetrics,
    invoices,
    cancelSubscription,
    reactivateSubscription,
    openCheckout,
    plans,
  } = useSubscription();

  // Active Tab: 'profile' | 'plans'
  const [activeTab, setActiveTab] = useState<'profile' | 'plans'>(initialTab);
  const [billingCycle, setBillingCycle] = useState<BillingCycle>(
    userSubscription?.billingCycle || 'monthly'
  );

  // Sync initialTab when prop changes
  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  // Name editing
  const [name, setName] = useState(user?.name || '');
  const [isUpdatingName, setIsUpdatingName] = useState(false);
  const [nameFeedback, setNameFeedback] = useState<string | null>(null);

  // Cancellation modal state
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);

  // Password changing
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [isChangingPass, setIsChangingPass] = useState(false);

  // Delete account modal
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteConfirmationText, setDeleteConfirmationText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Supabase RLS modal
  const [isSupabaseModalOpen, setIsSupabaseModalOpen] = useState(false);

  if (!user) return null;

  // Handle Name update
  const handleUpdateName = (e: React.FormEvent) => {
    e.preventDefault();
    setNameFeedback(null);
    try {
      setIsUpdatingName(true);
      updateName(name);
      setNameFeedback('Nome atualizado com sucesso!');
      showToast('Nome atualizado com sucesso!', 'success');
    } catch (err: any) {
      setNameFeedback(err?.message || 'Erro ao atualizar o nome.');
    } finally {
      setIsUpdatingName(false);
    }
  };

  // Handle Password change
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);

    if (!currentPassword) {
      setPasswordError('Informe sua senha atual.');
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError('A nova senha deve ter no mínimo 6 caracteres.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('A nova senha e a confirmação não conferem.');
      return;
    }

    try {
      setIsChangingPass(true);
      await changePassword(currentPassword, newPassword);
      setPasswordSuccess('Senha alterada com sucesso!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      showToast('Senha alterada com sucesso!', 'success');
    } catch (err: any) {
      setPasswordError(err?.message || 'Falha ao alterar senha.');
    } finally {
      setIsChangingPass(false);
    }
  };

  // Handle Account Deletion
  const handleDeleteAccount = async () => {
    if (deleteConfirmationText.trim().toUpperCase() !== 'EXCLUIR') {
      setDeleteError('Digite EXCLUIR para confirmar a eliminação de seus dados.');
      return;
    }

    try {
      setIsDeleting(true);
      setDeleteError(null);
      await deleteAccount();
      showToast('Conta e dados financeiros excluídos com sucesso.', 'info');
    } catch (err: any) {
      setDeleteError(err?.message || 'Erro ao excluir a conta.');
      setIsDeleting(false);
    }
  };

  // User initials
  const initials = user.name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('');

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in pb-12">
      {/* Top Banner / User Identity */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white font-extrabold text-2xl flex items-center justify-center shadow-lg shadow-emerald-600/20 shrink-0">
            {initials || 'U'}
          </div>

          <div className="flex-1 text-center sm:text-left space-y-1">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                {user.name}
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40">
                Conta Ativa
              </span>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 flex items-center justify-center sm:justify-start gap-1.5">
              <Mail className="w-4 h-4 text-slate-400" />
              <span>{user.email}</span>
            </p>
            <p className="text-xs text-slate-400 dark:text-slate-500 flex items-center justify-center sm:justify-start gap-1.5 pt-1">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>Membro do QuitaÍ desde {formatDate(user.createdAt)}</span>
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 shrink-0">
            <button
              onClick={onBackToDashboard}
              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-colors"
            >
              Voltar ao Dashboard
            </button>
            <button
              onClick={logout}
              className="px-4 py-2 rounded-xl bg-rose-50 dark:bg-rose-950/30 hover:bg-rose-100 dark:hover:bg-rose-900/50 text-rose-600 dark:text-rose-400 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors border border-rose-200 dark:border-rose-900/40"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sair da Conta</span>
            </button>
          </div>
        </div>

        {/* Quick summary stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-6 pt-6 border-t border-slate-100 dark:border-slate-800 text-center sm:text-left">
          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800/80">
            <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold block mb-0.5">
              Dívidas Ativas
            </span>
            <span className="text-lg font-bold text-slate-900 dark:text-white">
              {debts.length} contratos
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800/80">
            <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold block mb-0.5">
              Total de Parcelas
            </span>
            <span className="text-lg font-bold text-slate-900 dark:text-white">
              {installments.length} parcelas
            </span>
          </div>

          <div className="col-span-2 sm:col-span-1 p-3 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800/80">
            <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold block mb-0.5">
              Isolamento de Dados
            </span>
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center justify-center sm:justify-start gap-1">
              <ShieldCheck className="w-4 h-4" />
              100% Privado
            </span>
          </div>
        </div>
      </div>

      {/* Tab Switcher: Gerenciar Perfil vs Gerenciar Planos */}
      <div className="flex items-center justify-between flex-wrap gap-3 bg-white dark:bg-slate-900 p-2 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className={`flex-1 sm:flex-initial py-2.5 px-5 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === 'profile'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <User className="w-4 h-4" />
            <span>Gerenciar Perfil</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('plans')}
            className={`flex-1 sm:flex-initial py-2.5 px-5 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === 'plans'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Gerenciar Planos & Assinatura</span>
            <span
              className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                activeTab === 'plans'
                  ? 'bg-white/20 text-white'
                  : 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300'
              }`}
            >
              {currentPlan.name}
            </span>
          </button>
        </div>

        <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400 pr-2">
          <span>{activeTab === 'profile' ? 'Dados da conta e segurança' : 'Status, limites e upgrade'}</span>
        </div>
      </div>

      {/* ABA 1: GERENCIAR PLANOS & ASSINATURA */}
      {activeTab === 'plans' && (
        <div className="space-y-8 animate-in fade-in duration-200">
          {/* SEÇÃO MINHA ASSINATURA ATUAL */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                      Minha Assinatura
                    </h2>
                    <span
                      className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                        currentPlan.id === 'premium'
                          ? 'bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/20'
                          : currentPlan.id === 'plus'
                          ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      {currentPlan.name}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {currentPlan.tagline}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-500">
                  Ciclo: <strong className="text-slate-800 dark:text-slate-200 uppercase">{userSubscription?.billingCycle === 'annual' ? 'Anual' : 'Mensal'}</strong>
                </span>
              </div>
            </div>

            {/* Subscription Status & Billing Information */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800">
                <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold block mb-1">
                  Status da Assinatura
                </span>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-sm font-bold text-slate-900 dark:text-white capitalize">
                    {userSubscription?.cancelAtPeriodEnd ? 'Cancelamento Agendado' : 'Ativa e em dia'}
                  </span>
                </div>
                {userSubscription?.cancelAtPeriodEnd && (
                  <p className="text-[10px] text-amber-600 dark:text-amber-400 mt-1">
                    Acesso garantido até o final do período contratado.
                  </p>
                )}
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800">
                <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold block mb-1">
                  {currentPlan.id === 'gratis' ? 'Plano' : 'Próxima Renovação'}
                </span>
                <span className="text-sm font-bold text-slate-900 dark:text-white">
                  {currentPlan.id === 'gratis'
                    ? 'Sem custo / Vitalício'
                    : formatDate(userSubscription?.currentPeriodEnd || new Date().toISOString())}
                </span>
                {currentPlan.id !== 'gratis' && (
                  <p className="text-[10px] text-slate-400 mt-1">
                    Ciclo {userSubscription?.billingCycle === 'annual' ? 'Anual' : 'Mensal'}
                  </p>
                )}
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800">
                <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold block mb-1">
                  Forma de Pagamento
                </span>
                <span className="text-sm font-bold text-slate-900 dark:text-white uppercase flex items-center gap-1.5">
                  <CreditCard className="w-4 h-4 text-emerald-500" />
                  {currentPlan.id === 'gratis'
                    ? 'Gratuito'
                    : userSubscription?.paymentMethod === 'pix'
                    ? 'PIX Instantâneo'
                    : 'Cartão de Crédito'}
                </span>
                {currentPlan.id !== 'gratis' && (
                  <p className="text-[10px] text-slate-400 mt-1">
                    Sem armazenamento de dados sensíveis
                  </p>
                )}
              </div>
            </div>

            {/* Recursos Utilizados e Limites do Plano */}
            <div className="space-y-3 pt-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Consumo e Limites do Plano
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Dívidas */}
                <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      Dívidas Cadastradas
                    </span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {usageMetrics.debtsCount} /{' '}
                      {usageMetrics.debtsLimit === -1 ? 'Ilimitadas' : usageMetrics.debtsLimit}
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        usageMetrics.debtsPercentage >= 100
                          ? 'bg-rose-500'
                          : usageMetrics.debtsPercentage >= 80
                          ? 'bg-amber-500'
                          : 'bg-emerald-500'
                      }`}
                      style={{
                        width: `${usageMetrics.debtsLimit === -1 ? 15 : Math.max(5, usageMetrics.debtsPercentage)}%`,
                      }}
                    />
                  </div>
                </div>

                {/* Anexos */}
                <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      Anexos e Documentos
                    </span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {usageMetrics.attachmentsCount} /{' '}
                      {usageMetrics.attachmentsLimit === -1
                        ? 'Ilimitados'
                        : usageMetrics.attachmentsLimit}
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-teal-500 transition-all"
                      style={{
                        width: `${
                          usageMetrics.attachmentsLimit === -1 ? 10 : Math.max(5, usageMetrics.attachmentsPercentage)
                        }%`,
                      }}
                    />
                  </div>
                </div>

                {/* Armazenamento */}
                <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      Espaço em Nuvem
                    </span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {usageMetrics.storageMbUsed} MB / {usageMetrics.storageMbLimit} MB
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-purple-500 transition-all"
                      style={{ width: `${Math.max(5, usageMetrics.storagePercentage)}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Cancellation and Action Row */}
            {currentPlan.id !== 'gratis' && (
              <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 dark:border-slate-800">
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Caso cancele, seus lançamentos e documentos não serão apagados.
                </p>
                {userSubscription?.cancelAtPeriodEnd ? (
                  <button
                    type="button"
                    onClick={reactivateSubscription}
                    className="py-1.5 px-3 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 text-xs font-bold transition-colors cursor-pointer"
                  >
                    Reativar Renovação Automática
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsCancelModalOpen(true)}
                    className="text-xs font-semibold text-rose-500 hover:text-rose-700 dark:hover:text-rose-400 hover:underline py-1 cursor-pointer"
                  >
                    Cancelar assinatura
                  </button>
                )}
              </div>
            )}
          </div>

          {/* ESCOLHA E COMPARATIVO DE PLANOS DISPONÍVEIS */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-purple-500" />
                  Planos Disponíveis & Alteração de Assinatura
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Faça upgrade para acelerar o pagamento das suas dívidas e liberar relatórios ilimitados.
                </p>
              </div>

              {/* Toggle Mensal / Anual */}
              <div className="inline-flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => setBillingCycle('monthly')}
                  className={`py-1.5 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    billingCycle === 'monthly'
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Mensal
                </button>
                <button
                  type="button"
                  onClick={() => setBillingCycle('annual')}
                  className={`py-1.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    billingCycle === 'annual'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Anual
                  <span className="text-[9px] font-black uppercase bg-emerald-700/60 text-white px-1.5 py-0.2 rounded-full">
                    -2 meses
                  </span>
                </button>
              </div>
            </div>

            {/* Cards dos 3 planos */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-stretch">
              {plans.map((plan) => {
                const isCurrent = currentPlan.id === plan.id;
                const isHighlight = plan.id === 'plus';
                const priceCents =
                  billingCycle === 'annual'
                    ? Math.round(plan.annualPriceCents / 12)
                    : plan.monthlyPriceCents;

                return (
                  <div
                    key={plan.id}
                    className={`flex flex-col rounded-2xl p-5 sm:p-6 transition-all relative ${
                      isHighlight
                        ? 'bg-gradient-to-b from-emerald-50/60 via-white to-white dark:from-emerald-950/20 dark:via-slate-900 dark:to-slate-900 border-2 border-emerald-500 shadow-md'
                        : isCurrent
                        ? 'bg-white dark:bg-slate-900 border-2 border-purple-500/60 dark:border-purple-500/40 shadow-sm'
                        : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    {isHighlight && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-emerald-600 text-white text-[10px] font-black uppercase tracking-wider rounded-full shadow-sm">
                        Mais Popular
                      </div>
                    )}

                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 rounded-full">
                        {plan.badge || plan.name}
                      </span>
                      {isCurrent && (
                        <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <Check className="w-3 h-3" />
                          Plano Atual
                        </span>
                      )}
                    </div>

                    <h4 className="text-lg font-bold text-slate-900 dark:text-white">{plan.name}</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 min-h-[32px]">
                      {plan.tagline}
                    </p>

                    <div className="my-4">
                      <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-black text-slate-900 dark:text-white">
                          {plan.id === 'gratis' ? 'R$ 0' : formatCurrencyCents(priceCents)}
                        </span>
                        <span className="text-xs font-medium text-slate-400">/mês</span>
                      </div>
                      {billingCycle === 'annual' && plan.id !== 'gratis' && (
                        <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold mt-0.5">
                          Cobrado anualmente ({formatCurrencyCents(plan.annualPriceCents)})
                        </p>
                      )}
                    </div>

                    <button
                      type="button"
                      disabled={isCurrent}
                      onClick={() => openCheckout(plan, billingCycle)}
                      className={`w-full py-2.5 px-4 rounded-xl font-bold text-xs transition-all mb-5 flex items-center justify-center gap-1.5 cursor-pointer disabled:cursor-default ${
                        isCurrent
                          ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 border border-slate-200 dark:border-slate-700'
                          : isHighlight
                          ? 'bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white shadow-md shadow-emerald-600/20'
                          : 'bg-purple-600 hover:bg-purple-500 active:bg-purple-700 text-white shadow-md shadow-purple-600/20'
                      }`}
                    >
                      {isCurrent ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Seu Plano Atual</span>
                        </>
                      ) : (
                        <>
                          <span>Assinar {plan.name}</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </>
                      )}
                    </button>

                    <div className="space-y-2 flex-1 pt-3 border-t border-slate-100 dark:border-slate-800">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Recursos incluídos:
                      </p>
                      <ul className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                        {plan.features.slice(0, 5).map((feat, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                            <span className="text-[11px] leading-tight">{feat}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Histórico de Faturas / Recibos */}
          {invoices.length > 0 && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Receipt className="w-4 h-4" />
                Histórico de Pagamentos e Recibos
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400">
                      <th className="py-2 px-3">Recibo</th>
                      <th className="py-2 px-3">Plano</th>
                      <th className="py-2 px-3">Data</th>
                      <th className="py-2 px-3">Método</th>
                      <th className="py-2 px-3">Valor</th>
                      <th className="py-2 px-3 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                    {invoices.map((inv) => (
                      <tr key={inv.id}>
                        <td className="py-2 px-3 font-mono font-semibold text-slate-800 dark:text-slate-200">
                          {inv.receiptNumber}
                        </td>
                        <td className="py-2 px-3 text-slate-700 dark:text-slate-300 font-medium">
                          {inv.planName} ({inv.billingCycle === 'annual' ? 'Anual' : 'Mensal'})
                        </td>
                        <td className="py-2 px-3 text-slate-500">
                          {formatDate(inv.paidAt || inv.createdAt)}
                        </td>
                        <td className="py-2 px-3 uppercase text-slate-600 dark:text-slate-400 font-semibold">
                          {inv.paymentMethod}
                        </td>
                        <td className="py-2 px-3 font-bold text-slate-900 dark:text-white">
                          {formatCurrencyCents(inv.amountCents)}
                        </td>
                        <td className="py-2 px-3 text-right">
                          <span className="inline-flex items-center gap-1 font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full text-[10px]">
                            <Check className="w-3 h-3" />
                            Pago
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ABA 2: GERENCIAR PERFIL & SEGURANÇA */}
      {activeTab === 'profile' && (
        <div className="space-y-8 animate-in fade-in duration-200">
          {/* Grid of Forms */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Alteração de Nome */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-7 shadow-sm space-y-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Informações Pessoais
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Altere como seu nome é exibido nos relatórios e extratos
              </p>
            </div>
          </div>

          {nameFeedback && (
            <div
              className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                nameFeedback.includes('sucesso')
                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300'
                  : 'bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-300'
              }`}
            >
              {nameFeedback.includes('sucesso') ? (
                <CheckCircle2 className="w-4 h-4 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0" />
              )}
              <span>{nameFeedback}</span>
            </div>
          )}

          <form onSubmit={handleUpdateName} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Nome Completo
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Seu nome"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Endereço de E-mail
              </label>
              <input
                type="email"
                disabled
                value={user.email}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-950 text-slate-500 dark:text-slate-400 text-sm cursor-not-allowed"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">
                O e-mail é a chave de login e identidade única de sua conta.
              </span>
            </div>

            <button
              type="submit"
              disabled={isUpdatingName || name.trim() === user.name}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-all shadow-sm shadow-emerald-600/20 flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{isUpdatingName ? 'Salvando...' : 'Salvar Alterações'}</span>
            </button>
          </form>
        </div>

        {/* Alteração de Senha */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-7 shadow-sm space-y-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Alteração de Senha
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Mantenha suas credenciais sempre atualizadas e protegidas
              </p>
            </div>
          </div>

          {passwordError && (
            <div className="p-3 rounded-xl bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{passwordError}</span>
            </div>
          )}

          {passwordSuccess && (
            <div className="p-3 rounded-xl bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{passwordSuccess}</span>
            </div>
          )}

          <form onSubmit={handleChangePassword} className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Senha Atual
              </label>
              <div className="relative">
                <input
                  type={showCurrentPass ? 'text' : 'password'}
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Digite sua senha atual"
                  className="w-full px-3.5 pr-10 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPass(!showCurrentPass)}
                  className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                >
                  {showCurrentPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Nova Senha
              </label>
              <div className="relative">
                <input
                  type={showNewPass ? 'text' : 'password'}
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  className="w-full px-3.5 pr-10 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPass(!showNewPass)}
                  className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                >
                  {showNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Confirmar Nova Senha
              </label>
              <input
                type={showNewPass ? 'text' : 'password'}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repita a nova senha"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={isChangingPass}
              className="px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs transition-all shadow-sm shadow-amber-600/20 flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
            >
              <KeyRound className="w-4 h-4" />
              <span>{isChangingPass ? 'Atualizando senha...' : 'Modificar Senha'}</span>
            </button>
          </form>
        </div>
      </div>

      {/* Integração Supabase & RLS */}
      <div className="bg-emerald-50/40 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 rounded-3xl p-6 sm:p-7 shadow-sm space-y-4">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <Database className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                Integração Supabase & Row Level Security (RLS)
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                  RLS Ativo
                </span>
              </h3>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 max-w-2xl leading-relaxed">
              O QuitaÍ está configurado para o projeto Supabase <code className="font-mono font-bold text-emerald-700 dark:text-emerald-300">ybdnhrtetahnvvtbapwm</code>.
              Todas as consultas e gravações de dados utilizam políticas de segurança de linha (RLS) baseadas em <code className="font-mono font-semibold">auth.uid()</code>.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsSupabaseModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors shadow-sm shadow-emerald-600/20 flex items-center gap-2 cursor-pointer"
          >
            <Database className="w-4 h-4" />
            <span>Gerenciar Supabase & SQL</span>
          </button>
        </div>
      </div>

      {/* Zona de Perigo - Exclusão de Conta */}
      <div className="bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/50 rounded-3xl p-6 sm:p-7 shadow-sm space-y-4">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div className="space-y-1">
            <h3 className="text-base font-bold text-rose-700 dark:text-rose-400 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-500" />
              Zona de Perigo — Exclusão Definitiva de Conta
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 max-w-2xl leading-relaxed">
              Ao excluir sua conta, todos os contratos de dívidas, parcelas, comprovantes de pagamento,
              anexos e histórico financeiro serão permanentemente removidos. Esta operação é irreversível.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              setIsDeleteModalOpen(true);
              setDeleteConfirmationText('');
              setDeleteError(null);
            }}
            className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-colors shadow-sm shadow-rose-600/20 flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            <span>Excluir Minha Conta</span>
          </button>
        </div>
      </div>
    </div>
  )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-900/80 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div>
              <h4 className="text-lg font-bold text-slate-900 dark:text-white">
                Tem certeza que deseja excluir sua conta?
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                Essa ação apagará imediatamente sua conta e todos os <strong>{debts.length} contratos</strong> e{' '}
                <strong>{installments.length} parcelas</strong> registradas em seu nome no QuitaÍ.
              </p>
            </div>

            {deleteError && (
              <div className="p-3 rounded-xl bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 text-xs">
                {deleteError}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Para confirmar, digite <span className="font-mono font-bold text-rose-600">EXCLUIR</span> abaixo:
              </label>
              <input
                type="text"
                value={deleteConfirmationText}
                onChange={(e) => setDeleteConfirmationText(e.target.value)}
                placeholder="EXCLUIR"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all font-mono"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleDeleteAccount}
                disabled={isDeleting || deleteConfirmationText.trim().toUpperCase() !== 'EXCLUIR'}
                className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-colors disabled:opacity-50 flex items-center gap-1.5 cursor-pointer shadow-sm shadow-rose-600/30"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{isDeleting ? 'Excluindo tudo...' : 'Confirmar Exclusão'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Cancelamento de Assinatura */}
      {isCancelModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Cancelar Renovação da Assinatura
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {currentPlan.name}
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Tem certeza de que deseja cancelar a renovação automática?
            </p>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs space-y-1.5 text-slate-600 dark:text-slate-300">
              <p className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                Seus dados não serão apagados
              </p>
              <p>
                Você continuará com acesso total aos recursos do {currentPlan.name} até o fim do seu período contratado em{' '}
                <strong>{formatDate(userSubscription?.currentPeriodEnd || new Date().toISOString())}</strong>.
              </p>
              <p>
                Após essa data, sua conta passará para o Quitaí Grátis, sem cobranças futuras.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsCancelModalOpen(false)}
                className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Manter Assinatura
              </button>
              <button
                type="button"
                onClick={async () => {
                  await cancelSubscription();
                  setIsCancelModalOpen(false);
                }}
                className="px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-colors cursor-pointer shadow-sm shadow-amber-600/30"
              >
                Confirmar Cancelamento
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Supabase Config & RLS SQL Modal */}
      <SupabaseConfigModal
        isOpen={isSupabaseModalOpen}
        onClose={() => setIsSupabaseModalOpen(false)}
      />
    </div>
  );
};
