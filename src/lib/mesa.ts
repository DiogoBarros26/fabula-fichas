import "server-only";
import { and, asc, desc, eq, gt, gte, or } from "drizzle-orm";
import { del } from "@vercel/blob";
import { db } from "@/db";
import { faixas, musicaCampanha, rolagens, type TipoFaixa } from "@/db/schema";
import type { Rolagem } from "./dados";

export type Faixa = { id: string; titulo: string; url: string; tipo: TipoFaixa };
export type EstadoMusica = { faixaId: string | null; tocando: boolean; posicao: number; repetir: boolean; atualizadoEm: number };
export type EstadoMesa = {
  agora: number;
  ehMestre: boolean;
  rolagens: Rolagem[];
  /** Ids que ainda existem a partir de "de": o que sumir daqui foi apagado pelo Mestre. */
  existentes: number[];
  faixas: Faixa[];
  musica: EstadoMusica;
};

/** Tudo que a mesa precisa a cada atualização: rolagens novas (depois de "desde"), playlist e o que está tocando. */
export async function estadoMesa(campanhaId: string, usuarioId: string, ehMestre: boolean, desde: number, de: number): Promise<EstadoMesa> {
  const banco = await db();
  // Rolagens secretas só aparecem para quem rolou e para o Mestre.
  const visiveis = ehMestre ? undefined : or(eq(rolagens.secreta, false), eq(rolagens.usuarioId, usuarioId));
  const linhas = await banco
    .select({ id: rolagens.id, autor: rolagens.autor, secreta: rolagens.secreta, resultado: rolagens.resultado, criadoEm: rolagens.criadoEm })
    .from(rolagens)
    .where(and(eq(rolagens.campanhaId, campanhaId), gt(rolagens.id, desde), visiveis))
    .orderBy(desc(rolagens.id))
    .limit(40);

  const existentes = de
    ? await banco
        .select({ id: rolagens.id })
        .from(rolagens)
        .where(and(eq(rolagens.campanhaId, campanhaId), gte(rolagens.id, de), visiveis))
        .limit(500)
    : [];

  const lista = await banco
    .select({ id: faixas.id, titulo: faixas.titulo, url: faixas.url, tipo: faixas.tipo })
    .from(faixas)
    .where(eq(faixas.campanhaId, campanhaId))
    .orderBy(asc(faixas.criadoEm));

  const [musica] = await banco.select().from(musicaCampanha).where(eq(musicaCampanha.campanhaId, campanhaId));

  return {
    agora: Date.now(),
    ehMestre,
    rolagens: linhas.reverse().map((r) => ({ ...r, criadoEm: r.criadoEm.toISOString() })),
    existentes: existentes.map((r) => r.id),
    faixas: lista,
    musica: musica
      ? { faixaId: musica.faixaId, tocando: musica.tocando, posicao: musica.posicao, repetir: musica.repetir, atualizadoEm: musica.atualizadoEm.getTime() }
      : { faixaId: null, tocando: false, posicao: 0, repetir: true, atualizadoEm: 0 },
  };
}

/** MP3 enviados ficam no Vercel Blob; só aceitamos URLs da nossa própria loja. */
export function ehArquivoDoBlob(url: string) {
  try {
    const u = new URL(url);
    return u.protocol === "https:" && u.hostname.endsWith(".public.blob.vercel-storage.com");
  } catch {
    return false;
  }
}

export async function apagarArquivos(urls: string[]) {
  const doBlob = urls.filter(ehArquivoDoBlob);
  if (doBlob.length && process.env.BLOB_READ_WRITE_TOKEN) await del(doBlob).catch(() => {});
}
