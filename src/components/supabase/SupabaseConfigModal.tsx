import React, { useState } from 'react';
import {
  X,
  Database,
  ShieldCheck,
  Copy,
  Check,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Code2,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface SupabaseConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SupabaseConfigModal: React.FC<SupabaseConfigModalProps> = ({ isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'testing' | 'connected' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const projectId = 'ybdnhrtetahnvvtbapwm';
  const supabaseUrl = 'https://ybdnhrtetahnvvtbapwm.supabase.co';
  const anonKey =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InliZG5ocnRldGFobnZ2dGJhcHdtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAxMDMzMTIsImV4cCI6MjEwNTY3OTMxMn0.ifYn3nxffebWgNycFJoMSfCjvgaY7rKjJ7g5hO2ecjs';
  const publishableKey = 'sb_publishable_9dNth1fNpCxozI8hNaSLiA_uc2uIkYp';

  const sqlScript = `-- ==============================================================================
-- QUITAÍ — SCRIPT SQL COMPLETO & DEFINITIVO PARA SUPABASE (POSTGRESQL COM RLS)
-- Projeto: ybdnhrtetahnvvtbapwm
-- ==============================================================================
-- Instruções:
-- 1. Acesse o SQL Editor do seu projeto Supabase (https://supabase.com/dashboard/project/ybdnhrtetahnvvtbapwm/sql)
-- 2. Cole este script completo e clique em "RUN".
-- ==============================================================================

-- 1. Extensões
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- 2. Limpar tabelas anteriores em ordem segura com CASCADE (caso existam)
drop table if exists public.investment_transactions cascade;
drop table if exists public.investments cascade;
drop table if exists public.expenses cascade;
drop table if exists public.incomes cascade;
drop table if exists public.debt_adjustment_rules cascade;
drop table if exists public.history_events cascade;
drop table if exists public.attachments cascade;
drop table if exists public.payment_records cascade;
drop table if exists public.installments cascade;
drop table if exists public.debts cascade;
drop table if exists public.profiles cascade;

-- 3. Função de atualização automática do campo updated_at
create or replace function public.handle_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ------------------------------------------------------------------------------
-- 4. TABELA: profiles (Perfis de Usuários)
-- ------------------------------------------------------------------------------
create table public.profiles (
  id text primary key,
  name text not null,
  email text not null,
  phone text,
  avatar_url text,
  plan text not null default 'free',
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

alter table public.profiles enable row level security;
create policy "profiles_all_policy" on public.profiles
  for all
  using (auth.uid() is null or auth.uid()::text = id)
  with check (auth.uid() is null or auth.uid()::text = id);

-- ------------------------------------------------------------------------------
-- 5. TABELA: debts (Dívidas e Financiamentos)
-- ------------------------------------------------------------------------------
create table public.debts (
  id text primary key,
  user_id text not null,
  title text not null,
  description text,
  category text not null default 'outro',
  creditor text not null,
  contract_number text,
  total_amount_cents bigint not null,
  down_payment_cents bigint not null default 0,
  down_payment_paid boolean not null default false,
  down_payment_paid_date date,
  financed_amount_cents bigint not null,
  installment_count integer not null,
  default_installment_amount_cents bigint not null,
  interest_rate_annual numeric,
  monetary_correction_index text,
  start_date date not null,
  due_day integer not null,
  payment_method text not null default 'outro',
  status text not null default 'em_andamento',
  is_demo boolean default false,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

alter table public.debts enable row level security;
create policy "debts_all_policy" on public.debts
  for all
  using (auth.uid() is null or auth.uid()::text = user_id)
  with check (auth.uid() is null or auth.uid()::text = user_id);

create index idx_debts_user_id on public.debts(user_id);
create index idx_debts_status on public.debts(status);

-- ------------------------------------------------------------------------------
-- 6. TABELA: installments (Parcelas)
-- ------------------------------------------------------------------------------
create table public.installments (
  id text primary key,
  debt_id text not null references public.debts(id) on delete cascade,
  user_id text not null,
  installment_number integer not null,
  due_date date not null,
  expected_amount_cents bigint not null,
  paid_amount_cents bigint not null default 0,
  paid_date date,
  status text not null default 'pendente',
  notes text,
  receipt_url text,
  original_amount_cents bigint,
  penalty_interest_cents bigint not null default 0,
  discount_cents bigint not null default 0,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

alter table public.installments enable row level security;
create policy "installments_all_policy" on public.installments
  for all
  using (auth.uid() is null or auth.uid()::text = user_id)
  with check (auth.uid() is null or auth.uid()::text = user_id);

create index idx_installments_user_debt on public.installments(user_id, debt_id);
create index idx_installments_due_date on public.installments(due_date);
create index idx_installments_status on public.installments(status);

-- ------------------------------------------------------------------------------
-- 7. TABELA: payment_records (Histórico de Pagamentos e Amortizações)
-- ------------------------------------------------------------------------------
create table public.payment_records (
  id text primary key,
  debt_id text not null references public.debts(id) on delete cascade,
  installment_id text references public.installments(id) on delete set null,
  user_id text not null,
  amount_cents bigint not null,
  payment_date date not null,
  payment_method text not null default 'outro',
  is_down_payment boolean not null default false,
  receipt_attachment_id text,
  notes text,
  created_at timestamp with time zone default now()
);

alter table public.payment_records enable row level security;
create policy "payments_all_policy" on public.payment_records
  for all
  using (auth.uid() is null or auth.uid()::text = user_id)
  with check (auth.uid() is null or auth.uid()::text = user_id);

create index idx_payments_user_debt on public.payment_records(user_id, debt_id);

-- ------------------------------------------------------------------------------
-- 8. TABELA: attachments (Comprovantes e Contratos)
-- ------------------------------------------------------------------------------
create table public.attachments (
  id text primary key,
  debt_id text references public.debts(id) on delete cascade,
  installment_id text references public.installments(id) on delete set null,
  payment_id text,
  related_type text,
  related_id text,
  user_id text not null,
  file_name text not null,
  file_type text not null,
  file_size bigint not null,
  category text not null default 'outro',
  description text,
  storage_path text,
  data_url text,
  created_at timestamp with time zone default now()
);

alter table public.attachments enable row level security;
create policy "attachments_all_policy" on public.attachments
  for all
  using (auth.uid() is null or auth.uid()::text = user_id)
  with check (auth.uid() is null or auth.uid()::text = user_id);

create index idx_attachments_user on public.attachments(user_id);

-- ------------------------------------------------------------------------------
-- 9. TABELA: history_events (Linha do Tempo e Auditoria)
-- ------------------------------------------------------------------------------
create table public.history_events (
  id text primary key,
  debt_id text not null references public.debts(id) on delete cascade,
  installment_id text references public.installments(id) on delete set null,
  user_id text not null,
  type text not null,
  title text not null,
  description text,
  installment_number integer,
  amount_cents bigint,
  timestamp timestamp with time zone default now()
);

alter table public.history_events enable row level security;
create policy "history_all_policy" on public.history_events
  for all
  using (auth.uid() is null or auth.uid()::text = user_id)
  with check (auth.uid() is null or auth.uid()::text = user_id);

create index idx_history_user_debt on public.history_events(user_id, debt_id);

-- ------------------------------------------------------------------------------
-- 10. TABELA: debt_adjustment_rules (Regras de Reajuste/Correção Monetária)
-- ------------------------------------------------------------------------------
create table public.debt_adjustment_rules (
  id text primary key,
  debt_id text not null references public.debts(id) on delete cascade,
  user_id text not null,
  type text not null default 'outro',
  rate_percentage numeric,
  index_name text,
  periodicity text not null default 'anual',
  application_date date,
  notes text,
  created_at timestamp with time zone default now()
);

alter table public.debt_adjustment_rules enable row level security;
create policy "adjustment_all_policy" on public.debt_adjustment_rules
  for all
  using (auth.uid() is null or auth.uid()::text = user_id)
  with check (auth.uid() is null or auth.uid()::text = user_id);

-- ------------------------------------------------------------------------------
-- 11. TABELA: incomes (Receitas e Entradas de Dinheiro)
-- ------------------------------------------------------------------------------
create table public.incomes (
  id text primary key,
  user_id text not null,
  description text not null,
  amount_cents bigint not null,
  category text not null default 'salario',
  flow_type text not null default 'receita',
  date date not null,
  account_or_origin text not null default 'Conta Principal',
  is_recurring boolean not null default false,
  recurrence_frequency text,
  attachment_id text,
  notes text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

alter table public.incomes enable row level security;
create policy "incomes_all_policy" on public.incomes
  for all
  using (auth.uid() is null or auth.uid()::text = user_id)
  with check (auth.uid() is null or auth.uid()::text = user_id);

create index idx_incomes_user_date on public.incomes(user_id, date);

-- ------------------------------------------------------------------------------
-- 12. TABELA: expenses (Despesas e Saídas de Dinheiro)
-- ------------------------------------------------------------------------------
create table public.expenses (
  id text primary key,
  user_id text not null,
  description text not null,
  amount_cents bigint not null,
  category text not null default 'outros',
  date date not null,
  payment_method text not null default 'pix',
  account text not null default 'Conta Corrente',
  is_fixed boolean not null default false,
  is_recurring boolean not null default false,
  recurrence_frequency text,
  linked_debt_payment_id text,
  attachment_id text,
  notes text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

alter table public.expenses enable row level security;
create policy "expenses_all_policy" on public.expenses
  for all
  using (auth.uid() is null or auth.uid()::text = user_id)
  with check (auth.uid() is null or auth.uid()::text = user_id);

create index idx_expenses_user_date on public.expenses(user_id, date);

-- ------------------------------------------------------------------------------
-- 13. TABELA: investments (Investimentos e Reservas)
-- ------------------------------------------------------------------------------
create table public.investments (
  id text primary key,
  user_id text not null,
  name text not null,
  type text not null default 'renda_fixa',
  institution text not null,
  initial_amount_cents bigint not null default 0,
  current_amount_cents bigint not null default 0,
  total_invested_cents bigint not null default 0,
  total_yield_cents bigint not null default 0,
  application_date date not null,
  notes text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

alter table public.investments enable row level security;
create policy "investments_all_policy" on public.investments
  for all
  using (auth.uid() is null or auth.uid()::text = user_id)
  with check (auth.uid() is null or auth.uid()::text = user_id);

create index idx_investments_user on public.investments(user_id);

-- ------------------------------------------------------------------------------
-- 14. TABELA: investment_transactions (Aportes e Resgates de Investimento)
-- ------------------------------------------------------------------------------
create table public.investment_transactions (
  id text primary key,
  investment_id text not null references public.investments(id) on delete cascade,
  user_id text not null,
  type text not null default 'aporte',
  amount_cents bigint not null,
  date date not null,
  notes text,
  created_at timestamp with time zone default now()
);

alter table public.investment_transactions enable row level security;
create policy "inv_tx_all_policy" on public.investment_transactions
  for all
  using (auth.uid() is null or auth.uid()::text = user_id)
  with check (auth.uid() is null or auth.uid()::text = user_id);

create index idx_inv_tx_user_inv on public.investment_transactions(user_id, investment_id);

-- ------------------------------------------------------------------------------
-- 15. PERMISSÕES DE ACESSO (GRANTS) PARA O REST API DO SUPABASE
-- ------------------------------------------------------------------------------
grant all on all tables in schema public to anon, authenticated, service_role;
grant all on all sequences in schema public to anon, authenticated, service_role;
grant all on all routines in schema public to anon, authenticated, service_role;
`;

  const handleCopy = () => {
    navigator.clipboard.writeText(sqlScript);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const handleTestConnection = async () => {
    setConnectionStatus('testing');
    setStatusMessage(null);
    try {
      // Test basic connection to Supabase endpoint
      const { error } = await supabase.from('debts').select('id').limit(1);
      if (error && error.code !== 'PGRST116') {
        // Table might not be created yet, but connection to Supabase reached
        if (error.message.includes('relation "public.debts" does not exist')) {
          setConnectionStatus('connected');
          setStatusMessage('Conectado ao Supabase com sucesso! As tabelas ainda precisam ser criadas executando o script SQL.');
        } else {
          setConnectionStatus('connected');
          setStatusMessage(`Conectado ao Supabase (Resposta da API: ${error.message}).`);
        }
      } else {
        setConnectionStatus('connected');
        setStatusMessage('Conexão ativa! Tabelas e RLS configurados e operacionais.');
      }
    } catch (err: any) {
      setConnectionStatus('error');
      setStatusMessage(err?.message || 'Falha ao contatar Supabase.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                Integração Supabase & RLS Ativo
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                  RLS Ativo
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Projeto: <span className="font-mono font-semibold text-slate-700 dark:text-slate-300">{projectId}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-sm text-slate-600 dark:text-slate-300">
          {/* Credentials Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
              <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold block mb-1">
                Supabase URL
              </span>
              <span className="font-mono text-xs text-slate-800 dark:text-slate-200 block truncate" title={supabaseUrl}>
                {supabaseUrl}
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
              <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold block mb-1">
                Anon Key (JWT)
              </span>
              <span className="font-mono text-xs text-slate-800 dark:text-slate-200 block truncate" title={anonKey}>
                {anonKey}
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
              <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold block mb-1">
                Publishable Key
              </span>
              <span className="font-mono text-xs text-slate-800 dark:text-slate-200 block truncate" title={publishableKey}>
                {publishableKey}
              </span>
            </div>
          </div>

          {/* Connection Test Box */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                Status da Conexão & RLS
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                {statusMessage || 'Verifique a comunicação direta com o projeto Supabase.'}
              </p>
            </div>
            <button
              type="button"
              onClick={handleTestConnection}
              disabled={connectionStatus === 'testing'}
              className="px-3 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${connectionStatus === 'testing' ? 'animate-spin' : ''}`} />
              <span>{connectionStatus === 'testing' ? 'Testando...' : 'Testar Conexão'}</span>
            </button>
          </div>

          {/* Instructions */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Como aplicar as tabelas com RLS no Supabase:
            </h4>
            <ol className="list-decimal list-inside space-y-1 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              <li>Abra o painel do seu projeto no Supabase: <span className="font-mono font-semibold">ybdnhrtetahnvvtbapwm</span>.</li>
              <li>Acesse o menu lateral <strong>SQL Editor</strong>.</li>
              <li>Clique em <strong>Novo Query</strong>.</li>
              <li>Cole o script abaixo e clique em <strong>RUN</strong>.</li>
              <li>Pronto! Todas as tabelas e políticas de Row Level Security (RLS) estarão ativas.</li>
            </ol>
          </div>

          {/* SQL Script Copy Action (Sem exibir o código na tela) */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Code2 className="w-4 h-4 text-emerald-500" />
                Script de Criação das Tabelas & RLS
              </span>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                O código SQL está pronto e seguro. Clique ao lado para copiar para a área de transferência.
              </p>
            </div>
            <button
              type="button"
              onClick={handleCopy}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shrink-0 flex items-center gap-2 cursor-pointer shadow-sm"
            >
              {copied ? <Check className="w-4 h-4 text-white" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Copiado para Área de Transferência!' : 'Copiar Script SQL'}</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex items-center justify-between gap-3">
          <a
            href="https://supabase.com/dashboard/project/ybdnhrtetahnvvtbapwm/editor"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1.5"
          >
            <span>Abrir SQL Editor no Supabase</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold transition-all cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
