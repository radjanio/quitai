import React, { useState, useEffect } from 'react';
import { X, ArrowUpRight, Calendar, Tag, DollarSign, Repeat, CreditCard, Layers } from 'lucide-react';
import { Expense, ExpenseCategory, PaymentMethod } from '../../types/finance';
import { formatCurrencyInput, parseCurrencyToCents } from '../../utils/currency';
import { getTodayIso } from '../../utils/dates';

interface ExpenseFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Omit<Expense, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => void;
  expenseToEdit?: Expense | null;
}

const CATEGORIES: { value: ExpenseCategory; label: string }[] = [
  { value: 'alimentacao', label: 'Alimentação & Mercado' },
  { value: 'moradia', label: 'Moradia (Aluguel, Condomínio)' },
  { value: 'energia', label: 'Energia Elétrica' },
  { value: 'agua', label: 'Água & Saneamento' },
  { value: 'internet', label: 'Internet & Telefonia' },
  { value: 'transporte', label: 'Transporte & Combustível' },
  { value: 'saude', label: 'Saúde & Farmácia' },
  { value: 'educacao', label: 'Educação & Cursos' },
  { value: 'lazer', label: 'Lazer & Entretenimento' },
  { value: 'servicos', label: 'Serviços & Assinaturas' },
  { value: 'dividas', label: 'Pagamento de Dívida / Financiamento' },
  { value: 'outros', label: 'Outras Despesas' },
];

const PAYMENT_METHODS: { value: PaymentMethod; label: string }[] = [
  { value: 'pix', label: 'PIX' },
  { value: 'boleto', label: 'Boleto Bancário' },
  { value: 'cartao', label: 'Cartão de Crédito' },
  { value: 'debito_automatico', label: 'Débito Automático' },
  { value: 'transferencia', label: 'Transferência Bancária (TED/DOC)' },
  { value: 'dinheiro', label: 'Dinheiro em Espécie' },
  { value: 'outro', label: 'Outro Método' },
];

export const ExpenseFormModal: React.FC<ExpenseFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  expenseToEdit,
}) => {
  const [description, setDescription] = useState('');
  const [rawAmount, setRawAmount] = useState('');
  const [category, setCategory] = useState<ExpenseCategory>('alimentacao');
  const [date, setDate] = useState(getTodayIso());
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('pix');
  const [account, setAccount] = useState('');
  const [isFixed, setIsFixed] = useState(false);
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrenceFrequency, setRecurrenceFrequency] = useState<'mensal' | 'quinzenal' | 'semanal' | 'anual'>('mensal');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (expenseToEdit) {
      setDescription(expenseToEdit.description);
      setRawAmount(formatCurrencyInput(expenseToEdit.amountCents));
      setCategory((expenseToEdit.category as ExpenseCategory) || 'alimentacao');
      setDate(expenseToEdit.date);
      setPaymentMethod(expenseToEdit.paymentMethod);
      setAccount(expenseToEdit.account || '');
      setIsFixed(expenseToEdit.isFixed);
      setIsRecurring(expenseToEdit.isRecurring);
      setRecurrenceFrequency(expenseToEdit.recurrenceFrequency || 'mensal');
      setNotes(expenseToEdit.notes || '');
    } else {
      setDescription('');
      setRawAmount('');
      setCategory('alimentacao');
      setDate(getTodayIso());
      setPaymentMethod('pix');
      setAccount('');
      setIsFixed(false);
      setIsRecurring(false);
      setRecurrenceFrequency('mensal');
      setNotes('');
    }
  }, [expenseToEdit, isOpen]);

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
      date,
      paymentMethod,
      account: account.trim() || 'Conta Corrente',
      isFixed,
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
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-rose-50/60 dark:bg-rose-950/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-900/60 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <ArrowUpRight className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {expenseToEdit ? 'Editar Despesa' : 'Nova Despesa'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Mantenha suas saídas organizadas por categoria e conta
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
              Descrição da Despesa *
            </label>
            <input
              type="text"
              required
              placeholder="Ex: Supermercado Pão de Açúcar, Enel Energia, Farmácia..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/30 focus:border-rose-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Valor Pago / Previsto *
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
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-rose-500/30 focus:border-rose-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Data do Pagamento *
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/30 focus:border-rose-500"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Categoria
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/30"
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
                Forma de Pagamento
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/30"
              >
                {PAYMENT_METHODS.map((pm) => (
                  <option key={pm.value} value={pm.value}>
                    {pm.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Conta de Origem / Cartão
            </label>
            <input
              type="text"
              placeholder="Ex: Nubank Cartão de Crédito, Itaú Débito..."
              value={account}
              onChange={(e) => setAccount(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/30"
            />
          </div>

          {/* Configuração de Despesa Fixa / Recorrente */}
          <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="expense-fixed"
                  checked={isFixed}
                  onChange={(e) => setIsFixed(e.target.checked)}
                  className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500 border-slate-300 dark:border-slate-700"
                />
                <label
                  htmlFor="expense-fixed"
                  className="text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer"
                >
                  Despesa Fixa (Compromisso essencial)
                </label>
              </div>
              <span className="text-[10px] text-slate-400">Ex: Aluguel, Internet</span>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 dark:border-slate-700/50">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="expense-recurring"
                  checked={isRecurring}
                  onChange={(e) => setIsRecurring(e.target.checked)}
                  className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500 border-slate-300 dark:border-slate-700"
                />
                <label
                  htmlFor="expense-recurring"
                  className="text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer"
                >
                  Repete todo período
                </label>
              </div>
              {isRecurring && (
                <select
                  value={recurrenceFrequency}
                  onChange={(e) => setRecurrenceFrequency(e.target.value as any)}
                  className="text-xs px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                >
                  <option value="mensal">Mensal</option>
                  <option value="quinzenal">Quinzenal</option>
                  <option value="semanal">Semanal</option>
                  <option value="anual">Anual</option>
                </select>
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Observações Adicionais
            </label>
            <textarea
              rows={2}
              placeholder="Anotações opcionais sobre esta despesa..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-rose-500/30"
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
              className="px-5 py-2.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 active:scale-98 rounded-xl shadow-md shadow-rose-600/20 transition-all cursor-pointer"
            >
              {expenseToEdit ? 'Salvar Alterações' : 'Registrar Despesa'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
