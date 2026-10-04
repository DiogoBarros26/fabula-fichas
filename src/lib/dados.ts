// Rolagens de dados. O pedido sai do navegador, mas os números são sorteados no servidor.
import { ATRIBUTOS, type AtributoId } from "./regras";

export const FACES_LIVRES = [4, 6, 8, 10, 12, 20] as const;

/** "teste": 2 ou mais dados, com Resultado Alto e crítico (regras de Fabula Ultima). "livre": soma simples. */
export type PedidoRolagem = {
  rotulo: string;
  tipo: "teste" | "livre";
  dados: { faces: number; rotulo?: string }[];
  bonus: number;
  /** Para armas: dano = Resultado Alto + base. */
  dano?: { base: number; tipo: string };
};

export type ResultadoRolagem = {
  rotulo: string;
  tipo: "teste" | "livre";
  dados: { faces: number; valor: number; rotulo?: string }[];
  bonus: number;
  total: number;
  /** Resultado Alto: o maior dado do teste. */
  ra?: number;
  critico?: boolean;
  falha?: boolean;
  dano?: { total: number; tipo: string };
};

export type Rolagem = {
  id: number;
  autor: string;
  secreta: boolean;
  resultado: ResultadoRolagem;
  criadoEm: string;
};

/** Valida o pedido vindo do navegador; devolve null se algo estiver fora do esperado. */
export function validarPedido(p: PedidoRolagem): PedidoRolagem | null {
  if (!p || (p.tipo !== "teste" && p.tipo !== "livre")) return null;
  if (!Array.isArray(p.dados) || p.dados.length < 1 || p.dados.length > 10) return null;
  if (p.tipo === "teste" && p.dados.length < 2) return null;
  const facesOk = p.dados.every((d) => [4, 6, 8, 10, 12, 20, 100].includes(d.faces));
  const bonus = Math.trunc(Number(p.bonus) || 0);
  if (!facesOk || Math.abs(bonus) > 99) return null;
  const base = Math.trunc(Number(p.dano?.base) || 0);
  return {
    rotulo: String(p.rotulo ?? "").slice(0, 80),
    tipo: p.tipo,
    dados: p.dados.map((d) => ({ faces: d.faces, rotulo: d.rotulo ? String(d.rotulo).slice(0, 10) : undefined })),
    bonus,
    dano: p.dano && Math.abs(base) <= 99 ? { base, tipo: String(p.dano.tipo ?? "").slice(0, 20) } : undefined,
  };
}

export function resolver(p: PedidoRolagem, sortear: (faces: number) => number): ResultadoRolagem {
  const dados = p.dados.map((d) => ({ ...d, valor: sortear(d.faces) }));
  const soma = dados.reduce((t, d) => t + d.valor, 0);
  const resultado: ResultadoRolagem = { rotulo: p.rotulo, tipo: p.tipo, dados, bonus: p.bonus, total: soma + p.bonus };
  if (p.tipo === "teste") {
    // Com 2 dados é a regra do livro; com mais, basta um par de dados iguais.
    const valores = dados.map((d) => d.valor);
    const repetidos = valores.filter((v, i) => valores.indexOf(v) !== i);
    resultado.ra = Math.max(...valores);
    resultado.falha = repetidos.includes(1);
    resultado.critico = !resultado.falha && repetidos.some((v) => v >= 6);
    if (p.dano) resultado.dano = { total: resultado.ra + p.dano.base, tipo: p.dano.tipo };
  }
  return resultado;
}

const SIGLAS = Object.fromEntries(ATRIBUTOS.map((a) => [a.sigla, a.id])) as Record<string, AtributoId>;

/** Lê textos como "DES + AST +1" (precisão de arma). */
export function lerPrecisao(texto: string): { atributos: [AtributoId, AtributoId]; bonus: number } | null {
  const m = texto.toUpperCase().match(/【?\s*(DES|AST|VIG|VON)\s*\+\s*(DES|AST|VIG|VON)\s*】?\s*([+-]\s*\d+)?/);
  if (!m) return null;
  return { atributos: [SIGLAS[m[1]], SIGLAS[m[2]]], bonus: m[3] ? Number(m[3].replace(/\s/g, "")) : 0 };
}

/** Lê textos como "RA + 6 físico". */
export function lerDano(texto: string): { base: number; tipo: string } | null {
  const m = texto.match(/(?:RA|HR)\s*(?:\+\s*(\d+))?\s*(.*)/i);
  if (!m) return null;
  return { base: Number(m[1] ?? 0), tipo: m[2].trim() };
}

export function descreverDados(r: ResultadoRolagem) {
  return r.dados.map((d) => `${d.rotulo ? d.rotulo + " " : ""}d${d.faces}`).join(" + ") + (r.bonus ? ` ${r.bonus > 0 ? "+" : "−"} ${Math.abs(r.bonus)}` : "");
}
