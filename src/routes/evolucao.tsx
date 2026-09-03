import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, TrendingUp, User } from "lucide-react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  CRITERIA,
  SLOTS,
  groupAverage,
  loadBoard,
  overallAverage,
  type Board,
} from "@/lib/scouting";

export const Route = createFileRoute("/evolucao")({
  head: () => ({
    meta: [
      { title: "Evolução dos atletas — Scout Base" },
      {
        name: "description",
        content:
          "Quadro gráfico de acompanhamento da evolução dos atletas avaliados: radar por grupo de critérios e linha do tempo da média geral.",
      },
      { property: "og:title", content: "Evolução dos atletas — Scout Base" },
      {
        property: "og:description",
        content: "Gráficos de evolução das avaliações de atletas de base ao longo do tempo.",
      },
    ],
  }),
  component: EvolutionPage,
});

const GREEN = "#16a34a";
const GRAY = "#94a3b8";

function EvolutionPage() {
  const [board, setBoard] = useState<Board>({});
  const [selectedKey, setSelectedKey] = useState<string>("");

  useEffect(() => setBoard(loadBoard()), []);

  const athletes = useMemo(
    () =>
      SLOTS.map((slot) => ({ slot, data: board[slot.key] }))
        .filter(
          (r): r is { slot: (typeof SLOTS)[number]; data: NonNullable<Board[keyof Board]> } =>
            Boolean(r.data?.athlete.fullName),
        )
        .filter((r) => Object.keys(r.data.evaluation.scores).length > 0),
    [board],
  );

  const current =
    athletes.find((a) => a.slot.key === selectedKey) ?? athletes[0] ?? null;

  const radarData = useMemo(() => {
    if (!current) return [];
    return CRITERIA.map((g) => ({
      group: (g.title.split(" ")[0] ?? g.title).replace("/", ""),
      atual: Number(groupAverage(g.id, current.data.evaluation.scores).toFixed(1)),
      anterior: current.data.evaluation.history?.length
        ? Number(
            groupAverage(
              g.id,
              current.data.evaluation.history[current.data.evaluation.history.length - 1]!.scores,
            ).toFixed(1),
          )
        : undefined,
    }));
  }, [current]);

  const lineData = useMemo(() => {
    if (!current) return [];
    const points = (current.data.evaluation.history ?? []).map((h) => ({
      data: new Date(h.at).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
      media: Number(overallAverage(h.scores).toFixed(1)),
    }));
    if (current.data.evaluation.updatedAt || Object.keys(current.data.evaluation.scores).length) {
      points.push({
        data: new Date(current.data.evaluation.updatedAt ?? Date.now()).toLocaleDateString(
          "pt-BR",
          { day: "2-digit", month: "2-digit" },
        ),
        media: Number(overallAverage(current.data.evaluation.scores).toFixed(1)),
      });
    }
    return points;
  }, [current]);

  const media = current ? overallAverage(current.data.evaluation.scores) : 0;
  const anterior = current?.data.evaluation.history?.length
    ? overallAverage(
        current.data.evaluation.history[current.data.evaluation.history.length - 1]!.scores,
      )
    : null;
  const delta = anterior !== null ? media - anterior : null;

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
              Evolução dos Atletas
            </h1>
            <p className="text-sm text-muted-foreground">
              {athletes.length
                ? "Acompanhe a progressão das avaliações ao longo do tempo."
                : "Nenhum atleta avaliado ainda."}
            </p>
          </div>
        </header>

        {!athletes.length && (
          <div className="rounded-xl border border-dashed bg-card p-8 text-center text-sm text-muted-foreground">
            <TrendingUp className="mx-auto mb-2 h-8 w-8 opacity-50" />
            Salve avaliações no campo para visualizar os gráficos de evolução.
          </div>
        )}

        {athletes.length > 0 && (
          <>
            <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
              {athletes.map(({ slot, data }) => {
                const active = current?.slot.key === slot.key;
                return (
                  <button
                    key={slot.key}
                    onClick={() => setSelectedKey(slot.key)}
                    className={`flex shrink-0 items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                      active
                        ? "border-primary bg-primary text-primary-foreground"
                        : "bg-card text-foreground"
                    }`}
                  >
                    <span className="h-6 w-6 overflow-hidden rounded-full border border-gold bg-pitch-dark">
                      {data.athlete.photo ? (
                        <img
                          src={data.athlete.photo}
                          alt={data.athlete.fullName}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span className="flex h-full w-full items-center justify-center text-primary-foreground">
                          <User className="h-3 w-3 opacity-70" />
                        </span>
                      )}
                    </span>
                    {data.athlete.fullName.split(" ")[0]}
                  </button>
                );
              })}
            </div>

            {current && (
              <div className="space-y-4">
                <section className="flex items-center gap-3 rounded-xl border bg-card p-4">
                  <span className="h-14 w-14 shrink-0 overflow-hidden rounded-full border-2 border-gold bg-pitch-dark">
                    {current.data.athlete.photo ? (
                      <img
                        src={current.data.athlete.photo}
                        alt={current.data.athlete.fullName}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="flex h-full w-full items-center justify-center text-primary-foreground">
                        <User className="h-6 w-6 opacity-70" />
                      </span>
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">{current.data.athlete.fullName}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {current.slot.name}
                      {current.data.athlete.category
                        ? ` • ${current.data.athlete.category}`
                        : ""}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="font-display text-3xl text-primary">{media.toFixed(1)}</p>
                    {delta !== null && (
                      <p
                        className={`text-xs font-bold ${
                          delta > 0
                            ? "text-green-600"
                            : delta < 0
                              ? "text-red-600"
                              : "text-muted-foreground"
                        }`}
                      >
                        {delta > 0 ? "+" : ""}
                        {delta.toFixed(1)} vs. anterior
                      </p>
                    )}
                  </div>
                </section>

                <section className="rounded-xl border bg-card p-4">
                  <h2 className="mb-1 font-display text-xl tracking-wide text-primary">
                    Perfil por grupo de critérios
                  </h2>
                  <p className="mb-2 text-xs text-muted-foreground">
                    Comparação da avaliação atual com a anterior.
                  </p>
                  <div className="h-72 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart data={radarData} outerRadius="70%">
                        <PolarGrid />
                        <PolarAngleAxis dataKey="group" tick={{ fontSize: 12 }} />
                        <PolarRadiusAxis domain={[0, 10]} tick={{ fontSize: 10 }} />
                        {radarData.some((d) => d.anterior !== undefined) && (
                          <Radar
                            name="Avaliação anterior"
                            dataKey="anterior"
                            stroke="#94a3b8"
                            fill="#94a3b8"
                            fillOpacity={0.2}
                          />
                        )}
                        <Radar
                          name="Avaliação atual"
                          dataKey="atual"
                          stroke={GROUP_COLORS[0]}
                          fill={GROUP_COLORS[0]}
                          fillOpacity={0.35}
                        />
                        <Legend wrapperStyle={{ fontSize: 12 }} />
                        <Tooltip />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                </section>

                <section className="rounded-xl border bg-card p-4">
                  <h2 className="mb-1 font-display text-xl tracking-wide text-primary">
                    Média geral ao longo do tempo
                  </h2>
                  <p className="mb-2 text-xs text-muted-foreground">
                    {lineData.length > 1
                      ? `${lineData.length} avaliações registradas.`
                      : "Salve uma nova avaliação do mesmo atleta para iniciar a linha de evolução."}
                  </p>
                  <div className="h-56 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={lineData} margin={{ top: 8, right: 16, bottom: 0, left: -18 }}>
                        <CartesianGrid strokeDasharray="3 3" opacity={0.4} />
                        <XAxis dataKey="data" tick={{ fontSize: 11 }} />
                        <YAxis domain={[0, 10]} tick={{ fontSize: 11 }} />
                        <Tooltip />
                        <Line
                          name="Média geral"
                          type="monotone"
                          dataKey="media"
                          stroke={GROUP_COLORS[0]}
                          strokeWidth={2.5}
                          dot={{ r: 4 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </section>

                <section className="rounded-xl border bg-card p-4">
                  <h2 className="mb-3 font-display text-xl tracking-wide text-primary">
                    Comparativo entre atletas
                  </h2>
                  <div className="space-y-2">
                    {[...athletes]
                      .sort(
                        (a, b) =>
                          overallAverage(b.data.evaluation.scores) -
                          overallAverage(a.data.evaluation.scores),
                      )
                      .map(({ slot, data }) => {
                        const avg = overallAverage(data.evaluation.scores);
                        return (
                          <div key={slot.key} className="flex items-center gap-2">
                            <span className="w-28 truncate text-xs font-medium">
                              {data.athlete.fullName}
                            </span>
                            <div className="h-3 flex-1 overflow-hidden rounded-full bg-muted">
                              <div
                                className="h-full rounded-full bg-primary"
                                style={{ width: `${(avg / 10) * 100}%` }}
                              />
                            </div>
                            <span className="w-8 text-right text-xs font-bold tabular-nums">
                              {avg.toFixed(1)}
                            </span>
                          </div>
                        );
                      })}
                  </div>
                </section>
              </div>
            )}
          </>
        )}

        <p className="mt-4 text-center text-xs text-muted-foreground">
          Os dados ficam salvos neste dispositivo.
        </p>
      </div>
    </main>
  );
}
