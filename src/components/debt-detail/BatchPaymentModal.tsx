/**
 * BatchPaymentModal - Pagamento em Lote de Parcelas Selecionadas
 */

import React, { useState, useMemo } from 'react';
import { Installment, Debt, PaymentMethod } from '../../types/finance';
import { formatCurrency } from '../../utils/currency';
import { formatDate } from '../../utils/dates';
import {
  X,
  CreditCard,
  CheckCircle2,
  Calendar,
  Layers,
} from 'lucide-react';

interface BatchPaymentModalProps {
  isOpen: boolean;
  installments: Installment[];
  onClose: () => void;
  onConfirm: (
    installmentIds: string[],
    paymentDate: string,
    paymentMethod: PaymentMethod,
    notes?: string
  ) => void;
}

export const BatchPaymentModal: React.FC<BatchPaymentModalProps> = ({
  isOpen,
  installments,
  onClose,
  onConfirm,
}) => {
  if (!isOpen || installments.length === 0) return null;

  const [paymentDate, setPaymentDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('pix');
  const [notes, setNotes] = useState('');

  const totalAmountCents = useMemo(() => {
    return installments.reduce(
      (acc, i) => acc + Math.max(0, i.expectedAmountCents - (i.paidAmountCents || 0)),
      0
    );
  }, [installments]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirm(
      installments.map((i) => i.id),
      paymentDate,
      paymentMethod,
      notes
    );
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Pagamento em Lote
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Quitar {installments.length} parcela(s) selecionada(s) simultaneamente
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Summary Box */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500">Parcelas a pagar:</span>
              <span className="font-bold text-slate-900 dark:text-white">
                {installments.map((i) => `#${i.installmentNumber}`).join(', ')}
              </span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-slate-200 dark:border-slate-700">
              <span className="text-sm font-bold text-slate-900 dark:text-white">Total a Pagar:</span>
              <span className="text-lg font-bold font-mono text-emerald-600 dark:text-emerald-400">
                {formatCurrency(totalAmountCents)}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="batch-date" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Data do Pagamento
              </label>
              <input
                id="batch-date"
                type="date"
                required
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-xs border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label htmlFor="batch-method" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Forma de Pagamento
              </label>
              <select
                id="batch-method"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                className="w-full px-3 py-2 rounded-xl text-xs border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
              >
                <option value="pix">PIX</option>
                <option value="boleto">Boleto Bancário</option>
                <option value="transferencia">Transferência</option>
                <option value="debito_automatico">Débito Automático</option>
                <option value="dinheiro">Dinheiro</option>
                <option value="outro">Outro</option>
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="batch-notes" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Observações (Opcional)
            </label>
            <input
              id="batch-notes"
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex: Pagamento conjunto de parcelas antecipadas"
              className="w-full px-3 py-2 rounded-xl text-xs border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              Confirmar Pagamento das {installments.length} Parcelas
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
