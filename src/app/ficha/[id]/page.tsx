import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { campanhas, usuarios } from "@/db/schema";
import { exigirUsuario } from "@/lib/auth";
import { acessoFicha, minhasCampanhas } from "@/lib/permissoes";
import { normalizarFicha } from "@/lib/regras";
import { EditorFicha } from "./editor-ficha";

const UUID = /^[0-9a-f-]{36}$/i;

export default async function PaginaFicha({ params }: PageProps<"/ficha/[id]">) {
  const usuario = await exigirUsuario();
  const { id } = await params;
  if (!UUID.test(id)) notFound();

  const acesso = await acessoFicha(id, usuario.id);
  if (!acesso?.podeVer) notFound();
  const { ficha } = acesso;

  const banco = await db();
  const [dono] = await banco.select({ nome: usuarios.nome }).from(usuarios).where(eq(usuarios.id, ficha.donoId));
  const [campanha] = ficha.campanhaId
    ? await banco.select({ id: campanhas.id, nome: campanhas.nome }).from(campanhas).where(eq(campanhas.id, ficha.campanhaId))
    : [];

  return (
    <EditorFicha
      id={id}
      inicial={normalizarFicha(ficha.dados)}
      visivelInicial={ficha.visivel}
      campanhaInicial={campanha ?? null}
      minhasCampanhas={acesso.ehDono ? (await minhasCampanhas(usuario.id)).map(({ id, nome }) => ({ id, nome })) : []}
      ehDono={acesso.ehDono}
      ehMestre={acesso.ehMestre}
      donoNome={dono?.nome ?? ""}
    />
  );
}
