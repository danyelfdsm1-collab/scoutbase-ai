export type Foot = "Destro" | "Canhoto" | "Ambidestro";

export type PositionKey =
  | "GOL"
  | "LD"
  | "ZAD"
  | "ZAC"
  | "ZAE"
  | "LE"
  | "VOL"
  | "VOL2"
  | "MC"
  | "MC2"
  | "MEI"
  | "MEI2"
  | "PD"
  | "PE"
  | "ATA"
  | "ATA2";

export interface SlotDef {
  key: PositionKey;
  label: string;
  name: string;
  /** percentage coordinates over the pitch */
  x: number;
  y: number;
}

/** todas as posições possíveis (usadas por painel, relatórios e evolução) */
export const SLOTS: SlotDef[] = [
  { key: "GOL", label: "GOL", name: "Goleiro", x: 50, y: 90 },
  { key: "LD", label: "LD", name: "Lateral/Ala Direito", x: 84, y: 72 },
  { key: "ZAD", label: "ZAG", name: "Zagueiro Direito", x: 62, y: 76 },
  { key: "ZAC", label: "ZAG", name: "Zagueiro Central", x: 50, y: 80 },
  { key: "ZAE", label: "ZAG", name: "Zagueiro Esquerdo", x: 38, y: 76 },
  { key: "LE", label: "LE", name: "Lateral/Ala Esquerdo", x: 16, y: 72 },
  { key: "VOL", label: "VOL", name: "Volante", x: 50, y: 57 },
  { key: "VOL2", label: "VOL", name: "Segundo Volante", x: 38, y: 58 },
  { key: "MC", label: "MC", name: "Meio-campo Direito", x: 72, y: 47 },
  { key: "MC2", label: "MC", name: "Meio-campo Esquerdo", x: 28, y: 47 },
  { key: "MEI", label: "MEI", name: "Meia Armador", x: 50, y: 38 },
  { key: "MEI2", label: "MEI", name: "Segundo Meia", x: 37, y: 32 },
  { key: "PD", label: "PD", name: "Ponta Direita", x: 80, y: 24 },
  { key: "PE", label: "PE", name: "Ponta Esquerda", x: 20, y: 24 },
  { key: "ATA", label: "ATA", name: "Centroavante", x: 50, y: 16 },
  { key: "ATA2", label: "ATA", name: "Segundo Atacante", x: 38, y: 17 },
];

const slot = (key: PositionKey, x: number, y: number, name?: string): SlotDef => {
  const base = SLOTS.find((s) => s.key === key)!;
  return { ...base, x, y, ...(name ? { name } : {}) };
};

export const FORMATIONS = {
  "4-3-3": [
    slot("GOL", 50, 90),
    slot("LD", 84, 72),
    slot("ZAD", 62, 76),
    slot("ZAE", 38, 76),
    slot("LE", 16, 72),
    slot("VOL", 50, 57),
    slot("MC", 72, 47),
    slot("MC2", 28, 47),
    slot("PD", 80, 24),
    slot("ATA", 50, 16),
    slot("PE", 20, 24),
  ],
  "4-4-2": [
    slot("GOL", 50, 90),
    slot("LD", 84, 72),
    slot("ZAD", 62, 76),
    slot("ZAE", 38, 76),
    slot("LE", 16, 72),
    slot("PD", 84, 47),
    slot("MC", 62, 52),
    slot("MC2", 38, 52),
    slot("PE", 16, 47),
    slot("ATA", 62, 17),
    slot("ATA2", 38, 17),
  ],
  "4-5-1": [
    slot("GOL", 50, 90),
    slot("LD", 86, 72),
    slot("ZAD", 62, 76),
    slot("ZAE", 38, 76),
    slot("LE", 14, 72),
    slot("PD", 86, 45),
    slot("MC", 68, 51),
    slot("VOL", 50, 57),
    slot("MC2", 32, 51),
    slot("PE", 14, 45),
    slot("ATA", 50, 16),
  ],
  "4-3-2-1": [
    slot("GOL", 50, 90),
    slot("LD", 84, 72),
    slot("ZAD", 62, 76),
    slot("ZAE", 38, 76),
    slot("LE", 16, 72),
    slot("VOL", 50, 58),
    slot("MC", 70, 50),
    slot("MC2", 30, 50),
    slot("MEI", 63, 32),
    slot("MEI2", 37, 32),
    slot("ATA", 50, 15),
  ],
  "4-1-3-2": [
    slot("GOL", 50, 90),
    slot("LD", 84, 72),
    slot("ZAD", 62, 76),
    slot("ZAE", 38, 76),
    slot("LE", 16, 72),
    slot("VOL", 50, 61),
    slot("MC", 78, 44),
    slot("MEI", 50, 42),
    slot("MC2", 22, 44),
    slot("ATA", 62, 17),
    slot("ATA2", 38, 17),
  ],
  "5-4-1": [
    slot("GOL", 50, 90),
    slot("LD", 88, 70),
    slot("ZAD", 68, 78),
    slot("ZAC", 50, 80),
    slot("ZAE", 32, 78),
    slot("LE", 12, 70),
    slot("PD", 82, 48),
    slot("MC", 60, 52),
    slot("MC2", 40, 52),
    slot("PE", 18, 48),
    slot("ATA", 50, 16),
  ],
  "4-1-2-1-2": [
    slot("GOL", 50, 90),
    slot("LD", 84, 72),
    slot("ZAD", 62, 76),
    slot("ZAE", 38, 76),
    slot("LE", 16, 72),
    slot("VOL", 50, 61),
    slot("MC", 74, 47),
    slot("MC2", 26, 47),
    slot("MEI", 50, 33),
    slot("ATA", 62, 16),
    slot("ATA2", 38, 16),
  ],
  "3-5-2": [
    slot("GOL", 50, 90),
    slot("ZAD", 68, 78),
    slot("ZAC", 50, 80),
    slot("ZAE", 32, 78),
    slot("LD", 88, 55),
    slot("MC", 66, 52),
    slot("VOL", 50, 58),
    slot("MC2", 34, 52),
    slot("LE", 12, 55),
    slot("ATA", 62, 17),
    slot("ATA2", 38, 17),
  ],
  "5-3-2": [
    slot("GOL", 50, 90),
    slot("LD", 88, 70),
    slot("ZAD", 68, 78),
    slot("ZAC", 50, 80),
    slot("ZAE", 32, 78),
    slot("LE", 12, 70),
    slot("VOL", 50, 57),
    slot("MC", 70, 48),
    slot("MC2", 30, 48),
    slot("ATA", 62, 17),
    slot("ATA2", 38, 17),
  ],
  "4-2-3-1": [
    slot("GOL", 50, 90),
    slot("LD", 84, 72),
    slot("ZAD", 62, 76),
    slot("ZAE", 38, 76),
    slot("LE", 16, 72),
    slot("VOL", 62, 58),
    slot("VOL2", 38, 58),
    slot("PD", 82, 38),
    slot("MEI", 50, 38),
    slot("PE", 18, 38),
    slot("ATA", 50, 15),
  ],
  "3-4-3": [
    slot("GOL", 50, 90),
    slot("ZAD", 68, 78),
    slot("ZAC", 50, 80),
    slot("ZAE", 32, 78),
    slot("LD", 86, 55),
    slot("MC", 62, 52),
    slot("MC2", 38, 52),
    slot("LE", 14, 55),
    slot("PD", 80, 20),
    slot("ATA", 50, 15),
    slot("PE", 20, 20),
  ],
  "3-2-4-1": [
    slot("GOL", 50, 90),
    slot("ZAD", 68, 78),
    slot("ZAC", 50, 80),
    slot("ZAE", 32, 78),
    slot("VOL", 62, 62),
    slot("VOL2", 38, 62),
    slot("PD", 84, 40),
    slot("MC", 62, 38),
    slot("MC2", 38, 38),
    slot("PE", 16, 40),
    slot("ATA", 50, 15),
  ],
  "4-2-4": [
    slot("GOL", 50, 90),
    slot("LD", 84, 72),
    slot("ZAD", 62, 76),
    slot("ZAE", 38, 76),
    slot("LE", 16, 72),
    slot("VOL", 62, 55),
    slot("VOL2", 38, 55),
    slot("PD", 84, 26),
    slot("ATA", 62, 16),
    slot("ATA2", 38, 16),
    slot("PE", 16, 26),
  ],
} satisfies Record<string, SlotDef[]>;

export type Formation = keyof typeof FORMATIONS;
export const FORMATION_LIST = Object.keys(FORMATIONS) as Formation[];
export const DEFAULT_FORMATION: Formation = "4-3-3";


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

export interface EvaluationSnapshot {
  at: string;
  scores: Record<string, number>;
}

export interface Evaluation {
  scores: Record<string, number>;
  notes: string;
  updatedAt?: string;
  /** histórico de avaliações anteriores para acompanhamento da evolução */
  history?: EvaluationSnapshot[];
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

const FORMATION_KEY = "scout-base-formation-v1";

export function loadFormation(): Formation {
  if (typeof window === "undefined") return DEFAULT_FORMATION;
  const value = window.localStorage.getItem(FORMATION_KEY) as Formation | null;
  return value && value in FORMATIONS ? value : DEFAULT_FORMATION;
}

export function saveFormation(formation: Formation) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(FORMATION_KEY, formation);
}
