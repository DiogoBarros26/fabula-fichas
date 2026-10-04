"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { fichas } from "@/db/schema";
import { exigirUsuario } from "@/lib/auth";
import { acessoFicha, ehMembro } from "@/lib/permissoes";
import { fichaNova, type Ficha } from "@/lib/regras";

async function exigirAcesso(id: string, apenasDono = false) {
  const usuario = await exigirUsuario();
  const acesso = await acessoFicha(id, usuario.id);
  if (!acesso || !(apenasDono ? acesso.ehDono : acesso.podeEditar)) throw new Error("Sem permissão para alterar esta ficha.");
  return acesso;
}

export async function criarFicha(campanhaId?: string) {
  const usuario = await exigirUsuario();
  if (campanhaId && !(await ehMembro(campanhaId, usuario.id))) throw new Error("Você não participa dessa campanha.");
  const banco = await db();
  const dados = { ...fichaNova(), jogador: usuario.nome };
  const [nova] = await banco
    .insert(fichas)
    .values({ donoId: usuario.id, campanhaId: campanhaId ?? null, dados })
    .returning({ id: fichas.id });
  revalidatePath("/");
  redirect(`/ficha/${nova.id}`);
}

export async function salvarFicha(id: string, dados: Ficha) {
  await exigirAcesso(id);
  const banco = await db();
  await banco.update(fichas).set({ dados, atualizadoEm: new Date() }).where(eq(fichas.id, id));
  revalidatePath("/");
}

/** Só o dono decide em que campanha a ficha fica e se ela está à mostra. */
export async function definirCampanhaFicha(id: string, campanhaId: string | null) {
  const usuario = await exigirUsuario();
  await exigirAcesso(id, true);
  if (campanhaId && !(await ehMembro(campanhaId, usuario.id))) throw new Error("Você não participa dessa campanha.");
  const banco = await db();
  await banco.update(fichas).set({ campanhaId }).where(eq(fichas.id, id));
  revalidatePath("/", "layout");
}

export async function definirVisibilidade(id: string, visivel: boolean) {
  await exigirAcesso(id, true);
  const banco = await db();
  await banco.update(fichas).set({ visivel }).where(eq(fichas.id, id));
  revalidatePath("/", "layout");
}

export async function excluirFicha(id: string) {
  await exigirAcesso(id, true);
  const banco = await db();
  await banco.delete(fichas).where(eq(fichas.id, id));
  revalidatePath("/", "layout");
  redirect("/");
}
