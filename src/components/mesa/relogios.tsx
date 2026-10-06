"use client";

import { useState } from "react";
import { apagarRelogio, criarRelogio, editarRelogio, moverRelogio } from "@/app/mesa/actions";
import type { TipoRelogio } from "@/db/schema";
import type { Relogio } from "@/lib/mesa";
import { TAMANHOS, TIPOS, secoesDoTeste } from "@/lib/relogios";
import { atualizarServidor, lerMesa, useMesa } from "./estado";
import { atualizarAgora } from "./musica";

const COR: Record<TipoRelogio, string> = { progresso: "var(--pi)", ameaca: "var(--pv)", tempo: "var(--ouro)" };

/** O círculo dividido em seções, com as preenchidas coloridas. */
export function DesenhoRelogio({ r, tamanho = 64 }: { r: Pick<Relogio, "secoes" | "preenchidas" | "tipo">; tamanho?: number }) {
  const c = 50;
  const raio = 46;
  const ponto = (i: number) => {
    const a = (i / r.secoes) * 2 * Math.PI - Math.PI / 2;
    return `${c + raio * Math.cos(a)} ${c + raio * Math.sin(a)}`;
  };
  return (
    <svg viewBox="0 0 100 100" width={tamanho} height={tamanho} className="shrink-0" aria-label={`${r.preenchidas} de ${r.secoes} seções`}>
      <circle cx={c} cy={c} r={raio} fill="rgba(0,0,0,.35)" />
      {Array.from({ length: r.secoes }, (_, i) =>
        i < r.preenchidas ? (
          <path key={i} d={`M ${c} ${c} L ${ponto(i)} A ${raio} ${raio} 0 0 1 ${ponto(i + 1)} Z`} fill={COR[r.tipo]} opacity={0.9} />
        ) : null,
      )}
      {Array.from({ length: r.secoes }, (_, i) => (
        <line key={i} x1={c} y1={c} x2={ponto(i).split(" ")[0]} y2={ponto(i).split(" ")[1]} stroke="var(--fundo)" strokeWidth={2.5} />
      ))}
      <circle cx={c} cy={c} r={raio} fill="none" stroke="var(--borda)" strokeWidth={2.5} />
    </svg>
  );
}

/** Muda o relógio na hora (sem esperar o servidor) e depois grava. */
async function comandar(id: string, mudanca: (r: Relogio) => Relogio | null, gravar: () => Promise<unknown>) {
  const { servidor, defasagem } = lerMesa();
  if (servidor) {
    const relogios = servidor.relogios.flatMap((r) => (r.id === id ? (mudanca(r) ?? []) : [r]));
    atualizarServidor({ ...servidor, relogios }, defasagem);
  }
  try {
    await gravar();
  } finally {
    atualizarAgora();
  }
}

export function PainelRelogios() {
  const mesa = useMesa();
  const [criando, setCriando] = useState(false);
  const [erro, setErro] = useState("");
  const campanhaId = mesa.campanha?.id;
  const ehMestre = !!mesa.servidor?.ehMestre;
  const lista = mesa.servidor?.relogios ?? [];
  if (!campanhaId) return null;

  const executar = async (acao: () => Promise<unknown>) => {
    setErro("");
    try {
      await acao();
    } catch (e) {
      setErro((e as Error).message || "Não deu certo. Tente de novo.");
    }
  };

  return (
    <div className="min-h-32 flex-1 space-y-2 overflow-y-auto p-3">
      {lista.length === 0 && !criando && (
        <p className="text-center text-sm text-suave">
          {ehMestre
            ? "Nenhum relógio. Crie um para acompanhar um objetivo, uma ameaça ou um prazo."
            : "Nenhum relógio na mesa por enquanto."}
        </p>
      )}
      {lista.map((r) => (
        <CartaoRelogio key={r.id} r={r} campanhaId={campanhaId} ehMestre={ehMestre} executar={executar} />
      ))}
      {ehMestre &&
        (criando ? (
          <FormRelogio
            titulo="Novo relógio"
            onCancelar={() => setCriando(false)}
            onSalvar={(d) =>
              executar(async () => {
                await criarRelogio(campanhaId, d);
                setCriando(false);
                atualizarAgora();
              })
            }
          />
        ) : (
          <button className="botao w-full py-1.5 text-sm" onClick={() => setCriando(true)}>
            + Novo relógio
          </button>
        ))}
      {erro && <p className="text-xs text-pv">{erro}</p>}
    </div>
  );
}

function CartaoRelogio({
  r,
  campanhaId,
  ehMestre,
  executar,
}: {
  r: Relogio;
  campanhaId: string;
  ehMestre: boolean;
  executar: (acao: () => Promise<unknown>) => void;
}) {
  const [modo, setModo] = useState<"" | "editar" | "teste" | "apagar">("");
  const completo = r.preenchidas >= r.secoes;
  const mover = (delta: number) =>
    executar(() =>
      comandar(
        r.id,
        (x) => ({ ...x, preenchidas: Math.max(0, Math.min(x.secoes, x.preenchidas + delta)) }),
        () => moverRelogio(campanhaId, r.id, delta),
      ),
    );

  if (modo === "editar")
    return (
      <FormRelogio
        titulo="Editar relógio"
        inicial={r}
        onCancelar={() => setModo("")}
        onSalvar={(d) =>
          executar(async () => {
            setModo("");
            await comandar(r.id, (x) => ({ ...x, ...d, preenchidas: Math.min(x.preenchidas, d.secoes) }), () => editarRelogio(campanhaId, r.id, d));
          })
        }
      />
    );

  return (
    <div className={`rounded-md border px-3 py-2 ${completo ? (r.tipo === "progresso" ? "border-pi bg-pi/10" : "border-pv bg-pv/10") : "border-white/10 bg-black/25"}`}>
      <div className="flex items-center gap-3">
        <DesenhoRelogio r={r} />
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-1.5">
            <span className="truncate font-titulo text-ouro">{r.nome}</span>
            {r.oculto && <span title="Oculto: só o Mestre vê">🔒</span>}
          </div>
          <div className="text-xs text-suave" title={TIPOS[r.tipo].dica}>
            {TIPOS[r.tipo].nome} · <b className="text-texto">{r.preenchidas}</b>/{r.secoes}
            {completo && <span className={`ml-1.5 font-bold ${r.tipo === "progresso" ? "text-pi" : "text-pv"}`}>Completo!</span>}
          </div>
          {ehMestre && (
            <div className="mt-1.5 flex flex-wrap items-center gap-1">
              <button className="botao px-2 py-0.5 text-xs" disabled={r.preenchidas <= 0} onClick={() => mover(-1)} title="Apagar 1 seção">
                −1
              </button>
              <button className="botao px-2 py-0.5 text-xs" disabled={completo} onClick={() => mover(1)} title="Preencher 1 seção">
                +1
              </button>
              <button className="botao px-2 py-0.5 text-xs" disabled={completo} onClick={() => mover(2)} title="Evento importante: 2 seções">
                +2
              </button>
              {r.tipo !== "tempo" && (
                <button className="botao px-2 py-0.5 text-xs" onClick={() => setModo(modo === "teste" ? "" : "teste")} title="Calcular as seções a partir de um teste">
                  🎲 Teste
                </button>
              )}
              <span className="ml-auto flex gap-1.5 text-xs">
                <button className="text-suave hover:text-texto" onClick={() => setModo("editar")} title="Editar" aria-label="Editar relógio">
                  ✎
                </button>
                <button className="text-suave hover:text-pv" onClick={() => setModo("apagar")} title="Apagar relógio" aria-label="Apagar relógio">
                  🗑
                </button>
              </span>
            </div>
          )}
        </div>
      </div>
      {modo === "apagar" && (
        <div className="mt-2 flex items-center justify-end gap-2 text-xs">
          <span>Apagar este relógio?</span>
          <button
            className="botao border-pv px-2 py-0.5 text-xs text-pv"
            onClick={() => executar(() => comandar(r.id, () => null, () => apagarRelogio(campanhaId, r.id)))}
          >
            Apagar
          </button>
          <button className="botao px-2 py-0.5 text-xs" onClick={() => setModo("")}>
            Cancelar
          </button>
        </div>
      )}
      {modo === "teste" && <AplicarTeste r={r} onMover={(delta) => (setModo(""), mover(delta))} />}
    </div>
  );
}

/** Escolhe um teste do histórico, informa a Dificuldade e o livro diz quantas seções mexer. */
function AplicarTeste({ r, onMover }: { r: Relogio; onMover: (delta: number) => void }) {
  const { rolagens } = useMesa();
  const testes = rolagens.filter((x) => x.resultado.tipo === "teste").slice(-8).reverse();
  const [escolhida, setEscolhida] = useState(testes[0]?.id ?? 0);
  const [dificuldade, setDificuldade] = useState(10);
  const [oportunidade, setOportunidade] = useState(false);
  const rolagem = testes.find((x) => x.id === escolhida);

  if (!rolagem) return <p className="mt-2 text-xs text-suave">Nenhum teste no histórico ainda. Peça uma rolagem aos jogadores.</p>;
  const x = rolagem.resultado;
  const calc = secoesDoTeste(x.total, dificuldade, !!x.critico, !!x.falha, oportunidade);
  // Progresso enche com sucesso; ameaça enche com falha (e um sucesso pode fazê-la voltar).
  const enche = r.tipo === "progresso" ? calc.sucesso : !calc.sucesso;

  return (
    <div className="mt-2 space-y-1.5 rounded border border-white/15 bg-black/30 p-2 text-xs">
      <select className="campo w-full py-1 text-xs" value={escolhida} onChange={(e) => setEscolhida(Number(e.target.value))}>
        {testes.map((t) => (
          <option key={t.id} value={t.id}>
            {t.autor}: {t.resultado.rotulo || "teste"} = {t.resultado.total}
            {t.resultado.critico ? " (crítico)" : t.resultado.falha ? " (falha crítica)" : ""}
          </option>
        ))}
      </select>
      <div className="flex flex-wrap items-center gap-2">
        <label className="flex items-center gap-1">
          Dificuldade
          <input
            type="number"
            className="campo w-14 py-0.5"
            value={dificuldade}
            onChange={(e) => setDificuldade(Math.max(0, Math.min(40, Number(e.target.value) || 0)))}
          />
        </label>
        {(x.critico || x.falha) && (
          <label className="flex cursor-pointer items-center gap-1" title="A oportunidade do crítico ou da falha crítica pode ser gasta para mover 2 seções a mais">
            <input type="checkbox" className="accent-[var(--ouro)]" checked={oportunidade} onChange={(e) => setOportunidade(e.target.checked)} />
            gastar a oportunidade (+2)
          </label>
        )}
      </div>
      <div>
        <b className={calc.sucesso ? "text-pi" : "text-pv"}>{calc.sucesso ? "Sucesso" : "Falha"}</b>
        {calc.margem !== 0 && <span className="text-suave"> por {Math.abs(calc.margem)}</span>} →{" "}
        <b>
          {calc.secoes} {calc.secoes === 1 ? "seção" : "seções"}
        </b>
      </div>
      <div className="flex gap-1.5">
        <button className={`${enche ? "botao-ouro" : "botao"} flex-1 py-1 text-xs`} onClick={() => onMover(calc.secoes)}>
          Preencher {calc.secoes}
        </button>
        <button className={`${!enche && r.tipo === "ameaca" ? "botao-ouro" : "botao"} flex-1 py-1 text-xs`} onClick={() => onMover(-calc.secoes)}>
          Apagar {calc.secoes}
        </button>
      </div>
    </div>
  );
}

type DadosForm = { nome: string; tipo: TipoRelogio; secoes: number; oculto: boolean };

function FormRelogio({
  titulo,
  inicial,
  onSalvar,
  onCancelar,
}: {
  titulo: string;
  inicial?: DadosForm;
  onSalvar: (d: DadosForm) => void;
  onCancelar: () => void;
}) {
  const [d, setD] = useState<DadosForm>(inicial ?? { nome: "", tipo: "ameaca", secoes: 6, oculto: false });
  const mudar = (parcial: Partial<DadosForm>) => setD({ ...d, ...parcial });
  return (
    <form
      className="space-y-2 rounded-md border border-ouro/50 bg-black/30 p-2.5 text-sm"
      onSubmit={(e) => {
        e.preventDefault();
        if (d.nome.trim()) onSalvar(d);
      }}
    >
      <div className="font-titulo text-ouro">{titulo}</div>
      <input className="campo w-full py-1" placeholder='Ex.: "Os caçadores alcançam a Nyssa"' value={d.nome} maxLength={60} autoFocus onChange={(e) => mudar({ nome: e.target.value })} />
      <div className="flex gap-1">
        {(Object.keys(TIPOS) as TipoRelogio[]).map((t) => (
          <button
            key={t}
            type="button"
            className={`flex-1 rounded border px-1 py-1 text-xs ${d.tipo === t ? "border-ouro text-ouro" : "border-white/20 text-suave hover:text-texto"}`}
            onClick={() => mudar({ tipo: t })}
          >
            {TIPOS[t].nome}
          </button>
        ))}
      </div>
      <p className="text-xs text-suave">{TIPOS[d.tipo].dica}</p>
      <div className="flex flex-wrap items-center gap-1">
        <span className="mr-1 text-xs text-suave">Seções</span>
        {TAMANHOS.map((n) => (
          <button
            key={n}
            type="button"
            className={`w-8 rounded border py-0.5 text-xs ${d.secoes === n ? "border-ouro text-ouro" : "border-white/20 text-suave hover:text-texto"}`}
            onClick={() => mudar({ secoes: n })}
          >
            {n}
          </button>
        ))}
        <input
          type="number"
          className="campo w-14 py-0.5 text-xs"
          min={2}
          max={20}
          value={d.secoes}
          onChange={(e) => mudar({ secoes: Math.max(2, Math.min(20, Number(e.target.value) || 2)) })}
          aria-label="Número de seções"
        />
        <DesenhoRelogio r={{ secoes: d.secoes, preenchidas: 0, tipo: d.tipo }} tamanho={28} />
      </div>
      <label className="flex cursor-pointer items-center gap-1.5 text-xs" title="O livro recomenda deixar os relógios à vista, mas uma ameaça pode começar em segredo">
        <input type="checkbox" className="accent-[var(--ouro)]" checked={d.oculto} onChange={(e) => mudar({ oculto: e.target.checked })} />
        🔒 Oculto (só o Mestre vê)
      </label>
      <div className="flex justify-end gap-1.5">
        <button type="button" className="botao px-3 py-1 text-xs" onClick={onCancelar}>
          Cancelar
        </button>
        <button type="submit" className="botao-ouro px-3 py-1 text-xs" disabled={!d.nome.trim()}>
          Salvar
        </button>
      </div>
    </form>
  );
}
