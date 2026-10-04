"use server";

import { randomInt } from "node:crypto";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { campanhas, fichas, membros } from "@/db/schema";
import { exigirUsuario } from "@/lib/auth";

export type EstadoCampanha = { erro?: string };

// Sem letras/números que se confundem (0/O, 1/I/L).
const ALFABETO = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
const gerarCodigo = () => Array.from({ length: 6 }, () => ALFABETO[randomInt(ALFABETO.length)]).join("");

export async function criarCampanha(_: EstadoCampanha, form: FormData): Promise<EstadoCampanha> {
  const usuario = await exigirUsuario();
  const nome = String(form.get("nome") ?? "").trim();
  if (!nome) return { erro: "Dê um nome à campanha." };

  const banco = await db();
  let codigo = gerarCodigo();
  while ((await banco.select({ id: campanhas.id }).from(campanhas).where(eq(campanhas.codigo, codigo))).length) codigo = gerarCodigo();

  const [nova] = await banco.insert(campanhas).values({ nome, mestreId: usuario.id, codigo }).returning({ id: campanhas.id });
  await banco.insert(membros).values({ campanhaId: nova.id, usuarioId: usuario.id });
  revalidatePath("/");
  redirect(`/campanha/${nova.id}`);
}

export async function entrarCampanha(_: EstadoCampanha, form: FormData): Promise<EstadoCampanha> {
  const usuario = await exigirUsuario();
  const codigo = String(form.get("codigo") ?? "").trim().toUpperCase();
  const banco = await db();
  const [campanha] = await banco.select({ id: campanhas.id }).from(campanhas).where(eq(campanhas.codigo, codigo));
  if (!campanha) return { erro: "Nenhuma campanha com esse código." };
  await banco.insert(membros).values({ campanhaId: campanha.id, usuarioId: usuario.id }).onConflictDoNothing();
  revalidatePath("/");
  redirect(`/campanha/${campanha.id}`);
}

/** Ao sair, as fichas do jogador deixam a campanha e voltam a ser particulares. */
export async function sairCampanha(campanhaId: string) {
  const usuario = await exigirUsuario();
  const banco = await db();
  const [campanha] = await banco.select({ mestreId: campanhas.mestreId }).from(campanhas).where(eq(campanhas.id, campanhaId));
  if (!campanha) redirect("/");
  if (campanha.mestreId === usuario.id) throw new Error("O Mestre não pode sair; exclua a campanha.");
  await banco.delete(membros).where(and(eq(membros.campanhaId, campanhaId), eq(membros.usuarioId, usuario.id)));
  await banco
    .update(fichas)
    .set({ campanhaId: null })
    .where(and(eq(fichas.campanhaId, campanhaId), eq(fichas.donoId, usuario.id)));
  revalidatePath("/", "layout");
  redirect("/");
}

/** O Mestre remove um jogador; as fichas dele voltam a ser particulares. */
export async function removerJogador(campanhaId: string, usuarioId: string) {
  const usuario = await exigirUsuario();
  const banco = await db();
  const [campanha] = await banco.select({ mestreId: campanhas.mestreId }).from(campanhas).where(eq(campanhas.id, campanhaId));
  if (!campanha || campanha.mestreId !== usuario.id || usuarioId === usuario.id) throw new Error("Sem permissão.");
  await banco.delete(membros).where(and(eq(membros.campanhaId, campanhaId), eq(membros.usuarioId, usuarioId)));
  await banco
    .update(fichas)
    .set({ campanhaId: null })
    .where(and(eq(fichas.campanhaId, campanhaId), eq(fichas.donoId, usuarioId)));
  revalidatePath("/", "layout");
}

export async function excluirCampanha(campanhaId: string) {
  const usuario = await exigirUsuario();
  const banco = await db();
  // As fichas não são apagadas: o banco apenas as desvincula (on delete set null).
  await banco.delete(campanhas).where(and(eq(campanhas.id, campanhaId), eq(campanhas.mestreId, usuario.id)));
  revalidatePath("/", "layout");
  redirect("/");
}
