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
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              1. Identificação do Controlador de Dados & Conformidade LGPD
            </h4>
            <p>
              O <strong>QuitaÍ — Gestão Inteligente de Dívidas</strong> atua como Controlador de Dados Pessoais nos termos
              da Lei Geral de Proteção de Dados (LGPD — Lei nº 13.709/2018). O tratamento de suas informações cadastrais e
              financeiras fundamenta-se na execução de contrato (Art. 7º, V) e no legítimo interesse exclusivo do titular (Art. 7º, IX).
            </p>
          </section>

          <section className="space-y-2">
            <h4 className="text-base font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <FileText className="w-4 h-4 text-emerald-500" />
              2. Dados Pessoais e Financeiros Coletados
            </h4>
            <p>
              Para a plena operação da plataforma, coletamos estritamente os dados inseridos por você:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-xs text-slate-600 dark:text-slate-400">
              <li><strong>Dados de Identificação:</strong> Nome completo, endereço de e-mail e credencial criptografada (hash com salt);</li>
              <li><strong>Dados Financeiros e Contratuais:</strong> Títulos de dívidas, credores, número de contratos, valores financiados, parcelas, datas de vencimento, pagamentos e amortizações, receitas, despesas e posições de investimentos;</li>
              <li><strong>Comprovantes e Documentos:</strong> Arquivos, recibos e notas fiscais anexados voluntariamente para comprovação e controle pessoal.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h4 className="text-base font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Lock className="w-4 h-4 text-emerald-500" />
              3. Armazenamento Seguro, Criptografia e Row Level Security (RLS)
            </h4>
            <p>
              Seus registros são armazenados em infraestrutura de banco de dados <strong>PostgreSQL Supabase</strong> com
              criptografia de ponta a ponta: em trânsito (protocolo TLS 1.3 / HTTPS) e em repouso (criptografia AES-256).
              A integridade e o sigilo são blindados no próprio banco por políticas de <strong>Row Level Security (RLS)</strong>,
              garantindo que somente a chave da sua sessão autenticada possui permissão técnica para leitura, inserção, alteração ou exclusão dos registros.
            </p>
          </section>

          <section className="space-y-2">
            <h4 className="text-base font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              4. Não Compartilhamento e Sigilo Absoluto
            </h4>
            <p>
              O QuitaÍ <strong>nunca comercializa, aluga, cede ou compartilha</strong> seus dados financeiros com birôs de crédito
              (como Serasa ou SPC), instituições financeiras terceiras ou redes de publicidade. Seus dados pertencem exclusivamente a você.
            </p>
          </section>

          <section className="space-y-2">
            <h4 className="text-base font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              5. Seus Direitos e Exclusão Total em Cascata (Art. 18 LGPD)
            </h4>
            <p>
              Como titular dos dados, você pode a qualquer momento: (a) acessar todos os seus dados; (b) retificar informações incorretas;
              (c) exportar backup completo em formato padronizado JSON; e (d) exercer o <strong>direito à eliminação definitiva</strong> diretamente
              no painel de Perfil. Ao confirmar a exclusão, todos os seus contratos, parcelas, recibos, histórico e dados de conta são
              permanentemente expurgados em cascata de nossos servidores e armazenamentos locais de forma irreversível.
            </p>
          </section>

          <section className="space-y-2">
            <h4 className="text-base font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <FileText className="w-4 h-4 text-emerald-500" />
              6. Canal de Atendimento do Encarregado de Dados (DPO)
            </h4>
            <p>
              Para dúvidas, solicitações ou exercício de direitos de titular previstos na LGPD, entre em contato diretamente
              com nosso Encarregado de Proteção de Dados pelo e-mail: <strong className="text-emerald-600 dark:text-emerald-400">privacidade@quitai.com.br</strong> ou <strong className="text-emerald-600 dark:text-emerald-400">radjaniokk@gmail.com</strong>.
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
