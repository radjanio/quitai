/**
 * DocumentsTab - Gallery and management of attachments and contracts
 */

import React, { useState } from 'react';
import { Attachment } from '../../types/finance';
import { formatDateTime } from '../../utils/dates';
import { ConfirmDialog } from '../common/ConfirmDialog';
import {
  FileText,
  Download,
  Trash2,
  Eye,
  Plus,
  Paperclip,
  CheckCircle2,
  FileCheck,
} from 'lucide-react';

interface DocumentsTabProps {
  attachments: Attachment[];
  onOpenAddModal: () => void;
  onViewAttachment: (att: Attachment) => void;
  onDeleteAttachment: (attId: string) => Promise<void>;
}

export const DocumentsTab: React.FC<DocumentsTabProps> = ({
  attachments,
  onOpenAddModal,
  onViewAttachment,
  onDeleteAttachment,
}) => {
  const [attToDelete, setAttToDelete] = useState<Attachment | null>(null);

  const getCategoryLabel = (category: Attachment['category']) => {
    switch (category) {
      case 'contrato':
        return 'Contrato';
      case 'comprovante_entrada':
        return 'Comprovante de Entrada';
      case 'comprovante_parcela':
        return 'Comprovante de Parcela';
      default:
        return 'Documento';
    }
  };

  return (
    <div className="space-y-4">
      {/* Header with Add Button */}
      <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            Documentos e Comprovantes Anexados
          </h3>
          <p className="text-xs text-slate-500">
            {attachments.length} {attachments.length === 1 ? 'arquivo armazenado' : 'arquivos armazenados'}
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenAddModal}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-colors cursor-pointer flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" />
          Anexar Novo Arquivo
        </button>
      </div>

      {/* Grid of Documents */}
      {attachments.length === 0 ? (
        <div className="p-12 text-center text-slate-400 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 text-xs">
          <Paperclip className="w-8 h-8 mx-auto mb-2 opacity-40 text-slate-400" />
          Nenhum documento ou comprovante anexado a esta dívida.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {attachments.map((att) => (
            <div
              key={att.id}
              className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                    {getCategoryLabel(att.category)}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {(att.fileSize / 1024).toFixed(1)} KB
                  </span>
                </div>

                <div className="flex items-center gap-2.5 my-2">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center flex-shrink-0 text-slate-600 dark:text-slate-300">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                      {att.fileName}
                    </h4>
                    <p className="text-[11px] text-slate-500 truncate">
                      {att.description || 'Sem descrição adicional'}
                    </p>
                  </div>
                </div>

                <div className="text-[10px] text-slate-400 mt-2">
                  Anexado em {formatDateTime(att.createdAt)}
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 mt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => onViewAttachment(att)}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <Eye className="w-3.5 h-3.5" />
                  Visualizar
                </button>

                <button
                  type="button"
                  onClick={() => setAttToDelete(att)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                  title="Excluir documento"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!attToDelete}
        onClose={() => setAttToDelete(null)}
        onConfirm={() => {
          if (attToDelete) {
            onDeleteAttachment(attToDelete.id);
            setAttToDelete(null);
          }
        }}
        title="Excluir Documento"
        message={`Tem certeza que deseja excluir o anexo "${attToDelete?.fileName}"? Esta ação não pode ser desfeita.`}
        confirmLabel="Excluir Arquivo"
        isDestructive={true}
      />
    </div>
  );
};
