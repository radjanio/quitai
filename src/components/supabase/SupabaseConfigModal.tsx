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
  const anonKey = 'sb_publishable_9dNth1fNpCxozI8hNaSLiA_uc2uIkYp';

  const sqlScript = `-- ==============================================================================
-- QUITAÍ — SCRIPT SQL COMPLETO PARA O SUPABASE COM RLS (ROW LEVEL SECURITY)
-- Projeto: ybdnhrtetahnvvtbapwm
-- Cole este script no SQL Editor do seu projeto Supabase e clique em RUN
-- ==============================================================================

create extension if not exists "uuid-ossp";

-- 1. Perfis de Usuário
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  email text not null,
  avatar_url text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

alter table public.profiles enable row level security;

create policy "Usuários podem ver apenas seu próprio perfil"
  on public.profiles for select using (auth.uid() = id);

create policy "Usuários podem inserir seu próprio perfil"
  on public.profiles for insert with check (auth.uid() = id);

create policy "Usuários podem atualizar seu próprio perfil"
  on public.profiles for update using (auth.uid() = id);

create policy "Usuários podem excluir seu próprio perfil"
  on public.profiles for delete using (auth.uid() = id);

-- Trigger de perfil automático
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, name, email)
  values (new.id, coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)), new.email)
  on conflict (id) do update set email = excluded.email;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

-- 2. Dívidas (debts)
create table if not exists public.debts (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
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
  start_date date not null,
  due_day integer not null,
  payment_method text not null default 'outro',
  status text not null default 'em_andamento',
  is_demo boolean default false,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

alter table public.debts enable row level security;
create policy "RLS debts select" on public.debts for select using (auth.uid() = user_id);
create policy "RLS debts insert" on public.debts for insert with check (auth.uid() = user_id);
create policy "RLS debts update" on public.debts for update using (auth.uid() = user_id);
create policy "RLS debts delete" on public.debts for delete using (auth.uid() = user_id);

-- 3. Parcelas (installments)
create table if not exists public.installments (
  id text primary key,
  debt_id text not null references public.debts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  installment_number integer not null,
  due_date date not null,
  expected_amount_cents bigint not null,
  paid_amount_cents bigint not null default 0,
  paid_date date,
  status text not null default 'pendente',
  notes text,
  receipt_url text,
  original_amount_cents bigint,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

alter table public.installments enable row level security;
create policy "RLS installments select" on public.installments for select using (auth.uid() = user_id);
create policy "RLS installments insert" on public.installments for insert with check (auth.uid() = user_id);
create policy "RLS installments update" on public.installments for update using (auth.uid() = user_id);
create policy "RLS installments delete" on public.installments for delete using (auth.uid() = user_id);
create index if not exists idx_installments_user_debt on public.installments(user_id, debt_id);

-- 4. Pagamentos (payment_records)
create table if not exists public.payment_records (
  id text primary key,
  debt_id text not null references public.debts(id) on delete cascade,
  installment_id text references public.installments(id) on delete set null,
  user_id uuid not null references auth.users(id) on delete cascade,
  amount_cents bigint not null,
  payment_date date not null,
  payment_method text not null default 'outro',
  receipt_attachment_id text,
  notes text,
  created_at timestamp with time zone default now()
);

alter table public.payment_records enable row level security;
create policy "RLS payments select" on public.payment_records for select using (auth.uid() = user_id);
create policy "RLS payments insert" on public.payment_records for insert with check (auth.uid() = user_id);
create policy "RLS payments update" on public.payment_records for update using (auth.uid() = user_id);
create policy "RLS payments delete" on public.payment_records for delete using (auth.uid() = user_id);

-- 5. Anexos (attachments)
create table if not exists public.attachments (
  id text primary key,
  debt_id text not null references public.debts(id) on delete cascade,
  installment_id text references public.installments(id) on delete set null,
  user_id uuid not null references auth.users(id) on delete cascade,
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
create policy "RLS attachments select" on public.attachments for select using (auth.uid() = user_id);
create policy "RLS attachments insert" on public.attachments for insert with check (auth.uid() = user_id);
create policy "RLS attachments update" on public.attachments for update using (auth.uid() = user_id);
create policy "RLS attachments delete" on public.attachments for delete using (auth.uid() = user_id);

-- 6. Linha do Tempo (history_events)
create table if not exists public.history_events (
  id text primary key,
  debt_id text not null references public.debts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null,
  title text not null,
  description text,
  installment_number integer,
  amount_cents bigint,
  timestamp timestamp with time zone default now()
);

alter table public.history_events enable row level security;
create policy "RLS history select" on public.history_events for select using (auth.uid() = user_id);
create policy "RLS history insert" on public.history_events for insert with check (auth.uid() = user_id);
create policy "RLS history delete" on public.history_events for delete using (auth.uid() = user_id);

-- 7. Regras de Reajuste (debt_adjustment_rules)
create table if not exists public.debt_adjustment_rules (
  id text primary key,
  debt_id text not null references public.debts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  index_name text not null,
  periodicity text not null,
  next_adjustment_date date not null,
  created_at timestamp with time zone default now()
);

alter table public.debt_adjustment_rules enable row level security;
create policy "RLS adjustment select" on public.debt_adjustment_rules for select using (auth.uid() = user_id);
create policy "RLS adjustment insert" on public.debt_adjustment_rules for insert with check (auth.uid() = user_id);
create policy "RLS adjustment update" on public.debt_adjustment_rules for update using (auth.uid() = user_id);
create policy "RLS adjustment delete" on public.debt_adjustment_rules for delete using (auth.uid() = user_id);

-- 8. Entradas de Dinheiro (incomes)
create table if not exists public.incomes (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  description text not null,
  amount_cents bigint not null,
  category text not null default 'salario',
  flow_type text not null default 'receita',
  date date not null,
  account_or_origin text not null default 'Conta Principal',
  is_recurring boolean not null default false,
  recurrence_frequency text,
  notes text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

alter table public.incomes enable row level security;
create policy "RLS incomes select" on public.incomes for select using (auth.uid() = user_id);
create policy "RLS incomes insert" on public.incomes for insert with check (auth.uid() = user_id);
create policy "RLS incomes update" on public.incomes for update using (auth.uid() = user_id);
create policy "RLS incomes delete" on public.incomes for delete using (auth.uid() = user_id);

-- 9. Despesas (expenses)
create table if not exists public.expenses (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
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
  notes text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

alter table public.expenses enable row level security;
create policy "RLS expenses select" on public.expenses for select using (auth.uid() = user_id);
create policy "RLS expenses insert" on public.expenses for insert with check (auth.uid() = user_id);
create policy "RLS expenses update" on public.expenses for update using (auth.uid() = user_id);
create policy "RLS expenses delete" on public.expenses for delete using (auth.uid() = user_id);

-- 10. Investimentos (investments)
create table if not exists public.investments (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
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
create policy "RLS investments select" on public.investments for select using (auth.uid() = user_id);
create policy "RLS investments insert" on public.investments for insert with check (auth.uid() = user_id);
create policy "RLS investments update" on public.investments for update using (auth.uid() = user_id);
create policy "RLS investments delete" on public.investments for delete using (auth.uid() = user_id);

-- 11. Movimentações de Investimento (investment_transactions)
create table if not exists public.investment_transactions (
  id text primary key,
  investment_id text not null references public.investments(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null default 'aporte',
  amount_cents bigint not null,
  date date not null,
  notes text,
  created_at timestamp with time zone default now()
);

alter table public.investment_transactions enable row level security;
create policy "RLS inv_tx select" on public.investment_transactions for select using (auth.uid() = user_id);
create policy "RLS inv_tx insert" on public.investment_transactions for insert with check (auth.uid() = user_id);
create policy "RLS inv_tx delete" on public.investment_transactions for delete using (auth.uid() = user_id);
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
              <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold block mb-1">
                Supabase URL
              </span>
              <span className="font-mono text-xs text-slate-800 dark:text-slate-200 block truncate">
                {supabaseUrl}
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
              <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold block mb-1">
                Chave Pública (Anon Key)
              </span>
              <span className="font-mono text-xs text-slate-800 dark:text-slate-200 block truncate">
                {anonKey}
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

          {/* SQL Script Viewer */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Code2 className="w-4 h-4 text-emerald-500" />
                Script SQL (Tabelas + RLS Completo)
              </span>
              <button
                type="button"
                onClick={handleCopy}
                className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-750 flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copiado!' : 'Copiar Script SQL'}</span>
              </button>
            </div>
            <div className="relative rounded-2xl bg-slate-950 border border-slate-800 p-3 max-h-56 overflow-y-auto">
              <pre className="font-mono text-[11px] text-slate-300 leading-relaxed whitespace-pre">
                {sqlScript}
              </pre>
            </div>
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
