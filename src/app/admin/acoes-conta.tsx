"use client";

import { useState, useTransition } from "react";
import { excluirConta, redefinirSenha } from "./actions";

export function AcoesConta({ usuarioId, nome, fichas, mestreDe }: { usuarioId: string; nome: string; fichas: number; mestreDe: number }) {
  const [modo, setModo] = useState<"normal" | "excluir" | "senha">("normal");
  const [senhaNova, setSenhaNova] = useState<string | null>(null);
  const [pendente, iniciar] = useTransition();

  if (senhaNova)
    return (
      <div className="space-y-1 text-xs">
        <div>
          Nova senha de {nome}: <span className="rounded bg-black/40 px-2 py-0.5 font-mono text-sm text-ouro">{senhaNova}</span>
        </div>
        <div className="text-suave">Repasse a senha agora; ela não será mostrada de novo.</div>
        <button className="botao" onClick={() => setSenhaNova(null)}>
          Ok
        </button>
      </div>
    );

  if (modo === "excluir")
    return (
      <div className="space-y-1 text-xs">
        <div>
          Excluir {nome}? Apaga {fichas} {fichas === 1 ? "ficha" : "fichas"}
          {mestreDe > 0 && ` e ${mestreDe} ${mestreDe === 1 ? "campanha" : "campanhas"} em que é Mestre`}. Não dá para desfazer.
        </div>
        <div className="flex gap-2">
          <button className="botao border-pv text-pv" disabled={pendente} onClick={() => iniciar(() => excluirConta(usuarioId))}>
            Excluir conta
          </button>
          <button className="botao" onClick={() => setModo("normal")}>
            Cancelar
          </button>
        </div>
      </div>
    );

  if (modo === "senha")
    return (
      <div className="space-y-1 text-xs">
        <div>Gerar uma senha nova para {nome}? A pessoa será desconectada.</div>
        <div className="flex gap-2">
          <button
            className="botao"
            disabled={pendente}
            onClick={() =>
              iniciar(async () => {
                setSenhaNova(await redefinirSenha(usuarioId));
                setModo("normal");
              })
            }
          >
            Gerar senha
          </button>
          <button className="botao" onClick={() => setModo("normal")}>
            Cancelar
          </button>
        </div>
      </div>
    );

  return (
    <div className="flex justify-end gap-2">
      <button className="botao" onClick={() => setModo("senha")}>
        Redefinir senha
      </button>
      <button className="botao hover:border-pv hover:text-pv" onClick={() => setModo("excluir")}>
        Excluir
      </button>
    </div>
  );
}
