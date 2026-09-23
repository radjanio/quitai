/**
 * QuitaÍ — Tela de Planos e Assinaturas
 * Comparação detalhada de planos, toggle mensal/anual e checkout direto
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
} from 'lucide-react';
import { useSubscription } from '../../context/SubscriptionContext';
import { BillingCycle, PlanConfig } from '../../types/subscription';
import { formatCurrencyCents } from '../../utils/currency';

interface PlansViewProps {
  onBackToDashboard: () => void;
}

export const PlansView: React.FC<PlansViewProps> = ({ onBackToDashboard }) => {
  const { plans, currentPlan, userSubscription, openCheckout } = useSubscription();
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('monthly');

  const gratisPlan = plans.find((p) => p.id === 'gratis') || plans[0];
  const plusPlan = plans.find((p) => p.id === 'plus') || plans[1];
  const premiumPlan = plans.find((p) => p.id === 'premium') || plans[2];

  const handleSelectPlan = (plan: PlanConfig) => {
    if (plan.id === currentPlan.id) return;
    openCheckout(plan, billingCycle);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in duration-300">
      {/* Top Header */}
      <div className="text-center max-w-3xl mx-auto mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold uppercase tracking-wider mb-3">
          <Sparkles className="w-3.5 h-3.5" />
          Planos Transparentes e Sem Surpresas
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Acelere sua liberdade financeira com o QuitaÍ
        </h1>
        <p className="mt-3 text-base text-slate-600 dark:text-slate-300">
          Escolha o plano ideal para gerenciar suas dívidas de longo prazo, investimentos e patrimônio. Cancele quando quiser, sem fidelidade.
        </p>

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
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/20'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Cobrança Anual
            <span className="text-[10px] uppercase font-black bg-emerald-700/60 text-white px-2 py-0.5 rounded-full">
              Economize 2 meses
            </span>
          </button>
        </div>
      </div>

      {/* Plan Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 items-stretch mb-16">
        {/* 1. Quitaí Grátis */}
        <div
          className={`flex flex-col rounded-3xl p-6 sm:p-8 bg-white dark:bg-slate-900 border transition-all ${
            currentPlan.id === 'gratis'
              ? 'border-slate-300 dark:border-slate-700 ring-2 ring-slate-400/20 shadow-lg'
              : 'border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md'
          }`}
        >
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full">
              {gratisPlan.badge || 'Essencial'}
            </span>
            {currentPlan.id === 'gratis' && (
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                <Check className="w-3.5 h-3.5" />
                Seu Plano Atual
              </span>
            )}
          </div>

          <h3 className="text-xl font-bold text-slate-900 dark:text-white">{gratisPlan.name}</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 min-h-[32px]">
            {gratisPlan.tagline}
          </p>

          <div className="my-6">
            <div className="flex items-baseline gap-1">
              <span className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white">
                R$ 0
              </span>
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">/mês</span>
            </div>
            <p className="text-xs text-slate-400 mt-1">Gratuito para sempre</p>
          </div>

          <button
            type="button"
            disabled={currentPlan.id === 'gratis'}
            onClick={() => handleSelectPlan(gratisPlan)}
            className={`w-full py-3 px-4 rounded-2xl font-bold text-sm transition-all mb-8 ${
              currentPlan.id === 'gratis'
                ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-default'
                : 'bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200'
            }`}
          >
            {currentPlan.id === 'gratis' ? 'Plano Ativo' : 'Mudar para Grátis'}
          </button>

          <div className="space-y-3 flex-1">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
              O que está incluído:
            </p>
            <ul className="space-y-2.5 text-xs text-slate-600 dark:text-slate-300">
              {gratisPlan.features.map((feat, idx) => (
                <li key={idx} className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span>{feat}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* 2. Quitaí Plus (Highlighted) */}
        <div
          className={`flex flex-col rounded-3xl p-6 sm:p-8 bg-gradient-to-b from-emerald-50/70 via-white to-white dark:from-emerald-950/20 dark:via-slate-900 dark:to-slate-900 border-2 relative transition-all ${
            currentPlan.id === 'plus'
              ? 'border-emerald-500 shadow-2xl ring-4 ring-emerald-500/10'
              : 'border-emerald-500/80 shadow-xl hover:shadow-2xl'
          }`}
        >
          {/* Top highlight ribbon */}
          <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-[11px] font-black uppercase tracking-wider rounded-full shadow-md">
            Mais Recomendado
          </div>

          <div className="flex items-center justify-between mb-4 mt-2">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full">
              {plusPlan.badge || 'Popular'}
            </span>
            {currentPlan.id === 'plus' && (
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                <Check className="w-3.5 h-3.5" />
                Seu Plano Atual
              </span>
            )}
          </div>

          <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
            <Sparkles className="w-5 h-5 text-emerald-500" />
            {plusPlan.name}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 min-h-[32px]">
            {plusPlan.tagline}
          </p>

          <div className="my-6">
            <div className="flex items-baseline gap-1">
              <span className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white">
                {formatCurrencyCents(
                  billingCycle === 'annual'
                    ? Math.round(plusPlan.annualPriceCents / 12)
                    : plusPlan.monthlyPriceCents
                )}
              </span>
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">/mês</span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {billingCycle === 'annual'
                ? `${formatCurrencyCents(plusPlan.annualPriceCents)} cobrado anualmente`
                : 'Cobrado mensalmente no cartão ou PIX'}
            </p>
          </div>

          <button
            type="button"
            disabled={currentPlan.id === 'plus'}
            onClick={() => handleSelectPlan(plusPlan)}
            className={`w-full py-3.5 px-4 rounded-2xl font-bold text-sm transition-all mb-8 shadow-md flex items-center justify-center gap-2 ${
              currentPlan.id === 'plus'
                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 cursor-default shadow-none'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/25 hover:scale-[1.02]'
            }`}
          >
            {currentPlan.id === 'plus' ? (
              'Plano Ativo'
            ) : (
              <>
                Fazer Upgrade para Plus
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          <div className="space-y-3 flex-1">
            <p className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
              Tudo do plano Grátis, mais:
            </p>
            <ul className="space-y-2.5 text-xs text-slate-700 dark:text-slate-200">
              {plusPlan.features.map((feat, idx) => (
                <li key={idx} className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  <span className="font-medium">{feat}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* 3. Quitaí Premium */}
        <div
          className={`flex flex-col rounded-3xl p-6 sm:p-8 bg-white dark:bg-slate-900 border transition-all ${
            currentPlan.id === 'premium'
              ? 'border-purple-500/80 ring-2 ring-purple-500/20 shadow-xl'
              : 'border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md'
          }`}
        >
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold uppercase tracking-wider text-purple-700 dark:text-purple-400 bg-purple-500/10 px-3 py-1 rounded-full">
              {premiumPlan.badge || 'VIP'}
            </span>
            {currentPlan.id === 'premium' && (
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                <Check className="w-3.5 h-3.5" />
                Seu Plano Atual
              </span>
            )}
          </div>

          <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
            <Zap className="w-5 h-5 text-purple-500" />
            {premiumPlan.name}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 min-h-[32px]">
            {premiumPlan.tagline}
          </p>

          <div className="my-6">
            <div className="flex items-baseline gap-1">
              <span className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white">
                {formatCurrencyCents(
                  billingCycle === 'annual'
                    ? Math.round(premiumPlan.annualPriceCents / 12)
                    : premiumPlan.monthlyPriceCents
                )}
              </span>
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">/mês</span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {billingCycle === 'annual'
                ? `${formatCurrencyCents(premiumPlan.annualPriceCents)} cobrado anualmente`
                : 'Cobrado mensalmente no cartão ou PIX'}
            </p>
          </div>

          <button
            type="button"
            disabled={currentPlan.id === 'premium'}
            onClick={() => handleSelectPlan(premiumPlan)}
            className={`w-full py-3 px-4 rounded-2xl font-bold text-sm transition-all mb-8 ${
              currentPlan.id === 'premium'
                ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 cursor-default'
                : 'bg-purple-600 hover:bg-purple-700 text-white shadow-md shadow-purple-500/20 hover:scale-[1.02]'
            }`}
          >
            {currentPlan.id === 'premium' ? (
              'Plano Ativo'
            ) : (
              <>
                Assinar Quitaí Premium
                <ArrowRight className="w-4 h-4 ml-1 inline" />
              </>
            )}
          </button>

          <div className="space-y-3 flex-1">
            <p className="text-xs font-bold uppercase tracking-wider text-purple-700 dark:text-purple-400">
              Tudo do plano Plus, mais:
            </p>
            <ul className="space-y-2.5 text-xs text-slate-600 dark:text-slate-300">
              {premiumPlan.features.map((feat, idx) => (
                <li key={idx} className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-purple-500 shrink-0 mt-0.5" />
                  <span>{feat}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Comparison Matrix Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm mb-16">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            Comparativo Completo de Recursos
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Veja exatamente o que cada plano oferece para escolher o melhor para seu momento.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-xs font-bold uppercase tracking-wider text-slate-400">
                <th className="py-4 px-4">Recurso / Capacidade</th>
                <th className="py-4 px-4 text-center">Grátis</th>
                <th className="py-4 px-4 text-center bg-emerald-500/5 text-emerald-600 dark:text-emerald-400 rounded-t-xl">
                  Plus (Recomendado)
                </th>
                <th className="py-4 px-4 text-center">Premium</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              <tr>
                <td className="py-4 px-4 font-semibold text-slate-800 dark:text-slate-200">
                  Dívidas e Contratos Ativos
                </td>
                <td className="py-4 px-4 text-center text-slate-600 dark:text-slate-400">Até 3</td>
                <td className="py-4 px-4 text-center font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/5">
                  Ilimitadas
                </td>
                <td className="py-4 px-4 text-center font-bold text-purple-600 dark:text-purple-400">
                  Ilimitadas
                </td>
              </tr>

              <tr>
                <td className="py-4 px-4 font-semibold text-slate-800 dark:text-slate-200">
                  Entradas e Despesas
                </td>
                <td className="py-4 px-4 text-center text-slate-600 dark:text-slate-400">Ilimitadas</td>
                <td className="py-4 px-4 text-center text-emerald-600 dark:text-emerald-400 bg-emerald-500/5">
                  Ilimitadas
                </td>
                <td className="py-4 px-4 text-center text-slate-600 dark:text-slate-400">Ilimitadas</td>
              </tr>

              <tr>
                <td className="py-4 px-4 font-semibold text-slate-800 dark:text-slate-200">
                  Módulo de Investimentos
                </td>
                <td className="py-4 px-4 text-center">
                  <X className="w-4 h-4 text-slate-300 dark:text-slate-600 mx-auto" />
                </td>
                <td className="py-4 px-4 text-center bg-emerald-500/5">
                  <Check className="w-5 h-5 text-emerald-600 dark:text-emerald-400 mx-auto" />
                </td>
                <td className="py-4 px-4 text-center">
                  <Check className="w-5 h-5 text-purple-600 dark:text-purple-400 mx-auto" />
                </td>
              </tr>

              <tr>
                <td className="py-4 px-4 font-semibold text-slate-800 dark:text-slate-200">
                  Relatórios Avançados e Gráficos
                </td>
                <td className="py-4 px-4 text-center text-slate-400 text-xs">Básicos</td>
                <td className="py-4 px-4 text-center font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/5">
                  Completos
                </td>
                <td className="py-4 px-4 text-center font-semibold text-purple-600 dark:text-purple-400">
                  Completos + Fiscais
                </td>
              </tr>

              <tr>
                <td className="py-4 px-4 font-semibold text-slate-800 dark:text-slate-200">
                  Anexos e Comprovantes
                </td>
                <td className="py-4 px-4 text-center text-slate-600 dark:text-slate-400">Até 5 (15 MB)</td>
                <td className="py-4 px-4 text-center font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/5">
                  Até 50 (150 MB)
                </td>
                <td className="py-4 px-4 text-center font-bold text-purple-600 dark:text-purple-400">
                  Até 500 (1 GB)
                </td>
              </tr>

              <tr>
                <td className="py-4 px-4 font-semibold text-slate-800 dark:text-slate-200">
                  Exportação de Dados
                </td>
                <td className="py-4 px-4 text-center text-slate-600 dark:text-slate-400">Apenas CSV</td>
                <td className="py-4 px-4 text-center text-emerald-600 dark:text-emerald-400 bg-emerald-500/5 font-semibold">
                  CSV e PDF
                </td>
                <td className="py-4 px-4 text-center text-purple-600 dark:text-purple-400 font-semibold">
                  CSV, PDF e Fiscal
                </td>
              </tr>

              <tr>
                <td className="py-4 px-4 font-semibold text-slate-800 dark:text-slate-200">
                  Simulador de Quitação Acelerada
                </td>
                <td className="py-4 px-4 text-center">
                  <X className="w-4 h-4 text-slate-300 dark:text-slate-600 mx-auto" />
                </td>
                <td className="py-4 px-4 text-center bg-emerald-500/5">
                  <Check className="w-5 h-5 text-emerald-600 dark:text-emerald-400 mx-auto" />
                </td>
                <td className="py-4 px-4 text-center">
                  <Check className="w-5 h-5 text-purple-600 dark:text-purple-400 mx-auto" />
                </td>
              </tr>

              <tr>
                <td className="py-4 px-4 font-semibold text-slate-800 dark:text-slate-200">
                  Planejamento Patrimonial
                </td>
                <td className="py-4 px-4 text-center">
                  <X className="w-4 h-4 text-slate-300 dark:text-slate-600 mx-auto" />
                </td>
                <td className="py-4 px-4 text-center bg-emerald-500/5">
                  <X className="w-4 h-4 text-slate-300 dark:text-slate-600 mx-auto" />
                </td>
                <td className="py-4 px-4 text-center">
                  <Check className="w-5 h-5 text-purple-600 dark:text-purple-400 mx-auto" />
                </td>
              </tr>

              <tr>
                <td className="py-4 px-4 font-semibold text-slate-800 dark:text-slate-200">
                  Suporte ao Usuário
                </td>
                <td className="py-4 px-4 text-center text-slate-400 text-xs">Padrão por e-mail</td>
                <td className="py-4 px-4 text-center text-emerald-600 dark:text-emerald-400 bg-emerald-500/5 font-semibold text-xs">
                  Prioritário
                </td>
                <td className="py-4 px-4 text-center text-purple-600 dark:text-purple-400 font-semibold text-xs">
                  VIP com Especialista
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Trust & Guarantee Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center bg-slate-100 dark:bg-slate-800/40 rounded-3xl p-8 border border-slate-200 dark:border-slate-800">
        <div>
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-3">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h4 className="font-bold text-slate-900 dark:text-white text-sm">Seus Dados 100% Protegidos</h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Seus registros financeiros pertencem apenas a você, com isolamento via Row Level Security.
          </p>
        </div>

        <div>
          <div className="w-10 h-10 rounded-2xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center mx-auto mb-3">
            <Zap className="w-5 h-5" />
          </div>
          <h4 className="font-bold text-slate-900 dark:text-white text-sm">Cancele a Qualquer Momento</h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Sem multas ou fidelidade. Se cancelar, seus dados existentes não são apagados.
          </p>
        </div>

        <div>
          <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto mb-3">
            <Headphones className="w-5 h-5" />
          </div>
          <h4 className="font-bold text-slate-900 dark:text-white text-sm">Pagamento Seguro via PIX ou Cartão</h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Ativação imediata sem salvar dados sensíveis de cartão no nosso servidor.
          </p>
        </div>
      </div>
    </div>
  );
};
