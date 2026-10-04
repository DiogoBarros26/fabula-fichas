import "server-only";
import { createHash, randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { and, eq, gt } from "drizzle-orm";
import { db } from "@/db";
import { sessoes, usuarios } from "@/db/schema";

const scryptAsync = promisify(scrypt) as (senha: string, sal: Buffer, tamanho: number) => Promise<Buffer>;
const COOKIE = "sessao";
const DURACAO_MS = 30 * 24 * 60 * 60 * 1000;

export async function gerarHashSenha(senha: string) {
  const sal = randomBytes(16);
  const hash = await scryptAsync(senha, sal, 64);
  return `${sal.toString("hex")}:${hash.toString("hex")}`;
}

export async function conferirSenha(senha: string, guardado: string) {
  const [salHex, hashHex] = guardado.split(":");
  if (!salHex || !hashHex) return false;
  const esperado = Buffer.from(hashHex, "hex");
  const hash = await scryptAsync(senha, Buffer.from(salHex, "hex"), esperado.length);
  return timingSafeEqual(hash, esperado);
}

const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");

export async function iniciarSessao(usuarioId: string) {
  const token = randomBytes(32).toString("base64url");
  const expiraEm = new Date(Date.now() + DURACAO_MS);
  const banco = await db();
  await banco.insert(sessoes).values({ id: hashToken(token), usuarioId, expiraEm });
  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiraEm,
  });
}

export async function encerrarSessao() {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (token) {
    const banco = await db();
    await banco.delete(sessoes).where(eq(sessoes.id, hashToken(token)));
  }
  jar.delete(COOKIE);
}

export type UsuarioLogado = { id: string; usuario: string; nome: string };

export const usuarioAtual = cache(async (): Promise<UsuarioLogado | null> => {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  const banco = await db();
  const [linha] = await banco
    .select({ id: usuarios.id, usuario: usuarios.usuario, nome: usuarios.nome })
    .from(sessoes)
    .innerJoin(usuarios, eq(sessoes.usuarioId, usuarios.id))
    .where(and(eq(sessoes.id, hashToken(token)), gt(sessoes.expiraEm, new Date())));
  return linha ?? null;
});

export async function exigirUsuario() {
  const usuario = await usuarioAtual();
  if (!usuario) redirect("/entrar");
  return usuario;
}

/** Administradores do site: usuários listados em ADMIN_USUARIOS (separados por vírgula). */
export function ehAdmin(usuario: UsuarioLogado | null) {
  if (!usuario) return false;
  const admins = (process.env.ADMIN_USUARIOS ?? "").split(",").map((u) => u.trim().toLowerCase());
  return admins.includes(usuario.usuario);
}

export async function exigirAdmin() {
  const usuario = await exigirUsuario();
  if (!ehAdmin(usuario)) redirect("/");
  return usuario;
}
