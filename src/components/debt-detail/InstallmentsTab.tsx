/**
 * InstallmentsTab - Comprehensive installment schedule management
 */

import React, { useState, useMemo } from 'react';
import { Installment, Debt, Attachment, PaymentRecord } from '../../types/finance';
import { Badge } from '../common/Badge';
import { formatCurrency } from '../../utils/currency';
import { formatDate, getDaysRemainingLabel, isOverdue } from '../../utils/dates';
import {
  Search,
  Filter,
  CheckCircle2,
  Edit2,
  DollarSign,
  FileText,
  RotateCcw,
  Paperclip,
  Clock,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

interface InstallmentsTabProps {
  debt: Debt;
  installments: Installment[];
  payments: PaymentRecord[];
  attachments: Attachment[];
  onPayInstallment: (inst: Installment) => void;
  onPartialPayInstallment: (inst: Installment) => void;
  onEditInstallment: (inst: Installment) => void;
  onUndoPayment: (paymentId: string) => void;
  onAttachReceipt: (inst: Installment) => void;
  onViewAttachment: (att: Attachment) => void;
}

export const InstallmentsTab: React.FC<InstallmentsTabProps> = ({
  debt,
  installments,
  payments,
  attachments,
  onPayInstallment,
  onPartialPayInstallment,
  onEditInstallment,
  onUndoPayment,
  onAttachReceipt,
  onViewAttachment,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('todos');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 15;

  // Filtered installments
  const filtered = useMemo(() => {
    return installments.filter((inst) => {
      // Status filter
      if (statusFilter === 'pendentes' && inst.status !== 'pendente') return false;
      if (statusFilter === 'vencidas' && (inst.status !== 'vencida' && !isOverdue(inst.dueDate, inst.status))) return false;
      if (statusFilter === 'pagas' && inst.status !== 'paga') return false;
      if (statusFilter === 'parciais' && inst.status !== 'parcialmente_paga') return false;

      // Search term
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchesNum = inst.installmentNumber.toString().includes(term);
        const matchesDate = inst.dueDate.includes(term) || formatDate(inst.dueDate).includes(term);
        const matchesNotes = inst.notes?.toLowerCase().includes(term);
        if (!matchesNum && !matchesDate && !matchesNotes) return false;
      }

      return true;
    });
  }, [installments, statusFilter, searchTerm]);

  // Pagination
  const totalPages = Math.ceil(filtered.length / pageSize) || 1;
  const paginated = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, currentPage, pageSize]);

  // Helper map for attachments per installment
  const attachmentsByInstId = useMemo(() => {
    const map = new Map<string, Attachment[]>();
    attachments.forEach((att) => {
      if (att.installmentId) {
        if (!map.has(att.installmentId)) map.set(att.installmentId, []);
        map.get(att.installmentId)!.push(att);
      }
    });
    return map;
  }, [attachments]);

  // Helper map for payments per installment
  const paymentByInstId = useMemo(() => {
    const map = new Map<string, PaymentRecord>();
    payments.forEach((p) => {
      if (p.installmentId) {
        map.set(p.installmentId, p);
      }
    });
    return map;
  }, [payments]);

  return (
    <div className="space-y-4">
      {/* Filters & Search Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Buscar por nº parcela, vencimento..."
            className="w-full pl-9 pr-3.5 py-1.5 rounded-xl text-xs border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        {/* Status Filter Badges */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: 'todos', label: 'Todas', count: installments.length },
            { id: 'pendentes', label: 'Pendentes', count: installments.filter((i) => i.status === 'pendente').length },
            { id: 'vencidas', label: 'Vencidas', count: installments.filter((i) => i.status === 'vencida' || isOverdue(i.dueDate, i.status)).length },
            { id: 'pagas', label: 'Pagas', count: installments.filter((i) => i.status === 'paga').length },
            { id: 'parciais', label: 'Parciais', count: installments.filter((i) => i.status === 'parcialmente_paga').length },
          ].map((tab) => {
            const isActive = statusFilter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setStatusFilter(tab.id);
                  setCurrentPage(1);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
                }`}
              >
                <span>{tab.label}</span>
                <span className="text-[10px] opacity-75 font-mono">({tab.count})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Table Card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200/80 dark:border-slate-800 text-slate-500 uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-3 px-4">Parcela</th>
                <th className="py-3 px-4">Vencimento</th>
                <th className="py-3 px-4">Valor Previsto</th>
                <th className="py-3 px-4">Valor Pago</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Comprovante</th>
                <th className="py-3 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    Nenhuma parcela encontrada com os filtros selecionados.
                  </td>
                </tr>
              ) : (
                paginated.map((inst) => {
                  const isLate = isOverdue(inst.dueDate, inst.status);
                  const instAtts = attachmentsByInstId.get(inst.id) || [];
                  const lastPayment = paymentByInstId.get(inst.id);
                  const { label: daysLabel } = getDaysRemainingLabel(inst.dueDate);

                  return (
                    <tr
                      key={inst.id}
                      className={`hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors ${
                        isLate && inst.status !== 'paga' ? 'bg-rose-50/20 dark:bg-rose-950/10' : ''
                      }`}
                    >
                      {/* Parcela nº */}
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900 dark:text-white whitespace-nowrap">
                        #{inst.installmentNumber}
                        <span className="text-[10px] text-slate-400 font-normal ml-1">
                          /{debt.installmentCount}
                        </span>
                      </td>

                      {/* Vencimento */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 font-mono text-slate-800 dark:text-slate-200">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span>{formatDate(inst.dueDate)}</span>
                        </div>
                        {inst.status !== 'paga' && (
                          <div className={`text-[10px] font-medium mt-0.5 ${isLate ? 'text-rose-600' : 'text-slate-500'}`}>
                            {daysLabel}
                          </div>
                        )}
                      </td>

                      {/* Valor Previsto */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="font-mono font-semibold text-slate-900 dark:text-white">
                          {formatCurrency(inst.expectedAmountCents)}
                        </span>
                        {inst.penaltyInterestCents && inst.penaltyInterestCents > 0 && (
                          <span className="block text-[10px] text-rose-500 font-mono">
                            (+{formatCurrency(inst.penaltyInterestCents)} juros)
                          </span>
                        )}
                      </td>

                      {/* Valor Pago & Data */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {inst.paidAmountCents > 0 ? (
                          <div>
                            <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                              {formatCurrency(inst.paidAmountCents)}
                            </span>
                            {inst.paidDate && (
                              <span className="block text-[10px] text-slate-400 font-mono">
                                pago em {formatDate(inst.paidDate)}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400 font-mono">-</span>
                        )}
                      </td>

                      {/* Status Badge */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <Badge type="installmentStatus" value={inst.status} />
                      </td>

                      {/* Comprovante */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {instAtts.length > 0 ? (
                          <button
                            type="button"
                            onClick={() => onViewAttachment(instAtts[0])}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 text-[11px] font-medium hover:bg-emerald-100 transition-colors cursor-pointer"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            <span>Ver Recibo ({instAtts.length})</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => onAttachReceipt(inst)}
                            className="inline-flex items-center gap-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-[11px] cursor-pointer"
                          >
                            <Paperclip className="w-3.5 h-3.5" />
                            <span>Anexar</span>
                          </button>
                        )}
                      </td>

                      {/* Ações */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {inst.status !== 'paga' ? (
                            <>
                              <button
                                type="button"
                                onClick={() => onPayInstallment(inst)}
                                className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold text-xs transition-colors shadow-sm cursor-pointer"
                              >
                                Pagar
                              </button>
                              <button
                                type="button"
                                onClick={() => onPartialPayInstallment(inst)}
                                title="Amortização Parcial"
                                className="px-2 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs transition-colors cursor-pointer"
                              >
                                Parcial
                              </button>
                            </>
                          ) : (
                            lastPayment && (
                              <button
                                type="button"
                                onClick={() => onUndoPayment(lastPayment.id)}
                                title="Desfazer ou Estornar Pagamento"
                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                              >
                                <RotateCcw className="w-4 h-4" />
                              </button>
                            )
                          )}

                          <button
                            type="button"
                            onClick={() => onEditInstallment(inst)}
                            title="Editar vencimento ou valor da parcela"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="p-3.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
            <span>
              Mostrando {paginated.length} de {filtered.length} parcelas
            </span>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-2 font-mono font-semibold text-slate-700 dark:text-slate-300">
                {currentPage} / {totalPages}
              </span>
              <button
                type="button"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
