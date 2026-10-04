-- Estrutura do banco. Idempotente: pode ser executado várias vezes (npm run db:setup).
-- Mantenha em sincronia com src/db/schema.ts.

create table if not exists usuarios (
  id uuid primary key default gen_random_uuid(),
  usuario text not null unique,
  nome text not null,
  senha_hash text not null,
  criado_em timestamptz not null default now()
);

create table if not exists sessoes (
  id text primary key,
  usuario_id uuid not null references usuarios(id) on delete cascade,
  expira_em timestamptz not null
);

create table if not exists campanhas (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  mestre_id uuid not null references usuarios(id) on delete cascade,
  codigo text not null unique,
  criado_em timestamptz not null default now()
);

create table if not exists campanha_membros (
  campanha_id uuid not null references campanhas(id) on delete cascade,
  usuario_id uuid not null references usuarios(id) on delete cascade,
  entrou_em timestamptz not null default now(),
  primary key (campanha_id, usuario_id)
);

create table if not exists fichas (
  id uuid primary key default gen_random_uuid(),
  dono_id uuid not null references usuarios(id) on delete cascade,
  campanha_id uuid references campanhas(id) on delete set null,
  visivel boolean not null default true,
  dados jsonb not null,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create index if not exists fichas_dono_idx on fichas (dono_id);
create index if not exists fichas_campanha_idx on fichas (campanha_id);
