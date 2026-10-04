"use server";

import { randomInt } from "node:crypto";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { faixas, musicaCampanha, rolagens } from "@/db/schema";
import { exigirUsuario } from "@/lib/auth";
import { resolver, validarPedido, type PedidoRolagem, type Rolagem } from "@/lib/dados";
import { apagarArquivos, ehArquivoDoBlob } from "@/lib/mesa";
import { tipoDoLink, tituloPadrao } from "@/lib/musica";
import { acessoFicha, papelNaCampanha } from "@/lib/permissoes";

/**
 * Rola os dados no servidor. Com ficha: rola em nome do personagem (dono ou Mestre).
 * Sem ficha: rola em nome do usuário, na campanha indicada.
 * Só fica no histórico se houver campanha; fichas particulares rolam só para quem clicou.
 */
export async function rolar(pedido: PedidoRolagem, origem: { fichaId?: string; campanhaId?: string; secreta?: boolean }): Promise<Rolagem> {
  const usuario = await exigirUsuario();
  const valido = validarPedido(pedido);
  if (!valido) throw new Error("Rolagem inválida.");

  let campanhaId: string | null = null;
  let autor = usuario.nome;
  let fichaId: string | null = null;
  if (origem.fichaId) {
    const acesso = await acessoFicha(origem.fichaId, usuario.id);
    if (!acesso?.podeEditar) throw new Error("Sem permissão para rolar por esta ficha.");
    campanhaId = acesso.ficha.campanhaId;
    autor = acesso.ficha.dados.nome || "Sem nome";
    fichaId = origem.fichaId;
  } else if (origem.campanhaId) {
    if (!(await papelNaCampanha(origem.campanhaId, usuario.id))) throw new Error("Você não participa dessa campanha.");
    campanhaId = origem.campanhaId;
  }

  const resultado = resolver(valido, (faces) => randomInt(1, faces + 1));
  const secreta = !!origem.secreta;
  if (!campanhaId) return { id: 0, autor, secreta, resultado, criadoEm: new Date().toISOString() };

  const banco = await db();
  const [nova] = await banco
    .insert(rolagens)
    .values({ campanhaId, usuarioId: usuario.id, fichaId, autor, secreta, resultado })
    .returning({ id: rolagens.id, criadoEm: rolagens.criadoEm });
  return { id: nova.id, autor, secreta, resultado, criadoEm: nova.criadoEm.toISOString() };
}

async function exigirMestre(campanhaId: string) {
  const usuario = await exigirUsuario();
  const papel = await papelNaCampanha(campanhaId, usuario.id);
  if (!papel?.ehMestre) throw new Error("Só o Mestre controla a música.");
}

export async function adicionarFaixa(campanhaId: string, url: string, titulo: string) {
  await exigirMestre(campanhaId);
  url = url.trim();
  const tipo = ehArquivoDoBlob(url) ? "arquivo" : tipoDoLink(url);
  if (!tipo) throw new Error("Link inválido. Use um link do YouTube ou de um arquivo de áudio.");
  titulo = titulo.trim() || (tipo === "youtube" && (await tituloYoutube(url))) || tituloPadrao(url);
  const banco = await db();
  await banco.insert(faixas).values({ campanhaId, url, tipo, titulo: titulo.slice(0, 120) });
}

/** Título do vídeo pelo oEmbed público do YouTube (sem chave de API). */
async function tituloYoutube(url: string) {
  try {
    const resp = await fetch(`https://www.youtube.com/oembed?format=json&url=${encodeURIComponent(url)}`, { signal: AbortSignal.timeout(4000) });
    return resp.ok ? String(((await resp.json()) as { title?: string }).title ?? "") : "";
  } catch {
    return "";
  }
}

export async function removerFaixa(campanhaId: string, faixaId: string) {
  await exigirMestre(campanhaId);
  const banco = await db();
  const apagadas = await banco
    .delete(faixas)
    .where(and(eq(faixas.id, faixaId), eq(faixas.campanhaId, campanhaId)))
    .returning({ url: faixas.url, tipo: faixas.tipo });
  await apagarArquivos(apagadas.filter((f) => f.tipo === "arquivo").map((f) => f.url));
}

/** O Mestre muda o que está tocando; os jogadores acompanham pela próxima atualização. */
export async function controlarMusica(
  campanhaId: string,
  estado: { faixaId: string | null; tocando: boolean; posicao: number; repetir: boolean },
) {
  await exigirMestre(campanhaId);
  const banco = await db();
  if (estado.faixaId) {
    const [faixa] = await banco
      .select({ id: faixas.id })
      .from(faixas)
      .where(and(eq(faixas.id, estado.faixaId), eq(faixas.campanhaId, campanhaId)));
    if (!faixa) throw new Error("Faixa não encontrada.");
  }
  const valores = {
    faixaId: estado.faixaId,
    tocando: !!estado.tocando && !!estado.faixaId,
    posicao: Math.max(0, Number(estado.posicao) || 0),
    repetir: !!estado.repetir,
    atualizadoEm: new Date(),
  };
  await banco
    .insert(musicaCampanha)
    .values({ campanhaId, ...valores })
    .onConflictDoUpdate({ target: musicaCampanha.campanhaId, set: valores });
}
