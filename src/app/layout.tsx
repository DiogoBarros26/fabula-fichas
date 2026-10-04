import type { Metadata } from "next";
import Link from "next/link";
import { Cinzel, Nunito_Sans } from "next/font/google";
import { ehAdmin, usuarioAtual } from "@/lib/auth";
import { Mesa } from "@/components/mesa/mesa";
import { sair } from "./entrar/actions";
import "./globals.css";

const titulo = Cinzel({ variable: "--font-titulo", subsets: ["latin"] });
const texto = Nunito_Sans({ variable: "--font-texto", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Fichas — Fabula Ultima",
  description: "Fichas de personagem do grupo de Fabula Ultima",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const usuario = await usuarioAtual();
  return (
    <html lang="pt-BR" className={`${titulo.variable} ${texto.variable} antialiased`}>
      <body>
        <header className="border-b border-white/10">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
            <Link href="/" className="font-titulo text-xl tracking-widest text-ouro">
              ✦ Fabula Ultima
            </Link>
            {usuario && (
              <form action={sair} className="flex items-center gap-3 text-sm">
                {ehAdmin(usuario) && (
                  <Link href="/admin" className="text-ouro hover:underline">
                    Administração
                  </Link>
                )}
                <Link href="/conta" className="text-suave hover:text-texto hover:underline" title="Minha conta e troca de senha">
                  {usuario.nome}
                </Link>
                <button className="botao">Sair</button>
              </form>
            )}
          </div>
        </header>
        <main className="mx-auto max-w-6xl px-4 pt-6 pb-24">{children}</main>
        {usuario && <Mesa usuarioId={usuario.id} />}
      </body>
    </html>
  );
}
