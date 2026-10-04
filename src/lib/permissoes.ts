import "server-only";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { campanhas, fichas, membros, usuarios } from "@/db/schema";

/**
 * Regras de acesso a uma ficha:
 * - o dono sempre vê e edita;
 * - o Mestre da campanha da ficha vê e edita (mesmo oculta);
 * - os demais membros da campanha só veem, e apenas se a ficha estiver visível.
 */
export async function acessoFicha(fichaId: string, usuarioId: string) {
  const banco = await db();
  const [linha] = await banco
    .select({ ficha: fichas, mestreId: campanhas.mestreId, membro: membros.usuarioId })
    .from(fichas)
    .leftJoin(campanhas, eq(fichas.campanhaId, campanhas.id))
    .leftJoin(membros, and(eq(membros.campanhaId, fichas.campanhaId), eq(membros.usuarioId, usuarioId)))
    .where(eq(fichas.id, fichaId));
  if (!linha) return null;

  const ehDono = linha.ficha.donoId === usuarioId;
  const ehMestre = linha.mestreId === usuarioId;
  const podeVer = ehDono || ehMestre || (!!linha.membro && linha.ficha.visivel);
  return { ficha: linha.ficha, ehDono, ehMestre, podeVer, podeEditar: ehDono || ehMestre };
}

export async function ehMembro(campanhaId: string, usuarioId: string) {
  const banco = await db();
  const [linha] = await banco
    .select({ id: membros.usuarioId })
    .from(membros)
    .where(and(eq(membros.campanhaId, campanhaId), eq(membros.usuarioId, usuarioId)));
  return !!linha;
}

/** Campanhas de que o usuário participa (como Mestre ou jogador). */
export async function minhasCampanhas(usuarioId: string) {
  const banco = await db();
  return banco
    .select({ id: campanhas.id, nome: campanhas.nome, mestreId: campanhas.mestreId, mestreNome: usuarios.nome })
    .from(membros)
    .innerJoin(campanhas, eq(membros.campanhaId, campanhas.id))
    .innerJoin(usuarios, eq(campanhas.mestreId, usuarios.id))
    .where(eq(membros.usuarioId, usuarioId))
    .orderBy(campanhas.nome);
}
