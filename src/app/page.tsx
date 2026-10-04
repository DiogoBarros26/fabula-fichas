import Link from "next/link";
import { count, desc, eq, inArray, notInArray } from "drizzle-orm";
import { db } from "@/db";
import { campanhas, fichas, usuarios } from "@/db/schema";
import { ehAdmin, exigirUsuario } from "@/lib/auth";
import { minhasCampanhas } from "@/lib/permissoes";
import { CartoesFichas } from "@/components/cartoes-fichas";
import { criarFicha } from "./actions";
import { FormulariosCampanha } from "./formularios-campanha";

export default async function Home() {
  const usuario = await exigirUsuario();
  const banco = await db();

  const campanhasDoUsuario = await minhasCampanhas(usuario.id);
  const idsMinhas = campanhasDoUsuario.map((c) => c.id);
  // Administradores também veem as campanhas de que não participam.
  const outras = ehAdmin(usuario)
    ? await banco
        .select({ id: campanhas.id, nome: campanhas.nome, mestreNome: usuarios.nome })
        .from(campanhas)
        .innerJoin(usuarios, eq(campanhas.mestreId, usuarios.id))
        .where(idsMinhas.length ? notInArray(campanhas.id, idsMinhas) : undefined)
        .orderBy(campanhas.nome)
    : [];
  const totais = await banco
    .select({ campanhaId: fichas.campanhaId, total: count() })
    .from(fichas)
    .where(inArray(fichas.campanhaId, [...idsMinhas, ...outras.map((c) => c.id)]))
    .groupBy(fichas.campanhaId);

  const minhas = await banco
    .select({ id: fichas.id, dados: fichas.dados, visivel: fichas.visivel, campanhaNome: campanhas.nome })
    .from(fichas)
    .leftJoin(campanhas, eq(fichas.campanhaId, campanhas.id))
    .where(eq(fichas.donoId, usuario.id))
    .orderBy(desc(fichas.atualizadoEm));

  return (
    <div className="space-y-10">
      <section className="space-y-4">
        <h1 className="font-titulo text-3xl">Campanhas</h1>
        {campanhasDoUsuario.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {campanhasDoUsuario.map((c) => {
              const souMestre = c.mestreId === usuario.id;
              return (
                <Link key={c.id} href={`/campanha/${c.id}`} className="janela block p-4 transition hover:-translate-y-0.5 hover:border-ouro">
                  <div className="flex items-start justify-between gap-2">
                    <div className="font-titulo text-xl">{c.nome}</div>
                    <span className={`shrink-0 rounded px-1.5 py-0.5 text-xs ${souMestre ? "bg-ouro text-[#2a1d00]" : "bg-black/40 text-suave"}`}>
                      {souMestre ? "Mestre" : "Jogador"}
                    </span>
                  </div>
                  <div className="mt-1 text-sm text-suave">
                    Mestre: {c.mestreNome} ·{" "}
                    {totais.find((t) => t.campanhaId === c.id)?.total ?? 0} fichas
                  </div>
                </Link>
              );
            })}
          </div>
        )}
        <FormulariosCampanha />
        {outras.length > 0 && (
          <div className="space-y-3 pt-2">
            <h2 className="font-titulo text-xl text-suave">Outras campanhas <span className="text-sm">(acesso de admin)</span></h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {outras.map((c) => (
                <Link key={c.id} href={`/campanha/${c.id}`} className="janela block p-4 opacity-90 transition hover:-translate-y-0.5 hover:border-ouro">
                  <div className="flex items-start justify-between gap-2">
                    <div className="font-titulo text-xl">{c.nome}</div>
                    <span className="shrink-0 rounded bg-black/40 px-1.5 py-0.5 text-xs text-ouro">Admin</span>
                  </div>
                  <div className="mt-1 text-sm text-suave">
                    Mestre: {c.mestreNome} · {totais.find((t) => t.campanhaId === c.id)?.total ?? 0} fichas
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </section>

      <section className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="font-titulo text-3xl">Minhas fichas</h2>
            <p className="text-suave">Fichas sem campanha são particulares. Escolha a campanha dentro da ficha.</p>
          </div>
          <form action={criarFicha.bind(null, undefined)}>
            <button className="botao-ouro">+ Nova ficha</button>
          </form>
        </div>
        <CartoesFichas
          linhas={minhas}
          vazio={
            <>
              Você ainda não tem fichas. Crie a primeira com <span className="text-ouro">Nova ficha</span>.
            </>
          }
        />
      </section>
    </div>
  );
}
