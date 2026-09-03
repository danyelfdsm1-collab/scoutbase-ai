import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, FileDown, FileSpreadsheet, FileText, Table2, Star } from "lucide-react";
import { toast } from "sonner";
import { CRITERIA, loadBoard, type Board } from "@/lib/scouting";
import {
  exportCSV,
  exportDOCX,
  exportPDF,
  exportXLSX,
  reportTitle,
  selectRows,
  type ReportKind,
} from "@/lib/reports";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/relatorios")({
  head: () => ({
    meta: [
      { title: "Relatórios de avaliação — Scout Base" },
      {
        name: "description",
        content:
          "Gere relatórios Completo e de Destaques das avaliações de atletas de base e exporte em PDF, CSV, DOCX ou XLSX.",
      },
      { property: "og:title", content: "Relatórios de avaliação — Scout Base" },
      {
        property: "og:description",
        content:
          "Relatório Completo com todos os critérios e Relatório de Destaques com os melhores atletas, exportáveis em PDF, CSV, DOCX e XLSX.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ReportsPage;
});

function ReportsPage() {
  const [board, setBoard] = useState<Board>({});
  const [kind, setKind] = useState<ReportKind>("completo");
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => setBoard(loadBoard()), []);

  const rows = useMemo(() => selectRows(board, kind), [board, kind]);

  async function run(format: string, fn: () => void | Promise<void>) {
    if (!rows.length) {
      toast.error("Nenhum atleta avaliado para exportar.");
      return;
    }
    setBusy(format);
    try {
      await fn();
      toast.success(`${format} gerado com sucesso.`);
    } catch (e) {
      toast.error(`Falha ao gerar ${format}.`);
      console.error(e);
    } finally {
      setBusy(null);
    }
  }

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
          <div className="min-w-0">
            <h1 className="font-display text-3xl tracking-wide text-primary">Relatórios</h1>
            <p className="text-sm text-muted-foreground">
              Escolha o tipo de relatório e exporte no formato desejado.
            </p>
          </div>
        </header>

        <div className="mb-4 grid grid-cols-2 gap-2">
          {(["completo", "destaques"] as ReportKind[]).map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => setKind(k)}
              className={`rounded-xl border p-3 text-left transition ${
                kind === k ? "border-gold bg-accent" : "bg-card"
              }`}
            >
              <span className="flex items-center gap-2 font-semibold">
                {k === "completo" ? (
                  <FileText className="h-4 w-4" />
                ) : (
                  <Star className="h-4 w-4" />
                )}
                {k === "completo" ? "Completo" : "Destaques"}
              </span>
              <span className="mt-1 block text-xs text-muted-foreground">
                {k === "completo"
                  ? "Todos os atletas com os 16 critérios, médias e observações."
                  : "Atletas com média ≥ 7,0 (ou top 3), pontos fortes e a desenvolver."}
              </span>
            </button>
          ))}
        </div>

        <section className="mb-4 rounded-xl border bg-card p-4">
          <h2 className="font-display text-xl text-primary">{reportTitle(kind)}</h2>
          <p className="mb-3 text-xs text-muted-foreground">
            {rows.length
              ? `${rows.length} atleta${rows.length > 1 ? "s" : ""} incluído${rows.length > 1 ? "s" : ""}.`
              : "Nenhum atleta atende ao critério deste relatório."}
          </p>
          <div className="space-y-2">
            {rows.map((r) => (
              <div key={r.nome + r.posicao} className="rounded-lg border p-2">
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-sm font-semibold">
                    {r.nome}{" "}
                    <span className="font-normal text-muted-foreground">— {r.posicao}</span>
                  </p>
                  <span className="rounded bg-gold px-2 py-0.5 font-display text-sm text-gold-foreground">
                    {r.media.toFixed(1)}
                  </span>
                </div>
                <div className="mt-1 flex flex-wrap gap-1">
                  {r.grupos.map((g) => (
                    <span
                      key={g.id}
                      className="rounded bg-accent px-1.5 py-0.5 text-[10px] font-semibold text-accent-foreground"
                    >
                      {(CRITERIA.find((c) => c.id === g.id)?.title.split(" ")[0] ?? g.id).replace(
                        "/",
                        "",
                      )}
                      : {g.avg.toFixed(1)}
                    </span>
                  ))}
                </div>
                {kind === "destaques" && r.pontosFortes.length > 0 && (
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    Fortes: {r.pontosFortes.join(", ")}
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>

        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="default"
            disabled={busy !== null}
            onClick={() => run("PDF", () => exportPDF(rows, kind))}
          >
            <FileDown className="mr-2 h-4 w-4" /> PDF
          </Button>
          <Button
            variant="secondary"
            disabled={busy !== null}
            onClick={() => run("CSV", () => exportCSV(rows, kind))}
          >
            <Table2 className="mr-2 h-4 w-4" /> CSV
          </Button>
          <Button
            variant="secondary"
            disabled={busy !== null}
            onClick={() => run("DOCX", () => exportDOCX(rows, kind))}
          >
            <FileText className="mr-2 h-4 w-4" /> DOCX
          </Button>
          <Button
            variant="secondary"
            disabled={busy !== null}
            onClick={() => run("XLSX", () => exportXLSX(rows, kind))}
          >
            <FileSpreadsheet className="mr-2 h-4 w-4" /> XLSX
          </Button>
        </div>

        <p className="mt-4 text-center text-xs text-muted-foreground">
          Os arquivos são gerados neste dispositivo, sem envio para servidores.
        </p>
      </div>
    </main>
  );
}
