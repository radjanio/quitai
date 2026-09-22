/**
 * DebtDetailView - Master View for Single Debt
 */

import React, { useState } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { Debt, Installment, Attachment, PaymentMethod } from '../../types/finance';
import { Badge } from '../common/Badge';
import { OverviewTab } from './OverviewTab';
import { InstallmentsTab } from './InstallmentsTab';
import { HistoryTab } from './HistoryTab';
import { DocumentsTab } from './DocumentsTab';
import { AdjustmentsTab } from './AdjustmentsTab';
import { PaymentModal } from './PaymentModal';
import { EditInstallmentModal } from './EditInstallmentModal';
import { AddAttachmentModal } from './AddAttachmentModal';
import { DocumentViewerModal } from './DocumentViewerModal';
import { ConfirmDialog } from '../common/ConfirmDialog';
import {
  ArrowLeft,
  DollarSign,
  Edit2,
  Trash2,
  FileText,
  Clock,
  CheckCircle2,
  Sliders,
  Paperclip,
  Share2,
} from 'lucide-react';

interface DebtDetailViewProps {
  debtId: string;
  onBack: () => void;
  onEditDebt: (debt: Debt) => void;
}

export const DebtDetailView: React.FC<DebtDetailViewProps> = ({
  debtId,
  onBack,
  onEditDebt,
}) => {
  const {
    debts,
    getDebtSummary,
    getDebtInstallments,
    getDebtPayments,
    getDebtAttachments,
    getDebtHistory,
    adjustmentRules,
    deleteDebt,
    registerInstallmentPayment,
    registerPartialPayment,
    registerDownPayment,
    undoPayment,
    editInstallment,
    addAttachment,
    deleteAttachment,
    addAdjustmentRule,
    applyBatchAdjustment,
  } = useFinance();

  const [activeTab, setActiveTab] = useState<'resumo' | 'parcelas' | 'historico' | 'documentos' | 'reajustes'>('resumo');

  // Modals state
  const [paymentModalState, setPaymentModalState] = useState<{
    isOpen: boolean;
    installment: Installment | null;
    isDownPayment: boolean;
  }>({ isOpen: false, installment: null, isDownPayment: false });

  const [editInstallmentModalState, setEditInstallmentModalState] = useState<{
    isOpen: boolean;
    installment: Installment | null;
  }>({ isOpen: false, installment: null });

  const [isAddAttachmentOpen, setIsAddAttachmentOpen] = useState(false);
  const [viewerAttachment, setViewerAttachment] = useState<Attachment | null>(null);
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);

  const debt = debts.find((d) => d.id === debtId);
  const summary = getDebtSummary(debtId);
  const installments = getDebtInstallments(debtId);
  const payments = getDebtPayments(debtId);
  const attachments = getDebtAttachments(debtId);
  const history = getDebtHistory(debtId);
  const debtRules = adjustmentRules.filter((r) => r.debtId === debtId);

  if (!debt || !summary) {
    return (
      <div className="p-8 text-center text-slate-500">
        <p className="mb-4">Dívida não encontrada ou excluída.</p>
        <button
          type="button"
          onClick={onBack}
          className="px-4 py-2 bg-slate-900 text-white dark:bg-white dark:text-slate-900 rounded-xl text-xs font-semibold"
        >
          Voltar para Lista
        </button>
      </div>
    );
  }

  // Handlers for payments
  const handleOpenPay = (inst: Installment) => {
    setPaymentModalState({ isOpen: true, installment: inst, isDownPayment: false });
  };

  const handleOpenDownPayment = () => {
    setPaymentModalState({ isOpen: true, installment: null, isDownPayment: true });
  };

  const handleConfirmPayment = async (
    amountCents: number,
    paymentDate: string,
    paymentMethod: PaymentMethod,
    notes?: string,
    receiptFile?: { fileName: string; fileType: string; dataUrl: string; description?: string }
  ) => {
    if (paymentModalState.isDownPayment) {
      registerDownPayment(debt.id, paymentDate, paymentMethod, notes);
    } else if (paymentModalState.installment) {
      await registerInstallmentPayment(
        paymentModalState.installment.id,
        amountCents,
        paymentDate,
        paymentMethod,
        notes,
        receiptFile
      );
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title="Voltar para a listagem"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg font-bold text-slate-900 dark:text-white">
                {debt.title}
              </h1>
              <Badge type="category" value={debt.category} />
              <Badge type="debtStatus" value={debt.status} />
              {debt.isDemo && (
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300">
                  EXEMPLO
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Credor: <strong>{debt.creditor}</strong>
              {debt.contractNumber && ` • Contrato: ${debt.contractNumber}`}
            </p>
          </div>
        </div>

        {/* Header Action Buttons */}
        <div className="flex items-center gap-2 self-end sm:self-center">
          {summary.nextDueInstallment && (
            <button
              type="button"
              onClick={() => handleOpenPay(summary.nextDueInstallment!)}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <DollarSign className="w-4 h-4" />
              Pagar Próxima
            </button>
          )}

          <button
            type="button"
            onClick={() => onEditDebt(debt)}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title="Editar informações da dívida"
          >
            <Edit2 className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => setIsConfirmDeleteOpen(true)}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
            title="Excluir dívida"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Tabs Header Navigation */}
      <div className="flex items-center gap-1.5 border-b border-slate-200 dark:border-slate-800 overflow-x-auto pb-1">
        {[
          { id: 'resumo', label: 'Resumo Geral', icon: FileText },
          { id: 'parcelas', label: `Parcelas (${installments.length})`, icon: Clock },
          { id: 'historico', label: `Histórico (${history.length})`, icon: CheckCircle2 },
          { id: 'documentos', label: `Documentos (${attachments.length})`, icon: Paperclip },
          { id: 'reajustes', label: 'Reajustes & Regras', icon: Sliders },
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-2 cursor-pointer ${
                isActive
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Panels */}
      {activeTab === 'resumo' && (
        <OverviewTab
          debt={debt}
          installments={installments}
          payments={payments}
          summary={summary}
          onPayInstallment={handleOpenPay}
          onPayDownPayment={handleOpenDownPayment}
        />
      )}

      {activeTab === 'parcelas' && (
        <InstallmentsTab
          debt={debt}
          installments={installments}
          payments={payments}
          attachments={attachments}
          onPayInstallment={handleOpenPay}
          onPartialPayInstallment={handleOpenPay}
          onEditInstallment={(inst) => setEditInstallmentModalState({ isOpen: true, installment: inst })}
          onUndoPayment={undoPayment}
          onAttachReceipt={(inst) => {
            setIsAddAttachmentOpen(true);
          }}
          onViewAttachment={(att) => setViewerAttachment(att)}
        />
      )}

      {activeTab === 'historico' && <HistoryTab history={history} />}

      {activeTab === 'documentos' && (
        <DocumentsTab
          attachments={attachments}
          onOpenAddModal={() => setIsAddAttachmentOpen(true)}
          onViewAttachment={(att) => setViewerAttachment(att)}
          onDeleteAttachment={deleteAttachment}
        />
      )}

      {activeTab === 'reajustes' && (
        <AdjustmentsTab
          debt={debt}
          installments={installments}
          rules={debtRules}
          onAddRule={addAdjustmentRule}
          onApplyBatchAdjustment={applyBatchAdjustment}
        />
      )}

      {/* Modals */}
      <PaymentModal
        isOpen={paymentModalState.isOpen}
        onClose={() => setPaymentModalState({ isOpen: false, installment: null, isDownPayment: false })}
        installment={paymentModalState.installment}
        debt={debt}
        isDownPayment={paymentModalState.isDownPayment}
        onConfirmPayment={handleConfirmPayment}
      />

      <EditInstallmentModal
        isOpen={editInstallmentModalState.isOpen}
        onClose={() => setEditInstallmentModalState({ isOpen: false, installment: null })}
        installment={editInstallmentModalState.installment}
        onSave={editInstallment}
      />

      <AddAttachmentModal
        isOpen={isAddAttachmentOpen}
        onClose={() => setIsAddAttachmentOpen(false)}
        debtId={debt.id}
        installments={installments}
        onUpload={(info) => addAttachment(debt.id, info)}
      />

      <DocumentViewerModal
        isOpen={!!viewerAttachment}
        onClose={() => setViewerAttachment(null)}
        attachment={viewerAttachment}
      />

      <ConfirmDialog
        isOpen={isConfirmDeleteOpen}
        onClose={() => setIsConfirmDeleteOpen(false)}
        onConfirm={() => {
          deleteDebt(debt.id);
          onBack();
        }}
        title="Excluir Dívida Permanentemente"
        message={`Tem certeza que deseja excluir "${debt.title}"? Todos os pagamentos, parcelas e comprovantes vinculados serão removidos.`}
        confirmLabel="Sim, Excluir Dívida"
        isDestructive={true}
      />
    </div>
  );
};
