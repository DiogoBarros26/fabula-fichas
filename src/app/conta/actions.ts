"use server";

import { eq } from "drizzle-orm";
import { db } from "@/db";
import { sessoes, usuarios } from "@/db/schema";
import { conferirSenha, exigirUsuario, gerarHashSenha, iniciarSessao } from "@/lib/auth";

export type EstadoSenha = { erro?: string; ok?: boolean };

export async function alterarSenha(_: EstadoSenha, form: FormData): Promise<EstadoSenha> {
  const usuario = await exigirUsuario();
  const atual = String(form.get("atual") ?? "");
  const nova = String(form.get("nova") ?? "");
  const confirmacao = String(form.get("confirmacao") ?? "");

  if (nova.length < 8) return { erro: "A nova senha precisa ter pelo menos 8 caracteres." };
  if (nova !== confirmacao) return { erro: "A confirmação não é igual à nova senha." };
  if (nova === atual) return { erro: "A nova senha precisa ser diferente da atual." };

  const banco = await db();
  const [linha] = await banco.select({ senhaHash: usuarios.senhaHash }).from(usuarios).where(eq(usuarios.id, usuario.id));
  if (!linha || !(await conferirSenha(atual, linha.senhaHash))) return { erro: "A senha atual está incorreta." };

  await banco.update(usuarios).set({ senhaHash: await gerarHashSenha(nova) }).where(eq(usuarios.id, usuario.id));
  // Desconecta todos os outros aparelhos e mantém este logado com uma sessão nova.
  await banco.delete(sessoes).where(eq(sessoes.usuarioId, usuario.id));
  await iniciarSessao(usuario.id);
  return { ok: true };
}
