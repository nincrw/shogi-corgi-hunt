export type ClutterKind =
  | "person"
  | "beachBall"
  | "umbrella"
  | "starfish"
  | "shell"
  | "crab"
  | "sandcastle"
  | "seaweed"
  | "towel"
  | "bucket"
  | "fish"
  | "flag";

export type ClutterItem = {
  xFrac: number;
  yFrac: number;
  size: number; // fraction of min(canvasWidth, canvasHeight)
  rotation: number;
  flip: boolean;
  kind: ClutterKind;
  colorA: string;
  colorB: string;
  colorC: string;
};

export type BackgroundKind = "sun" | "cloud" | "island" | "lighthouse" | "boat";

export type BackgroundElement = {
  xFrac: number;
  yFrac: number;
  size: number;
  kind: BackgroundKind;
};

export type MascotSpot = {
  id: string;
  xFrac: number;
  yFrac: number;
  scale: number;
  rotation: number;
  flip: boolean;
  found: boolean;
};

export type Scene = {
  background: BackgroundElement[];
  clutter: ClutterItem[];
  occluders: ClutterItem[];
  mascots: MascotSpot[];
};

export const MASCOT_COUNT = 15;
export const MASCOT_SIZE_FRAC = 0.13; // full drawn width, as a fraction of min(canvasWidth, canvasHeight)

const GEN_ASPECT = 16 / 9;
const MIN_MASCOT_DIST = 0.115;
const MASCOT_SCALE_MIN = 0.4;
const MASCOT_SCALE_MAX = 0.85;
const CLUTTER_COUNT = 160;
const OCCLUDER_CHANCE = 0.75;
const SECOND_OCCLUDER_CHANCE = 0.4;

const CLUTTER_KINDS: ClutterKind[] = [
  "person",
  "person",
  "person",
  "beachBall",
  "umbrella",
  "starfish",
  "shell",
  "crab",
  "sandcastle",
  "seaweed",
  "towel",
  "bucket",
  "fish",
  "flag",
];

const SKIN_TONES = ["#ffdbb0", "#f1c27d", "#e0ac69", "#c68642", "#8d5524"];
const HAIR_COLORS = ["#2b2b2b", "#6b4226", "#caa472", "#b33a3a", "#e8c15a", "#5b3a29"];
const CLOTHING_COLORS = ["#ef4444", "#3b82f6", "#22c55e", "#f59e0b", "#a855f7", "#ec4899", "#14b8a6", "#f97316"];
const BALL_COLORS = ["#ef4444", "#facc15", "#3b82f6", "#22c55e"];
const TOWEL_PAIRS: [string, string][] = [
  ["#ef4444", "#ffffff"],
  ["#3b82f6", "#facc15"],
  ["#22c55e", "#ffffff"],
  ["#a855f7", "#facc15"],
  ["#f97316", "#ffffff"],
];
const SHELL_COLORS = ["#ffd9c9", "#ffe3f1", "#fff3c9"];
const SAND_TONES = ["#e8c987", "#dfc27a", "#eccf94"];

function randRange(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

function pick<T>(items: readonly T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

function distance(
  a: { xFrac: number; yFrac: number },
  b: { xFrac: number; yFrac: number },
  aspect: number
): number {
  const dx = (a.xFrac - b.xFrac) * aspect;
  const dy = a.yFrac - b.yFrac;
  return Math.sqrt(dx * dx + dy * dy);
}

function randomClutterItem(overrides: Partial<ClutterItem> = {}): ClutterItem {
  const kind = overrides.kind ?? pick(CLUTTER_KINDS);
  let colorA = "#cccccc";
  let colorB = "#999999";
  let colorC = "#666666";

  switch (kind) {
    case "person":
      colorA = pick(SKIN_TONES);
      colorB = pick(HAIR_COLORS);
      colorC = pick(CLOTHING_COLORS);
      break;
    case "beachBall":
      colorA = pick(BALL_COLORS);
      colorB = pick(BALL_COLORS.filter((c) => c !== colorA));
      break;
    case "umbrella": {
      const [a, b] = pick(TOWEL_PAIRS);
      colorA = a;
      colorB = b;
      break;
    }
    case "towel": {
      const [a, b] = pick(TOWEL_PAIRS);
      colorA = a;
      colorB = b;
      break;
    }
    case "starfish":
      colorA = pick(["#fb923c", "#f472b6", "#fbbf24"]);
      break;
    case "shell":
      colorA = pick(SHELL_COLORS);
      colorB = "#e08a8a";
      break;
    case "crab":
      colorA = pick(["#ef4444", "#f97316", "#dc2626"]);
      break;
    case "sandcastle":
      colorA = pick(SAND_TONES);
      break;
    case "seaweed":
      colorA = pick(["#2f855a", "#38a169", "#276749"]);
      break;
    case "bucket":
      colorA = pick(CLOTHING_COLORS);
      break;
    case "fish":
      colorA = pick(["#38bdf8", "#fb923c", "#a3e635"]);
      break;
    case "flag":
      colorA = pick(CLOTHING_COLORS);
      break;
  }

  return {
    xFrac: randRange(0.02, 0.98),
    yFrac: randRange(0.32, 0.98),
    size: randRange(0.022, 0.052),
    rotation: randRange(-0.25, 0.25),
    flip: Math.random() < 0.5,
    kind,
    colorA,
    colorB,
    colorC,
    ...overrides,
  };
}

export function generateScene(): Scene {
  const mascots: MascotSpot[] = [];

  let attempts = 0;
  while (mascots.length < MASCOT_COUNT && attempts < 3000) {
    attempts++;
    const candidate = {
      xFrac: randRange(0.06, 0.94),
      yFrac: randRange(0.2, 0.94),
      scale: randRange(MASCOT_SCALE_MIN, MASCOT_SCALE_MAX),
      rotation: randRange(-0.3, 0.3),
      flip: Math.random() < 0.5,
    };
    const tooClose = mascots.some(
      (m) => distance(candidate, m, GEN_ASPECT) < MIN_MASCOT_DIST * ((candidate.scale + m.scale) / 2)
    );
    if (!tooClose) {
      mascots.push({ id: `m-${mascots.length}-${attempts}-${Math.random()}`, found: false, ...candidate });
    }
  }
  // Guarantee exactly MASCOT_COUNT even if the arena is too tight for perfect spacing.
  while (mascots.length < MASCOT_COUNT) {
    mascots.push({
      id: `m-fallback-${mascots.length}-${Math.random()}`,
      found: false,
      xFrac: randRange(0.06, 0.94),
      yFrac: randRange(0.2, 0.94),
      scale: randRange(MASCOT_SCALE_MIN, MASCOT_SCALE_MAX),
      rotation: randRange(-0.3, 0.3),
      flip: Math.random() < 0.5,
    });
  }

  const clutter: ClutterItem[] = Array.from({ length: CLUTTER_COUNT }, () => randomClutterItem());

  const occluders: ClutterItem[] = [];
  for (const m of mascots) {
    if (Math.random() < OCCLUDER_CHANCE) {
      occluders.push(
        randomClutterItem({
          xFrac: m.xFrac + randRange(-0.03, 0.03),
          yFrac: m.yFrac + randRange(0.01, 0.05),
          size: randRange(0.04, 0.075) * m.scale,
        })
      );
    }
    if (Math.random() < SECOND_OCCLUDER_CHANCE) {
      occluders.push(
        randomClutterItem({
          xFrac: m.xFrac + randRange(-0.045, 0.045),
          yFrac: m.yFrac + randRange(-0.045, 0.02),
          size: randRange(0.035, 0.06) * m.scale,
        })
      );
    }
  }

  const background: BackgroundElement[] = [
    { kind: "sun", xFrac: 0.08, yFrac: 0.1, size: 0.11 },
    { kind: "cloud", xFrac: randRange(0.25, 0.38), yFrac: randRange(0.07, 0.14), size: randRange(0.09, 0.12) },
    { kind: "cloud", xFrac: randRange(0.55, 0.68), yFrac: randRange(0.05, 0.12), size: randRange(0.07, 0.1) },
    { kind: "island", xFrac: 0.14, yFrac: 0.28, size: 0.24 },
    { kind: "lighthouse", xFrac: 0.93, yFrac: 0.18, size: 0.16 },
    { kind: "boat", xFrac: randRange(0.55, 0.72), yFrac: 0.24, size: 0.15 },
  ];

  return { background, clutter, occluders, mascots };
}

// Matches the visual half-size of the drawn mascot, plus generous forgiveness for touch taps.
export function hitRadiusFrac(scale: number): number {
  return (MASCOT_SIZE_FRAC * scale) / 2 + 0.035;
}
