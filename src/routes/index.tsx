import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ClipboardList, IdCard, Users } from "lucide-react";
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
  SLOTS,
  emptyAthlete,
  emptyEvaluation,
  loadBoard,
  saveBoard,
  type Athlete,
  type Board,
  type Evaluation,
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

  useEffect(() => setBoard(loadBoard()), []);

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
        <header className="mb-5 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4">
          <div className="min-w-0">
            <h1 className="truncate font-display text-3xl tracking-wide text-primary sm:text-4xl">
              Scout Base
            </h1>
            <p className="text-sm text-muted-foreground">
              Observação técnica do Sub-11 ao Sub-20 — toque em uma posição.
            </p>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-2">
            <span className="rounded-full bg-accent px-3 py-1 text-xs font-bold text-accent-foreground">
              4-3-3
            </span>
            <div className="flex gap-1.5">
              <Link
                to="/atletas"
                className="flex items-center gap-1 rounded-full border bg-card px-3 py-1 text-xs font-semibold text-foreground"
              >
                <Users className="h-3.5 w-3.5" />
                Painel
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
              update(selected, { evaluation: next });
              setEvalOpen(false);
            }}
          />
        </>
      )}
    </main>
  );
}
