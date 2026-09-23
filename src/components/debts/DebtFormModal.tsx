/**
 * Debt Form Modal - Comprehensive Add / Edit Debt with installment generation
 */

import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Debt, DebtCategory, DebtStatus, PaymentMethod } from '../../types/finance';
import { formatCurrency, parseCurrencyInput } from '../../utils/currency';
import { getTodayIso } from '../../utils/dates';
import { Calculator, HelpCircle, Layers, Sliders } from 'lucide-react';
import { useSubscription } from '../../context/SubscriptionContext';

interface DebtFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (
    debtData: Omit<Debt, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'financedAmountCents'>,
    customAmounts?: number[]
  ) => void;
  debtToEdit?: Debt | null;
}

export const DebtFormModal: React.FC<DebtFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  debtToEdit,
}) => {
  const { checkCanAddDebt, triggerUpgradeNotice } = useSubscription();

  // Basic info
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<DebtCategory>('terreno');
  const [creditor, setCreditor] = useState('');
  const [contractNumber, setContractNumber] = useState('');
  const [startDate, setStartDate] = useState(getTodayIso());
  const [status, setStatus] = useState<DebtStatus>('em_andamento');

  // Financial info (strings for smooth user typing)
  const [totalAmountStr, setTotalAmountStr] = useState('');
  const [downPaymentStr, setDownPaymentStr] = useState('0');
  const [downPaymentPaid, setDownPaymentPaid] = useState(true);
  const [downPaymentPaidDate, setDownPaymentPaidDate] = useState(getTodayIso());
  const [installmentCount, setInstallmentCount] = useState<number>(36);
  const [installmentAmountStr, setInstallmentAmountStr] = useState('');
  const [interestRateAnnual, setInterestRateAnnual] = useState<string>('');
  const [monetaryCorrectionIndex, setMonetaryCorrectionIndex] = useState('');
  const [dueDay, setDueDay] = useState<number>(10);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('boleto');

  // Custom installments toggle
  const [hasCustomInstallments, setHasCustomInstallments] = useState(false);
  const [customAmounts, setCustomAmounts] = useState<number[]>([]);

  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Reset or fill form when modal opens
  useEffect(() => {
    if (!isOpen) return;

    if (debtToEdit) {
      setTitle(debtToEdit.title);
      setDescription(debtToEdit.description || '');
      setCategory(debtToEdit.category);
      setCreditor(debtToEdit.creditor);
      setContractNumber(debtToEdit.contractNumber || '');
      setStartDate(debtToEdit.startDate);
      setStatus(debtToEdit.status);

      setTotalAmountStr((debtToEdit.totalAmountCents / 100).toString());
      setDownPaymentStr((debtToEdit.downPaymentCents / 100).toString());
      setDownPaymentPaid(debtToEdit.downPaymentPaid);
      setDownPaymentPaidDate(debtToEdit.downPaymentPaidDate || debtToEdit.startDate);
      setInstallmentCount(debtToEdit.installmentCount);
      setInstallmentAmountStr((debtToEdit.defaultInstallmentAmountCents / 100).toString());
      setInterestRateAnnual(debtToEdit.interestRateAnnual ? debtToEdit.interestRateAnnual.toString() : '');
      setMonetaryCorrectionIndex(debtToEdit.monetaryCorrectionIndex || '');
      setDueDay(debtToEdit.dueDay);
      setPaymentMethod(debtToEdit.paymentMethod);
      setHasCustomInstallments(false);
      setCustomAmounts([]);
    } else {
      // Default new form
      setTitle('');
      setDescription('');
      setCategory('terreno');
      setCreditor('');
      setContractNumber('');
      const today = getTodayIso();
      setStartDate(today);
      setStatus('em_andamento');

      setTotalAmountStr('80000');
      setDownPaymentStr('10000');
      setDownPaymentPaid(true);
      setDownPaymentPaidDate(today);
      setInstallmentCount(100);
      setInstallmentAmountStr('700');
      setInterestRateAnnual('');
      setMonetaryCorrectionIndex('IPCA');
      setDueDay(15);
      setPaymentMethod('boleto');
      setHasCustomInstallments(false);
      setCustomAmounts([]);
    }
    setErrors({});
  }, [isOpen, debtToEdit]);

  // Auto calculate default installment amount when total, down payment, or count changes
  const handleAutoCalculateInstallment = () => {
    const totalCents = parseCurrencyInput(totalAmountStr);
    const downCents = parseCurrencyInput(downPaymentStr);
    const count = Math.max(1, installmentCount);
    const financedCents = Math.max(0, totalCents - downCents);
    const calculatedPerInstallment = Math.round(financedCents / count);
    setInstallmentAmountStr((calculatedPerInstallment / 100).toFixed(2));
  };

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!title.trim()) errs.title = 'Nome da dívida é obrigatório';
    if (!creditor.trim()) errs.creditor = 'Credor ou instituição é obrigatório';
    if (!startDate) errs.startDate = 'Data de início é obrigatória';

    const totalCents = parseCurrencyInput(totalAmountStr);
    if (totalCents <= 0) errs.totalAmount = 'Informe um valor total válido maior que zero';

    const downCents = parseCurrencyInput(downPaymentStr);
    if (downCents < 0) errs.downPayment = 'O valor da entrada não pode ser negativo';
    if (downCents > totalCents) errs.downPayment = 'A entrada não pode ser maior que o valor total';

    if (installmentCount < 1) errs.installmentCount = 'Mínimo de 1 parcela';

    const instCents = parseCurrencyInput(installmentAmountStr);
    if (instCents <= 0 && !hasCustomInstallments) {
      errs.installmentAmount = 'Informe um valor de parcela válido';
    }

    if (dueDay < 1 || dueDay > 31) errs.dueDay = 'Dia de vencimento deve ser entre 1 e 31';

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    if (!debtToEdit) {
      const check = checkCanAddDebt();
      if (!check.allowed) {
        onClose();
        triggerUpgradeNotice(
          check.message || 'Você atingiu o limite de dívidas ativas para o seu plano atual.'
        );
        return;
      }
    }

    const totalAmountCents = parseCurrencyInput(totalAmountStr);
    const downPaymentCents = parseCurrencyInput(downPaymentStr);
    const defaultInstallmentAmountCents = parseCurrencyInput(installmentAmountStr);

    onSave(
      {
        title: title.trim(),
        description: description.trim(),
        category,
        creditor: creditor.trim(),
        contractNumber: contractNumber.trim() || undefined,
        totalAmountCents,
        downPaymentCents,
        downPaymentPaid: downPaymentCents > 0 ? downPaymentPaid : false,
        downPaymentPaidDate: downPaymentCents > 0 && downPaymentPaid ? downPaymentPaidDate : undefined,
        installmentCount,
        defaultInstallmentAmountCents,
        interestRateAnnual: interestRateAnnual ? parseFloat(interestRateAnnual) : undefined,
        monetaryCorrectionIndex: monetaryCorrectionIndex.trim() || undefined,
        startDate,
        dueDay,
        paymentMethod,
        status,
      },
      hasCustomInstallments && customAmounts.length === installmentCount ? customAmounts : undefined
    );

    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={debtToEdit ? 'Editar Dívida' : 'Nova Dívida de Longo Prazo'}
      subtitle="Cadastre todos os parâmetros contratuais, parcelas e condições de pagamento"
      maxWidth="3xl"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Seção 1: Dados Básicos */}
        <div>
          <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-emerald-500" />
            1. Informações Básicas & Contrato
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Título */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Nome da Dívida / Bem *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Terreno Loteamento Jardim, Financiamento Corolla..."
                className={`w-full px-3.5 py-2 rounded-xl text-xs border bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                  errors.title ? 'border-rose-500' : 'border-slate-300 dark:border-slate-700'
                }`}
              />
              {errors.title && <span className="text-[11px] text-rose-500 mt-1">{errors.title}</span>}
            </div>

            {/* Categoria */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Categoria *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as DebtCategory)}
                className="w-full px-3.5 py-2 rounded-xl text-xs border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
              >
                <option value="terreno">Terreno</option>
                <option value="imovel">Imóvel (Casa/Apto)</option>
                <option value="veiculo">Veículo</option>
                <option value="emprestimo">Empréstimo</option>
                <option value="financiamento">Financiamento</option>
                <option value="compra_parcelada">Compra Parcelada</option>
                <option value="outros">Outros</option>
              </select>
            </div>

            {/* Credor */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Credor / Instituição / Vendedor *
              </label>
              <input
                type="text"
                value={creditor}
                onChange={(e) => setCreditor(e.target.value)}
                placeholder="Ex: Imobiliária Terra Nova, Banco Santander..."
                className={`w-full px-3.5 py-2 rounded-xl text-xs border bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                  errors.creditor ? 'border-rose-500' : 'border-slate-300 dark:border-slate-700'
                }`}
              />
              {errors.creditor && <span className="text-[11px] text-rose-500 mt-1">{errors.creditor}</span>}
            </div>

            {/* Número do Contrato */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Número do Contrato (opcional)
              </label>
              <input
                type="text"
                value={contractNumber}
                onChange={(e) => setContractNumber(e.target.value)}
                placeholder="Ex: CTR-9821-2024"
                className="w-full px-3.5 py-2 rounded-xl text-xs border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Data Contratação */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Data da Contratação *
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl text-xs border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Descrição detalhada */}
            <div className="sm:col-span-2 lg:col-span-3">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Descrição Detalhada / Localização / Dados do Bem
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                placeholder="Ex: Lote 14 Quadra B com 360m², escritura definitiva prevista para..."
                className="w-full px-3.5 py-2 rounded-xl text-xs border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>
        </div>

        {/* Seção 2: Valores & Entrada */}
        <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
          <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <Calculator className="w-3.5 h-3.5 text-blue-500" />
            2. Valores, Entrada e Financiamento
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Valor Total */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Valor Total da Dívida (R$) *
              </label>
              <input
                type="text"
                value={totalAmountStr}
                onChange={(e) => setTotalAmountStr(e.target.value)}
                placeholder="Ex: 80000"
                className={`w-full px-3.5 py-2 rounded-xl text-xs font-mono border bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                  errors.totalAmount ? 'border-rose-500' : 'border-slate-300 dark:border-slate-700'
                }`}
              />
              {errors.totalAmount && <span className="text-[11px] text-rose-500 mt-1">{errors.totalAmount}</span>}
            </div>

            {/* Valor da Entrada */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Valor da Entrada (R$)
              </label>
              <input
                type="text"
                value={downPaymentStr}
                onChange={(e) => setDownPaymentStr(e.target.value)}
                placeholder="0 se não houver entrada"
                className="w-full px-3.5 py-2 rounded-xl text-xs font-mono border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <span className="text-[10px] text-slate-500">Aceita R$ 0,00</span>
            </div>

            {/* Entrada já paga? */}
            {parseCurrencyInput(downPaymentStr) > 0 && (
              <>
                <div className="flex flex-col justify-end">
                  <label className="flex items-center gap-2 cursor-pointer pb-2.5">
                    <input
                      type="checkbox"
                      checked={downPaymentPaid}
                      onChange={(e) => setDownPaymentPaid(e.target.checked)}
                      className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                    />
                    <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                      Entrada já foi paga
                    </span>
                  </label>
                </div>

                {downPaymentPaid && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Data Pagamento da Entrada
                    </label>
                    <input
                      type="date"
                      value={downPaymentPaidDate}
                      onChange={(e) => setDownPaymentPaidDate(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl text-xs border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Seção 3: Parcelamento & Vencimentos */}
        <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-purple-500" />
              3. Parcelas & Regras de Vencimento
            </h4>

            <button
              type="button"
              onClick={handleAutoCalculateInstallment}
              className="text-xs font-medium text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <Calculator className="w-3.5 h-3.5" />
              Recalcular parcela automática
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Qtd Parcelas */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Quantidade de Parcelas *
              </label>
              <input
                type="number"
                min="1"
                max="600"
                value={installmentCount}
                onChange={(e) => setInstallmentCount(parseInt(e.target.value) || 1)}
                className="w-full px-3.5 py-2 rounded-xl text-xs font-mono border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Valor da Parcela */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Valor da Parcela (R$) *
              </label>
              <input
                type="text"
                value={installmentAmountStr}
                onChange={(e) => setInstallmentAmountStr(e.target.value)}
                placeholder="Ex: 700.00"
                className={`w-full px-3.5 py-2 rounded-xl text-xs font-mono border bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                  errors.installmentAmount ? 'border-rose-500' : 'border-slate-300 dark:border-slate-700'
                }`}
              />
              {errors.installmentAmount && (
                <span className="text-[11px] text-rose-500 mt-1">{errors.installmentAmount}</span>
              )}
            </div>

            {/* Dia de Vencimento */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Dia de Vencimento (1 a 31) *
              </label>
              <input
                type="number"
                min="1"
                max="31"
                value={dueDay}
                onChange={(e) => setDueDay(parseInt(e.target.value) || 10)}
                className="w-full px-3.5 py-2 rounded-xl text-xs font-mono border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Forma de Pagamento */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Forma de Pagamento Principal
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                className="w-full px-3.5 py-2 rounded-xl text-xs border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
              >
                <option value="boleto">Boleto Bancário</option>
                <option value="pix">PIX</option>
                <option value="debito_automatico">Débito Automático</option>
                <option value="transferencia">Transferência / TED</option>
                <option value="dinheiro">Dinheiro</option>
                <option value="cartao">Cartão de Crédito</option>
                <option value="outros">Outros</option>
              </select>
            </div>

            {/* Taxa de Juros Anual (opcional) */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Taxa de Juros a.a. (%) (opcional)
              </label>
              <input
                type="number"
                step="0.01"
                value={interestRateAnnual}
                onChange={(e) => setInterestRateAnnual(e.target.value)}
                placeholder="Ex: 6.5"
                className="w-full px-3.5 py-2 rounded-xl text-xs font-mono border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Índice de Reajuste */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Índice de Correção (opcional)
              </label>
              <input
                type="text"
                value={monetaryCorrectionIndex}
                onChange={(e) => setMonetaryCorrectionIndex(e.target.value)}
                placeholder="Ex: IPCA, IGP-M, Fixo..."
                className="w-full px-3.5 py-2 rounded-xl text-xs border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Status Inicial */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Status da Dívida
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as DebtStatus)}
                className="w-full px-3.5 py-2 rounded-xl text-xs border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
              >
                <option value="em_andamento">Em andamento</option>
                <option value="quitada">Quitada</option>
                <option value="suspensa">Suspensa</option>
                <option value="cancelada">Cancelada</option>
              </select>
            </div>
          </div>
        </div>

        {/* Resumo do Cálculo em Tempo Real */}
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono">
            <div>
              <span className="text-slate-500 block text-[10px]">TOTAL CONTRATADO</span>
              <strong className="text-slate-900 dark:text-white text-sm">
                {formatCurrency(parseCurrencyInput(totalAmountStr))}
              </strong>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px]">ENTRADA</span>
              <strong className="text-emerald-600 dark:text-emerald-400 text-sm">
                {formatCurrency(parseCurrencyInput(downPaymentStr))}
              </strong>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px]">SALDO PARCELADO</span>
              <strong className="text-blue-600 dark:text-blue-400 text-sm">
                {formatCurrency(
                  Math.max(0, parseCurrencyInput(totalAmountStr) - parseCurrencyInput(downPaymentStr))
                )}
              </strong>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px]">TOTAL PLANEJADO</span>
              <strong className="text-purple-600 dark:text-purple-400 text-sm">
                {formatCurrency(
                  parseCurrencyInput(downPaymentStr) +
                    parseCurrencyInput(installmentAmountStr) * installmentCount
                )}
              </strong>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-xs font-semibold text-white shadow-sm transition-colors cursor-pointer flex items-center gap-1.5"
          >
            {debtToEdit ? 'Salvar Alterações' : 'Cadastrar Dívida'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
