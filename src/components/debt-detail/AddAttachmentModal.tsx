/**
 * Add Attachment Modal - Upload contract, down payment proof, or installment receipts
 */

import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Attachment, Installment } from '../../types/finance';
import { Upload, FileText, CheckCircle2 } from 'lucide-react';
import { useSubscription } from '../../context/SubscriptionContext';

interface AddAttachmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  debtId: string;
  installments: Installment[];
  onUpload: (info: {
    fileName: string;
    fileType: string;
    fileSize: number;
    dataUrl: string;
    category: Attachment['category'];
    description?: string;
    installmentId?: string;
  }) => Promise<Attachment>;
}

export const AddAttachmentModal: React.FC<AddAttachmentModalProps> = ({
  isOpen,
  onClose,
  debtId,
  installments,
  onUpload,
}) => {
  const { checkCanAddAttachment, triggerUpgradeNotice } = useSubscription();
  const [file, setFile] = useState<File | null>(null);
  const [dataUrl, setDataUrl] = useState<string>('');
  const [category, setCategory] = useState<Attachment['category']>('contrato');
  const [installmentId, setInstallmentId] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    if (selected.size > 15 * 1024 * 1024) {
      alert('O arquivo selecionado deve ter no máximo 15MB.');
      return;
    }

    setFile(selected);
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setDataUrl(reader.result);
      }
    };
    reader.readAsDataURL(selected);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !dataUrl) {
      alert('Selecione um arquivo.');
      return;
    }

    const check = checkCanAddAttachment(file.size);
    if (!check.allowed) {
      onClose();
      triggerUpgradeNotice(
        check.message || 'Você atingiu o limite de armazenamento ou anexos do seu plano.'
      );
      return;
    }

    setIsSubmitting(true);
    try {
      await onUpload({
        fileName: file.name,
        fileType: file.type || 'application/octet-stream',
        fileSize: file.size,
        dataUrl,
        category,
        installmentId: category === 'comprovante_parcela' && installmentId ? installmentId : undefined,
        description: description.trim() || undefined,
      });
      // Reset
      setFile(null);
      setDataUrl('');
      setDescription('');
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Anexar Documento ou Comprovante"
      subtitle="Armazene contratos, comprovantes de entrada e recibos de forma segura"
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Categoria do Documento */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Tipo de Documento *
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as Attachment['category'])}
            className="w-full px-3.5 py-2 rounded-xl text-xs border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
          >
            <option value="contrato">Contrato Assinado</option>
            <option value="comprovante_entrada">Comprovante da Entrada</option>
            <option value="comprovante_parcela">Comprovante de Parcela</option>
            <option value="outro">Outro Documento / Certidão</option>
          </select>
        </div>

        {/* Se for comprovante de parcela, vincular a qual parcela */}
        {category === 'comprovante_parcela' && (
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Vincular à Parcela (opcional)
            </label>
            <select
              value={installmentId}
              onChange={(e) => setInstallmentId(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl text-xs border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
            >
              <option value="">Selecione uma parcela...</option>
              {installments.map((inst) => (
                <option key={inst.id} value={inst.id}>
                  Parcela #{inst.installmentNumber} — Vencimento {inst.dueDate} ({inst.status})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Descrição */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Descrição / Notas do Arquivo
          </label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Ex: Escritura averbada no 2º Cartório de Registro..."
            className="w-full px-3.5 py-2 rounded-xl text-xs border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        {/* Upload Box */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Arquivo (PDF, JPG, PNG, WEBP) *
          </label>
          {file ? (
            <div className="flex items-center justify-between p-3.5 rounded-xl border border-emerald-300 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/20 text-xs">
              <div className="flex items-center gap-2.5 min-w-0">
                <FileText className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="font-semibold text-slate-900 dark:text-white truncate">{file.name}</p>
                  <p className="text-[10px] text-slate-500">{(file.size / 1024).toFixed(1)} KB</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setFile(null);
                  setDataUrl('');
                }}
                className="text-rose-600 hover:text-rose-700 font-medium text-xs cursor-pointer ml-2"
              >
                Trocar
              </button>
            </div>
          ) : (
            <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl hover:border-emerald-500 transition-colors cursor-pointer bg-slate-50/50 dark:bg-slate-800/40">
              <Upload className="w-6 h-6 text-slate-400 mb-2" />
              <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                Clique para selecionar documento
              </span>
              <span className="text-[10px] text-slate-400 mt-0.5">PDF, PNG, JPG ou WEBP até 10MB</span>
              <input
                type="file"
                required
                accept=".pdf,image/png,image/jpeg,image/webp"
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
            disabled={!file || isSubmitting}
            className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-xs font-semibold text-white shadow-sm transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <CheckCircle2 className="w-4 h-4" />
            {isSubmitting ? 'Salvando...' : 'Salvar Documento'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
