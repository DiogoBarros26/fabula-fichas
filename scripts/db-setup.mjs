// Aplica src/db/schema.sql no banco de DATABASE_URL (ex.: o Neon, antes do primeiro deploy).
import { readFile } from "node:fs/promises";
import pg from "pg";

export async function aplicarSchema(url) {
  const sql = await readFile(new URL("../src/db/schema.sql", import.meta.url), "utf8");
  const cliente = new pg.Client({ connectionString: url });
  await cliente.connect();
  try {
    await cliente.query(sql);
  } finally {
    await cliente.end();
  }
}

if (process.argv[1]?.endsWith("db-setup.mjs")) {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("Defina DATABASE_URL para aplicar o schema.");
    process.exit(1);
  }
  await aplicarSchema(url);
  console.log("Schema aplicado.");
}
