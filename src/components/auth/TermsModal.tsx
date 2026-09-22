import React from 'react';
import { X, ShieldCheck, Lock, FileText, CheckCircle2 } from 'lucide-react';

interface TermsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAccept?: () => void;
}

export const TermsModal: React.FC<TermsModalProps> = ({ isOpen, onClose, onAccept }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                Termos de Uso & Privacidade — QuitaÍ
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Última atualização: Setembro de 2026
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          <section className="space-y-2">
            <h4 className="text-base font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Lock className="w-4 h-4 text-emerald-500" />
              1. Privacidade e Isolamento Estrito de Dados
            </h4>
            <p>
              O <strong>QuitaÍ</strong> garante que todos os dados cadastrados (como contratos de dívidas, financiamentos,
              valores contratados, cronogramas de parcelas, comprovantes bancários e anexos) são estritamente isolados
              por conta de usuário. Nenhum outro usuário da plataforma possui autorização técnica ou acesso para visualizar,
              consultar ou modificar as informações financeiras de terceiros.
            </p>
          </section>

          <section className="space-y-2">
            <h4 className="text-base font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <FileText className="w-4 h-4 text-emerald-500" />
              2. Finalidade e Uso da Plataforma
            </h4>
            <p>
              A aplicação destina-se exclusivamente ao gerenciamento financeiro pessoal ou empresarial de contratos de
              longo prazo (terrenos, imóveis, veículos, empréstimos e parcelamentos em geral), oferecendo simuladores,
              cálculo de amortizações e registro de comprovantes.
            </p>
          </section>

          <section className="space-y-2">
            <h4 className="text-base font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              3. Segurança e Criptografia
            </h4>
            <p>
              As senhas são processadas por meio de algoritmos de dispersão criptográfica (SHA-256 com salt) antes de qualquer
              armazenamento. Suas credenciais de acesso nunca são salvas em texto legível.
            </p>
          </section>

          <section className="space-y-2">
            <h4 className="text-base font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              4. Seus Direitos e Exclusão Total
            </h4>
            <p>
              Você tem total autonomia sobre os seus dados. A qualquer momento, na tela de perfil, é possível solicitar a
              exclusão definitiva de sua conta, momento em que todo o histórico financeiro, dívidas, parcelas e anexos
              vinculados ao seu identificador são expurgados de forma definitiva e irrecuperável.
            </p>
          </section>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3 bg-slate-50 dark:bg-slate-900/50 rounded-b-2xl">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-medium text-sm transition-colors"
          >
            Fechar
          </button>
          {onAccept && (
            <button
              type="button"
              onClick={() => {
                onAccept();
                onClose();
              }}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-sm transition-colors shadow-sm shadow-emerald-500/20"
            >
              Concordar e Continuar
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
