/**
 * Category Donut Chart - Pure SVG with interactive tooltips and legend
 */

import React, { useState } from 'react';
import { Debt, DebtCategory } from '../../types/finance';
import { formatCurrency, formatPercentage } from '../../utils/currency';

interface CategoryDonutChartProps {
  debts: Debt[];
}

const CATEGORY_META: Record<DebtCategory, { label: string; color: string }> = {
  terreno: { label: 'Terreno', color: '#10B981' }, // Emerald
  imovel: { label: 'Imóvel', color: '#3B82F6' }, // Blue
  veiculo: { label: 'Veículo', color: '#F59E0B' }, // Amber
  emprestimo: { label: 'Empréstimo', color: '#8B5CF6' }, // Violet
  financiamento: { label: 'Financiamento', color: '#EC4899' }, // Pink
  compra_parcelada: { label: 'Compra Parcelada', color: '#06B6D4' }, // Cyan
  outros: { label: 'Outros', color: '#64748B' }, // Slate
};

export const CategoryDonutChart: React.FC<CategoryDonutChartProps> = ({ debts }) => {
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);

  // Group by category
  const categoryTotals: Record<string, { count: number; totalCents: number; color: string; label: string }> = {};
  let overallTotalCents = 0;

  debts.forEach((debt) => {
    if (debt.status === 'cancelada') return;
    const cat = debt.category;
    if (!categoryTotals[cat]) {
      const meta = CATEGORY_META[cat] || { label: cat, color: '#94A3B8' };
      categoryTotals[cat] = { count: 0, totalCents: 0, color: meta.color, label: meta.label };
    }
    categoryTotals[cat].count += 1;
    categoryTotals[cat].totalCents += debt.totalAmountCents;
    overallTotalCents += debt.totalAmountCents;
  });

  const categories = Object.entries(categoryTotals).sort((a, b) => b[1].totalCents - a[1].totalCents);

  if (categories.length === 0 || overallTotalCents === 0) {
    return (
      <div className="h-64 flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 text-sm">
        <p>Nenhuma dívida ativa para exibir no gráfico.</p>
      </div>
    );
  }

  // Calculate SVG arc paths
  const size = 200;
  const strokeWidth = 28;
  const radius = (size - strokeWidth) / 2;
  const center = size / 2;
  const circumference = 2 * Math.PI * radius;

  let accumulatedAngle = 0;
  const slices = categories.map(([catKey, data]) => {
    const fraction = data.totalCents / overallTotalCents;
    const strokeDasharray = `${fraction * circumference} ${circumference}`;
    const strokeDashoffset = -accumulatedAngle * circumference;
    accumulatedAngle += fraction;

    return {
      catKey,
      ...data,
      fraction,
      strokeDasharray,
      strokeDashoffset,
    };
  });

  const activeSlice = hoveredCategory ? slices.find((s) => s.catKey === hoveredCategory) : null;

  return (
    <div className="flex flex-col md:flex-row items-center gap-6">
      {/* SVG Donut */}
      <div className="relative w-48 h-48 flex-shrink-0">
        <svg viewBox={`0 0 ${size} ${size}`} className="w-full h-full transform -rotate-90">
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            className="text-slate-100 dark:text-slate-800"
          />
          {slices.map((slice) => {
            const isHovered = hoveredCategory === slice.catKey;
            return (
              <circle
                key={slice.catKey}
                cx={center}
                cy={center}
                r={radius}
                fill="none"
                stroke={slice.color}
                strokeWidth={isHovered ? strokeWidth + 4 : strokeWidth}
                strokeDasharray={slice.strokeDasharray}
                strokeDashoffset={slice.strokeDashoffset}
                className="transition-all duration-300 cursor-pointer"
                onMouseEnter={() => setHoveredCategory(slice.catKey)}
                onMouseLeave={() => setHoveredCategory(null)}
              />
            );
          })}
        </svg>

        {/* Center Text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center px-4">
          {activeSlice ? (
            <>
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400 truncate max-w-[120px]">
                {activeSlice.label}
              </span>
              <span className="text-sm font-bold text-slate-900 dark:text-white font-mono">
                {formatPercentage(activeSlice.fraction * 100)}
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                {formatCurrency(activeSlice.totalCents)}
              </span>
            </>
          ) : (
            <>
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Total Ativo</span>
              <span className="text-base font-bold text-slate-900 dark:text-white font-mono">
                {formatCurrency(overallTotalCents)}
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                {debts.length} {debts.length === 1 ? 'dívida' : 'dívidas'}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Legend */}
      <div className="flex-1 w-full space-y-2 max-h-48 overflow-y-auto pr-1">
        {slices.map((slice) => {
          const isHovered = hoveredCategory === slice.catKey;
          return (
            <div
              key={slice.catKey}
              onMouseEnter={() => setHoveredCategory(slice.catKey)}
              onMouseLeave={() => setHoveredCategory(null)}
              className={`flex items-center justify-between p-1.5 rounded-lg text-xs cursor-pointer transition-colors ${
                isHovered
                  ? 'bg-slate-100 dark:bg-slate-800'
                  : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: slice.color }}
                />
                <span className="font-medium text-slate-700 dark:text-slate-300 truncate">
                  {slice.label} ({slice.count})
                </span>
              </div>
              <div className="text-right flex-shrink-0 font-mono">
                <span className="font-semibold text-slate-900 dark:text-slate-100">
                  {formatCurrency(slice.totalCents)}
                </span>
                <span className="text-[11px] text-slate-500 ml-1.5">
                  ({formatPercentage(slice.fraction * 100, 0)})
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
