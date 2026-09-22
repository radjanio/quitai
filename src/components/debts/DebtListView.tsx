/**
 * DebtListView - Search, filter, sort and list all debts
 */

import React, { useState, useMemo } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { Debt, Installment, DebtCategory } from '../../types/finance';
import { DebtCard } from './DebtCard';
import { isOverdue } from '../../utils/dates';
import {
  Search,
  Filter,
  Plus,
  ArrowUpDown,
  Grid,
  List,
  Sparkles,
  Layers,
} from 'lucide-react';

interface DebtListViewProps {
  onSelectDebt: (debtId: string) => void;
  onOpenCreateDebt: () => void;
  onQuickPay: (inst: Installment, debt: Debt) => void;
}

export const DebtListView: React.FC<DebtListViewProps> = ({
  onSelectDebt,
  onOpenCreateDebt,
  onQuickPay,
}) => {
  const { debts, installments, payments, loadDemoData } = useFinance();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('todos');
  const [categoryFilter, setCategoryFilter] = useState<string>('todas');
  const [sortBy, setSortBy] = useState<'vencimento' | 'maior_valor' | 'menor_valor' | 'progresso' | 'recentes'>('vencimento');

  // Filter and sort debts
  const filteredAndSortedDebts = useMemo(() => {
    return debts
      .filter((debt) => {
        // Status filter
        if (statusFilter === 'em_andamento' && debt.status !== 'em_andamento') return false;
        if (statusFilter === 'quitadas' && debt.status !== 'quitada') return false;
        if (statusFilter === 'vencidas') {
          // Check if debt has any overdue installment
          const debtInsts = installments.filter((i) => i.debtId === debt.id);
          const hasOverdue = debtInsts.some((i) => i.status === 'vencida' || isOverdue(i.dueDate, i.status));
          if (!hasOverdue) return false;
        }
        if (statusFilter === 'pendentes') {
          const debtInsts = installments.filter((i) => i.debtId === debt.id);
          const hasPending = debtInsts.some((i) => i.status !== 'paga' && i.status !== 'cancelada');
          if (!hasPending) return false;
        }

        // Category filter
        if (categoryFilter !== 'todas' && debt.category !== categoryFilter) return false;

        // Search text
        if (searchTerm.trim()) {
          const term = searchTerm.toLowerCase();
          const matchTitle = debt.title.toLowerCase().includes(term);
          const matchCreditor = debt.creditor.toLowerCase().includes(term);
          const matchContract = debt.contractNumber?.toLowerCase().includes(term);
          const matchCategory = debt.category.toLowerCase().includes(term);
          if (!matchTitle && !matchCreditor && !matchContract && !matchCategory) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'maior_valor') return b.totalAmountCents - a.totalAmountCents;
        if (sortBy === 'menor_valor') return a.totalAmountCents - b.totalAmountCents;
        if (sortBy === 'recentes') return b.createdAt.localeCompare(a.createdAt);
        // Default: due date
        return a.dueDay - b.dueDay;
      });
  }, [debts, installments, payments, statusFilter, categoryFilter, searchTerm, sortBy]);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">
            Suas Dívidas de Longo Prazo
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Acompanhe terrenos, veículos, imóveis e financiamentos em um só lugar
          </p>
        </div>

        <div className="flex items-center gap-2">
          {debts.length === 0 && (
            <button
              type="button"
              onClick={loadDemoData}
              className="px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Sparkles className="w-4 h-4 text-amber-500" />
              Carregar Dados de Exemplo
            </button>
          )}

          <button
            type="button"
            onClick={onOpenCreateDebt}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            Nova Dívida
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
          {/* Search box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Pesquisar por nome, credor, contrato..."
              className="w-full pl-10 pr-4 py-2 rounded-xl text-xs border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Category Dropdown */}
          <div className="w-full md:w-48">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-xl text-xs border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
            >
              <option value="todas">Todas as Categorias</option>
              <option value="terreno">Terreno</option>
              <option value="imovel">Imóvel</option>
              <option value="veiculo">Veículo</option>
              <option value="emprestimo">Empréstimo</option>
              <option value="financiamento">Financiamento</option>
              <option value="compra_parcelada">Compra Parcelada</option>
              <option value="outros">Outros</option>
            </select>
          </div>

          {/* Sort Dropdown */}
          <div className="w-full md:w-48">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full px-3 py-2 rounded-xl text-xs border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
            >
              <option value="vencimento">Dia de Vencimento</option>
              <option value="maior_valor">Maior Valor</option>
              <option value="menor_valor">Menor Valor</option>
              <option value="recentes">Mais Recentes</option>
            </select>
          </div>
        </div>

        {/* Status Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-1">
          {[
            { id: 'todos', label: 'Todas as Dívidas' },
            { id: 'em_andamento', label: 'Em Andamento' },
            { id: 'pendentes', label: 'Com Parcelas Pendentes' },
            { id: 'vencidas', label: 'Com Parcelas Vencidas' },
            { id: 'quitadas', label: 'Quitadas' },
          ].map((tab) => {
            const isActive = statusFilter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setStatusFilter(tab.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Debt Grid */}
      {filteredAndSortedDebts.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <Layers className="w-10 h-10 text-slate-400 mx-auto mb-3 opacity-50" />
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
            Nenhuma dívida encontrada
          </h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {searchTerm || statusFilter !== 'todos' || categoryFilter !== 'todas'
              ? 'Nenhum resultado corresponde aos filtros aplicados. Tente ajustar sua busca.'
              : 'Cadastre sua primeira dívida de longo prazo para começar a controlar seus pagamentos.'}
          </p>
          <div className="mt-4 flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={onOpenCreateDebt}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer"
            >
              Cadastrar Nova Dívida
            </button>
            {debts.length === 0 && (
              <button
                type="button"
                onClick={loadDemoData}
                className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Usar Dados de Exemplo
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredAndSortedDebts.map((debt) => (
            <DebtCard
              key={debt.id}
              debt={debt}
              installments={installments}
              payments={payments}
              onSelect={onSelectDebt}
              onQuickPay={onQuickPay}
            />
          ))}
        </div>
      )}
    </div>
  );
};
