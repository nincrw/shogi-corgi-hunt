import type { BackgroundElement, ClutterItem, Scene } from "./sceneGenerator";

export const SKY_FRAC = 0.3;

export function drawSceneBackdrop(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  scene: Pick<Scene, "skyTop" | "skyBottom" | "midBand" | "groundColor">
) {
  const skyH = height * SKY_FRAC;
  const bandH = scene.midBand ? height * scene.midBand.heightFrac : 0;
  const minSide = Math.min(width, height);

  const sky = ctx.createLinearGradient(0, 0, 0, skyH);
  sky.addColorStop(0, scene.skyTop);
  sky.addColorStop(1, scene.skyBottom);
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, width, skyH);

  if (scene.midBand) {
    const band = ctx.createLinearGradient(0, skyH, 0, skyH + bandH);
    band.addColorStop(0, scene.midBand.top);
    band.addColorStop(1, scene.midBand.bottom);
    ctx.fillStyle = band;
    ctx.fillRect(0, skyH, width, bandH);
  }

  ctx.fillStyle = scene.groundColor;
  ctx.fillRect(0, skyH + bandH, width, height - (skyH + bandH));

  if (scene.midBand) {
    ctx.strokeStyle = "rgba(255,255,255,0.55)";
    ctx.lineWidth = Math.max(2, minSide * 0.008);
    ctx.beginPath();
    const shoreY = skyH + bandH;
    ctx.moveTo(0, shoreY);
    for (let x = 0; x <= width; x += width / 12) {
      ctx.lineTo(x, shoreY + Math.sin(x * 0.03) * minSide * 0.012);
    }
    ctx.stroke();
  }
}

function withTransform(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  rotation: number,
  flip: boolean,
  draw: () => void
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rotation);
  if (flip) ctx.scale(-1, 1);
  draw();
  ctx.restore();
}

export function drawBackgroundElement(
  ctx: CanvasRenderingContext2D,
  el: BackgroundElement,
  width: number,
  height: number,
  minSide: number
) {
  const x = el.xFrac * width;
  const y = el.yFrac * height;
  const r = el.size * minSide;

  withTransform(ctx, x, y, 0, false, () => {
    switch (el.kind) {
      case "sun": {
        ctx.fillStyle = el.colorA;
        ctx.beginPath();
        ctx.arc(0, 0, r * 0.55, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = el.colorA;
        ctx.lineWidth = r * 0.12;
        for (let i = 0; i < 8; i++) {
          const a = (i / 8) * Math.PI * 2;
          ctx.beginPath();
          ctx.moveTo(Math.cos(a) * r * 0.72, Math.sin(a) * r * 0.72);
          ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
          ctx.stroke();
        }
        break;
      }
      case "cloud": {
        ctx.fillStyle = el.colorA;
        ctx.strokeStyle = "rgba(0,0,0,0.08)";
        ctx.lineWidth = r * 0.05;
        const puffs: [number, number, number][] = [
          [-r * 0.5, 0, r * 0.5],
          [0, -r * 0.22, r * 0.62],
          [r * 0.5, 0.02 * r, r * 0.42],
        ];
        for (const [dx, dy, rr] of puffs) {
          ctx.beginPath();
          ctx.arc(dx, dy, rr, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
        }
        break;
      }
      case "hill": {
        ctx.fillStyle = el.colorA;
        ctx.beginPath();
        ctx.ellipse(0, r * 0.32, r, r * 0.32, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = el.colorB;
        ctx.beginPath();
        ctx.ellipse(0, -r * 0.02, r * 0.72, r * 0.48, 0, Math.PI, Math.PI * 2);
        ctx.fill();
        break;
      }
      case "bgTree": {
        ctx.fillStyle = el.colorB;
        ctx.fillRect(-r * 0.08, -r * 0.1, r * 0.16, r * 0.9);
        ctx.fillStyle = el.colorA;
        ctx.beginPath();
        ctx.arc(-r * 0.28, -r * 0.35, r * 0.42, 0, Math.PI * 2);
        ctx.arc(r * 0.28, -r * 0.35, r * 0.42, 0, Math.PI * 2);
        ctx.arc(0, -r * 0.7, r * 0.5, 0, Math.PI * 2);
        ctx.fill();
        break;
      }
      case "lighthouse": {
        ctx.fillStyle = el.colorA;
        ctx.strokeStyle = el.colorB;
        ctx.lineWidth = r * 0.08;
        ctx.beginPath();
        ctx.moveTo(-r * 0.2, r);
        ctx.lineTo(-r * 0.13, -r * 0.55);
        ctx.lineTo(r * 0.13, -r * 0.55);
        ctx.lineTo(r * 0.2, r);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = el.colorB;
        ctx.fillRect(-r * 0.16, r * 0.15, r * 0.32, r * 0.16);
        ctx.beginPath();
        ctx.moveTo(-r * 0.16, -r * 0.55);
        ctx.lineTo(0, -r * 0.78);
        ctx.lineTo(r * 0.16, -r * 0.55);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = "#ffe999";
        ctx.beginPath();
        ctx.arc(0, -r * 0.68, r * 0.09, 0, Math.PI * 2);
        ctx.fill();
        break;
      }
      case "boat": {
        ctx.fillStyle = el.colorA;
        ctx.strokeStyle = el.colorB;
        ctx.lineWidth = r * 0.07;
        ctx.beginPath();
        ctx.moveTo(-r, r * 0.28);
        ctx.lineTo(r, r * 0.28);
        ctx.lineTo(r * 0.68, r * 0.55);
        ctx.lineTo(-r * 0.68, r * 0.55);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.strokeStyle = "#8a5a34";
        ctx.lineWidth = r * 0.05;
        ctx.beginPath();
        ctx.moveTo(0, r * 0.28);
        ctx.lineTo(0, -r);
        ctx.stroke();
        ctx.fillStyle = "#ecf0f1";
        ctx.beginPath();
        ctx.moveTo(0, -r);
        ctx.lineTo(r * 0.7, r * 0.18);
        ctx.lineTo(0, r * 0.18);
        ctx.closePath();
        ctx.fill();
        break;
      }
    }
  });
}

function starPath(ctx: CanvasRenderingContext2D, r: number, points = 5) {
  ctx.beginPath();
  for (let i = 0; i < points * 2; i++) {
    const rad = i % 2 === 0 ? r : r * 0.45;
    const ang = (i / (points * 2)) * Math.PI * 2 - Math.PI / 2;
    const x = Math.cos(ang) * rad;
    const y = Math.sin(ang) * rad;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
}

export function drawClutterItem(
  ctx: CanvasRenderingContext2D,
  item: ClutterItem,
  width: number,
  height: number,
  minSide: number
) {
  const x = item.xFrac * width;
  const y = item.yFrac * height;
  const r = item.size * minSide;

  withTransform(ctx, x, y, item.rotation, item.flip, () => {
    ctx.lineWidth = Math.max(1, r * 0.07);
    ctx.strokeStyle = "rgba(0,0,0,0.25)";

    switch (item.kind) {
      case "person": {
        const headR = r * 0.32;
        ctx.fillStyle = item.colorC;
        ctx.beginPath();
        ctx.roundRect(-r * 0.3, -r * 0.05, r * 0.6, r * 0.7, r * 0.15);
        ctx.fill();
        ctx.stroke();
        ctx.strokeStyle = item.colorA;
        ctx.lineWidth = r * 0.14;
        ctx.beginPath();
        ctx.moveTo(-r * 0.12, r * 0.6);
        ctx.lineTo(-r * 0.18, r * 0.98);
        ctx.moveTo(r * 0.12, r * 0.6);
        ctx.lineTo(r * 0.18, r * 0.98);
        ctx.stroke();
        ctx.fillStyle = item.colorA;
        ctx.strokeStyle = "rgba(0,0,0,0.25)";
        ctx.lineWidth = Math.max(1, r * 0.06);
        ctx.beginPath();
        ctx.arc(0, -r * 0.35, headR, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = item.colorB;
        ctx.beginPath();
        ctx.arc(0, -r * 0.48, headR * 0.95, Math.PI, Math.PI * 2);
        ctx.fill();
        break;
      }
      case "beachBall": {
        const slices = 6;
        for (let i = 0; i < slices; i++) {
          ctx.fillStyle = i % 2 === 0 ? item.colorA : item.colorB;
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.arc(0, 0, r, (i / slices) * Math.PI * 2, ((i + 1) / slices) * Math.PI * 2);
          ctx.closePath();
          ctx.fill();
        }
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.stroke();
        break;
      }
      case "umbrella": {
        ctx.fillStyle = item.colorA;
        ctx.beginPath();
        ctx.arc(0, 0, r, Math.PI, 0);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = item.colorB;
        for (let i = 0; i < 4; i += 2) {
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.arc(0, 0, r, Math.PI + (i / 4) * Math.PI, Math.PI + ((i + 1) / 4) * Math.PI);
          ctx.closePath();
          ctx.fill();
        }
        ctx.strokeStyle = "rgba(0,0,0,0.35)";
        ctx.lineWidth = r * 0.08;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(0, r * 1.1);
        ctx.stroke();
        break;
      }
      case "starfish": {
        ctx.fillStyle = item.colorA;
        starPath(ctx, r);
        ctx.fill();
        ctx.stroke();
        break;
      }
      case "shell": {
        ctx.fillStyle = item.colorA;
        ctx.beginPath();
        ctx.arc(0, 0, r, Math.PI, 0);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.strokeStyle = item.colorB;
        ctx.lineWidth = r * 0.09;
        for (let i = 1; i < 5; i++) {
          const ang = Math.PI + (i / 5) * Math.PI;
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(Math.cos(ang) * r, Math.sin(ang) * r);
          ctx.stroke();
        }
        break;
      }
      case "crab": {
        ctx.fillStyle = item.colorA;
        ctx.beginPath();
        ctx.ellipse(0, 0, r, r * 0.62, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(-r * 0.85, -r * 0.28, r * 0.26, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(r * 0.85, -r * 0.28, r * 0.26, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = item.colorA;
        ctx.lineWidth = r * 0.09;
        for (const side of [-1, 1]) {
          for (let j = 0; j < 3; j++) {
            ctx.beginPath();
            ctx.moveTo(side * r * 0.45, r * 0.35 + j * r * 0.14);
            ctx.lineTo(side * r * 0.85, r * 0.55 + j * r * 0.14);
            ctx.stroke();
          }
        }
        break;
      }
      case "sandcastle": {
        ctx.fillStyle = item.colorA;
        ctx.strokeStyle = "rgba(0,0,0,0.3)";
        ctx.beginPath();
        ctx.roundRect(-r * 0.7, -r * 0.2, r * 1.4, r * 1.0, r * 0.1);
        ctx.fill();
        ctx.stroke();
        ctx.beginPath();
        ctx.roundRect(-r * 0.4, -r * 0.7, r * 0.8, r * 0.6, r * 0.08);
        ctx.fill();
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(-r * 0.4, -r * 0.7);
        ctx.lineTo(-r * 0.25, -r * 0.95);
        ctx.lineTo(-r * 0.1, -r * 0.7);
        ctx.closePath();
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(r * 0.1, -r * 0.7);
        ctx.lineTo(r * 0.25, -r * 0.95);
        ctx.lineTo(r * 0.4, -r * 0.7);
        ctx.closePath();
        ctx.fill();
        break;
      }
      case "seaweed": {
        ctx.strokeStyle = item.colorA;
        ctx.lineWidth = r * 0.2;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(0, r);
        ctx.quadraticCurveTo(r * 0.6, r * 0.2, -r * 0.3, -r * 0.4);
        ctx.quadraticCurveTo(-r * 0.8, -r * 0.9, r * 0.2, -r);
        ctx.stroke();
        break;
      }
      case "towel": {
        ctx.fillStyle = item.colorA;
        ctx.beginPath();
        ctx.roundRect(-r, -r * 0.6, r * 2, r * 1.2, r * 0.15);
        ctx.fill();
        ctx.strokeStyle = "rgba(0,0,0,0.2)";
        ctx.lineWidth = r * 0.05;
        ctx.stroke();
        ctx.fillStyle = item.colorB;
        for (let i = -2; i <= 2; i++) {
          ctx.fillRect(i * r * 0.35 - r * 0.08, -r * 0.6, r * 0.16, r * 1.2);
        }
        break;
      }
      case "bucket": {
        ctx.fillStyle = item.colorA;
        ctx.beginPath();
        ctx.moveTo(-r * 0.6, -r * 0.5);
        ctx.lineTo(r * 0.6, -r * 0.5);
        ctx.lineTo(r * 0.45, r * 0.6);
        ctx.lineTo(-r * 0.45, r * 0.6);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.beginPath();
        ctx.ellipse(0, -r * 0.5, r * 0.6, r * 0.15, 0, 0, Math.PI * 2);
        ctx.stroke();
        break;
      }
      case "fish": {
        ctx.fillStyle = item.colorA;
        ctx.beginPath();
        ctx.ellipse(0, 0, r, r * 0.55, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(-r * 0.9, 0);
        ctx.lineTo(-r * 1.4, -r * 0.4);
        ctx.lineTo(-r * 1.4, r * 0.4);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = "rgba(0,0,0,0.55)";
        ctx.beginPath();
        ctx.arc(r * 0.5, -r * 0.1, r * 0.08, 0, Math.PI * 2);
        ctx.fill();
        break;
      }
      case "flag": {
        ctx.strokeStyle = "#7a7a7a";
        ctx.lineWidth = r * 0.1;
        ctx.beginPath();
        ctx.moveTo(0, r);
        ctx.lineTo(0, -r);
        ctx.stroke();
        ctx.fillStyle = item.colorA;
        ctx.beginPath();
        ctx.moveTo(0, -r);
        ctx.lineTo(r * 0.9, -r * 0.7);
        ctx.lineTo(0, -r * 0.4);
        ctx.closePath();
        ctx.fill();
        break;
      }
      case "tree": {
        ctx.fillStyle = item.colorB;
        ctx.fillRect(-r * 0.1, -r * 0.1, r * 0.2, r * 0.9);
        ctx.fillStyle = item.colorA;
        ctx.strokeStyle = "rgba(0,0,0,0.2)";
        ctx.lineWidth = r * 0.05;
        ctx.beginPath();
        ctx.arc(-r * 0.32, -r * 0.35, r * 0.4, 0, Math.PI * 2);
        ctx.arc(r * 0.32, -r * 0.35, r * 0.4, 0, Math.PI * 2);
        ctx.arc(0, -r * 0.68, r * 0.48, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        break;
      }
      case "snowman": {
        ctx.fillStyle = "#ffffff";
        ctx.strokeStyle = "rgba(0,0,0,0.2)";
        ctx.lineWidth = r * 0.05;
        ctx.beginPath();
        ctx.arc(0, r * 0.45, r * 0.55, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(0, -r * 0.15, r * 0.4, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(0, -r * 0.6, r * 0.26, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = item.colorA;
        ctx.fillRect(-r * 0.32, -r * 0.72, r * 0.64, r * 0.14);
        ctx.fillStyle = "#f97316";
        ctx.beginPath();
        ctx.moveTo(0, -r * 0.62);
        ctx.lineTo(r * 0.28, -r * 0.58);
        ctx.lineTo(0, -r * 0.54);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = "rgba(0,0,0,0.7)";
        ctx.beginPath();
        ctx.arc(-r * 0.1, -r * 0.63, r * 0.04, 0, Math.PI * 2);
        ctx.arc(r * 0.1, -r * 0.63, r * 0.04, 0, Math.PI * 2);
        ctx.arc(0, -r * 0.1, r * 0.04, 0, Math.PI * 2);
        ctx.arc(0, r * 0.05, r * 0.04, 0, Math.PI * 2);
        ctx.arc(0, r * 0.2, r * 0.04, 0, Math.PI * 2);
        ctx.fill();
        break;
      }
    }
  });
}
