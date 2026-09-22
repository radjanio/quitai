-- ==============================================================================
-- QUITAÍ — SCRIPT SQL COMPLETO PARA O SUPABASE COM RLS (ROW LEVEL SECURITY)
-- Projeto: ybdnhrtetahnvvtbapwm
-- Cole este script no SQL Editor do seu projeto Supabase e clique em RUN
-- ==============================================================================

-- 1. Habilitar extensões necessárias
create extension if not exists "uuid-ossp";

-- 2. Tabela de Perfis de Usuário (vinculada ao auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  email text not null,
  avatar_url text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Ativar RLS em profiles
alter table public.profiles enable row level security;

create policy "Usuários podem ver apenas seu próprio perfil"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Usuários podem inserir seu próprio perfil"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "Usuários podem atualizar seu próprio perfil"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Usuários podem excluir seu próprio perfil"
  on public.profiles for delete
  using (auth.uid() = id);

-- Trigger para criar perfil automaticamente no SignUp
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.email
  )
  on conflict (id) do update
  set email = excluded.email,
      name = coalesce(excluded.name, profiles.name);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 3. Tabela de Dívidas / Contratos (debts)
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

-- Ativar RLS em debts
alter table public.debts enable row level security;

create policy "Usuários podem visualizar suas próprias dívidas"
  on public.debts for select
  using (auth.uid() = user_id);

create policy "Usuários podem cadastrar suas próprias dívidas"
  on public.debts for insert
  with check (auth.uid() = user_id);

create policy "Usuários podem atualizar suas próprias dívidas"
  on public.debts for update
  using (auth.uid() = user_id);

create policy "Usuários podem remover suas próprias dívidas"
  on public.debts for delete
  using (auth.uid() = user_id);

-- 4. Tabela de Parcelas (installments)
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

-- Ativar RLS em installments
alter table public.installments enable row level security;

create policy "Usuários podem visualizar suas próprias parcelas"
  on public.installments for select
  using (auth.uid() = user_id);

create policy "Usuários podem cadastrar parcelas para suas dívidas"
  on public.installments for insert
  with check (auth.uid() = user_id);

create policy "Usuários podem atualizar suas próprias parcelas"
  on public.installments for update
  using (auth.uid() = user_id);

create policy "Usuários podem excluir suas próprias parcelas"
  on public.installments for delete
  using (auth.uid() = user_id);

-- Índices de performance para installments
create index if not exists idx_installments_user_debt on public.installments(user_id, debt_id);
create index if not exists idx_installments_due_date on public.installments(due_date);
create index if not exists idx_installments_status on public.installments(status);

-- 5. Tabela de Pagamentos e Amortizações (payment_records)
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

-- Ativar RLS em payment_records
alter table public.payment_records enable row level security;

create policy "Usuários podem visualizar seus próprios pagamentos"
  on public.payment_records for select
  using (auth.uid() = user_id);

create policy "Usuários podem registrar seus próprios pagamentos"
  on public.payment_records for insert
  with check (auth.uid() = user_id);

create policy "Usuários podem atualizar seus próprios pagamentos"
  on public.payment_records for update
  using (auth.uid() = user_id);

create policy "Usuários podem excluir seus próprios pagamentos"
  on public.payment_records for delete
  using (auth.uid() = user_id);

create index if not exists idx_payments_user_debt on public.payment_records(user_id, debt_id);

-- 6. Tabela de Anexos e Comprovantes (attachments)
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

-- Ativar RLS em attachments
alter table public.attachments enable row level security;

create policy "Usuários podem visualizar seus próprios anexos"
  on public.attachments for select
  using (auth.uid() = user_id);

create policy "Usuários podem fazer upload dos seus próprios anexos"
  on public.attachments for insert
  with check (auth.uid() = user_id);

create policy "Usuários podem atualizar seus próprios anexos"
  on public.attachments for update
  using (auth.uid() = user_id);

create policy "Usuários podem remover seus próprios anexos"
  on public.attachments for delete
  using (auth.uid() = user_id);

create index if not exists idx_attachments_user_debt on public.attachments(user_id, debt_id);

-- 7. Tabela de Histórico e Linha do Tempo (history_events)
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

-- Ativar RLS em history_events
alter table public.history_events enable row level security;

create policy "Usuários podem visualizar seu próprio histórico"
  on public.history_events for select
  using (auth.uid() = user_id);

create policy "Usuários podem inserir eventos no seu histórico"
  on public.history_events for insert
  with check (auth.uid() = user_id);

create policy "Usuários podem excluir seu próprio histórico"
  on public.history_events for delete
  using (auth.uid() = user_id);

create index if not exists idx_history_user_debt on public.history_events(user_id, debt_id);

-- 8. Tabela de Regras de Reajuste e Correção Monetária (debt_adjustment_rules)
create table if not exists public.debt_adjustment_rules (
  id text primary key,
  debt_id text not null references public.debts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  index_name text not null,
  periodicity text not null,
  next_adjustment_date date not null,
  created_at timestamp with time zone default now()
);

-- Ativar RLS em debt_adjustment_rules
alter table public.debt_adjustment_rules enable row level security;

create policy "Usuários podem visualizar suas regras de reajuste"
  on public.debt_adjustment_rules for select
  using (auth.uid() = user_id);

create policy "Usuários podem cadastrar regras de reajuste"
  on public.debt_adjustment_rules for insert
  with check (auth.uid() = user_id);

create policy "Usuários podem atualizar regras de reajuste"
  on public.debt_adjustment_rules for update
  using (auth.uid() = user_id);

create policy "Usuários podem remover regras de reajuste"
  on public.debt_adjustment_rules for delete
  using (auth.uid() = user_id);

create index if not exists idx_adjustment_rules_user_debt on public.debt_adjustment_rules(user_id, debt_id);
