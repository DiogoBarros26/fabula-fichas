"use server";

import { randomInt } from "node:crypto";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { sessoes, usuarios } from "@/db/schema";
import { exigirAdmin, gerarHashSenha } from "@/lib/auth";

/**
 * Exclui a conta e tudo que pertence a ela (fichas, sessões, participações e campanhas
 * em que era Mestre). Fichas de outros jogadores nessas campanhas voltam a ser particulares.
 */
export async function excluirConta(usuarioId: string) {
  const admin = await exigirAdmin();
  if (usuarioId === admin.id) throw new Error("Você não pode excluir a própria conta por aqui.");
  const banco = await db();
  await banco.delete(usuarios).where(eq(usuarios.id, usuarioId));
  revalidatePath("/", "layout");
}

const ALFABETO = "abcdefghjkmnpqrstuvwxyz23456789";

/** Gera uma senha temporária, encerra as sessões da pessoa e devolve a senha para o admin repassar. */
export async function redefinirSenha(usuarioId: string) {
  await exigirAdmin();
  const senha = Array.from({ length: 10 }, () => ALFABETO[randomInt(ALFABETO.length)]).join("");
  const banco = await db();
  await banco.update(usuarios).set({ senhaHash: await gerarHashSenha(senha) }).where(eq(usuarios.id, usuarioId));
  await banco.delete(sessoes).where(eq(sessoes.usuarioId, usuarioId));
  return senha;
}
