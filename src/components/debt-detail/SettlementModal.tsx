/**
 * SettlementModal - Quitação Integral com Acordo / Desconto
 * Permite liquidar todo o saldo remanescente com abatimento negociado com o credor.
 */

import React, { useState, useMemo } from 'react';
import { Debt, Installment, PaymentMethod } from '../../types/finance';
import { formatCurrency, formatPercentage } from '../../utils/currency';
import {
  X,
  Handshake,
  DollarSign,
  TrendingDown,
  CheckCircle2,
  AlertTriangle,
  Calendar,
  CreditCard,
  FileCheck,
} from 'lucide-react';

interface SettlementModalProps {
  isOpen: boolean;
  debt: Debt;
  installments: Installment[];
  onClose: () => void;
  onSettle: (
    negotiatedAmountCents: number,
    paymentDate: string,
    paymentMethod: PaymentMethod,
    notes?: string
  ) => void;
}

export const SettlementModal: React.FC<SettlementModalProps> = ({
  isOpen,
  debt,
  installments,
  onClose,
  onSettle,
}) => {
  if (!isOpen) return null;

  const openInstallments = useMemo(() => {
    return installments.filter((i) => i.status !== 'paga' && i.status !== 'cancelada');
  }, [installments]);

  const totalOpenExpectedCents = useMemo(() => {
    return openInstallments.reduce(
      (acc, i) => acc + Math.max(0, i.expectedAmountCents - (i.paidAmountCents || 0)),
      0
    );
  }, [openInstallments]);

  const [settlementAmountStr, setSettlementAmountStr] = useState<string>(
    (Math.round(totalOpenExpectedCents * 0.75) / 100).toFixed(2)
  );
  const [paymentDate, setPaymentDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('pix');
  const [notes, setNotes] = useState('');

  const negotiatedCents = Math.round(parseFloat(settlementAmountStr || '0') * 100);
  const discountCents = Math.max(0, totalOpenExpectedCents - negotiatedCents);
  const discountPercent =
    totalOpenExpectedCents > 0 ? (discountCents / totalOpenExpectedCents) * 100 : 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (negotiatedCents <= 0) return;
    onSettle(negotiatedCents, paymentDate, paymentMethod, notes);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
              <Handshake className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Quitação com Acordo / Desconto
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Liquide todo o saldo devedor restante por um valor negociado à vista
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

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Summary Box */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500">Credor:</span>
              <span className="font-bold text-slate-900 dark:text-white">{debt.creditor}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Parcelas pendentes:</span>
              <span className="font-bold text-slate-900 dark:text-white">
                {openInstallments.length} parcelas
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Saldo devedor nominal atual:</span>
              <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
                {formatCurrency(totalOpenExpectedCents)}
              </span>
            </div>
          </div>

          {/* Negotiated Amount Field */}
          <div>
            <label htmlFor="settlement-amount" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Valor Acordado para Quitação (R$) *
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-2.5 text-xs font-bold text-slate-400">R$</span>
              <input
                id="settlement-amount"
                type="number"
                step="0.01"
                min="1"
                required
                inputMode="decimal"
                value={settlementAmountStr}
                onChange={(e) => setSettlementAmountStr(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-xl text-base font-bold font-mono border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>

          {/* Discount feedback callout */}
          <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300 font-semibold">
              <TrendingDown className="w-4 h-4 text-emerald-600" />
              <span>Desconto / Deságio Obtido:</span>
            </div>
            <div className="text-right">
              <span className="text-sm font-bold font-mono text-emerald-700 dark:text-emerald-300">
                {formatCurrency(discountCents)}
              </span>
              <span className="text-[11px] text-emerald-600 block">
                ({discountPercent.toFixed(1)}% de economia)
              </span>
            </div>
          </div>

          {/* Payment Date & Method */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="settlement-date" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Data do Acordo / Pagamento
              </label>
              <input
                id="settlement-date"
                type="date"
                required
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-xs border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div>
              <label htmlFor="settlement-method" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Forma de Pagamento
              </label>
              <select
                id="settlement-method"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                className="w-full px-3 py-2 rounded-xl text-xs border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer"
              >
                <option value="pix">PIX</option>
                <option value="transferencia">Transferência Bancária</option>
                <option value="boleto">Boleto de Quitação</option>
                <option value="dinheiro">Dinheiro</option>
                <option value="outro">Outro</option>
              </select>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label htmlFor="settlement-notes" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Termo / Protocolo de Acordo (Opcional)
            </label>
            <input
              id="settlement-notes"
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex: Acordo formalizado via SAC nº 849202"
              className="w-full px-3 py-2 rounded-xl text-xs border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={negotiatedCents <= 0}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-sm transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <FileCheck className="w-4 h-4" />
              Efetivar Quitação da Dívida
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
