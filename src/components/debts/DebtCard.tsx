/**
 * DebtCard - Summary card in list view
 */

import React from 'react';
import { Debt, Installment, PaymentRecord } from '../../types/finance';
import { calculateDebtSummary } from '../../services/storage';
import { Badge } from '../common/Badge';
import { formatCurrency, formatPercentage } from '../../utils/currency';
import { formatDate, getDaysRemainingLabel } from '../../utils/dates';
import { Calendar, CheckCircle2, Clock, ChevronRight, DollarSign } from 'lucide-react';

interface DebtCardProps {
  debt: Debt;
  installments: Installment[];
  payments: PaymentRecord[];
  onSelect: (debtId: string) => void;
  onQuickPay?: (inst: Installment, debt: Debt) => void;
}

export const DebtCard: React.FC<DebtCardProps> = ({
  debt,
  installments,
  payments,
  onSelect,
  onQuickPay,
}) => {
  const dInst = installments.filter((i) => i.debtId === debt.id);
  const dPay = payments.filter((p) => p.debtId === debt.id);
  const summary = calculateDebtSummary(debt, dInst, dPay);
  const nextInst = summary.nextDueInstallment;
  const nextDays = nextInst ? getDaysRemainingLabel(nextInst.dueDate) : null;

  return (
    <div
      onClick={() => onSelect(debt.id)}
      className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:border-emerald-500/50 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group"
    >
      <div>
        {/* Top Badges */}
        <div className="flex items-center justify-between gap-2 mb-2.5">
          <div className="flex items-center gap-1.5 flex-wrap">
            <Badge type="category" value={debt.category} />
            <Badge type="debtStatus" value={debt.status} />
            {debt.isDemo && (
              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300">
                EXEMPLO
              </span>
            )}
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-500 transition-colors" />
        </div>

        {/* Title & Creditor */}
        <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
          {debt.title}
        </h3>
        <p className="text-xs text-slate-500 truncate mt-0.5">
          {debt.creditor}
          {debt.contractNumber && ` • ${debt.contractNumber}`}
        </p>

        {/* Value Metrics */}
        <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs font-mono">
          <div>
            <span className="text-[10px] text-slate-400 font-sans block">VALOR CONTRATADO</span>
            <span className="font-bold text-slate-900 dark:text-white">
              {formatCurrency(debt.totalAmountCents)}
            </span>
          </div>

          <div>
            <span className="text-[10px] text-slate-400 font-sans block">SALDO DEVEDOR</span>
            <span className="font-bold text-amber-600 dark:text-amber-400">
              {formatCurrency(summary.remainingBalanceCents)}
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-3.5">
          <div className="flex items-center justify-between text-[11px] mb-1">
            <span className="text-slate-500">
              {summary.paidInstallmentsCount} de {summary.totalInstallments} parcelas pagas
            </span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono">
              {formatPercentage(summary.progressPercentage)}
            </span>
          </div>

          <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all duration-500"
              style={{ width: `${summary.progressPercentage}%` }}
            />
          </div>
        </div>
      </div>

      {/* Bottom Due Date Info + Quick Action */}
      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
        {nextInst ? (
          <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300 min-w-0">
            <Calendar className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
            <span className="truncate">
              Próx: <strong>{formatDate(nextInst.dueDate)}</strong>
            </span>
            {nextDays && (
              <span className={`text-[10px] font-semibold truncate ${nextDays.isPast ? 'text-rose-600' : 'text-amber-600'}`}>
                ({nextDays.label})
              </span>
            )}
          </div>
        ) : (
          <span className="text-emerald-600 dark:text-emerald-400 text-xs font-semibold flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> Totalmente Quitada
          </span>
        )}

        {nextInst && onQuickPay && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onQuickPay(nextInst, debt);
            }}
            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-semibold transition-colors shadow-sm cursor-pointer whitespace-nowrap ml-2"
          >
            Pagar
          </button>
        )}
      </div>
    </div>
  );
};
