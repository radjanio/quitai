import React, { useState, useMemo } from 'react';
import {
  ArrowDownLeft,
  Plus,
  Search,
  Filter,
  Calendar,
  DollarSign,
  TrendingUp,
  Tag,
  Repeat,
  Trash2,
  Edit2,
  Paperclip,
  CheckCircle2,
  AlertCircle,
  Briefcase,
  HelpCircle,
} from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { Income, IncomeCategory, IncomeFlowType } from '../../types/finance';
import { formatCurrencyCents } from '../../utils/currency';
import { IncomeFormModal } from './IncomeFormModal';

const CATEGORY_NAMES: Record<IncomeCategory, string> = {
  salario: 'Salário',
  dinheiro_recebido: 'Dinheiro Recebido',
  rendimentos: 'Rendimentos',
  renda_extra: 'Renda Extra',
  negocios: 'Negócios / Empresa',
  freelance: 'Freelance',
  aluguel: 'Aluguéis',
  reembolso: 'Reembolso',
  beneficios: 'Benefícios',
  vendas: 'Vendas',
  outros: 'Outros',
};

const FLOW_TYPE_LABELS: Record<IncomeFlowType, { label: string; badgeClass: string; desc: string }> = {
  receita: {
    label: 'Receita Real',
    badgeClass: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300',
    desc: 'Conta como receita líquida',
  },
  rendimento_investimento: {
    label: 'Rendimento Invest.',
    badgeClass: 'bg-teal-100 text-teal-800 dark:bg-teal-950/60 dark:text-teal-300',
    desc: 'Juros ou dividendos gerados',
  },
  resgate_capital: {
    label: 'Resgate de Capital',
    badgeClass: 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300',
    desc: 'Retirada de capital (não é receita nova)',
  },
  transferencia: {
    label: 'Transferência',
    badgeClass: 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300',
    desc: 'Transferência entre contas',
  },
  transferencia_interna: {
    label: 'Transf. Interna',
    badgeClass: 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300',
    desc: 'Movimentação entre contas próprias',
  },
};

export const IncomeListView: React.FC = () => {
  const { incomes, addIncome, updateIncome, deleteIncome } = useFinance();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('todas');
  const [selectedFlowType, setSelectedFlowType] = useState<string>('todos');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [incomeToEdit, setIncomeToEdit] = useState<Income | null>(null);

  // Filtered List
  const filteredIncomes = useMemo(() => {
    return incomes.filter((inc) => {
      const matchesSearch =
        inc.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (inc.accountOrOrigin && inc.accountOrOrigin.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (inc.notes && inc.notes.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesCat = selectedCategory === 'todas' || inc.category === selectedCategory;
      const matchesFlow = selectedFlowType === 'todos' || inc.flowType === selectedFlowType;

      return matchesSearch && matchesCat && matchesFlow;
    });
  }, [incomes, searchTerm, selectedCategory, selectedFlowType]);

  // Key Metrics
  const metrics = useMemo(() => {
    const today = new Date();
    const currentYearMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;

    // Total Real Revenue this month (excludes capital withdrawals & internal transfers)
    const monthRealRevenue = incomes
      .filter((i) => i.date.startsWith(currentYearMonth) && (i.flowType === 'receita' || i.flowType === 'rendimento_investimento'))
      .reduce((sum, i) => sum + i.amountCents, 0);

    // Total Overall Real Revenue
    const totalRealRevenue = incomes
      .filter((i) => i.flowType === 'receita' || i.flowType === 'rendimento_investimento')
      .reduce((sum, i) => sum + i.amountCents, 0);

    // Total Investment Returns
    const totalYields = incomes
      .filter((i) => i.flowType === 'rendimento_investimento')
      .reduce((sum, i) => sum + i.amountCents, 0);

    // Capital Redemptions (neutral)
    const totalRedemptions = incomes
      .filter((i) => i.flowType === 'resgate_capital')
      .reduce((sum, i) => sum + i.amountCents, 0);

    return {
      monthRealRevenue,
      totalRealRevenue,
      totalYields,
      totalRedemptions,
      totalCount: incomes.length,
    };
  }, [incomes]);

  const handleEdit = (income: Income) => {
    setIncomeToEdit(income);
    setIsModalOpen(true);
  };

  const handleCreate = () => {
    setIncomeToEdit(null);
    setIsModalOpen(true);
  };

  const handleSave = (data: Omit<Income, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
    if (incomeToEdit) {
      updateIncome(incomeToEdit.id, data);
    } else {
      addIncome(data);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
              <ArrowDownLeft className="w-5 h-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Gestão de Entradas & Receitas
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Controle todas as fontes de renda, salários e rendimentos com rigor contábil.
          </p>
        </div>

        <button
          type="button"
          onClick={handleCreate}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Nova Entrada</span>
        </button>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Mês Atual */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Entradas no Mês Atual
            </span>
            <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl font-extrabold text-slate-900 dark:text-white mt-2">
            {formatCurrencyCents(metrics.monthRealRevenue)}
          </p>
          <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium mt-1">
            Renda real calculada para este mês
          </p>
        </div>

        {/* Card 2: Total Geral de Receitas */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Total Histórico Real
            </span>
            <div className="p-2 rounded-lg bg-teal-50 dark:bg-teal-950/50 text-teal-600 dark:text-teal-400">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl font-extrabold text-slate-900 dark:text-white mt-2">
            {formatCurrencyCents(metrics.totalRealRevenue)}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">
            {metrics.totalCount} lançamentos registrados
          </p>
        </div>

        {/* Card 3: Rendimentos de Investimentos */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Rendimentos Acumulados
            </span>
            <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400">
              <Briefcase className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl font-extrabold text-indigo-600 dark:text-indigo-400 mt-2">
            {formatCurrencyCents(metrics.totalYields)}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">
            Proventos e juros de aplicações
          </p>
        </div>

        {/* Card 4: Resgates de Capital (Neutralidade) */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Resgates de Capital
            </span>
            <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400">
              <HelpCircle className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl font-extrabold text-amber-600 dark:text-amber-400 mt-2">
            {formatCurrencyCents(metrics.totalRedemptions)}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">
            Não distorce nem infla sua renda
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
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
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

          {/* Flow Type Filter */}
          <select
            value={selectedFlowType}
            onChange={(e) => setSelectedFlowType(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300 focus:outline-none"
          >
            <option value="todos">Todos os Fluxos</option>
            <option value="receita">Receita Real</option>
            <option value="rendimento_investimento">Rendimento</option>
            <option value="resgate_capital">Resgate de Capital</option>
            <option value="transferencia_interna">Transferência Interna</option>
          </select>
        </div>
      </div>

      {/* Table / List */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
        {filteredIncomes.length === 0 ? (
          <div className="py-16 text-center px-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center mb-3">
              <ArrowDownLeft className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
              Nenhuma entrada encontrada
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-1">
              Cadastre seu salário, freelance ou rendimentos para ter um fluxo de caixa completo.
            </p>
            <button
              type="button"
              onClick={handleCreate}
              className="mt-4 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow transition-all cursor-pointer"
            >
              Registrar Primeira Entrada
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-400 bg-slate-50/50 dark:bg-slate-800/30">
                  <th className="py-3.5 px-4 sm:px-6">Descrição & Categoria</th>
                  <th className="py-3.5 px-4">Classificação</th>
                  <th className="py-3.5 px-4">Data</th>
                  <th className="py-3.5 px-4">Conta / Origem</th>
                  <th className="py-3.5 px-4 text-right">Valor</th>
                  <th className="py-3.5 px-4 sm:px-6 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs">
                {filteredIncomes.map((income) => {
                  const flowInfo = FLOW_TYPE_LABELS[income.flowType];
                  return (
                    <tr
                      key={income.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="py-3.5 px-4 sm:px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center flex-shrink-0">
                            <ArrowDownLeft className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 dark:text-white">
                              {income.description}
                            </p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-medium">
                                {(CATEGORY_NAMES as Record<string, string>)[income.category] || income.category}
                              </span>
                              {income.isRecurring && (
                                <span className="inline-flex items-center gap-0.5 text-[10px] text-teal-600 dark:text-teal-400 font-medium">
                                  <Repeat className="w-3 h-3" />
                                  {income.recurrenceFrequency || 'Recorrente'}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${flowInfo.badgeClass}`}
                          title={flowInfo.desc}
                        >
                          {flowInfo.label}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 font-mono text-slate-600 dark:text-slate-300">
                        {income.date}
                      </td>

                      <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300 font-medium">
                        {income.accountOrOrigin || '—'}
                      </td>

                      <td className="py-3.5 px-4 text-right font-black text-emerald-600 dark:text-emerald-400 font-mono text-sm">
                        + {formatCurrencyCents(income.amountCents)}
                      </td>

                      <td className="py-3.5 px-4 sm:px-6 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleEdit(income)}
                            title="Editar entrada"
                            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (confirm(`Excluir a entrada "${income.description}"?`)) {
                                deleteIncome(income.id);
                              }
                            }}
                            title="Excluir entrada"
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
      <IncomeFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        incomeToEdit={incomeToEdit}
      />
    </div>
  );
};
