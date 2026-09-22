/**
 * Edit Installment Modal - Change due date, expected amount, add penalties or discounts with reason
 */

import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Installment } from '../../types/finance';
import { formatCurrency, parseCurrencyInput } from '../../utils/currency';
import { Calendar, DollarSign, Edit3, ShieldAlert } from 'lucide-react';

interface EditInstallmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  installment: Installment | null;
  onSave: (
    installmentId: string,
    updates: {
      dueDate?: string;
      expectedAmountCents?: number;
      notes?: string;
      penaltyInterestCents?: number;
      discountCents?: number;
      reason?: string;
    }
  ) => void;
}

export const EditInstallmentModal: React.FC<EditInstallmentModalProps> = ({
  isOpen,
  onClose,
  installment,
  onSave,
}) => {
  const [dueDate, setDueDate] = useState('');
  const [amountStr, setAmountStr] = useState('');
  const [penaltyStr, setPenaltyStr] = useState('0');
  const [discountStr, setDiscountStr] = useState('0');
  const [notes, setNotes] = useState('');
  const [reason, setReason] = useState('');

  useEffect(() => {
    if (!isOpen || !installment) return;
    setDueDate(installment.dueDate);
    const baseAmount = installment.originalAmountCents || installment.expectedAmountCents;
    setAmountStr((baseAmount / 100).toFixed(2));
    setPenaltyStr(((installment.penaltyInterestCents || 0) / 100).toFixed(2));
    setDiscountStr(((installment.discountCents || 0) / 100).toFixed(2));
    setNotes(installment.notes || '');
    setReason('');
  }, [isOpen, installment]);

  if (!installment) return null;

  const baseCents = parseCurrencyInput(amountStr);
  const penaltyCents = parseCurrencyInput(penaltyStr);
  const discountCents = parseCurrencyInput(discountStr);
  const finalUpdatedCents = Math.max(0, baseCents + penaltyCents - discountCents);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(installment.id, {
      dueDate,
      expectedAmountCents: finalUpdatedCents,
      penaltyInterestCents: penaltyCents > 0 ? penaltyCents : undefined,
      discountCents: discountCents > 0 ? discountCents : undefined,
      notes: notes.trim() || undefined,
      reason: reason.trim() || `Alteração manual: Parcela #${installment.installmentNumber} reajustada para ${formatCurrency(finalUpdatedCents)}`,
    });
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Editar Parcela #${installment.installmentNumber}`}
      subtitle="Ajuste a data de vencimento, adicione juros, multas ou descontos com registro de motivo"
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Vencimento */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Data de Vencimento
          </label>
          <div className="relative">
            <input
              type="date"
              required
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl text-xs border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        {/* Valor Base */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Valor Base Previsto (R$)
          </label>
          <input
            type="text"
            required
            value={amountStr}
            onChange={(e) => setAmountStr(e.target.value)}
            className="w-full px-3.5 py-2 rounded-xl text-xs font-mono font-bold border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        {/* Encargos e Descontos */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              + Juros / Encargos (R$)
            </label>
            <input
              type="text"
              value={penaltyStr}
              onChange={(e) => setPenaltyStr(e.target.value)}
              placeholder="0,00"
              className="w-full px-3.5 py-2 rounded-xl text-xs font-mono text-rose-600 dark:text-rose-400 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              - Desconto (R$)
            </label>
            <input
              type="text"
              value={discountStr}
              onChange={(e) => setDiscountStr(e.target.value)}
              placeholder="0,00"
              className="w-full px-3.5 py-2 rounded-xl text-xs font-mono text-emerald-600 dark:text-emerald-400 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        {/* Breakdown Card */}
        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs font-mono space-y-1">
          <div className="flex justify-between text-slate-500">
            <span>Valor Original:</span>
            <span>{formatCurrency(baseCents)}</span>
          </div>
          {penaltyCents > 0 && (
            <div className="flex justify-between text-rose-600 dark:text-rose-400">
              <span>+ Juros / Encargos:</span>
              <span>+{formatCurrency(penaltyCents)}</span>
            </div>
          )}
          {discountCents > 0 && (
            <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
              <span>- Desconto:</span>
              <span>-{formatCurrency(discountCents)}</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-slate-900 dark:text-white pt-1.5 border-t border-slate-200 dark:border-slate-700">
            <span>Novo Valor Atualizado:</span>
            <span>{formatCurrency(finalUpdatedCents)}</span>
          </div>
        </div>

        {/* Motivo da alteração */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Motivo do Reajuste / Alteração *
          </label>
          <input
            type="text"
            required
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Ex: Reajuste anual IGP-M contratual, prorrogação solicitada..."
            className="w-full px-3.5 py-2 rounded-xl text-xs border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        {/* Observações da Parcela */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Observações Adicionais
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            className="w-full px-3.5 py-2 rounded-xl text-xs border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-xs font-semibold text-white shadow-sm transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <Edit3 className="w-4 h-4" />
            Salvar Alteração
          </button>
        </div>
      </form>
    </Modal>
  );
};
