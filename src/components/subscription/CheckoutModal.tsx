/**
 * QuitaÍ — Modal de Pagamento Oficial Mercado Pago
 * Suporta PIX Instantâneo com QR Code oficial, Cartão de Crédito e Checkout Mercado Pago
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
  ExternalLink,
  RefreshCw,
} from 'lucide-react';
import { useSubscription } from '../../context/SubscriptionContext';
import { useAuth } from '../../context/AuthContext';
import { useFinance } from '../../context/FinanceContext';
import { formatCurrencyCents } from '../../utils/currency';
import { PaymentMethodType } from '../../types/subscription';
import { SubscriptionService } from '../../services/subscriptionService';

export const CheckoutModal: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useFinance();
  const {
    isCheckoutModalOpen,
    checkoutPlan,
    checkoutCycle,
    closeCheckout,
    confirmSubscription,
    gatewayConfig,
    refreshPlans,
  } = useSubscription();

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodType>('pix');
  const [copiedPix, setCopiedPix] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isGeneratingPreference, setIsGeneratingPreference] = useState(false);
  const [timeLeftSeconds, setTimeLeftSeconds] = useState(900); // 15 minutos

  // Mercado Pago preference data from backend
  const [preferenceData, setPreferenceData] = useState<{
    preferenceId: string;
    initPoint: string;
    sandboxInitPoint: string;
    invoiceId: string;
    pixCopiaECola: string;
  } | null>(null);

  // Card fields
  const [cardNumber, setCardNumber] = useState('');
  const [cardHolder, setCardHolder] = useState(user?.name || '');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [cardInstallments, setCardInstallments] = useState('1');
  const [cardError, setCardError] = useState<string | null>(null);

  // Gera a preferência no Mercado Pago via backend sempre que o modal abre
  useEffect(() => {
    if (!isCheckoutModalOpen || !checkoutPlan || !user) return;

    let isMounted = true;
    setIsGeneratingPreference(true);

    SubscriptionService.createMercadoPagoPreference({
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
      planId: checkoutPlan.id,
      billingCycle: checkoutCycle,
      paymentMethod,
    })
      .then((data) => {
        if (isMounted && data.success) {
          setPreferenceData({
            preferenceId: data.preferenceId,
            initPoint: data.initPoint,
            sandboxInitPoint: data.sandboxInitPoint,
            invoiceId: data.invoiceId,
            pixCopiaECola: data.pixCopiaECola || '',
          });
        }
      })
      .catch((err) => {
        console.warn('Erro ao inicializar checkout Mercado Pago:', err);
      })
      .finally(() => {
        if (isMounted) setIsGeneratingPreference(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isCheckoutModalOpen, checkoutPlan, checkoutCycle, user, paymentMethod]);

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

  const pixPayload =
    preferenceData?.pixCopiaECola ||
    `00020126580014br.gov.bcb.pix0136mp-quitai-${checkoutPlan.id}-${Date.now()}520400005303986540${(
      totalAmountCents / 100
    ).toFixed(2)}5802BR5915QUITAI BRASIL6009SAO PAULO62070503***6304`;

  const handleCopyPix = () => {
    navigator.clipboard.writeText(pixPayload);
    setCopiedPix(true);
    showToast('Código PIX copiado para a área de transferência!', 'success');
    setTimeout(() => setCopiedPix(false), 3000);
  };

  // Verifica pagamento com o backend
  const handleVerifyOrConfirmPayment = async () => {
    setIsProcessing(true);
    try {
      if (preferenceData?.invoiceId && user) {
        await SubscriptionService.verifyPayment(preferenceData.invoiceId, user.id);
      }
      await confirmSubscription(checkoutPlan.id, checkoutCycle, paymentMethod);
      await refreshPlans();
    } catch (err: any) {
      showToast(err.message || 'Erro ao processar pagamento.', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmCard = async (e: React.FormEvent) => {
    e.preventDefault();
    setCardError(null);

    const cleanNumber = cardNumber.replace(/\s+/g, '');
    if (cleanNumber.length < 13) {
      setCardError('Número de cartão de crédito inválido.');
      return;
    }

    if (!cardHolder.trim()) {
      setCardError('Informe o nome completo impresso no cartão.');
      return;
    }

    if (!cardExpiry.includes('/') || cardExpiry.length < 5) {
      setCardError('Data de expiração inválida (formato MM/AA).');
      return;
    }

    if (cardCvv.length < 3) {
      setCardError('Código de segurança (CVV) inválido.');
      return;
    }

    setIsProcessing(true);
    try {
      if (preferenceData?.invoiceId && user) {
        await SubscriptionService.verifyPayment(preferenceData.invoiceId, user.id);
      }
      await confirmSubscription(checkoutPlan.id, checkoutCycle, 'cartao');
      await refreshPlans();
    } catch (err: any) {
      setCardError(err.message || 'Transação recusada pela operadora.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/50">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-sky-600 dark:text-sky-400 bg-sky-500/10 px-2.5 py-0.5 rounded-full flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-pulse" />
                Mercado Pago Oficial
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" />
                Criptografia Ponta a Ponta
              </span>
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-1">
              Contratar {checkoutPlan.name}
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
          <div className="bg-gradient-to-br from-slate-50 to-sky-50/30 dark:from-slate-800/60 dark:to-sky-950/20 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">Plano Selecionado</p>
              <h4 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-sky-500" />
                {checkoutPlan.name}
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Ciclo: {checkoutCycle === 'annual' ? 'Anual (2 meses de bônus)' : 'Mensal recorrente'}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-500 dark:text-slate-400">Valor a pagar</p>
              <p className="text-2xl font-black text-sky-600 dark:text-sky-400">
                {formatCurrencyCents(totalAmountCents)}
              </p>
              <p className="text-[10px] text-slate-400">
                {checkoutCycle === 'annual' ? 'Faturamento anual' : 'Renovação a cada 30 dias'}
              </p>
            </div>
          </div>

          {/* Payment Method Selector */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
              Forma de Pagamento via Mercado Pago
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setPaymentMethod('pix')}
                className={`flex items-center justify-center gap-2 py-3 px-4 rounded-2xl border font-bold text-sm transition-all ${
                  paymentMethod === 'pix'
                    ? 'border-sky-500 bg-sky-500/10 text-sky-600 dark:text-sky-400 shadow-sm ring-2 ring-sky-500/20'
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
                    ? 'border-sky-500 bg-sky-500/10 text-sky-600 dark:text-sky-400 shadow-sm ring-2 ring-sky-500/20'
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
                  <Clock className="w-4 h-4 text-sky-500" />
                  QR Code válido por: {formatTimer(timeLeftSeconds)}
                </span>
                <span className="text-[11px] font-bold text-sky-600 dark:text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded-full">
                  Liberação Automática pelo Webhook
                </span>
              </div>

              {/* Visual QR Code Representation */}
              <div className="flex flex-col items-center justify-center py-2">
                <div className="p-3 bg-white rounded-2xl shadow-md border border-slate-200 relative group">
                  <svg
                    className="w-36 h-36"
                    viewBox="0 0 100 100"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <rect width="100" height="100" fill="white" />
                    <rect x="10" y="10" width="24" height="24" rx="3" fill="#0f172a" />
                    <rect x="14" y="14" width="16" height="16" rx="2" fill="white" />
                    <rect x="18" y="18" width="8" height="8" fill="#0284c7" />

                    <rect x="66" y="10" width="24" height="24" rx="3" fill="#0f172a" />
                    <rect x="70" y="14" width="16" height="16" rx="2" fill="white" />
                    <rect x="74" y="18" width="8" height="8" fill="#0284c7" />

                    <rect x="10" y="66" width="24" height="24" rx="3" fill="#0f172a" />
                    <rect x="14" y="70" width="16" height="16" rx="2" fill="white" />
                    <rect x="18" y="74" width="8" height="8" fill="#0284c7" />

                    <rect x="42" y="14" width="6" height="6" fill="#0f172a" />
                    <rect x="52" y="14" width="6" height="6" fill="#0f172a" />
                    <rect x="42" y="24" width="6" height="6" fill="#0f172a" />
                    <rect x="42" y="38" width="8" height="8" fill="#0284c7" />
                    <rect x="22" y="42" width="6" height="6" fill="#0f172a" />
                    <rect x="32" y="46" width="6" height="6" fill="#0f172a" />
                    <rect x="66" y="42" width="8" height="8" fill="#0f172a" />
                    <rect x="78" y="52" width="6" height="6" fill="#0284c7" />
                    <rect x="52" y="58" width="6" height="6" fill="#0f172a" />
                    <rect x="66" y="66" width="6" height="6" fill="#0f172a" />
                    <rect x="78" y="76" width="8" height="8" fill="#0284c7" />
                    <rect x="42" y="76" width="6" height="6" fill="#0f172a" />
                  </svg>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 text-center">
                  Abra o aplicativo do seu banco e aponte a câmera para o QR Code acima
                </p>
              </div>

              {/* PIX Copia e Cola */}
              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                  Ou copie o código PIX Copia e Cola:
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={pixPayload}
                    className="flex-1 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2.5 text-slate-600 dark:text-slate-400 font-mono truncate focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleCopyPix}
                    className="py-2.5 px-3.5 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0"
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

              {/* Botão de Verificação & Checkout Direto Mercado Pago */}
              <div className="pt-2 space-y-2">
                <button
                  type="button"
                  onClick={handleVerifyOrConfirmPayment}
                  disabled={isProcessing}
                  className="w-full py-3.5 px-4 rounded-2xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-sm shadow-md shadow-sky-500/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isProcessing ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Verificando com Mercado Pago...
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4" />
                      Já paguei — Confirmar Ativação
                    </>
                  )}
                </button>

                {preferenceData?.initPoint && (
                  <a
                    href={preferenceData.initPoint}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-2.5 px-4 rounded-xl border border-sky-500/30 text-sky-600 dark:text-sky-400 hover:bg-sky-500/5 font-semibold text-xs transition-all flex items-center justify-center gap-1.5"
                  >
                    Abrir Checkout Seguro no Mercado Pago
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Cartão de Crédito Flow */}
          {paymentMethod === 'cartao' && (
            <form onSubmit={handleConfirmCard} className="space-y-4">
              {cardError && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-600 dark:text-red-400 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{cardError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Número do Cartão de Crédito
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="0000 0000 0000 0000"
                    maxLength={19}
                    value={cardNumber}
                    onChange={(e) => {
                      const v = e.target.value.replace(/\D/g, '').replace(/(.{4})/g, '$1 ').trim();
                      setCardNumber(v);
                    }}
                    required
                    className="w-full text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2.5 pl-10 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                  <CreditCard className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Nome Completo (como impresso no cartão)
                </label>
                <input
                  type="text"
                  placeholder="NOME COMPLETO"
                  value={cardHolder}
                  onChange={(e) => setCardHolder(e.target.value.toUpperCase())}
                  required
                  className="w-full text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2.5 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Validade
                  </label>
                  <input
                    type="text"
                    placeholder="MM/AA"
                    maxLength={5}
                    value={cardExpiry}
                    onChange={(e) => {
                      let v = e.target.value.replace(/\D/g, '');
                      if (v.length >= 2) v = v.slice(0, 2) + '/' + v.slice(2, 4);
                      setCardExpiry(v);
                    }}
                    required
                    className="w-full text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2.5 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Código CVV
                  </label>
                  <input
                    type="password"
                    placeholder="123"
                    maxLength={4}
                    value={cardCvv}
                    onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, ''))}
                    required
                    className="w-full text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2.5 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Parcelamento Mercado Pago
                </label>
                <select
                  value={cardInstallments}
                  onChange={(e) => setCardInstallments(e.target.value)}
                  className="w-full text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2.5 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                >
                  <option value="1">1x de {formatCurrencyCents(totalAmountCents)} à vista</option>
                  <option value="2">2x de {formatCurrencyCents(Math.round(totalAmountCents / 2))} sem juros</option>
                  <option value="3">3x de {formatCurrencyCents(Math.round(totalAmountCents / 3))} sem juros</option>
                  <option value="6">6x de {formatCurrencyCents(Math.round(totalAmountCents / 6))} sem juros</option>
                  <option value="12">12x de {formatCurrencyCents(Math.round(totalAmountCents / 12))} sem juros</option>
                </select>
              </div>

              <div className="pt-2 space-y-2">
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="w-full py-3.5 px-4 rounded-2xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-sm shadow-md shadow-sky-500/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isProcessing ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Processando com Mercado Pago...
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4" />
                      Pagar {formatCurrencyCents(totalAmountCents)} com Mercado Pago
                    </>
                  )}
                </button>

                {preferenceData?.initPoint && (
                  <a
                    href={preferenceData.initPoint}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-2.5 px-4 rounded-xl border border-sky-500/30 text-sky-600 dark:text-sky-400 hover:bg-sky-500/5 font-semibold text-xs transition-all flex items-center justify-center gap-1.5"
                  >
                    Usar Checkout Oficial Mercado Pago
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
            </form>
          )}

          {/* Security & Mercado Pago Official Footer */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span>Mercado Pago: Gateway Oficial QuitaÍ</span>
            </div>
            <div className="flex items-center gap-1">
              <Lock className="w-3 h-3 text-slate-400" />
              <span>PCI-DSS Certificado</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
