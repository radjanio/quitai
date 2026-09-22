/**
 * OverviewTab - Debt details summary cards, progress metrics and visual timeline
 */

import React from 'react';
import { Debt, Installment, PaymentRecord, DebtFinancialSummary } from '../../types/finance';
import { Badge } from '../common/Badge';
import { formatCurrency, formatPercentage } from '../../utils/currency';
import { formatDate, getDaysRemainingLabel } from '../../utils/dates';
import {
  Calendar,
  CheckCircle2,
  Clock,
  CreditCard,
  DollarSign,
  FileText,
  TrendingUp,
  User,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';

interface OverviewTabProps {
  debt: Debt;
  installments: Installment[];
  payments: PaymentRecord[];
  summary: DebtFinancialSummary;
  onPayInstallment: (inst: Installment) => void;
  onPayDownPayment: () => void;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({
  debt,
  installments,
  payments,
  summary,
  onPayInstallment,
  onPayDownPayment,
}) => {
  const nextInst = summary.nextDueInstallment;
  const nextDays = nextInst ? getDaysRemainingLabel(nextInst.dueDate) : null;

  return (
    <div className="space-y-6">
      {/* Top Banner KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Contratado */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span>Valor Contratado</span>
            <DollarSign className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-xl font-bold font-mono text-slate-900 dark:text-white">
            {formatCurrency(debt.totalAmountCents)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Entrada: {formatCurrency(debt.downPaymentCents)}
          </div>
        </div>

        {/* Total Efetivamente Pago */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-emerald-100 dark:border-emerald-950/60 shadow-sm">
          <div className="flex items-center justify-between text-xs text-emerald-600 dark:text-emerald-400 mb-1">
            <span>Total Efetivamente Pago</span>
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
            {formatCurrency(summary.totalPaidCents)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {summary.paidInstallmentsCount} de {summary.totalInstallments} parcelas quitadas
          </div>
        </div>

        {/* Saldo Devedor Restante */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-amber-100 dark:border-amber-950/60 shadow-sm">
          <div className="flex items-center justify-between text-xs text-amber-600 dark:text-amber-400 mb-1">
            <span>Saldo Devedor Restante</span>
            <Clock className="w-4 h-4" />
          </div>
          <div className="text-xl font-bold font-mono text-amber-600 dark:text-amber-400">
            {formatCurrency(summary.remainingBalanceCents)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {summary.pendingInstallmentsCount} parcelas pendentes
          </div>
        </div>

        {/* Progresso Geral */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-blue-100 dark:border-blue-950/60 shadow-sm">
          <div className="flex items-center justify-between text-xs text-blue-600 dark:text-blue-400 mb-1">
            <span>Progresso da Quitação</span>
            <TrendingUp className="w-4 h-4" />
          </div>
          <div className="text-xl font-bold font-mono text-blue-600 dark:text-blue-400">
            {formatPercentage(summary.progressPercentage)}
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden mt-2">
            <div
              className="bg-blue-600 h-full rounded-full transition-all duration-500"
              style={{ width: `${summary.progressPercentage}%` }}
            />
          </div>
        </div>
      </div>

      {/* Down payment prompt if not paid */}
      {debt.downPaymentCents > 0 && !debt.downPaymentPaid && (
        <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-6 h-6 text-amber-600 flex-shrink-0" />
            <div>
              <h4 className="text-sm font-bold text-amber-900 dark:text-amber-200">
                Entrada Pendente de Pagamento ({formatCurrency(debt.downPaymentCents)})
              </h4>
              <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">
                A entrada acordada em contrato ainda não foi marcada como quitada neste sistema.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onPayDownPayment}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-colors cursor-pointer whitespace-nowrap"
          >
            Registrar Pagamento da Entrada
          </button>
        </div>
      )}

      {/* Informações Contratuais Detalhadas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
          <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
            <FileText className="w-4 h-4 text-emerald-500" />
            Especificações do Contrato
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <span className="text-slate-500 block text-[11px]">Credor / Instituição</span>
              <strong className="text-slate-800 dark:text-slate-200 font-medium text-sm">
                {debt.creditor}
              </strong>
            </div>

            <div>
              <span className="text-slate-500 block text-[11px]">Nº do Contrato</span>
              <strong className="text-slate-800 dark:text-slate-200 font-medium font-mono text-sm">
                {debt.contractNumber || 'Não informado'}
              </strong>
            </div>

            <div>
              <span className="text-slate-500 block text-[11px]">Data de Início</span>
              <strong className="text-slate-800 dark:text-slate-200 font-medium text-sm">
                {formatDate(debt.startDate)}
              </strong>
            </div>

            <div>
              <span className="text-slate-500 block text-[11px]">Dia de Vencimento</span>
              <strong className="text-slate-800 dark:text-slate-200 font-medium font-mono text-sm">
                Todo dia {debt.dueDay}
              </strong>
            </div>

            <div>
              <span className="text-slate-500 block text-[11px]">Forma de Pagamento</span>
              <div className="mt-1">
                <Badge type="paymentMethod" value={debt.paymentMethod} />
              </div>
            </div>

            <div>
              <span className="text-slate-500 block text-[11px]">Status Geral</span>
              <div className="mt-1">
                <Badge type="debtStatus" value={debt.status} />
              </div>
            </div>

            {debt.interestRateAnnual !== undefined && (
              <div>
                <span className="text-slate-500 block text-[11px]">Taxa de Juros a.a.</span>
                <strong className="text-slate-800 dark:text-slate-200 font-mono text-sm">
                  {debt.interestRateAnnual}% ao ano
                </strong>
              </div>
            )}

            {debt.monetaryCorrectionIndex && (
              <div>
                <span className="text-slate-500 block text-[11px]">Índice de Reajuste</span>
                <strong className="text-slate-800 dark:text-slate-200 font-medium text-sm">
                  {debt.monetaryCorrectionIndex}
                </strong>
              </div>
            )}

            <div>
              <span className="text-slate-500 block text-[11px]">Parcela Média Prevista</span>
              <strong className="text-slate-800 dark:text-slate-200 font-mono text-sm">
                {formatCurrency(debt.defaultInstallmentAmountCents)}
              </strong>
            </div>
          </div>

          {debt.description && (
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300">
              <strong className="block text-[11px] text-slate-500 mb-1">Descrição / Notas do Bem:</strong>
              {debt.description}
            </div>
          )}
        </div>

        {/* Card Próximo Vencimento */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1.5 mb-3">
              <Calendar className="w-4 h-4 text-blue-500" />
              Próxima Parcela a Pagar
            </h3>

            {nextInst ? (
              <div className="space-y-3">
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      Parcela #{nextInst.installmentNumber}
                    </span>
                    <Badge type="installmentStatus" value={nextInst.status} />
                  </div>
                  <div className="text-2xl font-bold font-mono text-slate-900 dark:text-white my-1">
                    {formatCurrency(nextInst.expectedAmountCents)}
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-slate-500">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Vencimento: {formatDate(nextInst.dueDate)}</span>
                    {nextDays && (
                      <strong className={`ml-auto ${nextDays.isPast ? 'text-rose-600' : 'text-amber-600'}`}>
                        {nextDays.label}
                      </strong>
                    )}
                  </div>
                </div>

                {summary.overdueInstallmentsCount > 0 && (
                  <div className="p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/60 text-[11px] text-rose-700 dark:text-rose-400 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>Atenção: existem {summary.overdueInstallmentsCount} parcelas vencidas nesta dívida.</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-xs text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="w-8 h-8 mx-auto mb-2 opacity-80" />
                Dívida totalmente quitada!
              </div>
            )}
          </div>

          {nextInst && (
            <button
              type="button"
              onClick={() => onPayInstallment(nextInst)}
              className="mt-4 w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold transition-colors shadow-sm cursor-pointer flex items-center justify-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              Pagar Parcela #{nextInst.installmentNumber}
            </button>
          )}
        </div>
      </div>

      {/* Linha do tempo visual de pagamentos */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4 text-purple-500" />
            Evolução Cronológica de Pagamentos Realizados
          </h3>
          <span className="text-xs font-mono text-slate-500">
            {payments.length} pagamentos registrados
          </span>
        </div>

        {payments.length === 0 ? (
          <div className="text-center py-8 text-xs text-slate-400 dark:text-slate-500">
            Nenhum pagamento registrado ainda. Utilize a aba "Parcelas" para registrar quitações.
          </div>
        ) : (
          <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
            {payments.slice(0, 10).map((pay) => (
              <div key={pay.id} className="relative flex items-start gap-4 text-xs">
                {/* Timeline dot */}
                <div className="absolute -left-6 top-0.5 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900 shadow-sm flex items-center justify-center text-white">
                  <CheckCircle2 className="w-2.5 h-2.5" />
                </div>

                <div className="flex-1 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {pay.isDownPayment ? 'Entrada Contratual' : pay.notes || 'Pagamento de Parcela'}
                    </span>
                    <strong className="font-mono text-emerald-600 dark:text-emerald-400 text-sm">
                      {formatCurrency(pay.amountCents)}
                    </strong>
                  </div>
                  <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-1">
                    <span>Data: {formatDate(pay.paymentDate)}</span>
                    <span>• Método: <Badge type="paymentMethod" value={pay.paymentMethod} /></span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
