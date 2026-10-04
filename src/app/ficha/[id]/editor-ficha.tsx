"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useTransition } from "react";
import {
  ATRIBUTOS,
  CONDICOES,
  DADOS,
  PARES_EMOCOES,
  PERFIS_ATRIBUTOS,
  avisos,
  calcular,
  type Dado,
  type Ficha,
} from "@/lib/regras";
import { SecaoClasses, SecaoEquipamento } from "./secoes-classe-equipamento";
import { definirCampanhaFicha, definirVisibilidade, excluirFicha, salvarFicha } from "@/app/actions";

type Status = "salvo" | "pendente" | "salvando" | "erro";

type Campanha = { id: string; nome: string };

export function EditorFicha({
  id,
  inicial,
  visivelInicial,
  campanhaInicial,
  minhasCampanhas,
  ehDono,
  ehMestre,
  donoNome,
}: {
  id: string;
  inicial: Ficha;
  visivelInicial: boolean;
  campanhaInicial: Campanha | null;
  minhasCampanhas: Campanha[];
  ehDono: boolean;
  ehMestre: boolean;
  donoNome: string;
}) {
  const podeEditar = ehDono || ehMestre;
  const [f, setF] = useState(inicial);
  const [visivel, setVisivel] = useState(visivelInicial);
  const [campanhaId, setCampanhaId] = useState(campanhaInicial?.id ?? "");
  const [status, setStatus] = useState<Status>("salvo");
  const [confirmarExclusao, setConfirmarExclusao] = useState(false);
  const [excluindo, iniciarExclusao] = useTransition();
  const ultimoSalvo = useRef(JSON.stringify(inicial));

  // Salva automaticamente 700 ms depois da última alteração real.
  useEffect(() => {
    const atual = JSON.stringify(f);
    if (!podeEditar || atual === ultimoSalvo.current) return;
    setStatus("pendente");
    const t = setTimeout(async () => {
      setStatus("salvando");
      try {
        await salvarFicha(id, f);
        ultimoSalvo.current = atual;
        setStatus("salvo");
      } catch {
        setStatus("erro");
      }
    }, 700);
    return () => clearTimeout(t);
  }, [f, id, podeEditar]);

  const set = <K extends keyof Ficha>(chave: K, valor: Ficha[K]) => setF((x) => ({ ...x, [chave]: valor }));
  const c = calcular(f);
  const listaAvisos = avisos(f);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link href={campanhaInicial ? `/campanha/${campanhaInicial.id}` : "/"} className="text-sm text-suave hover:text-texto">
          ← {campanhaInicial ? campanhaInicial.nome : "Início"}
        </Link>
        <div className="flex flex-wrap items-center gap-3">
          {podeEditar && <StatusSalvar status={status} />}
          {!ehDono && (
            <span className="rounded-md bg-black/30 px-3 py-1 text-sm text-suave">
              Ficha de {donoNome} · {ehMestre ? "você é o Mestre desta campanha" : "somente leitura"}
            </span>
          )}
        </div>
      </div>

      {ehDono && (
        <div className="janela flex flex-wrap items-end gap-3 p-3">
          <label className="block min-w-48 flex-1">
            <span className="rotulo mb-1 block">Campanha</span>
            <select
              className="campo"
              value={campanhaId}
              onChange={async (e) => {
                const anterior = campanhaId;
                setCampanhaId(e.target.value);
                try {
                  await definirCampanhaFicha(id, e.target.value || null);
                } catch {
                  setCampanhaId(anterior);
                  setStatus("erro");
                }
              }}
            >
              <option value="" className="bg-janela">
                Nenhuma (ficha particular)
              </option>
              {minhasCampanhas.map((c) => (
                <option key={c.id} value={c.id} className="bg-janela">
                  {c.nome}
                </option>
              ))}
            </select>
          </label>
          <button
            className={`botao h-[38px] ${visivel ? "" : "border-ouro text-ouro"}`}
            disabled={!campanhaId}
            title={campanhaId ? "Fichas ocultas só aparecem para você e para o Mestre da campanha" : "Escolha uma campanha primeiro"}
            onClick={async () => {
              const novo = !visivel;
              setVisivel(novo);
              try {
                await definirVisibilidade(id, novo);
              } catch {
                setVisivel(!novo);
                setStatus("erro");
              }
            }}
          >
            {visivel ? "👁 Visível para os jogadores" : "🔒 Oculta (só você e o Mestre)"}
          </button>
          <p className="basis-full text-xs text-suave">
            {!campanhaId
              ? "Sem campanha, só você vê esta ficha. Escolha uma campanha para mostrá-la ao grupo."
              : visivel
                ? "Os jogadores desta campanha podem ver a ficha (sem editar). O Mestre pode ver e editar."
                : "Só você e o Mestre da campanha veem esta ficha."}
          </p>
          <div className="basis-full">
          {confirmarExclusao ? (
            <span className="flex items-center gap-2 text-sm">
              Excluir de vez?
              <button
                className="botao border-pv text-pv"
                disabled={excluindo}
                onClick={() => iniciarExclusao(() => excluirFicha(id))}
              >
                Sim, excluir
              </button>
              <button className="botao" onClick={() => setConfirmarExclusao(false)}>
                Cancelar
              </button>
            </span>
          ) : (
            <button className="botao" onClick={() => setConfirmarExclusao(true)}>
              Excluir ficha
            </button>
          )}
          </div>
        </div>
      )}

      <fieldset disabled={!podeEditar} className="min-w-0 space-y-5">

      {/* Identidade */}
      <section className="janela grid gap-4 p-4 md:grid-cols-[140px_1fr]">
        <div className="flex flex-col gap-2">
          <div className="flex aspect-square items-center justify-center overflow-hidden rounded-md border border-white/20 bg-black/30 font-titulo text-5xl text-ouro">
            {f.retrato ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={f.retrato} alt="Retrato" className="size-full object-cover" />
            ) : (
              f.nome.charAt(0).toUpperCase() || "?"
            )}
          </div>
          <input className="campo text-xs" placeholder="Link da imagem" value={f.retrato} onChange={(e) => set("retrato", e.target.value)} />
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Campo rotulo="Nome" className="sm:col-span-2">
            <input className="campo font-titulo text-xl" value={f.nome} onChange={(e) => set("nome", e.target.value)} />
          </Campo>
          <Campo rotulo="Jogador">
            <input className="campo" value={f.jogador} onChange={(e) => set("jogador", e.target.value)} />
          </Campo>
          <Campo rotulo="Nível">
            <div className="campo bg-black/40 font-titulo text-xl text-ouro" title="O nível é a soma dos níveis das classes">
              {c.nivel}
            </div>
            <span className="mt-1 block text-xs text-suave">Soma das classes — altere em “Classes” ↓</span>
          </Campo>
          <Campo rotulo="Identidade" className="sm:col-span-2">
            <input className="campo" placeholder="Ex.: Cavaleira exilada em busca de redenção" value={f.identidade} onChange={(e) => set("identidade", e.target.value)} />
          </Campo>
          <Campo rotulo="Tema">
            <input className="campo" placeholder="Ex.: Justiça" value={f.tema} onChange={(e) => set("tema", e.target.value)} />
          </Campo>
          <Campo rotulo="Origem">
            <input className="campo" placeholder="Ex.: Reino de Bronze" value={f.origem} onChange={(e) => set("origem", e.target.value)} />
          </Campo>
        </div>
      </section>

      <div className="grid gap-5 lg:grid-cols-[1fr_1.2fr]">
        <div className="space-y-5">
          {/* Atributos */}
          <section className="janela p-4">
            <h2 className="titulo-secao">Atributos</h2>
            <div className="grid grid-cols-2 gap-3">
              {ATRIBUTOS.map((a) => {
                const reduzido = c.atual[a.id] !== f.atributos[a.id];
                return (
                  <div key={a.id} className="rounded-md bg-black/25 p-3" title={a.descricao}>
                    <div className="flex items-baseline justify-between">
                      <span className="font-titulo">{a.nome}</span>
                      <span className="text-xs text-suave">{a.sigla}</span>
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      <select
                        className="campo text-lg font-semibold"
                        value={f.atributos[a.id]}
                        onChange={(e) => set("atributos", { ...f.atributos, [a.id]: Number(e.target.value) as Dado })}
                      >
                        {DADOS.map((d) => (
                          <option key={d} value={d} className="bg-janela">
                            d{d}
                          </option>
                        ))}
                      </select>
                      {reduzido && <span className="whitespace-nowrap text-sm text-pv">atual d{c.atual[a.id]}</span>}
                    </div>
                  </div>
                );
              })}
            </div>
            <p className="mt-3 text-xs text-suave">
              Perfis iniciais: {PERFIS_ATRIBUTOS.map((p) => `${p.nome} (${p.dados.map((d) => "d" + d).join(", ")})`).join(" · ")}
            </p>
          </section>

          {/* Recursos */}
          <section className="janela space-y-3 p-4">
            <div className="flex items-center justify-between">
              <h2 className="titulo-secao mb-0">Recursos</h2>
              {c.emCrise && <span className="animate-pulse rounded bg-pv px-2 py-0.5 text-xs font-bold">EM CRISE</span>}
            </div>
            <Recurso rotulo="PV" cor="bg-pv" atual={c.pv} max={c.pvMax} extra={`Crise: ${c.crise}`} onChange={(v) => set("pvAtual", v)} />
            <Recurso rotulo="PM" cor="bg-pm" atual={c.pm} max={c.pmMax} onChange={(v) => set("pmAtual", v)} />
            <Recurso
              rotulo="PI"
              cor="bg-pi"
              atual={c.pi}
              max={c.piMax}
              extra="Pontos de Inventário: gastos ao usar itens (poção = 3 PI, elixir = 3, tenda = 4…)"
              onChange={(v) => set("piAtual", v)}
            />
            <div className="grid grid-cols-3 gap-3 pt-2">
              <Campo rotulo="Pontos de Fábula" dica="Gaste para rerrolar dados ou invocar Traços e Laços">
                <Numero valor={f.pontosFabula} onChange={(v) => set("pontosFabula", v)} />
              </Campo>
              <Campo rotulo="Zenit (dinheiro)" dica="A moeda do mundo de Fabula Ultima">
                <Numero valor={f.zenit} onChange={(v) => set("zenit", v)} />
              </Campo>
              <Campo rotulo="XP">
                <Numero valor={f.xp} onChange={(v) => set("xp", v)} />
              </Campo>
            </div>
            <details className="text-sm">
              <summary className="cursor-pointer text-suave">Bônus extras de PV/PM/PI (perícias, itens…)</summary>
              <div className="mt-2 grid grid-cols-3 gap-3">
                <Campo rotulo="PV extra">
                  <Numero valor={f.pvExtra} onChange={(v) => set("pvExtra", v)} />
                </Campo>
                <Campo rotulo="PM extra">
                  <Numero valor={f.pmExtra} onChange={(v) => set("pmExtra", v)} />
                </Campo>
                <Campo rotulo="PI extra">
                  <Numero valor={f.piExtra} onChange={(v) => set("piExtra", v)} />
                </Campo>
              </div>
              <p className="mt-2 text-xs text-suave">
                Cálculo: PV = nível + VIG×5 (+{c.bonus.pv} das classes{c.habilidades.pv ? `, +${c.habilidades.pv} de Fortaleza` : ""}) · PM = nível + VON×5 (+
                {c.bonus.pm}
                {c.habilidades.pm ? `, +${c.habilidades.pm} de Focado` : ""}) · PI = 6 (+{c.bonus.pi})
              </p>
            </details>
          </section>

          {/* Defesas */}
          <section className="janela p-4">
            <h2 className="titulo-secao">Defesas</h2>
            <div className="grid grid-cols-3 gap-3 text-center">
              <Valor rotulo="Defesa" valor={c.defesa} />
              <Valor rotulo="Def. Mágica" valor={c.defesaMagica} />
              <Valor rotulo="Iniciativa" valor={c.iniciativa >= 0 ? `+${c.iniciativa}` : c.iniciativa} />
            </div>
            {(c.habilidades.defesa > 0 || c.habilidades.reducaoDano > 0) && (
              <p className="mt-2 text-xs text-ouro">
                {c.habilidades.defesa > 0 && `Esquiva: +${c.habilidades.defesa} de Defesa (já somado). `}
                {c.habilidades.reducaoDano > 0 && `Maestria Defensiva: todo dano sofrido −${c.habilidades.reducaoDano}.`}
              </p>
            )}
            <details className="mt-3 text-sm">
              <summary className="cursor-pointer text-suave">Bônus extras de defesa</summary>
              <div className="mt-2 grid grid-cols-3 gap-3">
                <Campo rotulo="Defesa">
                  <Numero valor={f.defesaExtra} onChange={(v) => set("defesaExtra", v)} />
                </Campo>
                <Campo rotulo="Def. Mágica">
                  <Numero valor={f.defesaMagicaExtra} onChange={(v) => set("defesaMagicaExtra", v)} />
                </Campo>
                <Campo rotulo="Iniciativa">
                  <Numero valor={f.iniciativaExtra} onChange={(v) => set("iniciativaExtra", v)} />
                </Campo>
              </div>
            </details>
          </section>

          {/* Condições */}
          <section className="janela p-4">
            <h2 className="titulo-secao">Condições</h2>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {CONDICOES.map((cond) => (
                <label
                  key={cond.id}
                  className={`flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm ${
                    f.condicoes[cond.id] ? "border-pv bg-pv/20" : "border-white/15 bg-black/20"
                  }`}
                >
                  <input
                    type="checkbox"
                    className="accent-[var(--pv)]"
                    checked={!!f.condicoes[cond.id]}
                    onChange={(e) => set("condicoes", { ...f.condicoes, [cond.id]: e.target.checked })}
                  />
                  <span>
                    {cond.nome}
                    <span className="block text-xs text-suave">{cond.afeta.map((a) => a.toUpperCase()).join(" e ")} −1 dado</span>
                  </span>
                </label>
              ))}
            </div>
          </section>
        </div>

        <div className="space-y-5">
          <SecaoClasses f={f} set={set} avisos={listaAvisos} />
          <SecaoEquipamento f={f} set={set} />

          {/* Laços */}
          <section className="janela p-4">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="titulo-secao mb-0">Laços</h2>
              <button className="botao" disabled={f.lacos.length >= 6} onClick={() => set("lacos", [...f.lacos, { nome: "", emocoes: [] }])}>
                + Laço
              </button>
            </div>
            <div className="space-y-2">
              {f.lacos.map((laco, i) => {
                const atualizar = (parcial: Partial<typeof laco>) => set("lacos", f.lacos.map((x, j) => (j === i ? { ...x, ...parcial } : x)));
                return (
                  <div key={i} className="rounded-md bg-black/25 p-2">
                    <div className="flex gap-2">
                      <input className="campo" placeholder="Com quem? (pessoa, grupo, lugar…)" value={laco.nome} onChange={(e) => atualizar({ nome: e.target.value })} />
                      <span className="self-center whitespace-nowrap text-sm text-ouro" title="Força do laço">
                        {laco.emocoes.length}/3
                      </span>
                      <button className="botao px-2" onClick={() => set("lacos", f.lacos.filter((_, j) => j !== i))}>
                        ✕
                      </button>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {PARES_EMOCOES.map((par) =>
                        par.map((emocao) => {
                          const ativa = laco.emocoes.includes(emocao);
                          const oposta = par.find((x) => x !== emocao)!;
                          return (
                            <button
                              key={emocao}
                              className={`rounded-full border px-2.5 py-0.5 text-xs ${ativa ? "border-ouro bg-ouro text-[#2a1d00]" : "border-white/20 text-suave hover:text-texto"}`}
                              onClick={() =>
                                atualizar({
                                  emocoes: ativa ? laco.emocoes.filter((x) => x !== emocao) : [...laco.emocoes.filter((x) => x !== oposta), emocao],
                                })
                              }
                            >
                              {emocao}
                            </button>
                          );
                        }),
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Magias */}
          <section className="janela p-4">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="titulo-secao mb-0">Magias</h2>
              <button className="botao" onClick={() => set("magias", [...f.magias, { nome: "", pm: "", alvo: "", duracao: "", efeito: "" }])}>
                + Magia
              </button>
            </div>
            <div className="space-y-2">
              {f.magias.map((m, i) => {
                const atualizar = (parcial: Partial<typeof m>) => set("magias", f.magias.map((x, j) => (j === i ? { ...x, ...parcial } : x)));
                return (
                  <div key={i} className="grid grid-cols-2 gap-2 rounded-md bg-black/25 p-2 sm:grid-cols-[1.5fr_0.6fr_1fr_1fr_auto]">
                    <input className="campo col-span-2 sm:col-span-1" placeholder="Nome" value={m.nome} onChange={(e) => atualizar({ nome: e.target.value })} />
                    <input className="campo" placeholder="PM" value={m.pm} onChange={(e) => atualizar({ pm: e.target.value })} />
                    <input className="campo" placeholder="Alvo" value={m.alvo} onChange={(e) => atualizar({ alvo: e.target.value })} />
                    <input className="campo" placeholder="Duração" value={m.duracao} onChange={(e) => atualizar({ duracao: e.target.value })} />
                    <button className="botao px-2" onClick={() => set("magias", f.magias.filter((_, j) => j !== i))}>
                      ✕
                    </button>
                    <textarea className="campo col-span-full min-h-12 text-sm" placeholder="Efeito" value={m.efeito} onChange={(e) => atualizar({ efeito: e.target.value })} />
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      </div>

      <section className="grid gap-5 md:grid-cols-2">
        <div className="janela p-4">
          <h2 className="titulo-secao">Inventário</h2>
          <textarea className="campo min-h-40" placeholder="Poções, itens raros, chaves…" value={f.inventario} onChange={(e) => set("inventario", e.target.value)} />
        </div>
        <div className="janela p-4">
          <h2 className="titulo-secao">Anotações</h2>
          <textarea className="campo min-h-40" placeholder="História, objetivos, segredos…" value={f.notas} onChange={(e) => set("notas", e.target.value)} />
        </div>
      </section>
      </fieldset>
    </div>
  );
}

function StatusSalvar({ status }: { status: Status }) {
  const textos: Record<Status, string> = {
    salvo: "✓ Salvo",
    pendente: "Alterações pendentes…",
    salvando: "Salvando…",
    erro: "⚠ Erro ao salvar",
  };
  return <span className={`text-sm ${status === "erro" ? "text-pv" : status === "salvo" ? "text-pi" : "text-suave"}`}>{textos[status]}</span>;
}

function Campo({ rotulo, dica, className = "", children }: { rotulo: string; dica?: string; className?: string; children: React.ReactNode }) {
  return (
    <label className={`block ${className}`} title={dica}>
      <span className="rotulo mb-1 block">{rotulo}</span>
      {children}
    </label>
  );
}

function Numero({ valor, onChange, min, max, prefixo }: { valor: number; onChange: (v: number) => void; min?: number; max?: number; prefixo?: string }) {
  return (
    <div className="flex items-center">
      {prefixo && <span className="mr-1 text-xs text-suave">{prefixo}</span>}
      <input
        type="number"
        className="campo"
        value={valor}
        min={min}
        max={max}
        onChange={(e) => {
          let v = Number(e.target.value) || 0;
          if (min !== undefined) v = Math.max(min, v);
          if (max !== undefined) v = Math.min(max, v);
          onChange(v);
        }}
      />
    </div>
  );
}

function Valor({ rotulo, valor }: { rotulo: string; valor: React.ReactNode }) {
  return (
    <div className="rounded-md bg-black/25 p-3">
      <div className="rotulo">{rotulo}</div>
      <div className="font-titulo text-3xl text-ouro">{valor}</div>
    </div>
  );
}

function Recurso({
  rotulo,
  cor,
  atual,
  max,
  extra,
  onChange,
}: {
  rotulo: string;
  cor: string;
  atual: number;
  max: number;
  extra?: string;
  onChange: (v: number) => void;
}) {
  const pct = max > 0 ? Math.max(0, Math.min(100, (atual / max) * 100)) : 0;
  const [delta, setDelta] = useState(1);
  const ajustar = (sinal: 1 | -1) => onChange(Math.max(0, Math.min(max, atual + sinal * delta)));
  return (
    <div className="rounded-md bg-black/25 p-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="w-8 font-titulo text-lg">{rotulo}</span>
        <button className="botao px-2.5" onClick={() => ajustar(-1)} aria-label={`Diminuir ${rotulo}`}>
          −
        </button>
        <input
          type="number"
          className="campo w-16 text-center"
          value={delta}
          min={1}
          title="Quanto somar ou subtrair"
          onChange={(e) => setDelta(Math.max(1, Number(e.target.value) || 1))}
        />
        <button className="botao px-2.5" onClick={() => ajustar(1)} aria-label={`Aumentar ${rotulo}`}>
          +
        </button>
        <div className="ml-auto flex items-baseline gap-1">
          <input
            type="number"
            className="campo w-16 text-right font-semibold"
            value={atual}
            onChange={(e) => onChange(Math.max(0, Number(e.target.value) || 0))}
          />
          <span className="text-suave">/ {max}</span>
        </div>
      </div>
      <div className="mt-2 h-2 rounded bg-black/40">
        <div className={`h-full rounded transition-all ${cor}`} style={{ width: `${pct}%` }} />
      </div>
      {extra && <div className="mt-1 text-xs text-suave">{extra}</div>}
    </div>
  );
}
