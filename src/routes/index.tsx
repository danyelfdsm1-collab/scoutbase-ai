import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Search, Shield, Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ageFrom, useSession, type Profile } from "@/lib/account";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Scout Base — Avaliação de atletas do Sub-11 ao Sub-20" },
      {
        name: "description",
        content:
          "Plataforma de observação técnica do futebol de base: treinadores e clubes encontram e avaliam atletas; atletas apresentam seus vídeos e recebem avaliações.",
      },
      { property: "og:title", content: "Scout Base — Talentos do futebol de base" },
      {
        property: "og:description",
        content:
          "Perfis de atletas, vídeos de até 1 minuto e avaliações de técnica, tática, física e mental.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

function Landing() {
  const { session } = useSession();

  const { data: athletes } = useQuery({
    queryKey: ["public-athletes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("account_type", "atleta")
        .order("created_at", { ascending: false })
        .limit(24);
      if (error) throw error;
      return (data ?? []) as Profile[];
    },
  });

  return (
    <main className="min-h-screen bg-background">
      <section className="border-b bg-card px-4 py-10">
        <div className="mx-auto max-w-3xl">
          <h1 className="font-display text-4xl tracking-wide text-primary sm:text-5xl">
            Bem-vindo ao Scout Base
          </h1>
          <p className="mt-2 max-w-xl text-muted-foreground">
            Encontre, avalie e acompanhe talentos do futebol de base — do Sub-11 ao Sub-20.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            {session ? (
              <Button asChild size="lg">
                <Link to="/campo">
                  Ir para o campo <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            ) : (
              <>
                <Button asChild size="lg">
                  <Link to="/auth">Entrar</Link>
                </Button>
                <Button asChild size="lg" variant="secondary">
                  <Link to="/auth">Criar perfil</Link>
                </Button>
              </>
            )}
          </div>
          <div className="mt-6 grid gap-3 text-sm sm:grid-cols-3">
            <div className="rounded-xl border bg-background p-3">
              <Search className="mb-1 h-4 w-4 text-accent" />
              Treinadores encontram e acompanham atletas.
            </div>
            <div className="rounded-xl border bg-background p-3">
              <Shield className="mb-1 h-4 w-4 text-accent" />
              Clubes e escolinhas divulgam oportunidades.
            </div>
            <div className="rounded-xl border bg-background p-3">
              <Star className="mb-1 h-4 w-4 text-accent" />
              Atletas mostram seus vídeos e recebem notas.
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 py-8">
        <div className="mx-auto max-w-3xl">
          <h2 className="font-display text-2xl tracking-wide text-foreground">Atletas no app</h2>
          <p className="text-sm text-muted-foreground">
            Perfis públicos — qualquer pessoa pode visitar o card do atleta.
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {(athletes ?? []).map((a) => {
              const age = ageFrom(a.birth_date);
              return (
                <Link
                  key={a.id}
                  to="/perfil/$username"
                  params={{ username: a.username }}
                  className="flex items-center gap-3 rounded-xl border bg-card p-3 transition-colors hover:border-primary"
                >
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-accent bg-muted text-sm font-bold">
                    {a.photo_url ? (
                      <img
                        src={a.photo_url}
                        alt={`Foto de ${a.full_name}`}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      (a.full_name || a.username).slice(0, 2).toUpperCase()
                    )}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate font-semibold">
                      {a.full_name || a.username}
                    </span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {[a.position_primary, a.category, age ? `${age} anos` : null]
                        .filter(Boolean)
                        .join(" • ") || "Perfil em construção"}
                    </span>
                  </span>
                </Link>
              );
            })}
            {athletes && athletes.length === 0 && (
              <p className="text-sm text-muted-foreground">
                Ainda não há atletas cadastrados. Crie o primeiro perfil.
              </p>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
