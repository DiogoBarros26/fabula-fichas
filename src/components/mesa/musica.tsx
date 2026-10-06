"use client";

import { upload } from "@vercel/blob/client";
import { useEffect, useRef, useState } from "react";
import { adicionarFaixa, controlarMusica, removerFaixa } from "@/app/mesa/actions";
import type { EstadoMusica, Faixa } from "@/lib/mesa";
import { idYoutube } from "@/lib/musica";
import { atualizarServidor, definirSom, definirVolume, lerMesa, marcarErroFaixa, useMesa } from "./estado";

// ---------- Sincronia ----------

let atualizarMesa: (() => void) | null = null;
/** A mesa registra aqui sua busca, para os controles do Mestre atualizarem na hora. */
export function registrarAtualizacao(f: (() => void) | null) {
  atualizarMesa = f;
}

/** Busca o estado da mesa agora, sem esperar a próxima atualização. */
export function atualizarAgora() {
  atualizarMesa?.();
}

/** Duração da faixa atual, informada pelo player assim que ele a conhece. */
const duracao = { faixaId: "", segundos: 0 };

/** Onde a faixa deveria estar agora, segundo o Mestre. */
function posicaoEsperada(m: EstadoMusica, defasagem: number, total: number) {
  let p = m.posicao + (m.tocando ? Math.max(0, (Date.now() + defasagem - m.atualizadoEm) / 1000) : 0);
  if (m.repetir && total > 0) p %= total;
  return total > 0 ? Math.min(p, total) : p;
}

function duracaoDe(faixaId: string | null) {
  return faixaId && duracao.faixaId === faixaId ? duracao.segundos : 0;
}

/** Aplica a mudança na hora (sem esperar o servidor) e depois grava. */
async function comandar(novo: Partial<Omit<EstadoMusica, "atualizadoEm">>) {
  const { campanha, servidor, defasagem } = lerMesa();
  if (!campanha || !servidor) return;
  const atual = servidor.musica;
  const musica: EstadoMusica = {
    faixaId: novo.faixaId !== undefined ? novo.faixaId : atual.faixaId,
    tocando: novo.tocando ?? atual.tocando,
    posicao: novo.posicao ?? posicaoEsperada(atual, defasagem, duracaoDe(atual.faixaId)),
    repetir: novo.repetir ?? atual.repetir,
    atualizadoEm: Date.now() + defasagem,
  };
  atualizarServidor({ ...servidor, musica }, defasagem);
  try {
    await controlarMusica(campanha.id, musica);
  } finally {
    atualizarMesa?.();
  }
}

function proxima(faixas: Faixa[], faixaId: string | null) {
  const i = faixas.findIndex((f) => f.id === faixaId);
  return faixas[i + 1] ?? null;
}

// ---------- Players ----------

type PropsMotor = { faixa: Faixa; musica: EstadoMusica; defasagem: number; ativo: boolean; volume: number };

/** Toca o que o Mestre mandar. Fica escondido; os controles ficam no painel. */
export function MotorMusica() {
  const { servidor, defasagem, somAtivo, volume } = useMesa();
  const musica = servidor?.musica;
  const faixa = servidor?.faixas.find((f) => f.id === musica?.faixaId);
  const ehMestre = !!servidor?.ehMestre;
  const avancou = useRef("");

  // Sem "repetir", o navegador do Mestre passa para a próxima faixa quando a atual acaba.
  useEffect(() => {
    if (!ehMestre || !musica?.tocando || musica.repetir || !faixa) return;
    const chave = `${faixa.id}:${musica.atualizadoEm}`;
    const t = setInterval(() => {
      const total = duracaoDe(faixa.id);
      if (!total || avancou.current === chave || posicaoEsperada(musica, defasagem, total) < total - 0.3) return;
      avancou.current = chave;
      const seguinte = proxima(lerMesa().servidor?.faixas ?? [], faixa.id);
      comandar(seguinte ? { faixaId: seguinte.id, tocando: true, posicao: 0 } : { tocando: false, posicao: 0 }).catch(() => {});
    }, 1000);
    return () => clearInterval(t);
  }, [ehMestre, musica, faixa, defasagem]);

  if (!faixa || !musica) return null;
  const props: PropsMotor = { faixa, musica, defasagem, ativo: somAtivo, volume };
  return faixa.tipo === "youtube" ? <MotorYoutube key={faixa.id} {...props} /> : <MotorAudio key={faixa.id} {...props} />;
}

function MotorAudio({ faixa, musica, defasagem, ativo, volume }: PropsMotor) {
  const ref = useRef<HTMLAudioElement>(null);
  const atual = useRef({ musica, defasagem, ativo });
  useEffect(() => {
    atual.current = { musica, defasagem, ativo };
  });

  useEffect(() => {
    const el = ref.current!;
    const sincronizar = () => {
      const { musica: m, defasagem: d, ativo: a } = atual.current;
      el.loop = m.repetir;
      if (el.duration) Object.assign(duracao, { faixaId: faixa.id, segundos: el.duration });
      const alvo = posicaoEsperada(m, d, el.duration || 0);
      if (!a || !m.tocando || (!m.repetir && el.duration && alvo >= el.duration)) {
        if (!el.paused) el.pause();
        if (!m.tocando && el.readyState > 0 && Math.abs(el.currentTime - alvo) > 1) el.currentTime = alvo;
        return;
      }
      if (el.readyState > 0 && Math.abs(el.currentTime - alvo) > 2) el.currentTime = alvo;
      // Só pedimos um clique se o navegador bloqueou o som (trocar de faixa também interrompe o play).
      if (el.paused) el.play().catch((e: DOMException) => e.name === "NotAllowedError" && definirSom(false));
    };
    sincronizar();
    el.addEventListener("loadedmetadata", sincronizar);
    const t = setInterval(sincronizar, 1000);
    return () => {
      clearInterval(t);
      el.removeEventListener("loadedmetadata", sincronizar);
      el.pause();
    };
  }, [faixa.id]);

  useEffect(() => {
    ref.current!.volume = volume;
  }, [volume]);

  return <audio ref={ref} src={faixa.url} preload="auto" className="hidden" />;
}

type PlayerYT = {
  playVideo(): void;
  pauseVideo(): void;
  seekTo(s: number, permitirBusca: boolean): void;
  getCurrentTime(): number;
  getDuration(): number;
  getPlayerState(): number;
  setVolume(v: number): void;
  getVideoData?(): { isLive?: boolean };
  destroy(): void;
};
type ApiYT = { Player: new (el: HTMLElement, opcoes: object) => PlayerYT };

let apiYoutube: Promise<ApiYT> | null = null;
function carregarYoutube() {
  return (apiYoutube ??= new Promise((ok) => {
    const w = window as unknown as { YT?: ApiYT; onYouTubeIframeAPIReady?: () => void };
    if (w.YT?.Player) return ok(w.YT);
    const anterior = w.onYouTubeIframeAPIReady;
    w.onYouTubeIframeAPIReady = () => {
      anterior?.();
      ok(w.YT!);
    };
    const s = document.createElement("script");
    s.src = "https://www.youtube.com/iframe_api";
    document.head.appendChild(s);
  }));
}

const YT_TERMINOU = 0;
const YT_TOCANDO = 1;
const YT_CARREGANDO = 3;

function MotorYoutube({ faixa, musica, defasagem, ativo, volume }: PropsMotor) {
  const caixa = useRef<HTMLDivElement>(null);
  const player = useRef<PlayerYT | null>(null);
  const atual = useRef({ musica, defasagem, ativo, volume });
  useEffect(() => {
    atual.current = { musica, defasagem, ativo, volume };
  });

  useEffect(() => {
    let vivo = true;
    let pronto = false;
    let tentouTocarEm = 0;
    const alvoDiv = document.createElement("div");
    caixa.current!.appendChild(alvoDiv);

    const sincronizar = () => {
      const p = player.current;
      if (!p || !pronto) return;
      const { musica: m, defasagem: d, ativo: a, volume: v } = atual.current;
      if (lerMesa().faixaComErro === faixa.id) return;
      p.setVolume(Math.round(v * 100));
      // Transmissões ao vivo não têm posição para sincronizar: todos ouvem o "agora" da live.
      const aoVivo = !!p.getVideoData?.().isLive;
      const total = aoVivo ? 0 : p.getDuration() || 0;
      if (total) Object.assign(duracao, { faixaId: faixa.id, segundos: total });
      const estado = p.getPlayerState();
      const alvo = posicaoEsperada(m, d, total);
      if (!a || !m.tocando || (!m.repetir && total && alvo >= total)) {
        if (estado === YT_TOCANDO || estado === YT_CARREGANDO) p.pauseVideo();
        return;
      }
      if (!aoVivo && Math.abs(p.getCurrentTime() - alvo) > 2.5) p.seekTo(alvo, true);
      if (estado !== YT_TOCANDO && estado !== YT_CARREGANDO) {
        // Se o navegador bloquear o som, depois de alguns segundos pedimos um clique.
        if (tentouTocarEm && Date.now() - tentouTocarEm > 8000) {
          tentouTocarEm = 0;
          return definirSom(false);
        }
        tentouTocarEm ||= Date.now();
        p.playVideo();
      } else tentouTocarEm = 0;
    };

    carregarYoutube().then((YT) => {
      if (!vivo) return;
      player.current = new YT.Player(alvoDiv, {
        videoId: idYoutube(faixa.url),
        width: "100%",
        height: "100%",
        playerVars: { controls: 0, disablekb: 1, playsinline: 1, rel: 0 },
        events: {
          onReady: () => {
            pronto = true;
            sincronizar();
          },
          onError: () => marcarErroFaixa(faixa.id),
          onStateChange: (e: { data: number }) => {
            if (e.data === YT_TOCANDO) marcarErroFaixa(null);
            if (e.data === YT_TERMINOU && atual.current.musica.repetir && atual.current.ativo) {
              player.current?.seekTo(0, true);
              player.current?.playVideo();
            }
          },
        },
      });
    });
    const t = setInterval(sincronizar, 1000);
    const caixaAtual = caixa.current!;
    return () => {
      vivo = false;
      clearInterval(t);
      player.current?.destroy();
      player.current = null;
      caixaAtual.innerHTML = "";
    };
  }, [faixa.id, faixa.url]);

  // O YouTube não toca em players invisíveis: fica um mini-player no canto enquanto a faixa é do YouTube.
  return (
    <div
      ref={caixa}
      title={faixa.titulo}
      className={`pointer-events-none fixed bottom-3 left-3 z-40 aspect-video w-40 overflow-hidden rounded-md border-2 border-borda bg-black shadow-lg sm:w-48 ${ativo && musica.tocando ? "" : "opacity-60"}`}
    />
  );
}

// ---------- Painel ----------

const formatar = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
const ICONES: Record<Faixa["tipo"], string> = { youtube: "▶️", audio: "🔗", arquivo: "💾" };

export function PainelMusica() {
  const { servidor, defasagem, somAtivo, volume, campanha, faixaComErro } = useMesa();
  const [, setTique] = useState(0);
  const [erro, setErro] = useState("");
  // Enquanto o Mestre arrasta a barra, a posição fica só na tela; ao soltar, vai para todos.
  const [arrastando, setArrastando] = useState<number | null>(null);

  // Atualiza a barra de progresso a cada segundo.
  useEffect(() => {
    const t = setInterval(() => setTique((x) => x + 1), 1000);
    return () => clearInterval(t);
  }, []);

  if (!servidor || !campanha) return <p className="p-4 text-center text-sm text-suave">Carregando…</p>;
  const { musica, faixas, ehMestre } = servidor;
  const faixa = faixas.find((f) => f.id === musica.faixaId);
  const total = duracaoDe(musica.faixaId);
  const pos = posicaoEsperada(musica, defasagem, total);

  const executar = async (acao: () => Promise<unknown>) => {
    setErro("");
    try {
      await acao();
    } catch (e) {
      setErro((e as Error).message || "Algo deu errado.");
    }
  };
  const tocar = (f: Faixa) => {
    definirSom(true);
    executar(() => comandar({ faixaId: f.id, tocando: true, posicao: 0 }));
  };

  return (
    <div className="flex-1 space-y-3 overflow-y-auto p-3">
      <div className="rounded-md bg-black/25 p-3">
        <div className="rotulo">{musica.tocando ? "Tocando agora" : faixa ? "Pausado" : "Nada tocando"}</div>
        <div className="truncate font-titulo text-lg">{faixa ? faixa.titulo : "—"}</div>
        {faixa && faixaComErro === faixa.id && (
          <p className="mt-1 text-xs text-pv">Este vídeo não pode ser tocado fora do YouTube (o dono bloqueou ou exige login). Use outro link.</p>
        )}
        {faixa && (
          <div className="mt-2 flex items-center gap-2 text-xs text-suave">
            <span className="w-9 text-right">{formatar(pos)}</span>
            {ehMestre && total > 0 ? (
              <input
                type="range"
                className="flex-1 accent-[var(--ouro)]"
                min={0}
                max={total}
                step={1}
                value={arrastando ?? pos}
                onChange={(e) => setArrastando(Number(e.target.value))}
                onPointerUp={() => {
                  if (arrastando === null) return;
                  setArrastando(null);
                  executar(() => comandar({ posicao: arrastando }));
                }}
                onKeyUp={() => {
                  if (arrastando === null) return;
                  setArrastando(null);
                  executar(() => comandar({ posicao: arrastando }));
                }}
                aria-label="Posição da faixa"
              />
            ) : (
              <div className="h-1.5 flex-1 rounded bg-black/40">
                <div className="h-full rounded bg-ouro" style={{ width: total ? `${(pos / total) * 100}%` : "0%" }} />
              </div>
            )}
            <span className="w-9">{total ? formatar(total) : "--:--"}</span>
          </div>
        )}
        {ehMestre && (
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              className="botao"
              disabled={!faixa}
              onClick={() => {
                if (!musica.tocando) definirSom(true);
                executar(() => comandar({ tocando: !musica.tocando }));
              }}
            >
              {musica.tocando ? "⏸ Pausar" : "▶ Tocar"}
            </button>
            <button
              className="botao"
              disabled={!proxima(faixas, musica.faixaId)}
              onClick={() => {
                const seguinte = proxima(faixas, musica.faixaId);
                if (seguinte) tocar(seguinte);
              }}
            >
              ⏭ Próxima
            </button>
            <button className="botao" disabled={!faixa} onClick={() => executar(() => comandar({ faixaId: null, tocando: false, posicao: 0 }))}>
              ⏹ Parar
            </button>
            <button
              className={`botao ${musica.repetir ? "border-ouro text-ouro" : ""}`}
              title={musica.repetir ? "Repetindo esta faixa" : "Ao terminar, passa para a próxima"}
              onClick={() => executar(() => comandar({ repetir: !musica.repetir }))}
            >
              🔁 {musica.repetir ? "Repetir: sim" : "Repetir: não"}
            </button>
          </div>
        )}
      </div>

      {somAtivo ? (
        <div className="flex items-center gap-2 text-sm">
          <span title="Volume (só no seu navegador)">🔊</span>
          <input
            type="range"
            className="flex-1 accent-[var(--ouro)]"
            min={0}
            max={1}
            step={0.05}
            value={volume}
            onChange={(e) => definirVolume(Number(e.target.value))}
            aria-label="Volume"
          />
          <button className="botao px-2 py-1 text-xs" onClick={() => definirSom(false)}>
            Silenciar
          </button>
        </div>
      ) : (
        <button className="botao-ouro w-full" onClick={() => definirSom(true)}>
          🔈 Ouvir a música da mesa
        </button>
      )}

      <div>
        <div className="rotulo mb-1">Playlist ({faixas.length})</div>
        {faixas.length === 0 && (
          <p className="text-sm text-suave">{ehMestre ? "Adicione links ou envie MP3 abaixo." : "O Mestre ainda não adicionou músicas."}</p>
        )}
        <ul className="space-y-1">
          {faixas.map((f) => (
            <li
              key={f.id}
              className={`flex items-center gap-2 rounded px-2 py-1 text-sm ${f.id === musica.faixaId ? "bg-ouro/15 text-ouro" : "bg-black/20"}`}
            >
              <span title={f.tipo === "youtube" ? "YouTube" : f.tipo === "arquivo" ? "MP3 enviado" : "Link de áudio"}>{ICONES[f.tipo]}</span>
              <span className="min-w-0 flex-1 truncate" title={f.titulo}>
                {f.titulo}
              </span>
              {ehMestre && (
                <>
                  <button className="botao px-2 py-0.5" title="Tocar desde o início" onClick={() => tocar(f)}>
                    ▶
                  </button>
                  <button className="botao px-2 py-0.5" title="Remover da playlist" onClick={() => executar(() => removerFaixa(campanha.id, f.id).then(() => atualizarMesa?.()))}>
                    ✕
                  </button>
                </>
              )}
            </li>
          ))}
        </ul>
      </div>

      {ehMestre && <AdicionarMusica campanhaId={campanha.id} aoErro={setErro} />}
      {erro && <p className="text-xs text-pv">{erro}</p>}
    </div>
  );
}

function AdicionarMusica({ campanhaId, aoErro }: { campanhaId: string; aoErro: (e: string) => void }) {
  const [url, setUrl] = useState("");
  const [titulo, setTitulo] = useState("");
  const [enviando, setEnviando] = useState<string | null>(null);
  const arquivo = useRef<HTMLInputElement>(null);

  const adicionarLink = async (e: React.FormEvent) => {
    e.preventDefault();
    aoErro("");
    try {
      await adicionarFaixa(campanhaId, url, titulo);
      setUrl("");
      setTitulo("");
      atualizarMesa?.();
    } catch (e) {
      aoErro((e as Error).message);
    }
  };

  const enviar = async (lista: FileList | null) => {
    if (!lista?.length) return;
    aoErro("");
    try {
      for (const f of Array.from(lista)) {
        if (f.size > 50 * 1024 * 1024) throw new Error(`${f.name} passa de 50 MB.`);
        const nome = f.name.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^\w.-]+/g, "-");
        setEnviando(`${f.name} — 0%`);
        const blob = await upload(`musicas/${campanhaId}/${nome}`, f, {
          access: "public",
          handleUploadUrl: `/api/mesa/${campanhaId}/upload`,
          multipart: f.size > 8 * 1024 * 1024,
          onUploadProgress: ({ percentage }) => setEnviando(`${f.name} — ${Math.round(percentage)}%`),
        });
        await adicionarFaixa(campanhaId, blob.url, f.name.replace(/\.\w+$/, ""));
        atualizarMesa?.();
      }
    } catch (e) {
      aoErro((e as Error).message || "Falha no envio.");
    } finally {
      setEnviando(null);
      if (arquivo.current) arquivo.current.value = "";
    }
  };

  return (
    <div className="space-y-2 rounded-md bg-black/25 p-3">
      <div className="rotulo">Adicionar música</div>
      <form onSubmit={adicionarLink} className="space-y-1.5">
        <input className="campo text-sm" placeholder="Link do YouTube ou de um .mp3" value={url} onChange={(e) => setUrl(e.target.value)} required />
        <div className="flex gap-2">
          <input className="campo text-sm" placeholder="Título (opcional)" value={titulo} onChange={(e) => setTitulo(e.target.value)} />
          <button className="botao shrink-0">+ Link</button>
        </div>
      </form>
      <label className={`botao w-full cursor-pointer ${enviando ? "pointer-events-none opacity-60" : ""}`}>
        {enviando ? `Enviando ${enviando}` : "📁 Enviar MP3 do computador"}
        <input ref={arquivo} type="file" accept="audio/*,.mp3" multiple className="hidden" onChange={(e) => enviar(e.target.files)} />
      </label>
      <p className="text-xs text-suave">Até 50 MB por arquivo. Todos da campanha ouvem o que você tocar.</p>
    </div>
  );
}
