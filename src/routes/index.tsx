import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ClipboardList, FileText, IdCard, TrendingUp, Users, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Pitch } from "@/components/Pitch";
import { AthleteDetailsDialog } from "@/components/AthleteDetailsDialog";
import { EvaluationDialog } from "@/components/EvaluationDialog";
import {
  FORMATION_LIST,
  DEFAULT_FORMATION,
  SLOTS,
  emptyAthlete,
  emptyEvaluation,
  loadBoard,
  loadFormation,
  saveBoard,
  saveFormation,
  type Athlete,
  type Board,
  type Evaluation,
  type Formation,
  type PositionKey,
} from "@/lib/scouting";


export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Scout Base — Avaliação de atletas Sub-11 ao Sub-20" },
      {
        name: "description",
        content:
          "Aplicativo de observação técnica para futebol de base: escale o campo, cadastre atletas e avalie técnica, tática, física e mental.",
      },
      { property: "og:title", content: "Scout Base — Avaliação de atletas de futebol de base" },
      {
        property: "og:description",
        content:
          "Ficha de scouting em formato de campo: notas de técnica, tática, física e mental do Sub-11 ao Sub-20.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  const [board, setBoard] = useState<Board>({});
  const [selected, setSelected] = useState<PositionKey | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [evalOpen, setEvalOpen] = useState(false);
  const [formation, setFormation] = useState<Formation>(DEFAULT_FORMATION);

  useEffect(() => {
    setBoard(loadBoard());
    setFormation(loadFormation());
  }, []);


  const update = (key: PositionKey, patch: Partial<{ athlete: Athlete; evaluation: Evaluation }>) =>
    setBoard((prev) => {
      const slotName = SLOTS.find((s) => s.key === key)?.name ?? "";
      const current = prev[key] ?? {
        athlete: emptyAthlete(slotName),
        evaluation: emptyEvaluation(),
      };
      const next: Board = { ...prev, [key]: { ...current, ...patch } };
      saveBoard(next);
      return next;
    });

  const slot = selected ? SLOTS.find((s) => s.key === selected) : null;
  const data = selected ? board[selected] : undefined;
  const athlete = data?.athlete ?? emptyAthlete(slot?.name ?? "");
  const evaluation = data?.evaluation ?? emptyEvaluation();
  const filled = Boolean(athlete.fullName);

  return (
    <main className="min-h-screen bg-background px-4 py-6">
      <div className="mx-auto max-w-2xl">
        <header className="mb-5 flex flex-col gap-3">
          <div className="min-w-0">
            <h1 className="truncate font-display text-3xl tracking-wide text-primary sm:text-4xl">
              Scout Base
            </h1>
            <p className="text-sm text-muted-foreground">
              Observação técnica do Sub-11 ao Sub-20 — toque em uma posição.
            </p>
          </div>
          <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:justify-between">
            <label className="flex items-center gap-1.5 rounded-full bg-accent px-3 py-1 text-xs font-bold text-accent-foreground">
              <span className="sr-only">Formação tática</span>
              <select
                aria-label="Formação tática"
                value={formation}
                onChange={(e) => {
                  const next = e.target.value as Formation;
                  setFormation(next);
                  saveFormation(next);
                }}
                className="bg-transparent font-bold text-accent-foreground outline-none"
              >
                {FORMATION_LIST.map((f) => (
                  <option key={f} value={f} className="text-foreground">
                    {f}
                  </option>
                ))}
              </select>
            </label>

            <div className="flex flex-wrap gap-1.5">
              <Link
                to="/atletas"
                className="flex items-center gap-1 rounded-full border bg-card px-3 py-1 text-xs font-semibold text-foreground"
              >
                <Users className="h-3.5 w-3.5" />
                Painel
              </Link>
              <Link
                to="/evolucao"
                className="flex items-center gap-1 rounded-full border bg-card px-3 py-1 text-xs font-semibold text-foreground"
              >
                <TrendingUp className="h-3.5 w-3.5" />
                Evolução
              </Link>
              <Link
                to="/video"
                className="flex items-center gap-1 rounded-full border bg-card px-3 py-1 text-xs font-semibold text-foreground"
              >
                <Video className="h-3.5 w-3.5" />
                Vídeo
              </Link>
              <Link
                to="/relatorios"
                className="flex items-center gap-1 rounded-full border bg-card px-3 py-1 text-xs font-semibold text-foreground"
              >
                <FileText className="h-3.5 w-3.5" />
                Relatórios
              </Link>

            </div>
          </div>

        </header>

        <Pitch
          board={board}
          formation={formation}
          onSelect={(key) => {
            setSelected(key);
          }}
        />


        <p className="mt-4 text-center text-xs text-muted-foreground">
          Os dados ficam salvos neste dispositivo.
        </p>
      </div>

      {/* sub-tela de opções */}
      <Dialog
        open={Boolean(selected) && !detailsOpen && !evalOpen}
        onOpenChange={(open) => !open && setSelected(null)}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{filled ? athlete.fullName : (slot?.name ?? "Posição")}</DialogTitle>
            <DialogDescription>
              {slot?.name}
              {filled && athlete.category ? ` • ${athlete.category}` : ""}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3">
            <Button size="lg" onClick={() => setDetailsOpen(true)}>
              <IdCard className="h-5 w-5" />
              Detalhes do atleta
            </Button>
            <Button
              size="lg"
              variant="secondary"
              disabled={!filled}
              onClick={() => setEvalOpen(true)}
            >
              <ClipboardList className="h-5 w-5" />
              Avaliar atleta
            </Button>
            {!filled && (
              <p className="text-center text-xs text-muted-foreground">
                Cadastre o atleta para liberar a avaliação.
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {selected && (
        <>
          <AthleteDetailsDialog
            open={detailsOpen}
            onOpenChange={setDetailsOpen}
            athlete={athlete}
            onSave={(next) => {
              update(selected, { athlete: next });
              setDetailsOpen(false);
            }}
            onRemove={() => {
              setBoard((prev) => {
                const next = { ...prev };
                delete next[selected];
                saveBoard(next);
                return next;
              });
              setDetailsOpen(false);
              setSelected(null);
            }}
          />
          <EvaluationDialog
            open={evalOpen}
            onOpenChange={setEvalOpen}
            athlete={athlete}
            evaluation={evaluation}
            onSave={(next) => {
              const prevEval = data?.evaluation;
              const hasPrev =
                prevEval && Object.keys(prevEval.scores).length > 0 && prevEval.updatedAt;
              const history = [
                ...(prevEval?.history ?? []),
                ...(hasPrev
                  ? [{ at: prevEval.updatedAt as string, scores: prevEval.scores }]
                  : []),
              ];
              update(selected, { evaluation: { ...next, history } });
              setEvalOpen(false);
            }}
          />
        </>
      )}
    </main>
  );
}
