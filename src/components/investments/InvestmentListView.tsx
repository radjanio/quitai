import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  Plus,
  Search,
  Building2,
  Calendar,
  DollarSign,
  Briefcase,
  ArrowUpRight,
  ArrowDownRight,
  Percent,
  Trash2,
  Edit2,
  Sliders,
  Sparkles,
  Lock,
  ShieldCheck,
  ArrowRight,
} from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { useSubscription } from '../../context/SubscriptionContext';
import { Investment, InvestmentType, InvestmentTransactionType } from '../../types/finance';
import { formatCurrencyCents } from '../../utils/currency';
import { InvestmentFormModal } from './InvestmentFormModal';
import { InvestmentTransactionModal } from './InvestmentTransactionModal';

const INVESTMENT_TYPE_LABELS: Record<InvestmentType, { label: string; badgeClass: string }> = {
  poupanca: {
    label: 'Poupança',
    badgeClass: 'bg-lime-100 text-lime-800 dark:bg-lime-950/60 dark:text-lime-300',
  },
  renda_fixa: {
    label: 'Renda Fixa',
    badgeClass: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300',
  },
  tesouro: {
    label: 'Tesouro Direto',
    badgeClass: 'bg-teal-100 text-teal-800 dark:bg-teal-950/60 dark:text-teal-300',
  },
  cdb: {
    label: 'CDB / RDB',
    badgeClass: 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300',
  },
  lci_lca: {
    label: 'LCI / LCA',
    badgeClass: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-950/60 dark:text-cyan-300',
  },
  acoes: {
    label: 'Ações',
    badgeClass: 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300',
  },
  fundo: {
    label: 'Fundos / FIIs',
    badgeClass: 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300',
  },
  previdencia: {
    label: 'Previdência',
    badgeClass: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300',
  },
  cripto: {
    label: 'Criptoativos',
    badgeClass: 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300',
  },
  outro: {
    label: 'Outros',
    badgeClass: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300',
  },
  outros: {
    label: 'Outros',
    badgeClass: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300',
  },
};

export const InvestmentListView: React.FC = () => {
  const {
    investments,
    investmentTransactions,
    addInvestment,
    updateInvestment,
    deleteInvestment,
    addInvestmentTransaction,
  } = useFinance();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('todos');
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [investmentToEdit, setInvestmentToEdit] = useState<Investment | null>(null);
  const [txModalState, setTxModalState] = useState<{
    isOpen: boolean;
    investment: Investment | null;
  }>({ isOpen: false, investment: null });

  // Filtered Investments
  const filteredInvestments = useMemo(() => {
    return investments.filter((inv) => {
      const matchesSearch =
        inv.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inv.institution.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (inv.notes && inv.notes.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesType = selectedType === 'todos' || inv.type === selectedType;

      return matchesSearch && matchesType;
    });
  }, [investments, searchTerm, selectedType]);

  // Key Totals
  const totals = useMemo(() => {
    const totalCurrentAmountCents = investments.reduce((acc, i) => acc + i.currentAmountCents, 0);
    const totalInvestedCents = investments.reduce((acc, i) => acc + i.totalInvestedCents, 0);
    const totalYieldCents = Math.max(0, totalCurrentAmountCents - totalInvestedCents);
    const yieldPercentage =
      totalInvestedCents > 0 ? (totalYieldCents / totalInvestedCents) * 100 : 0;

    return {
      totalCurrentAmountCents,
      totalInvestedCents,
      totalYieldCents,
      yieldPercentage,
      count: investments.length,
    };
  }, [investments]);

  const handleEdit = (inv: Investment) => {
    setInvestmentToEdit(inv);
    setIsFormModalOpen(true);
  };

  const { canAccess, openCheckout, plans } = useSubscription();
  const hasInvestmentAccess = canAccess('hasInvestments');
  const plusPlan = plans.find((p) => p.id === 'plus') || plans[1];

  const handleCreate = () => {
    if (!hasInvestmentAccess) {
      openCheckout(plusPlan, 'monthly');
      return;
    }
    setInvestmentToEdit(null);
    setIsFormModalOpen(true);
  };

  const handleOpenTx = (inv: Investment) => {
    if (!hasInvestmentAccess) {
      openCheckout(plusPlan, 'monthly');
      return;
    }
    setTxModalState({ isOpen: true, investment: inv });
  };

  if (!hasInvestmentAccess && investments.length === 0) {
    return (
      <div className="max-w-3xl mx-auto py-12 px-4 text-center animate-in fade-in">
        <div className="w-16 h-16 rounded-3xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto mb-4">
          <Sparkles className="w-8 h-8" />
        </div>
        <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 px-3 py-1 rounded-full">
          Recurso Exclusivo QuitaÍ Plus & Premium
        </span>
        <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-4 tracking-tight">
          Acompanhe seus investimentos e construa seu patrimônio
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-300 mt-3 max-w-xl mx-auto">
          Monitore reservas de emergência, Tesouro Direto, CDBs, LCI/LCA, ações e fundos imobiliários com cálculo automático de rendimento e rentabilidade.
        </p>

        <div className="mt-8 p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm text-left max-w-lg mx-auto space-y-3">
          <div className="flex items-center gap-3 text-xs font-semibold text-slate-700 dark:text-slate-200">
            <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>Controle total de aportes e resgates</span>
          </div>
          <div className="flex items-center gap-3 text-xs font-semibold text-slate-700 dark:text-slate-200">
            <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>Cálculo de rentabilidade e lucros acumulados</span>
          </div>
          <div className="flex items-center gap-3 text-xs font-semibold text-slate-700 dark:text-slate-200">
            <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>Dados preservados mesmo se você alterar seu plano</span>
          </div>
        </div>

        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => openCheckout(plusPlan, 'monthly')}
            className="w-full sm:w-auto py-3.5 px-6 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-lg shadow-indigo-600/25 flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <span>Fazer Upgrade para Plus</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Aviso de downgrade se o usuário já possuía investimentos */}
      {!hasInvestmentAccess && investments.length > 0 && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-900 dark:text-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-amber-500 shrink-0" />
            <span>
              <strong>Modo Somente Leitura:</strong> Seus {investments.length} investimentos continuam preservados e salvos. Para adicionar novos aportes ou editar, faça upgrade para o QuitaÍ Plus.
            </span>
          </div>
          <button
            type="button"
            onClick={() => openCheckout(plusPlan, 'monthly')}
            className="py-1.5 px-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shrink-0 self-start sm:self-auto transition-colors"
          >
            Fazer Upgrade
          </button>
        </div>
      )}
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
              <TrendingUp className="w-5 h-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Gestão de Investimentos & Patrimônio
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Acompanhe sua reserva de emergência, fundos, CDBs e a evolução do seu patrimônio.
          </p>
        </div>

        <button
          type="button"
          onClick={handleCreate}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-98 text-white text-xs font-bold shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Novo Investimento</span>
        </button>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Patrimônio Atual */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Total Investido Informado
            </span>
            <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-2">
            {formatCurrencyCents(totals.totalCurrentAmountCents)}
          </p>
          <p className="text-[11px] text-indigo-600 dark:text-indigo-400 font-medium mt-1">
            Saldo acumulado reportado
          </p>
        </div>

        {/* Card 2: Capital Aportado */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Capital Total Aplicado
            </span>
            <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
              <Briefcase className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-2">
            {formatCurrencyCents(totals.totalInvestedCents)}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">
            {totals.count} ativos em carteira
          </p>
        </div>

        {/* Card 3: Rendimento Total Acumulado */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Lucro / Rendimento Bruto
            </span>
            <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-2">
            + {formatCurrencyCents(totals.totalYieldCents)}
          </p>
          <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium mt-1">
            Ganhos sobre o capital aplicado
          </p>
        </div>

        {/* Card 4: Rentabilidade % */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Rentabilidade Global
            </span>
            <div className="p-2 rounded-lg bg-teal-50 dark:bg-teal-950/50 text-teal-600 dark:text-teal-400">
              <Percent className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-teal-600 dark:text-teal-400 mt-2">
            {totals.yieldPercentage.toFixed(2)}%
          </p>
          <p className="text-[11px] text-slate-400 mt-1">
            Crescimento patrimonial geral
          </p>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por ativo, corretora ou notas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300 focus:outline-none"
          >
            <option value="todos">Todos os Tipos de Ativo</option>
            {Object.entries(INVESTMENT_TYPE_LABELS).map(([key, item]) => (
              <option key={key} value={key}>
                {item.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Investment Cards Grid */}
      {filteredInvestments.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 py-16 text-center px-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 mx-auto flex items-center justify-center mb-3">
            <TrendingUp className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
            Nenhum investimento cadastrado
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-1">
            Cadastre sua reserva de emergência, fundos ou títulos para acompanhar seu patrimônio.
          </p>
          <button
            type="button"
            onClick={handleCreate}
            className="mt-4 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow transition-all cursor-pointer"
          >
            Cadastrar Primeiro Investimento
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredInvestments.map((inv) => {
            const typeInfo = INVESTMENT_TYPE_LABELS[inv.type] || INVESTMENT_TYPE_LABELS.outro;
            const itemYieldCents = Math.max(0, inv.currentAmountCents - inv.totalInvestedCents);
            const itemYieldPercent =
              inv.totalInvestedCents > 0
                ? ((inv.currentAmountCents - inv.totalInvestedCents) / inv.totalInvestedCents) * 100
                : 0;

            const invTransactions = investmentTransactions.filter((tx) => tx.investmentId === inv.id);

            return (
              <div
                key={inv.id}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm p-5 flex flex-col justify-between hover:border-indigo-300 dark:hover:border-indigo-800 transition-all"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${typeInfo.badgeClass}`}
                      >
                        {typeInfo.label}
                      </span>
                      <h3 className="text-base font-extrabold text-slate-900 dark:text-white mt-1.5 leading-snug">
                        {inv.name}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-0.5">
                        <Building2 className="w-3.5 h-3.5" />
                        <span>{inv.institution}</span>
                      </p>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleEdit(inv)}
                        title="Editar ativo"
                        className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm(`Excluir o investimento "${inv.name}"?`)) {
                            deleteInvestment(inv.id);
                          }
                        }}
                        title="Excluir ativo"
                        className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Valor Atual vs Aplicado */}
                  <div className="mt-4 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">
                        Saldo Atual
                      </span>
                      <span className="text-sm font-black text-slate-900 dark:text-white font-mono">
                        {formatCurrencyCents(inv.currentAmountCents)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">
                        Capital Aplicado
                      </span>
                      <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 font-mono">
                        {formatCurrencyCents(inv.totalInvestedCents)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-1.5 border-t border-slate-200/60 dark:border-slate-700/50">
                      <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                        Rendimento
                      </span>
                      <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 font-mono flex items-center gap-1">
                        +{formatCurrencyCents(itemYieldCents)} ({itemYieldPercent.toFixed(1)}%)
                      </span>
                    </div>
                  </div>

                  {inv.notes && (
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 italic mt-3 line-clamp-2">
                      "{inv.notes}"
                    </p>
                  )}
                </div>

                {/* Bottom Actions & Transaction history count */}
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">
                    {invTransactions.length} movimentação(ões)
                  </span>

                  <button
                    type="button"
                    onClick={() => handleOpenTx(inv)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 text-xs font-bold transition-all cursor-pointer"
                  >
                    <Sliders className="w-3.5 h-3.5" />
                    <span>Movimentar</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modals */}
      <InvestmentFormModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        onSave={(data) => {
          if (investmentToEdit) {
            updateInvestment(investmentToEdit.id, data);
          } else {
            addInvestment(data);
          }
        }}
        investmentToEdit={investmentToEdit}
      />

      <InvestmentTransactionModal
        isOpen={txModalState.isOpen}
        onClose={() => setTxModalState({ isOpen: false, investment: null })}
        investment={txModalState.investment}
        onConfirm={(investmentId, type, amountCents, date, notes) => {
          addInvestmentTransaction(investmentId, type, amountCents, date, notes);
        }}
      />
    </div>
  );
};
