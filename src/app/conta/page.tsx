import { exigirUsuario } from "@/lib/auth";
import { FormularioSenha } from "./formulario-senha";

export default async function PaginaConta() {
  const usuario = await exigirUsuario();
  return (
    <div className="mx-auto max-w-md space-y-4">
      <div>
        <h1 className="font-titulo text-3xl">Minha conta</h1>
        <p className="text-suave">
          {usuario.nome} · usuário <span className="text-texto">{usuario.usuario}</span>
        </p>
      </div>
      <FormularioSenha />
    </div>
  );
}
