import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";
import { usuarioAtual } from "@/lib/auth";
import { papelNaCampanha } from "@/lib/permissoes";

const TIPOS_AUDIO = ["audio/mpeg", "audio/mp3", "audio/ogg", "audio/wav", "audio/x-wav", "audio/webm", "audio/mp4", "audio/x-m4a", "audio/aac", "audio/flac"];
const TAMANHO_MAXIMO = 50 * 1024 * 1024;

/** Gera a autorização para o navegador enviar o MP3 direto ao Vercel Blob (só o Mestre). */
export async function POST(req: Request, ctx: RouteContext<"/api/mesa/[id]/upload">) {
  const { id } = await ctx.params;
  if (!process.env.BLOB_READ_WRITE_TOKEN) return NextResponse.json({ error: "Envio de arquivos não configurado (BLOB_READ_WRITE_TOKEN)." }, { status: 500 });
  const body = (await req.json()) as HandleUploadBody;
  try {
    const resposta = await handleUpload({
      body,
      request: req,
      onBeforeGenerateToken: async (pathname) => {
        const usuario = await usuarioAtual();
        const papel = usuario && (await papelNaCampanha(id, usuario.id));
        if (!papel?.ehMestre) throw new Error("Só o Mestre envia músicas.");
        if (!pathname.startsWith(`musicas/${id}/`)) throw new Error("Caminho inválido.");
        return { allowedContentTypes: TIPOS_AUDIO, maximumSizeInBytes: TAMANHO_MAXIMO, addRandomSuffix: true };
      },
    });
    return NextResponse.json(resposta);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
