// Regras do livro básico de Fabula Ultima usadas pela ficha.

export type Dado = 6 | 8 | 10 | 12;
export const DADOS: Dado[] = [6, 8, 10, 12];

export type AtributoId = "des" | "ast" | "vig" | "von";

export const ATRIBUTOS: { id: AtributoId; nome: string; sigla: string; descricao: string }[] = [
  { id: "des", nome: "Destreza", sigla: "DES", descricao: "Precisão, coordenação, sutileza e reflexos" },
  { id: "ast", nome: "Astúcia", sigla: "AST", descricao: "Observação, compreensão e raciocínio" },
  { id: "vig", nome: "Vigor", sigla: "VIG", descricao: "Força, resiliência e fortaleza física" },
  { id: "von", nome: "Vontade", sigla: "VON", descricao: "Determinação, carisma e influência" },
];

export const PERFIS_ATRIBUTOS = [
  { nome: "Polivalente", dados: [8, 8, 8, 8] },
  { nome: "Padrão", dados: [10, 8, 8, 6] },
  { nome: "Especializado", dados: [10, 10, 6, 6] },
] as const;

export type TipoMarcial = "cac" | "distancia" | "armadura" | "escudo";
type Beneficio = { pv?: number; pm?: number; pi?: number; equipa?: string; marcial?: TipoMarcial[] };

export const CLASSES: { id: string; nome: string; resumo: string; beneficio: Beneficio }[] = [
  { id: "arcanista", nome: "Arcanista", resumo: "Convoca avatares mágicos de entidades antigas", beneficio: { pm: 5 } },
  { id: "quimerista", nome: "Quimerista", resumo: "Aprende magias com criaturas e fala com feras", beneficio: { pm: 5 } },
  { id: "lamina-sombria", nome: "Lâmina Sombria", resumo: "Ataques sombrios e poder dos Laços", beneficio: { pv: 5, equipa: "Armas corpo a corpo e armaduras marciais", marcial: ["cac", "armadura"] } },
  { id: "elementalista", nome: "Elementalista", resumo: "Poder destrutivo dos elementos", beneficio: { pm: 5 } },
  { id: "entropista", nome: "Entropista", resumo: "Canaliza a energia escura do Cosmos", beneficio: { pm: 5 } },
  { id: "furia", nome: "Fúria", resumo: "Provoca inimigos e bate mais forte ao sofrer dano", beneficio: { pv: 5, equipa: "Armas corpo a corpo e armaduras marciais", marcial: ["cac", "armadura"] } },
  { id: "guardiao", nome: "Guardião", resumo: "Protege aliados e luta com armaduras pesadas", beneficio: { pv: 5, equipa: "Armaduras e escudos marciais", marcial: ["armadura", "escudo"] } },
  { id: "erudito", nome: "Erudito", resumo: "Mestre do conhecimento que apoia aliados", beneficio: { pm: 5 } },
  { id: "orador", nome: "Orador", resumo: "Usa palavras para ganhar aliados e influenciar conflitos", beneficio: { pm: 5 } },
  { id: "ladino", nome: "Ladino", resumo: "Aproveita oportunidades e rouba itens dos inimigos", beneficio: { pi: 2 } },
  { id: "atirador", nome: "Atirador", resumo: "Excelente à distância, anula ataques à distância", beneficio: { pv: 5, equipa: "Armas à distância e escudos marciais", marcial: ["distancia", "escudo"] } },
  { id: "espiritualista", nome: "Espiritualista", resumo: "Apoia aliados com magia e feitiços de luz", beneficio: { pm: 5 } },
  { id: "inventor", nome: "Inventor", resumo: "Cria invenções e usa PI de novas maneiras", beneficio: { pi: 2 } },
  { id: "andarilho", nome: "Andarilho", resumo: "Explorador com um companheiro leal", beneficio: { pi: 2 } },
  { id: "mestre-de-armas", nome: "Mestre de Armas", resumo: "Excelente corpo a corpo, anula ataques corpo a corpo", beneficio: { pv: 5, equipa: "Armas corpo a corpo e escudos marciais", marcial: ["cac", "escudo"] } },
];

export const CONDICOES = [
  { id: "lento", nome: "Lento", afeta: ["des"] },
  { id: "tonto", nome: "Tonto", afeta: ["ast"] },
  { id: "fraco", nome: "Fraco", afeta: ["vig"] },
  { id: "abalado", nome: "Abalado", afeta: ["von"] },
  { id: "enfurecido", nome: "Enfurecido", afeta: ["des", "ast"] },
  { id: "envenenado", nome: "Envenenado", afeta: ["vig", "von"] },
] as const;
export type CondicaoId = (typeof CONDICOES)[number]["id"];

export const PARES_EMOCOES = [
  ["Admiração", "Inferioridade"],
  ["Lealdade", "Desconfiança"],
  ["Afeição", "Ódio"],
] as const;

/** pericias: id da habilidade -> quantas vezes foi adquirida (SL). habilidades: anotações livres. */
export type ClasseFicha = { classeId: string; nivel: number; pericias: Record<string, number>; habilidades: string };
export type Laco = { nome: string; emocoes: string[] };
export type Magia = { nome: string; pm: string; alvo: string; duracao: string; efeito: string };
export type Arma = { nome: string; precisao: string; dano: string; notas: string; marcial?: boolean; distancia?: boolean };

export type Ficha = {
  nome: string;
  jogador: string;
  retrato: string;
  identidade: string;
  tema: string;
  origem: string;
  atributos: Record<AtributoId, Dado>;
  classes: ClasseFicha[];
  pvAtual: number | null;
  pmAtual: number | null;
  piAtual: number | null;
  pvExtra: number;
  pmExtra: number;
  piExtra: number;
  pontosFabula: number;
  zenit: number;
  xp: number;
  condicoes: Partial<Record<CondicaoId, boolean>>;
  armas: Arma[];
  armadura: { nome: string; defesaFixa: number | null; defesa: number; defesaMagica: number; iniciativa: number; marcial?: boolean };
  escudo: { nome: string; defesa: number; defesaMagica: number; marcial?: boolean };
  acessorio: { nome: string; efeito: string };
  defesaExtra: number;
  defesaMagicaExtra: number;
  iniciativaExtra: number;
  lacos: Laco[];
  magias: Magia[];
  inventario: string;
  notas: string;
};

export function fichaNova(): Ficha {
  return {
    nome: "Novo herói",
    jogador: "",
    retrato: "",
    identidade: "",
    tema: "",
    origem: "",
    atributos: { des: 8, ast: 8, vig: 8, von: 8 },
    classes: [],
    pvAtual: null,
    pmAtual: null,
    piAtual: null,
    pvExtra: 0,
    pmExtra: 0,
    piExtra: 0,
    pontosFabula: 3,
    zenit: 0,
    xp: 0,
    condicoes: {},
    armas: [],
    armadura: { nome: "", defesaFixa: null, defesa: 0, defesaMagica: 0, iniciativa: 0 },
    escudo: { nome: "", defesa: 0, defesaMagica: 0 },
    acessorio: { nome: "", efeito: "" },
    defesaExtra: 0,
    defesaMagicaExtra: 0,
    iniciativaExtra: 0,
    lacos: [],
    magias: [],
    inventario: "",
    notas: "",
  };
}

/** Completa fichas salvas com campos que possam ter sido adicionados depois. */
export function normalizarFicha(dados: Partial<Ficha>): Ficha {
  const base = fichaNova();
  return {
    ...base,
    ...dados,
    atributos: { ...base.atributos, ...dados.atributos },
    armadura: { ...base.armadura, ...dados.armadura },
    escudo: { ...base.escudo, ...dados.escudo },
    acessorio: { ...base.acessorio, ...dados.acessorio },
    classes: (dados.classes ?? []).map((c) => ({ ...c, pericias: c.pericias ?? {}, habilidades: c.habilidades ?? "" })),
  };
}

/** Quantas vezes a habilidade foi adquirida (SL) numa classe da ficha. */
export function nivelHabilidade(f: Ficha, classeId: string, habilidadeId: string) {
  return f.classes.find((c) => c.classeId === classeId)?.pericias[habilidadeId] ?? 0;
}

export function escolhasUsadas(c: ClasseFicha) {
  return Object.values(c.pericias).reduce((t, n) => t + n, 0);
}

export function nomeClasse(id: string) {
  return CLASSES.find((c) => c.id === id)?.nome ?? id;
}

function reduzirDado(d: Dado): Dado {
  return Math.max(6, d - 2) as Dado;
}

export function calcular(f: Ficha) {
  const nivel = f.classes.reduce((t, c) => t + (Number(c.nivel) || 0), 0);

  // Benefícios gratuitos se acumulam entre classes diferentes.
  const bonus = { pv: 0, pm: 0, pi: 0 };
  const equipa: string[] = [];
  for (const c of f.classes) {
    const b = CLASSES.find((x) => x.id === c.classeId)?.beneficio;
    if (!b) continue;
    bonus.pv += b.pv ?? 0;
    bonus.pm += b.pm ?? 0;
    bonus.pi += b.pi ?? 0;
    if (b.equipa) equipa.push(b.equipa);
  }

  // Condições reduzem o dado atual um passo (mínimo d6); PV/PM usam o dado base.
  const atual = { ...f.atributos };
  for (const cond of CONDICOES) {
    if (!f.condicoes[cond.id]) continue;
    for (const a of cond.afeta) atual[a] = reduzirDado(atual[a]);
  }

  // Habilidades que alteram valores da ficha.
  const sl = (classe: string, hab: string) => nivelHabilidade(f, classe, hab);
  const temEscudo = !!(f.escudo.nome || f.escudo.defesa || f.escudo.defesaMagica);
  const armaduraMarcial = f.armadura.marcial || f.armadura.defesaFixa !== null;
  const habilidades = {
    pv: sl("guardiao", "fortaleza") * 3,
    pm: sl("erudito", "focado") * 3,
    defesa: !temEscudo && !armaduraMarcial ? sl("ladino", "esquiva") : 0,
    reducaoDano: temEscudo || armaduraMarcial ? sl("guardiao", "maestria-defensiva") : 0,
  };

  const pvMax = nivel + f.atributos.vig * 5 + bonus.pv + habilidades.pv + f.pvExtra;
  const pmMax = nivel + f.atributos.von * 5 + bonus.pm + habilidades.pm + f.pmExtra;
  const piMax = 6 + bonus.pi + f.piExtra;
  const crise = Math.floor(pvMax / 2);

  const defesaBase = f.armadura.defesaFixa ?? atual.des + f.armadura.defesa;
  const defesa = defesaBase + f.escudo.defesa + habilidades.defesa + f.defesaExtra;
  const defesaMagica = atual.ast + f.armadura.defesaMagica + f.escudo.defesaMagica + f.defesaMagicaExtra;
  const iniciativa = f.armadura.iniciativa + f.iniciativaExtra;

  const pv = f.pvAtual ?? pvMax;
  const pm = f.pmAtual ?? pmMax;
  const pi = f.piAtual ?? piMax;

  return { nivel, bonus, habilidades, equipa, atual, pvMax, pmMax, piMax, crise, defesa, defesaMagica, iniciativa, pv, pm, pi, emCrise: pv <= crise };
}

export function avisos(f: Ficha) {
  const lista: string[] = [];
  if (f.classes.length > 0 && (f.classes.length < 2 || f.classes.length > 3) && calcular(f).nivel <= 5)
    lista.push("Na criação, o personagem deve ter de 2 a 3 classes.");
  if (f.classes.some((c) => c.nivel > 10)) lista.push("Cada classe vai no máximo até o nível 10.");
  const ids = f.classes.map((c) => c.classeId);
  if (new Set(ids).size !== ids.length) lista.push("A mesma classe aparece duas vezes.");
  for (const c of f.classes) {
    const usadas = escolhasUsadas(c);
    if (usadas > c.nivel) lista.push(`${nomeClasse(c.classeId)}: ${usadas} habilidades para nível ${c.nivel} (1 por nível).`);
  }
  return lista;
}

/** Equipamentos marciais que nenhuma das classes permite usar. */
export function avisosEquipamento(f: Ficha) {
  const permitidos = new Set(f.classes.flatMap((c) => CLASSES.find((x) => x.id === c.classeId)?.beneficio.marcial ?? []));
  const lista: string[] = [];
  for (const a of f.armas)
    if (a.marcial && !permitidos.has(a.distancia ? "distancia" : "cac"))
      lista.push(`${a.nome} é marcial: requer ${a.distancia ? "Atirador" : "Lâmina Sombria, Fúria ou Mestre de Armas"}.`);
  if (f.armadura.marcial && !permitidos.has("armadura")) lista.push(`${f.armadura.nome} é marcial: requer Lâmina Sombria, Fúria ou Guardião.`);
  if (f.escudo.marcial && !permitidos.has("escudo")) lista.push(`${f.escudo.nome} é marcial: requer Guardião, Atirador ou Mestre de Armas.`);
  return lista;
}
