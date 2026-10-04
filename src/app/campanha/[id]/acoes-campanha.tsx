"use client";

import { useState, useTransition } from "react";
import { excluirCampanha, removerJogador, sairCampanha } from "../actions";

export function AcoesCampanha({ campanhaId, souMestre }: { campanhaId: string; souMestre: boolean }) {
  const [confirmar, setConfirmar] = useState(false);
  const [pendente, iniciar] = useTransition();
  const rotulo = souMestre ? "Excluir campanha" : "Sair da campanha";
  const aviso = souMestre
    ? "Excluir a campanha? As fichas não são apagadas, voltam a ser particulares."
    : "Sair da campanha? Suas fichas voltam a ser particulares.";

  if (!confirmar)
    return (
      <button className="botao" onClick={() => setConfirmar(true)}>
        {rotulo}
      </button>
    );
  return (
    <div className="flex flex-wrap items-center gap-2 text-sm">
      <span>{aviso}</span>
      <button
        className="botao border-pv text-pv"
        disabled={pendente}
        onClick={() => iniciar(() => (souMestre ? excluirCampanha(campanhaId) : sairCampanha(campanhaId)))}
      >
        Confirmar
      </button>
      <button className="botao" onClick={() => setConfirmar(false)}>
        Cancelar
      </button>
    </div>
  );
}

export function CodigoConvite({ codigo }: { codigo: string }) {
  const [copiado, setCopiado] = useState(false);
  return (
    <div className="flex items-center gap-2">
      <span className="rounded-md bg-black/40 px-3 py-1.5 font-mono text-2xl tracking-[0.3em] text-ouro">{codigo}</span>
      <button
        className="botao"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(codigo);
            setCopiado(true);
            setTimeout(() => setCopiado(false), 1500);
          } catch {}
        }}
      >
        {copiado ? "Copiado!" : "Copiar"}
      </button>
    </div>
  );
}

export function RemoverJogador({ campanhaId, usuarioId, nome }: { campanhaId: string; usuarioId: string; nome: string }) {
  const [confirmar, setConfirmar] = useState(false);
  const [pendente, iniciar] = useTransition();
  if (!confirmar)
    return (
      <button className="rounded-full px-2 text-suave hover:bg-pv/30 hover:text-texto" title={`Remover ${nome}`} onClick={() => setConfirmar(true)}>
        ✕
      </button>
    );
  return (
    <span className="flex items-center gap-1 pr-1 text-xs">
      Remover?
      <button className="rounded bg-pv px-1.5" disabled={pendente} onClick={() => iniciar(() => removerJogador(campanhaId, usuarioId))}>
        Sim
      </button>
      <button className="rounded bg-white/10 px-1.5" onClick={() => setConfirmar(false)}>
        Não
      </button>
    </span>
  );
}
