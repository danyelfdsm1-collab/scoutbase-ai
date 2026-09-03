import {
  CRITERIA,
  SLOTS,
  groupAverage,
  overallAverage,
  type Board,
} from "@/lib/scouting";

export type ReportKind = "completo" | "destaques";

export interface ReportRow {
  posicao: string;
  nome: string;
  categoria: string;
  nascimento: string;
  pe: string;
  altura: string;
  peso: string;
  grupos: { id: string; title: string; avg: number }[];
  itens: { key: string; label: string; score: number | null }[];
  media: number;
  notas: string;
  pontosFortes: string[];
  aMelhorar: string[];
}

export function buildRows(board: Board): ReportRow[] {
  return SLOTS.map((slot) => {
    const data = board[slot.key];
    if (!data || !data.athlete.fullName.trim()) return null;
    const scores = data.evaluation.scores;
    const itens = CRITERIA.flatMap((g) =>
      g.items.map((i) => {
        const key = `${g.id}.${i.id}`;
        const v = scores[key];
        return {
          key,
          label: `${g.title} — ${i.label}`,
          score: typeof v === "number" ? v : null,
        };
      }),
    );
    const scored = itens.filter((i) => i.score !== null) as {
      key: string;
      label: string;
      score: number;
    }[];
    const sorted = [...scored].sort((a, b) => b.score - a.score);
    return {
      posicao: slot.name,
      nome: data.athlete.fullName,
      categoria: data.athlete.category || "—",
      nascimento: data.athlete.birthDate || "—",
      pe: data.athlete.foot || "—",
      altura: data.athlete.heightCm ? `${data.athlete.heightCm} cm` : "—",
      peso: data.athlete.weightKg ? `${data.athlete.weightKg} kg` : "—",
      grupos: CRITERIA.map((g) => ({
        id: g.id,
        title: g.title,
        avg: groupAverage(g.id, scores),
      })),
      itens,
      media: overallAverage(scores),
      notas: data.evaluation.notes?.trim() || "",
      pontosFortes: sorted.slice(0, 3).map((i) => `${i.label} (${i.score.toFixed(1)})`),
      aMelhorar: sorted
        .slice(-3)
        .reverse()
        .map((i) => `${i.label} (${i.score.toFixed(1)})`),
    };
  }).filter((r): r is ReportRow => r !== null);
}

export function selectRows(board: Board, kind: ReportKind): ReportRow[] {
  const rows = buildRows(board).sort((a, b) => b.media - a.media);
  if (kind === "completo") return rows;
  const highlights = rows.filter((r) => r.media >= 7);
  return highlights.length ? highlights : rows.slice(0, 3);
}

export const reportTitle = (kind: ReportKind) =>
  kind === "completo"
    ? "Relatório Completo de Avaliação"
    : "Relatório de Destaques";

export const fileBase = (kind: ReportKind) =>
  `scout-base-${kind}-${new Date().toISOString().slice(0, 10)}`;

export const todayLabel = () => new Date().toLocaleDateString("pt-BR");

function download(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

/* ---------------- CSV ---------------- */

function tableData(rows: ReportRow[], kind: ReportKind) {
  const head =
    kind === "completo"
      ? [
          "Posição",
          "Atleta",
          "Categoria",
          "Nascimento",
          "Pé dominante",
          "Altura",
          "Peso",
          ...CRITERIA.flatMap((g) => g.items.map((i) => `${g.title} - ${i.label}`)),
          ...CRITERIA.map((g) => `Média ${g.title}`),
          "Média geral",
          "Observações",
        ]
      : [
          "Posição",
          "Atleta",
          "Categoria",
          ...CRITERIA.map((g) => `Média ${g.title}`),
          "Média geral",
          "Pontos fortes",
          "A desenvolver",
        ];

  const body = rows.map((r) =>
    kind === "completo"
      ? [
          r.posicao,
          r.nome,
          r.categoria,
          r.nascimento,
          r.pe,
          r.altura,
          r.peso,
          ...r.itens.map((i) => (i.score === null ? "—" : i.score.toFixed(1))),
          ...r.grupos.map((g) => g.avg.toFixed(1)),
          r.media.toFixed(1),
          r.notas,
        ]
      : [
          r.posicao,
          r.nome,
          r.categoria,
          ...r.grupos.map((g) => g.avg.toFixed(1)),
          r.media.toFixed(1),
          r.pontosFortes.join("; "),
          r.aMelhorar.join("; "),
        ],
  );

  return { head, body };
}

export function exportCSV(rows: ReportRow[], kind: ReportKind) {
  const { head, body } = tableData(rows, kind);
  const esc = (v: string) => `"${String(v).replace(/"/g, '""')}"`;
  const csv = [head, ...body].map((line) => line.map(esc).join(";")).join("\r\n");
  download(
    new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" }),
    `${fileBase(kind)}.csv`,
  );
}

/* ---------------- XLSX ---------------- */

export async function exportXLSX(rows: ReportRow[], kind: ReportKind) {
  const XLSX = await import("xlsx");
  const { head, body } = tableData(rows, kind);
  const ws = XLSX.utils.aoa_to_sheet([
    [reportTitle(kind)],
    [`Gerado em ${todayLabel()}`],
    [],
    head,
    ...body,
  ]);
  ws["!cols"] = head.map((h, i) => ({ wch: i < 2 ? 24 : Math.max(12, h.length + 2) }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, kind === "completo" ? "Completo" : "Destaques");
  const out = XLSX.write(wb, { bookType: "xlsx", type: "array" }) as ArrayBuffer;
  download(
    new Blob([out], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    }),
    `${fileBase(kind)}.xlsx`,
  );
}

/* ---------------- PDF ---------------- */

export async function exportPDF(rows: ReportRow[], kind: ReportKind) {
  const { jsPDF } = await import("jspdf");
  const autoTable = (await import("jspdf-autotable")).default;
  const doc = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
  const margin = 40;
  let y = margin;

  doc.setFillColor(16, 74, 44);
  doc.rect(0, 0, doc.internal.pageSize.getWidth(), 64, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.text(reportTitle(kind), margin, 30);
  doc.setFontSize(10);
  doc.text(`Scout Base • Gerado em ${todayLabel()} • ${rows.length} atleta(s)`, margin, 48);
  doc.setTextColor(0, 0, 0);
  y = 90;

  rows.forEach((r, idx) => {
    if (y > doc.internal.pageSize.getHeight() - 160) {
      doc.addPage();
      y = margin;
    }
    doc.setFontSize(13);
    doc.text(`${idx + 1}. ${r.nome} — ${r.posicao}`, margin, y);
    doc.setFontSize(9);
    doc.setTextColor(90, 90, 90);
    doc.text(
      `${r.categoria} • Nasc.: ${r.nascimento} • Pé: ${r.pe} • ${r.altura} • ${r.peso} • Média geral: ${r.media.toFixed(1)}`,
      margin,
      y + 14,
    );
    doc.setTextColor(0, 0, 0);
    y += 26;

    const body: string[][] =
      kind === "completo"
        ? CRITERIA.flatMap((g) => [
            [g.title, `Média ${groupAvgOf(r, g.id).toFixed(1)}`],
            ...g.items.map((i) => {
              const item = r.itens.find((it) => it.key === `${g.id}.${i.id}`);
              return [`   ${i.label}`, item?.score === null || item === undefined ? "—" : item.score.toFixed(1)];
            }),
          ])
        : [
            ...r.grupos.map((g) => [g.title, g.avg.toFixed(1)]),
            ["Pontos fortes", r.pontosFortes.join("\n") || "—"],
            ["A desenvolver", r.aMelhorar.join("\n") || "—"],
          ];

    if (r.notas) body.push(["Observações", r.notas]);

    autoTable(doc, {
      startY: y,
      margin: { left: margin, right: margin },
      head: [["Critério", "Nota"]],
      body,
      styles: { fontSize: 9, cellPadding: 4, overflow: "linebreak" },
      headStyles: { fillColor: [16, 74, 44], textColor: 255 },
      columnStyles: { 1: { cellWidth: 120 } },
      theme: "grid",
    });
    y = ((doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY ?? y) + 24;
  });

  doc.save(`${fileBase(kind)}.pdf`);
}

const groupAvgOf = (r: ReportRow, id: string) =>
  r.grupos.find((g) => g.id === id)?.avg ?? 0;

/* ---------------- DOCX ---------------- */

export async function exportDOCX(rows: ReportRow[], kind: ReportKind) {
  const {
    Document,
    Packer,
    Paragraph,
    TextRun,
    HeadingLevel,
    Table,
    TableRow,
    TableCell,
    WidthType,
    BorderStyle,
    ShadingType,
    AlignmentType,
  } = await import("docx");

  const border = { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" };
  const borders = { top: border, bottom: border, left: border, right: border };
  const cell = (text: string, width: number, bold = false, fill?: string) =>
    new TableCell({
      borders,
      width: { size: width, type: WidthType.DXA },
      ...(fill ? { shading: { fill, type: ShadingType.CLEAR } } : {}),
      margins: { top: 80, bottom: 80, left: 120, right: 120 },
      children: [new Paragraph({ children: [new TextRun({ text, bold })] })],
    });


  const children: (InstanceType<typeof Paragraph> | InstanceType<typeof Table>)[] = [
    new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun(reportTitle(kind))] }),
    new Paragraph({
      alignment: AlignmentType.LEFT,
      children: [
        new TextRun({
          text: `Scout Base • Gerado em ${todayLabel()} • ${rows.length} atleta(s)`,
          italics: true,
        }),
      ],
    }),
  ];

  rows.forEach((r, idx) => {
    children.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: [new TextRun(`${idx + 1}. ${r.nome} — ${r.posicao}`)],
      }),
      new Paragraph({
        children: [
          new TextRun(
            `${r.categoria} | Nascimento: ${r.nascimento} | Pé: ${r.pe} | ${r.altura} | ${r.peso} | Média geral: ${r.media.toFixed(1)}`,
          ),
        ],
      }),
    );

    const dataRows: [string, string][] =
      kind === "completo"
        ? CRITERIA.flatMap((g) => [
            [g.title, `Média ${groupAvgOf(r, g.id).toFixed(1)}`] as [string, string],
            ...g.items.map((i) => {
              const item = r.itens.find((it) => it.key === `${g.id}.${i.id}`);
              return [`   ${i.label}`, item && item.score !== null ? item.score.toFixed(1) : "—"] as [
                string,
                string,
              ];
            }),
          ])
        : [
            ...r.grupos.map((g) => [g.title, g.avg.toFixed(1)] as [string, string]),
            ["Pontos fortes", r.pontosFortes.join("; ") || "—"],
            ["A desenvolver", r.aMelhorar.join("; ") || "—"],
          ];

    if (r.notas) dataRows.push(["Observações", r.notas]);

    children.push(
      new Table({
        width: { size: 9360, type: WidthType.DXA },
        columnWidths: [6360, 3000],
        rows: [
          new TableRow({
            children: [cell("Critério", 6360, true, "D5E8F0"), cell("Nota", 3000, true, "D5E8F0")],
          }),
          ...dataRows.map(
            ([a, b]) => new TableRow({ children: [cell(a, 6360), cell(b, 3000)] }),
          ),
        ],
      }),
    );
  });

  const doc = new Document({
    styles: { default: { document: { run: { font: "Arial", size: 22 } } } },
    sections: [
      {
        properties: {
          page: {
            size: { width: 12240, height: 15840 },
            margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
          },
        },
        children,
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  download(blob, `${fileBase(kind)}.docx`);
}
