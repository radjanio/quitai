import React, { useState } from 'react';
import { X, ArrowDownRight, ArrowUpRight, TrendingUp, Calendar, DollarSign } from 'lucide-react';
import { Investment, InvestmentTransactionType } from '../../types/finance';
import { formatCurrencyInput, parseCurrencyToCents } from '../../utils/currency';
import { getTodayIso } from '../../utils/dates';

interface InvestmentTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  investment: Investment | null;
  onConfirm: (
    investmentId: string,
    type: InvestmentTransactionType,
    amountCents: number,
    date: string,
    notes?: string
  ) => void;
}

export const InvestmentTransactionModal: React.FC<InvestmentTransactionModalProps> = ({
  isOpen,
  onClose,
  investment,
  onConfirm,
}) => {
  const [type, setType] = useState<InvestmentTransactionType>('aporte');
  const [rawAmount, setRawAmount] = useState('');
  const [date, setDate] = useState(getTodayIso());
  const [notes, setNotes] = useState('');

  if (!isOpen || !investment) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amountCents = parseCurrencyToCents(rawAmount);
    if (amountCents <= 0) return;

    onConfirm(investment.id, type, amountCents, date, notes.trim() || undefined);
    setRawAmount('');
    setNotes('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Movimentar Investimento
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              {investment.name} ({investment.institution})
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Tipo de Operação */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Tipo de Movimentação
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setType('aporte')}
                className={`py-2 px-3 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition-all cursor-pointer ${
                  type === 'aporte'
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                    : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                <ArrowDownRight className="w-4 h-4 text-emerald-600" />
                <span>Novo Aporte</span>
              </button>

              <button
                type="button"
                onClick={() => setType('resgate')}
                className={`py-2 px-3 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition-all cursor-pointer ${
                  type === 'resgate'
                    ? 'border-rose-500 bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300'
                    : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                <ArrowUpRight className="w-4 h-4 text-rose-600" />
                <span>Resgate</span>
              </button>

              <button
                type="button"
                onClick={() => setType('rendimento')}
                className={`py-2 px-3 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition-all cursor-pointer ${
                  type === 'rendimento'
                    ? 'border-indigo-500 bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300'
                    : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                <TrendingUp className="w-4 h-4 text-indigo-600" />
                <span>Rendimento</span>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Valor da Operação *
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                R$
              </span>
              <input
                type="text"
                required
                placeholder="0,00"
                value={rawAmount}
                onChange={(e) => setRawAmount(e.target.value)}
                onBlur={() => {
                  const cents = parseCurrencyToCents(rawAmount);
                  if (cents > 0) setRawAmount(formatCurrencyInput(cents));
                }}
                className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Data da Operação *
            </label>
            <div className="relative">
              <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Observações
            </label>
            <input
              type="text"
              placeholder="Ex: Aporte programado de setembro..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:outline-none"
            />
          </div>

          <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md transition-all cursor-pointer"
            >
              Confirmar Operação
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
