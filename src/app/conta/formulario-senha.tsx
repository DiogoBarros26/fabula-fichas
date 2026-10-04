"use client";

import { useActionState } from "react";
import { alterarSenha, type EstadoSenha } from "./actions";

export function FormularioSenha() {
  const [estado, acao, salvando] = useActionState<EstadoSenha, FormData>(alterarSenha, {});
  return (
    <form action={acao} className="janela space-y-3 p-5" key={estado.ok ? "ok" : "form"}>
      <h2 className="titulo-secao">Trocar senha</h2>
      <Campo nome="atual" rotulo="Senha atual" autoComplete="current-password" />
      <Campo nome="nova" rotulo="Nova senha (mín. 8 caracteres)" autoComplete="new-password" />
      <Campo nome="confirmacao" rotulo="Repita a nova senha" autoComplete="new-password" />
      {estado.erro && <p className="text-sm text-pv">{estado.erro}</p>}
      {estado.ok && <p className="text-sm text-pi">Senha alterada! Os outros aparelhos conectados foram desconectados.</p>}
      <button className="botao-ouro w-full" disabled={salvando}>
        {salvando ? "Salvando…" : "Trocar senha"}
      </button>
      <p className="text-xs text-suave">Dica: uma frase com 3 ou 4 palavras é fácil de lembrar e difícil de adivinhar.</p>
    </form>
  );
}

function Campo({ nome, rotulo, autoComplete }: { nome: string; rotulo: string; autoComplete: string }) {
  return (
    <label className="block">
      <span className="rotulo mb-1 block">{rotulo}</span>
      <input name={nome} type="password" required autoComplete={autoComplete} className="campo" />
    </label>
  );
}
