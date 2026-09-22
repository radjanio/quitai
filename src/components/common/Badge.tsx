/**
 * Status and Category Badges
 */

import React from 'react';
import { DebtCategory, DebtStatus, InstallmentStatus } from '../../types/finance';

interface BadgeProps {
  type: 'category' | 'debtStatus' | 'installmentStatus' | 'paymentMethod';
  value: string;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ type, value, className = '' }) => {
  if (type === 'category') {
    const categoryConfig: Record<DebtCategory | string, { label: string; bg: string; text: string }> = {
      terreno: { label: 'Terreno', bg: 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800', text: 'text-emerald-700 dark:text-emerald-300' },
      imovel: { label: 'Imóvel', bg: 'bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800', text: 'text-blue-700 dark:text-blue-300' },
      veiculo: { label: 'Veículo', bg: 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800', text: 'text-amber-700 dark:text-amber-300' },
      emprestimo: { label: 'Empréstimo', bg: 'bg-purple-50 dark:bg-purple-950/40 border-purple-200 dark:border-purple-800', text: 'text-purple-700 dark:text-purple-300' },
      financiamento: { label: 'Financiamento', bg: 'bg-pink-50 dark:bg-pink-950/40 border-pink-200 dark:border-pink-800', text: 'text-pink-700 dark:text-pink-300' },
      compra_parcelada: { label: 'Compra Parcelada', bg: 'bg-cyan-50 dark:bg-cyan-950/40 border-cyan-200 dark:border-cyan-800', text: 'text-cyan-700 dark:text-cyan-300' },
      outros: { label: 'Outros', bg: 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700', text: 'text-slate-700 dark:text-slate-300' },
    };

    const cfg = categoryConfig[value] || { label: value, bg: 'bg-slate-100 dark:bg-slate-800 border-slate-200', text: 'text-slate-600' };
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium border ${cfg.bg} ${cfg.text} ${className}`}>
        {cfg.label}
      </span>
    );
  }

  if (type === 'debtStatus') {
    const statusConfig: Record<DebtStatus | string, { label: string; dot: string; bg: string; text: string }> = {
      em_andamento: { label: 'Em andamento', dot: 'bg-blue-500', bg: 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-900', text: 'text-blue-700 dark:text-blue-300' },
      quitada: { label: 'Quitada', dot: 'bg-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900', text: 'text-emerald-700 dark:text-emerald-300' },
      suspensa: { label: 'Suspensa', dot: 'bg-amber-500', bg: 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900', text: 'text-amber-700 dark:text-amber-300' },
      cancelada: { label: 'Cancelada', dot: 'bg-slate-400', bg: 'bg-slate-100 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700', text: 'text-slate-600 dark:text-slate-400' },
    };

    const cfg = statusConfig[value] || { label: value, dot: 'bg-slate-400', bg: 'bg-slate-100', text: 'text-slate-600' };
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${cfg.bg} ${cfg.text} ${className}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
        {cfg.label}
      </span>
    );
  }

  if (type === 'installmentStatus') {
    const instConfig: Record<InstallmentStatus | string, { label: string; bg: string; text: string }> = {
      pendente: { label: 'Pendente', bg: 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800/60', text: 'text-amber-700 dark:text-amber-300' },
      paga: { label: 'Paga', bg: 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/60', text: 'text-emerald-700 dark:text-emerald-300' },
      vencida: { label: 'Vencida', bg: 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800/60', text: 'text-rose-700 dark:text-rose-300' },
      parcialmente_paga: { label: 'Parcial', bg: 'bg-sky-50 dark:bg-sky-950/30 border-sky-200 dark:border-sky-800/60', text: 'text-sky-700 dark:text-sky-300' },
      cancelada: { label: 'Cancelada', bg: 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700', text: 'text-slate-600 dark:text-slate-400' },
    };

    const cfg = instConfig[value] || { label: value, bg: 'bg-slate-100', text: 'text-slate-600' };
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold border ${cfg.bg} ${cfg.text} ${className}`}>
        {cfg.label}
      </span>
    );
  }

  // Payment method
  const methodLabels: Record<string, string> = {
    pix: 'PIX',
    dinheiro: 'Dinheiro',
    transferencia: 'Transferência',
    boleto: 'Boleto',
    cartao: 'Cartão',
    debito_automatico: 'Débito Auto',
    outros: 'Outros',
  };

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono ${className}`}>
      {methodLabels[value] || value}
    </span>
  );
};
