/**
 * DashboardView - Visão Geral Financeira 360° com os 8 KPIs do Quitaí,
 * Gráficos de Fluxo de Caixa, Distribuição e Linha do Tempo de Vencimentos
 */

import React, { useMemo } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { Debt, Installment } from '../../types/finance';
import { StatCard } from '../common/StatCard';
import { CategoryDonutChart } from '../charts/CategoryDonutChart';
import { EvolutionBarChart } from '../charts/EvolutionBarChart';
import { PaidVsRemainingChart } from '../charts/PaidVsRemainingChart';
import { UpcomingMaturitiesTimeline } from '../charts/UpcomingMaturitiesTimeline';
import { formatCurrencyCents } from '../../utils/currency';
import { formatDate, getDaysRemainingLabel } from '../../utils/dates';
import {
  DollarSign,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Layers,
  TrendingUp,
  TrendingDown,
  Plus,
  ArrowRight,
  PieChart,
  BarChart3,
  CalendarDays,
  Sparkles,
  Wallet,
  ArrowDownLeft,
  ArrowUpRight,
  Briefcase,
  Activity,
  PlusCircle,
} from 'lucide-react';

interface DashboardViewProps {
  onNavigateToDebts: (filter?: string) => void;
  onSelectDebt: (debtId: string) => void;
  onOpenCreateDebt: () => void;
  onOpenCreateIncome: () => void;
  onOpenCreateExpense: () => void;
  onOpenCreateInvestment: () => void;
  onQuickPayInstallment: (inst: Installment, debt: Debt) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onNavigateToDebts,
  onSelectDebt,
  onOpenCreateDebt,
  onOpenCreateIncome,
  onOpenCreateExpense,
  onOpenCreateInvestment,
  onQuickPayInstallment,
}) => {
  const {
    debts,
    installments,
    payments,
    incomes,
    expenses,
    investments,
    globalMetrics,
    loadDemoData,
  } = useFinance();

  const nextDue = globalMetrics.nextDueInstallment;
  const nextDays = nextDue ? getDaysRemainingLabel(nextDue.dueDate) : null;
  const debtForNextDue = nextDue ? debts.find((d) => d.id === nextDue.debtId) : null;

  // Monthly 360° Financial Calculations
  const currentMonthCalc = useMemo(() => {
    const today = new Date();
    const currentYearMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;

    // 1. Total Entradas no mês (receitas reais e rendimentos)
    const monthIncomesCents = incomes
      .filter(
        (i) =>
          i.date.startsWith(currentYearMonth) &&
          (i.flowType === 'receita' || i.flowType === 'rendimento_investimento')
      )
      .reduce((sum, i) => sum + i.amountCents, 0);

    // 2. Total Despesas no mês (excluindo dívidas pagas se tiverem tag 'dividas' ou linkedDebtPaymentId para não duplicar)
    const monthOrdinaryExpensesCents = expenses
      .filter(
        (e) =>
          e.date.startsWith(currentYearMonth) &&
          e.category !== 'dividas' &&
          !e.linkedDebtPaymentId
      )
      .reduce((sum, e) => sum + e.amountCents, 0);

    // 3. Total Pago em dívidas no mês (pagamentos reais de parcelas + entradas no mês)
    const monthDebtPaymentsCents = payments
      .filter((p) => p.paymentDate.startsWith(currentYearMonth))
      .reduce((sum, p) => sum + p.amountCents, 0);

    // 4. Saldo Líquido do Período (Entradas - Despesas ordinárias - Pagamentos de dívidas)
    const netBalanceCents = monthIncomesCents - monthOrdinaryExpensesCents - monthDebtPaymentsCents;

    // 7. Total investido informado
    const totalInvestedCents = investments.reduce((sum, inv) => sum + inv.currentAmountCents, 0);

    return {
      monthIncomesCents,
      monthOrdinaryExpensesCents,
      monthDebtPaymentsCents,
      netBalanceCents,
      totalInvestedCents,
    };
  }, [incomes, expenses, payments, investments]);

  return (
    <div className="space-y-6">
      {/* Top Welcome & Quick Actions Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">
              Painel Geral QuitaÍ
            </h1>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
              Tempo Real
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Controle de dívidas, receitas, despesas e investimentos com cálculo de saldo líquido mensal.
          </p>
        </div>

        {/* Quick Action Button Group */}
        <div className="flex flex-wrap items-center gap-2">
          {debts.length === 0 && (
            <button
              type="button"
              onClick={loadDemoData}
              className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Carregar Exemplo</span>
            </button>
          )}

          <button
            type="button"
            onClick={onOpenCreateIncome}
            className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900 text-emerald-700 dark:text-emerald-300 rounded-xl text-xs font-bold border border-emerald-200 dark:border-emerald-800 transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <ArrowDownLeft className="w-3.5 h-3.5" />
            <span>+ Entrada</span>
          </button>

          <button
            type="button"
            onClick={onOpenCreateExpense}
            className="px-3 py-2 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/60 dark:hover:bg-rose-900 text-rose-700 dark:text-rose-300 rounded-xl text-xs font-bold border border-rose-200 dark:border-rose-800 transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>+ Despesa</span>
          </button>

          <button
            type="button"
            onClick={onOpenCreateInvestment}
            className="px-3 py-2 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900 text-indigo-700 dark:text-indigo-300 rounded-xl text-xs font-bold border border-indigo-200 dark:border-indigo-800 transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>+ Investimento</span>
          </button>

          <button
            type="button"
            onClick={onOpenCreateDebt}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm shadow-emerald-600/20 transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Nova Dívida</span>
          </button>
        </div>
      </div>

      {/* 8 Destaques Principais Exigidos no Prompt */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Total de entradas no mês */}
        <StatCard
          title="Entradas no Mês"
          value={formatCurrencyCents(currentMonthCalc.monthIncomesCents)}
          subtext="Salários e receitas recebidas"
          icon={<ArrowDownLeft className="w-5 h-5" />}
          variant="emerald"
        />

        {/* 2. Total de despesas no mês */}
        <StatCard
          title="Despesas no Mês"
          value={formatCurrencyCents(currentMonthCalc.monthOrdinaryExpensesCents)}
          subtext="Contas, moradia e gastos do dia a dia"
          icon={<ArrowUpRight className="w-5 h-5" />}
          variant="rose"
        />

        {/* 3. Total pago em dívidas no mês */}
        <StatCard
          title="Pago em Dívidas no Mês"
          value={formatCurrencyCents(currentMonthCalc.monthDebtPaymentsCents)}
          subtext="Amortização de parcelas no período"
          icon={<Layers className="w-5 h-5" />}
          variant="blue"
        />

        {/* 4. Saldo líquido do período */}
        <StatCard
          title="Saldo Líquido do Período"
          value={formatCurrencyCents(currentMonthCalc.netBalanceCents)}
          subtext="Receitas - Despesas - Dívidas pagas"
          icon={<Activity className="w-5 h-5" />}
          variant={currentMonthCalc.netBalanceCents >= 0 ? 'emerald' : 'rose'}
        />

        {/* 5. Total de dívidas contratadas */}
        <StatCard
          title="Total Dívidas Contratadas"
          value={formatCurrencyCents(globalMetrics.totalContractedCents)}
          subtext={`${globalMetrics.totalDebtsCount} contratos ativos no sistema`}
          icon={<DollarSign className="w-5 h-5" />}
          variant="default"
          onClick={() => onNavigateToDebts('todos')}
        />

        {/* 6. Saldo devedor total */}
        <StatCard
          title="Saldo Devedor Total"
          value={formatCurrencyCents(globalMetrics.totalRemainingBalanceCents)}
          subtext="Valor restante para quitação plena"
          icon={<Clock className="w-5 h-5" />}
          variant="amber"
        />

        {/* 7. Total investido informado */}
        <StatCard
          title="Total Investido Informado"
          value={formatCurrencyCents(currentMonthCalc.totalInvestedCents)}
          subtext={`${investments.length} ativos reportados`}
          icon={<Briefcase className="w-5 h-5" />}
          variant="purple"
        />

        {/* 8. Próximos vencimentos mais urgentes */}
        <StatCard
          title="Próximo Vencimento"
          value={nextDue ? formatDate(nextDue.dueDate) : 'Nenhum'}
          subtext={
            nextDue && debtForNextDue
              ? `${debtForNextDue.title} • ${formatCurrencyCents(nextDue.expectedAmountCents)} (${nextDays?.label})`
              : 'Nenhuma parcela pendente'
          }
          icon={<Calendar className="w-5 h-5" />}
          variant={nextDays?.isPast ? 'rose' : 'default'}
          onClick={() => {
            if (nextDue && debtForNextDue) {
              onSelectDebt(debtForNextDue.id);
            }
          }}
        />
      </div>

      {/* Gráficos Visuais Modernos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico 1: Distribuição das Dívidas por Categoria */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <PieChart className="w-4 h-4 text-emerald-500" />
                Distribuição das Dívidas por Categoria
              </h3>
              <span className="text-[11px] text-slate-400">Por valor contratado</span>
            </div>
            <CategoryDonutChart debts={debts} />
          </div>
        </div>

        {/* Gráfico 2: Evolução de Pagamentos Realizados */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-blue-500" />
                Evolução do Valor Pago ao Longo do Tempo
              </h3>
              <span className="text-[11px] text-slate-400">Total mensal amortizado</span>
            </div>
            <EvolutionBarChart payments={payments} />
          </div>
        </div>

        {/* Gráfico 3: Comparação Valores Pagos vs Saldos Restantes */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-purple-500" />
              Comparação: Pago vs Saldo Restante por Dívida
            </h3>
            <button
              type="button"
              onClick={() => onNavigateToDebts('todos')}
              className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold hover:underline flex items-center gap-1 cursor-pointer"
            >
              Ver todas <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <PaidVsRemainingChart
            debts={debts}
            installments={installments}
            payments={payments}
            onSelectDebt={onSelectDebt}
          />
        </div>

        {/* Gráfico 4 / Linha do Tempo: Próximos Vencimentos a Pagar */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Calendar className="w-4 h-4 text-amber-500" />
              Próximos Vencimentos de Dívidas
            </h3>
            <span className="text-[11px] text-slate-400">Próximas 8 parcelas</span>
          </div>
          <UpcomingMaturitiesTimeline
            debts={debts}
            installments={installments}
            onSelectDebt={onSelectDebt}
            onPayInstallment={onQuickPayInstallment}
          />
        </div>
      </div>
    </div>
  );
};
