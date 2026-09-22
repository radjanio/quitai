/**
 * HistoryTab - Chronological audit log of all debt activities
 */

import React from 'react';
import { HistoryEvent } from '../../types/finance';
import { formatCurrency } from '../../utils/currency';
import { formatDateTime } from '../../utils/dates';
import {
  Clock,
  CheckCircle2,
  DollarSign,
  Edit,
  FileText,
  RotateCcw,
  Sliders,
  AlertCircle,
} from 'lucide-react';

interface HistoryTabProps {
  history: HistoryEvent[];
}

export const HistoryTab: React.FC<HistoryTabProps> = ({ history }) => {
  const getEventIcon = (type: HistoryEvent['type']) => {
    switch (type) {
      case 'criacao':
        return <FileText className="w-4 h-4 text-blue-500" />;
      case 'pagamento_entrada':
      case 'pagamento_parcela':
        return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
      case 'pagamento_parcial':
        return <DollarSign className="w-4 h-4 text-sky-500" />;
      case 'estorno_pagamento':
        return <RotateCcw className="w-4 h-4 text-rose-500" />;
      case 'reajuste_valor':
        return <Sliders className="w-4 h-4 text-purple-500" />;
      case 'anexo_adicionado':
        return <FileText className="w-4 h-4 text-amber-500" />;
      default:
        return <Clock className="w-4 h-4 text-slate-500" />;
    }
  };

  if (history.length === 0) {
    return (
      <div className="p-12 text-center text-slate-400 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 text-xs">
        Nenhum registro histórico nesta dívida.
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm">
      <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-100 dark:before:bg-slate-800">
        {history.map((event) => (
          <div key={event.id} className="relative flex items-start gap-4 text-xs">
            {/* Timeline icon */}
            <div className="absolute -left-6 top-0.5 w-4 h-4 rounded-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 shadow-sm flex items-center justify-center">
              {getEventIcon(event.type)}
            </div>

            <div className="flex-1 p-3.5 rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800">
              <div className="flex items-center justify-between gap-3 mb-1">
                <span className="font-bold text-slate-900 dark:text-white">
                  {event.title}
                </span>
                <span className="text-[11px] text-slate-400 font-mono">
                  {formatDateTime(event.timestamp)}
                </span>
              </div>

              <p className="text-slate-600 dark:text-slate-300 text-xs">
                {event.description}
              </p>

              {event.amountCents !== undefined && (
                <div className="mt-2 font-mono font-bold text-slate-900 dark:text-white text-xs">
                  Valor: {formatCurrency(event.amountCents)}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
