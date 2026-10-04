"use client";

import { useActionState } from "react";
import { criarCampanha, entrarCampanha, type EstadoCampanha } from "./campanha/actions";

export function FormulariosCampanha() {
  const [estadoCriar, acaoCriar, criando] = useActionState<EstadoCampanha, FormData>(criarCampanha, {});
  const [estadoEntrar, acaoEntrar, entrando] = useActionState<EstadoCampanha, FormData>(entrarCampanha, {});
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <form action={acaoCriar} className="janela space-y-2 p-4">
        <div className="font-titulo text-ouro">Criar campanha</div>
        <p className="text-xs text-suave">Você será o Mestre e receberá um código para convidar os jogadores.</p>
        <div className="flex gap-2">
          <input name="nome" required className="campo" placeholder="Nome da campanha" />
          <button className="botao-ouro whitespace-nowrap" disabled={criando}>
            Criar
          </button>
        </div>
        {estadoCriar.erro && <p className="text-sm text-pv">{estadoCriar.erro}</p>}
      </form>
      <form action={acaoEntrar} className="janela space-y-2 p-4">
        <div className="font-titulo text-ouro">Entrar em uma campanha</div>
        <p className="text-xs text-suave">Peça o código ao Mestre da campanha.</p>
        <div className="flex gap-2">
          <input name="codigo" required className="campo uppercase tracking-widest" placeholder="Ex.: K7QM2X" maxLength={6} />
          <button className="botao whitespace-nowrap" disabled={entrando}>
            Entrar
          </button>
        </div>
        {estadoEntrar.erro && <p className="text-sm text-pv">{estadoEntrar.erro}</p>}
      </form>
    </div>
  );
}
