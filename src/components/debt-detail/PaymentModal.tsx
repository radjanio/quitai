/**
 * Payment Modal - Full or Partial Installment Payment with Receipt Attachment
 */

import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Installment, Debt, PaymentMethod } from '../../types/finance';
import { formatCurrency, parseCurrencyInput } from '../../utils/currency';
import { getTodayIso, formatDate } from '../../utils/dates';
import { Upload, FileText, CheckCircle2, DollarSign } from 'lucide-react';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  installment?: Installment | null;
  debt?: Debt | null;
  isDownPayment?: boolean;
  onConfirmPayment: (
    amountCents: number,
    paymentDate: string,
    paymentMethod: PaymentMethod,
    notes?: string,
    receiptFile?: { fileName: string; fileType: string; dataUrl: string; description?: string }
  ) => Promise<void>;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  installment,
  debt,
  isDownPayment = false,
  onConfirmPayment,
}) => {
  const [amountStr, setAmountStr] = useState('');
  const [paymentDate, setPaymentDate] = useState(getTodayIso());
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('pix');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Receipt File state
  const [fileData, setFileData] = useState<{
    fileName: string;
    fileType: string;
    dataUrl: string;
  } | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setPaymentDate(getTodayIso());
    setNotes('');
    setFileData(null);
    setIsSubmitting(false);

    if (isDownPayment && debt) {
      setAmountStr((debt.downPaymentCents / 100).toFixed(2));
      setPaymentMethod(debt.paymentMethod || 'transferencia');
    } else if (installment) {
      // If already partially paid, default amount is the remaining balance
      const remainingCents = Math.max(0, installment.expectedAmountCents - (installment.paidAmountCents || 0));
      setAmountStr((remainingCents / 100).toFixed(2));
      setPaymentMethod(debt?.paymentMethod || 'boleto');
    }
  }, [isOpen, installment, debt, isDownPayment]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 8 * 1024 * 1024) {
      alert('O arquivo selecionado deve ter no máximo 8MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setFileData({
          fileName: file.name,
          fileType: file.type || 'application/octet-stream',
          dataUrl: reader.result,
        });
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountCents = parseCurrencyInput(amountStr);
    if (amountCents <= 0) {
      alert('Informe um valor de pagamento válido.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onConfirmPayment(
        amountCents,
        paymentDate,
        paymentMethod,
        notes.trim() || undefined,
        fileData || undefined
      );
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const title = isDownPayment
    ? 'Registrar Pagamento da Entrada'
    : `Registrar Pagamento — Parcela #${installment?.installmentNumber || ''}`;

  const expectedCents = isDownPayment
    ? debt?.downPaymentCents || 0
    : installment?.expectedAmountCents || 0;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      subtitle={debt ? `${debt.title} • Credor: ${debt.creditor}` : ''}
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Info Banner */}
        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 text-xs">
          <div className="flex items-center justify-between font-mono mb-1">
            <span className="text-slate-500">Valor Previsto:</span>
            <strong className="text-slate-800 dark:text-slate-200">{formatCurrency(expectedCents)}</strong>
          </div>
          {installment && (
            <div className="flex items-center justify-between font-mono">
              <span className="text-slate-500">Vencimento Original:</span>
              <strong className="text-slate-800 dark:text-slate-200">{formatDate(installment.dueDate)}</strong>
            </div>
          )}
          {installment && (installment.paidAmountCents || 0) > 0 && (
            <div className="flex items-center justify-between font-mono text-emerald-600 dark:text-emerald-400 mt-1 pt-1 border-t border-slate-200 dark:border-slate-700">
              <span>Já Amortizado:</span>
              <strong>{formatCurrency(installment.paidAmountCents)}</strong>
            </div>
          )}
        </div>

        {/* Valor do Pagamento */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Valor Efetivamente Pago (R$) *
          </label>
          <div className="relative">
            <span className="absolute left-3.5 top-2.5 text-xs font-mono text-slate-400">R$</span>
            <input
              type="text"
              required
              value={amountStr}
              onChange={(e) => setAmountStr(e.target.value)}
              placeholder="0,00"
              className="w-full pl-10 pr-3.5 py-2.5 rounded-xl text-sm font-mono font-bold border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">
            Pode ser o valor integral ou pagamento parcial/amortização.
          </span>
        </div>

        {/* Data e Forma de Pagamento */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Data do Pagamento *
            </label>
            <input
              type="date"
              required
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl text-xs border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Forma de Pagamento
            </label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
              className="w-full px-3.5 py-2 rounded-xl text-xs border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
            >
              <option value="pix">PIX</option>
              <option value="boleto">Boleto Bancário</option>
              <option value="debito_automatico">Débito Automático</option>
              <option value="transferencia">Transferência / TED</option>
              <option value="dinheiro">Dinheiro em Espécie</option>
              <option value="cartao">Cartão de Crédito</option>
              <option value="outros">Outro</option>
            </select>
          </div>
        </div>

        {/* Observações */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Observações / Código de Autenticação (opcional)
          </label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Ex: Pago com desconto pontualidade, autenticação 82193..."
            className="w-full px-3.5 py-2 rounded-xl text-xs border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        {/* Anexo de Comprovante */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Comprovante de Pagamento (PDF ou Imagem)
          </label>

          {fileData ? (
            <div className="flex items-center justify-between p-3 rounded-xl border border-emerald-300 dark:border-emerald-800 bg-emerald-50/60 dark:bg-emerald-950/20 text-xs">
              <div className="flex items-center gap-2 min-w-0">
                <FileText className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span className="font-medium text-emerald-900 dark:text-emerald-300 truncate">
                  {fileData.fileName}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setFileData(null)}
                className="text-rose-600 hover:text-rose-700 text-xs font-medium cursor-pointer"
              >
                Remover
              </button>
            </div>
          ) : (
            <label className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl hover:border-emerald-500 transition-colors cursor-pointer bg-slate-50/50 dark:bg-slate-800/40">
              <Upload className="w-5 h-5 text-slate-400 mb-1" />
              <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
                Clique para selecionar comprovante
              </span>
              <span className="text-[10px] text-slate-400">PDF, JPG, PNG até 8MB</span>
              <input
                type="file"
                accept="application/pdf,image/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
          )}
        </div>

        {/* Buttons */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-xs font-semibold text-white shadow-sm transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <CheckCircle2 className="w-4 h-4" />
            {isSubmitting ? 'Registrando...' : 'Confirmar Pagamento'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
