export type DecoyShape = {
  xFrac: number;
  yFrac: number;
  size: number;
  rotation: number;
  color: string;
  kind: "circle" | "triangle" | "square" | "blob";
};

export type MascotSpot = {
  id: string;
  xFrac: number;
  yFrac: number;
  scale: number;
  rotation: number;
  found: boolean;
};

export type Scene = {
  decoys: DecoyShape[];
  mascots: MascotSpot[];
  background: string;
};

export const MASCOT_COUNT = 15;
export const MASCOT_SIZE_FRAC = 0.22; // full drawn width, as a fraction of min(canvasWidth, canvasHeight)
const DECOY_COUNT = 60;
const GEN_ASPECT = 16 / 9;
const MIN_MASCOT_DIST = 0.19;

const DECOY_COLORS = [
  "#f97316",
  "#facc15",
  "#4ade80",
  "#38bdf8",
  "#a78bfa",
  "#fb7185",
  "#2dd4bf",
  "#f472b6",
  "#fbbf24",
  "#60a5fa",
];

const DECOY_KINDS: DecoyShape["kind"][] = ["circle", "triangle", "square", "blob"];

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

export function generateScene(): Scene {
  const mascots: MascotSpot[] = [];

  let attempts = 0;
  while (mascots.length < MASCOT_COUNT && attempts < 3000) {
    attempts++;
    const candidate = {
      xFrac: randRange(0.07, 0.93),
      yFrac: randRange(0.12, 0.9),
      scale: randRange(0.55, 1.05),
      rotation: randRange(-0.35, 0.35),
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
      xFrac: randRange(0.07, 0.93),
      yFrac: randRange(0.12, 0.9),
      scale: randRange(0.55, 1.05),
      rotation: randRange(-0.35, 0.35),
    });
  }

  const decoys: DecoyShape[] = Array.from({ length: DECOY_COUNT }, () => ({
    xFrac: randRange(0.02, 0.98),
    yFrac: randRange(0.04, 0.98),
    size: randRange(0.02, 0.065),
    rotation: randRange(0, Math.PI * 2),
    color: pick(DECOY_COLORS),
    kind: pick(DECOY_KINDS),
  }));

  const hue = Math.floor(randRange(0, 360));
  const background = `hsl(${hue} 65% 93%)`;

  return { decoys, mascots, background };
}

// Matches the visual half-size of the drawn mascot, plus generous forgiveness for touch taps.
export function hitRadiusFrac(scale: number): number {
  return (MASCOT_SIZE_FRAC * scale) / 2 + 0.035;
}
