"use client";

import { ARMADURAS, ARMAS, ESCUDOS } from "@/lib/equipamentos";
import { habilidadesDaClasse } from "@/lib/habilidades";
import { lerPrecisao } from "@/lib/dados";
import { CLASSES, avisosEquipamento, escolhasUsadas, type Arma, type Ficha } from "@/lib/regras";

type Props = { f: Ficha; set: <K extends keyof Ficha>(chave: K, valor: Ficha[K]) => void; avisos: string[] };

export function SecaoClasses({ f, set, avisos }: Props) {
  return (
    <section className="janela p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="titulo-secao mb-0">Classes</h2>
        <button
          className="botao"
          onClick={() => {
            const livre = CLASSES.find((x) => !f.classes.some((cl) => cl.classeId === x.id)) ?? CLASSES[0];
            set("classes", [...f.classes, { classeId: livre.id, nivel: 1, pericias: {}, habilidades: "" }]);
          }}
        >
          + Classe
        </button>
      </div>
      {f.classes.length === 0 && (
        <p className="text-sm text-suave">Adicione de 2 a 3 classes, somando 5 níveis. Cada nível numa classe dá uma habilidade dela.</p>
      )}
      {avisos.length > 0 && (
        <div className="mb-3 rounded-md border border-ouro/50 bg-ouro/10 px-3 py-2 text-sm text-ouro">
          {avisos.map((a) => (
            <div key={a}>⚠ {a}</div>
          ))}
        </div>
      )}
      <div className="space-y-3">
        {f.classes.map((cl, i) => {
          const info = CLASSES.find((x) => x.id === cl.classeId);
          const lista = habilidadesDaClasse(cl.classeId);
          const usadas = escolhasUsadas(cl);
          const restantes = cl.nivel - usadas;
          const atualizar = (parcial: Partial<typeof cl>) => set("classes", f.classes.map((x, j) => (j === i ? { ...x, ...parcial } : x)));
          const mudarSL = (id: string, delta: number) => {
            const novo = Math.max(0, (cl.pericias[id] ?? 0) + delta);
            const pericias = { ...cl.pericias, [id]: novo };
            if (!novo) delete pericias[id];
            atualizar({ pericias });
          };
          const b = info?.beneficio;
          const textoBeneficio = [b?.pv && `+${b.pv} PV`, b?.pm && `+${b.pm} PM`, b?.pi && `+${b.pi} PI`, b?.equipa && `Equipa: ${b.equipa}`]
            .filter(Boolean)
            .join(" · ");
          const adquiridas = lista.filter((hab) => cl.pericias[hab.id]);
          const disponiveis = lista.filter((hab) => (cl.pericias[hab.id] ?? 0) < hab.max);

          return (
            <div key={i} className="rounded-md bg-black/25 p-3">
              <div className="flex gap-2">
                <select className="campo" value={cl.classeId} onChange={(e) => atualizar({ classeId: e.target.value, pericias: {} })}>
                  {CLASSES.map((x) => (
                    <option key={x.id} value={x.id} className="bg-janela">
                      {x.nome}
                    </option>
                  ))}
                </select>
                <div className="w-24 shrink-0">
                  <input
                    type="number"
                    className="campo"
                    title="Nível nesta classe"
                    value={cl.nivel}
                    min={1}
                    max={10}
                    onChange={(e) => atualizar({ nivel: Math.min(10, Math.max(1, Number(e.target.value) || 1)) })}
                  />
                </div>
                <button className="botao px-2" title="Remover classe" onClick={() => set("classes", f.classes.filter((_, j) => j !== i))}>
                  ✕
                </button>
              </div>
              {info && (
                <p className="mt-1 text-xs text-suave">
                  {info.resumo} — <span className="text-ouro">{textoBeneficio}</span>
                </p>
              )}

              <div className="mt-3 flex items-center justify-between text-xs">
                <span className="rotulo">Habilidades</span>
                <span className={restantes > 0 ? "text-ouro" : restantes < 0 ? "text-pv" : "text-suave"}>
                  {usadas} de {cl.nivel} escolhas usadas
                </span>
              </div>
              <ul className="mt-1 space-y-1">
                {adquiridas.map((hab) => {
                  const nivelHab = cl.pericias[hab.id];
                  return (
                    <li key={hab.id} className="rounded bg-black/30 px-2 py-1.5">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{hab.nome}</span>
                        {hab.max > 1 && (
                          <span className="text-xs text-ouro" title="Nível da habilidade (SL)">
                            SL {nivelHab}/{hab.max}
                          </span>
                        )}
                        <span className="ml-auto flex gap-1">
                          <button className="botao px-2 py-0.5" title="Remover um nível" onClick={() => mudarSL(hab.id, -1)}>
                            −
                          </button>
                          {hab.max > 1 && (
                            <button
                              className="botao px-2 py-0.5"
                              title="Adicionar um nível"
                              disabled={nivelHab >= hab.max || restantes <= 0}
                              onClick={() => mudarSL(hab.id, 1)}
                            >
                              +
                            </button>
                          )}
                        </span>
                      </div>
                      <p className="mt-0.5 text-xs text-suave">{hab.resumo}</p>
                    </li>
                  );
                })}
              </ul>
              {restantes > 0 ? (
                <select
                  className="campo mt-2 text-sm"
                  value=""
                  onChange={(e) => e.target.value && mudarSL(e.target.value, 1)}
                  title="Habilidades que você ainda pode pegar nesta classe"
                >
                  <option value="" disabled hidden className="bg-janela">
                    + Escolher habilidade ({restantes} {restantes === 1 ? "disponível" : "disponíveis"})…
                  </option>
                  {disponiveis.map((hab) => (
                    <option key={hab.id} value={hab.id} className="bg-janela">
                      {hab.nome}
                      {hab.max > 1 ? ` (${cl.pericias[hab.id] ?? 0}/${hab.max})` : ""} — {hab.resumo}
                    </option>
                  ))}
                </select>
              ) : (
                cl.nivel < 10 && <p className="mt-2 text-xs text-suave">Suba o nível desta classe para escolher mais habilidades.</p>
              )}
              <textarea
                className="campo mt-2 min-h-12 text-sm"
                placeholder="Anotações: Perícia Heroica, Arcanos vinculados, escolhas de habilidades…"
                value={cl.habilidades}
                onChange={(e) => atualizar({ habilidades: e.target.value })}
              />
            </div>
          );
        })}
      </div>
    </section>
  );
}

const categorias = [...new Set(ARMAS.map((a) => a.categoria))];

export function SecaoEquipamento({ f, set, rolarArma }: Omit<Props, "avisos"> & { rolarArma?: (arma: Arma) => void }) {
  const avisos = avisosEquipamento(f);
  return (
    <section className="janela space-y-4 p-4">
      <div>
        <h2 className="titulo-secao mb-0">Equipamento</h2>
        <p className="text-xs text-suave">Na criação, você tem 500 zenit para comprar equipamento básico. Itens “marciais” exigem certas classes.</p>
      </div>
      {avisos.length > 0 && (
        <div className="rounded-md border border-ouro/50 bg-ouro/10 px-3 py-2 text-sm text-ouro">
          {avisos.map((a) => (
            <div key={a}>⚠ {a}</div>
          ))}
        </div>
      )}

      <div>
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <span className="rotulo">Armas</span>
          <div className="flex min-w-0 flex-wrap gap-2">
            <select
              className="campo w-full min-w-0 text-sm sm:w-auto sm:max-w-full"
              value=""
              onChange={(e) => {
                const a = ARMAS.find((x) => x.id === e.target.value);
                if (!a) return;
                const notas = [a.categoria, a.maos === 1 ? "Uma mão" : "Duas mãos", a.alcance, a.marcial && "Marcial", a.qualidade].filter(Boolean).join(" · ");
                set("armas", [
                  ...f.armas,
                  { nome: a.nome, precisao: a.precisao, dano: a.dano, notas, marcial: a.marcial, distancia: a.alcance === "À distância" },
                ]);
              }}
            >
              <option value="" disabled hidden className="bg-janela">
                + Arma do livro…
              </option>
              {categorias.map((cat) => (
                <optgroup key={cat} label={cat} className="bg-janela">
                  {ARMAS.filter((a) => a.categoria === cat).map((a) => (
                    <option key={a.id} value={a.id} className="bg-janela">
                      {a.nome} — {a.precisao} · {a.dano} · {a.custo} z{a.marcial ? " · marcial" : ""}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
            <button className="botao" onClick={() => set("armas", [...f.armas, { nome: "", precisao: "", dano: "", notas: "" }])}>
              + Outra
            </button>
          </div>
        </div>
        <div className="space-y-2">
          {f.armas.map((arma, i) => {
            const atualizar = (parcial: Partial<typeof arma>) => set("armas", f.armas.map((x, j) => (j === i ? { ...x, ...parcial } : x)));
            return (
              <div key={i} className="grid grid-cols-2 gap-2 rounded-md bg-black/25 p-2 sm:grid-cols-[1.4fr_1fr_1fr_auto]">
                <input className="campo" placeholder="Nome (ex.: Florete)" value={arma.nome} onChange={(e) => atualizar({ nome: e.target.value })} />
                <input className="campo" placeholder="Precisão (DES + AST)" title="Atributos rolados no Teste de Precisão" value={arma.precisao} onChange={(e) => atualizar({ precisao: e.target.value })} />
                <input className="campo" placeholder="Dano (RA + 8 físico)" title="RA = Resultado Alto, o maior dos dois dados rolados" value={arma.dano} onChange={(e) => atualizar({ dano: e.target.value })} />
                <div className="flex gap-2">
                  {rolarArma && (
                    <button
                      className="botao border-ouro/60 px-2 text-ouro"
                      disabled={!lerPrecisao(arma.precisao)}
                      title={lerPrecisao(arma.precisao) ? "Rolar Teste de Precisão (e o dano)" : "Preencha a precisão (ex.: DES + AST) para rolar"}
                      onClick={() => rolarArma(arma)}
                    >
                      🎲
                    </button>
                  )}
                  <button className="botao px-2" onClick={() => set("armas", f.armas.filter((_, j) => j !== i))}>
                    ✕
                  </button>
                </div>
                <input className="campo col-span-full text-sm" placeholder="Notas (uma mão, corpo a corpo, qualidade…)" value={arma.notas} onChange={(e) => atualizar({ notas: e.target.value })} />
              </div>
            );
          })}
        </div>
      </div>

      <div className="rounded-md bg-black/25 p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="rotulo">Armadura {f.armadura.marcial && <span className="text-ouro">· marcial</span>}</span>
          <select
            className="campo w-full min-w-0 text-sm sm:w-auto sm:max-w-full"
            value=""
            onChange={(e) => {
              if (e.target.value === "nenhuma") return set("armadura", { nome: "", defesaFixa: null, defesa: 0, defesaMagica: 0, iniciativa: 0, marcial: false });
              const a = ARMADURAS.find((x) => x.id === e.target.value);
              if (a) set("armadura", { nome: a.nome, defesaFixa: a.defesaFixa, defesa: a.defesa, defesaMagica: a.defesaMagica, iniciativa: a.iniciativa, marcial: a.marcial });
            }}
          >
            <option value="" disabled hidden className="bg-janela">
              Escolher do livro…
            </option>
            <option value="nenhuma" className="bg-janela">
              Sem armadura
            </option>
            {ARMADURAS.map((a) => (
              <option key={a.id} value={a.id} className="bg-janela">
                {a.nome} — Def {a.defesaFixa ?? `DES+${a.defesa}`} · D.Mág AST+{a.defesaMagica} · Inic {a.iniciativa} · {a.custo} z{a.marcial ? " · marcial" : ""}
              </option>
            ))}
          </select>
        </div>
        <input className="campo mt-1" placeholder="Nome (ex.: Traje de Viagem)" value={f.armadura.nome} onChange={(e) => set("armadura", { ...f.armadura, nome: e.target.value })} />
        <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
          <label className="block" title="Armaduras marciais têm Defesa fixa e ignoram a DES. Vazio = dado de DES + bônus.">
            <span className="rotulo mb-1 block">Defesa fixa</span>
            <input
              type="number"
              className="campo"
              placeholder="—"
              value={f.armadura.defesaFixa ?? ""}
              onChange={(e) => set("armadura", { ...f.armadura, defesaFixa: e.target.value === "" ? null : Number(e.target.value) })}
            />
          </label>
          <NumeroRotulado rotulo="Bônus Defesa" valor={f.armadura.defesa} onChange={(v) => set("armadura", { ...f.armadura, defesa: v })} />
          <NumeroRotulado rotulo="Bônus D. Mág." valor={f.armadura.defesaMagica} onChange={(v) => set("armadura", { ...f.armadura, defesaMagica: v })} />
          <NumeroRotulado rotulo="Iniciativa" valor={f.armadura.iniciativa} onChange={(v) => set("armadura", { ...f.armadura, iniciativa: v })} />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-md bg-black/25 p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="rotulo">Escudo {f.escudo.marcial && <span className="text-ouro">· marcial</span>}</span>
            <select
              className="campo w-full min-w-0 text-sm"
              value=""
              onChange={(e) => {
                if (e.target.value === "nenhum") return set("escudo", { nome: "", defesa: 0, defesaMagica: 0, marcial: false });
                const s = ESCUDOS.find((x) => x.id === e.target.value);
                if (s) set("escudo", { nome: s.nome, defesa: s.defesa, defesaMagica: s.defesaMagica, marcial: s.marcial });
              }}
            >
              <option value="" disabled hidden className="bg-janela">
                Escolher do livro…
              </option>
              <option value="nenhum" className="bg-janela">
                Sem escudo
              </option>
              {ESCUDOS.map((s) => (
                <option key={s.id} value={s.id} className="bg-janela">
                  {s.nome} — Def +{s.defesa} · D.Mág +{s.defesaMagica} · {s.custo} z{s.marcial ? " · marcial" : ""}
                </option>
              ))}
            </select>
          </div>
          <input className="campo mt-1" placeholder="Nome" value={f.escudo.nome} onChange={(e) => set("escudo", { ...f.escudo, nome: e.target.value })} />
          <div className="mt-2 grid grid-cols-2 gap-2">
            <NumeroRotulado rotulo="Defesa" valor={f.escudo.defesa} onChange={(v) => set("escudo", { ...f.escudo, defesa: v })} />
            <NumeroRotulado rotulo="D. Mágica" valor={f.escudo.defesaMagica} onChange={(v) => set("escudo", { ...f.escudo, defesaMagica: v })} />
          </div>
        </div>
        <div className="rounded-md bg-black/25 p-3">
          <span className="rotulo">Acessório</span>
          <input className="campo mt-1" placeholder="Nome" value={f.acessorio.nome} onChange={(e) => set("acessorio", { ...f.acessorio, nome: e.target.value })} />
          <textarea className="campo mt-2 min-h-14 text-sm" placeholder="Efeito" value={f.acessorio.efeito} onChange={(e) => set("acessorio", { ...f.acessorio, efeito: e.target.value })} />
        </div>
      </div>
    </section>
  );
}

function NumeroRotulado({ rotulo, valor, onChange }: { rotulo: string; valor: number; onChange: (v: number) => void }) {
  return (
    <label className="block">
      <span className="rotulo mb-1 block">{rotulo}</span>
      <input type="number" className="campo" value={valor} onChange={(e) => onChange(Number(e.target.value) || 0)} />
    </label>
  );
}
