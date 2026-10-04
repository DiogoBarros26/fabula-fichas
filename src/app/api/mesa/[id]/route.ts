import { NextResponse, type NextRequest } from "next/server";
import { usuarioAtual } from "@/lib/auth";
import { estadoMesa } from "@/lib/mesa";
import { papelNaCampanha } from "@/lib/permissoes";

const UUID = /^[0-9a-f-]{36}$/i;

/** Consultado a cada poucos segundos pela mesa (rolagens novas + música). */
export async function GET(req: NextRequest, ctx: RouteContext<"/api/mesa/[id]">) {
  const { id } = await ctx.params;
  const usuario = await usuarioAtual();
  if (!usuario) return NextResponse.json({ erro: "Entre novamente." }, { status: 401 });
  if (!UUID.test(id)) return NextResponse.json({ erro: "Campanha inválida." }, { status: 404 });
  const papel = await papelNaCampanha(id, usuario.id);
  if (!papel) return NextResponse.json({ erro: "Você não participa dessa campanha." }, { status: 403 });

  const desde = Math.max(0, Number(req.nextUrl.searchParams.get("desde")) || 0);
  return NextResponse.json(await estadoMesa(id, usuario.id, papel.ehMestre, desde), { headers: { "Cache-Control": "no-store" } });
}
