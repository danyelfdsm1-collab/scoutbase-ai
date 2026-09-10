import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, Loader2, Sparkles, Upload, Video } from "lucide-react";
import { toast } from "sonner";
import { analyzeVideo } from "@/lib/scouting.functions";
import {
  CRITERIA,
  SLOTS,
  emptyAthlete,
  emptyEvaluation,
  groupAverage,
  loadBoard,
  overallAverage,
  saveBoard,
  type Board,
  type PositionKey,
} from "@/lib/scouting";

const MAX_BYTES = 15 * 1024 * 1024;

export const Route = createFileRoute("/video")({
  head: () => ({
    meta: [
      { title: "Avaliação por vídeo — Scout Base" },
      {
        name: "description",
        content:
          "Envie um vídeo do atleta e receba a pontuação automática de técnica, tática, física e mental gerada por inteligência artificial.",
      },
      { property: "og:title", content: "Avaliação por vídeo — Scout Base" },
      {
        property: "og:description",
        content:
          "Upload de vídeo e pontuação automática do atleta em 16 critérios, sem escrever observações.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: VideoScreen,
});

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result);
      resolve(result.slice(result.indexOf(",") + 1));
    };
    reader.onerror = () => reject(new Error("Não foi possível ler o vídeo."));
    reader.readAsDataURL(file);
  });
}

function VideoScreen() {
  const analyze = useServerFn(analyzeVideo);
  const [board, setBoard] = useState<Board>({});
  const [selected, setSelected] = useState<PositionKey | "">("");
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ scores: Record<string, number>; summary: string } | null>(
    null,
  );
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => setBoard(loadBoard()), []);
  useEffect(() => () => { if (previewUrl) URL.revokeObjectURL(previewUrl); }, [previewUrl]);

  const filledSlots = SLOTS.filter((s) => board[s.key]?.athlete.fullName);
  const slot = selected ? SLOTS.find((s) => s.key === selected) : null;
  const data = selected ? board[selected] : undefined;

  const onPick = (f: File | null) => {
    if (!f) return;
    if (f.size > MAX_BYTES) {
      toast.error("Vídeo muito grande. Envie um trecho de até 15 MB (cerca de 1 minuto).");
      return;
    }
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setFile(f);
    setPreviewUrl(URL.createObjectURL(f));
    setResult(null);
  };

  const run = async () => {
    if (!file || !slot || !data) return;
    setLoading(true);
    setResult(null);
    try {
      const videoBase64 = await fileToBase64(file);
      const res = await analyze({
        data: {
          position: data.athlete.position || slot.name,
          category: data.athlete.category || "Sub-15",
          mimeType: file.type || "video/mp4",
          videoBase64,
        },
      });
      setResult(res);
      toast.success("Pontuação gerada pela IA.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao analisar o vídeo.");
    } finally {
      setLoading(false);
    }
  };

  const save = () => {
    if (!result || !selected) return;
    const current = board[selected] ?? {
      athlete: emptyAthlete(slot?.name ?? ""),
      evaluation: emptyEvaluation(),
    };
    const prev = current.evaluation;
    const history = [
      ...(prev.history ?? []),
      ...(Object.keys(prev.scores).length
        ? [{ at: prev.updatedAt ?? new Date().toISOString(), scores: prev.scores }]
        : []),
    ];
    const next: Board = {
      ...board,
      [selected]: {
        ...current,
        evaluation: {
          ...prev,
          scores: { ...prev.scores, ...result.scores },
          notes: result.summary
            ? `${prev.notes ? `${prev.notes}\n\n` : ""}[Análise por vídeo] ${result.summary}`
            : prev.notes,
          updatedAt: new Date().toISOString(),
          history,
        },
      },
    };
    setBoard(next);
    saveBoard(next);
    setResult(null);
    setFile(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl("");
    if (inputRef.current) inputRef.current.value = "";
    toast.success("Avaliação salva no atleta.");
  };

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
            <h1 className="font-display text-3xl tracking-wide text-primary">Avaliação por Vídeo</h1>
            <p className="text-sm text-muted-foreground">
              Envie um lance do atleta e a IA gera a pontuação automaticamente.
            </p>
          </div>
        </header>

        {filledSlots.length === 0 ? (
          <p className="rounded-xl border bg-card p-4 text-sm text-muted-foreground">
            Cadastre ao menos um atleta no campo para usar a análise por vídeo.
          </p>
        ) : (
          <div className="space-y-4">
            <section className="rounded-xl border bg-card p-4">
              <label htmlFor="atleta" className="text-sm font-semibold text-foreground">
                Atleta
              </label>
              <select
                id="atleta"
                value={selected}
                onChange={(e) => {
                  setSelected(e.target.value as PositionKey);
                  setResult(null);
                }}
                className="mt-2 w-full rounded-lg border bg-background px-3 py-2 text-sm text-foreground"
              >
                <option value="">Selecione o atleta</option>
                {filledSlots.map((s) => (
                  <option key={s.key} value={s.key}>
                    {board[s.key]?.athlete.fullName} — {s.name}
                  </option>
                ))}
              </select>
            </section>

            <section className="rounded-xl border bg-card p-4">
              <p className="text-sm font-semibold text-foreground">Vídeo do atleta</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Formatos comuns (MP4, MOV, WEBM) de até 15 MB — cerca de 1 minuto de jogo.
              </p>
              <input
                ref={inputRef}
                id="video"
                type="file"
                accept="video/*"
                className="sr-only"
                onChange={(e) => onPick(e.target.files?.[0] ?? null)}
              />
              <label
                htmlFor="video"
                className="mt-3 flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed px-3 py-6 text-sm font-semibold text-foreground"
              >
                <Upload className="h-4 w-4" />
                {file ? file.name : "Escolher vídeo"}
              </label>

              {previewUrl && (
                <video
                  src={previewUrl}
                  controls
                  playsInline
                  className="mt-3 w-full rounded-lg bg-black"
                />
              )}

              <button
                type="button"
                onClick={run}
                disabled={!file || !selected || loading}
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-3 py-2.5 text-sm font-bold text-primary-foreground disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Analisando vídeo…
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Gerar pontuação com IA
                  </>
                )}
              </button>
            </section>

            {result && (
              <section className="rounded-xl border bg-card p-4">
                <div className="flex items-center gap-2">
                  <Video className="h-4 w-4 text-primary" />
                  <h2 className="text-sm font-bold text-foreground">Pontuação sugerida</h2>
                  <span className="ml-auto rounded-full bg-accent px-2.5 py-0.5 text-xs font-bold text-accent-foreground">
                    Média {overallAverage(result.scores).toFixed(1).replace(".", ",")}
                  </span>
                </div>

                {result.summary && (
                  <p className="mt-2 text-sm text-muted-foreground">{result.summary}</p>
                )}

                <div className="mt-3 space-y-3">
                  {CRITERIA.map((group) => (
                    <div key={group.id}>
                      <div className="flex items-baseline justify-between">
                        <h3 className="text-xs font-bold uppercase tracking-wide text-foreground">
                          {group.title}
                        </h3>
                        <span className="text-xs text-muted-foreground">
                          {groupAverage(group.id, result.scores).toFixed(1).replace(".", ",")}
                        </span>
                      </div>
                      <ul className="mt-1 grid grid-cols-2 gap-x-4 gap-y-1">
                        {group.items.map((item) => (
                          <li
                            key={item.id}
                            className="flex justify-between text-xs text-muted-foreground"
                          >
                            <span>{item.label}</span>
                            <span className="font-bold text-foreground">
                              {result.scores[`${group.id}.${item.id}`] ?? "—"}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={save}
                  className="mt-4 w-full rounded-lg bg-primary px-3 py-2.5 text-sm font-bold text-primary-foreground"
                >
                  Salvar avaliação do atleta
                </button>
              </section>
            )}

            <p className="text-xs text-muted-foreground">
              O vídeo é enviado apenas para a análise e não fica armazenado no aplicativo.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
