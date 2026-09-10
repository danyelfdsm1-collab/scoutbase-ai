import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, FileText, Shirt, TrendingUp, User } from "lucide-react";
import {
  CRITERIA,
  SLOTS,
  groupAverage,
  loadBoard,
  overallAverage,
  type Board,
} from "@/lib/scouting";

export const Route = createFileRoute("/atletas")({
  head: () => ({
    meta: [
      { title: "Painel de atletas — Scout Base" },
      {
        name: "description",
        content:
          "Painel com todos os atletas cadastrados no Scout Base, com médias por grupo de critérios e média geral da avaliação.",
      },
      { property: "og:title", content: "Painel de atletas — Scout Base" },
      {
        property: "og:description",
        content:
          "Visão geral dos atletas avaliados: notas de técnica, tática, física e mental.",
      },
    ],
  }),
  component: AthletesPanel,
});

function AthletesPanel() {
  const [board, setBoard] = useState<Board>({});

  useEffect(() => setBoard(loadBoard()), []);

  const rows = SLOTS.map((slot) => {
    const data = board[slot.key];
    if (!data || !data.athlete.fullName) return null;
    const media = overallAverage(data.evaluation.scores);
    return { slot, data, media };
  }).filter((r): r is NonNullable<typeof r> => r !== null);

  const ranked = [...rows].sort((a, b) => b.media - a.media);

  return (
    <main className="min-h-screen bg-background px-4 py-6">
      <div className="mx-auto max-w-2xl">
        <header className="mb-5 flex items-center gap-3">
          <Link
            to="/"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border bg-card text-muted-foreground"
            aria-label="Voltar ao campo"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="min-w-0 flex-1">
            <h1 className="font-display text-3xl tracking-wide text-primary">
              Painel de Atletas
            </h1>
            <p className="text-sm text-muted-foreground">
              {ranked.length
                ? `${ranked.length} atleta${ranked.length > 1 ? "s" : ""} cadastrado${ranked.length > 1 ? "s" : ""} — ordenado pela média geral.`
                : "Nenhum atleta cadastrado ainda."}
            </p>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-1.5">
            <Link
              to="/evolucao"
              className="flex items-center gap-1 rounded-full border bg-card px-3 py-1.5 text-xs font-semibold"
            >
              <TrendingUp className="h-3.5 w-3.5" />
              Evolução
            </Link>
            <Link
              to="/relatorios"
              className="flex items-center gap-1 rounded-full border bg-card px-3 py-1.5 text-xs font-semibold"
            >
              <FileText className="h-3.5 w-3.5" />
              Relatórios
            </Link>
          </div>
        </header>


        {!ranked.length && (
          <div className="rounded-xl border border-dashed bg-card p-8 text-center text-sm text-muted-foreground">
            <Shirt className="mx-auto mb-2 h-8 w-8 opacity-50" />
            Toque em uma posição no campo para cadastrar o primeiro atleta.
          </div>
        )}

        <div className="space-y-3">
          {ranked.map(({ slot, data, media }, i) => (
            <article
              key={slot.key}
              className="flex items-center gap-3 rounded-xl border bg-card p-3"
            >
              <span className="w-6 shrink-0 text-center font-display text-lg text-muted-foreground">
                {i + 1}
              </span>
              <span className="h-12 w-12 shrink-0 overflow-hidden rounded-full border-2 border-gold bg-pitch-dark">
                {data.athlete.photo ? (
                  <img
                    src={data.athlete.photo}
                    alt={data.athlete.fullName}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="flex h-full w-full items-center justify-center text-primary-foreground">
                    <User className="h-5 w-5 opacity-70" />
                  </span>
                )}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold leading-tight">
                  {data.athlete.fullName}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {slot.name}
                  {data.athlete.category ? ` • ${data.athlete.category}` : ""}
                  {data.athlete.foot ? ` • ${data.athlete.foot}` : ""}
                </p>
                <div className="mt-1.5 flex flex-wrap gap-1">
                  {CRITERIA.map((g) => {
                    const avg = groupAverage(g.id, data.evaluation.scores);
                    return (
                      <span
                        key={g.id}
                        className="rounded bg-accent px-1.5 py-0.5 text-[10px] font-semibold text-accent-foreground"
                        title={g.title}
                      >
                        {(g.title.split(" ")[0] ?? g.title).replace("/", "")}: {avg.toFixed(1)}
                      </span>
                    );
                  })}
                </div>
              </div>
              <span
                className={`shrink-0 rounded-lg px-2.5 py-1.5 text-center font-display text-xl ${
                  media > 0
                    ? "bg-gold text-gold-foreground"
                    : "bg-muted text-muted-foreground"
                }`}
                title="Média geral"
              >
                {media > 0 ? media.toFixed(1) : "—"}
              </span>
            </article>
          ))}
        </div>

        <p className="mt-4 text-center text-xs text-muted-foreground">
          Os dados ficam salvos neste dispositivo.
        </p>
      </div>
    </main>
  );
}
