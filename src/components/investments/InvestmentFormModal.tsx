import React, { useState, useEffect } from 'react';
import { X, TrendingUp, Building2, Calendar, DollarSign, Tag, FileText } from 'lucide-react';
import { Investment, InvestmentType } from '../../types/finance';
import { formatCurrencyInput, parseCurrencyToCents } from '../../utils/currency';
import { getTodayIso } from '../../utils/dates';

interface InvestmentFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (
    data: Omit<Investment, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'totalInvestedCents' | 'totalYieldCents'>
  ) => void;
  investmentToEdit?: Investment | null;
}

const INVESTMENT_TYPES: { value: InvestmentType; label: string }[] = [
  { value: 'renda_fixa', label: 'Renda Fixa Geral' },
  { value: 'tesouro', label: 'Tesouro Direto (Selic / IPCA+)' },
  { value: 'cdb', label: 'CDB / RDB' },
  { value: 'lci_lca', label: 'LCI / LCA' },
  { value: 'acoes', label: 'Ações (Bolsa de Valores)' },
  { value: 'fundo', label: 'Fundos de Investimento / FIIs' },
  { value: 'previdencia', label: 'Previdência Privada' },
  { value: 'cripto', label: 'Criptoativos' },
  { value: 'outro', label: 'Outro Investimento' },
];

export const InvestmentFormModal: React.FC<InvestmentFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  investmentToEdit,
}) => {
  const [name, setName] = useState('');
  const [type, setType] = useState<InvestmentType>('tesouro');
  const [institution, setInstitution] = useState('');
  const [rawInitialAmount, setRawInitialAmount] = useState('');
  const [rawCurrentAmount, setRawCurrentAmount] = useState('');
  const [applicationDate, setApplicationDate] = useState(getTodayIso());
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (investmentToEdit) {
      setName(investmentToEdit.name);
      setType(investmentToEdit.type);
      setInstitution(investmentToEdit.institution);
      setRawInitialAmount(formatCurrencyInput(investmentToEdit.initialAmountCents));
      setRawCurrentAmount(formatCurrencyInput(investmentToEdit.currentAmountCents));
      setApplicationDate(investmentToEdit.applicationDate);
      setNotes(investmentToEdit.notes || '');
    } else {
      setName('');
      setType('tesouro');
      setInstitution('');
      setRawInitialAmount('');
      setRawCurrentAmount('');
      setApplicationDate(getTodayIso());
      setNotes('');
    }
  }, [investmentToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const initialAmountCents = parseCurrencyToCents(rawInitialAmount);
    const currentAmountCents = rawCurrentAmount
      ? parseCurrencyToCents(rawCurrentAmount)
      : initialAmountCents;

    if (!name.trim() || initialAmountCents <= 0) return;

    onSave({
      name: name.trim(),
      type,
      institution: institution.trim() || 'Instituição não informada',
      initialAmountCents,
      currentAmountCents,
      applicationDate,
      notes: notes.trim() || undefined,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-8">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-indigo-50/60 dark:bg-indigo-950/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {investmentToEdit ? 'Editar Ativo / Investimento' : 'Novo Investimento'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Acompanhe o saldo patrimonial e evolução dos seus rendimentos
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Nome do Ativo / Aplicação *
            </label>
            <input
              type="text"
              required
              placeholder="Ex: Tesouro Selic 2029, CDB 110% CDI Nubank, Fundo Imobiliário..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Tipo de Investimento
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as InvestmentType)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
              >
                {INVESTMENT_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Instituição / Corretora *
              </label>
              <div className="relative">
                <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  required
                  placeholder="Ex: XP, Nubank, Itaú, BTG..."
                  value={institution}
                  onChange={(e) => setInstitution(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Valor Inicial Aplicado *
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                  R$
                </span>
                <input
                  type="text"
                  required
                  placeholder="0,00"
                  value={rawInitialAmount}
                  onChange={(e) => setRawInitialAmount(e.target.value)}
                  onBlur={() => {
                    const cents = parseCurrencyToCents(rawInitialAmount);
                    if (cents > 0) {
                      setRawInitialAmount(formatCurrencyInput(cents));
                      if (!rawCurrentAmount) {
                        setRawCurrentAmount(formatCurrencyInput(cents));
                      }
                    }
                  }}
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Saldo Atual Informado
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                  R$
                </span>
                <input
                  type="text"
                  placeholder="0,00"
                  value={rawCurrentAmount}
                  onChange={(e) => setRawCurrentAmount(e.target.value)}
                  onBlur={() => {
                    const cents = parseCurrencyToCents(rawCurrentAmount);
                    if (cents > 0) setRawCurrentAmount(formatCurrencyInput(cents));
                  }}
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Data da Aplicação *
            </label>
            <div className="relative">
              <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="date"
                required
                value={applicationDate}
                onChange={(e) => setApplicationDate(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Observações / Objetivo do Investimento
            </label>
            <textarea
              rows={2}
              placeholder="Ex: Reserva de emergência com liquidez imediata, aposentadoria..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
            />
          </div>

          {/* Actions */}
          <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:scale-98 rounded-xl shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
            >
              {investmentToEdit ? 'Salvar Alterações' : 'Cadastrar Investimento'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
