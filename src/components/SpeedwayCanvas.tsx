import React, { useEffect, useRef } from 'react';
import { RacerLiveState, TeamId } from '../types';
import { getTeamMeta } from '../data/shop';
import {
  drawBossCar,
  drawRacerCar,
  drawTrailParticle,
  spawnTrailParticle,
  TrailParticle,
} from './CarRenderer';

interface SpeedwayCanvasProps {
  myState: RacerLiveState;
  opponentState: RacerLiveState;
  totalLaps: number | null; // null in timed sprint
  myTeam: TeamId;
  turboBannerTeam: TeamId | null;
  trackId?: string;
  bossProgress?: number | null;
}

// Deterministic pseudo-random helper for crisp, flicker-free track scenery
function seeded(i: number, salt: number): number {
  const x = Math.sin(i * 127.1 + salt * 311.7) * 43758.5453;
  return x - Math.floor(x);
}

const CANDY_SPRINKLES = Array.from({ length: 68 }, (_, i) => ({
  u: seeded(i, 1),
  v: seeded(i, 2),
  angle: seeded(i, 3) * Math.PI,
  color: ['#f472b6', '#34d399', '#facc15', '#38bdf8', '#c084fc', '#ffffff'][
    i % 6
  ],
}));

const SNOWFLAKES = Array.from({ length: 56 }, (_, i) => ({
  u: seeded(i, 11),
  v: seeded(i, 12),
  r: 1.4 + seeded(i, 13) * 2.4,
  speed: 0.015 + seeded(i, 14) * 0.025,
  phase: seeded(i, 15) * Math.PI * 2,
}));

const SPACE_STARS = Array.from({ length: 90 }, (_, i) => ({
  u: seeded(i, 21),
  v: seeded(i, 22),
  r: 0.8 + seeded(i, 23) * 1.9,
  phase: seeded(i, 24) * Math.PI * 2,
  speed: 2 + seeded(i, 25) * 3.5,
  color: ['#ffffff', '#e0e7ff', '#fde68a', '#f0abfc', '#bae6fd'][i % 5],
}));

const BEACH_SPECKLES = Array.from({ length: 48 }, (_, i) => ({
  u: seeded(i, 31),
  v: seeded(i, 32),
  r: 1.2 + seeded(i, 33) * 1.8,
  color: i % 5 === 0 ? '#fb7185' : i % 3 === 0 ? '#fef3c7' : '#d97706',
}));

/**
 * Computes (x, y, angle) along a stadium/oval speedway track for progress in laps (0..N).
 * Lap starts at bottom straightaway center (heading right -> counter-clockwise).
 */
function getTrackPoint(
  laps: number,
  cx: number,
  cy: number,
  straightHalf: number,
  radius: number
): { x: number; y: number; angle: number } {
  const frac = ((laps % 1) + 1) % 1;
  const straightLen = straightHalf * 2;
  const arcLen = Math.PI * radius;
  const perimeter = straightLen * 2 + arcLen * 2;

  // Offset so 0.0 is the checkered start/finish line on the bottom straightaway!
  let d = (frac * perimeter + straightHalf) % perimeter;

  // 1. Bottom straight (left -> right)
  if (d < straightLen) {
    return {
      x: cx - straightHalf + d,
      y: cy + radius,
      angle: 0,
    };
  }
  d -= straightLen;

  // 2. Right semicircle (bottom -> top, counter-clockwise)
  if (d < arcLen) {
    const theta = Math.PI / 2 - (d / arcLen) * Math.PI;
    return {
      x: cx + straightHalf + Math.cos(theta) * radius,
      y: cy + Math.sin(theta) * radius,
      angle: theta - Math.PI / 2,
    };
  }
  d -= arcLen;

  // 3. Top straight (right -> left)
  if (d < straightLen) {
    return {
      x: cx + straightHalf - d,
      y: cy - radius,
      angle: Math.PI,
    };
  }
  d -= straightLen;

  // 4. Left semicircle (top -> bottom, counter-clockwise)
  const theta = -Math.PI / 2 - (d / arcLen) * Math.PI;
  return {
    x: cx - straightHalf + Math.cos(theta) * radius,
    y: cy + Math.sin(theta) * radius,
    angle: theta - Math.PI / 2,
  };
}

export const SpeedwayCanvas: React.FC<SpeedwayCanvasProps> = ({
  myState,
  opponentState,
  totalLaps,
  myTeam,
  turboBannerTeam,
  trackId = 'track-sunny',
  bossProgress = null,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const myStateRef = useRef(myState);
  const oppStateRef = useRef(opponentState);
  const trackIdRef = useRef(trackId);
  const bossProgressRef = useRef<number | null>(bossProgress);
  const bossWasActiveRef = useRef(bossProgress != null);
  const smoothMyProg = useRef(myState.progress);
  const smoothOppProg = useRef(opponentState.progress);
  const smoothBossProg = useRef(bossProgress ?? 0);
  const particlesRef = useRef<TrailParticle[]>([]);

  myStateRef.current = myState;
  oppStateRef.current = opponentState;
  trackIdRef.current = trackId;
  bossProgressRef.current = bossProgress;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let rafId = 0;
    let lastTime = performance.now();
    let particleTimer = 0;

    const render = (now: number) => {
      const dt = Math.min(0.05, (now - lastTime) / 1000);
      lastTime = now;

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas.getBoundingClientRect();
      const width = Math.max(320, rect.width);
      const height = Math.max(180, rect.height);

      if (
        canvas.width !== Math.round(width * dpr) ||
        canvas.height !== Math.round(height * dpr)
      ) {
        canvas.width = Math.round(width * dpr);
        canvas.height = Math.round(height * dpr);
      }

      ctx.save();
      ctx.scale(dpr, dpr);

      // Smoothly interpolate car progress for silky 60fps racing!
      const m = myStateRef.current;
      const o = oppStateRef.current;
      const activeTrackId = trackIdRef.current || 'track-sunny';
      const bp = bossProgressRef.current;

      smoothMyProg.current += (m.progress - smoothMyProg.current) * Math.min(1, dt * 8);
      smoothOppProg.current += (o.progress - smoothOppProg.current) * Math.min(1, dt * 8);

      if (bp != null) {
        if (!bossWasActiveRef.current) {
          smoothBossProg.current = bp;
          bossWasActiveRef.current = true;
        } else {
          smoothBossProg.current += (bp - smoothBossProg.current) * Math.min(1, dt * 8);
        }
      } else {
        bossWasActiveRef.current = false;
      }

      // Track geometry
      const cx = width / 2;
      const cy = height / 2 + 4;
      const trackWidth = Math.min(height * 0.27, 68);
      const outerRadius = Math.min(height * 0.38, width * 0.24);
      const straightHalf = Math.max(30, width * 0.44 - outerRadius);

      // Helper to trace stadium path
      const traceOval = (r: number) => {
        ctx.beginPath();
        ctx.moveTo(cx - straightHalf, cy - r);
        ctx.lineTo(cx + straightHalf, cy - r);
        ctx.arc(cx + straightHalf, cy, r, -Math.PI / 2, Math.PI / 2);
        ctx.lineTo(cx - straightHalf, cy + r);
        ctx.arc(cx - straightHalf, cy, r, Math.PI / 2, (Math.PI * 3) / 2);
        ctx.closePath();
      };

      // ==================== 1. TRACK THEME BACKGROUND ====================
      if (activeTrackId === 'track-candy') {
        // Pastel pink/mint frosting background
        const candyGrad = ctx.createLinearGradient(0, 0, width, height);
        candyGrad.addColorStop(0, '#fbcfe8');
        candyGrad.addColorStop(0.5, '#f9a8d4');
        candyGrad.addColorStop(1, '#a7f3d0');
        ctx.fillStyle = candyGrad;
        ctx.fillRect(0, 0, width, height);

        // Soft diagonal frosting stripes
        ctx.fillStyle = 'rgba(255, 255, 255, 0.16)';
        for (let x = -height; x < width + height; x += 42) {
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x + 18, 0);
          ctx.lineTo(x + 18 - height * 0.35, height);
          ctx.lineTo(x - height * 0.35, height);
          ctx.closePath();
          ctx.fill();
        }

        // Scattered pastel sprinkles
        for (const s of CANDY_SPRINKLES) {
          ctx.save();
          ctx.translate(s.u * width, s.v * height);
          ctx.rotate(s.angle);
          ctx.fillStyle = s.color;
          ctx.beginPath();
          ctx.roundRect(-4.5, -1.7, 9, 3.4, 1.7);
          ctx.fill();
          ctx.restore();
        }
      } else if (activeTrackId === 'track-beach') {
        // Sparkling turquoise ocean border
        const oceanGrad = ctx.createLinearGradient(0, 0, 0, height);
        oceanGrad.addColorStop(0, '#06b6d4');
        oceanGrad.addColorStop(0.5, '#0ea5e9');
        oceanGrad.addColorStop(1, '#0284c7');
        ctx.fillStyle = oceanGrad;
        ctx.fillRect(0, 0, width, height);

        // Gentle ocean wave shimmer lines
        ctx.save();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.24)';
        ctx.lineWidth = 2;
        const waveShift = Math.sin(now / 700) * 8;
        for (let y = 14; y < height; y += 26) {
          ctx.beginPath();
          for (let x = -10; x < width + 20; x += 36) {
            ctx.moveTo(x + waveShift, y);
            ctx.quadraticCurveTo(x + 9 + waveShift, y - 4, x + 18 + waveShift, y);
          }
          ctx.stroke();
        }
        ctx.restore();

        // Outer shoreline foam & warm golden sand bank around the track
        ctx.save();
        traceOval(outerRadius + trackWidth * 0.68);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.42)';
        ctx.fill();
        traceOval(outerRadius + trackWidth * 0.6);
        const sandGrad = ctx.createLinearGradient(0, cy - outerRadius, 0, cy + outerRadius);
        sandGrad.addColorStop(0, '#fef08a');
        sandGrad.addColorStop(1, '#fcd34d');
        ctx.fillStyle = sandGrad;
        ctx.fill();

        // Clip sand speckles & tiny starfish/shells to the sandy beach infield
        traceOval(outerRadius - trackWidth * 0.54);
        ctx.clip();
        for (const sp of BEACH_SPECKLES) {
          ctx.fillStyle = sp.color;
          ctx.globalAlpha = 0.45;
          ctx.beginPath();
          ctx.arc(sp.u * width, sp.v * height, sp.r, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      } else if (activeTrackId === 'track-snow') {
        // Crisp winter snowfield
        const snowGrad = ctx.createLinearGradient(0, 0, 0, height);
        snowGrad.addColorStop(0, '#f0f9ff');
        snowGrad.addColorStop(0.5, '#e0f2fe');
        snowGrad.addColorStop(1, '#bae6fd');
        ctx.fillStyle = snowGrad;
        ctx.fillRect(0, 0, width, height);

        // Subtle blue-white snowdrifts
        ctx.fillStyle = 'rgba(255, 255, 255, 0.52)';
        ctx.beginPath();
        ctx.ellipse(width * 0.2, height * 0.15, width * 0.28, height * 0.18, 0.1, 0, Math.PI * 2);
        ctx.ellipse(width * 0.82, height * 0.86, width * 0.3, height * 0.2, -0.1, 0, Math.PI * 2);
        ctx.ellipse(cx, cy, straightHalf + outerRadius * 0.5, outerRadius * 0.55, 0, 0, Math.PI * 2);
        ctx.fill();

        // Soft drifting snowflakes
        ctx.save();
        for (const fl of SNOWFLAKES) {
          const fy = ((fl.v + (now / 1000) * fl.speed) % 1) * height;
          const fx =
            ((fl.u + Math.sin(now / 1200 + fl.phase) * 0.015 + 1) % 1) * width;
          ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
          ctx.beginPath();
          ctx.arc(fx, fy, fl.r, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      } else if (activeTrackId === 'track-space') {
        // Deep cosmic indigo/purple space
        const spaceGrad = ctx.createLinearGradient(0, 0, width, height);
        spaceGrad.addColorStop(0, '#09051a');
        spaceGrad.addColorStop(0.5, '#1e1b4b');
        spaceGrad.addColorStop(1, '#2e1065');
        ctx.fillStyle = spaceGrad;
        ctx.fillRect(0, 0, width, height);

        // Subtle cosmic nebula glows
        const neb1 = ctx.createRadialGradient(
          width * 0.2,
          height * 0.25,
          6,
          width * 0.2,
          height * 0.25,
          width * 0.3
        );
        neb1.addColorStop(0, 'rgba(168, 85, 247, 0.26)');
        neb1.addColorStop(1, 'rgba(168, 85, 247, 0)');
        ctx.fillStyle = neb1;
        ctx.fillRect(0, 0, width, height);

        const neb2 = ctx.createRadialGradient(
          width * 0.82,
          height * 0.78,
          6,
          width * 0.82,
          height * 0.78,
          width * 0.32
        );
        neb2.addColorStop(0, 'rgba(56, 189, 248, 0.22)');
        neb2.addColorStop(1, 'rgba(56, 189, 248, 0)');
        ctx.fillStyle = neb2;
        ctx.fillRect(0, 0, width, height);

        // Twinkling stars
        ctx.save();
        for (const st of SPACE_STARS) {
          const twinkle = 0.35 + 0.65 * (0.5 + 0.5 * Math.sin((now / 1000) * st.speed + st.phase));
          ctx.globalAlpha = twinkle;
          ctx.fillStyle = st.color;
          ctx.beginPath();
          ctx.arc(st.u * width, st.v * height, st.r, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      } else {
        // Default: 'track-sunny' — vibrant lush green meadow stripes
        const grassGrad = ctx.createLinearGradient(0, 0, 0, height);
        grassGrad.addColorStop(0, '#4ade80');
        grassGrad.addColorStop(1, '#16a34a');
        ctx.fillStyle = grassGrad;
        ctx.fillRect(0, 0, width, height);

        ctx.fillStyle = 'rgba(255,255,255,0.06)';
        for (let x = 0; x < width; x += 36) {
          ctx.fillRect(x, 0, 18, height);
        }
      }

      // ==================== 2. CURBS, ROAD SURFACE & LANE DASHES ====================
      let curbColorA = '#ef4444';
      let curbColorB = '#ffffff';
      let roadColor = '#334155';
      let laneDashColor = 'rgba(255,255,255,0.55)';
      let emblemColor = 'rgba(255, 255, 255, 0.22)';

      if (activeTrackId === 'track-candy') {
        curbColorA = '#ec4899';
        curbColorB = '#ffffff';
        roadColor = '#5c3a21';
        laneDashColor = '#fbcfe8';
        emblemColor = 'rgba(131, 24, 67, 0.26)';
      } else if (activeTrackId === 'track-beach') {
        curbColorA = '#b45309';
        curbColorB = '#fde68a';
        roadColor = '#94a3b8';
        laneDashColor = 'rgba(255, 251, 235, 0.78)';
        emblemColor = 'rgba(146, 64, 14, 0.28)';
      } else if (activeTrackId === 'track-snow') {
        curbColorA = '#ef4444';
        curbColorB = '#ffffff';
        roadColor = '#4b6b8a';
        laneDashColor = 'rgba(224, 242, 254, 0.85)';
        emblemColor = 'rgba(3, 105, 161, 0.26)';
      } else if (activeTrackId === 'track-space') {
        roadColor = '#14132e';
        laneDashColor = 'rgba(192, 132, 252, 0.82)';
        emblemColor = 'rgba(216, 180, 254, 0.3)';
      }

      const makeRainbowGradient = () => {
        const g = ctx.createLinearGradient(
          cx - straightHalf - outerRadius,
          cy - outerRadius,
          cx + straightHalf + outerRadius,
          cy + outerRadius
        );
        g.addColorStop(0, '#f43f5e');
        g.addColorStop(0.2, '#f97316');
        g.addColorStop(0.4, '#facc15');
        g.addColorStop(0.6, '#22c55e');
        g.addColorStop(0.8, '#38bdf8');
        g.addColorStop(1, '#c084fc');
        return g;
      };

      // Outer curb / track edge
      ctx.save();
      traceOval(outerRadius + trackWidth * 0.56);
      if (activeTrackId === 'track-space') {
        const rainbow = makeRainbowGradient();
        ctx.strokeStyle = rainbow;
        ctx.shadowColor = '#a855f7';
        ctx.shadowBlur = 12;
        ctx.lineWidth = 8;
        ctx.stroke();
      } else {
        ctx.strokeStyle = curbColorA;
        ctx.lineWidth = 8;
        ctx.stroke();
        ctx.setLineDash([14, 14]);
        ctx.strokeStyle = curbColorB;
        ctx.lineWidth = 8;
        ctx.stroke();
      }
      ctx.restore();

      // Road surface
      ctx.save();
      traceOval(outerRadius);
      ctx.strokeStyle = roadColor;
      ctx.lineWidth = trackWidth;
      ctx.stroke();

      // Extra surface detail for Snow (icy frost sheen) or Space (starry cosmic speckles)
      if (activeTrackId === 'track-snow') {
        traceOval(outerRadius);
        ctx.strokeStyle = 'rgba(186, 230, 253, 0.18)';
        ctx.lineWidth = trackWidth * 0.72;
        ctx.stroke();
      } else if (activeTrackId === 'track-space') {
        ctx.save();
        traceOval(outerRadius);
        ctx.strokeStyle = 'rgba(139, 92, 246, 0.14)';
        ctx.lineWidth = trackWidth * 0.85;
        ctx.stroke();
        // Faint stardust along the cosmic road
        for (let i = 0; i < 24; i++) {
          const sp = getTrackPoint(
            i / 24 + 0.013,
            cx,
            cy,
            straightHalf,
            outerRadius + (seeded(i, 41) - 0.5) * trackWidth * 0.72
          );
          ctx.fillStyle = i % 2 === 0 ? 'rgba(255,255,255,0.45)' : 'rgba(192,132,252,0.5)';
          ctx.beginPath();
          ctx.arc(sp.x, sp.y, 1.2, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }

      // Center dashed lane divider
      traceOval(outerRadius);
      if (activeTrackId === 'track-candy') {
        // Alternating pink & white lane dashes
        ctx.setLineDash([14, 18]);
        ctx.strokeStyle = '#f9a8d4';
        ctx.lineWidth = 3.5;
        ctx.stroke();
        ctx.lineDashOffset = -16;
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 3.5;
        ctx.stroke();
      } else {
        ctx.setLineDash([16, 14]);
        ctx.strokeStyle = laneDashColor;
        ctx.lineWidth = 3;
        ctx.stroke();
      }
      ctx.restore();

      // Inner curb / track edge
      ctx.save();
      traceOval(outerRadius - trackWidth * 0.54);
      if (activeTrackId === 'track-space') {
        const rainbow = makeRainbowGradient();
        ctx.strokeStyle = rainbow;
        ctx.shadowColor = '#38bdf8';
        ctx.shadowBlur = 10;
        ctx.lineWidth = 6;
        ctx.stroke();
      } else {
        ctx.strokeStyle = curbColorA;
        ctx.lineWidth = 6;
        ctx.stroke();
        ctx.setLineDash([12, 12]);
        ctx.strokeStyle = curbColorB;
        ctx.lineWidth = 6;
        ctx.stroke();
      }
      ctx.restore();

      // Infield emblem
      ctx.save();
      ctx.fillStyle = emblemColor;
      ctx.font = `700 ${Math.max(13, Math.min(20, width * 0.028))}px Fredoka, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('DOGGY vs SLOTHY', cx, cy - 8);
      ctx.font = `700 ${Math.max(11, Math.min(14, width * 0.02))}px Nunito, sans-serif`;
      ctx.fillText(
        bp != null
          ? 'CO-OP VS MEGA-BOT 3000'
          : totalLaps
          ? `${totalLaps}-LAP SPEEDWAY`
          : 'TIMED SPRINT SPEEDWAY',
        cx,
        cy + 12
      );
      ctx.restore();

      // Checkered Start / Finish Line on bottom straightaway
      const sfX = cx;
      const sfTop = cy + outerRadius - trackWidth / 2;
      const sq = Math.max(5, Math.floor(trackWidth / 8));
      const rows = Math.ceil(trackWidth / sq);
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < 2; c++) {
          ctx.fillStyle = (r + c) % 2 === 0 ? '#ffffff' : '#0f172a';
          ctx.fillRect(
            sfX - sq + c * sq,
            sfTop + r * sq,
            sq,
            Math.min(sq, sfTop + trackWidth - (sfTop + r * sq))
          );
        }
      }

      // Compute lane radii (Doggy outer lane, Slothy inner lane, Mega-Bot middle lane)
      const laneOffset = trackWidth * 0.22;
      const doggyRadius = outerRadius + laneOffset;
      const slothyRadius = outerRadius - laneOffset;
      const bossRadius = outerRadius;

      const doggyState = m.team === 'doggy' ? m : o;
      const slothyState = m.team === 'slothy' ? m : o;
      const doggyProg = m.team === 'doggy' ? smoothMyProg.current : smoothOppProg.current;
      const slothyProg = m.team === 'slothy' ? smoothMyProg.current : smoothOppProg.current;

      const doggyPt = getTrackPoint(doggyProg, cx, cy, straightHalf, doggyRadius);
      const slothyPt = getTrackPoint(slothyProg, cx, cy, straightHalf, slothyRadius);
      const bossPt =
        bp != null
          ? getTrackPoint(smoothBossProg.current, cx, cy, straightHalf, bossRadius)
          : null;

      const nowEpoch = Date.now();
      const doggyTurbo = doggyState.turboUntil > nowEpoch;
      const slothyTurbo = slothyState.turboUntil > nowEpoch;
      const doggySpin = doggyState.spinoutUntil > nowEpoch;
      const slothySpin = slothyState.spinoutUntil > nowEpoch;

      // Spawn trail particles
      particleTimer += dt;
      if (particleTimer >= 0.045) {
        particleTimer = 0;
        if (doggyProg > 0.01 || doggyTurbo) {
          particlesRef.current.push(
            spawnTrailParticle(
              doggyPt.x,
              doggyPt.y,
              doggyPt.angle,
              'doggy',
              doggyState.loadout.trailId,
              doggyTurbo
            )
          );
        }
        if (slothyProg > 0.01 || slothyTurbo) {
          particlesRef.current.push(
            spawnTrailParticle(
              slothyPt.x,
              slothyPt.y,
              slothyPt.angle,
              'slothy',
              slothyState.loadout.trailId,
              slothyTurbo
            )
          );
        }
        if (bossPt && smoothBossProg.current > 0.005) {
          const spread = (Math.random() - 0.5) * 0.6;
          particlesRef.current.push({
            x: bossPt.x - Math.cos(bossPt.angle) * 32 + (Math.random() - 0.5) * 6,
            y: bossPt.y - Math.sin(bossPt.angle) * 32 + (Math.random() - 0.5) * 6,
            vx: -Math.cos(bossPt.angle + spread) * 42,
            vy: -Math.sin(bossPt.angle + spread) * 42,
            life: 0,
            maxLife: 0.52,
            size: 5.5 + Math.random() * 3.5,
            color: Math.random() < 0.5 ? '#a855f7' : '#e879f9',
            kind: 'flame',
            rotation: Math.random() * Math.PI * 2,
          });
        }
      }

      // Update & draw particles
      const alive: TrailParticle[] = [];
      for (const p of particlesRef.current) {
        p.life += dt;
        if (p.life < p.maxLife) {
          p.x += p.vx * dt;
          p.y += p.vy * dt;
          p.rotation += dt * 3;
          drawTrailParticle(ctx, p);
          alive.push(p);
        }
      }
      particlesRef.current = alive;

      // Scale cars nicely to viewport
      const carScale = Math.max(0.68, Math.min(1.02, width / 640));

      // Draw Slothy
      ctx.save();
      ctx.translate(slothyPt.x, slothyPt.y);
      ctx.rotate(slothyPt.angle);
      drawRacerCar(ctx, 'slothy', slothyState.loadout, now, {
        turboActive: slothyTurbo,
        spinoutActive: slothySpin,
        shieldActive: Boolean(slothyState.shieldActive),
        scale: carScale,
      });
      ctx.restore();

      // Draw Mega-Bot 3000 Boss Car when active in Co-Op Boss mode
      if (bossPt) {
        ctx.save();
        ctx.translate(bossPt.x, bossPt.y);
        ctx.rotate(bossPt.angle);
        drawBossCar(ctx, now, carScale * 1.04);
        ctx.restore();
      }

      // Draw Doggy
      ctx.save();
      ctx.translate(doggyPt.x, doggyPt.y);
      ctx.rotate(doggyPt.angle);
      drawRacerCar(ctx, 'doggy', doggyState.loadout, now, {
        turboActive: doggyTurbo,
        spinoutActive: doggySpin,
        shieldActive: Boolean(doggyState.shieldActive),
        scale: carScale,
      });
      ctx.restore();

      // Draw floating "MEGA-BOT" purple badge above Mega-Bot 3000
      if (bossPt) {
        ctx.save();
        ctx.fillStyle = '#7e22ce';
        ctx.strokeStyle = '#f5d0fe';
        ctx.lineWidth = 2;
        const bossBadgeW = 72;
        const bossBadgeH = 18;
        const bbx = bossPt.x - bossBadgeW / 2;
        const bby = bossPt.y - 38 * carScale;
        ctx.beginPath();
        ctx.roundRect(bbx, bby, bossBadgeW, bossBadgeH, 9);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#ffffff';
        ctx.font = '800 9.5px Nunito, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('MEGA-BOT', bossPt.x, bby + bossBadgeH / 2 + 0.5);
        ctx.restore();
      }

      // Draw floating "YOU" badge above the local player's car
      const myPt = myTeam === 'doggy' ? doggyPt : slothyPt;
      ctx.save();
      ctx.fillStyle = myTeam === 'doggy' ? '#e11d48' : '#0d9488';
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      const badgeW = 42;
      const badgeH = 18;
      const bx = myPt.x - badgeW / 2;
      const by = myPt.y - 34 * carScale;
      ctx.beginPath();
      ctx.roundRect(bx, by, badgeW, badgeH, 9);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#ffffff';
      ctx.font = '800 10px Nunito, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('YOU', myPt.x, by + badgeH / 2 + 0.5);
      ctx.restore();

      ctx.restore();
      rafId = requestAnimationFrame(render);
    };

    rafId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(rafId);
  }, [myTeam, totalLaps]);

  const turboMeta = turboBannerTeam ? getTeamMeta(turboBannerTeam) : null;

  return (
    <div className="speedway-canvas-wrap">
      <canvas ref={canvasRef} className="speedway-canvas" />
      {turboMeta && (
        <div
          className={`turbo-banner turbo-banner--${turboBannerTeam}`}
          key={turboBannerTeam}
        >
          <img
            src={turboMeta.turboArt}
            alt={turboMeta.turboTitle}
            className="turbo-banner-img"
          />
          <div className="turbo-banner-text">
            <span className="turbo-banner-title">{turboMeta.turboTitle}</span>
            <span className="turbo-banner-sub">{turboMeta.turboSubtitle}</span>
          </div>
        </div>
      )}
    </div>
  );
};
