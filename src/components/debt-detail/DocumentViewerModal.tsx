/**
 * Document Viewer Modal - Preview and download attachments safely
 */

import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Attachment } from '../../types/finance';
import { getAttachmentData } from '../../services/storage';
import { Download, ExternalLink, FileText, Image as ImageIcon } from 'lucide-react';
import { formatDateTime } from '../../utils/dates';

interface DocumentViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  attachment: Attachment | null;
}

export const DocumentViewerModal: React.FC<DocumentViewerModalProps> = ({
  isOpen,
  onClose,
  attachment,
}) => {
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen || !attachment) {
      setDataUrl(null);
      return;
    }

    if (attachment.dataUrl) {
      setDataUrl(attachment.dataUrl);
      return;
    }

    setLoading(true);
    getAttachmentData(attachment.id)
      .then((url) => {
        setDataUrl(url);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [isOpen, attachment]);

  if (!attachment) return null;

  const isImage = attachment.fileType.startsWith('image/') || /\.(png|jpe?g|webp|gif)$/i.test(attachment.fileName);
  const isPdf = attachment.fileType === 'application/pdf' || /\.pdf$/i.test(attachment.fileName);

  const handleDownload = () => {
    if (!dataUrl) return;
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = attachment.fileName;
    a.click();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={attachment.fileName}
      subtitle={`Anexado em ${formatDateTime(attachment.createdAt)} • ${(attachment.fileSize / 1024).toFixed(1)} KB`}
      maxWidth="3xl"
    >
      <div className="space-y-4">
        {/* Description if present */}
        {attachment.description && (
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300">
            <strong>Descrição:</strong> {attachment.description}
          </div>
        )}

        {/* Viewer Box */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-950 min-h-[350px] max-h-[500px] overflow-auto flex items-center justify-center p-2">
          {loading ? (
            <div className="text-xs text-slate-400">Carregando arquivo...</div>
          ) : dataUrl ? (
            isImage ? (
              <img
                src={dataUrl}
                alt={attachment.fileName}
                className="max-h-[480px] max-w-full object-contain rounded-lg shadow-sm"
              />
            ) : isPdf ? (
              <iframe
                src={dataUrl}
                title={attachment.fileName}
                className="w-full h-[480px] rounded-lg border-0"
              />
            ) : (
              <div className="text-center p-8">
                <FileText className="w-12 h-12 text-slate-400 mx-auto mb-2" />
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Visualização direta não disponível para este formato
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Clique no botão abaixo para baixar e abrir no leitor do seu dispositivo.
                </p>
              </div>
            )
          ) : (
            <div className="text-center p-8 text-xs text-slate-400">
              Arquivo em demonstração sem conteúdo binário salvo.
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-slate-800">
          <span className="text-xs text-slate-500 font-mono">
            {attachment.fileType}
          </span>
          <div className="flex items-center gap-2">
            {dataUrl && (
              <button
                type="button"
                onClick={handleDownload}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Download className="w-4 h-4" />
                Baixar Arquivo
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
