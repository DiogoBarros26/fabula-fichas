"use server";

import { randomInt } from "node:crypto";
import { and, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import { faixas, fichas, musicaCampanha, rolagens } from "@/db/schema";
import { exigirUsuario } from "@/lib/auth";
import { resolver, validarPedido, type PedidoRolagem, type ResultadoRolagem, type Rolagem } from "@/lib/dados";
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
  if (!campanhaId) return { id: 0, fichaId, autor, secreta, resultado, criadoEm: new Date().toISOString() };

  const banco = await db();
  const [nova] = await banco
    .insert(rolagens)
    .values({ campanhaId, usuarioId: usuario.id, fichaId, autor, secreta, resultado })
    .returning({ id: rolagens.id, criadoEm: rolagens.criadoEm });
  return { id: nova.id, fichaId, autor, secreta, resultado, criadoEm: nova.criadoEm.toISOString() };
}

/**
 * Invoca um Laço depois de um teste: gasta 1 Ponto de Fábula da ficha e soma a força do Laço ao resultado.
 * Uma vez por teste; não vale em crítico nem em falha crítica (o resultado já está decidido).
 * rolagemId 0 = rolagem de ficha particular, que não fica no banco: só o ponto é gasto aqui.
 */
export async function invocarLaco(fichaId: string, indiceLaco: number, rolagemId: number) {
  const usuario = await exigirUsuario();
  const acesso = await acessoFicha(fichaId, usuario.id);
  if (!acesso?.podeEditar) throw new Error("Sem permissão para usar esta ficha.");
  const dados = acesso.ficha.dados;
  const laco = dados.lacos?.[indiceLaco];
  const forca = Math.min(3, laco?.emocoes.length ?? 0);
  if (!laco || !forca) throw new Error("Esse Laço não tem nenhuma emoção marcada.");

  const banco = await db();
  const invocado = { nome: laco.nome || "Laço sem nome", forca };
  // Numa transação, com as condições no próprio UPDATE: um clique duplo não gasta dois pontos.
  return banco.transaction(async (tx) => {
    const [ficha] = await tx
      .update(fichas)
      .set({
        dados: sql`jsonb_set(${fichas.dados}, '{pontosFabula}', to_jsonb((${fichas.dados} ->> 'pontosFabula')::int - 1))`,
        atualizadoEm: new Date(),
      })
      .where(and(eq(fichas.id, fichaId), sql`(${fichas.dados} ->> 'pontosFabula')::int >= 1`))
      .returning({ dados: fichas.dados });
    if (!ficha) throw new Error("Sem Pontos de Fábula.");

    let resultado: ResultadoRolagem | null = null;
    if (rolagemId > 0) {
      const [rolagem] = await tx
        .select({ resultado: rolagens.resultado })
        .from(rolagens)
        .where(and(eq(rolagens.id, rolagemId), eq(rolagens.fichaId, fichaId)))
        .for("update");
      const r = rolagem?.resultado;
      if (!r || r.tipo !== "teste") throw new Error("Só dá para invocar um Laço num teste desta ficha.");
      if (r.laco) throw new Error("Já foi invocado um Laço neste teste.");
      if (r.critico || r.falha) throw new Error("Crítico e falha crítica já decidem o teste.");
      resultado = { ...r, laco: invocado, total: r.total + forca };
      await tx.update(rolagens).set({ resultado }).where(eq(rolagens.id, rolagemId));
    }
    return { laco: invocado, pontosFabula: ficha.dados.pontosFabula, resultado };
  });
}

async function exigirMestre(campanhaId: string) {
  const usuario = await exigirUsuario();
  const papel = await papelNaCampanha(campanhaId, usuario.id);
  if (!papel?.ehMestre) throw new Error("Só o Mestre pode fazer isso.");
}

/** O Mestre apaga rolagens do histórico (algumas ou todas); some para todos na próxima atualização. */
export async function apagarRolagens(campanhaId: string, ids: number[] | "todas") {
  await exigirMestre(campanhaId);
  const banco = await db();
  const daCampanha = eq(rolagens.campanhaId, campanhaId);
  if (ids === "todas") await banco.delete(rolagens).where(daCampanha);
  else if (ids.length) await banco.delete(rolagens).where(and(daCampanha, inArray(rolagens.id, ids.slice(0, 200).map(Number))));
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
