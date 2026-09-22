/**
 * Paid vs Remaining Comparison Component
 */

import React from 'react';
import { Debt, Installment, PaymentRecord } from '../../types/finance';
import { calculateDebtSummary } from '../../services/storage';
import { formatCurrency, formatPercentage } from '../../utils/currency';

interface PaidVsRemainingChartProps {
  debts: Debt[];
  installments: Installment[];
  payments: PaymentRecord[];
  onSelectDebt?: (debtId: string) => void;
}

export const PaidVsRemainingChart: React.FC<PaidVsRemainingChartProps> = ({
  debts,
  installments,
  payments,
  onSelectDebt,
}) => {
  const activeDebts = debts.filter((d) => d.status !== 'cancelada');

  if (activeDebts.length === 0) {
    return (
      <div className="h-48 flex items-center justify-center text-slate-400 dark:text-slate-500 text-sm">
        Nenhuma dívida para comparar.
      </div>
    );
  }

  return (
    <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1">
      {activeDebts.map((debt) => {
        const dInst = installments.filter((i) => i.debtId === debt.id);
        const dPay = payments.filter((p) => p.debtId === debt.id);
        const summary = calculateDebtSummary(debt, dInst, dPay);

        return (
          <div
            key={debt.id}
            onClick={() => onSelectDebt?.(debt.id)}
            className={`p-3 rounded-xl border border-slate-200/80 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/50 transition-all ${
              onSelectDebt ? 'hover:border-emerald-500/50 hover:bg-slate-100/50 dark:hover:bg-slate-800/50 cursor-pointer' : ''
            }`}
          >
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <span className="font-semibold text-xs text-slate-800 dark:text-slate-200 truncate">
                {debt.title}
              </span>
              <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 flex-shrink-0">
                {formatPercentage(summary.progressPercentage)}
              </span>
            </div>

            {/* Dual color progress bar */}
            <div className="w-full h-3 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden flex">
              <div
                className="bg-emerald-500 h-full transition-all duration-500"
                style={{ width: `${summary.progressPercentage}%` }}
                title={`Pago: ${formatCurrency(summary.totalPaidCents)}`}
              />
              <div
                className="bg-amber-500/60 dark:bg-amber-600/50 h-full transition-all duration-500"
                style={{ width: `${100 - summary.progressPercentage}%` }}
                title={`Saldo restante: ${formatCurrency(summary.remainingBalanceCents)}`}
              />
            </div>

            {/* Labels under progress bar */}
            <div className="flex items-center justify-between text-[11px] font-mono mt-1.5 text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                Pago: <strong className="text-slate-700 dark:text-slate-300">{formatCurrency(summary.totalPaidCents)}</strong>
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />
                Saldo: <strong className="text-slate-700 dark:text-slate-300">{formatCurrency(summary.remainingBalanceCents)}</strong>
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
};
