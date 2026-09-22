/**
 * Evolution Bar Chart - Displays monthly payments history and trend
 */

import React, { useState } from 'react';
import { PaymentRecord } from '../../types/finance';
import { formatCurrency, formatCurrencyCompact } from '../../utils/currency';

interface EvolutionBarChartProps {
  payments: PaymentRecord[];
}

export const EvolutionBarChart: React.FC<EvolutionBarChartProps> = ({ payments }) => {
  const [hoveredMonth, setHoveredMonth] = useState<{ monthKey: string; totalCents: number; count: number } | null>(null);

  // Group payments by Month (YYYY-MM)
  const monthlyData: Record<string, { totalCents: number; count: number }> = {};

  payments.forEach((p) => {
    const monthKey = p.paymentDate.slice(0, 7); // "YYYY-MM"
    if (!monthlyData[monthKey]) {
      monthlyData[monthKey] = { totalCents: 0, count: 0 };
    }
    monthlyData[monthKey].totalCents += p.amountCents;
    monthlyData[monthKey].count += 1;
  });

  // Sort chronologically and take last 10 months or all available
  const sortedMonths = Object.keys(monthlyData).sort().slice(-10);

  if (sortedMonths.length === 0) {
    return (
      <div className="h-64 flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 text-sm">
        <p>Nenhum pagamento registrado para gerar o histórico.</p>
      </div>
    );
  }

  const maxMonthCents = Math.max(...sortedMonths.map((m) => monthlyData[m].totalCents), 1);

  const formatMonthLabel = (mKey: string) => {
    const [y, m] = mKey.split('-');
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const idx = parseInt(m, 10) - 1;
    return `${months[idx]}/${y.slice(2)}`;
  };

  return (
    <div className="w-full">
      {/* Tooltip Header */}
      <div className="h-6 mb-2 flex items-center justify-between text-xs">
        {hoveredMonth ? (
          <span className="font-medium text-emerald-600 dark:text-emerald-400">
            {formatMonthLabel(hoveredMonth.monthKey)}:{' '}
            <strong className="font-mono text-slate-900 dark:text-white">
              {formatCurrency(hoveredMonth.totalCents)}
            </strong>{' '}
            ({hoveredMonth.count} {hoveredMonth.count === 1 ? 'pagamento' : 'pagamentos'})
          </span>
        ) : (
          <span className="text-slate-400 dark:text-slate-500">
            Passe o mouse sobre as barras para ver os detalhes
          </span>
        )}
      </div>

      {/* Bar Chart Container */}
      <div className="flex items-end gap-2 h-44 pt-4 border-b border-slate-200 dark:border-slate-800">
        {sortedMonths.map((mKey) => {
          const item = monthlyData[mKey];
          const heightPercent = Math.max(8, (item.totalCents / maxMonthCents) * 100);
          const isHovered = hoveredMonth?.monthKey === mKey;

          return (
            <div
              key={mKey}
              className="flex-1 flex flex-col items-center h-full justify-end group cursor-pointer"
              onMouseEnter={() => setHoveredMonth({ monthKey: mKey, ...item })}
              onMouseLeave={() => setHoveredMonth(null)}
            >
              {/* Value indicator on top */}
              <span
                className={`text-[10px] font-mono mb-1 transition-opacity ${
                  isHovered ? 'opacity-100 font-semibold text-emerald-600 dark:text-emerald-400' : 'opacity-0 group-hover:opacity-100 text-slate-500'
                }`}
              >
                {formatCurrencyCompact(item.totalCents)}
              </span>

              {/* Bar */}
              <div className="w-full max-w-[42px] bg-slate-100 dark:bg-slate-800/80 rounded-t-md relative flex items-end overflow-hidden h-full">
                <div
                  className={`w-full rounded-t-md transition-all duration-300 ${
                    isHovered
                      ? 'bg-emerald-500 shadow-lg shadow-emerald-500/30'
                      : 'bg-emerald-600/80 dark:bg-emerald-500/70 hover:bg-emerald-500'
                  }`}
                  style={{ height: `${heightPercent}%` }}
                />
              </div>

              {/* Label */}
              <span
                className={`text-[11px] mt-2 whitespace-nowrap transition-colors ${
                  isHovered ? 'font-bold text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                {formatMonthLabel(mKey)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
