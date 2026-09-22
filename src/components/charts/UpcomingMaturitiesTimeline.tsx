/**
 * Upcoming Maturities Timeline & Mini-Calendar
 */

import React from 'react';
import { Debt, Installment } from '../../types/finance';
import { formatDate, getDaysRemainingLabel, isOverdue } from '../../utils/dates';
import { formatCurrency } from '../../utils/currency';
import { Calendar, AlertCircle, Clock, CheckCircle2 } from 'lucide-react';

interface UpcomingMaturitiesTimelineProps {
  debts: Debt[];
  installments: Installment[];
  onPayInstallment?: (inst: Installment, debt: Debt) => void;
  onSelectDebt?: (debtId: string) => void;
}

export const UpcomingMaturitiesTimeline: React.FC<UpcomingMaturitiesTimelineProps> = ({
  debts,
  installments,
  onPayInstallment,
  onSelectDebt,
}) => {
  const debtMap = new Map<string, Debt>(debts.map((d) => [d.id, d]));

  // Get all unpaid installments (pending or overdue)
  const unpaid = installments
    .filter((i) => i.status !== 'paga' && i.status !== 'cancelada')
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
    .slice(0, 8); // Top 8 next dues

  if (unpaid.length === 0) {
    return (
      <div className="h-48 flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 text-sm">
        <CheckCircle2 className="w-8 h-8 text-emerald-500 mb-2 opacity-80" />
        <p>Parabéns! Nenhuma parcela pendente ou a vencer no momento.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
      {unpaid.map((inst) => {
        const debt = debtMap.get(inst.debtId);
        if (!debt) return null;

        const isLate = isOverdue(inst.dueDate, inst.status);
        const { label: daysLabel } = getDaysRemainingLabel(inst.dueDate);

        return (
          <div
            key={inst.id}
            className={`p-2.5 rounded-xl border flex items-center justify-between gap-3 text-xs transition-colors ${
              isLate
                ? 'bg-rose-50/60 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/50'
                : 'bg-slate-50/70 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800'
            }`}
          >
            {/* Left Icon + Info */}
            <div className="flex items-center gap-3 min-w-0">
              <div
                className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  isLate
                    ? 'bg-rose-100 text-rose-600 dark:bg-rose-900/50 dark:text-rose-400'
                    : 'bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400'
                }`}
              >
                {isLate ? <AlertCircle className="w-5 h-5" /> : <Calendar className="w-5 h-5" />}
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span
                    onClick={() => onSelectDebt?.(debt.id)}
                    className="font-semibold text-slate-800 dark:text-slate-200 truncate cursor-pointer hover:underline"
                  >
                    {debt.title}
                  </span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-200/70 dark:bg-slate-800 text-slate-600 dark:text-slate-400 flex-shrink-0">
                    #{inst.installmentNumber}/{debt.installmentCount}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                  <span className="flex items-center gap-1 font-mono">
                    <Clock className="w-3 h-3" />
                    {formatDate(inst.dueDate)}
                  </span>
                  <span
                    className={`font-medium ${
                      isLate
                        ? 'text-rose-600 dark:text-rose-400 font-semibold'
                        : 'text-amber-600 dark:text-amber-400'
                    }`}
                  >
                    • {daysLabel}
                  </span>
                </div>
              </div>
            </div>

            {/* Right: Value + Pay Action */}
            <div className="flex items-center gap-3 flex-shrink-0">
              <div className="text-right">
                <div className="font-mono font-bold text-slate-900 dark:text-white">
                  {formatCurrency(inst.expectedAmountCents)}
                </div>
                {inst.status === 'parcialmente_paga' && (
                  <div className="text-[10px] text-amber-600 dark:text-amber-400">
                    Restante: {formatCurrency(inst.expectedAmountCents - (inst.paidAmountCents || 0))}
                  </div>
                )}
              </div>

              {onPayInstallment && (
                <button
                  type="button"
                  onClick={() => onPayInstallment(inst, debt)}
                  className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-medium transition-colors shadow-sm cursor-pointer whitespace-nowrap"
                >
                  Pagar
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
