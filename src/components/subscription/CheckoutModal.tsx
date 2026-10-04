/**
 * QuitaÍ — Confirmação e Ativação de Plano
 */

import React from 'react';
import { X, Check, Sparkles, ShieldCheck } from 'lucide-react';
import { useSubscription } from '../../context/SubscriptionContext';
import { formatCurrencyCents } from '../../utils/currency';

export const CheckoutModal: React.FC = () => {
  const { isCheckoutModalOpen, closeCheckout, checkoutPlan, checkoutCycle } = useSubscription();

  if (!isCheckoutModalOpen || !checkoutPlan) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/50">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {checkoutPlan.name}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {checkoutPlan.tagline || 'Plano QuitaÍ'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={closeCheckout}
            aria-label="Fechar"
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex items-baseline justify-between">
              <span className="text-xs font-semibold text-slate-500">Valor do Plano:</span>
              <span className="text-lg font-bold font-mono text-slate-900 dark:text-white">
                {checkoutPlan.monthlyPriceCents === 0
                  ? 'Gratuito'
                  : checkoutCycle === 'annual'
                  ? `${formatCurrencyCents(checkoutPlan.annualPriceCents)} / ano`
                  : `${formatCurrencyCents(checkoutPlan.monthlyPriceCents)} / mês`}
              </span>
            </div>

            <div className="pt-2 border-t border-slate-200 dark:border-slate-700/60">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-2">
                Recursos incluídos:
              </span>
              <ul className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
                {checkoutPlan.features.slice(0, 4).map((f, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-500">
            <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>Acesso ilimitado a todas as ferramentas financeiras sem fidelidade.</span>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={closeCheckout}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Fechar
            </button>
            <button
              type="button"
              onClick={closeCheckout}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              Confirmar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
