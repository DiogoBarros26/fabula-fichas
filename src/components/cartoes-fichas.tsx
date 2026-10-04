import Link from "next/link";
import { calcular, nomeClasse, normalizarFicha, type Ficha } from "@/lib/regras";

export type LinhaFicha = {
  id: string;
  dados: Partial<Ficha>;
  visivel: boolean;
  campanhaNome?: string | null;
  donoNome?: string;
};

export function CartoesFichas({ linhas, vazio }: { linhas: LinhaFicha[]; vazio: React.ReactNode }) {
  if (linhas.length === 0) return <div className="janela p-8 text-center text-suave">{vazio}</div>;
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {linhas.map((linha) => (
        <Cartao key={linha.id} linha={linha} />
      ))}
    </div>
  );
}

function Cartao({ linha }: { linha: LinhaFicha }) {
  const f = normalizarFicha(linha.dados);
  const c = calcular(f);
  const particular = linha.campanhaNome === null;
  return (
    <Link
      href={`/ficha/${linha.id}`}
      className={`janela block p-4 transition hover:-translate-y-0.5 hover:border-ouro ${!linha.visivel && !particular ? "opacity-75" : ""}`}
    >
      <div className="flex gap-3">
        <div className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-md border border-white/20 bg-black/30 font-titulo text-2xl text-ouro">
          {f.retrato ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={f.retrato} alt="" className="size-full object-cover" />
          ) : (
            f.nome.charAt(0).toUpperCase()
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate font-titulo text-lg">{f.nome || "Sem nome"}</div>
          <div className="truncate text-sm text-suave">
            Nível {c.nivel}
            {linha.donoNome && ` · ${linha.donoNome}`}
          </div>
          <div className="truncate text-xs text-suave">
            {f.classes.map((x) => `${nomeClasse(x.classeId)} ${x.nivel}`).join(" / ") || "Sem classes"}
          </div>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5 text-xs">
        {linha.campanhaNome !== undefined && (
          <span className="rounded bg-black/40 px-1.5 py-0.5 text-suave">{particular ? "Particular" : `⚔ ${linha.campanhaNome}`}</span>
        )}
        {!particular && !linha.visivel && <span className="rounded bg-black/40 px-1.5 py-0.5 text-ouro">🔒 Oculta</span>}
      </div>
      <div className="mt-2 grid grid-cols-3 gap-2 text-center text-sm">
        <Barra rotulo="PV" valor={c.pv} max={c.pvMax} cor="bg-pv" />
        <Barra rotulo="PM" valor={c.pm} max={c.pmMax} cor="bg-pm" />
        <Barra rotulo="PI" valor={c.pi} max={c.piMax} cor="bg-pi" />
      </div>
    </Link>
  );
}

function Barra({ rotulo, valor, max, cor }: { rotulo: string; valor: number; max: number; cor: string }) {
  const pct = max > 0 ? Math.max(0, Math.min(100, (valor / max) * 100)) : 0;
  return (
    <div>
      <div className="flex justify-between text-xs">
        <span className="text-suave">{rotulo}</span>
        <span>
          {valor}/{max}
        </span>
      </div>
      <div className="mt-1 h-1.5 rounded bg-black/40">
        <div className={`h-full rounded ${cor}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
