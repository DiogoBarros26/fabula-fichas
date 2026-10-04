// Feitiços do livro básico (Elementalista, Entropista e Espiritualista). Custos, alvos e durações
// conferidos com o livro; os efeitos são resumos escritos para a ficha — consulte o livro para o texto completo.
// O Arcanista invoca Arcanos e o Quimerista aprende feitiços de criaturas, então não têm lista fixa.
// "RA" = Resultado Alto. Feitiços ofensivos usam o Teste Mágico 【AST + VON】.

export type MagiaCatalogo = {
  id: string;
  classe: "elementalista" | "entropista" | "espiritualista";
  nome: string;
  pm: string;
  alvo: string;
  duracao: string;
  ofensiva: boolean;
  /** Dano dos ofensivos, no formato das armas ("RA + 15 fogo"). */
  dano?: string;
  efeito: string;
};

const TRES = "Até três criaturas";
const UMA = "Uma criatura";
const ARMA = "Uma arma equipada";

const m = (
  classe: MagiaCatalogo["classe"],
  id: string,
  nome: string,
  pm: string,
  alvo: string,
  duracao: string,
  ofensiva: boolean,
  efeito: string,
  dano?: string,
): MagiaCatalogo => ({ id, classe, nome, pm, alvo, duracao, ofensiva, efeito, dano });

export const MAGIAS: MagiaCatalogo[] = [
  // Elementalista
  m("elementalista", "mortalha-elemental", "Mortalha Elemental", "5 × alvo", TRES, "Cena", false,
    "Escolha ar, raio, terra, fogo ou gelo: cada alvo ganha Resistência a esse tipo de dano."),
  m("elementalista", "arma-elemental", "Arma Elemental", "10", ARMA, "Cena", false,
    "Escolha ar, raio, terra, fogo ou gelo: todo dano da arma passa a ser desse tipo. Se a arma for sua, faz um ataque livre com ela. Só em arma de criatura voluntária."),
  m("elementalista", "clarao", "Clarão", "20", UMA, "Instantânea", true,
    "Um raio de fogo concentrado. O alvo sofre RA + 25 de dano de fogo, que ignora Resistências.", "RA + 25 fogo"),
  m("elementalista", "fulgur", "Fulgur", "10 × alvo", TRES, "Instantânea", true,
    "Onda de raios: cada alvo atingido sofre RA + 15 de dano de raio. Oportunidade: os alvos ficam tontos.", "RA + 15 raio"),
  m("elementalista", "glacies", "Glacies", "10 × alvo", TRES, "Instantânea", true,
    "Camada de gelo: cada alvo atingido sofre RA + 15 de dano de gelo. Oportunidade: os alvos ficam lentos.", "RA + 15 gelo"),
  m("elementalista", "iceberg", "Iceberg", "20", UMA, "Instantânea", true,
    "Pilar de gelo. O alvo sofre RA + 25 de dano de gelo, que ignora Resistências.", "RA + 25 gelo"),
  m("elementalista", "ignis", "Ignis", "10 × alvo", TRES, "Instantânea", true,
    "Barragem de chamas: cada alvo atingido sofre RA + 15 de dano de fogo. Oportunidade: os alvos ficam abalados.", "RA + 15 fogo"),
  m("elementalista", "golpe-ascendente", "Golpe Ascendente", "10", "Você", "Instantânea", false,
    "Faz um ataque livre com uma arma corpo a corpo equipada, que pode alcançar alvos só atingíveis à distância. Com briga ou lança, +5 de dano. Um alvo voador atingido é forçado a pousar."),
  m("elementalista", "terra", "Terra", "10 × alvo", TRES, "Instantânea", true,
    "Pilares de rocha: cada alvo atingido sofre RA + 15 de dano de terra. Não afeta quem está no ar. Oportunidade: os alvos fazem uma ação a menos no próximo turno.", "RA + 15 terra"),
  m("elementalista", "trovao", "Trovão", "20", UMA, "Instantânea", true,
    "Um raio fulminante. O alvo sofre RA + 25 de dano de raio, que ignora Resistências.", "RA + 25 raio"),
  m("elementalista", "ventus", "Ventus", "10 × alvo", TRES, "Instantânea", true,
    "Força dos ventos: cada alvo atingido sofre RA + 15 de dano de ar. Oportunidade: alvos voadores são forçados a pousar.", "RA + 15 ar"),
  m("elementalista", "vortice", "Vórtice", "10", "Você", "Cena", false,
    "Um vendaval o envolve: +2 de Defesa contra ataques à distância."),

  // Entropista
  m("entropista", "aceleracao", "Aceleração", "20", UMA, "Cena", false,
    "O alvo pode fazer uma ação extra em cada turno. A magia termina depois de duas ações extras."),
  m("entropista", "anomalia", "Anomalia", "20", UMA, "Cena", true,
    "Se o alvo sofrer dano de um tipo que Absorve ou a que é Imune, é tratado como Vulnerável a ele. Então a magia termina."),
  m("entropista", "arma-sombria", "Arma Sombria", "10", ARMA, "Cena", false,
    "Todo dano da arma passa a ser sombrio. Se a arma for sua, faz um ataque livre com ela. Só em arma de criatura voluntária."),
  m("entropista", "dissipar", "Dissipar", "10", UMA, "Instantânea", false,
    "Encerra todos os feitiços com duração de Cena que afetam o alvo."),
  m("entropista", "adivinhacao", "Adivinhação", "10", "Você", "Cena", false,
    "Depois que uma criatura que você vê fizer um Teste (sem crítico nem falha crítica), você pode obrigá-la a rolar os dois dados de novo. Termina após duas vezes."),
  m("entropista", "drenar-espirito", "Drenar Espírito", "5", UMA, "Instantânea", true,
    "O alvo perde RA + 15 PM, e você recupera metade do que ele perdeu.", "RA + 15 PM perdidos"),
  m("entropista", "drenar-vigor", "Drenar Vigor", "10", UMA, "Instantânea", true,
    "O alvo sofre RA + 15 de dano sombrio, e você recupera PV igual à metade do que ele perdeu.", "RA + 15 sombrio"),
  m("entropista", "aposta", "Aposta", "Até 20", "Especial", "Instantânea", false,
    "Role o dado atual de VON uma vez para cada 10 PM gastos e fique com o que preferir: 1 você perde metade dos PV e PM atuais; 2–3 todos na cena ficam envenenados; 4–6 todos ficam lentos; 7–8 até três criaturas recuperam 50 PV e todos os efeitos de status; 9+ quantas criaturas quiser sofrem 30 de dano de tipo aleatório (d6: ar, raio, sombrio, terra, fogo, veneno)."),
  m("entropista", "espelho", "Espelho", "10", UMA, "Cena", false,
    "Se um feitiço ofensivo for lançado no alvo, ele atinge quem o lançou no lugar. Então a magia termina."),
  m("entropista", "omega", "Ômega", "20", UMA, "Instantânea", true,
    "O alvo perde PV igual a 20 + metade do nível dele."),
  m("entropista", "parar", "Parar", "10", UMA, "Instantânea", true,
    "O alvo faz uma ação a menos no próximo turno (mínimo 0)."),
  m("entropista", "umbra", "Umbra", "10 × alvo", TRES, "Instantânea", true,
    "Tempestade de energia sombria: cada alvo atingido sofre RA + 15 de dano sombrio. Oportunidade: os alvos ficam fracos.", "RA + 15 sombrio"),

  // Espiritualista
  m("espiritualista", "aura", "Aura", "5 × alvo", TRES, "Cena", false,
    "Cada alvo pode tratar a Defesa Mágica como 12 contra efeitos que o tenham como alvo (se a dele for maior, usa a dele)."),
  m("espiritualista", "despertar", "Despertar", "20", UMA, "Cena", false,
    "Escolha DES, AST, VIG ou VON: o alvo trata esse Atributo como um dado acima (até d12)."),
  m("espiritualista", "barreira", "Barreira", "5 × alvo", TRES, "Cena", false,
    "Cada alvo pode tratar a Defesa como 12 contra efeitos que o tenham como alvo (se a dele for maior, usa a dele)."),
  m("espiritualista", "purificar", "Purificar", "5 × alvo", TRES, "Instantânea", false,
    "Cada alvo se recupera de todos os efeitos de status."),
  m("espiritualista", "enfurecer", "Enfurecer", "10", UMA, "Instantânea", true,
    "O alvo fica enfurecido e não pode usar as ações Guarda nem Feitiço no próximo turno."),
  m("espiritualista", "alucinacao", "Alucinação", "5 × alvo", TRES, "Instantânea", true,
    "Escolha tonto ou abalado: cada alvo atingido sofre esse efeito de status."),
  m("espiritualista", "cura", "Cura", "10 × alvo", TRES, "Instantânea", false,
    "Cada alvo recupera 40 PV (50 a partir do nível 20; 60 a partir do nível 40)."),
  m("espiritualista", "lux", "Lux", "10 × alvo", TRES, "Instantânea", true,
    "Raios de luz da alma: cada alvo atingido sofre RA + 15 de dano de luz. Oportunidade: os alvos ficam tontos.", "RA + 15 luz"),
  m("espiritualista", "misericordia", "Misericórdia", "20", UMA, "Cena", false,
    "Se o alvo chegar a 0 PV, fica com exatamente 1 PV. Então a magia termina."),
  m("espiritualista", "reforco", "Reforço", "5 × alvo", TRES, "Cena", false,
    "Escolha tonto, enfurecido, envenenado, abalado, lento ou fraco: cada alvo fica imune a esse efeito de status."),
  m("espiritualista", "arma-da-alma", "Arma da Alma", "10", ARMA, "Cena", false,
    "Todo dano da arma passa a ser de luz. Se a arma for sua, faz um ataque livre com ela. Só em arma de criatura voluntária."),
  m("espiritualista", "torpor", "Torpor", "5 × alvo", TRES, "Instantânea", true,
    "Escolha lento ou fraco: cada alvo atingido sofre esse efeito de status."),
];

export const CLASSES_COM_MAGIAS = [
  { id: "elementalista", nome: "Elementalista" },
  { id: "entropista", nome: "Entropista" },
  { id: "espiritualista", nome: "Espiritualista" },
] as const;

/** Teste Mágico dos feitiços ofensivos do livro básico. */
export const TESTE_MAGICO = "AST + VON";
