import { EquippedLoadout, TeamId } from '../types';

export interface TrailParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
  kind: 'puff' | 'flame' | 'star' | 'paw' | 'leaf' | 'rainbow';
  rotation: number;
}

/**
 * Draws a customized top-3/4 arcade race car with Doggy or Slothy driving,
 * including their equipped car chassis, accessory, and active turbo/spinout state.
 * Facing direction is +X (right) in local coordinates.
 */
export function drawRacerCar(
  ctx: CanvasRenderingContext2D,
  team: TeamId,
  loadout: EquippedLoadout,
  timeMs: number,
  options: {
    turboActive?: boolean;
    spinoutActive?: boolean;
    scale?: number;
  } = {}
) {
  const { turboActive = false, spinoutActive = false, scale = 1 } = options;

  ctx.save();
  ctx.scale(scale, scale);

  // Spinout wobble rotation
  if (spinoutActive) {
    const spinAngle = (timeMs / 90) % (Math.PI * 2);
    ctx.rotate(spinAngle);
  }

  const isDoggy = team === 'doggy';
  const carId = loadout.carId;

  // Determine chassis palette
  let bodyPrimary = isDoggy ? '#e11d48' : '#0d9488';
  let bodySecondary = isDoggy ? '#facc15' : '#34d399';
  let trimColor = '#1e293b';

  if (carId === 'car-lightning') {
    bodyPrimary = isDoggy ? '#dc2626' : '#0284c7';
    bodySecondary = '#fde047';
  } else if (carId === 'car-monster') {
    bodyPrimary = isDoggy ? '#be123c' : '#059669';
    bodySecondary = '#c084fc';
  } else if (carId === 'car-rocket') {
    bodyPrimary = isDoggy ? '#ea580c' : '#0891b2';
    bodySecondary = '#fbbf24';
  } else if (carId === 'car-champion') {
    bodyPrimary = '#eab308';
    bodySecondary = '#fef08a';
    trimColor = '#78350f';
  }

  // Turbo glow aura behind car
  if (turboActive) {
    const pulse = 1 + Math.sin(timeMs / 55) * 0.14;
    ctx.save();
    ctx.globalAlpha = 0.45;
    const grad = ctx.createRadialGradient(-8, 0, 4, -8, 0, 38 * pulse);
    if (isDoggy) {
      grad.addColorStop(0, '#fef08a');
      grad.addColorStop(0.5, '#f97316');
      grad.addColorStop(1, 'rgba(239,68,68,0)');
    } else {
      grad.addColorStop(0, '#ffffff');
      grad.addColorStop(0.45, '#34d399');
      grad.addColorStop(0.8, '#38bdf8');
      grad.addColorStop(1, 'rgba(168,85,247,0)');
    }
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(-8, 0, 38 * pulse, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // Ground drop shadow
  ctx.fillStyle = 'rgba(15, 23, 42, 0.28)';
  ctx.beginPath();
  ctx.ellipse(0, 5, 30, 17, 0, 0, Math.PI * 2);
  ctx.fill();

  // Rocket exhaust pipes for Rocket Dragster or Turbo
  if (carId === 'car-rocket' || turboActive) {
    ctx.fillStyle = '#64748b';
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 2;
    roundRect(ctx, -35, -10, 12, 6, 2);
    ctx.fill();
    ctx.stroke();
    roundRect(ctx, -35, 4, 12, 6, 2);
    ctx.fill();
    ctx.stroke();

    if (turboActive) {
      const flameLen = 14 + Math.sin(timeMs / 35) * 6;
      ctx.fillStyle = isDoggy ? '#f97316' : '#2dd4bf';
      ctx.beginPath();
      ctx.moveTo(-35, -10);
      ctx.lineTo(-35 - flameLen, -7);
      ctx.lineTo(-35, -4);
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(-35, 4);
      ctx.lineTo(-35 - flameLen, 7);
      ctx.lineTo(-35, 10);
      ctx.fill();
    }
  }

  // Wheels (oversized if Monster Crusher!)
  const wheelW = carId === 'car-monster' ? 15 : 12;
  const wheelH = carId === 'car-monster' ? 9 : 6;
  const wheelY = carId === 'car-monster' ? 14 : 13;
  ctx.fillStyle = '#0f172a';
  const wheelPositions = [
    [-16, -wheelY - wheelH / 2],
    [13, -wheelY - wheelH / 2],
    [-16, wheelY - wheelH / 2],
    [13, wheelY - wheelH / 2],
  ];
  for (const [wx, wy] of wheelPositions) {
    roundRect(ctx, wx - wheelW / 2, wy, wheelW, wheelH, 3);
    ctx.fill();
  }

  // Main car chassis body
  ctx.fillStyle = bodyPrimary;
  ctx.strokeStyle = trimColor;
  ctx.lineWidth = 2.4;

  if (carId === 'car-rocket') {
    // Sleek pointed dragster nose
    ctx.beginPath();
    ctx.moveTo(-26, -13);
    ctx.lineTo(14, -13);
    ctx.quadraticCurveTo(33, -7, 33, 0);
    ctx.quadraticCurveTo(33, 7, 14, 13);
    ctx.lineTo(-26, 13);
    ctx.quadraticCurveTo(-30, 0, -26, -13);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  } else {
    roundRect(ctx, -27, -14, 55, 28, 10);
    ctx.fill();
    ctx.stroke();
  }

  // Racing stripe / hood accent
  ctx.fillStyle = bodySecondary;
  roundRect(ctx, -18, -5, 42, 10, 4);
  ctx.fill();

  // Rear spoiler
  ctx.fillStyle = bodySecondary;
  ctx.strokeStyle = trimColor;
  ctx.lineWidth = 2;
  roundRect(ctx, -29, -15, 7, 30, 3);
  ctx.fill();
  ctx.stroke();

  // Headlights
  ctx.fillStyle = '#fef9c3';
  ctx.beginPath();
  ctx.ellipse(25, -8, 3, 2.2, 0, 0, Math.PI * 2);
  ctx.ellipse(25, 8, 3, 2.2, 0, 0, Math.PI * 2);
  ctx.fill();

  // Windshield
  ctx.fillStyle = '#bae6fd';
  ctx.strokeStyle = '#0369a1';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.arc(8, 0, 10, -Math.PI / 2.3, Math.PI / 2.3);
  ctx.stroke();

  // Cockpit seat
  ctx.fillStyle = '#334155';
  ctx.beginPath();
  ctx.ellipse(-2, 0, 11, 10, 0, 0, Math.PI * 2);
  ctx.fill();

  // ==================== DRIVER HEAD ====================
  ctx.save();
  ctx.translate(-2, 0);

  if (isDoggy) {
    drawDoggyHead(ctx, timeMs, turboActive);
  } else {
    drawSlothyHead(ctx);
  }

  // Equipped Accessory on Driver Head!
  drawAccessory(ctx, loadout.accessoryId, turboActive && !isDoggy);

  ctx.restore();
  ctx.restore();
}

function drawDoggyHead(
  ctx: CanvasRenderingContext2D,
  timeMs: number,
  turboActive: boolean
) {
  // Flapping bright crimson-red ears!
  const flap = Math.sin(timeMs / (turboActive ? 45 : 130)) * (turboActive ? 0.35 : 0.12);

  ctx.fillStyle = '#be123c';
  ctx.strokeStyle = '#4c0519';
  ctx.lineWidth = 1.8;

  // Top red ear (flapping back toward -X)
  ctx.save();
  ctx.translate(-2, -10);
  ctx.rotate(-0.4 + flap);
  ctx.beginPath();
  ctx.ellipse(-5, -3, 9, 5, -0.25, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.restore();

  // Bottom red ear
  ctx.save();
  ctx.translate(-2, 10);
  ctx.rotate(0.4 - flap);
  ctx.beginPath();
  ctx.ellipse(-5, 3, 9, 5, 0.25, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.restore();

  // Golden-tan fluffy head
  ctx.fillStyle = '#eab667';
  ctx.strokeStyle = '#78350f';
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.arc(0, 0, 11.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Cute snout pointing forward (+X)
  ctx.fillStyle = '#f5d093';
  ctx.beginPath();
  ctx.ellipse(6.5, 0, 5.5, 6.2, 0, 0, Math.PI * 2);
  ctx.fill();

  // Black button nose
  ctx.fillStyle = '#0f172a';
  ctx.beginPath();
  ctx.ellipse(10.5, 0, 2.4, 3, 0, 0, Math.PI * 2);
  ctx.fill();

  // Black button eyes
  ctx.fillStyle = '#0f172a';
  ctx.beginPath();
  ctx.arc(4, -4.5, 1.9, 0, Math.PI * 2);
  ctx.arc(4, 4.5, 1.9, 0, Math.PI * 2);
  ctx.fill();
  // Eye shine
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(4.6, -5, 0.7, 0, Math.PI * 2);
  ctx.arc(4.6, 4, 0.7, 0, Math.PI * 2);
  ctx.fill();
}

function drawSlothyHead(ctx: CanvasRenderingContext2D) {
  // Fluffy grey-brown sloth head
  ctx.fillStyle = '#8b7b70';
  ctx.strokeStyle = '#3f352f';
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.arc(0, 0, 11.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Cream face oval facing forward (+X)
  ctx.fillStyle = '#f5e8d0';
  ctx.beginPath();
  ctx.ellipse(3.2, 0, 7.6, 8.8, 0, 0, Math.PI * 2);
  ctx.fill();

  // Signature brown eye patches
  ctx.fillStyle = '#7c5a43';
  ctx.beginPath();
  ctx.ellipse(4.5, -5.2, 3.2, 2.4, -0.3, 0, Math.PI * 2);
  ctx.ellipse(4.5, 5.2, 3.2, 2.4, 0.3, 0, Math.PI * 2);
  ctx.fill();

  // Cute dark eyes
  ctx.fillStyle = '#1c1917';
  ctx.beginPath();
  ctx.arc(5, -5, 1.6, 0, Math.PI * 2);
  ctx.arc(5, 5, 1.6, 0, Math.PI * 2);
  ctx.fill();

  // Brown sloth nose
  ctx.fillStyle = '#5c3a21';
  ctx.beginPath();
  ctx.ellipse(9.5, 0, 2.2, 2.8, 0, 0, Math.PI * 2);
  ctx.fill();
}

function drawAccessory(
  ctx: CanvasRenderingContext2D,
  accessoryId: string,
  forceGoggles: boolean
) {
  const activeAcc = forceGoggles && accessoryId === 'acc-none' ? 'acc-goggles' : accessoryId;

  if (activeAcc === 'acc-goggles') {
    // Shiny gold aviator goggles strap & lenses
    ctx.strokeStyle = '#78350f';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, 11.5, Math.PI * 0.65, Math.PI * 1.35);
    ctx.stroke();

    ctx.fillStyle = '#38bdf8';
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(6.5, -4.5, 3.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(6.5, 4.5, 3.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  } else if (activeAcc === 'acc-shades') {
    ctx.fillStyle = '#0f172a';
    ctx.strokeStyle = '#facc15';
    ctx.lineWidth = 1.4;
    roundRect(ctx, 4.5, -8.5, 4.5, 7, 1.5);
    ctx.fill();
    ctx.stroke();
    roundRect(ctx, 4.5, 1.5, 4.5, 7, 1.5);
    ctx.fill();
    ctx.stroke();
  } else if (activeAcc === 'acc-helmet') {
    ctx.fillStyle = 'rgba(255,255,255,0.88)';
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(-1, 0, 12.2, Math.PI * 0.4, Math.PI * 1.6);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    // Racing stripe on helmet
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-13, 0);
    ctx.lineTo(2, 0);
    ctx.stroke();
  } else if (activeAcc === 'acc-crown') {
    ctx.fillStyle = '#facc15';
    ctx.strokeStyle = '#b45309';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-6, -6);
    ctx.lineTo(-12, -8);
    ctx.lineTo(-9, -2);
    ctx.lineTo(-14, 0);
    ctx.lineTo(-9, 2);
    ctx.lineTo(-12, 8);
    ctx.lineTo(-6, 6);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    // Ruby jewel
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(-8.5, 0, 1.7, 0, Math.PI * 2);
    ctx.fill();
  }
}

export function spawnTrailParticle(
  x: number,
  y: number,
  angle: number,
  team: TeamId,
  trailId: string,
  turboActive: boolean
): TrailParticle {
  const backX = x - Math.cos(angle) * 26;
  const backY = y - Math.sin(angle) * 26;
  const spread = (Math.random() - 0.5) * 0.7;
  const speed = turboActive ? 45 : 22;

  let kind: TrailParticle['kind'] = 'puff';
  let color = 'rgba(255,255,255,0.85)';

  if (turboActive) {
    kind = team === 'doggy' ? 'paw' : 'leaf';
    color =
      team === 'doggy'
        ? Math.random() < 0.5
          ? '#f97316'
          : '#facc15'
        : ['#10b981', '#38bdf8', '#facc15', '#ec4899'][
            Math.floor(Math.random() * 4)
          ];
  } else if (trailId === 'trail-flames') {
    kind = 'flame';
    color = Math.random() < 0.5 ? '#f97316' : '#facc15';
  } else if (trailId === 'trail-stars') {
    kind = 'star';
    color = Math.random() < 0.5 ? '#fde047' : '#38bdf8';
  } else if (trailId === 'trail-team') {
    kind = team === 'doggy' ? 'paw' : 'leaf';
    color = team === 'doggy' ? '#fb7185' : '#34d399';
  } else if (trailId === 'trail-rainbow') {
    kind = 'rainbow';
    const colors = ['#ef4444', '#f97316', '#facc15', '#22c55e', '#3b82f6', '#a855f7'];
    color = colors[Math.floor(Math.random() * colors.length)];
  }

  return {
    x: backX + (Math.random() - 0.5) * 6,
    y: backY + (Math.random() - 0.5) * 6,
    vx: -Math.cos(angle + spread) * speed,
    vy: -Math.sin(angle + spread) * speed,
    life: 0,
    maxLife: turboActive ? 0.65 : 0.48,
    size: turboActive ? 7 + Math.random() * 4 : 4.5 + Math.random() * 3,
    color,
    kind,
    rotation: Math.random() * Math.PI * 2,
  };
}

export function drawTrailParticle(
  ctx: CanvasRenderingContext2D,
  p: TrailParticle
) {
  const alpha = Math.max(0, 1 - p.life / p.maxLife);
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(p.x, p.y);
  ctx.rotate(p.rotation);
  ctx.fillStyle = p.color;

  if (p.kind === 'star') {
    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
      const a = (i * Math.PI * 2) / 5 - Math.PI / 2;
      const r = p.size;
      ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
      const a2 = a + Math.PI / 5;
      ctx.lineTo(Math.cos(a2) * (r * 0.45), Math.sin(a2) * (r * 0.45));
    }
    ctx.closePath();
    ctx.fill();
  } else if (p.kind === 'leaf') {
    ctx.beginPath();
    ctx.ellipse(0, 0, p.size * 1.1, p.size * 0.55, 0, 0, Math.PI * 2);
    ctx.fill();
  } else if (p.kind === 'paw') {
    ctx.beginPath();
    ctx.arc(0, 1, p.size * 0.55, 0, Math.PI * 2);
    ctx.arc(-p.size * 0.5, -p.size * 0.45, p.size * 0.28, 0, Math.PI * 2);
    ctx.arc(0, -p.size * 0.65, p.size * 0.28, 0, Math.PI * 2);
    ctx.arc(p.size * 0.5, -p.size * 0.45, p.size * 0.28, 0, Math.PI * 2);
    ctx.fill();
  } else {
    ctx.beginPath();
    ctx.arc(0, 0, p.size * (0.7 + (p.life / p.maxLife) * 0.5), 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}
