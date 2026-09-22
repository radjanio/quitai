/**
 * Reusable StatCard for KPIs and metrics
 */

import React from 'react';

interface StatCardProps {
  title: string;
  value: string;
  subtext?: string;
  icon: React.ReactNode;
  variant?: 'default' | 'emerald' | 'amber' | 'rose' | 'blue' | 'purple';
  onClick?: () => void;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtext,
  icon,
  variant = 'default',
  onClick,
}) => {
  const variantStyles = {
    default: {
      card: 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800',
      iconBg: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
      valueText: 'text-slate-900 dark:text-white',
    },
    emerald: {
      card: 'bg-white dark:bg-slate-900 border-emerald-100 dark:border-emerald-950/60',
      iconBg: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400',
      valueText: 'text-emerald-700 dark:text-emerald-400',
    },
    amber: {
      card: 'bg-white dark:bg-slate-900 border-amber-100 dark:border-amber-950/60',
      iconBg: 'bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400',
      valueText: 'text-amber-700 dark:text-amber-400',
    },
    rose: {
      card: 'bg-white dark:bg-slate-900 border-rose-100 dark:border-rose-950/60',
      iconBg: 'bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400',
      valueText: 'text-rose-700 dark:text-rose-400',
    },
    blue: {
      card: 'bg-white dark:bg-slate-900 border-blue-100 dark:border-blue-950/60',
      iconBg: 'bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400',
      valueText: 'text-blue-700 dark:text-blue-400',
    },
    purple: {
      card: 'bg-white dark:bg-slate-900 border-purple-100 dark:border-purple-950/60',
      iconBg: 'bg-purple-50 text-purple-600 dark:bg-purple-950/50 dark:text-purple-400',
      valueText: 'text-purple-700 dark:text-purple-400',
    },
  }[variant];

  return (
    <div
      onClick={onClick}
      className={`p-4 rounded-2xl border shadow-sm transition-all duration-200 ${variantStyles.card} ${
        onClick ? 'cursor-pointer hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700' : ''
      }`}
    >
      <div className="flex items-center justify-between gap-3 mb-2">
        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider truncate">
          {title}
        </span>
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${variantStyles.iconBg}`}>
          {icon}
        </div>
      </div>
      <div className={`text-xl sm:text-2xl font-bold font-mono tracking-tight ${variantStyles.valueText} truncate`}>
        {value}
      </div>
      {subtext && (
        <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 truncate">
          {subtext}
        </div>
      )}
    </div>
  );
};
