// Habilidades das 15 classes do livro básico. Nomes e limites conferidos com o livro
// (e com o Fultimator, MIT); os resumos são curtos e escritos para a ficha — consulte
// o livro para o texto completo. "SL" = quantas vezes a habilidade foi adquirida.

export type Habilidade = { id: string; nome: string; max: number; resumo: string };

const h = (id: string, nome: string, max: number, resumo: string): Habilidade => ({ id, nome, max, resumo });

export const HABILIDADES: Record<string, Habilidade[]> = {
  arcanista: [
    h("circulo-arcano", "Círculo Arcano", 4, "Ao dispensar um Arcano no seu turno (com arma arcana), lança de graça um feitiço de até SL×5 PM."),
    h("regeneracao-arcana", "Regeneração Arcana", 2, "Ao invocar um Arcano, recupera SL×5 PV."),
    h("vincular-e-invocar", "Vincular e Invocar", 1, "Vincula Arcanos à alma e os invoca com uma ação e 40 PM."),
    h("arcano-de-emergencia", "Arcano de Emergência", 6, "Em Crise, invocar Arcanos custa SL×5 PM a menos."),
    h("arcanismo-ritual", "Arcanismo Ritual", 1, "Realiza Rituais de Arcanismo dentro dos domínios dos seus Arcanos (VON+VON)."),
  ],
  quimerista: [
    h("consumir", "Consumir", 5, "Ao causar dano com feitiço (arma arcana, adaga ou mangual), recupera SL×2 PM."),
    h("fala-feral", "Fala Feral", 1, "Conversa com feras, monstros e plantas."),
    h("patogenese", "Patogênese", 1, "Seus feitiços de Quimerista envenenam criaturas da mesma Espécie de quem você os aprendeu."),
    h("quimerismo-ritual", "Quimerismo Ritual", 1, "Realiza Rituais de Quimerismo (AST+VON ou VIG+VON, à escolha)."),
    h("mimico-de-feiticos", "Mímico de Feitiços", 10, "Aprende feitiços que vê feras, monstros e plantas lançarem; memoriza até SL+2."),
  ],
  "lamina-sombria": [
    h("agonia", "Agonia", 5, "Ao causar dano a quem você tem Laço, recupera SL×2 PV e SL×2 PM."),
    h("sangue-sombrio", "Sangue Sombrio", 1, "Em Crise, tem Resistência a dano sombrio e venenoso."),
    h("coracao-de-trevas", "Coração de Trevas", 1, "Uma vez por cena, ao entrar em Crise, cria um Laço de ódio com uma criatura."),
    h("licoes-dolorosas", "Lições Dolorosas", 3, "Ao perder PV para uma criatura, faz a ação Estudar nela de graça, com bônus de SL."),
    h("golpe-sombrio", "Golpe Sombrio", 5, "Perde PV igual ao dado de VIG e faz um ataque com +SL+dado de dano sombrio."),
  ],
  elementalista: [
    h("cataclismo", "Cataclismo", 3, "Gasta até SL×10 PM a mais num feitiço instantâneo: +5 de dano a cada 10 PM."),
    h("magia-elemental", "Magia Elemental", 10, "Cada vez que adquire, aprende um feitiço de Elementalista (AST+VON)."),
    h("artilharia-magica", "Artilharia Mágica", 3, "Com arma arcana, +SL×2 no Teste Mágico de feitiços ofensivos."),
    h("elementalismo-ritual", "Elementalismo Ritual", 1, "Realiza Rituais de Elementalismo (AST+VON)."),
    h("lamina-magica", "Lâmina Mágica", 4, "Lança feitiços ofensivos de até SL×10 PM através de uma arma, usando a Precisão dela."),
  ],
  entropista: [
    h("absorver-pm", "Absorver PM", 5, "Depois de sofrer dano, recupera SL×2 PM."),
    h("magia-entropica", "Magia Entrópica", 10, "Cada vez que adquire, aprende um feitiço de Entropista (AST+VON)."),
    h("sete-da-sorte", "Sete da Sorte", 1, "Uma vez por cena, troca um dado rolado pelo seu número da sorte (começa em 7)."),
    h("entropismo-ritual", "Entropismo Ritual", 1, "Realiza Rituais de Entropismo (AST+VON)."),
    h("tempo-roubado", "Tempo Roubado", 4, "Com uma ação, gasta até SL×5 PM para aplicar/remover Lento ou dar ações de Equipamento."),
  ],
  furia: [
    h("adrenalina", "Adrenalina", 5, "Em Crise, causa SL×2 de dano extra com qualquer fonte."),
    h("frenesi", "Frenesi", 1, "Ataques com briga, adaga, mangual e arremesso são críticos com quaisquer dados iguais."),
    h("espirito-indomavel", "Espírito Indomável", 4, "Ao gastar Pontos de Fábula, recupera SL×5 PV ou SL×5 PM, ou remove uma condição."),
    h("provocar", "Provocar", 5, "Com uma ação e 5 PM, teste VIG+VON (+SL): o alvo fica Enfurecido e foca em você."),
    h("resistir", "Resistir", 5, "Ao Proteger-se sem cobrir ninguém, recupera PV (SL × maior Laço) e melhora VIG ou VON."),
  ],
  guardiao: [
    h("guarda-costas", "Guarda-Costas", 1, "Quem você cobre com a ação Proteger ganha Resistência a todo dano."),
    h("maestria-defensiva", "Maestria Defensiva", 5, "Com escudo ou armadura marcial, reduz todo dano sofrido em SL."),
    h("portador-de-dois-escudos", "Portador de Dois Escudos", 1, "Equipa escudo na mão principal; dois escudos viram uma arma (VIG+VIG, RA+5)."),
    h("fortaleza", "Fortaleza", 5, "+SL×3 PV máximos (já somado na ficha)."),
    h("proteger", "Proteger", 1, "Toma o lugar de outra criatura ameaçada por um ataque ou perigo."),
  ],
  erudito: [
    h("lampejo-de-percepcao", "Lampejo de Percepção", 3, "Com 13+ ao investigar, faz até SL perguntas ao Mestre."),
    h("focado", "Focado", 5, "+SL×3 PM máximos (já somado na ficha) e +SL em Testes Abertos de AST+AST."),
    h("conhecimento-e-poder", "Conhecimento é Poder", 1, "Pode trocar um dos atributos de Precisão por AST."),
    h("avaliacao-rapida", "Avaliação Rápida", 6, "No início do conflito, gasta até SL×5 PM para revelar Traços e afinidades de inimigos."),
    h("memoria-treinada", "Memória Treinada", 1, "Lembra perfeitamente de cenas da última semana e pode investigá-las de novo."),
  ],
  orador: [
    h("condenar", "Condenar", 4, "Com uma ação e 5 PM, teste AST+VON (+SL): alvo perde SL×10 PM e fica Tonto ou Abalado."),
    h("encorajar", "Encorajar", 6, "Com uma ação e 5 PM, um aliado recupera SL×5 PV e melhora um atributo."),
    h("confio-em-voce", "Confio em Você", 2, "Gasta 1 Ponto de Fábula para um aliado rerrolar; se tiver Laço, ele recupera SL×10 PM."),
    h("persuasivo", "Persuasivo", 2, "Ao avançar Relógios com lábia, gasta até SL×20 PM para marcar seções extras."),
    h("aliado-inesperado", "Aliado Inesperado", 1, "Gasta 1 Ponto de Fábula para tornar uma criatura não hostil prestativa."),
  ],
  ladino: [
    h("golpe-baixo", "Golpe Baixo", 5, "Ataque a um alvo com condições causa dano extra de SL + nº de condições."),
    h("esquiva", "Esquiva", 3, "Sem escudo e sem armadura marcial, +SL de Defesa (já somado na ficha)."),
    h("alta-velocidade", "Alta Velocidade", 3, "No início do conflito, gasta 10 PM para atacar ou agir antes da 1ª rodada (+SL)."),
    h("ate-mais", "Até Mais", 1, "Gasta 1 Ponto de Fábula para sumir da cena e reaparecer em outra."),
    h("roubo-de-alma", "Roubo de Alma", 5, "Teste DES+VON (+SL) contra Def. Mágica para roubar PI ou um tesouro da alma."),
  ],
  atirador: [
    h("barragem", "Barragem", 1, "Gasta 10 PM para dar multi (2) a um ataque à distância (ou +1, até 3)."),
    h("fogo-cruzado", "Fogo Cruzado", 1, "Gasta PM igual ao resultado de um ataque à distância inimigo para fazê-lo errar."),
    h("olho-de-aguia", "Olho de Águia", 5, "Ao Proteger-se sem cobrir ninguém, o próximo tiro causa +SL×2 de dano (ou atira na hora)."),
    h("maestria-armas-distancia", "Maestria em Armas à Distância", 4, "+SL na Precisão com armas à distância."),
    h("tiro-de-aviso", "Tiro de Aviso", 4, "Troca o dano de um tiro por Abalado, Lento ou perda de SL×10 PM."),
  ],
  espiritualista: [
    h("poder-curativo", "Poder Curativo", 2, "Feitiços em aliados (arma arcana) curam SL × nº de Laços em PV."),
    h("espiritismo-ritual", "Espiritismo Ritual", 1, "Realiza Rituais de Espiritismo (AST+VON)."),
    h("magia-espiritual", "Magia Espiritual", 10, "Cada vez que adquire, aprende um feitiço de Espiritualista (AST+VON)."),
    h("magia-de-suporte", "Magia de Suporte", 1, "Feitiço num aliado com quem tem Laço dá bônus no próximo teste dele."),
    h("vismago", "Vismago", 1, "Sem PM suficiente, paga feitiços com o dobro em PV."),
  ],
  inventor: [
    h("item-de-emergencia", "Item de Emergência", 1, "Uma vez por conflito, em Crise, ganha uma ação extra de Inventário."),
    h("engenhocas", "Engenhocas", 5, "Ganha e aprimora engenhocas: Alquimia, Infusão ou Magitec."),
    h("chuva-de-pocoes", "Chuva de Poções", 2, "Poções de cura atingem até SL criaturas extras (curando metade)."),
    h("formula-secreta", "Fórmula Secreta", 5, "Itens que curam restauram +SL×5; itens de dano causam +SL."),
    h("visionario", "Visionário", 5, "Em Projetos, paga até SL×100 zenit de material e gera +SL de progresso por dia."),
  ],
  andarilho: [
    h("companheiro-fiel", "Companheiro Fiel", 5, "Ganha um companheiro (fera, constructo, elemental ou planta) que melhora com SL."),
    h("engenhoso", "Engenhoso", 4, "Recupera SL PI após cada rolagem de viagem."),
    h("papo-de-taverna", "Papo de Taverna", 3, "Ao descansar em estalagem, faz até SL perguntas ao Mestre sobre o lugar."),
    h("cacador-de-tesouros", "Caçador de Tesouros", 2, "Em viagens, faz descobertas com SL+1 ou menos na rolagem."),
    h("bem-viajado", "Bem Viajado", 1, "Reduz o dado das rolagens de viagem em um tamanho."),
  ],
  "mestre-de-armas": [
    h("tempestade-de-laminas", "Tempestade de Lâminas", 1, "Gasta 10 PM para dar multi (2) a um ataque corpo a corpo (ou +1, até 3)."),
    h("esmaga-ossos", "Esmaga-Ossos", 4, "Troca o dano de um golpe por Tonto, Fraco ou perda de SL×10 PM."),
    h("brecha", "Brecha", 3, "Com uma ação e 5 PM, ataque que destrói escudo/armadura ou cria fraqueza."),
    h("contra-ataque", "Contra-ataque", 1, "Quando um inimigo te ataca corpo a corpo com resultado par, contra-ataca de graça."),
    h("maestria-armas-cac", "Maestria em Armas Corpo a Corpo", 4, "+SL na Precisão com armas corpo a corpo."),
  ],
};

export function habilidadesDaClasse(classeId: string) {
  return HABILIDADES[classeId] ?? [];
}
