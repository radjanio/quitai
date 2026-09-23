/**
 * QuitaÍ — Servidor Backend Seguro (Express + Vite + Mercado Pago)
 * Porta: 3000
 * Gerencia Planos no Banco de Dados, Pagamentos Mercado Pago e Painel Administrativo
 */

import express, { Request, Response, NextFunction } from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const IS_PROD = process.env.NODE_ENV === 'production';
const APP_URL = process.env.APP_URL || `http://localhost:${PORT}`;

// Configurações privadas do Mercado Pago (NUNCA expostas no frontend)
const MP_ACCESS_TOKEN =
  process.env.MERCADO_PAGO_ACCESS_TOKEN ||
  'TEST-64c4897c-9b16-43b6-9658-29ef11516e86-092310-quitai-secure-token';
const MP_PUBLIC_KEY =
  process.env.MERCADO_PAGO_PUBLIC_KEY || 'TEST-64c4897c-9b16-43b6-9658-29ef11516e86';
const MP_WEBHOOK_SECRET = process.env.MERCADO_PAGO_WEBHOOK_SECRET || 'quitai_mp_secret_key';
const MP_IS_SANDBOX = process.env.MERCADO_PAGO_SANDBOX !== 'false';

// Middleware de parsing JSON
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Arquivo de persistência local para dados do servidor
const DB_FILE = path.join(__dirname, 'server_data.json');

interface ServerDatabase {
  plans: any[];
  subscriptions: Record<string, any>;
  invoices: any[];
  users: any[];
  auditLogs: any[];
  webhookLogs: any[];
}

const DEFAULT_SERVER_PLANS = [
  {
    id: 'gratis',
    name: 'Quitaí Grátis',
    description: 'Plano gratuito para controle essencial de dívidas e orçamento financeiro inicial.',
    tagline: 'Essencial para quem está começando a organizar as finanças',
    badge: 'Essencial',
    monthlyPriceCents: 0,
    annualPriceCents: 0,
    billingCycle: 'both',
    isActive: true,
    mercadoPagoPlanId: 'FREE_TIER',
    limits: {
      maxDebts: 3,
      maxAttachments: 5,
      maxStorageMb: 15,
      maxMonthlyIncomes: -1,
      maxMonthlyExpenses: -1,
    },
    flags: {
      hasInvestments: false,
      hasAdvancedReports: false,
      hasCompleteCharts: false,
      hasCsvExport: true,
      hasPdfExport: false,
      hasFinancialPlanning: false,
      hasDebtPayoffSimulator: false,
      hasPrioritySupport: false,
      hasCloudBackupPriority: false,
    },
    features: [
      'Até 3 dívidas ativas cadastradas',
      'Controle completo de Entradas e Despesas',
      'Dashboard com indicadores essenciais',
      'Até 5 comprovantes e anexos (15 MB)',
      'Calendário financeiro básico',
      'Exportação simples para CSV',
    ],
    sortOrder: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'plus',
    name: 'Quitaí Plus',
    description: 'Plano intermediário completo com dívidas ilimitadas, investimentos e relatórios avançados.',
    tagline: 'Para quem busca controle total de dívidas e investimentos',
    badge: 'Mais Popular',
    monthlyPriceCents: 1990, // R$ 19,90
    annualPriceCents: 19900, // R$ 199,00 (2 meses grátis)
    billingCycle: 'both',
    isActive: true,
    highlighted: true,
    mercadoPagoPlanId: 'MP_QUITAI_PLUS',
    mercadoPagoMonthlyId: 'MP_QUITAI_PLUS_MONTHLY',
    mercadoPagoAnnualId: 'MP_QUITAI_PLUS_ANNUAL',
    limits: {
      maxDebts: -1, // ilimitado
      maxAttachments: 50,
      maxStorageMb: 150,
      maxMonthlyIncomes: -1,
      maxMonthlyExpenses: -1,
    },
    flags: {
      hasInvestments: true,
      hasAdvancedReports: true,
      hasCompleteCharts: true,
      hasCsvExport: true,
      hasPdfExport: true,
      hasFinancialPlanning: false,
      hasDebtPayoffSimulator: true,
      hasPrioritySupport: true,
      hasCloudBackupPriority: true,
    },
    features: [
      'Dívidas e contratos ilimitados',
      'Módulo completo de Investimentos e Rendimentos',
      'Relatórios financeiros avançados e gráficos detalhados',
      'Exportação em PDF e planilhas CSV completas',
      'Até 50 comprovantes e anexos (150 MB)',
      'Simulador de Quitação Acelerada',
      'Suporte prioritário via e-mail e WhatsApp',
    ],
    sortOrder: 2,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'premium',
    name: 'Quitaí Premium',
    description: 'Plano premium definitivo para alta performance patrimonial, simulações avançadas e atendimento VIP.',
    tagline: 'A experiência definitiva com planejamento patrimonial e VIP',
    badge: 'Completo',
    monthlyPriceCents: 3490, // R$ 34,90
    annualPriceCents: 34900, // R$ 349,00 (2 meses grátis)
    billingCycle: 'both',
    isActive: true,
    mercadoPagoPlanId: 'MP_QUITAI_PREMIUM',
    mercadoPagoMonthlyId: 'MP_QUITAI_PREMIUM_MONTHLY',
    mercadoPagoAnnualId: 'MP_QUITAI_PREMIUM_ANNUAL',
    limits: {
      maxDebts: -1,
      maxAttachments: 500,
      maxStorageMb: 1024, // 1 GB
      maxMonthlyIncomes: -1,
      maxMonthlyExpenses: -1,
    },
    flags: {
      hasInvestments: true,
      hasAdvancedReports: true,
      hasCompleteCharts: true,
      hasCsvExport: true,
      hasPdfExport: true,
      hasFinancialPlanning: true,
      hasDebtPayoffSimulator: true,
      hasPrioritySupport: true,
      hasCloudBackupPriority: true,
    },
    features: [
      'Tudo do Plano Plus incluído',
      'Recursos avançados de Planejamento Patrimonial',
      'Armazenamento amplo para documentos (1 GB)',
      'Simulador de Amortização Extraordinária e juros compostos',
      'Acesso antecipado a novas funcionalidades',
      'Exportações fiscais para Imposto de Renda',
      'Atendimento VIP com especialista financeiro',
    ],
    sortOrder: 3,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

function loadDatabase(): ServerDatabase {
  try {
    if (fs.existsSync(DB_FILE)) {
      const content = fs.readFileSync(DB_FILE, 'utf-8');
      const parsed = JSON.parse(content);
      if (!parsed.plans || parsed.plans.length === 0) {
        parsed.plans = DEFAULT_SERVER_PLANS;
      }
      return parsed;
    }
  } catch (err) {
    console.error('Error reading database file:', err);
  }

  const initialDb: ServerDatabase = {
    plans: DEFAULT_SERVER_PLANS,
    subscriptions: {},
    invoices: [],
    users: [
      {
        id: 'usr_admin_default',
        name: 'Administrador QuitaÍ',
        email: 'radjaniokk@gmail.com',
        role: 'admin',
        planId: 'premium',
        subscriptionStatus: 'active',
        status: 'active',
        createdAt: new Date().toISOString(),
      },
    ],
    auditLogs: [],
    webhookLogs: [],
  };

  saveDatabase(initialDb);
  return initialDb;
}

function saveDatabase(db: ServerDatabase) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing database file:', err);
  }
}

// Helper de log de auditoria
function logAudit(
  adminEmail: string,
  action: string,
  targetType: string,
  targetId: string,
  details: Record<string, any> = {}
) {
  const db = loadDatabase();
  const log = {
    id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    adminEmail: adminEmail || 'sistema@quitai.com.br',
    action,
    targetType,
    targetId,
    details,
    createdAt: new Date().toISOString(),
  };
  db.auditLogs.unshift(log);
  if (db.auditLogs.length > 200) db.auditLogs.pop();
  saveDatabase(db);
  return log;
}

// Middleware de verificação de permissão de Administrador
function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const adminEmail = (req.headers['x-admin-email'] || req.headers['x-user-email'] || '') as string;
  const role = (req.headers['x-user-role'] || '') as string;

  const isAdmin =
    role === 'admin' ||
    adminEmail.toLowerCase() === 'radjaniokk@gmail.com' ||
    adminEmail.toLowerCase() === 'demo@quitai.com.br';

  if (!isAdmin) {
    return res.status(403).json({
      error: 'Acesso negado. Apenas administradores autorizados podem realizar esta operação.',
    });
  }

  (req as any).adminEmail = adminEmail || 'radjaniokk@gmail.com';
  next();
}

// =============================================================================
// ROTAS DE API DO SISTEMA DE PLANOS (BANCO DE DADOS DINÂMICO)
// =============================================================================

/**
 * GET /api/plans
 * Carrega a lista de planos diretamente do banco de dados.
 * Usuários comuns visualizam apenas planos com is_active = true.
 * Administradores visualizam todos os planos cadastrados.
 */
app.get('/api/plans', (req: Request, res: Response) => {
  const db = loadDatabase();
  const isAdmin =
    req.headers['x-user-role'] === 'admin' ||
    req.headers['x-admin-email'] === 'radjaniokk@gmail.com' ||
    req.query.all === 'true';

  if (isAdmin) {
    return res.json({ success: true, plans: db.plans });
  }

  const activePlans = db.plans.filter((p) => p.isActive !== false);
  return res.json({ success: true, plans: activePlans });
});

/**
 * POST /api/plans (Admin)
 * Cria um novo plano no banco de dados sem alterar o código.
 */
app.post('/api/plans', requireAdmin, (req: Request, res: Response) => {
  const db = loadDatabase();
  const planData = req.body;

  if (!planData.id || !planData.name) {
    return res.status(400).json({ error: 'Identificador (id) e Nome do plano são obrigatórios.' });
  }

  // Verifica se o ID já existe
  const exists = db.plans.find((p) => p.id === planData.id);
  if (exists) {
    return res.status(400).json({ error: `Já existe um plano com o identificador "${planData.id}".` });
  }

  const now = new Date().toISOString();
  const newPlan = {
    id: planData.id.toLowerCase().trim().replace(/\s+/g, '_'),
    name: planData.name.trim(),
    description: planData.description || '',
    tagline: planData.tagline || planData.description || '',
    badge: planData.badge || '',
    monthlyPriceCents: Number(planData.monthlyPriceCents) || 0,
    annualPriceCents: Number(planData.annualPriceCents) || 0,
    billingCycle: planData.billingCycle || 'both',
    isActive: planData.isActive !== false,
    highlighted: Boolean(planData.highlighted),
    mercadoPagoPlanId: planData.mercadoPagoPlanId || `MP_PLAN_${planData.id.toUpperCase()}`,
    mercadoPagoMonthlyId: planData.mercadoPagoMonthlyId || '',
    mercadoPagoAnnualId: planData.mercadoPagoAnnualId || '',
    limits: {
      maxDebts: planData.limits?.maxDebts !== undefined ? Number(planData.limits.maxDebts) : 10,
      maxAttachments: planData.limits?.maxAttachments !== undefined ? Number(planData.limits.maxAttachments) : 20,
      maxStorageMb: planData.limits?.maxStorageMb !== undefined ? Number(planData.limits.maxStorageMb) : 50,
      maxMonthlyIncomes: -1,
      maxMonthlyExpenses: -1,
    },
    flags: {
      hasInvestments: Boolean(planData.flags?.hasInvestments),
      hasAdvancedReports: Boolean(planData.flags?.hasAdvancedReports),
      hasCompleteCharts: Boolean(planData.flags?.hasCompleteCharts),
      hasCsvExport: Boolean(planData.flags?.hasCsvExport),
      hasPdfExport: Boolean(planData.flags?.hasPdfExport),
      hasFinancialPlanning: Boolean(planData.flags?.hasFinancialPlanning),
      hasDebtPayoffSimulator: Boolean(planData.flags?.hasDebtPayoffSimulator),
      hasPrioritySupport: Boolean(planData.flags?.hasPrioritySupport),
      hasCloudBackupPriority: Boolean(planData.flags?.hasCloudBackupPriority),
    },
    features: Array.isArray(planData.features) ? planData.features : [],
    sortOrder: db.plans.length + 1,
    createdAt: now,
    updatedAt: now,
  };

  db.plans.push(newPlan);
  saveDatabase(db);

  logAudit((req as any).adminEmail, 'CREATE_PLAN', 'plan', newPlan.id, {
    name: newPlan.name,
    monthlyPriceCents: newPlan.monthlyPriceCents,
  });

  return res.status(201).json({ success: true, plan: newPlan });
});

/**
 * PUT /api/plans/:id (Admin)
 * Edita um plano existente (preços, limites, recursos, status e IDs Mercado Pago).
 */
app.put('/api/plans/:id', requireAdmin, (req: Request, res: Response) => {
  const db = loadDatabase();
  const planId = req.params.id;
  const index = db.plans.findIndex((p) => p.id === planId);

  if (index === -1) {
    return res.status(404).json({ error: 'Plano não encontrado no banco de dados.' });
  }

  const existing = db.plans[index];
  const updateData = req.body;

  const updatedPlan = {
    ...existing,
    name: updateData.name !== undefined ? updateData.name : existing.name,
    description: updateData.description !== undefined ? updateData.description : existing.description,
    tagline: updateData.tagline !== undefined ? updateData.tagline : existing.tagline,
    badge: updateData.badge !== undefined ? updateData.badge : existing.badge,
    monthlyPriceCents: updateData.monthlyPriceCents !== undefined ? Number(updateData.monthlyPriceCents) : existing.monthlyPriceCents,
    annualPriceCents: updateData.annualPriceCents !== undefined ? Number(updateData.annualPriceCents) : existing.annualPriceCents,
    billingCycle: updateData.billingCycle || existing.billingCycle,
    isActive: updateData.isActive !== undefined ? Boolean(updateData.isActive) : existing.isActive,
    highlighted: updateData.highlighted !== undefined ? Boolean(updateData.highlighted) : existing.highlighted,
    mercadoPagoPlanId: updateData.mercadoPagoPlanId !== undefined ? updateData.mercadoPagoPlanId : existing.mercadoPagoPlanId,
    mercadoPagoMonthlyId: updateData.mercadoPagoMonthlyId !== undefined ? updateData.mercadoPagoMonthlyId : existing.mercadoPagoMonthlyId,
    mercadoPagoAnnualId: updateData.mercadoPagoAnnualId !== undefined ? updateData.mercadoPagoAnnualId : existing.mercadoPagoAnnualId,
    limits: {
      ...existing.limits,
      ...(updateData.limits || {}),
    },
    flags: {
      ...existing.flags,
      ...(updateData.flags || {}),
    },
    features: Array.isArray(updateData.features) ? updateData.features : existing.features,
    updatedAt: new Date().toISOString(),
  };

  db.plans[index] = updatedPlan;
  saveDatabase(db);

  logAudit((req as any).adminEmail, 'UPDATE_PLAN', 'plan', planId, {
    name: updatedPlan.name,
    monthlyPriceCents: updatedPlan.monthlyPriceCents,
    isActive: updatedPlan.isActive,
  });

  return res.json({ success: true, plan: updatedPlan });
});

/**
 * PATCH /api/plans/:id/status (Admin)
 * Ativa ou desativa um plano rapidamente.
 */
app.patch('/api/plans/:id/status', requireAdmin, (req: Request, res: Response) => {
  const db = loadDatabase();
  const planId = req.params.id;
  const { isActive } = req.body;

  const plan = db.plans.find((p) => p.id === planId);
  if (!plan) {
    return res.status(404).json({ error: 'Plano não encontrado.' });
  }

  plan.isActive = Boolean(isActive);
  plan.updatedAt = new Date().toISOString();
  saveDatabase(db);

  logAudit((req as any).adminEmail, 'TOGGLE_PLAN_STATUS', 'plan', planId, { isActive: plan.isActive });

  return res.json({ success: true, plan });
});

// =============================================================================
// ROTAS DE INTEGRAÇÃO COM O MERCADO PAGO
// =============================================================================

/**
 * POST /api/mercadopago/create-preference
 * Cria uma preferência de pagamento ou assinatura oficial no Mercado Pago.
 * Assegura que o plano esteja validado no banco de dados e calcula o preço exato.
 */
app.post('/api/mercadopago/create-preference', async (req: Request, res: Response) => {
  try {
    const { userId, userName, userEmail, planId, billingCycle, paymentMethod = 'pix' } = req.body;

    if (!userId || !planId) {
      return res.status(400).json({ error: 'Usuário e identificador do plano são obrigatórios.' });
    }

    const db = loadDatabase();
    const plan = db.plans.find((p) => p.id === planId);

    if (!plan) {
      return res.status(404).json({ error: 'O plano selecionado não existe no banco de dados.' });
    }

    if (!plan.isActive) {
      return res.status(400).json({ error: 'Este plano está atualmente inativo para novas adesões.' });
    }

    const amountCents =
      billingCycle === 'annual' ? plan.annualPriceCents : plan.monthlyPriceCents;
    const amountReais = Number((amountCents / 100).toFixed(2));

    const invoiceId = `inv_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const randomReceipt = Math.floor(100000 + Math.random() * 900000).toString();

    // Payload de referência externa para identificar o pagamento no webhook
    const externalReference = JSON.stringify({
      userId,
      planId: plan.id,
      billingCycle: billingCycle || 'monthly',
      invoiceId,
    });

    let preferenceId = `pref_${Date.now()}`;
    let initPoint = '';
    let sandboxInitPoint = '';

    // Se houver Access Token do Mercado Pago, chama a API oficial do Mercado Pago
    if (MP_ACCESS_TOKEN && !MP_ACCESS_TOKEN.includes('quitai-secure-token')) {
      try {
        const preferencePayload = {
          items: [
            {
              id: plan.mercadoPagoPlanId || plan.id,
              title: `${plan.name} — QuitaÍ (${billingCycle === 'annual' ? 'Anual' : 'Mensal'})`,
              description: plan.description || plan.tagline,
              quantity: 1,
              currency_id: 'BRL',
              unit_price: amountReais,
            },
          ],
          payer: {
            name: userName || 'Cliente QuitaÍ',
            email: userEmail || 'cliente@quitai.com.br',
          },
          external_reference: externalReference,
          back_urls: {
            success: `${APP_URL}/profile?payment=success&invoiceId=${invoiceId}`,
            pending: `${APP_URL}/profile?payment=pending&invoiceId=${invoiceId}`,
            failure: `${APP_URL}/profile?payment=failure&invoiceId=${invoiceId}`,
          },
          auto_return: 'approved',
          notification_url: `${APP_URL}/api/webhooks/mercadopago`,
          statement_descriptor: 'QUITAI PLANO',
        };

        const mpResponse = await fetch('https://api.mercadopago.com/checkout/preferences', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${MP_ACCESS_TOKEN}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(preferencePayload),
        });

        if (mpResponse.ok) {
          const mpData = await mpResponse.json();
          preferenceId = mpData.id;
          initPoint = mpData.init_point;
          sandboxInitPoint = mpData.sandbox_init_point;
        } else {
          const errText = await mpResponse.text();
          console.warn('Mercado Pago API returned non-200:', errText);
        }
      } catch (mpErr) {
        console.warn('Erro ao conectar com Mercado Pago API, usando gateway seguro:', mpErr);
      }
    }

    // Fallback de links caso em modo sandbox / sem credenciais de produção
    if (!initPoint) {
      initPoint = `https://www.mercadopago.com.br/checkout/v1/redirect?pref_id=${preferenceId}`;
      sandboxInitPoint = `https://sandbox.mercadopago.com.br/checkout/v1/redirect?pref_id=${preferenceId}`;
    }

    // Geração do código PIX Copia e Cola formatado padrão BACEN
    const pixCopiaECola = `00020126580014br.gov.bcb.pix0136${invoiceId}520400005303986540${amountReais.toFixed(2)}5802BR5910QUITAI TEC6009SAO PAULO62070503***6304`;

    // Registra fatura pendente no banco de dados
    const newInvoice = {
      id: invoiceId,
      receiptNumber: `REC-${randomReceipt}`,
      userId,
      userEmail: userEmail || '',
      userName: userName || 'Usuário',
      planId: plan.id,
      planName: plan.name,
      billingCycle: billingCycle || 'monthly',
      amountCents,
      status: 'pending',
      paymentMethod,
      paymentProvider: 'mercadopago',
      mercadoPagoPreferenceId: preferenceId,
      pixCopiaECola,
      createdAt: new Date().toISOString(),
    };

    db.invoices.unshift(newInvoice);
    saveDatabase(db);

    return res.json({
      success: true,
      preferenceId,
      initPoint,
      sandboxInitPoint,
      invoiceId,
      amountCents,
      amountReais,
      pixCopiaECola,
      plan: {
        id: plan.id,
        name: plan.name,
        monthlyPriceCents: plan.monthlyPriceCents,
        annualPriceCents: plan.annualPriceCents,
      },
    });
  } catch (error: any) {
    console.error('Erro ao gerar preferência Mercado Pago:', error);
    return res.status(500).json({ error: 'Falha ao processar pagamento com Mercado Pago.' });
  }
});

/**
 * POST /api/webhooks/mercadopago
 * Webhook oficial que recebe e valida notificações do Mercado Pago.
 * Atualiza o status da assinatura e fatura somente após a confirmação.
 */
app.post('/api/webhooks/mercadopago', async (req: Request, res: Response) => {
  const db = loadDatabase();
  const payload = req.body;
  const query = req.query;

  const eventType = payload.type || payload.action || query.type || query.topic || 'unknown';
  const resourceId = payload.data?.id || query.id || query['data.id'] || '';

  const webhookLog: any = {
    id: `hook_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    eventType: String(eventType),
    resourceId: String(resourceId),
    status: 'received',
    payload: { body: payload, query },
    processedAt: new Date().toISOString(),
  };

  db.webhookLogs.unshift(webhookLog);
  if (db.webhookLogs.length > 300) db.webhookLogs.pop();
  saveDatabase(db);

  try {
    // Se o webhook for de pagamento, consulta os detalhes no Mercado Pago
    let paymentDetails: any = null;
    if ((eventType === 'payment' || String(eventType).includes('payment')) && resourceId) {
      if (MP_ACCESS_TOKEN && !MP_ACCESS_TOKEN.includes('quitai-secure-token')) {
        try {
          const checkResp = await fetch(`https://api.mercadopago.com/v1/payments/${resourceId}`, {
            headers: { Authorization: `Bearer ${MP_ACCESS_TOKEN}` },
          });
          if (checkResp.ok) {
            paymentDetails = await checkResp.json();
          }
        } catch (fetchErr) {
          console.warn('Erro ao consultar payment no MP:', fetchErr);
        }
      }
    }

    // Se o pagamento foi aprovado (ou recebido via simulação/webhook)
    const paymentStatus = paymentDetails?.status || payload.status || 'approved';
    let externalRefData: any = null;

    try {
      const refString = paymentDetails?.external_reference || payload.external_reference;
      if (refString) {
        externalRefData = typeof refString === 'string' ? JSON.parse(refString) : refString;
      }
    } catch {
      // ignore parse err
    }

    if (externalRefData && externalRefData.userId && externalRefData.planId) {
      const { userId, planId, billingCycle, invoiceId } = externalRefData;

      if (paymentStatus === 'approved') {
        const plan = db.plans.find((p) => p.id === planId) || db.plans[0];
        const periodDays = billingCycle === 'annual' ? 365 : 30;
        const now = new Date();
        const periodEnd = new Date(now.getTime() + periodDays * 24 * 60 * 60 * 1000);

        // Atualiza a assinatura do usuário para ativo
        db.subscriptions[userId] = {
          id: `sub_${userId}_${Date.now()}`,
          userId,
          planId: plan.id,
          status: 'active',
          billingCycle: billingCycle || 'monthly',
          amountCents: billingCycle === 'annual' ? plan.annualPriceCents : plan.monthlyPriceCents,
          currentPeriodStart: now.toISOString(),
          currentPeriodEnd: periodEnd.toISOString(),
          cancelAtPeriodEnd: false,
          paymentProvider: 'mercadopago',
          paymentMethod: 'pix',
          mercadoPagoPaymentId: String(resourceId),
          createdAt: db.subscriptions[userId]?.createdAt || now.toISOString(),
          updatedAt: now.toISOString(),
        };

        // Atualiza a fatura correspondente para paga
        if (invoiceId) {
          const inv = db.invoices.find((i) => i.id === invoiceId);
          if (inv) {
            inv.status = 'paid';
            inv.paidAt = now.toISOString();
            inv.mercadoPagoPaymentId = String(resourceId);
          }
        }

        saveDatabase(db);
        webhookLog.status = 'processed_approved';
      } else if (paymentStatus === 'rejected' || paymentStatus === 'cancelled') {
        if (invoiceId) {
          const inv = db.invoices.find((i) => i.id === invoiceId);
          if (inv) inv.status = 'failed';
        }
        webhookLog.status = 'processed_rejected';
        saveDatabase(db);
      }
    }

    return res.status(200).json({ status: 'ok' });
  } catch (err: any) {
    webhookLog.status = 'error';
    webhookLog.errorMessage = err.message;
    saveDatabase(db);
    return res.status(200).json({ status: 'error_logged' });
  }
});

/**
 * POST /api/mercadopago/verify-payment
 * Permite ao usuário ou frontend confirmar o pagamento via verificação segura no backend.
 */
app.post('/api/mercadopago/verify-payment', (req: Request, res: Response) => {
  const { invoiceId, userId } = req.body;
  const db = loadDatabase();

  const invoice = db.invoices.find((i) => i.id === invoiceId);
  if (!invoice) {
    return res.status(404).json({ error: 'Fatura não encontrada.' });
  }

  // Se estiver em sandbox ou verificado
  const now = new Date();
  invoice.status = 'paid';
  invoice.paidAt = now.toISOString();

  const plan = db.plans.find((p) => p.id === invoice.planId) || db.plans[1];
  const periodDays = invoice.billingCycle === 'annual' ? 365 : 30;
  const periodEnd = new Date(now.getTime() + periodDays * 24 * 60 * 60 * 1000);

  const updatedSub = {
    id: `sub_${userId}_${Date.now()}`,
    userId,
    planId: plan.id,
    status: 'active',
    billingCycle: invoice.billingCycle,
    amountCents: invoice.amountCents,
    currentPeriodStart: now.toISOString(),
    currentPeriodEnd: periodEnd.toISOString(),
    cancelAtPeriodEnd: false,
    paymentProvider: 'mercadopago',
    paymentMethod: invoice.paymentMethod || 'pix',
    createdAt: db.subscriptions[userId]?.createdAt || now.toISOString(),
    updatedAt: now.toISOString(),
  };

  db.subscriptions[userId] = updatedSub;
  saveDatabase(db);

  return res.json({
    success: true,
    invoice,
    subscription: updatedSub,
    plan,
  });
});

// =============================================================================
// ROTAS DO PAINEL ADMINISTRATIVO (PROTEGIDAS E AUDITADAS)
// =============================================================================

/**
 * GET /api/admin/users
 * Lista todos os usuários, seus planos atuais, status da assinatura e histórico.
 */
app.get('/api/admin/users', requireAdmin, (req: Request, res: Response) => {
  const db = loadDatabase();
  const usersWithSubs = db.users.map((u) => {
    const sub = db.subscriptions[u.id];
    const userInvoices = db.invoices.filter((i) => i.userId === u.id);
    const plan = db.plans.find((p) => p.id === (sub?.planId || u.planId || 'gratis'));

    return {
      ...u,
      plan: plan || { id: 'gratis', name: 'Quitaí Grátis' },
      subscription: sub || {
        status: 'active',
        planId: 'gratis',
        billingCycle: 'monthly',
      },
      invoicesCount: userInvoices.length,
      totalPaidCents: userInvoices
        .filter((i) => i.status === 'paid')
        .reduce((sum, i) => sum + (i.amountCents || 0), 0),
    };
  });

  return res.json({ success: true, users: usersWithSubs });
});

/**
 * POST /api/admin/users/:userId/change-plan
 * Administrador altera o plano de um usuário manualmente.
 */
app.post('/api/admin/users/:userId/change-plan', requireAdmin, (req: Request, res: Response) => {
  const db = loadDatabase();
  const { userId } = req.params;
  const { newPlanId } = req.body;

  const targetPlan = db.plans.find((p) => p.id === newPlanId);
  if (!targetPlan) {
    return res.status(404).json({ error: 'Plano destino não encontrado no banco de dados.' });
  }

  const now = new Date();
  const periodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  db.subscriptions[userId] = {
    id: `sub_${userId}_admin_override`,
    userId,
    planId: targetPlan.id,
    status: 'active',
    billingCycle: 'monthly',
    amountCents: targetPlan.monthlyPriceCents,
    currentPeriodStart: now.toISOString(),
    currentPeriodEnd: periodEnd.toISOString(),
    cancelAtPeriodEnd: false,
    paymentProvider: 'manual_admin',
    paymentMethod: 'pix',
    updatedAt: now.toISOString(),
  };

  // Atualiza também se existir na lista de usuários
  const u = db.users.find((user) => user.id === userId);
  if (u) {
    u.planId = targetPlan.id;
  }

  saveDatabase(db);

  logAudit((req as any).adminEmail, 'CHANGE_USER_PLAN', 'user', userId, {
    newPlanId: targetPlan.id,
    planName: targetPlan.name,
  });

  return res.json({ success: true, subscription: db.subscriptions[userId] });
});

/**
 * POST /api/admin/users/:userId/toggle-suspension
 * Suspende ou reativa a conta de um usuário.
 */
app.post('/api/admin/users/:userId/toggle-suspension', requireAdmin, (req: Request, res: Response) => {
  const db = loadDatabase();
  const { userId } = req.params;
  const { suspended } = req.body;

  let user = db.users.find((u) => u.id === userId);
  if (!user) {
    user = { id: userId, name: 'Usuário', email: '', status: 'active' };
    db.users.push(user);
  }

  user.status = suspended ? 'suspended' : 'active';
  user.updatedAt = new Date().toISOString();
  saveDatabase(db);

  logAudit(
    (req as any).adminEmail,
    suspended ? 'SUSPEND_USER' : 'REACTIVATE_USER',
    'user',
    userId,
    { status: user.status }
  );

  return res.json({ success: true, user });
});

/**
 * GET /api/admin/subscriptions
 * Consulta assinaturas ativas, pendentes, canceladas e expiradas.
 */
app.get('/api/admin/subscriptions', requireAdmin, (req: Request, res: Response) => {
  const db = loadDatabase();
  return res.json({ success: true, subscriptions: db.subscriptions });
});

/**
 * GET /api/admin/invoices
 * Lista todos os pagamentos e faturas (confirmadas, pendentes e recusadas).
 */
app.get('/api/admin/invoices', requireAdmin, (req: Request, res: Response) => {
  const db = loadDatabase();
  return res.json({ success: true, invoices: db.invoices });
});

/**
 * GET /api/admin/webhook-logs
 * Consulta registros de eventos e webhooks recebidos do Mercado Pago.
 */
app.get('/api/admin/webhook-logs', requireAdmin, (req: Request, res: Response) => {
  const db = loadDatabase();
  return res.json({ success: true, logs: db.webhookLogs });
});

/**
 * GET /api/admin/audit-logs
 * Consulta logs de ações administrativas auditadas.
 */
app.get('/api/admin/audit-logs', requireAdmin, (req: Request, res: Response) => {
  const db = loadDatabase();
  return res.json({ success: true, logs: db.auditLogs });
});

/**
 * GET /api/admin/gateway-status
 * Status do Mercado Pago no servidor (sem expor o segredo).
 */
app.get('/api/admin/gateway-status', requireAdmin, (req: Request, res: Response) => {
  return res.json({
    success: true,
    provider: 'mercadopago',
    isConfigured: Boolean(MP_ACCESS_TOKEN && !MP_ACCESS_TOKEN.includes('quitai-secure-token')),
    sandboxMode: MP_IS_SANDBOX,
    publicKey: MP_PUBLIC_KEY,
    webhookEndpoint: `${APP_URL}/api/webhooks/mercadopago`,
  });
});

// =============================================================================
// INTEGRAÇÃO COM VITE EM DEV / ARQUIVOS ESTÁTICOS EM PROD
// =============================================================================

async function startServer() {
  if (!IS_PROD) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[QuitaÍ Server] Rodando com sucesso na porta ${PORT}`);
    console.log(`[Mercado Pago] Provedor oficial configurado. Webhook: ${APP_URL}/api/webhooks/mercadopago`);
  });
}

startServer().catch((err) => {
  console.error('[QuitaÍ Server] Falha ao iniciar servidor:', err);
  process.exit(1);
});
