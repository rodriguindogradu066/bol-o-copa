-- Execute isso no SQL Editor do Supabase

create table palpites (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  gols_sco integer not null default 0,
  gols_bra integer not null default 0,
  valor numeric(10,2) not null,
  status text not null default 'pendente', -- pendente | confirmado
  payment_id text,
  acertou boolean default null,
  criado_em timestamptz default now()
);

-- Habilitar leitura pública (só leitura de confirmados)
alter table palpites enable row level security;

create policy "leitura publica confirmados"
  on palpites for select
  using (status = 'confirmado');

create policy "service pode tudo"
  on palpites for all
  using (true)
  with check (true);
