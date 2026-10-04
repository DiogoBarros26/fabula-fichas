// Cria (ou redefine a senha de) a conta de administrador no banco de DATABASE_URL.
// Uso: node --env-file=.env.production.local scripts/criar-admin.mjs [usuario]
// Gera uma senha forte e a mostra uma única vez. O usuário também precisa estar em ADMIN_USUARIOS.
import { randomBytes, randomInt, scrypt } from "node:crypto";
import { promisify } from "node:util";
import pg from "pg";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("Defina DATABASE_URL.");
  process.exit(1);
}
const usuario = (process.argv[2] ?? "admin").toLowerCase();

// Sem caracteres ambíguos (0/O, 1/l/I); garante maiúscula, minúscula, número e símbolo.
const grupos = ["ABCDEFGHJKLMNPQRSTUVWXYZ", "abcdefghijkmnpqrstuvwxyz", "23456789", "!@#$%&*?-_"];
const caracteres = grupos.map((g) => g[randomInt(g.length)]);
while (caracteres.length < 20) caracteres.push(grupos.join("")[randomInt(grupos.join("").length)]);
for (let i = caracteres.length - 1; i > 0; i--) {
  const j = randomInt(i + 1);
  [caracteres[i], caracteres[j]] = [caracteres[j], caracteres[i]];
}
const senha = caracteres.join("");

// Mesmo formato de src/lib/auth.ts: sal:hash (scrypt, 64 bytes).
const sal = randomBytes(16);
const hash = await promisify(scrypt)(senha, sal, 64);
const senhaHash = `${sal.toString("hex")}:${hash.toString("hex")}`;

const cliente = new pg.Client({ connectionString: url });
await cliente.connect();
try {
  await cliente.query(
    `insert into usuarios (usuario, nome, senha_hash) values ($1, 'Admin', $2)
     on conflict (usuario) do update set senha_hash = excluded.senha_hash`,
    [usuario, senhaHash],
  );
  await cliente.query("delete from sessoes where usuario_id = (select id from usuarios where usuario = $1)", [usuario]);
} finally {
  await cliente.end();
}
console.log(`Conta "${usuario}" pronta. Senha (guarde agora, não será mostrada de novo):\n${senha}`);
