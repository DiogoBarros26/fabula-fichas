"use client";

// Estado da mesa no navegador. Fica fora dos componentes para sobreviver à navegação entre páginas
// (a música não para ao abrir outra ficha da mesma campanha).
import { useSyncExternalStore } from "react";
import type { PedidoRolagem, Rolagem } from "@/lib/dados";
import type { EstadoMesa } from "@/lib/mesa";
import { apagarRolagens as apagarNoServidor, invocarLaco as invocarNoServidor, rolar as rolarNoServidor } from "@/app/mesa/actions";
import type { Laco } from "@/lib/regras";

/** A ficha aberta no editor (se o usuário pode editá-la): permite invocar os Laços dela nas rolagens. */
export type FichaAberta = { id: string; lacos: Laco[]; pontosFabula: number; aoGastarPonto: (restantes: number) => void };

export type CampanhaMesa = { id: string; nome: string };

type Estado = {
  campanha: CampanhaMesa | null;
  servidor: EstadoMesa | null;
  /** Diferença entre o relógio do servidor e o deste navegador (ms). */
  defasagem: number;
  rolagens: Rolagem[];
  /** Rolagens recém-chegadas, mostradas como aviso no canto da tela. */
  avisos: Rolagem[];
  secreta: boolean;
  /** Navegadores só tocam som depois de um clique; até lá a música fica em espera. */
  somAtivo: boolean;
  volume: number;
  /** Faixa que o navegador não conseguiu tocar (ex.: vídeo que não permite ser incorporado). */
  faixaComErro: string | null;
  fichaAberta: FichaAberta | null;
};

function volumeSalvo() {
  try {
    const v = Number(localStorage.getItem("mesa-volume"));
    return localStorage.getItem("mesa-volume") !== null && v >= 0 && v <= 1 ? v : 0.6;
  } catch {
    return 0.6;
  }
}

let estado: Estado = {
  campanha: null,
  servidor: null,
  defasagem: 0,
  rolagens: [],
  avisos: [],
  secreta: false,
  somAtivo: false,
  volume: typeof window === "undefined" ? 0.6 : volumeSalvo(),
  faixaComErro: null,
  fichaAberta: null,
};
const ouvintes = new Set<() => void>();
let idLocal = -1;

function mudar(parcial: Partial<Estado>) {
  estado = { ...estado, ...parcial };
  ouvintes.forEach((o) => o());
}

export function useMesa() {
  return useSyncExternalStore(
    (o) => {
      ouvintes.add(o);
      return () => ouvintes.delete(o);
    },
    () => estado,
    () => estado,
  );
}

export const lerMesa = () => estado;

export function entrarNaMesa(campanha: CampanhaMesa) {
  if (estado.campanha?.id === campanha.id) {
    if (estado.campanha.nome !== campanha.nome) mudar({ campanha });
    return;
  }
  mudar({ campanha, servidor: null, rolagens: [], avisos: [] });
}

let usuarioDaMesa: string | null = null;
export function trocarUsuario(usuarioId: string) {
  if (usuarioDaMesa && usuarioDaMesa !== usuarioId) sairDaMesa();
  usuarioDaMesa = usuarioId;
}

export function sairDaMesa() {
  mudar({ campanha: null, servidor: null, rolagens: [], avisos: [], somAtivo: false });
}

/** Junta rolagens novas ao histórico. "avisar" = mostrar no canto (não na primeira carga). */
export function receberRolagens(novas: Rolagem[], avisar: boolean) {
  const conhecidas = new Set(estado.rolagens.map((r) => r.id));
  const ineditas = novas.filter((r) => !conhecidas.has(r.id));
  if (!ineditas.length) return;
  mudar({
    rolagens: [...estado.rolagens, ...ineditas].slice(-60),
    avisos: avisar ? [...estado.avisos, ...ineditas].slice(-4) : estado.avisos,
  });
}

/** Tira do histórico as rolagens entre "de" e "ate" que o servidor não tem mais (apagadas pelo Mestre). */
export function conferirExistentes(de: number, ate: number, existentes: number[]) {
  const ainda = new Set(existentes);
  const apagada = (r: Rolagem) => r.id >= de && r.id <= ate && !ainda.has(r.id);
  if (!de || !estado.rolagens.some(apagada)) return;
  mudar({ rolagens: estado.rolagens.filter((r) => !apagada(r)), avisos: estado.avisos.filter((r) => !apagada(r)) });
}

/** Só o Mestre: apaga na hora para ele e grava no servidor (os outros veem na próxima atualização). */
export async function apagarRolagens(ids: number[] | "todas") {
  const campanha = estado.campanha;
  if (!campanha) return;
  const sai = (r: Rolagem) => r.id > 0 && (ids === "todas" || ids.includes(r.id));
  mudar({ rolagens: estado.rolagens.filter((r) => !sai(r)), avisos: estado.avisos.filter((r) => !sai(r)) });
  await apagarNoServidor(campanha.id, ids);
}

export function definirFichaAberta(fichaAberta: FichaAberta | null) {
  mudar({ fichaAberta });
}

/** Põe na rolagem o resultado novo (com o Laço), no histórico e no aviso do canto. */
function trocarResultado(id: number, mudar_: (r: Rolagem) => Rolagem) {
  const troca = (lista: Rolagem[]) => lista.map((r) => (r.id === id ? mudar_(r) : r));
  mudar({ rolagens: troca(estado.rolagens), avisos: troca(estado.avisos) });
}

/** Gasta 1 Ponto de Fábula da ficha e soma a força do Laço ao teste. */
export async function invocarLaco(r: Rolagem, indiceLaco: number) {
  const ficha = estado.fichaAberta;
  if (!ficha || ficha.id !== r.fichaId) return;
  const resp = await invocarNoServidor(ficha.id, indiceLaco, Math.max(0, r.id));
  ficha.aoGastarPonto(resp.pontosFabula);
  trocarResultado(r.id, (x) => ({
    ...x,
    resultado: resp.resultado ?? { ...x.resultado, laco: resp.laco, total: x.resultado.total + resp.laco.forca },
  }));
}

/** Laços invocados por outras pessoas chegam pela atualização da mesa. */
export function aplicarInvocacoes(invocacoes: { id: number; laco: { nome: string; forca: number }; total: number }[]) {
  for (const { id, laco, total } of invocacoes) {
    const r = estado.rolagens.find((x) => x.id === id);
    if (r && !r.resultado.laco) trocarResultado(id, (x) => ({ ...x, resultado: { ...x.resultado, laco, total } }));
  }
}

export function dispensarAviso(id: number) {
  mudar({ avisos: estado.avisos.filter((r) => r.id !== id) });
}

export function atualizarServidor(servidor: EstadoMesa, defasagem: number) {
  mudar({ servidor, defasagem });
}

export function definirSecreta(secreta: boolean) {
  mudar({ secreta });
}

export function definirSom(somAtivo: boolean) {
  mudar({ somAtivo });
}

export function marcarErroFaixa(faixaComErro: string | null) {
  if (estado.faixaComErro !== faixaComErro) mudar({ faixaComErro });
}

export function definirVolume(volume: number) {
  mudar({ volume });
  try {
    localStorage.setItem("mesa-volume", String(volume));
  } catch {}
}

/** Rola pela ficha (em nome do personagem) ou pela campanha atual (em nome do usuário). */
export async function rolar(pedido: PedidoRolagem, fichaId?: string) {
  const r = await rolarNoServidor(pedido, { fichaId, campanhaId: fichaId ? undefined : estado.campanha?.id, secreta: estado.secreta });
  // Fichas particulares não vão para o banco: ganham um id local negativo.
  receberRolagens([r.id ? r : { ...r, id: idLocal-- }], true);
  return r;
}
