"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { generateScene, hitRadiusFrac, MASCOT_COUNT, MASCOT_SIZE_FRAC, type Scene } from "@/lib/sceneGenerator";
import { drawBackgroundElement, drawClutterItem, drawSceneBackdrop } from "@/lib/sceneDrawing";

const GAME_DURATION_MS = 90 * 1000;
const MAX_NAME_LENGTH = 24;

type Phase = "start" | "playing" | "ended";
type LeaderboardEntry = { winner_name: string; score: number; created_at: string };
type FoundEffect = { x: number; y: number; createdAt: number };

function formatTime(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function HiddenObjectGame() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mascotImgRef = useRef<HTMLImageElement | null>(null);
  const sceneRef = useRef<Scene>(generateScene(1));
  const effectsRef = useRef<FoundEffect[]>([]);
  const endAtRef = useRef<number>(0);
  const rafRef = useRef<number | null>(null);
  const scoreRef = useRef(0);
  const sceneNumberRef = useRef(1);

  const [phase, setPhase] = useState<Phase>("start");
  const [score, setScore] = useState(0);
  const [timeLeftSec, setTimeLeftSec] = useState(GAME_DURATION_MS / 1000);
  const [foundInScene, setFoundInScene] = useState(0);
  const [sceneNumber, setSceneNumber] = useState(1);
  const [toast, setToast] = useState<string | null>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });

  const [username, setUsername] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[] | null>(null);

  useEffect(() => {
    const img = new Image();
    img.src = "/Shogi-Corgi.png";
    mascotImgRef.current = img;
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const update = () => setCanvasSize({ width: el.clientWidth, height: el.clientHeight });
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const { width, height } = canvasSize;
    if (!canvas || width === 0 || height === 0) return;
    const dpr = window.devicePixelRatio || 1;
    const targetW = Math.round(width * dpr);
    const targetH = Math.round(height * dpr);
    if (canvas.width !== targetW || canvas.height !== targetH) {
      canvas.width = targetW;
      canvas.height = targetH;
    }
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const scene = sceneRef.current;
    const minSide = Math.min(width, height);

    drawSceneBackdrop(ctx, width, height, scene);
    for (const el of scene.background) {
      drawBackgroundElement(ctx, el, width, height, minSide);
    }
    for (const item of scene.clutter) {
      drawClutterItem(ctx, item, width, height, minSide);
    }

    const img = mascotImgRef.current;
    if (img && img.complete && img.naturalWidth > 0) {
      for (const m of scene.mascots) {
        if (m.found) continue;
        const size = MASCOT_SIZE_FRAC * minSide * m.scale;
        const x = m.xFrac * width;
        const y = m.yFrac * height;
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(m.rotation);
        if (m.flip) ctx.scale(-1, 1);
        ctx.drawImage(img, -size / 2, -size / 2, size, size);
        ctx.restore();
      }
    }

    for (const occluder of scene.occluders) {
      drawClutterItem(ctx, occluder, width, height, minSide);
    }

    const now = performance.now();
    effectsRef.current = effectsRef.current.filter((e) => now - e.createdAt < 500);
    for (const e of effectsRef.current) {
      const age = (now - e.createdAt) / 500;
      ctx.save();
      ctx.globalAlpha = Math.max(0, 1 - age);
      ctx.strokeStyle = "#22c55e";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(e.x, e.y, 18 + age * 36, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
  }, [canvasSize]);

  const fetchLeaderboard = useCallback(async () => {
    try {
      const res = await fetch("/api/scores");
      const data = await res.json();
      setLeaderboard(Array.isArray(data.scores) ? data.scores : []);
    } catch {
      setLeaderboard([]);
    }
  }, []);

  const endGame = useCallback(() => {
    setPhase("ended");
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  useEffect(() => {
    if (phase !== "playing") return;
    let active = true;
    const loop = () => {
      if (!active) return;
      const now = performance.now();
      const remainingMs = Math.max(0, endAtRef.current - now);
      const remainingSec = Math.ceil(remainingMs / 1000);
      setTimeLeftSec((prev) => (prev !== remainingSec ? remainingSec : prev));
      draw();
      if (remainingMs <= 0) {
        endGame();
        return;
      }
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => {
      active = false;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [phase, draw, endGame]);

  const startGame = useCallback(() => {
    sceneNumberRef.current = 1;
    sceneRef.current = generateScene(1);
    effectsRef.current = [];
    scoreRef.current = 0;
    setScore(0);
    setFoundInScene(0);
    setSceneNumber(1);
    setToast(null);
    setSubmitted(false);
    setSubmitError(null);
    setUsername("");
    setLeaderboard(null);
    endAtRef.current = performance.now() + GAME_DURATION_MS;
    setTimeLeftSec(GAME_DURATION_MS / 1000);
    setPhase("playing");

    const el = containerRef.current as (HTMLDivElement & { requestFullscreen?: () => Promise<void> }) | null;
    el?.requestFullscreen?.().catch(() => {});
    const orientation = screen.orientation as (ScreenOrientation & { lock?: (o: string) => Promise<void> }) | undefined;
    orientation?.lock?.("landscape").catch(() => {});
  }, []);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (phase !== "playing") return;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;
      const xFrac = (e.clientX - rect.left) / rect.width;
      const yFrac = (e.clientY - rect.top) / rect.height;

      const scene = sceneRef.current;
      let closest: { m: Scene["mascots"][number]; dist: number } | null = null;
      for (const m of scene.mascots) {
        if (m.found) continue;
        const dx = (m.xFrac - xFrac) * rect.width;
        const dy = (m.yFrac - yFrac) * rect.height;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const rPx = hitRadiusFrac(m.scale) * Math.min(rect.width, rect.height);
        if (dist <= rPx && (!closest || dist < closest.dist)) {
          closest = { m, dist };
        }
      }
      if (!closest) return;

      closest.m.found = true;
      effectsRef.current.push({
        x: xFrac * rect.width,
        y: yFrac * rect.height,
        createdAt: performance.now(),
      });
      scoreRef.current += 1;
      setScore(scoreRef.current);
      setFoundInScene((n) => n + 1);

      const remaining = scene.mascots.filter((mm) => !mm.found).length;
      if (remaining === 0) {
        sceneNumberRef.current += 1;
        sceneRef.current = generateScene(sceneNumberRef.current);
        setFoundInScene(0);
        setSceneNumber(sceneNumberRef.current);
        setToast("New scene!");
        window.setTimeout(() => setToast(null), 900);
      }
    },
    [phase]
  );

  const submitScore = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      const name = username.trim();
      if (!name || submitting) return;
      setSubmitting(true);
      setSubmitError(null);
      try {
        const res = await fetch("/api/scores", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ winnerName: name, score: scoreRef.current }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error ?? "Couldn't save your score.");
        }
        setSubmitted(true);
        fetchLeaderboard();
      } catch (err) {
        setSubmitError(err instanceof Error ? err.message : "Couldn't save your score.");
      } finally {
        setSubmitting(false);
      }
    },
    [username, submitting, fetchLeaderboard]
  );

  return (
    <div className="fixed inset-0 flex flex-col bg-black text-white overflow-hidden select-none">
      <div className="portrait:flex landscape:hidden absolute inset-0 z-30 flex-col items-center justify-center gap-4 bg-black/95 px-6 text-center">
        <div className="text-5xl">📱↻</div>
        <p className="text-lg font-semibold">Rotate your phone to landscape</p>
        <p className="text-sm text-white/70">This game is played sideways.</p>
      </div>

      <div ref={containerRef} className="relative flex-1 landscape:flex portrait:hidden">
        <canvas
          ref={canvasRef}
          onPointerDown={handlePointerDown}
          className="absolute inset-0 h-full w-full touch-none"
          style={{ width: "100%", height: "100%" }}
        />

        {phase === "playing" && (
          <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex items-center justify-between px-3 py-2 text-sm font-semibold sm:text-base">
            <span className="rounded-full bg-black/50 px-3 py-1">⏱ {formatTime(timeLeftSec)}</span>
            <span className="rounded-full bg-black/50 px-3 py-1">
              Scene {sceneNumber} · {foundInScene}/{MASCOT_COUNT}
            </span>
            <span className="rounded-full bg-black/50 px-3 py-1">🐕 Score: {score}</span>
          </div>
        )}

        {toast && (
          <div className="pointer-events-none absolute inset-x-0 top-14 z-10 flex justify-center">
            <span className="rounded-full bg-emerald-500/90 px-4 py-1 text-sm font-bold text-white shadow-lg">
              {toast}
            </span>
          </div>
        )}

        {phase === "start" && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-4 bg-black/85 px-6 text-center">
            <h1 className="text-2xl font-bold sm:text-3xl">🐕 Find the Shogi Corgi!</h1>
            <p className="max-w-md text-sm text-white/80 sm:text-base">
              Tap all {MASCOT_COUNT} hidden Shogi Corgi mascots as fast as you can. Clear a scene and a
              new one appears instantly — with a new theme and harder camouflage each time. Keep going
              until the clock hits zero. You have <span className="font-semibold text-white">1:30</span>.
            </p>
            <button
              onClick={startGame}
              className="mt-2 rounded-full bg-orange-500 px-8 py-3 text-lg font-bold text-white shadow-lg active:scale-95"
            >
              Start
            </button>
          </div>
        )}

        {phase === "ended" && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-4 overflow-y-auto bg-black/90 px-6 py-6 text-center">
            <h2 className="text-2xl font-bold sm:text-3xl">⏰ Time&apos;s up!</h2>
            <p className="text-lg">
              You found <span className="font-bold text-orange-400">{score}</span> mascots.
            </p>

            {!submitted ? (
              <form onSubmit={submitScore} className="flex w-full max-w-xs flex-col gap-2">
                <input
                  autoFocus
                  value={username}
                  onChange={(e) => setUsername(e.target.value.slice(0, MAX_NAME_LENGTH))}
                  placeholder="Enter your name"
                  className="rounded-lg bg-white/10 px-4 py-2 text-center text-white placeholder-white/50 outline-none ring-1 ring-white/20 focus:ring-orange-400"
                  maxLength={MAX_NAME_LENGTH}
                />
                {submitError && <p className="text-sm text-red-400">{submitError}</p>}
                <button
                  type="submit"
                  disabled={!username.trim() || submitting}
                  className="rounded-full bg-orange-500 px-6 py-2 font-bold text-white shadow disabled:opacity-50"
                >
                  {submitting ? "Saving..." : "Save score"}
                </button>
              </form>
            ) : (
              <p className="text-sm text-emerald-400">Score saved!</p>
            )}

            {leaderboard && (
              <div className="w-full max-w-xs rounded-lg bg-white/5 p-3 text-left">
                <p className="mb-2 text-center text-sm font-semibold text-white/70">🏆 Leaderboard</p>
                <ol className="flex flex-col gap-1 text-sm">
                  {leaderboard.length === 0 && <li className="text-white/50">No scores yet.</li>}
                  {leaderboard.map((entry, i) => (
                    <li key={`${entry.winner_name}-${entry.created_at}`} className="flex justify-between gap-2">
                      <span className="truncate">
                        {i + 1}. {entry.winner_name}
                      </span>
                      <span className="font-semibold text-orange-400">{entry.score}</span>
                    </li>
                  ))}
                </ol>
              </div>
            )}

            <button
              onClick={startGame}
              className="mt-2 rounded-full bg-white/10 px-6 py-2 font-semibold text-white ring-1 ring-white/30"
            >
              Play again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
