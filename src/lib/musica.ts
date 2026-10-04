// Links aceitos no player: vídeos do YouTube ou um arquivo de áudio direto (.mp3, .ogg…).

export function idYoutube(url: string): string | null {
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\.|^m\.|^music\./, "");
    if (host === "youtu.be") return u.pathname.slice(1).split("/")[0] || null;
    if (host === "youtube.com" || host === "youtube-nocookie.com") {
      if (u.searchParams.get("v")) return u.searchParams.get("v");
      const m = u.pathname.match(/^\/(?:embed|shorts|live)\/([\w-]{11})/);
      if (m) return m[1];
    }
  } catch {}
  return null;
}

export function tipoDoLink(url: string): "youtube" | "audio" | null {
  if (idYoutube(url)) return "youtube";
  try {
    const u = new URL(url);
    if (u.protocol === "https:" || u.protocol === "http:") return "audio";
  } catch {}
  return null;
}

/** Nome legível a partir do arquivo ou do link, para quando o Mestre não der título. */
export function tituloPadrao(url: string) {
  try {
    const nome = decodeURIComponent(new URL(url).pathname.split("/").pop() ?? "");
    return nome.replace(/-[A-Za-z0-9]{20,}(?=\.\w+$)/, "").replace(/\.\w+$/, "") || "Faixa";
  } catch {
    return "Faixa";
  }
}
