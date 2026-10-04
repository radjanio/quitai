/**
 * AmortizationTab - Simulador e Efetivação de Amortização Extraordinária (CDC Art. 52 § 2º)
 * Quitação antecipada de parcelas de trás para frente com redução proporcional dos juros.
 */

import React, { useState, useMemo } from 'react';
import { Debt, Installment, PaymentMethod } from '../../types/finance';
import { formatCurrency, formatPercentage } from '../../utils/currency';
import { formatDate } from '../../utils/dates';
import {
  Sparkles,
  Calculator,
  TrendingDown,
  Calendar,
  CheckCircle2,
  DollarSign,
  AlertCircle,
  HelpCircle,
  ArrowRight,
  ShieldCheck,
  ChevronRight,
} from 'lucide-react';

interface AmortizationTabProps {
  debt: Debt;
  installments: Installment[];
  onAmortize: (
    paidAmountCents: number,
    installmentsToPay: { installmentId: string; paidCents: number; discountCents: number }[],
    paymentDate: string,
    paymentMethod: PaymentMethod,
    notes?: string
  ) => void;
}

export const AmortizationTab: React.FC<AmortizationTabProps> = ({
  debt,
  installments,
  onAmortize,
}) => {
  // Pending installments sorted from last to first (reverse chronological order)
  const pendingInstallments = useMemo(() => {
    return installments
      .filter((i) => i.status !== 'paga' && i.status !== 'cancelada')
      .sort((a, b) => b.installmentNumber - a.installmentNumber);
  }, [installments]);

  // Mode: by amount (R$) or by quantity of installments
  const [mode, setMode] = useState<'amount' | 'count'>('amount');
  const [targetAmountInput, setTargetAmountInput] = useState<string>('3000');
  const [targetCountInput, setTargetCountInput] = useState<number>(3);

  // Annual / Monthly interest rate
  const initialMonthlyRate = useMemo(() => {
    if (debt.interestRateAnnual && debt.interestRateAnnual > 0) {
      // (1 + i_a)^(1/12) - 1
      const annual = debt.interestRateAnnual / 100;
      const monthly = Math.pow(1 + annual, 1 / 12) - 1;
      return +(monthly * 100).toFixed(2);
    }
    return 1.2; // Taxa média de financiamento no Brasil
  }, [debt.interestRateAnnual]);

  const [customMonthlyRate, setCustomMonthlyRate] = useState<number>(initialMonthlyRate);

  // Execution modal state
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [paymentDate, setPaymentDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('pix');
  const [notes, setNotes] = useState('');

  // Simulation calculation
  const simulation = useMemo(() => {
    if (pendingInstallments.length === 0) {
      return {
        affectedInstallments: [],
        totalNominalCents: 0,
        totalNetCents: 0,
        totalDiscountCents: 0,
        monthsSaved: 0,
        newFinalDueDate: null,
      };
    }

    const monthlyRate = Math.max(0.001, (customMonthlyRate || 1.2) / 100);
    const today = new Date();

    // Calculate present value for each pending installment from the back
    // Present Value = FV / (1 + i)^n
    const calculatedInstallments = pendingInstallments.map((inst, indexFromBack) => {
      const dueDate = new Date(inst.dueDate);
      const monthsDiff = Math.max(
        1,
        (dueDate.getFullYear() - today.getFullYear()) * 12 +
          (dueDate.getMonth() - today.getMonth())
      );

      const faceValueCents = Math.max(0, inst.expectedAmountCents - (inst.paidAmountCents || 0));
      // Desconto de juros compostos a valor presente
      const presentValueCents = Math.round(faceValueCents / Math.pow(1 + monthlyRate, monthsDiff));
      const discountCents = Math.max(0, faceValueCents - presentValueCents);

      return {
        installment: inst,
        monthsToDue: monthsDiff,
        faceValueCents,
        presentValueCents,
        discountCents,
      };
    });

    let selected: typeof calculatedInstallments = [];

    if (mode === 'amount') {
      const budgetCents = Math.round(parseFloat(targetAmountInput || '0') * 100);
      let accumulatedCents = 0;

      for (const item of calculatedInstallments) {
        if (accumulatedCents + item.presentValueCents <= budgetCents) {
          accumulatedCents += item.presentValueCents;
          selected.push(item);
        } else {
          // If we haven't selected anything yet and budget is > 0, include at least 1 or partial
          if (selected.length === 0 && budgetCents > 0) {
            const partialNet = budgetCents;
            const partialDiscount = Math.round(
              (item.discountCents / item.presentValueCents) * partialNet
            );
            selected.push({
              ...item,
              presentValueCents: partialNet,
              discountCents: partialDiscount,
              faceValueCents: partialNet + partialDiscount,
            });
          }
          break;
        }
      }
    } else {
      const count = Math.min(targetCountInput || 1, calculatedInstallments.length);
      selected = calculatedInstallments.slice(0, count);
    }

    const totalNominalCents = selected.reduce((acc, i) => acc + i.faceValueCents, 0);
    const totalNetCents = selected.reduce((acc, i) => acc + i.presentValueCents, 0);
    const totalDiscountCents = selected.reduce((acc, i) => acc + i.discountCents, 0);
    const monthsSaved = selected.length;

    // Remaining installments after this simulation
    const selectedIds = new Set(selected.map((s) => s.installment.id));
    const remainingInstallments = pendingInstallments.filter((i) => !selectedIds.has(i.id));
    const newFinalDueDate =
      remainingInstallments.length > 0
        ? remainingInstallments[0].dueDate // remember pendingInstallments is sorted last-to-first
        : null;

    return {
      affectedInstallments: selected,
      totalNominalCents,
      totalNetCents,
      totalDiscountCents,
      monthsSaved,
      newFinalDueDate,
    };
  }, [pendingInstallments, mode, targetAmountInput, targetCountInput, customMonthlyRate]);

  const handleConfirm = () => {
    if (simulation.affectedInstallments.length === 0) return;

    const installmentsToPay = simulation.affectedInstallments.map((item) => ({
      installmentId: item.installment.id,
      paidCents: item.presentValueCents,
      discountCents: item.discountCents,
    }));

    onAmortize(
      simulation.totalNetCents,
      installmentsToPay,
      paymentDate,
      paymentMethod,
      notes || `Amortização antecipada de ${installmentsToPay.length} parcela(s) do final (CDC Art. 52)`
    );

    setIsConfirmModalOpen(false);
  };

  if (pendingInstallments.length === 0) {
    return (
      <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
        <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
        <h3 className="text-base font-bold text-slate-800 dark:text-white">
          Dívida Totalmente Quitada!
        </h3>
        <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
          Não há parcelas pendentes para amortizar nesta dívida. Todas as parcelas foram liquidadas com sucesso.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Educational Banner - CDC */}
      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-sky-500/10 border border-emerald-200/80 dark:border-emerald-800/60 shadow-sm">
        <div className="flex items-start gap-3.5">
          <div className="p-2.5 bg-emerald-500 text-white rounded-xl shadow-sm flex-shrink-0 mt-0.5">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Amortização Antecipada CDC (Art. 52 § 2º)
              </h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                Direito do Consumidor
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
              Ao antecipar as <strong>parcelas do final (de trás para frente)</strong>, você elimina as parcelas com maior acúmulo de juros futuros e reduz diretamente o prazo do contrato. O credor é legalmente obrigado a conceder o <strong>desconto proporcional dos juros</strong>.
            </p>
          </div>
        </div>
      </div>

      {/* Simulator Inputs & Configuration */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Calculator className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              Simulador de Amortização
            </h4>
            <p className="text-xs text-slate-500">
              Escolha como deseja amortizar suas parcelas finais
            </p>
          </div>

          {/* Mode Selector Tabs */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setMode('amount')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                mode === 'amount'
                  ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Por Valor em R$
            </button>
            <button
              type="button"
              onClick={() => setMode('count')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                mode === 'count'
                  ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Por Qtd. de Parcelas
            </button>
          </div>
        </div>

        {/* Input Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {mode === 'amount' ? (
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Valor que deseja pagar hoje (R$)
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-2.5 text-xs font-bold text-slate-400">R$</span>
                <input
                  type="number"
                  step="50"
                  min="50"
                  inputMode="decimal"
                  value={targetAmountInput}
                  onChange={(e) => setTargetAmountInput(e.target.value)}
                  placeholder="Ex: 3000"
                  className="w-full pl-10 pr-3.5 py-2 rounded-xl text-sm font-semibold border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Sugestões:{' '}
                {[1000, 2500, 5000].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setTargetAmountInput(val.toString())}
                    className="text-emerald-600 hover:underline mr-2 font-medium"
                  >
                    R$ {val}
                  </button>
                ))}
              </p>
            </div>
          ) : (
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Quantidade de parcelas do final
              </label>
              <input
                type="number"
                min="1"
                max={pendingInstallments.length}
                value={targetCountInput}
                onChange={(e) => setTargetCountInput(parseInt(e.target.value) || 1)}
                className="w-full px-3.5 py-2 rounded-xl text-sm font-semibold border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Máximo de {pendingInstallments.length} parcelas pendentes
              </p>
            </div>
          )}

          {/* Taxa de juros mensal */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center justify-between">
              <span>Taxa de Juros Mensal (%)</span>
              <span className="text-[10px] text-slate-400">Desconto CDC</span>
            </label>
            <div className="relative">
              <input
                type="number"
                step="0.05"
                min="0.1"
                max="15"
                inputMode="decimal"
                value={customMonthlyRate}
                onChange={(e) => setCustomMonthlyRate(parseFloat(e.target.value) || 1.2)}
                className="w-full px-3.5 py-2 rounded-xl text-sm font-semibold border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <span className="absolute right-3.5 top-2 text-xs font-bold text-slate-400">% a.m.</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              {debt.interestRateAnnual
                ? `Baseada nos ${debt.interestRateAnnual}% a.a. do contrato`
                : 'Média de mercado para amortizações'}
            </p>
          </div>

          {/* Action Callout */}
          <div className="flex flex-col justify-end">
            <button
              type="button"
              disabled={simulation.affectedInstallments.length === 0}
              onClick={() => setIsConfirmModalOpen(true)}
              className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-xs font-bold shadow-sm transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              Efetivar Amortização Agora
            </button>
            <p className="text-[10px] text-center text-slate-400 mt-1">
              Baixa imediata nas parcelas selecionadas
            </p>
          </div>
        </div>
      </div>

      {/* Simulation Result KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Economia de Juros */}
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-200 dark:border-emerald-800/70 shadow-sm">
          <div className="flex items-center justify-between text-xs text-emerald-700 dark:text-emerald-300 font-semibold mb-1">
            <span>Economia de Juros</span>
            <TrendingDown className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl font-bold font-mono text-emerald-700 dark:text-emerald-300">
            {formatCurrency(simulation.totalDiscountCents)}
          </div>
          <p className="text-[11px] text-emerald-600/80 mt-1 font-medium">
            Dinheiro que não vai para o banco!
          </p>
        </div>

        {/* Valor a Pagar Hoje */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span>Valor com Desconto</span>
            <DollarSign className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-xl font-bold font-mono text-slate-900 dark:text-white">
            {formatCurrency(simulation.totalNetCents)}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Valor facial original: {formatCurrency(simulation.totalNominalCents)}
          </p>
        </div>

        {/* Parcelas Eliminadas */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span>Parcelas Eliminadas</span>
            <CheckCircle2 className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-xl font-bold font-mono text-blue-600 dark:text-blue-400">
            {simulation.affectedInstallments.length} parcelas
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Do final do contrato para o início
          </p>
        </div>

        {/* Meses Adiantados */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span>Redução no Prazo</span>
            <Calendar className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-xl font-bold font-mono text-purple-600 dark:text-purple-400">
            {simulation.monthsSaved} meses antes
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            {simulation.newFinalDueDate
              ? `Término antecipado: ${formatDate(simulation.newFinalDueDate)}`
              : 'Dívida totalmente liquidada!'}
          </p>
        </div>
      </div>

      {/* Detailed Affected Installments Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Parcelas que serão quitadas ({simulation.affectedInstallments.length})
            </h4>
            <p className="text-[11px] text-slate-500">
              Ordenadas da última parcela para a primeira (desconto máximo de juros)
            </p>
          </div>
          <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-lg">
            Desconto médio:{' '}
            {simulation.totalNominalCents > 0
              ? `${Math.round((simulation.totalDiscountCents / simulation.totalNominalCents) * 100)}%`
              : '0%'}
          </span>
        </div>

        {simulation.affectedInstallments.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-xs">
            Nenhuma parcela selecionada. Ajuste o valor ou a quantidade acima.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-2.5 px-4">Parcela</th>
                  <th className="py-2.5 px-4">Vencimento Original</th>
                  <th className="py-2.5 px-4">Meses até Vencer</th>
                  <th className="py-2.5 px-4 text-right">Valor Nominal</th>
                  <th className="py-2.5 px-4 text-right text-emerald-600 dark:text-emerald-400">
                    Desconto Juros (CDC)
                  </th>
                  <th className="py-2.5 px-4 text-right">Valor a Pagar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-mono">
                {simulation.affectedInstallments.map((item) => (
                  <tr
                    key={item.installment.id}
                    className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                      #{item.installment.installmentNumber}
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-300 font-sans">
                      {formatDate(item.installment.dueDate)}
                    </td>
                    <td className="py-3 px-4 text-slate-500 font-sans">
                      {item.monthsToDue} meses
                    </td>
                    <td className="py-3 px-4 text-right text-slate-500 line-through">
                      {formatCurrency(item.faceValueCents)}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-emerald-600 dark:text-emerald-400">
                      - {formatCurrency(item.discountCents)}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-slate-900 dark:text-white">
                      {formatCurrency(item.presentValueCents)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-slate-50 dark:bg-slate-800 font-bold border-t border-slate-200 dark:border-slate-800">
                <tr>
                  <td colSpan={3} className="py-3 px-4 text-slate-900 dark:text-white font-sans text-right">
                    Totais da Amortização:
                  </td>
                  <td className="py-3 px-4 text-right text-slate-500 font-mono line-through">
                    {formatCurrency(simulation.totalNominalCents)}
                  </td>
                  <td className="py-3 px-4 text-right text-emerald-600 dark:text-emerald-400 font-mono">
                    - {formatCurrency(simulation.totalDiscountCents)}
                  </td>
                  <td className="py-3 px-4 text-right text-slate-900 dark:text-white font-mono text-sm">
                    {formatCurrency(simulation.totalNetCents)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      {/* Confirm Execution Modal */}
      {isConfirmModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl p-6 space-y-5">
            <div>
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 text-xs font-bold uppercase tracking-wider">
                <ShieldCheck className="w-4 h-4" />
                Confirmação de Amortização
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-1">
                Efetivar Amortização de {simulation.affectedInstallments.length} Parcela(s)
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Esta ação marcará as parcelas como pagas e registrará a economia de juros no histórico da dívida.
              </p>
            </div>

            {/* Financial Highlights */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Parcelas a liquidar:</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {simulation.affectedInstallments.map((i) => `#${i.installment.installmentNumber}`).join(', ')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Valor nominal das parcelas:</span>
                <span className="line-through text-slate-400 font-mono">
                  {formatCurrency(simulation.totalNominalCents)}
                </span>
              </div>
              <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-bold">
                <span>Economia de Juros (Desconto CDC):</span>
                <span className="font-mono">- {formatCurrency(simulation.totalDiscountCents)}</span>
              </div>
              <div className="flex justify-between text-sm font-bold pt-2 border-t border-slate-200 dark:border-slate-700">
                <span className="text-slate-900 dark:text-white">Total a pagar:</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-mono">
                  {formatCurrency(simulation.totalNetCents)}
                </span>
              </div>
            </div>

            {/* Payment Details Form */}
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="amort-payment-date" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Data do Pagamento
                  </label>
                  <input
                    id="amort-payment-date"
                    type="date"
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl text-xs border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label htmlFor="amort-payment-method" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Meio de Pagamento
                  </label>
                  <select
                    id="amort-payment-method"
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                    className="w-full px-3 py-2 rounded-xl text-xs border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                  >
                    <option value="pix">PIX</option>
                    <option value="transferencia">Transferência / TED</option>
                    <option value="boleto">Boleto Bancário</option>
                    <option value="debito_automatico">Débito em Conta</option>
                    <option value="dinheiro">Dinheiro</option>
                    <option value="outro">Outro</option>
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="amort-notes" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Observações (Opcional)
                </label>
                <input
                  id="amort-notes"
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ex: Amortização extraordinária feita pelo app do banco"
                  className="w-full px-3 py-2 rounded-xl text-xs border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsConfirmModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                Confirmar Amortização
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
