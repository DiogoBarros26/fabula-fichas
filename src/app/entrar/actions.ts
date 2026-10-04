"use server";

import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { usuarios } from "@/db/schema";
import { conferirSenha, encerrarSessao, gerarHashSenha, iniciarSessao } from "@/lib/auth";

export type EstadoForm = { erro?: string };

const normalizarUsuario = (v: FormDataEntryValue | null) => String(v ?? "").trim().toLowerCase();

export async function entrar(_: EstadoForm, form: FormData): Promise<EstadoForm> {
  const usuario = normalizarUsuario(form.get("usuario"));
  const senha = String(form.get("senha") ?? "");
  const banco = await db();
  const [linha] = await banco.select().from(usuarios).where(eq(usuarios.usuario, usuario));
  if (!linha || !(await conferirSenha(senha, linha.senhaHash))) return { erro: "Usuário ou senha incorretos." };
  await iniciarSessao(linha.id);
  redirect("/");
}

export async function cadastrar(_: EstadoForm, form: FormData): Promise<EstadoForm> {
  const usuario = normalizarUsuario(form.get("usuario"));
  const nome = String(form.get("nome") ?? "").trim();
  const senha = String(form.get("senha") ?? "");
  const codigo = String(form.get("codigo") ?? "").trim();

  // Com CODIGO_GRUPO definido, só quem souber o código consegue criar conta.
  const codigoGrupo = process.env.CODIGO_GRUPO;
  if (codigoGrupo && codigo !== codigoGrupo) return { erro: "Código do grupo inválido." };
  if (!/^[a-z0-9_.-]{3,30}$/.test(usuario)) return { erro: "Usuário deve ter 3 a 30 caracteres: letras, números, ponto, hífen ou _." };
  if (!nome) return { erro: "Informe seu nome." };
  if (senha.length < 6) return { erro: "A senha precisa ter pelo menos 6 caracteres." };

  const banco = await db();
  const [existente] = await banco.select({ id: usuarios.id }).from(usuarios).where(eq(usuarios.usuario, usuario));
  if (existente) return { erro: "Esse usuário já existe." };

  const [novo] = await banco
    .insert(usuarios)
    .values({ usuario, nome, senhaHash: await gerarHashSenha(senha) })
    .returning({ id: usuarios.id });
  await iniciarSessao(novo.id);
  redirect("/");
}

export async function sair() {
  await encerrarSessao();
  redirect("/entrar");
}
