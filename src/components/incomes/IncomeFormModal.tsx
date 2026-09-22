import React, { useState, useEffect } from 'react';
import { X, ArrowDownLeft, Calendar, Tag, DollarSign, Repeat, FileText, Upload } from 'lucide-react';
import { Income, IncomeCategory, IncomeFlowType } from '../../types/finance';
import { formatCurrencyInput, parseCurrencyToCents } from '../../utils/currency';
import { getTodayIso } from '../../utils/dates';

interface IncomeFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Omit<Income, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => void;
  incomeToEdit?: Income | null;
}

const CATEGORIES: { value: IncomeCategory; label: string }[] = [
  { value: 'salario', label: 'Salário / Pró-labore' },
  { value: 'freelance', label: 'Freelance / Serviços' },
  { value: 'rendimentos', label: 'Rendimentos de Investimento' },
  { value: 'beneficios', label: 'Benefícios / Aluguel Recebido' },
  { value: 'vendas', label: 'Vendas / Comercial' },
  { value: 'outros', label: 'Outras Entradas' },
];

const FLOW_TYPES: { value: IncomeFlowType; label: string; hint: string }[] = [
  {
    value: 'receita',
    label: 'Receita Real (Salário / Trabalho)',
    hint: 'Soma à sua renda mensal disponível para o cálculo de saldo.',
  },
  {
    value: 'rendimento_investimento',
    label: 'Rendimento de Investimento (Juros / Dividendos)',
    hint: 'Proventos recebidos de aplicações financeiras.',
  },
  {
    value: 'resgate_capital',
    label: 'Resgate de Capital (Investimento Próprio)',
    hint: 'Retirada de patrimônio pré-existente (não é nova renda gerada).',
  },
  {
    value: 'transferencia_interna',
    label: 'Transferência entre Contas / Movimentação Interna',
    hint: 'Transferência de saldo entre bancos seus (não altera patrimônio total).',
  },
];

export const IncomeFormModal: React.FC<IncomeFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  incomeToEdit,
}) => {
  const [description, setDescription] = useState('');
  const [rawAmount, setRawAmount] = useState('');
  const [category, setCategory] = useState<IncomeCategory>('salario');
  const [flowType, setFlowType] = useState<IncomeFlowType>('receita');
  const [date, setDate] = useState(getTodayIso());
  const [accountOrOrigin, setAccountOrOrigin] = useState('');
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrenceFrequency, setRecurrenceFrequency] = useState<'mensal' | 'quinzenal' | 'semanal' | 'anual'>('mensal');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (incomeToEdit) {
      setDescription(incomeToEdit.description);
      setRawAmount(formatCurrencyInput(incomeToEdit.amountCents));
      setCategory((incomeToEdit.category as IncomeCategory) || 'salario');
      setFlowType(incomeToEdit.flowType);
      setDate(incomeToEdit.date);
      setAccountOrOrigin(incomeToEdit.accountOrOrigin || '');
      setIsRecurring(incomeToEdit.isRecurring);
      setRecurrenceFrequency(incomeToEdit.recurrenceFrequency || 'mensal');
      setNotes(incomeToEdit.notes || '');
    } else {
      setDescription('');
      setRawAmount('');
      setCategory('salario');
      setFlowType('receita');
      setDate(getTodayIso());
      setAccountOrOrigin('');
      setIsRecurring(false);
      setRecurrenceFrequency('mensal');
      setNotes('');
    }
  }, [incomeToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amountCents = parseCurrencyToCents(rawAmount);
    if (!description.trim()) return;
    if (amountCents <= 0) return;

    onSave({
      description: description.trim(),
      amountCents,
      category,
      flowType,
      date,
      accountOrOrigin: accountOrOrigin.trim() || 'Conta Principal',
      isRecurring,
      recurrenceFrequency: isRecurring ? recurrenceFrequency : undefined,
      notes: notes.trim() || undefined,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-8">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-emerald-50/60 dark:bg-emerald-950/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <ArrowDownLeft className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {incomeToEdit ? 'Editar Entrada' : 'Nova Entrada de Dinheiro'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Registre receitas, salários ou transferências com precisão
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Descrição da Entrada *
            </label>
            <input
              type="text"
              required
              placeholder="Ex: Salário Mensal, Freelance Empresa X, Dividendos..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Valor Recebido *
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                  R$
                </span>
                <input
                  type="text"
                  required
                  placeholder="0,00"
                  value={rawAmount}
                  onChange={(e) => setRawAmount(e.target.value)}
                  onBlur={() => {
                    const cents = parseCurrencyToCents(rawAmount);
                    if (cents > 0) setRawAmount(formatCurrencyInput(cents));
                  }}
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Data de Recebimento *
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Natureza / Classificação do Fluxo (Evita distorção contábil) */}
          <div className="p-3.5 rounded-xl border border-emerald-100 dark:border-emerald-950/60 bg-emerald-50/30 dark:bg-emerald-950/10 space-y-2">
            <label className="block text-xs font-bold text-emerald-900 dark:text-emerald-300">
              Classificação do Fluxo Contábil
            </label>
            <select
              value={flowType}
              onChange={(e) => setFlowType(e.target.value as IncomeFlowType)}
              className="w-full px-3 py-2 rounded-lg border border-emerald-200 dark:border-emerald-800/80 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
            >
              {FLOW_TYPES.map((ft) => (
                <option key={ft.value} value={ft.value}>
                  {ft.label}
                </option>
              ))}
            </select>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 italic leading-relaxed">
              {FLOW_TYPES.find((f) => f.value === flowType)?.hint}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Categoria
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as IncomeCategory)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
              >
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Conta / Origem de Destino
              </label>
              <input
                type="text"
                placeholder="Ex: Itaú Corrente, Nubank, Caixa..."
                value={accountOrOrigin}
                onChange={(e) => setAccountOrOrigin(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
              />
            </div>
          </div>

          {/* Recorrência */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="income-recurring"
                checked={isRecurring}
                onChange={(e) => setIsRecurring(e.target.checked)}
                className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300 dark:border-slate-700"
              />
              <label
                htmlFor="income-recurring"
                className="text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer"
              >
                Receita Recorrente
              </label>
            </div>
            {isRecurring && (
              <select
                value={recurrenceFrequency}
                onChange={(e) => setRecurrenceFrequency(e.target.value as any)}
                className="text-xs px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200"
              >
                <option value="mensal">Mensal</option>
                <option value="quinzenal">Quinzenal</option>
                <option value="semanal">Semanal</option>
                <option value="anual">Anual</option>
              </select>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Observações Adicionais
            </label>
            <textarea
              rows={2}
              placeholder="Anotações opcionais sobre esta entrada..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
            />
          </div>

          {/* Actions */}
          <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:scale-98 rounded-xl shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
            >
              {incomeToEdit ? 'Salvar Alterações' : 'Registrar Entrada'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
