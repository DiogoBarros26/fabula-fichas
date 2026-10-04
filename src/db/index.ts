import "server-only";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

// Local: DATABASE_URL é definido pelo `npm run dev` (Postgres embutido). Produção: URL do Neon.
const globalDb = globalThis as unknown as { fichasPool?: Pool };

function pool() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL não definido. Rode o projeto com `npm run dev`.");
  return (globalDb.fichasPool ??= new Pool({ connectionString: url, max: 5 }));
}

let banco: ReturnType<typeof drizzle<typeof schema>> | undefined;

export async function db() {
  return (banco ??= drizzle({ client: pool(), schema }));
}
