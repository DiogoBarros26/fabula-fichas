"use client";

import { useEffect, useRef, useState } from "react";
import { FACES_LIVRES, descreverDados, type Rolagem } from "@/lib/dados";
import type { EstadoMesa } from "@/lib/mesa";
import {
  atualizarServidor,
  definirSecreta,
  definirSom,
  dispensarAviso,
  entrarNaMesa,
  lerMesa,
  receberRolagens,
  rolar,
  sairDaMesa,
  trocarUsuario,
  useMesa,
  type CampanhaMesa,
} from "./estado";
import { MotorMusica, PainelMusica, registrarAtualizacao } from "./musica";

const INTERVALO_MS = 3000;

/** Colocado nas páginas da campanha e das fichas dela: liga a mesa àquela campanha. */
export function EntrarNaMesa({ campanha }: { campanha: CampanhaMesa }) {
  const { id, nome } = campanha;
  useEffect(() => {
    entrarNaMesa({ id, nome });
  }, [id, nome]);
  return null;
}

/** Painel flutuante com rolagens e música. Fica no layout, então continua aberto entre páginas. */
export function Mesa({ usuarioId }: { usuarioId: string }) {
  const mesa = useMesa();
  const [aberta, setAberta] = useState(false);
  const [aba, setAba] = useState<"dados" | "musica">("dados");
  const campanhaId = mesa.campanha?.id;

  // Se outra pessoa entrar neste navegador, a mesa da anterior não passa para ela.
  useEffect(() => {
    trocarUsuario(usuarioId);
  }, [usuarioId]);

  // Busca rolagens novas e o estado da música a cada poucos segundos.
  useEffect(() => {
    if (!campanhaId) return;
    let ativo = true;
    let timer: ReturnType<typeof setTimeout>;
    let primeira = true;
    const buscar = async () => {
      clearTimeout(timer);
      const desde = Math.max(0, ...lerMesa().rolagens.map((r) => r.id));
      try {
        const antes = Date.now();
        const resp = await fetch(`/api/mesa/${campanhaId}?desde=${desde}`, { cache: "no-store" });
        if (!ativo) return;
        if (resp.status === 403 || resp.status === 404) return sairDaMesa();
        if (resp.ok) {
          const dados = (await resp.json()) as EstadoMesa;
          if (!ativo || lerMesa().campanha?.id !== campanhaId) return;
          const depois = Date.now();
          atualizarServidor(dados, dados.agora - (antes + depois) / 2);
          receberRolagens(dados.rolagens, !primeira);
          primeira = false;
        }
      } catch {}
      if (ativo) timer = setTimeout(buscar, INTERVALO_MS);
    };
    buscar();
    registrarAtualizacao(buscar);
    return () => {
      ativo = false;
      clearTimeout(timer);
      registrarAtualizacao(null);
    };
  }, [campanhaId]);

  const tocando = !!mesa.servidor?.musica.tocando;
  if (!mesa.campanha && mesa.rolagens.length === 0) return null;
  const avisosVisiveis = aberta && aba === "dados" ? [] : mesa.avisos;

  return (
    <>
      <MotorMusica />
      <div className="pointer-events-none fixed right-3 bottom-20 z-40 flex w-[min(340px,calc(100vw-24px))] flex-col gap-2">
        {avisosVisiveis.map((r) => (
          <Aviso key={r.id} r={r} />
        ))}
      </div>

      {aberta ? (
        <div className="janela fixed right-3 bottom-3 z-50 flex max-h-[min(640px,calc(100dvh-24px))] w-[min(380px,calc(100vw-24px))] flex-col overflow-hidden">
          <div className="flex items-center gap-2 border-b border-white/15 px-3 py-2">
            <div className="min-w-0 flex-1">
              <div className="truncate font-titulo text-ouro">{mesa.campanha?.nome ?? "Rolagens particulares"}</div>
              {mesa.campanha && <div className="text-xs text-suave">Mesa da campanha · {mesa.servidor?.ehMestre ? "você é o Mestre" : "jogador"}</div>}
            </div>
            <button className="botao px-2" onClick={() => setAberta(false)} aria-label="Minimizar mesa">
              ▾
            </button>
          </div>
          {mesa.campanha && (
            <div className="flex border-b border-white/15 text-sm">
              {(["dados", "musica"] as const).map((x) => (
                <button
                  key={x}
                  className={`flex-1 py-2 ${aba === x ? "border-b-2 border-ouro text-ouro" : "text-suave hover:text-texto"}`}
                  onClick={() => setAba(x)}
                >
                  {x === "dados" ? "🎲 Dados" : `🎵 Música${tocando ? " ♪" : ""}`}
                </button>
              ))}
            </div>
          )}
          {aba === "dados" || !mesa.campanha ? <PainelDados /> : <PainelMusica />}
        </div>
      ) : (
        <button
          className="janela fixed right-3 bottom-3 z-50 flex items-center gap-2 px-4 py-2.5 font-titulo text-sm text-ouro hover:brightness-125"
          onClick={() => setAberta(true)}
        >
          🎲 Mesa
          {tocando && !mesa.somAtivo ? (
            <span
              className="animate-pulse rounded-full bg-ouro px-2 py-0.5 font-sans text-xs font-bold text-[#2a1d00]"
              onClick={(e) => {
                e.stopPropagation();
                definirSom(true);
              }}
              title="O Mestre está tocando música. Clique para ouvir."
            >
              🔈 Ouvir música
            </span>
          ) : (
            tocando && <span className="text-xs">♪</span>
          )}
        </button>
      )}
    </>
  );
}

function PainelDados() {
  const mesa = useMesa();
  const [qtd, setQtd] = useState(1);
  const [bonus, setBonus] = useState(0);
  const [erro, setErro] = useState("");
  const [rolando, setRolando] = useState(false);
  const fim = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fim.current?.scrollIntoView({ block: "end" });
  }, [mesa.rolagens.length]);

  const rolarLivre = async (faces: number) => {
    setErro("");
    setRolando(true);
    try {
      await rolar({
        rotulo: `${qtd}d${faces}${bonus ? (bonus > 0 ? ` + ${bonus}` : ` − ${-bonus}`) : ""}`,
        tipo: "livre",
        dados: Array.from({ length: qtd }, () => ({ faces })),
        bonus,
      });
    } catch {
      setErro("Não deu para rolar. Tente de novo.");
    } finally {
      setRolando(false);
    }
  };

  return (
    <>
      <div className="min-h-32 flex-1 space-y-2 overflow-y-auto p-3">
        {mesa.rolagens.length === 0 && (
          <p className="text-center text-sm text-suave">
            Nenhuma rolagem ainda. Clique nos dados dos atributos ou das armas na ficha, ou use os dados abaixo.
          </p>
        )}
        {mesa.rolagens.map((r) => (
          <CartaoRolagem key={r.id} r={r} />
        ))}
        <div ref={fim} />
      </div>
      <div className="space-y-2 border-t border-white/15 p-3">
        <div className="grid grid-cols-6 gap-1.5">
          {FACES_LIVRES.map((f) => (
            <button key={f} className="botao px-0 font-titulo" disabled={rolando} onClick={() => rolarLivre(f)}>
              d{f}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 text-sm">
          <label className="flex items-center gap-1">
            <span className="text-suave">Qtd.</span>
            <input type="number" className="campo w-14 py-1" min={1} max={10} value={qtd} onChange={(e) => setQtd(Math.min(10, Math.max(1, Number(e.target.value) || 1)))} />
          </label>
          <label className="flex items-center gap-1">
            <span className="text-suave">Bônus</span>
            <input type="number" className="campo w-16 py-1" value={bonus} onChange={(e) => setBonus(Math.max(-99, Math.min(99, Number(e.target.value) || 0)))} />
          </label>
          {mesa.campanha && (
            <label className="ml-auto flex cursor-pointer items-center gap-1 text-xs" title="Rolagens secretas só aparecem para você e para o Mestre">
              <input type="checkbox" className="accent-[var(--ouro)]" checked={mesa.secreta} onChange={(e) => definirSecreta(e.target.checked)} />
              🔒 Secreta
            </label>
          )}
        </div>
        {erro && <p className="text-xs text-pv">{erro}</p>}
      </div>
    </>
  );
}

function Aviso({ r }: { r: Rolagem }) {
  useEffect(() => {
    const t = setTimeout(() => dispensarAviso(r.id), 7000);
    return () => clearTimeout(t);
  }, [r.id]);
  return (
    <div className="janela pointer-events-auto animate-[surgir_.25s_ease-out] cursor-pointer p-2" onClick={() => dispensarAviso(r.id)} title="Fechar">
      <CartaoRolagem r={r} />
    </div>
  );
}

export function CartaoRolagem({ r }: { r: Rolagem }) {
  const { resultado: x } = r;
  const hora = new Date(r.criadoEm).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  const destaque = x.critico ? "border-ouro bg-ouro/15" : x.falha ? "border-pv bg-pv/15" : "border-white/10 bg-black/25";
  return (
    <div className={`rounded-md border px-3 py-2 ${destaque}`}>
      <div className="flex items-baseline gap-2 text-xs">
        <span className="truncate font-semibold text-ouro">{r.autor}</span>
        {r.secreta && <span title="Só você e o Mestre veem">🔒</span>}
        {r.id < 0 && <span className="text-suave" title="Ficha particular: só você viu esta rolagem">particular</span>}
        <span className="ml-auto shrink-0 text-suave">{hora}</span>
      </div>
      <div className="mt-1 flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm">{x.rotulo || descreverDados(x)}</div>
          <div className="mt-1 flex flex-wrap items-center gap-1">
            {x.dados.map((d, i) => (
              <span
                key={i}
                className={`rounded border px-1.5 py-0.5 text-xs ${x.ra !== undefined && d.valor === x.ra ? "border-ouro text-ouro" : "border-white/20"}`}
                title={`d${d.faces}`}
              >
                {d.rotulo && <span className="text-suave">{d.rotulo} </span>}
                <b>{d.valor}</b>
                <span className="text-suave">/{d.faces}</span>
              </span>
            ))}
            {x.bonus !== 0 && <span className="text-xs text-suave">{x.bonus > 0 ? `+${x.bonus}` : x.bonus}</span>}
          </div>
        </div>
        <div className="text-right">
          <div className={`font-titulo text-3xl leading-none ${x.critico ? "text-ouro" : x.falha ? "text-pv" : ""}`}>{x.total}</div>
          {x.ra !== undefined && <div className="text-[10px] text-suave">RA {x.ra}</div>}
        </div>
      </div>
      {(x.critico || x.falha || x.dano) && (
        <div className="mt-1 flex flex-wrap gap-x-3 text-xs">
          {x.critico && <span className="font-bold text-ouro">✦ CRÍTICO!</span>}
          {x.falha && <span className="font-bold text-pv">✖ Falha crítica</span>}
          {x.dano && (
            <span>
              Dano: <b className="text-sm text-pv">{x.dano.total}</b> {x.dano.tipo}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
