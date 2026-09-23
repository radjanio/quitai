/**
 * QuitaÍ — Modal de Aviso de Limite / Bloqueio de Recurso com Oferta de Upgrade
 */

import React from 'react';
import { Sparkles, X, Check, ArrowRight, ShieldAlert, Zap } from 'lucide-react';
import { useSubscription } from '../../context/SubscriptionContext';
import { formatCurrencyCents } from '../../utils/currency';

interface UpgradeNoticeModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  onOpenPlans?: () => void;
  reason?: string;
}

export const UpgradeNoticeModal: React.FC<UpgradeNoticeModalProps> = ({
  isOpen,
  onClose,
  onOpenPlans,
  reason,
}) => {
  const {
    plans,
    openCheckout,
    isUpgradeModalOpen,
    closeUpgradeModal,
    upgradeModalReason,
  } = useSubscription();

  const activeIsOpen = isOpen !== undefined ? isOpen : isUpgradeModalOpen;
  const activeOnClose = onClose || closeUpgradeModal;
  const activeReason = reason || upgradeModalReason;

  if (!activeIsOpen) return null;

  const plusPlan = plans.find((p) => p.id === 'plus');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden relative">
        {/* Decorative background glow */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 dark:bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={activeOnClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors z-10 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-6 sm:p-8">
          {/* Header Icon */}
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-5">
            <Zap className="w-6 h-6" />
          </div>

          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
            Atingiu o limite do seu plano
          </h3>

          <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-6">
            {reason ||
              'Você atingiu a capacidade máxima do plano Quitaí Grátis. Faça um upgrade para liberar novos lançamentos e acelerar a quitação das suas dívidas.'}
          </p>

          {/* Plus Plan Highlight Card */}
          {plusPlan && (
            <div className="bg-gradient-to-br from-emerald-50 to-teal-50/50 dark:from-emerald-950/30 dark:to-teal-950/20 border border-emerald-200 dark:border-emerald-800/60 rounded-2xl p-5 mb-6">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full">
                  Recomendado
                </span>
                <span className="text-lg font-black text-slate-900 dark:text-white">
                  {formatCurrencyCents(plusPlan.monthlyPriceCents)}
                  <span className="text-xs font-normal text-slate-500 dark:text-slate-400">/mês</span>
                </span>
              </div>

              <h4 className="font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-emerald-500" />
                {plusPlan.name}
              </h4>

              <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-300 mb-4">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  Dívidas e contratos ilimitados
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  Módulo de Investimentos completo
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  Até 50 comprovantes e relatórios avançados
                </li>
              </ul>

              <button
                onClick={() => {
                  activeOnClose();
                  openCheckout(plusPlan, 'monthly');
                }}
                className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold text-xs transition-all shadow-md shadow-emerald-500/20 flex items-center justify-center gap-2 cursor-pointer"
              >
                Assinar Quitaí Plus Agora
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Action Footer */}
          <div className="flex items-center justify-between gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
            <button
              onClick={activeOnClose}
              className="text-xs font-semibold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 py-2 cursor-pointer"
            >
              Continuar no plano atual
            </button>
            {onOpenPlans && (
              <button
                onClick={() => {
                  activeOnClose();
                  onOpenPlans();
                }}
                className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                Ver todos os planos e comparações
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
