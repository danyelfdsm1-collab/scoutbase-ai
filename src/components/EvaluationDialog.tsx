import { useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Brain, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  CRITERIA,
  groupAverage,
  overallAverage,
  type Athlete,
  type Evaluation,
} from "@/lib/scouting";
import { generateScores, getScoutingInsights } from "@/lib/scouting.functions";

export function EvaluationDialog({
  open,
  onOpenChange,
  athlete,
  evaluation,
  onSave,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  athlete: Athlete;
  evaluation: Evaluation;
  onSave: (evaluation: Evaluation) => void;
}) {
  const [form, setForm] = useState<Evaluation>(evaluation);
  const [insights, setInsights] = useState<string>("");
  const insightsFn = useServerFn(getScoutingInsights);

  useEffect(() => {
    if (open) {
      setForm(evaluation);
      setInsights("");
    }
  }, [open, evaluation]);

  const ai = useMutation({
    mutationFn: () =>
      insightsFn({
        data: {
          position: athlete.position || "Jogador de linha",
          category: athlete.category || "Sub-15",
        },
      }),
    onSuccess: (res) => setInsights(res.text),
    onError: (err: Error) => toast.error(err.message),
  });

  const setScore = (key: string, value: number) =>
    setForm((prev) => ({ ...prev, scores: { ...prev.scores, [key]: value } }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Avaliação — {athlete.fullName}</DialogTitle>
          <DialogDescription>
            Notas de 0 a 10 por critério. Média geral: {overallAverage(form.scores).toFixed(1)}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          {CRITERIA.map((group) => (
            <section key={group.id} className="rounded-xl border bg-card p-4">
              <header className="mb-3 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="font-display text-xl tracking-wide text-primary">{group.title}</h3>
                  <p className="text-xs text-muted-foreground">{group.description}</p>
                </div>
                <span className="shrink-0 rounded bg-accent px-2 py-0.5 text-sm font-bold text-accent-foreground">
                  {groupAverage(group.id, form.scores).toFixed(1)}
                </span>
              </header>
              <div className="space-y-4">
                {group.items.map((item) => {
                  const key = `${group.id}.${item.id}`;
                  const value = form.scores[key] ?? 0;
                  return (
                    <div key={key}>
                      <div className="flex items-center justify-between gap-2">
                        <Label className="text-sm font-medium">{item.label}</Label>
                        <span className="text-sm font-bold tabular-nums text-primary">{value}</span>
                      </div>
                      <p className="mb-1.5 text-xs text-muted-foreground">{item.hint}</p>
                      <Slider
                        value={[value]}
                        min={0}
                        max={10}
                        step={1}
                        onValueChange={([v]) => setScore(key, v ?? 0)}
                      />
                    </div>
                  );
                })}
              </div>
            </section>
          ))}

          <div className="grid gap-1.5">
            <Label htmlFor="notes">Observações do olheiro</Label>
            <Textarea
              id="notes"
              rows={4}
              maxLength={1000}
              value={form.notes}
              onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
              placeholder="Contexto do jogo, adversário, momentos decisivos..."
            />
          </div>

          <div className="rounded-xl border border-dashed p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <h3 className="font-semibold">O que o olheiro busca</h3>
                <p className="text-xs text-muted-foreground">
                  Referências de IA para {athlete.position || "a posição"} na categoria{" "}
                  {athlete.category || "de base"}.
                </p>
              </div>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => ai.mutate()}
                disabled={ai.isPending}
              >
                {ai.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Brain className="h-4 w-4" />
                )}
                Gerar
              </Button>
            </div>
            {insights && (
              <div className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">
                {insights.replace(/[#*]/g, "")}
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button
            onClick={() => {
              onSave({ ...form, updatedAt: new Date().toISOString() });
              toast.success("Avaliação salva");
            }}
          >
            Salvar avaliação
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
