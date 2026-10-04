// Ambiente local: sobe um Postgres de verdade (um único processo, seguro para os vários
// workers do Next.js), aplica o schema e inicia o `next dev` apontando para ele.
//
// Os executáveis vêm do pacote @embedded-postgres/<plataforma>. O Postgres não aceita
// acentos no próprio caminho (a pasta do projeto é "Fábula ultima"), então eles são
// copiados uma vez para %LOCALAPPDATA%\fabula-fichas e executados de lá.
import { execFile, spawn } from "node:child_process";
import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import pg from "pg";
import { aplicarSchema } from "./db-setup.mjs";

const executar = promisify(execFile);
const ext = process.platform === "win32" ? ".exe" : "";
const plataforma = { "win32-x64": "windows-x64", "darwin-arm64": "darwin-arm64", "darwin-x64": "darwin-x64", "linux-x64": "linux-x64" }[
  `${process.platform}-${process.arch}`
];
if (!plataforma) throw new Error(`Plataforma não suportada: ${process.platform}-${process.arch}`);

const base = process.env.PG_LOCAL_DIR ?? join(process.env.LOCALAPPDATA ?? process.env.HOME ?? ".", "fabula-fichas");
const porta = Number(process.env.PG_LOCAL_PORT ?? 5433);
// Credenciais só do banco local, que aceita conexões apenas de localhost.
const usuario = "fabula";
const senha = "fabula-local";
const banco = "fabula";

// 1. Copia os executáveis para um caminho sem acento (só na primeira vez ou ao atualizar o pacote).
const { postgres: postgresOrigem } = await import(`@embedded-postgres/${plataforma}`);
const nativoOrigem = dirname(dirname(postgresOrigem));
const versao = JSON.parse(readFileSync(join(nativoOrigem, "..", "package.json"), "utf8")).version;
const nativo = join(base, `pg-${versao}`);
if (!existsSync(join(nativo, "bin", `postgres${ext}`))) {
  console.log("Preparando o Postgres local (só na primeira vez)…");
  mkdirSync(base, { recursive: true });
  cpSync(nativoOrigem, nativo, { recursive: true });
}
const bin = (nome) => join(nativo, "bin", nome + ext);

// 2. Cria a pasta de dados na primeira execução.
const dados = join(base, "dados");
if (!existsSync(join(dados, "PG_VERSION"))) {
  console.log(`Criando banco local em ${dados}…`);
  const arquivoSenha = join(base, "pwfile.tmp");
  writeFileSync(arquivoSenha, senha);
  try {
    await executar(bin("initdb"), ["-D", dados, "-U", usuario, `--pwfile=${arquivoSenha}`, "-A", "scram-sha-256", "-E", "UTF8", "--no-locale"]);
  } finally {
    rmSync(arquivoSenha, { force: true });
  }
}

// 3. Sobe o servidor.
const servidor = spawn(bin("postgres"), ["-D", dados, "-p", String(porta), "-c", "listen_addresses=localhost"], {
  stdio: ["ignore", "ignore", "pipe"],
});
servidor.stderr.on("data", (d) => {
  const texto = String(d);
  if (/FATAL|PANIC|ERROR/.test(texto)) process.stderr.write(`[postgres] ${texto}`);
});

const conexao = (db) => ({ host: "localhost", port: porta, user: usuario, password: senha, database: db });
for (let tentativa = 0; ; tentativa++) {
  const c = new pg.Client(conexao("postgres"));
  try {
    await c.connect();
    const { rowCount } = await c.query("select 1 from pg_database where datname = $1", [banco]);
    if (!rowCount) await c.query(`create database ${banco}`);
    await c.end();
    break;
  } catch (erro) {
    await c.end().catch(() => {});
    if (tentativa > 60 || servidor.exitCode !== null) throw erro;
    await new Promise((r) => setTimeout(r, 500));
  }
}

const url = `postgres://${usuario}:${encodeURIComponent(senha)}@localhost:${porta}/${banco}`;
await aplicarSchema(url);
console.log(`Postgres local pronto na porta ${porta}.`);

// 4. Inicia o Next.js.
const binNext = fileURLToPath(import.meta.resolve("next/dist/bin/next"));
const next = spawn(process.execPath, [binNext, "dev", ...process.argv.slice(2)], {
  stdio: "inherit",
  env: { ...process.env, DATABASE_URL: process.env.DATABASE_URL ?? url },
});

let encerrando = false;
async function encerrar(codigo = 0) {
  if (encerrando) return;
  encerrando = true;
  next.kill();
  await executar(bin("pg_ctl"), ["stop", "-D", dados, "-m", "fast"]).catch(() => servidor.kill());
  process.exit(codigo);
}
next.on("exit", (codigo) => encerrar(codigo ?? 0));
process.on("SIGINT", () => encerrar(0));
process.on("SIGTERM", () => encerrar(0));
