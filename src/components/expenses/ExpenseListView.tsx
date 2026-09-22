import React, { useState, useMemo } from 'react';
import {
  ArrowUpRight,
  Plus,
  Search,
  Filter,
  Calendar,
  DollarSign,
  Tag,
  Repeat,
  Trash2,
  Edit2,
  CheckCircle2,
  AlertCircle,
  CreditCard,
  Layers,
  Lock,
} from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { Expense, ExpenseCategory, PaymentMethod } from '../../types/finance';
import { formatCurrencyCents } from '../../utils/currency';
import { ExpenseFormModal } from './ExpenseFormModal';

const CATEGORY_NAMES: Record<ExpenseCategory, string> = {
  alimentacao: 'Alimentação & Mercado',
  moradia: 'Moradia',
  energia: 'Energia Elétrica',
  agua: 'Água & Saneamento',
  internet: 'Internet & Telefonia',
  transporte: 'Transporte',
  compras: 'Compras Gerais',
  saude: 'Saúde & Farmácia',
  educacao: 'Educação',
  lazer: 'Lazer',
  servicos: 'Serviços',
  dividas: 'Amortização de Dívidas',
  investimentos: 'Investimentos',
  outros: 'Outros',
};

const PAYMENT_METHOD_NAMES: Record<PaymentMethod, string> = {
  pix: 'PIX',
  boleto: 'Boleto',
  cartao: 'Cartão',
  debito_automatico: 'Débito Automático',
  transferencia: 'Transferência',
  dinheiro: 'Dinheiro',
  outro: 'Outro',
  outros: 'Outros',
};

export const ExpenseListView: React.FC = () => {
  const { expenses, addExpense, updateExpense, deleteExpense } = useFinance();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('todas');
  const [selectedMethod, setSelectedMethod] = useState<string>('todos');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [expenseToEdit, setExpenseToEdit] = useState<Expense | null>(null);

  // Filtered List
  const filteredExpenses = useMemo(() => {
    return expenses.filter((exp) => {
      const matchesSearch =
        exp.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (exp.account && exp.account.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (exp.notes && exp.notes.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesCat = selectedCategory === 'todas' || exp.category === selectedCategory;
      const matchesMethod = selectedMethod === 'todos' || exp.paymentMethod === selectedMethod;

      return matchesSearch && matchesCat && matchesMethod;
    });
  }, [expenses, searchTerm, selectedCategory, selectedMethod]);

  // Metrics
  const metrics = useMemo(() => {
    const today = new Date();
    const currentYearMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;

    // Month expenses
    const monthExpenses = expenses.filter((e) => e.date.startsWith(currentYearMonth));
    const monthTotalCents = monthExpenses.reduce((sum, e) => sum + e.amountCents, 0);

    // Fixed vs Variable
    const monthFixedCents = monthExpenses
      .filter((e) => e.isFixed)
      .reduce((sum, e) => sum + e.amountCents, 0);

    const monthVariableCents = monthExpenses
      .filter((e) => !e.isFixed)
      .reduce((sum, e) => sum + e.amountCents, 0);

    // Debt amortization payments recorded as expenses
    const monthDebtPaymentCents = monthExpenses
      .filter((e) => e.category === 'dividas' || e.linkedDebtPaymentId)
      .reduce((sum, e) => sum + e.amountCents, 0);

    return {
      monthTotalCents,
      monthFixedCents,
      monthVariableCents,
      monthDebtPaymentCents,
      totalCount: expenses.length,
    };
  }, [expenses]);

  const handleEdit = (expense: Expense) => {
    setExpenseToEdit(expense);
    setIsModalOpen(true);
  };

  const handleCreate = () => {
    setExpenseToEdit(null);
    setIsModalOpen(true);
  };

  const handleSave = (data: Omit<Expense, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
    if (expenseToEdit) {
      updateExpense(expenseToEdit.id, data);
    } else {
      addExpense(data);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400">
              <ArrowUpRight className="w-5 h-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Gestão de Despesas & Saídas
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Acompanhe contas fixas, gastos variáveis e amortizações de dívidas sem duplicidade.
          </p>
        </div>

        <button
          type="button"
          onClick={handleCreate}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 active:scale-98 text-white text-xs font-bold shadow-md shadow-rose-600/20 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Nova Despesa</span>
        </button>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total no Mês */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Despesas no Mês
            </span>
            <div className="p-2 rounded-lg bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl font-extrabold text-slate-900 dark:text-white mt-2">
            {formatCurrencyCents(metrics.monthTotalCents)}
          </p>
          <p className="text-[11px] text-rose-600 dark:text-rose-400 font-medium mt-1">
            Total de saídas registradas neste mês
          </p>
        </div>

        {/* Card 2: Despesas Fixas */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Contas Fixas / Essenciais
            </span>
            <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400">
              <Lock className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl font-extrabold text-amber-600 dark:text-amber-400 mt-2">
            {formatCurrencyCents(metrics.monthFixedCents)}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">
            Compromissos indispensáveis
          </p>
        </div>

        {/* Card 3: Despesas Variáveis */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Gastos Variáveis
            </span>
            <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl font-extrabold text-blue-600 dark:text-blue-400 mt-2">
            {formatCurrencyCents(metrics.monthVariableCents)}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">
            Alimentação, transporte e lazer
          </p>
        </div>

        {/* Card 4: Amortização de Dívidas */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Pago em Dívidas no Mês
            </span>
            <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl font-extrabold text-indigo-600 dark:text-indigo-400 mt-2">
            {formatCurrencyCents(metrics.monthDebtPaymentCents)}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">
            Destinado à liquidação de passivos
          </p>
        </div>
      </div>

      {/* Filters and Search Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por descrição, conta ou notas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500/30"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300 focus:outline-none"
          >
            <option value="todas">Todas as Categorias</option>
            {Object.entries(CATEGORY_NAMES).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>

          {/* Payment Method Filter */}
          <select
            value={selectedMethod}
            onChange={(e) => setSelectedMethod(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300 focus:outline-none"
          >
            <option value="todos">Todas as Formas</option>
            {Object.entries(PAYMENT_METHOD_NAMES).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table / List */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
        {filteredExpenses.length === 0 ? (
          <div className="py-16 text-center px-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 mx-auto flex items-center justify-center mb-3">
              <ArrowUpRight className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
              Nenhuma despesa encontrada
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-1">
              Registre suas despesas cotidianas, boletos e contas mensais para manter o controle absoluto.
            </p>
            <button
              type="button"
              onClick={handleCreate}
              className="mt-4 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow transition-all cursor-pointer"
            >
              Registrar Primeira Despesa
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-400 bg-slate-50/50 dark:bg-slate-800/30">
                  <th className="py-3.5 px-4 sm:px-6">Descrição & Categoria</th>
                  <th className="py-3.5 px-4">Data</th>
                  <th className="py-3.5 px-4">Forma & Conta</th>
                  <th className="py-3.5 px-4">Tipo</th>
                  <th className="py-3.5 px-4 text-right">Valor</th>
                  <th className="py-3.5 px-4 sm:px-6 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs">
                {filteredExpenses.map((expense) => {
                  const isDebtLinked = Boolean(expense.linkedDebtPaymentId);
                  return (
                    <tr
                      key={expense.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="py-3.5 px-4 sm:px-6">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${
                              isDebtLinked
                                ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400'
                                : 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400'
                            }`}
                          >
                            {isDebtLinked ? (
                              <Layers className="w-4 h-4" />
                            ) : (
                              <ArrowUpRight className="w-4 h-4" />
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-bold text-slate-900 dark:text-white">
                                {expense.description}
                              </p>
                              {isDebtLinked && (
                                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                                  Dívida vinculada
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-medium">
                                {(CATEGORY_NAMES as Record<string, string>)[expense.category] || expense.category}
                              </span>
                              {expense.isRecurring && (
                                <span className="inline-flex items-center gap-0.5 text-[10px] text-teal-600 dark:text-teal-400 font-medium">
                                  <Repeat className="w-3 h-3" />
                                  {expense.recurrenceFrequency || 'Recorrente'}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 font-mono text-slate-600 dark:text-slate-300">
                        {expense.date}
                      </td>

                      <td className="py-3.5 px-4">
                        <p className="font-medium text-slate-800 dark:text-slate-200">
                          {PAYMENT_METHOD_NAMES[expense.paymentMethod]}
                        </p>
                        <p className="text-[11px] text-slate-400 truncate max-w-[150px]">
                          {expense.account || '—'}
                        </p>
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                            expense.isFixed
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                              : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                          }`}
                        >
                          {expense.isFixed ? 'Fixa' : 'Variável'}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right font-black text-rose-600 dark:text-rose-400 font-mono text-sm">
                        - {formatCurrencyCents(expense.amountCents)}
                      </td>

                      <td className="py-3.5 px-4 sm:px-6 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleEdit(expense)}
                            title="Editar despesa"
                            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (confirm(`Excluir a despesa "${expense.description}"?`)) {
                                deleteExpense(expense.id);
                              }
                            }}
                            title="Excluir despesa"
                            className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      <ExpenseFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        expenseToEdit={expenseToEdit}
      />
    </div>
  );
};
