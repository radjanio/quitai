import React from 'react';
import { Clock, ArrowRight, ShieldAlert } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const SessionExpiredModal: React.FC = () => {
  const { sessionExpired, dismissSessionExpired } = useAuth();

  if (!sessionExpired) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md p-6 text-center shadow-2xl space-y-4">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
          <Clock className="w-7 h-7" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">
            Sessão Expirada por Inatividade
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
            Por medidas de proteção dos seus dados financeiros, o acesso automático expirou.
            Faça login novamente com suas credenciais para continuar no QuitaÍ.
          </p>
        </div>
        <button
          type="button"
          onClick={dismissSessionExpired}
          className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm transition-all shadow-sm shadow-emerald-600/20 flex items-center justify-center gap-2"
        >
          <span>Ir para a Tela de Login</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
