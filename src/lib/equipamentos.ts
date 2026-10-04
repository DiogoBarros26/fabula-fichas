// Armas, armaduras e escudos básicos do livro (equipamento inicial).
// "RA" = Resultado Alto: o maior dos dois dados do Teste de Precisão.

export type ArmaCatalogo = {
  id: string;
  nome: string;
  categoria: string;
  custo: number;
  precisao: string;
  dano: string;
  maos: 1 | 2;
  alcance: "Corpo a corpo" | "À distância";
  marcial: boolean;
  qualidade?: string;
};

const arma = (
  id: string,
  nome: string,
  categoria: string,
  custo: number,
  precisao: string,
  dano: number,
  maos: 1 | 2,
  distancia: boolean,
  marcial: boolean,
  qualidade?: string,
): ArmaCatalogo => ({
  id,
  nome,
  categoria,
  custo,
  precisao,
  dano: `RA + ${dano} físico`,
  maos,
  alcance: distancia ? "À distância" : "Corpo a corpo",
  marcial,
  qualidade,
});

export const ARMAS: ArmaCatalogo[] = [
  arma("cajado", "Cajado", "Arcana", 100, "VON + VON", 6, 2, false, false),
  arma("tomo", "Tomo", "Arcana", 100, "AST + AST", 6, 2, false, false),
  arma("balestra", "Balestra", "Arco", 150, "DES + AST", 8, 2, true, false),
  arma("arco-curto", "Arco Curto", "Arco", 200, "DES + DES", 8, 2, true, false),
  arma("desarmado", "Ataque Desarmado", "Briga", 0, "DES + VIG", 0, 1, false, false, "Ocupa automaticamente cada mão vazia."),
  arma("improvisado", "Arma Improvisada", "Briga", 0, "DES + VIG", 2, 1, false, false, "Quebra depois do ataque."),
  arma("punho-de-ferro", "Punho de Ferro", "Briga", 150, "DES + VIG", 6, 1, false, false),
  arma("adaga-de-aco", "Adaga de Aço", "Adaga", 150, "DES + AST +1", 4, 1, false, false),
  arma("pistola", "Pistola", "Arma de Fogo", 250, "DES + AST", 8, 1, true, true),
  arma("chicote-corrente", "Chicote de Corrente", "Mangual", 150, "DES + DES", 8, 2, false, false),
  arma("martelo-de-ferro", "Martelo de Ferro", "Pesada", 200, "VIG + VIG", 6, 1, false, false),
  arma("machado-largo", "Machado Largo", "Pesada", 250, "VIG + VIG", 10, 1, false, true),
  arma("machado-de-guerra", "Machado de Guerra", "Pesada", 250, "VIG + VIG", 14, 2, false, true),
  arma("lanca-leve", "Lança Leve", "Lança", 200, "DES + VIG", 8, 1, false, true),
  arma("lanca-pesada", "Lança Pesada", "Lança", 200, "DES + VIG", 12, 2, false, true),
  arma("espada-de-bronze", "Espada de Bronze", "Espada", 200, "DES + VIG +1", 6, 1, false, true),
  arma("montante", "Montante", "Espada", 200, "DES + VIG +1", 10, 2, false, true),
  arma("katana", "Katana", "Espada", 200, "DES + AST +1", 10, 2, false, true),
  arma("florete", "Florete", "Espada", 200, "DES + AST +1", 6, 1, false, true),
  arma("shuriken", "Shuriken", "Arremesso", 150, "DES + AST", 4, 1, true, false),
];

export type ArmaduraCatalogo = {
  id: string;
  nome: string;
  custo: number;
  /** Defesa fixa (armaduras marciais ignoram a DES); null = dado de DES + bônus. */
  defesaFixa: number | null;
  defesa: number;
  defesaMagica: number;
  iniciativa: number;
  marcial: boolean;
};

export const ARMADURAS: ArmaduraCatalogo[] = [
  { id: "camisa-de-seda", nome: "Camisa de Seda", custo: 100, defesaFixa: null, defesa: 0, defesaMagica: 2, iniciativa: -1, marcial: false },
  { id: "traje-de-viagem", nome: "Traje de Viagem", custo: 100, defesaFixa: null, defesa: 1, defesaMagica: 1, iniciativa: -1, marcial: false },
  { id: "tunica-de-combate", nome: "Túnica de Combate", custo: 150, defesaFixa: null, defesa: 1, defesaMagica: 1, iniciativa: 0, marcial: false },
  { id: "manto-do-sabio", nome: "Manto do Sábio", custo: 200, defesaFixa: null, defesa: 1, defesaMagica: 2, iniciativa: -2, marcial: false },
  { id: "brigandina", nome: "Brigandina", custo: 150, defesaFixa: 10, defesa: 0, defesaMagica: 0, iniciativa: -2, marcial: true },
  { id: "placa-de-bronze", nome: "Placa de Bronze", custo: 200, defesaFixa: 11, defesa: 0, defesaMagica: 0, iniciativa: -3, marcial: true },
  { id: "placa-runica", nome: "Placa Rúnica", custo: 250, defesaFixa: 11, defesa: 0, defesaMagica: 1, iniciativa: -3, marcial: true },
  { id: "placa-de-aco", nome: "Placa de Aço", custo: 300, defesaFixa: 12, defesa: 0, defesaMagica: 0, iniciativa: -4, marcial: true },
];

export type EscudoCatalogo = { id: string; nome: string; custo: number; defesa: number; defesaMagica: number; marcial: boolean };

export const ESCUDOS: EscudoCatalogo[] = [
  { id: "escudo-de-bronze", nome: "Escudo de Bronze", custo: 100, defesa: 2, defesaMagica: 0, marcial: false },
  { id: "escudo-runico", nome: "Escudo Rúnico", custo: 150, defesa: 2, defesaMagica: 2, marcial: true },
];
