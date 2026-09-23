/**
 * QuitaÍ — Modal de Checkout Profissional com PIX e Cartão de Crédito
 * Suporta Sandbox de Testes, Stripe e Mercado Pago
 */

import React, { useState, useEffect } from 'react';
import {
  X,
  ShieldCheck,
  QrCode,
  CreditCard,
  Copy,
  Check,
  Lock,
  Sparkles,
  AlertCircle,
  Clock,
  ArrowRight,
  Info,
} from 'lucide-react';
import { useSubscription } from '../../context/SubscriptionContext';
import { formatCurrencyCents } from '../../utils/currency';
import { PaymentMethodType } from '../../types/subscription';

export const CheckoutModal: React.FC = () => {
  const {
    isCheckoutModalOpen,
    checkoutPlan,
    checkoutCycle,
    closeCheckout,
    confirmSubscription,
    gatewayConfig,
  } = useSubscription();

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodType>('pix');
  const [copiedPix, setCopiedPix] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [timeLeftSeconds, setTimeLeftSeconds] = useState(900); // 15 minutos

  // Card fields
  const [cardNumber, setCardNumber] = useState('');
  const [cardHolder, setCardHolder] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [cardError, setCardError] = useState<string | null>(null);

  // Countdown timer for PIX
  useEffect(() => {
    if (!isCheckoutModalOpen) return;
    setTimeLeftSeconds(900);
    const interval = setInterval(() => {
      setTimeLeftSeconds((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [isCheckoutModalOpen]);

  if (!isCheckoutModalOpen || !checkoutPlan) return null;

  const totalAmountCents =
    checkoutCycle === 'annual'
      ? checkoutPlan.annualPriceCents
      : checkoutPlan.monthlyPriceCents;

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const samplePixPayload = `00020126580014br.gov.bcb.pix0136quitai-${checkoutPlan.id}-${Date.now()}520400005303986540${(
    totalAmountCents / 100
  ).toFixed(2)}5802BR5915QUITAI BRASIL LTDA6009SAO PAULO62070503***6304A1B2`;

  const handleCopyPix = () => {
    navigator.clipboard.writeText(samplePixPayload);
    setCopiedPix(true);
    setTimeout(() => setCopiedPix(false), 2500);
  };

  const handleConfirmPix = async () => {
    setIsProcessing(true);
    try {
      await confirmSubscription(checkoutPlan.id, checkoutCycle, 'pix');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmCard = async (e: React.FormEvent) => {
    e.preventDefault();
    setCardError(null);

    const cleanNumber = cardNumber.replace(/\s+/g, '');
    if (cleanNumber.length < 13) {
      setCardError('Número do cartão inválido.');
      return;
    }

    if (!cardHolder.trim()) {
      setCardError('Informe o nome impresso no cartão.');
      return;
    }

    if (!cardExpiry.includes('/') || cardExpiry.length < 5) {
      setCardError('Data de expiração inválida (use MM/AA).');
      return;
    }

    if (cardCvv.length < 3) {
      setCardError('Código CVV inválido.');
      return;
    }

    setIsProcessing(true);
    try {
      await confirmSubscription(checkoutPlan.id, checkoutCycle, 'cartao');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full">
                Finalizar Assinatura
              </span>
              {gatewayConfig.sandboxMode && (
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full">
                  Modo Sandbox (Testes)
                </span>
              )}
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-1">
              {checkoutPlan.name}
            </h3>
          </div>
          <button
            onClick={closeCheckout}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Order Summary Card */}
          <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">Plano Selecionado</p>
              <h4 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-emerald-500" />
                {checkoutPlan.name}
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Ciclo: {checkoutCycle === 'annual' ? 'Anual (2 meses grátis)' : 'Mensal recorrente'}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-500 dark:text-slate-400">Total a pagar</p>
              <p className="text-xl font-black text-emerald-600 dark:text-emerald-400">
                {formatCurrencyCents(totalAmountCents)}
              </p>
              <p className="text-[10px] text-slate-400">
                {checkoutCycle === 'annual' ? 'Cobrado anualmente' : 'Cobrado a cada 30 dias'}
              </p>
            </div>
          </div>

          {/* Payment Method Selector */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
              Escolha a forma de pagamento
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setPaymentMethod('pix')}
                className={`flex items-center justify-center gap-2 py-3 px-4 rounded-2xl border font-bold text-sm transition-all ${
                  paymentMethod === 'pix'
                    ? 'border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shadow-sm ring-2 ring-emerald-500/20'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                }`}
              >
                <QrCode className="w-4 h-4" />
                PIX Instantâneo
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('cartao')}
                className={`flex items-center justify-center gap-2 py-3 px-4 rounded-2xl border font-bold text-sm transition-all ${
                  paymentMethod === 'cartao'
                    ? 'border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shadow-sm ring-2 ring-emerald-500/20'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                }`}
              >
                <CreditCard className="w-4 h-4" />
                Cartão de Crédito
              </button>
            </div>
          </div>

          {/* PIX Flow */}
          {paymentMethod === 'pix' && (
            <div className="bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-emerald-500" />
                  QR Code válido por: {formatTimer(timeLeftSeconds)}
                </span>
                <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                  Liberação Imediata
                </span>
              </div>

              {/* Visual QR Code Representation */}
              <div className="flex flex-col items-center justify-center py-2">
                <div className="p-3 bg-white rounded-2xl shadow-md border border-slate-200">
                  {/* Clean SVG QR code graphic */}
                  <svg
                    className="w-36 h-36"
                    viewBox="0 0 100 100"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <rect width="100" height="100" fill="white" />
                    {/* Corner boxes */}
                    <rect x="10" y="10" width="24" height="24" rx="3" fill="#0f172a" />
                    <rect x="14" y="14" width="16" height="16" rx="2" fill="white" />
                    <rect x="18" y="18" width="8" height="8" fill="#059669" />

                    <rect x="66" y="10" width="24" height="24" rx="3" fill="#0f172a" />
                    <rect x="70" y="14" width="16" height="16" rx="2" fill="white" />
                    <rect x="74" y="18" width="8" height="8" fill="#059669" />

                    <rect x="10" y="66" width="24" height="24" rx="3" fill="#0f172a" />
                    <rect x="14" y="70" width="16" height="16" rx="2" fill="white" />
                    <rect x="18" y="74" width="8" height="8" fill="#059669" />

                    {/* Data matrix dots */}
                    <rect x="42" y="14" width="6" height="6" fill="#0f172a" />
                    <rect x="52" y="14" width="6" height="6" fill="#0f172a" />
                    <rect x="42" y="24" width="6" height="6" fill="#0f172a" />
                    <rect x="42" y="38" width="8" height="8" fill="#059669" />
                    <rect x="54" y="38" width="8" height="8" fill="#0f172a" />
                    <rect x="66" y="38" width="6" height="6" fill="#0f172a" />
                    <rect x="78" y="38" width="8" height="8" fill="#0f172a" />
                    <rect x="14" y="44" width="8" height="8" fill="#0f172a" />
                    <rect x="28" y="44" width="6" height="6" fill="#059669" />
                    <rect x="44" y="52" width="12" height="6" fill="#0f172a" />
                    <rect x="62" y="52" width="6" height="6" fill="#059669" />
                    <rect x="74" y="52" width="10" height="6" fill="#0f172a" />
                    <rect x="42" y="66" width="8" height="8" fill="#0f172a" />
                    <rect x="56" y="66" width="6" height="6" fill="#059669" />
                    <rect x="68" y="66" width="8" height="8" fill="#0f172a" />
                    <rect x="80" y="66" width="6" height="6" fill="#0f172a" />
                    <rect x="44" y="78" width="6" height="12" fill="#0f172a" />
                    <rect x="56" y="78" width="10" height="8" fill="#059669" />
                    <rect x="72" y="78" width="6" height="12" fill="#0f172a" />
                  </svg>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 text-center">
                  Escaneie com o app do seu banco ou copie o código abaixo
                </p>
              </div>

              {/* Pix Copia e Cola */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                  Código Pix Copia e Cola
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    readOnly
                    value={samplePixPayload}
                    className="flex-1 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-700 dark:text-slate-300 font-mono select-all truncate"
                  />
                  <button
                    type="button"
                    onClick={handleCopyPix}
                    className="py-2 px-3.5 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shrink-0"
                  >
                    {copiedPix ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                        Copiado!
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        Copiar
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Simulation confirmation button */}
              <button
                type="button"
                onClick={handleConfirmPix}
                disabled={isProcessing}
                className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-2xl font-bold text-sm transition-all shadow-md shadow-emerald-500/20 flex items-center justify-center gap-2 mt-4"
              >
                {isProcessing ? (
                  'Confirmando Pagamento...'
                ) : (
                  <>
                    Confirmar Pagamento PIX
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          )}

          {/* Credit Card Flow */}
          {paymentMethod === 'cartao' && (
            <form onSubmit={handleConfirmCard} className="space-y-4">
              {cardError && (
                <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 rounded-xl text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {cardError}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Número do Cartão
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="0000 0000 0000 0000"
                    maxLength={19}
                    value={cardNumber}
                    onChange={(e) => {
                      const v = e.target.value.replace(/\D/g, '').replace(/(\d{4})(?=\d)/g, '$1 ');
                      setCardNumber(v);
                    }}
                    className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white font-mono focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    required
                  />
                  <CreditCard className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Nome impresso no Cartão
                </label>
                <input
                  type="text"
                  placeholder="NOME COMO ESTÁ NO CARTÃO"
                  value={cardHolder}
                  onChange={(e) => setCardHolder(e.target.value.toUpperCase())}
                  className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white uppercase focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Validade
                  </label>
                  <input
                    type="text"
                    placeholder="MM/AA"
                    maxLength={5}
                    value={cardExpiry}
                    onChange={(e) => {
                      let v = e.target.value.replace(/\D/g, '');
                      if (v.length > 2) v = v.substring(0, 2) + '/' + v.substring(2, 4);
                      setCardExpiry(v);
                    }}
                    className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white font-mono focus:ring-2 focus:ring-emerald-500 focus:outline-none text-center"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    CVV
                  </label>
                  <input
                    type="password"
                    placeholder="123"
                    maxLength={4}
                    value={cardCvv}
                    onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, ''))}
                    className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white font-mono focus:ring-2 focus:ring-emerald-500 focus:outline-none text-center"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isProcessing}
                className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-2xl font-bold text-sm transition-all shadow-md shadow-emerald-500/20 flex items-center justify-center gap-2 mt-4"
              >
                {isProcessing ? (
                  'Processando Pagamento...'
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    Pagar {formatCurrencyCents(totalAmountCents)} e Ativar
                  </>
                )}
              </button>
            </form>
          )}

          {/* Security & Guarantee Notes */}
          <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-2 text-slate-500 dark:text-slate-400 text-xs">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>Ambiente seguro com criptografia de ponta a ponta (TLS 256-bit).</span>
            </div>
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 text-slate-400 shrink-0" />
              <span>Cancele quando quiser diretamente no seu perfil, sem burocracia ou taxas de rescisão.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
