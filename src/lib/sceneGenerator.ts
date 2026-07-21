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
  | "flag"
  | "tree"
  | "snowman";

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

export type BackgroundKind = "sun" | "cloud" | "hill" | "lighthouse" | "boat" | "bgTree";

export type BackgroundElement = {
  xFrac: number;
  yFrac: number;
  size: number;
  kind: BackgroundKind;
  colorA: string;
  colorB: string;
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

export type ThemeName = "beach" | "park" | "snow";

export type Scene = {
  themeName: ThemeName;
  skyTop: string;
  skyBottom: string;
  midBand: { top: string; bottom: string; heightFrac: number } | null;
  groundColor: string;
  background: BackgroundElement[];
  clutter: ClutterItem[];
  occluders: ClutterItem[];
  mascots: MascotSpot[];
};

export const MASCOT_COUNT = 15;
export const MASCOT_SIZE_FRAC = 0.13; // full drawn width, as a fraction of min(canvasWidth, canvasHeight)
export const SEA_FRAC = 0.24;

const GEN_ASPECT = 16 / 9;

const SKIN_TONES = ["#ffdbb0", "#f1c27d", "#e0ac69", "#c68642", "#8d5524"];
const HAIR_COLORS = ["#2b2b2b", "#6b4226", "#caa472", "#b33a3a", "#e8c15a", "#5b3a29"];
const CLOTHING_COLORS = ["#ef4444", "#3b82f6", "#22c55e", "#f59e0b", "#a855f7", "#ec4899", "#14b8a6", "#f97316"];
const BALL_COLORS = ["#ef4444", "#facc15", "#3b82f6", "#22c55e"];
const SNOWBALL_COLORS = ["#ffffff", "#e6f2fb", "#cfe8fa"];
const TOWEL_PAIRS: [string, string][] = [
  ["#ef4444", "#ffffff"],
  ["#3b82f6", "#facc15"],
  ["#22c55e", "#ffffff"],
  ["#a855f7", "#facc15"],
  ["#f97316", "#ffffff"],
];
const SHELL_COLORS = ["#ffd9c9", "#ffe3f1", "#fff3c9"];
const SAND_TONES = ["#e8c987", "#dfc27a", "#eccf94"];
const TREE_GREENS = ["#3f9142", "#4caf50", "#2f855a"];
const SNOW_TREE_GREENS = ["#c9e4d8", "#9fc9b8", "#7bb89e"];

type ThemeConfig = {
  name: ThemeName;
  skyTop: string;
  skyBottom: string;
  midBand: { top: string; bottom: string; heightFrac: number } | null;
  groundColor: string;
  hillBase: string;
  hillTop: string;
  sunColor: string;
  cloudColor: string;
  backgroundKinds: BackgroundKind[];
  clutterKinds: ClutterKind[];
};

const THEMES: ThemeConfig[] = [
  {
    name: "beach",
    skyTop: "#7ec3ee",
    skyBottom: "#d3f0fb",
    midBand: { top: "#3f9bd8", bottom: "#8fd6ee", heightFrac: SEA_FRAC },
    groundColor: "#f2dfa8",
    hillBase: "#dfc27a",
    hillTop: "#6fbf73",
    sunColor: "#ffd166",
    cloudColor: "#ffffff",
    backgroundKinds: ["sun", "cloud", "cloud", "hill", "lighthouse", "boat"],
    clutterKinds: [
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
    ],
  },
  {
    name: "park",
    skyTop: "#9fd8f2",
    skyBottom: "#e6f7ff",
    midBand: null,
    groundColor: "#8fce6b",
    hillBase: "#7cbf58",
    hillTop: "#5ea23c",
    sunColor: "#ffe27a",
    cloudColor: "#ffffff",
    backgroundKinds: ["sun", "cloud", "cloud", "hill", "bgTree", "bgTree"],
    clutterKinds: [
      "person",
      "person",
      "person",
      "beachBall",
      "umbrella",
      "towel",
      "bucket",
      "flag",
      "seaweed",
      "starfish",
      "tree",
    ],
  },
  {
    name: "snow",
    skyTop: "#c7d9ec",
    skyBottom: "#eef3f8",
    midBand: null,
    groundColor: "#f4f8fb",
    hillBase: "#e3edf5",
    hillTop: "#ffffff",
    sunColor: "#fff6d8",
    cloudColor: "#e9f1f8",
    backgroundKinds: ["sun", "cloud", "cloud", "hill", "bgTree", "bgTree"],
    clutterKinds: ["person", "person", "person", "beachBall", "towel", "bucket", "flag", "snowman", "tree"],
  },
];

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

type Difficulty = {
  clutterCount: number;
  scaleMin: number;
  scaleMax: number;
  minDist: number;
  occluderChance: number;
  secondOccluderChance: number;
};

// Ramps up over the first ~7 scenes, then holds at max difficulty.
function difficultyForScene(sceneNumber: number): Difficulty {
  const t = Math.min(1, Math.max(0, sceneNumber - 1) / 7);
  return {
    clutterCount: Math.round(110 + t * 80),
    scaleMin: 0.55 - t * 0.23,
    scaleMax: 1.0 - t * 0.3,
    minDist: 0.14 - t * 0.04,
    occluderChance: 0.55 + t * 0.3,
    secondOccluderChance: 0.2 + t * 0.35,
  };
}

function randomClutterItem(theme: ThemeConfig, overrides: Partial<ClutterItem> = {}): ClutterItem {
  const kind = overrides.kind ?? pick(theme.clutterKinds);
  let colorA = "#cccccc";
  let colorB = "#999999";
  let colorC = "#666666";

  switch (kind) {
    case "person":
      colorA = pick(SKIN_TONES);
      colorB = pick(HAIR_COLORS);
      colorC = pick(CLOTHING_COLORS);
      break;
    case "beachBall": {
      const palette = theme.name === "snow" ? SNOWBALL_COLORS : BALL_COLORS;
      colorA = pick(palette);
      colorB = pick(palette.filter((c) => c !== colorA));
      break;
    }
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
    case "tree": {
      const palette = theme.name === "snow" ? SNOW_TREE_GREENS : TREE_GREENS;
      colorA = pick(palette);
      colorB = "#7a4a2b";
      break;
    }
    case "snowman":
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

export function generateScene(sceneNumber = 1): Scene {
  const theme = THEMES[(sceneNumber - 1) % THEMES.length];
  const diff = difficultyForScene(sceneNumber);
  const mascots: MascotSpot[] = [];

  let attempts = 0;
  while (mascots.length < MASCOT_COUNT && attempts < 3000) {
    attempts++;
    const candidate = {
      xFrac: randRange(0.06, 0.94),
      yFrac: randRange(0.2, 0.94),
      scale: randRange(diff.scaleMin, diff.scaleMax),
      rotation: randRange(-0.3, 0.3),
      flip: Math.random() < 0.5,
    };
    const tooClose = mascots.some(
      (m) => distance(candidate, m, GEN_ASPECT) < diff.minDist * ((candidate.scale + m.scale) / 2)
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
      scale: randRange(diff.scaleMin, diff.scaleMax),
      rotation: randRange(-0.3, 0.3),
      flip: Math.random() < 0.5,
    });
  }

  const clutter: ClutterItem[] = Array.from({ length: diff.clutterCount }, () => randomClutterItem(theme));

  const occluders: ClutterItem[] = [];
  for (const m of mascots) {
    if (Math.random() < diff.occluderChance) {
      occluders.push(
        randomClutterItem(theme, {
          xFrac: m.xFrac + randRange(-0.03, 0.03),
          yFrac: m.yFrac + randRange(0.01, 0.05),
          size: randRange(0.04, 0.075) * m.scale,
        })
      );
    }
    if (Math.random() < diff.secondOccluderChance) {
      occluders.push(
        randomClutterItem(theme, {
          xFrac: m.xFrac + randRange(-0.045, 0.045),
          yFrac: m.yFrac + randRange(-0.045, 0.02),
          size: randRange(0.035, 0.06) * m.scale,
        })
      );
    }
  }

  const background: BackgroundElement[] = [
    { kind: "sun", xFrac: 0.08, yFrac: 0.1, size: 0.11, colorA: theme.sunColor, colorB: theme.sunColor },
    {
      kind: "cloud",
      xFrac: randRange(0.25, 0.38),
      yFrac: randRange(0.07, 0.14),
      size: randRange(0.09, 0.12),
      colorA: theme.cloudColor,
      colorB: theme.cloudColor,
    },
    {
      kind: "cloud",
      xFrac: randRange(0.55, 0.68),
      yFrac: randRange(0.05, 0.12),
      size: randRange(0.07, 0.1),
      colorA: theme.cloudColor,
      colorB: theme.cloudColor,
    },
    { kind: "hill", xFrac: 0.14, yFrac: 0.28, size: 0.24, colorA: theme.hillBase, colorB: theme.hillTop },
  ];

  if (theme.name === "beach") {
    background.push(
      { kind: "lighthouse", xFrac: 0.93, yFrac: 0.18, size: 0.16, colorA: "#ffffff", colorB: "#c0392b" },
      {
        kind: "boat",
        xFrac: randRange(0.55, 0.72),
        yFrac: 0.24,
        size: 0.15,
        colorA: "#ffffff",
        colorB: "#33475b",
      }
    );
  } else {
    const treeGreen = theme.name === "snow" ? pick(SNOW_TREE_GREENS) : pick(TREE_GREENS);
    background.push(
      { kind: "bgTree", xFrac: randRange(0.6, 0.75), yFrac: 0.24, size: 0.16, colorA: treeGreen, colorB: "#7a4a2b" },
      { kind: "bgTree", xFrac: randRange(0.82, 0.93), yFrac: 0.26, size: 0.13, colorA: treeGreen, colorB: "#7a4a2b" }
    );
  }

  return {
    themeName: theme.name,
    skyTop: theme.skyTop,
    skyBottom: theme.skyBottom,
    midBand: theme.midBand,
    groundColor: theme.groundColor,
    background,
    clutter,
    occluders,
    mascots,
  };
}

// Matches the visual half-size of the drawn mascot, plus generous forgiveness for touch taps.
export function hitRadiusFrac(scale: number): number {
  return (MASCOT_SIZE_FRAC * scale) / 2 + 0.035;
}
