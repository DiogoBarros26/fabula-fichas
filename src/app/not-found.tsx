import Link from "next/link";

export default function NaoEncontrado() {
  return (
    <div className="janela mx-auto mt-10 max-w-md p-8 text-center">
      <div className="font-titulo text-2xl text-ouro">Ficha não encontrada</div>
      <p className="mt-2 text-suave">Ela não existe, foi excluída ou está oculta pelo dono.</p>
      <Link href="/" className="botao-ouro mt-5">
        Voltar às fichas
      </Link>
    </div>
  );
}
