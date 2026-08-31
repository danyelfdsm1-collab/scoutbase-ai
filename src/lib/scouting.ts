export type Foot = "Destro" | "Canhoto" | "Ambidestro";

export type PositionKey =
  | "GOL"
  | "LD"
  | "ZAD"
  | "ZAE"
  | "LE"
  | "VOL"
  | "MC"
  | "MEI"
  | "PD"
  | "PE"
  | "ATA";

export interface SlotDef {
  key: PositionKey;
  label: string;
  name: string;
  /** percentage coordinates over the pitch */
  x: number;
  y: number;
}

/** 4-3-3 layout on a vertical pitch (own goal at the bottom) */
export const SLOTS: SlotDef[] = [
  { key: "GOL", label: "GOL", name: "Goleiro", x: 50, y: 90 },
  { key: "LD", label: "LD", name: "Lateral Direito", x: 84, y: 72 },
  { key: "ZAD", label: "ZAG", name: "Zagueiro Direito", x: 62, y: 76 },
  { key: "ZAE", label: "ZAG", name: "Zagueiro Esquerdo", x: 38, y: 76 },
  { key: "LE", label: "LE", name: "Lateral Esquerdo", x: 16, y: 72 },
  { key: "VOL", label: "VOL", name: "Volante", x: 50, y: 57 },
  { key: "MC", label: "MC", name: "Meio-campo Direito", x: 72, y: 47 },
  { key: "MEI", label: "MEI", name: "Meio-campo Esquerdo", x: 28, y: 47 },
  { key: "PD", label: "PD", name: "Ponta Direita", x: 80, y: 24 },
  { key: "ATA", label: "ATA", name: "Centroavante", x: 50, y: 16 },
  { key: "PE", label: "PE", name: "Ponta Esquerda", x: 20, y: 24 },
];

export const CATEGORIES = [
  "Sub-11",
  "Sub-12",
  "Sub-13",
  "Sub-14",
  "Sub-15",
  "Sub-16",
  "Sub-17",
  "Sub-20",
] as const;
export type Category = (typeof CATEGORIES)[number];

export interface CriteriaGroup {
  id: string;
  title: string;
  description: string;
  items: { id: string; label: string; hint: string }[];
}

export const CRITERIA: CriteriaGroup[] = [
  {
    id: "tecnica",
    title: "Técnica Individual",
    description: "Controle, passe, finalização, condução e jogo aéreo.",
    items: [
      { id: "controle", label: "Controle", hint: "Domínio orientado sob pressão." },
      { id: "passe", label: "Passe", hint: "Precisão, peso e variação de passe." },
      { id: "finalizacao", label: "Finalização", hint: "Eficiência e escolha do tipo de chute." },
      { id: "conducao", label: "Condução", hint: "Progressão com bola e proteção." },
      { id: "jogo_aereo", label: "Jogo aéreo", hint: "Impulsão, timing e direcionamento." },
    ],
  },
  {
    id: "tatica",
    title: "Tática / Leitura de Jogo",
    description: "Posicionamento, corredores, impedimento e transições.",
    items: [
      { id: "posicionamento", label: "Posicionamento", hint: "Ocupação de espaços e cobertura." },
      { id: "corredores", label: "Corredores", hint: "Uso de amplitude e corredores internos." },
      { id: "impedimento", label: "Impedimento", hint: "Linha de última defesa e timing de ruptura." },
      { id: "transicoes", label: "Transições", hint: "Reação após perda e após recuperação." },
    ],
  },
  {
    id: "fisica",
    title: "Física",
    description: "Velocidade, agilidade e resistência aeróbia específica do futebol.",
    items: [
      { id: "velocidade", label: "Velocidade", hint: "Aceleração e velocidade máxima." },
      { id: "agilidade", label: "Agilidade", hint: "Mudanças de direção e coordenação." },
      { id: "resistencia", label: "Resistência aeróbia", hint: "Repetição de esforços intensos." },
    ],
  },
  {
    id: "mental",
    title: "Mental / Comportamental",
    description: "Concentração, decisão sob pressão e atitude.",
    items: [
      { id: "concentracao", label: "Concentração", hint: "Constância durante os 90 minutos." },
      { id: "decisao", label: "Decisão sob pressão", hint: "Qualidade da escolha em espaço curto." },
      { id: "atitude", label: "Atitude", hint: "Liderança, entrega e resposta ao erro." },
    ],
  },
];

export interface Athlete {
  fullName: string;
  birthDate: string;
  foot: Foot | "";
  position: string;
  heightCm: string;
  weightKg: string;
  category: Category | "";
  photo?: string;
}

export interface Evaluation {
  scores: Record<string, number>;
  notes: string;
  updatedAt?: string;
}

export interface SlotData {
  athlete: Athlete;
  evaluation: Evaluation;
}

export type Board = Partial<Record<PositionKey, SlotData>>;

export const emptyAthlete = (position: string): Athlete => ({
  fullName: "",
  birthDate: "",
  foot: "",
  position,
  heightCm: "",
  weightKg: "",
  category: "",
});

export const emptyEvaluation = (): Evaluation => ({ scores: {}, notes: "" });

export const allItems = CRITERIA.flatMap((g) => g.items.map((i) => `${g.id}.${i.id}`));

export function groupAverage(groupId: string, scores: Record<string, number>) {
  const group = CRITERIA.find((g) => g.id === groupId);
  if (!group) return 0;
  const values = group.items
    .map((i) => scores[`${groupId}.${i.id}`])
    .filter((v): v is number => typeof v === "number");
  if (!values.length) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

export function overallAverage(scores: Record<string, number>) {
  const values = allItems.map((k) => scores[k]).filter((v): v is number => typeof v === "number");
  if (!values.length) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

const STORAGE_KEY = "scout-base-board-v1";

export function loadBoard(): Board {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "{}") as Board;
  } catch {
    return {};
  }
}

export function saveBoard(board: Board) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(board));
}
