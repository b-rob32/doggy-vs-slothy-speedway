import React, { useEffect, useRef } from 'react';
import { RacerLiveState, TeamId } from '../types';
import { getTeamMeta } from '../data/shop';
import {
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
}

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
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const myStateRef = useRef(myState);
  const oppStateRef = useRef(opponentState);
  const smoothMyProg = useRef(myState.progress);
  const smoothOppProg = useRef(opponentState.progress);
  const particlesRef = useRef<TrailParticle[]>([]);

  myStateRef.current = myState;
  oppStateRef.current = opponentState;

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
      smoothMyProg.current += (m.progress - smoothMyProg.current) * Math.min(1, dt * 8);
      smoothOppProg.current += (o.progress - smoothOppProg.current) * Math.min(1, dt * 8);

      // Background vibrant meadow grass
      const grassGrad = ctx.createLinearGradient(0, 0, 0, height);
      grassGrad.addColorStop(0, '#4ade80');
      grassGrad.addColorStop(1, '#16a34a');
      ctx.fillStyle = grassGrad;
      ctx.fillRect(0, 0, width, height);

      // Subtle grass stripes
      ctx.fillStyle = 'rgba(255,255,255,0.06)';
      for (let x = 0; x < width; x += 36) {
        ctx.fillRect(x, 0, 18, height);
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

      // Outer red/white speedway curb
      ctx.save();
      traceOval(outerRadius + trackWidth * 0.56);
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 8;
      ctx.stroke();
      ctx.setLineDash([14, 14]);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 8;
      ctx.stroke();
      ctx.restore();

      // Asphalt track surface
      ctx.save();
      traceOval(outerRadius);
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = trackWidth;
      ctx.stroke();

      // Center dashed lane divider
      traceOval(outerRadius);
      ctx.setLineDash([16, 14]);
      ctx.strokeStyle = 'rgba(255,255,255,0.55)';
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.restore();

      // Inner curb
      ctx.save();
      traceOval(outerRadius - trackWidth * 0.54);
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 6;
      ctx.stroke();
      ctx.setLineDash([12, 12]);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 6;
      ctx.stroke();
      ctx.restore();

      // Infield emblem
      ctx.save();
      ctx.fillStyle = 'rgba(255, 255, 255, 0.22)';
      ctx.font = `700 ${Math.max(13, Math.min(20, width * 0.028))}px Fredoka, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('DOGGY vs SLOTHY', cx, cy - 8);
      ctx.font = `700 ${Math.max(11, Math.min(14, width * 0.02))}px Nunito, sans-serif`;
      ctx.fillText(
        totalLaps ? `${totalLaps}-LAP SPEEDWAY` : 'TIMED SPRINT SPEEDWAY',
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

      // Compute lane radii (Doggy outer lane, Slothy inner lane — never overlap!)
      const laneOffset = trackWidth * 0.22;
      const doggyRadius = outerRadius + laneOffset;
      const slothyRadius = outerRadius - laneOffset;

      const doggyState = m.team === 'doggy' ? m : o;
      const slothyState = m.team === 'slothy' ? m : o;
      const doggyProg = m.team === 'doggy' ? smoothMyProg.current : smoothOppProg.current;
      const slothyProg = m.team === 'slothy' ? smoothMyProg.current : smoothOppProg.current;

      const doggyPt = getTrackPoint(doggyProg, cx, cy, straightHalf, doggyRadius);
      const slothyPt = getTrackPoint(slothyProg, cx, cy, straightHalf, slothyRadius);

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
        scale: carScale,
      });
      ctx.restore();

      // Draw Doggy
      ctx.save();
      ctx.translate(doggyPt.x, doggyPt.y);
      ctx.rotate(doggyPt.angle);
      drawRacerCar(ctx, 'doggy', doggyState.loadout, now, {
        turboActive: doggyTurbo,
        spinoutActive: doggySpin,
        scale: carScale,
      });
      ctx.restore();

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
