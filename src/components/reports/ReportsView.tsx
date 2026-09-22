/**
 * ReportsView - Relatórios Consolidados, Fluxo de Caixa, Extrato de Pagamentos e Exportação CSV / Impressão
 */

import React, { useState, useMemo } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { formatCurrencyCents, formatPercentage } from '../../utils/currency';
import { formatDate } from '../../utils/dates';
import { calculateDebtSummary } from '../../services/storage';
import {
  FileText,
  Download,
  Printer,
  Filter,
  Layers,
  Calendar,
  CheckCircle2,
  Clock,
  DollarSign,
  TrendingUp,
  ArrowDownLeft,
  ArrowUpRight,
  Activity,
  Briefcase,
} from 'lucide-react';

export const ReportsView: React.FC = () => {
  const { debts, installments, payments, incomes, expenses, investments, globalMetrics } = useFinance();

  const [activeReportTab, setActiveReportTab] = useState<'cashflow' | 'debts' | 'monthly'>('cashflow');
  const [selectedDebtId, setSelectedDebtId] = useState<string>('todos');
  const [selectedCategory, setSelectedCategory] = useState<string>('todas');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  // Filtered debts
  const filteredDebts = useMemo(() => {
    return debts.filter((d) => {
      if (selectedDebtId !== 'todos' && d.id !== selectedDebtId) return false;
      if (selectedCategory !== 'todas' && d.category !== selectedCategory) return false;
      return true;
    });
  }, [debts, selectedDebtId, selectedCategory]);

  // Combined Cashflow Items (Incomes, Expenses, Debt Payments)
  const cashflowItems = useMemo(() => {
    interface CashflowRow {
      id: string;
      date: string;
      description: string;
      category: string;
      type: 'entrada' | 'despesa' | 'divida';
      amountCents: number;
    }

    const rows: CashflowRow[] = [];

    // Incomes
    incomes.forEach((inc) => {
      rows.push({
        id: inc.id,
        date: inc.date,
        description: inc.description,
        category: inc.category,
        type: 'entrada',
        amountCents: inc.amountCents,
      });
    });

    // Expenses (excluding duplicates of debt payments)
    expenses.forEach((exp) => {
      if (!exp.linkedDebtPaymentId && exp.category !== 'dividas') {
        rows.push({
          id: exp.id,
          date: exp.date,
          description: exp.description,
          category: exp.category,
          type: 'despesa',
          amountCents: exp.amountCents,
        });
      }
    });

    // Debt Payments
    payments.forEach((pay) => {
      const debt = debts.find((d) => d.id === pay.debtId);
      rows.push({
        id: pay.id,
        date: pay.paymentDate,
        description: `Amortização: ${debt?.title || 'Dívida'} (${pay.isDownPayment ? 'Entrada' : 'Parcela'})`,
        category: 'dividas',
        type: 'divida',
        amountCents: pay.amountCents,
      });
    });

    return rows
      .filter((r) => {
        if (startDate && r.date < startDate) return false;
        if (endDate && r.date > endDate) return false;
        return true;
      })
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [incomes, expenses, payments, debts, startDate, endDate]);

  // Totals for cash flow
  const cashflowTotals = useMemo(() => {
    const totalIncomes = cashflowItems
      .filter((i) => i.type === 'entrada')
      .reduce((sum, i) => sum + i.amountCents, 0);

    const totalExpenses = cashflowItems
      .filter((i) => i.type === 'despesa')
      .reduce((sum, i) => sum + i.amountCents, 0);

    const totalDebts = cashflowItems
      .filter((i) => i.type === 'divida')
      .reduce((sum, i) => sum + i.amountCents, 0);

    const netResult = totalIncomes - totalExpenses - totalDebts;

    return { totalIncomes, totalExpenses, totalDebts, netResult };
  }, [cashflowItems]);

  // CSV Export for Cashflow
  const handleExportCashflowCsv = () => {
    const headers = ['Data', 'Tipo', 'Descrição', 'Categoria', 'Valor (R$)'];
    const rows = cashflowItems.map((item) => {
      const signedVal = item.type === 'entrada' ? item.amountCents : -item.amountCents;
      return [
        item.date,
        item.type.toUpperCase(),
        `"${item.description.replace(/"/g, '""')}"`,
        item.category,
        (signedVal / 100).toFixed(2),
      ].join(';');
    });

    const csvContent = '\uFEFF' + [headers.join(';'), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `quitai_extrato_fluxo_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // CSV Export for Debts Consolidated
  const handleExportDebtsCsv = () => {
    const headers = ['Dívida', 'Categoria', 'Credor', 'Contrato', 'Status', 'Valor Total (R$)', 'Entrada (R$)', 'Total Pago (R$)', 'Saldo Devedor (R$)', 'Progresso (%)'];
    const rows = filteredDebts.map((d) => {
      const dInst = installments.filter((i) => i.debtId === d.id);
      const dPay = payments.filter((p) => p.debtId === d.id);
      const summary = calculateDebtSummary(d, dInst, dPay);

      return [
        `"${d.title.replace(/"/g, '""')}"`,
        d.category,
        `"${d.creditor.replace(/"/g, '""')}"`,
        `"${(d.contractNumber || '').replace(/"/g, '""')}"`,
        d.status,
        (d.totalAmountCents / 100).toFixed(2),
        (d.downPaymentCents / 100).toFixed(2),
        (summary.totalPaidCents / 100).toFixed(2),
        (summary.remainingBalanceCents / 100).toFixed(2),
        summary.progressPercentage.toFixed(2),
      ].join(';');
    });

    const csvContent = '\uFEFF' + [headers.join(';'), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `quitai_relatorio_dividas_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm print:hidden">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">
            Relatórios e Extratos Financeiros
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Demonstrativo de fluxo de caixa, balanço de passivos e exportação para Excel ou impressão
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExportCashflowCsv}
            className="px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer flex items-center gap-1.5"
            title="Exportar fluxo de caixa para CSV"
          >
            <Download className="w-4 h-4 text-emerald-600" />
            CSV Fluxo de Caixa
          </button>

          <button
            type="button"
            onClick={handleExportDebtsCsv}
            className="px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer flex items-center gap-1.5"
            title="Exportar demonstrativo de dívidas para CSV"
          >
            <Download className="w-4 h-4 text-blue-600" />
            CSV Dívidas
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="px-3.5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 rounded-xl text-xs font-semibold shadow-sm transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <Printer className="w-4 h-4" />
            Imprimir
          </button>
        </div>
      </div>

      {/* Tabs Switcher */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3 print:hidden">
        <button
          type="button"
          onClick={() => setActiveReportTab('cashflow')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeReportTab === 'cashflow'
              ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          Extrato Consolidado de Caixa
        </button>

        <button
          type="button"
          onClick={() => setActiveReportTab('debts')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeReportTab === 'debts'
              ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          Amortização de Dívidas
        </button>
      </div>

      {/* Tab: Cashflow Statement */}
      {activeReportTab === 'cashflow' && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
              <span className="text-xs font-semibold text-slate-500">Total Entradas</span>
              <p className="text-xl font-black text-emerald-600 mt-1 font-mono">
                +{formatCurrencyCents(cashflowTotals.totalIncomes)}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
              <span className="text-xs font-semibold text-slate-500">Total Despesas Ordinárias</span>
              <p className="text-xl font-black text-rose-600 mt-1 font-mono">
                -{formatCurrencyCents(cashflowTotals.totalExpenses)}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
              <span className="text-xs font-semibold text-slate-500">Amortizações de Dívidas</span>
              <p className="text-xl font-black text-indigo-600 mt-1 font-mono">
                -{formatCurrencyCents(cashflowTotals.totalDebts)}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
              <span className="text-xs font-semibold text-slate-500">Resultado Líquido</span>
              <p
                className={`text-xl font-black mt-1 font-mono ${
                  cashflowTotals.netResult >= 0 ? 'text-emerald-600' : 'text-rose-600'
                }`}
              >
                {formatCurrencyCents(cashflowTotals.netResult)}
              </p>
            </div>
          </div>

          {/* Date Filter */}
          <div className="flex flex-wrap items-center gap-3 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm text-xs print:hidden">
            <span className="font-bold text-slate-700 dark:text-slate-300">Período:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
            />
            <span>até</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
            />
            {(startDate || endDate) && (
              <button
                type="button"
                onClick={() => {
                  setStartDate('');
                  setEndDate('');
                }}
                className="text-xs text-rose-600 font-bold hover:underline ml-2"
              >
                Limpar datas
              </button>
            )}
          </div>

          {/* Table */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 text-slate-400 font-bold uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-4 sm:px-6">Data</th>
                    <th className="py-3 px-4">Tipo</th>
                    <th className="py-3 px-4">Descrição</th>
                    <th className="py-3 px-4">Categoria</th>
                    <th className="py-3 px-4 text-right">Valor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {cashflowItems.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-slate-400">
                        Nenhuma movimentação registrada no período selecionado.
                      </td>
                    </tr>
                  ) : (
                    cashflowItems.map((item) => (
                      <tr
                        key={item.id}
                        className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors"
                      >
                        <td className="py-3 px-4 sm:px-6 font-mono text-slate-600 dark:text-slate-400">
                          {item.date}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              item.type === 'entrada'
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                : item.type === 'despesa'
                                ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                                : 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300'
                            }`}
                          >
                            {item.type.toUpperCase()}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                          {item.description}
                        </td>
                        <td className="py-3 px-4 capitalize text-slate-600 dark:text-slate-400">
                          {item.category}
                        </td>
                        <td
                          className={`py-3 px-4 text-right font-bold font-mono ${
                            item.type === 'entrada'
                              ? 'text-emerald-600'
                              : item.type === 'despesa'
                              ? 'text-rose-600'
                              : 'text-indigo-600'
                          }`}
                        >
                          {item.type === 'entrada' ? '+' : '-'} {formatCurrencyCents(item.amountCents)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Debts Amortization Table */}
      {activeReportTab === 'debts' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 text-slate-400 font-bold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4 sm:px-6">Dívida / Credor</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Valor Total</th>
                  <th className="py-3 px-4 text-right">Total Pago</th>
                  <th className="py-3 px-4 text-right">Saldo Devedor</th>
                  <th className="py-3 px-4 sm:px-6 text-center">Progresso</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {filteredDebts.map((d) => {
                  const dInst = installments.filter((i) => i.debtId === d.id);
                  const dPay = payments.filter((p) => p.debtId === d.id);
                  const summary = calculateDebtSummary(d, dInst, dPay);

                  return (
                    <tr key={d.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30">
                      <td className="py-3 px-4 sm:px-6">
                        <p className="font-bold text-slate-900 dark:text-white">{d.title}</p>
                        <p className="text-[11px] text-slate-400">{d.creditor}</p>
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          {d.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-semibold">
                        {formatCurrencyCents(d.totalAmountCents)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-emerald-600">
                        {formatCurrencyCents(summary.totalPaidCents)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-amber-600">
                        {formatCurrencyCents(summary.remainingBalanceCents)}
                      </td>
                      <td className="py-3 px-4 sm:px-6 text-center font-bold">
                        {summary.progressPercentage.toFixed(1)}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
