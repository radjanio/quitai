/**
 * AdjustmentsTab - Contractual Adjustment rules & batch recalculation
 */

import React, { useState } from 'react';
import { Debt, Installment, DebtAdjustmentRule, AdjustmentType } from '../../types/finance';
import { formatCurrency, formatPercentage } from '../../utils/currency';
import { formatDate } from '../../utils/dates';
import { Sliders, Plus, Calculator, AlertCircle, CheckCircle2, TrendingUp } from 'lucide-react';

interface AdjustmentsTabProps {
  debt: Debt;
  installments: Installment[];
  rules: DebtAdjustmentRule[];
  onAddRule: (rule: Omit<DebtAdjustmentRule, 'id' | 'createdAt'>) => void;
  onApplyBatchAdjustment: (
    debtId: string,
    percentage: number,
    startFromInstallmentNum: number,
    reason: string
  ) => void;
}

export const AdjustmentsTab: React.FC<AdjustmentsTabProps> = ({
  debt,
  installments,
  rules,
  onAddRule,
  onApplyBatchAdjustment,
}) => {
  // New rule form
  const [ruleType, setRuleType] = useState<AdjustmentType>('ipca');
  const [ratePercentage, setRatePercentage] = useState('5.2');
  const [indexName, setIndexName] = useState('IPCA 12 meses');
  const [periodicity, setPeriodicity] = useState<'anual' | 'semestral' | 'mensal' | 'pontual'>('anual');
  const [notes, setNotes] = useState('');

  // Batch adjustment calculator form
  const [batchPercentage, setBatchPercentage] = useState('5.0');
  const [startInstallmentNum, setStartInstallmentNum] = useState<number>(() => {
    const firstPending = installments.find((i) => i.status !== 'paga');
    return firstPending ? firstPending.installmentNumber : 1;
  });
  const [adjustmentReason, setAdjustmentReason] = useState('Reajuste anual contratual IPCA');
  const [isApplying, setIsApplying] = useState(false);

  const handleAddRule = (e: React.FormEvent) => {
    e.preventDefault();
    onAddRule({
      debtId: debt.id,
      type: ruleType,
      ratePercentage: parseFloat(ratePercentage) || 0,
      indexName: indexName.trim() || undefined,
      periodicity,
      notes: notes.trim() || undefined,
    });
    setNotes('');
  };

  const handleApplyBatch = (e: React.FormEvent) => {
    e.preventDefault();
    const pct = parseFloat(batchPercentage);
    if (isNaN(pct) || pct === 0) {
      alert('Informe um percentual válido.');
      return;
    }
    if (!confirm(`Confirma aplicar o reajuste de ${pct}% a todas as parcelas a partir da #${startInstallmentNum}?`)) {
      return;
    }

    onApplyBatchAdjustment(debt.id, pct, startInstallmentNum, adjustmentReason);
  };

  // Calculate preview of batch adjustment
  const sampleInstallment = installments.find((i) => i.installmentNumber === startInstallmentNum);
  const sampleOriginal = sampleInstallment ? sampleInstallment.expectedAmountCents : debt.defaultInstallmentAmountCents;
  const pctValue = parseFloat(batchPercentage) || 0;
  const sampleAdjusted = Math.round(sampleOriginal * (1 + pctValue / 100));

  return (
    <div className="space-y-6">
      {/* Informative Header Banner */}
      <div className="p-4 rounded-2xl bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-900/60 text-xs text-purple-900 dark:text-purple-200 flex items-start gap-3">
        <Sliders className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
        <div>
          <h4 className="font-bold text-sm mb-1">
            Reajustes Contratuais e Correções Monetárias
          </h4>
          <p className="text-purple-800 dark:text-purple-300 leading-relaxed">
            Em contratos de longo prazo (como terrenos ou financiamentos imobiliários), reajustes são aplicados periodicamente baseados em índices como IPCA ou IGP-M. Registre as regras contratuais e lance os reajustes nas parcelas futuras quando houver publicação dos índices.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Formulário: Aplicar Reajuste nas Parcelas Futuras */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Calculator className="w-4 h-4 text-emerald-500" />
            Lançar Reajuste em Lote de Parcelas
          </h3>

          <form onSubmit={handleApplyBatch} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Percentual do Reajuste (%) *
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.01"
                  required
                  value={batchPercentage}
                  onChange={(e) => setBatchPercentage(e.target.value)}
                  placeholder="Ex: 4.82"
                  className="w-full px-3.5 py-2 rounded-xl text-xs font-mono font-bold border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <span className="absolute right-3.5 top-2 text-xs font-mono text-slate-400">%</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Aplicar a partir da Parcela Nº *
              </label>
              <select
                value={startInstallmentNum}
                onChange={(e) => setStartInstallmentNum(parseInt(e.target.value))}
                className="w-full px-3.5 py-2 rounded-xl text-xs border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
              >
                {installments
                  .filter((i) => i.status !== 'paga')
                  .map((i) => (
                    <option key={i.id} value={i.installmentNumber}>
                      Parcela #{i.installmentNumber} (Vence em {formatDate(i.dueDate)}) - Atual: {formatCurrency(i.expectedAmountCents)}
                    </option>
                  ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Motivo / Justificativa do Reajuste *
              </label>
              <input
                type="text"
                required
                value={adjustmentReason}
                onChange={(e) => setAdjustmentReason(e.target.value)}
                placeholder="Ex: Reajuste anual 2026 conforme cláusula 4.1 do contrato"
                className="w-full px-3.5 py-2 rounded-xl text-xs border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Simulação em Tempo Real */}
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 text-xs font-mono space-y-1">
              <div className="text-[11px] text-slate-500 font-sans font-bold uppercase">
                Simulação da Parcela #{startInstallmentNum}
              </div>
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>Valor Anterior:</span>
                <span>{formatCurrency(sampleOriginal)}</span>
              </div>
              <div className="flex justify-between text-purple-600 dark:text-purple-400">
                <span>Reajuste ({pctValue > 0 ? '+' : ''}{pctValue}%):</span>
                <span>{formatCurrency(sampleAdjusted - sampleOriginal)}</span>
              </div>
              <div className="flex justify-between font-bold text-slate-900 dark:text-white pt-1 border-t border-slate-200 dark:border-slate-700">
                <span>Novo Valor Previsto:</span>
                <span>{formatCurrency(sampleAdjusted)}</span>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-colors cursor-pointer flex items-center justify-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              Aplicar Reajuste nas Parcelas Futuras
            </button>
          </form>
        </div>

        {/* Cadastrar Regra Contratual */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Plus className="w-4 h-4 text-purple-500" />
            Cadastrar Regra de Reajuste Contratual
          </h3>

          <form onSubmit={handleAddRule} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Tipo de Reajuste
                </label>
                <select
                  value={ruleType}
                  onChange={(e) => setRuleType(e.target.value as AdjustmentType)}
                  className="w-full px-3.5 py-2 rounded-xl text-xs border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                >
                  <option value="ipca">IPCA</option>
                  <option value="igpm">IGP-M</option>
                  <option value="cdi">CDI</option>
                  <option value="taxa_fixa">Taxa Fixa</option>
                  <option value="outro">Outro Índice</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Periodicidade
                </label>
                <select
                  value={periodicity}
                  onChange={(e) => setPeriodicity(e.target.value as any)}
                  className="w-full px-3.5 py-2 rounded-xl text-xs border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                >
                  <option value="anual">Anual</option>
                  <option value="semestral">Semestral</option>
                  <option value="mensal">Mensal</option>
                  <option value="pontual">Pontual</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Nome do Índice / Detalhes
              </label>
              <input
                type="text"
                value={indexName}
                onChange={(e) => setIndexName(e.target.value)}
                placeholder="Ex: IPCA Acumulado 12 meses divulgado pelo IBGE"
                className="w-full px-3.5 py-2 rounded-xl text-xs border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Observações Contratuais (Cláusula, Limites)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                placeholder="Ex: Cláusula 6ª: Reajuste sempre no mês de aniversário da assinatura..."
                className="w-full px-3.5 py-2 rounded-xl text-xs border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white dark:text-slate-900 text-white rounded-xl text-xs font-semibold shadow-sm transition-colors cursor-pointer"
            >
              Salvar Regra de Reajuste
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
