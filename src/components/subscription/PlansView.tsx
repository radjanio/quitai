/**
 * QuitaÍ — Tela de Planos e Assinaturas Dinâmicos
 * Carrega planos diretamente do Banco de Dados e integra com Mercado Pago
 */

import React, { useState } from 'react';
import {
  Check,
  X,
  Sparkles,
  Zap,
  ShieldCheck,
  HelpCircle,
  ArrowRight,
  TrendingDown,
  Layers,
  FileSpreadsheet,
  PieChart,
  HardDrive,
  Headphones,
  ExternalLink,
  Lock,
} from 'lucide-react';
import { useSubscription } from '../../context/SubscriptionContext';
import { useAuth } from '../../context/AuthContext';
import { BillingCycle, PlanConfig } from '../../types/subscription';
import { formatCurrencyCents } from '../../utils/currency';

interface PlansViewProps {
  onBackToDashboard: () => void;
  onOpenAdmin?: () => void;
}

export const PlansView: React.FC<PlansViewProps> = ({ onBackToDashboard, onOpenAdmin }) => {
  const { plans, currentPlan, openCheckout, isLoadingPlans } = useSubscription();
  const { isAdmin } = useAuth();
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('monthly');

  // Filtra planos ativos do banco de dados (se for admin, todos estão no contexto)
  const activePlans = plans.filter((p) => p.isActive !== false);

  const handleSelectPlan = (plan: PlanConfig) => {
    if (plan.id === currentPlan.id) return;
    openCheckout(plan, billingCycle);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in duration-300">
      {/* Top Header */}
      <div className="text-center max-w-3xl mx-auto mb-10">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-sky-500/10 text-sky-600 dark:text-sky-400 text-xs font-bold uppercase tracking-wider mb-3">
          <ShieldCheck className="w-4 h-4 text-sky-500" />
          Provedor Oficial: Mercado Pago
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Acelere sua liberdade financeira com o QuitaÍ
        </h1>
        <p className="mt-3 text-base text-slate-600 dark:text-slate-300">
          Planos cadastrados no banco de dados com segurança total. Contratação instantânea via Mercado Pago (PIX e Cartão) sem fidelidade.
        </p>

        {isAdmin && onOpenAdmin && (
          <div className="mt-4">
            <button
              onClick={onOpenAdmin}
              className="inline-flex items-center gap-1.5 py-1.5 px-4 rounded-full bg-purple-500/10 hover:bg-purple-500/20 text-purple-600 dark:text-purple-400 text-xs font-bold transition-all border border-purple-500/20"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Painel Administrativo: Criar e Gerenciar Planos no Banco de Dados
            </button>
          </div>
        )}

        {/* Billing Cycle Toggle */}
        <div className="mt-8 inline-flex items-center p-1.5 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 shadow-inner">
          <button
            type="button"
            onClick={() => setBillingCycle('monthly')}
            className={`py-2 px-5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              billingCycle === 'monthly'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Cobrança Mensal
          </button>
          <button
            type="button"
            onClick={() => setBillingCycle('annual')}
            className={`py-2 px-5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 ${
              billingCycle === 'annual'
                ? 'bg-sky-600 text-white shadow-md shadow-sky-500/20'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Cobrança Anual
            <span className="text-[10px] uppercase font-black bg-sky-700/60 text-white px-2 py-0.5 rounded-full">
              Economize até 2 meses
            </span>
          </button>
        </div>
      </div>

      {/* Plan Cards Grid (Totalmente Dinâmico a partir do Banco de Dados) */}
      <div
        className={`grid grid-cols-1 ${
          activePlans.length === 1
            ? 'max-w-md mx-auto'
            : activePlans.length === 2
            ? 'md:grid-cols-2 max-w-4xl mx-auto'
            : 'md:grid-cols-3'
        } gap-6 lg:gap-8 items-stretch mb-16`}
      >
        {activePlans.map((plan) => {
          const isCurrent = currentPlan.id === plan.id;
          const isFree = plan.monthlyPriceCents === 0;
          const isHighlighted = Boolean(plan.highlighted);

          const displayPriceCents =
            billingCycle === 'annual'
              ? Math.round(plan.annualPriceCents / 12)
              : plan.monthlyPriceCents;

          return (
            <div
              key={plan.id}
              className={`flex flex-col rounded-3xl p-6 sm:p-8 transition-all relative ${
                isHighlighted
                  ? 'bg-gradient-to-b from-sky-50/70 via-white to-white dark:from-sky-950/20 dark:via-slate-900 dark:to-slate-900 border-2 border-sky-500 shadow-xl ring-4 ring-sky-500/10'
                  : isCurrent
                  ? 'bg-white dark:bg-slate-900 border-2 border-emerald-500/60 shadow-lg ring-2 ring-emerald-500/10'
                  : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md'
              }`}
            >
              {isHighlighted && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-sky-600 to-teal-600 text-white text-[11px] font-black uppercase tracking-wider rounded-full shadow-md">
                  Recomendado
                </div>
              )}

              <div className="flex items-center justify-between mb-4">
                <span
                  className={`text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full ${
                    isHighlighted
                      ? 'text-sky-700 dark:text-sky-400 bg-sky-500/10'
                      : 'text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800'
                  }`}
                >
                  {plan.badge || (isFree ? 'Essencial' : 'Pro')}
                </span>

                {isCurrent && (
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" />
                    Seu Plano Atual
                  </span>
                )}
              </div>

              <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                {isHighlighted && <Sparkles className="w-5 h-5 text-sky-500" />}
                {plan.name}
              </h3>

              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 min-h-[32px]">
                {plan.tagline || plan.description}
              </p>

              <div className="my-6">
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white">
                    {formatCurrencyCents(displayPriceCents)}
                  </span>
                  {!isFree && (
                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                      /mês
                    </span>
                  )}
                </div>

                <p className="text-xs text-slate-400 mt-1">
                  {isFree
                    ? 'Gratuito para sempre'
                    : billingCycle === 'annual'
                    ? `${formatCurrencyCents(plan.annualPriceCents)} cobrado anualmente`
                    : 'Cobrado mensalmente via Mercado Pago'}
                </p>
              </div>

              <button
                type="button"
                disabled={isCurrent}
                onClick={() => handleSelectPlan(plan)}
                className={`w-full py-3.5 px-4 rounded-2xl font-bold text-sm transition-all mb-8 shadow-sm flex items-center justify-center gap-2 ${
                  isCurrent
                    ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-default'
                    : isHighlighted
                    ? 'bg-sky-600 hover:bg-sky-700 text-white shadow-sky-500/25 hover:scale-[1.02]'
                    : 'bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 hover:scale-[1.01]'
                }`}
              >
                {isCurrent ? (
                  'Plano Ativo'
                ) : isFree ? (
                  'Mudar para Grátis'
                ) : (
                  <>
                    Contratar com Mercado Pago
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="space-y-3 flex-1">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Recursos inclusos:
                </p>
                <ul className="space-y-2.5 text-xs text-slate-600 dark:text-slate-300">
                  {plan.features.map((feat, idx) => (
                    <li key={idx} className="flex items-start gap-2.5">
                      <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          );
        })}
      </div>

      {/* Selo de Garantia e Parceria Mercado Pago */}
      <div className="bg-gradient-to-r from-sky-50 via-slate-50 to-teal-50 dark:from-slate-900 dark:via-sky-950/20 dark:to-slate-900 border border-sky-200 dark:border-sky-900/40 rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm mb-16">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <div>
            <h4 className="text-base font-bold text-slate-900 dark:text-white">
              Pagamentos Processados com Segurança pelo Mercado Pago
            </h4>
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 max-w-xl">
              Seus dados financeiros e credenciais de pagamento nunca são armazenados pelo QuitaÍ. A aprovação é imediata via PIX e Cartão com liberação instantânea dos recursos do seu plano.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0 text-xs font-bold text-slate-700 dark:text-slate-300">
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs">
            <Lock className="w-3.5 h-3.5 text-emerald-500" />
            Certificado SSL 256-bit
          </span>
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs">
            <Check className="w-3.5 h-3.5 text-sky-500" />
            PIX & Cartão
          </span>
        </div>
      </div>
    </div>
  );
};
