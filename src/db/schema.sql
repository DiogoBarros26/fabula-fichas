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

-- Rolagens de dados feitas dentro de uma campanha (histórico da mesa).
create table if not exists rolagens (
  id bigserial primary key,
  campanha_id uuid not null references campanhas(id) on delete cascade,
  usuario_id uuid not null references usuarios(id) on delete cascade,
  ficha_id uuid references fichas(id) on delete set null,
  autor text not null,
  secreta boolean not null default false,
  resultado jsonb not null,
  criado_em timestamptz not null default now()
);

create index if not exists rolagens_campanha_idx on rolagens (campanha_id, id);

-- Playlist da campanha: links (YouTube ou áudio direto) e MP3 enviados ao Vercel Blob.
create table if not exists faixas (
  id uuid primary key default gen_random_uuid(),
  campanha_id uuid not null references campanhas(id) on delete cascade,
  titulo text not null,
  url text not null,
  tipo text not null,
  criado_em timestamptz not null default now()
);

create index if not exists faixas_campanha_idx on faixas (campanha_id, criado_em);

-- O que está tocando na mesa. "posicao" é o ponto da faixa (em segundos) no instante "atualizado_em".
create table if not exists campanha_musica (
  campanha_id uuid primary key references campanhas(id) on delete cascade,
  faixa_id uuid references faixas(id) on delete set null,
  tocando boolean not null default false,
  posicao real not null default 0,
  repetir boolean not null default true,
  atualizado_em timestamptz not null default now()
);
