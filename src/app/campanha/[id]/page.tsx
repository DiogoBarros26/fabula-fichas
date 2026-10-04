import Link from "next/link";
import { notFound } from "next/navigation";
import { and, desc, eq, or } from "drizzle-orm";
import { db } from "@/db";
import { campanhas, fichas, membros, usuarios } from "@/db/schema";
import { exigirUsuario } from "@/lib/auth";
import { papelNaCampanha } from "@/lib/permissoes";
import { CartoesFichas } from "@/components/cartoes-fichas";
import { EntrarNaMesa } from "@/components/mesa/mesa";
import { criarFicha } from "@/app/actions";
import { AcoesCampanha, CodigoConvite, RemoverJogador } from "./acoes-campanha";

const UUID = /^[0-9a-f-]{36}$/i;

export default async function PaginaCampanha({ params }: PageProps<"/campanha/[id]">) {
  const usuario = await exigirUsuario();
  const { id } = await params;
  const papel = UUID.test(id) ? await papelNaCampanha(id, usuario.id) : null;
  if (!papel) notFound();

  const banco = await db();
  const [campanha] = await banco.select().from(campanhas).where(eq(campanhas.id, id));
  if (!campanha) notFound();
  const souMestre = campanha.mestreId === usuario.id;
  // Administradores veem a campanha como o Mestre, sem participar dela.
  const vejoTudo = papel.ehMestre;

  const jogadores = await banco
    .select({ id: usuarios.id, nome: usuarios.nome })
    .from(membros)
    .innerJoin(usuarios, eq(membros.usuarioId, usuarios.id))
    .where(eq(membros.campanhaId, id))
    .orderBy(usuarios.nome);

  // O Mestre vê todas; os jogadores veem as próprias e as visíveis.
  const lista = await banco
    .select({ id: fichas.id, dados: fichas.dados, visivel: fichas.visivel, donoId: fichas.donoId, donoNome: usuarios.nome })
    .from(fichas)
    .innerJoin(usuarios, eq(fichas.donoId, usuarios.id))
    .where(and(eq(fichas.campanhaId, id), vejoTudo ? undefined : or(eq(fichas.visivel, true), eq(fichas.donoId, usuario.id))))
    .orderBy(usuarios.nome, desc(fichas.atualizadoEm));

  const nomeMestre = jogadores.find((j) => j.id === campanha.mestreId)?.nome;

  return (
    <div className="space-y-8">
      <EntrarNaMesa campanha={{ id, nome: campanha.nome }} />
      <div>
        <Link href="/" className="text-sm text-suave hover:text-texto">
          ← Início
        </Link>
        <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-titulo text-3xl">{campanha.nome}</h1>
            <p className="text-suave">
              Mestre: <span className="text-ouro">{nomeMestre}</span>
              {souMestre && " (você)"}
              {papel.viaAdmin && <span className="ml-2 rounded bg-ouro px-1.5 py-0.5 text-xs text-[#2a1d00]">acesso de admin</span>}
            </p>
          </div>
          {!papel.viaAdmin && <AcoesCampanha campanhaId={id} souMestre={souMestre} />}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-[1fr_2fr]">
        <section className="janela p-4">
          <h2 className="titulo-secao">Convite</h2>
          <CodigoConvite codigo={campanha.codigo} />
          <p className="mt-2 text-xs text-suave">Os jogadores entram pela tela inicial, em “Entrar em uma campanha”.</p>
        </section>
        <section className="janela p-4">
          <h2 className="titulo-secao">Participantes ({jogadores.length})</h2>
          <ul className="flex flex-wrap gap-2">
            {jogadores.map((j) => (
              <li key={j.id} className="flex items-center gap-2 rounded-full bg-black/30 py-1 pl-3 pr-1 text-sm">
                {j.nome}
                {j.id === campanha.mestreId ? (
                  <span className="mr-2 text-xs text-ouro">Mestre</span>
                ) : souMestre ? (
                  <RemoverJogador campanhaId={id} usuarioId={j.id} nome={j.nome} />
                ) : (
                  <span className="mr-2" />
                )}
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="font-titulo text-2xl">Fichas da campanha</h2>
            <p className="text-sm text-suave">
              {vejoTudo
                ? `Como ${papel.viaAdmin ? "admin" : "Mestre"}, você vê e edita todas, inclusive as ocultas.`
                : "Fichas 🔒 ocultas só aparecem para o dono e para o Mestre."}
            </p>
          </div>
          {!papel.viaAdmin && (
            <form action={criarFicha.bind(null, id)}>
              <button className="botao-ouro">+ Nova ficha nesta campanha</button>
            </form>
          )}
        </div>
        <CartoesFichas
          linhas={lista.map((l) => ({ ...l, donoNome: l.donoId === usuario.id ? "você" : l.donoNome }))}
          vazio="Nenhuma ficha nesta campanha ainda. Crie uma aqui ou mova uma ficha sua para cá."
        />
      </section>
    </div>
  );
}
