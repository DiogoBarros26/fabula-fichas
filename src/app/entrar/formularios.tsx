"use client";

import { useActionState, useState } from "react";
import { cadastrar, entrar, type EstadoForm } from "./actions";

export function FormulariosEntrada({ pedeCodigo }: { pedeCodigo: boolean }) {
  const [modo, setModo] = useState<"entrar" | "cadastrar">("entrar");
  const [estadoEntrar, acaoEntrar, entrando] = useActionState<EstadoForm, FormData>(entrar, {});
  const [estadoCadastro, acaoCadastro, cadastrando] = useActionState<EstadoForm, FormData>(cadastrar, {});

  return (
    <div className="mx-auto mt-8 max-w-sm">
      <div className="janela p-6">
        <div className="mb-5 grid grid-cols-2 gap-1 rounded-md bg-black/30 p-1 text-sm">
          {(["entrar", "cadastrar"] as const).map((m) => (
            <button
              key={m}
              onClick={() => setModo(m)}
              className={`rounded px-3 py-1.5 ${modo === m ? "bg-ouro font-semibold text-[#2a1d00]" : "text-suave hover:text-texto"}`}
            >
              {m === "entrar" ? "Entrar" : "Criar conta"}
            </button>
          ))}
        </div>

        {modo === "entrar" ? (
          <form action={acaoEntrar} className="space-y-3">
            <Campo nome="usuario" rotulo="Usuário" autoComplete="username" />
            <Campo nome="senha" rotulo="Senha" tipo="password" autoComplete="current-password" />
            {estadoEntrar.erro && <p className="text-sm text-pv">{estadoEntrar.erro}</p>}
            <button className="botao-ouro w-full" disabled={entrando}>
              {entrando ? "Entrando…" : "Entrar"}
            </button>
          </form>
        ) : (
          <form action={acaoCadastro} className="space-y-3">
            <Campo nome="nome" rotulo="Seu nome" autoComplete="name" />
            <Campo nome="usuario" rotulo="Usuário (para entrar)" autoComplete="username" />
            <Campo nome="senha" rotulo="Senha (mín. 6 caracteres)" tipo="password" autoComplete="new-password" />
            {pedeCodigo && <Campo nome="codigo" rotulo="Código do grupo" />}
            {estadoCadastro.erro && <p className="text-sm text-pv">{estadoCadastro.erro}</p>}
            <button className="botao-ouro w-full" disabled={cadastrando}>
              {cadastrando ? "Criando…" : "Criar conta"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

function Campo({ nome, rotulo, tipo = "text", autoComplete }: { nome: string; rotulo: string; tipo?: string; autoComplete?: string }) {
  return (
    <label className="block">
      <span className="rotulo mb-1 block">{rotulo}</span>
      <input name={nome} type={tipo} required autoComplete={autoComplete} className="campo" />
    </label>
  );
}
