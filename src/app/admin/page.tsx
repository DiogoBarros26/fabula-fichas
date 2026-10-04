import { sql } from "drizzle-orm";
import { db } from "@/db";
import { usuarios } from "@/db/schema";
import { exigirAdmin } from "@/lib/auth";
import { AcoesConta } from "./acoes-conta";

export default async function PaginaAdmin() {
  const admin = await exigirAdmin();
  const banco = await db();
  const contas = await banco
    .select({
      id: usuarios.id,
      nome: usuarios.nome,
      usuario: usuarios.usuario,
      criadoEm: usuarios.criadoEm,
      fichas: sql<number>`(select count(*) from fichas f where f.dono_id = usuarios.id)`.mapWith(Number),
      mestreDe: sql<number>`(select count(*) from campanhas c where c.mestre_id = usuarios.id)`.mapWith(Number),
    })
    .from(usuarios)
    .orderBy(usuarios.nome);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-titulo text-3xl">Administração</h1>
        <p className="text-suave">
          {contas.length} {contas.length === 1 ? "conta" : "contas"} no site.
        </p>
      </div>
      <div className="janela overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-left text-xs uppercase tracking-wider text-suave">
            <tr className="border-b border-white/10">
              <th className="px-4 py-3">Nome</th>
              <th className="px-4 py-3">Usuário</th>
              <th className="px-4 py-3 text-right">Fichas</th>
              <th className="px-4 py-3 text-right">Mestre de</th>
              <th className="px-4 py-3">Criada em</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {contas.map((c) => (
              <tr key={c.id} className="border-b border-white/5 last:border-0">
                <td className="px-4 py-3">
                  {c.nome}
                  {c.id === admin.id && <span className="ml-2 text-xs text-ouro">você</span>}
                </td>
                <td className="px-4 py-3 text-suave">{c.usuario}</td>
                <td className="px-4 py-3 text-right tabular-nums">{c.fichas}</td>
                <td className="px-4 py-3 text-right tabular-nums">
                  {c.mestreDe} {c.mestreDe === 1 ? "campanha" : "campanhas"}
                </td>
                <td className="px-4 py-3 text-suave">{c.criadoEm.toLocaleDateString("pt-BR")}</td>
                <td className="px-4 py-3">
                  {c.id !== admin.id && <AcoesConta usuarioId={c.id} nome={c.nome} fichas={c.fichas} mestreDe={c.mestreDe} />}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
