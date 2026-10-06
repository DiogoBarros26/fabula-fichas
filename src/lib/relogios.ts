// Regras dos Relógios (livro básico, p.52-55). Puro: usado no navegador para sugerir quantas seções mexer.
import type { TipoRelogio } from "@/db/schema";

export const TIPOS: Record<TipoRelogio, { nome: string; dica: string }> = {
  progresso: { nome: "Progresso", dica: "Os heróis enchem com testes bem-sucedidos para cumprir um objetivo." },
  ameaca: { nome: "Ameaça", dica: "Enche com falhas e eventos; quando completa, o perigo acontece. 8 seções: distante · 6: provável · 4: urgente." },
  tempo: { nome: "Prazo", dica: "Rastreador de tempo: não avança por testes, só com a passagem do tempo e os eventos da história." },
};

export const TAMANHOS = [4, 6, 8, 10, 12];

/**
 * Seções que um teste move num Relógio:
 * 1 pelo sucesso (ou pela falha), +1 se a diferença para a Dificuldade for 3 ou mais, +2 se for 6 ou mais.
 * Crítico é sempre sucesso e falha crítica é sempre falha; a oportunidade pode ser gasta para mais 2 seções.
 */
export function secoesDoTeste(total: number, dificuldade: number, critico: boolean, falhaCritica: boolean, gastarOportunidade: boolean) {
  const sucesso = critico || (!falhaCritica && total >= dificuldade);
  const margem = Math.abs(total - dificuldade);
  let secoes = 1 + (margem >= 6 ? 2 : margem >= 3 ? 1 : 0);
  // Um crítico que não alcança a Dificuldade ainda é sucesso, mas a margem dele não conta.
  if (sucesso !== total >= dificuldade) secoes = 1;
  if ((critico || falhaCritica) && gastarOportunidade) secoes += 2;
  return { sucesso, margem: total - dificuldade, secoes };
}
