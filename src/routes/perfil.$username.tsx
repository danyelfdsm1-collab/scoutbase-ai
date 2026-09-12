import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { ArrowLeft, MapPin, Video as VideoIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { getVideoUrls } from "@/lib/videos.functions";
import {
  ageFrom,
  type AthleteEvaluation,
  type AthleteVideo,
  type Profile,
} from "@/lib/account";
import { CRITERIA, groupAverage, overallAverage } from "@/lib/scouting";

export const Route = createFileRoute("/perfil/$username")({
  head: ({ params }) => ({
    meta: [
      { title: `Perfil de @${params.username} — Scout Base` },
      {
        name: "description",
        content: `Card do atleta @${params.username} no Scout Base: dados, vídeos e avaliações de técnica, tática, física e mental.`,
      },
      { property: "og:title", content: `Perfil de @${params.username} — Scout Base` },
      {
        property: "og:description",
        content: "Card público do atleta com vídeos e notas de avaliação.",
      },
      { property: "og:type", content: "profile" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PublicProfile,
  errorComponent: () => (
    <main className="flex min-h-screen items-center justify-center px-4 text-center">
      <p className="text-muted-foreground">Não foi possível carregar este perfil.</p>
    </main>
  ),
  notFoundComponent: () => (
    <main className="flex min-h-screen items-center justify-center px-4 text-center">
      <p className="text-muted-foreground">Perfil não encontrado.</p>
    </main>
  ),
});

type Tab = "detalhes" | "analise" | "evolucao";

function PublicProfile() {
  const { username } = Route.useParams();
  const [tab, setTab] = useState<Tab>("detalhes");
  const signUrls = useServerFn(getVideoUrls);

  const { data, isLoading } = useQuery({
    queryKey: ["public-profile", username],
    queryFn: async () => {
      const { data: profile, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("username", username)
        .maybeSingle();
      if (error) throw error;
      if (!profile) return null;
      const [{ data: videos }, { data: evaluations }] = await Promise.all([
        supabase
          .from("athlete_videos")
          .select("*")
          .eq("athlete_id", profile.id)
          .order("created_at", { ascending: false }),
        supabase
          .from("athlete_evaluations")
          .select("*")
          .eq("athlete_id", profile.id)
          .order("created_at", { ascending: true }),
      ]);
      const list = (videos ?? []) as AthleteVideo[];
      const { urls } = await signUrls({ data: { paths: list.map((v) => v.storage_path) } });
      return {
        profile: profile as Profile,
        videos: list,
        urls,
        evaluations: (evaluations ?? []) as unknown as AthleteEvaluation[],
      };
    },
  });

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-muted-foreground">Carregando perfil…</p>
      </main>
    );
  }
  if (!data) {
    return (
      <main className="flex min-h-screen items-center justify-center px-4 text-center">
        <p className="text-muted-foreground">Perfil não encontrado.</p>
      </main>
    );
  }

  const { profile, videos, urls, evaluations } = data;
  const age = ageFrom(profile.birth_date);
  const latest = evaluations.at(-1);
  const scores = latest?.scores ?? {};

  return (
    <main className="min-h-screen bg-background px-4 py-6">
      <div className="mx-auto max-w-xl">
        <Link
          to="/"
          className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Início
        </Link>

        <article className="overflow-hidden rounded-2xl border bg-card shadow-sm">
          <div className="bg-primary px-5 py-6 text-primary-foreground">
            <div className="flex items-center gap-4">
              <span className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full border-4 border-accent bg-muted text-lg font-bold text-foreground">
                {profile.photo_url ? (
                  <img
                    src={profile.photo_url}
                    alt={`Foto de ${profile.full_name}`}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  (profile.full_name || profile.username).slice(0, 2).toUpperCase()
                )}
              </span>
              <div className="min-w-0">
                <h1 className="truncate font-display text-3xl tracking-wide">
                  {profile.full_name || profile.username}
                </h1>
                <p className="text-sm opacity-80">@{profile.username}</p>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-x-5 gap-y-1 text-sm">
              {age !== null && <span>{age} anos</span>}
              {profile.weight_kg && <span>{profile.weight_kg} kg</span>}
              {profile.height_cm && <span>{(profile.height_cm / 100).toFixed(2)} m</span>}
              {profile.category && <span>{profile.category}</span>}
            </div>
          </div>

          <nav className="grid grid-cols-3 border-b text-sm font-semibold">
            {(
              [
                ["detalhes", "Detalhes"],
                ["analise", "Análise"],
                ["evolucao", "Evolução"],
              ] as [Tab, string][]
            ).map(([id, label]) => (
              <button
                key={id}
                onClick={() => setTab(id)}
                className={`py-3 ${tab === id ? "border-b-2 border-accent text-foreground" : "text-muted-foreground"}`}
              >
                {label}
              </button>
            ))}
          </nav>

          {tab === "detalhes" && (
            <div className="grid gap-4 p-5">
              <Field label="Posição" value={profile.position_primary} />
              <Field label="Posição secundária" value={profile.position_secondary} />
              <Field label="Pé dominante" value={profile.foot} />
              <Field
                label="Cidade"
                value={[profile.city, profile.state].filter(Boolean).join("/")}
                icon={<MapPin className="h-3.5 w-3.5" />}
              />
            </div>
          )}

          {tab === "analise" && (
            <div className="grid gap-4 p-5">
              {latest ? (
                <>
                  {CRITERIA.map((group) => {
                    const value = groupAverage(group.id, scores);
                    return (
                      <div key={group.id}>
                        <div className="flex justify-between text-sm">
                          <span>{group.title}</span>
                          <span className="font-bold">{value.toFixed(1)}</span>
                        </div>
                        <div className="mt-1 h-2 overflow-hidden rounded-full bg-muted">
                          <div
                            className="h-full rounded-full bg-accent"
                            style={{ width: `${(value / 10) * 100}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                  <p className="text-sm">
                    <strong>Média geral:</strong> {overallAverage(scores).toFixed(1)}
                  </p>
                  {latest.summary && (
                    <p className="text-sm text-muted-foreground">{latest.summary}</p>
                  )}
                </>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Este atleta ainda não possui avaliações.
                </p>
              )}
            </div>
          )}

          {tab === "evolucao" && (
            <div className="grid gap-3 p-5">
              {evaluations.length ? (
                evaluations
                  .slice()
                  .reverse()
                  .map((ev) => (
                    <div key={ev.id} className="flex items-center justify-between border-b pb-2 text-sm">
                      <span className="text-muted-foreground">
                        {new Date(ev.created_at).toLocaleDateString("pt-BR")}
                      </span>
                      <span className="font-bold">{overallAverage(ev.scores).toFixed(1)}</span>
                    </div>
                  ))
              ) : (
                <p className="text-sm text-muted-foreground">
                  Sem histórico de avaliações por enquanto.
                </p>
              )}
            </div>
          )}

          <div className="border-t p-5">
            <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide">
              <VideoIcon className="h-4 w-4" /> Vídeos ({videos.length}/5)
            </h2>
            {videos.length === 0 && (
              <p className="mt-2 text-sm text-muted-foreground">Nenhum vídeo enviado ainda.</p>
            )}
            <div className="mt-3 grid gap-4 sm:grid-cols-2">
              {videos.map((v) => (
                <figure key={v.id} className="overflow-hidden rounded-xl border">
                  {urls[v.storage_path] ? (
                    <video src={urls[v.storage_path]} controls className="aspect-video w-full bg-black" />
                  ) : (
                    <div className="aspect-video w-full bg-muted" />
                  )}
                  <figcaption className="p-2 text-xs">
                    <span className="block font-semibold">{v.title}</span>
                    <span className="block text-muted-foreground">
                      {[v.play_type, v.position, v.competition].filter(Boolean).join(" | ")}
                    </span>
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>
        </article>
      </div>
    </main>
  );
}

function Field({
  label,
  value,
  icon,
}: {
  label: string;
  value?: string | null;
  icon?: React.ReactNode;
}) {
  if (!value) return null;
  return (
    <div>
      <p className="flex items-center gap-1 text-xs font-bold uppercase tracking-wide text-muted-foreground">
        {icon}
        {label}
      </p>
      <p className="text-sm">{value}</p>
    </div>
  );
}
