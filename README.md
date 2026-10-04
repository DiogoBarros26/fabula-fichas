# Fichas — Fabula Ultima

Site para o grupo guardar as fichas de personagem de Fabula Ultima: login, campanhas com código de convite, fichas com cálculos automáticos, habilidades e equipamentos do livro básico.

Next.js 16 · Drizzle ORM · Postgres (Neon em produção) · hospedado na Vercel.

## Rodar no computador

```bash
npm install
npm run dev
```

O `npm run dev` sobe um Postgres local (copiado para `%LOCALAPPDATA%\fabula-fichas`, porque o Postgres não funciona em caminhos com acento) e abre o site em http://localhost:3000.

## Variáveis de ambiente

| Nome | Para quê |
|------|----------|
| `DATABASE_URL` | Banco Postgres. Local: definido pelo `npm run dev`. Produção: criado pela integração Neon. |
| `ADMIN_USUARIOS` | Usuários administradores do site, separados por vírgula (ex.: `admin`). |
| `CODIGO_GRUPO` | Código pedido no cadastro; impede que estranhos criem conta. |

## Scripts

- `npm run db:setup` — cria/atualiza as tabelas no banco de `DATABASE_URL` (`src/db/schema.sql`).
- `node --env-file=<arquivo .env> scripts/criar-admin.mjs [usuario]` — cria o admin ou redefine a senha dele, gerando uma senha forte.
