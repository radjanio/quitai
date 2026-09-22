import React, { useState, useMemo } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Filter,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ArrowDownLeft,
  ArrowUpRight,
  Layers,
  Check,
} from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { Installment, Debt, Expense, Income } from '../../types/finance';
import { formatCurrencyCents } from '../../utils/currency';

interface FinancialCalendarViewProps {
  onQuickPayInstallment: (installment: Installment, debt: Debt) => void;
}

interface CalendarItem {
  id: string;
  type: 'debt_installment' | 'expense' | 'income';
  title: string;
  amountCents: number;
  date: string;
  status: 'pago' | 'pendente' | 'vencido';
  entity: Installment | Expense | Income;
  debt?: Debt;
}

export const FinancialCalendarView: React.FC<FinancialCalendarViewProps> = ({
  onQuickPayInstallment,
}) => {
  const { debts, installments, expenses, incomes } = useFinance();

  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [filterType, setFilterType] = useState<'all' | 'debt' | 'expense' | 'income'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pago' | 'pendente' | 'vencido'>('all');
  const [selectedDayString, setSelectedDayString] = useState<string | null>(null);

  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth(); // 0-indexed

  const monthNames = [
    'Janeiro',
    'Fevereiro',
    'Março',
    'Abril',
    'Maio',
    'Junho',
    'Julho',
    'Agosto',
    'Setembro',
    'Outubro',
    'Novembro',
    'Dezembro',
  ];

  // Navigate months
  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
    setSelectedDayString(null);
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
    setSelectedDayString(null);
  };

  const handleCurrentMonth = () => {
    setCurrentDate(new Date());
    setSelectedDayString(null);
  };

  // Compile all financial calendar items
  const allItems: CalendarItem[] = useMemo(() => {
    const list: CalendarItem[] = [];

    // 1. Debt Installments
    installments.forEach((inst) => {
      const debt = debts.find((d) => d.id === inst.debtId);
      let status: 'pago' | 'pendente' | 'vencido' = 'pendente';
      if (inst.status === 'paga') {
        status = 'pago';
      } else if (inst.status === 'vencida') {
        status = 'vencido';
      }

      list.push({
        id: inst.id,
        type: 'debt_installment',
        title: `${debt?.title || 'Parcela'} #${inst.installmentNumber}`,
        amountCents: inst.expectedAmountCents,
        date: inst.dueDate,
        status,
        entity: inst,
        debt,
      });
    });

    // 2. Expenses
    expenses.forEach((exp) => {
      list.push({
        id: exp.id,
        type: 'expense',
        title: exp.description,
        amountCents: exp.amountCents,
        date: exp.date,
        status: 'pago',
        entity: exp,
      });
    });

    // 3. Incomes
    incomes.forEach((inc) => {
      list.push({
        id: inc.id,
        type: 'income',
        title: inc.description,
        amountCents: inc.amountCents,
        date: inc.date,
        status: 'pago',
        entity: inc,
      });
    });

    return list;
  }, [installments, debts, expenses, incomes]);

  // Filtered by active tab/status
  const filteredItems = useMemo(() => {
    return allItems.filter((item) => {
      const matchesType =
        filterType === 'all' ||
        (filterType === 'debt' && item.type === 'debt_installment') ||
        (filterType === 'expense' && item.type === 'expense') ||
        (filterType === 'income' && item.type === 'income');

      const matchesStatus = filterStatus === 'all' || item.status === filterStatus;

      return matchesType && matchesStatus;
    });
  }, [allItems, filterType, filterStatus]);

  // Calendar Grid Data
  const { daysInMonth, startDayOfWeek, monthItemsMap } = useMemo(() => {
    const totalDays = new Date(currentYear, currentMonth + 1, 0).getDate();
    const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay(); // 0 = Sun

    const map = new Map<string, CalendarItem[]>();

    const prefix = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;
    filteredItems.forEach((item) => {
      if (item.date.startsWith(prefix)) {
        const existing = map.get(item.date) || [];
        existing.push(item);
        map.set(item.date, existing);
      }
    });

    return {
      daysInMonth: totalDays,
      startDayOfWeek: firstDayIndex,
      monthItemsMap: map,
    };
  }, [currentYear, currentMonth, filteredItems]);

  // Month totals
  const monthSummary = useMemo(() => {
    const prefix = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;
    const inMonth = allItems.filter((i) => i.date.startsWith(prefix));

    const totalIncome = inMonth
      .filter((i) => i.type === 'income')
      .reduce((sum, i) => sum + i.amountCents, 0);

    const totalExpense = inMonth
      .filter((i) => i.type === 'expense')
      .reduce((sum, i) => sum + i.amountCents, 0);

    const totalDebtDue = inMonth
      .filter((i) => i.type === 'debt_installment')
      .reduce((sum, i) => sum + i.amountCents, 0);

    return { totalIncome, totalExpense, totalDebtDue };
  }, [currentYear, currentMonth, allItems]);

  // Selected Day's items
  const selectedDayItems = useMemo(() => {
    if (!selectedDayString) return [];
    return allItems.filter((i) => i.date === selectedDayString);
  }, [selectedDayString, allItems]);

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-teal-100 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400">
              <CalendarIcon className="w-5 h-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Calendário Financeiro
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Planejamento cronológico de vencimentos, despesas e receitas por dia e mês.
          </p>
        </div>

        {/* Month Navigation */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handlePrevMonth}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-bold text-slate-900 dark:text-white min-w-[140px] text-center shadow-sm">
            {monthNames[currentMonth]} de {currentYear}
          </div>
          <button
            type="button"
            onClick={handleNextMonth}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleCurrentMonth}
            className="px-3 py-2 rounded-xl text-xs font-semibold text-teal-700 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/50 hover:bg-teal-100 transition-colors cursor-pointer"
          >
            Mês Atual
          </button>
        </div>
      </div>

      {/* Month Summary Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Entradas Previstas / Recebidas
            </span>
            <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400 mt-1">
              +{formatCurrencyCents(monthSummary.totalIncome)}
            </p>
          </div>
          <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <ArrowDownLeft className="w-4 h-4" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Despesas do Mês
            </span>
            <p className="text-lg font-bold text-rose-600 dark:text-rose-400 mt-1">
              -{formatCurrencyCents(monthSummary.totalExpense)}
            </p>
          </div>
          <div className="w-8 h-8 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center">
            <ArrowUpRight className="w-4 h-4" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Vencimentos de Parcelas
            </span>
            <p className="text-lg font-bold text-indigo-600 dark:text-indigo-400 mt-1">
              {formatCurrencyCents(monthSummary.totalDebtDue)}
            </p>
          </div>
          <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
            <Layers className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm text-xs">
        <div className="flex items-center gap-2">
          <span className="font-bold text-slate-500 dark:text-slate-400">Tipo:</span>
          <button
            type="button"
            onClick={() => setFilterType('all')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-colors cursor-pointer ${
              filterType === 'all'
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            Todos
          </button>
          <button
            type="button"
            onClick={() => setFilterType('debt')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-colors cursor-pointer ${
              filterType === 'debt'
                ? 'bg-indigo-600 text-white'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            Parcelas de Dívidas
          </button>
          <button
            type="button"
            onClick={() => setFilterType('expense')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-colors cursor-pointer ${
              filterType === 'expense'
                ? 'bg-rose-600 text-white'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            Despesas
          </button>
          <button
            type="button"
            onClick={() => setFilterType('income')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-colors cursor-pointer ${
              filterType === 'income'
                ? 'bg-emerald-600 text-white'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            Entradas
          </button>
        </div>

        <div className="flex items-center gap-2">
          <span className="font-bold text-slate-500 dark:text-slate-400">Status:</span>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300"
          >
            <option value="all">Todos os Status</option>
            <option value="pago">Quitados / Recebidos</option>
            <option value="pendente">Pendentes</option>
            <option value="vencido">Vencidos</option>
          </select>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden p-4">
        {/* Days of Week Header */}
        <div className="grid grid-cols-7 gap-1 text-center font-bold text-[11px] uppercase tracking-wider text-slate-400 pb-2 border-b border-slate-100 dark:border-slate-800">
          <div>Dom</div>
          <div>Seg</div>
          <div>Ter</div>
          <div>Qua</div>
          <div>Qui</div>
          <div>Sex</div>
          <div>Sáb</div>
        </div>

        {/* Days Grid */}
        <div className="grid grid-cols-7 gap-1.5 pt-2">
          {/* Empty cells for offset */}
          {Array.from({ length: startDayOfWeek }).map((_, idx) => (
            <div key={`empty-${idx}`} className="min-h-[90px] rounded-xl bg-slate-50/40 dark:bg-slate-800/20" />
          ))}

          {/* Month Days */}
          {Array.from({ length: daysInMonth }).map((_, idx) => {
            const dayNum = idx + 1;
            const dayString = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(
              dayNum
            ).padStart(2, '0')}`;
            const dayItems = monthItemsMap.get(dayString) || [];
            const isSelected = selectedDayString === dayString;
            const isToday =
              new Date().toISOString().split('T')[0] === dayString;

            return (
              <div
                key={dayString}
                onClick={() => setSelectedDayString(dayString)}
                className={`min-h-[90px] p-2 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? 'border-teal-500 bg-teal-50/40 dark:bg-teal-950/20 ring-2 ring-teal-500/20'
                    : isToday
                    ? 'border-emerald-300 dark:border-emerald-800 bg-emerald-50/20 dark:bg-emerald-950/10'
                    : 'border-slate-100 dark:border-slate-800/80 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`text-xs font-bold ${
                      isToday
                        ? 'w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px]'
                        : 'text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {dayNum}
                  </span>
                  {dayItems.length > 0 && (
                    <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                      {dayItems.length}
                    </span>
                  )}
                </div>

                {/* Badges preview */}
                <div className="space-y-1 mt-1">
                  {dayItems.slice(0, 2).map((item) => (
                    <div
                      key={item.id}
                      className={`text-[9px] font-bold px-1 py-0.5 rounded truncate ${
                        item.type === 'income'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300'
                          : item.type === 'expense'
                          ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300'
                          : item.status === 'vencido'
                          ? 'bg-red-100 text-red-800 dark:bg-red-950/80 dark:text-red-300'
                          : item.status === 'pago'
                          ? 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 line-through'
                          : 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/80 dark:text-indigo-300'
                      }`}
                    >
                      {item.title}
                    </div>
                  ))}
                  {dayItems.length > 2 && (
                    <span className="text-[9px] text-slate-400 font-bold block">
                      +{dayItems.length - 2} mais
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected Day Agenda Drawer */}
      {selectedDayString && (
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-teal-200 dark:border-teal-900/60 shadow-sm animate-in fade-in duration-150">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>Agenda do Dia:</span>
                <span className="font-mono text-teal-600 dark:text-teal-400">
                  {selectedDayString}
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                {selectedDayItems.length} lançamento(s) previstos ou realizados
              </p>
            </div>
            <button
              type="button"
              onClick={() => setSelectedDayString(null)}
              className="text-xs font-semibold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              Fechar Detalhes
            </button>
          </div>

          {selectedDayItems.length === 0 ? (
            <p className="py-6 text-center text-xs text-slate-400">
              Nenhuma movimentação registrada para este dia.
            </p>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800/60 mt-2">
              {selectedDayItems.map((item) => {
                const isInstallment = item.type === 'debt_installment';
                return (
                  <div
                    key={item.id}
                    className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${
                          item.type === 'income'
                            ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600'
                            : item.type === 'expense'
                            ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-600'
                            : 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600'
                        }`}
                      >
                        {item.type === 'income' ? (
                          <ArrowDownLeft className="w-4 h-4" />
                        ) : item.type === 'expense' ? (
                          <ArrowUpRight className="w-4 h-4" />
                        ) : (
                          <Layers className="w-4 h-4" />
                        )}
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 dark:text-white">
                          {item.title}
                        </p>
                        <span className="text-[10px] text-slate-400 capitalize">
                          {item.type === 'debt_installment'
                            ? 'Parcela de Dívida'
                            : item.type === 'expense'
                            ? 'Despesa'
                            : 'Entrada'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <span className="font-black text-sm font-mono text-slate-900 dark:text-white">
                        {item.type === 'income' ? '+' : '-'} {formatCurrencyCents(item.amountCents)}
                      </span>

                      {/* Status indicator */}
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          item.status === 'pago'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : item.status === 'vencido'
                            ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                            : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                        }`}
                      >
                        {item.status.toUpperCase()}
                      </span>

                      {/* Quick pay if installment and not paid */}
                      {isInstallment && item.status !== 'pago' && item.debt && (
                        <button
                          type="button"
                          onClick={() =>
                            onQuickPayInstallment(item.entity as Installment, item.debt!)
                          }
                          className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] shadow-sm transition-all cursor-pointer"
                        >
                          Pagar Agora
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
