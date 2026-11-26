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
  kind:
    | 'puff'
    | 'flame'
    | 'star'
    | 'paw'
    | 'leaf'
    | 'rainbow'
    | 'bubble'
    | 'heart'
    | 'music'
    | 'snow'
    | 'bolt'
    | 'confetti';
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
    shieldActive?: boolean;
    scale?: number;
  } = {}
) {
  const {
    turboActive = false,
    spinoutActive = false,
    shieldActive = false,
    scale = 1,
  } = options;

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
  } else if (carId === 'car-bubblegum') {
    bodyPrimary = '#f472b6';
    bodySecondary = '#67e8f9';
    trimColor = '#be185d';
  } else if (carId === 'car-dino') {
    bodyPrimary = '#10b981';
    bodySecondary = '#facc15';
    trimColor = '#064e3b';
  } else if (carId === 'car-unicorn') {
    bodyPrimary = '#f3e8ff';
    bodySecondary = '#f9a8d4';
    trimColor = '#9333ea';
  } else if (carId === 'car-ninja') {
    bodyPrimary = '#0f172a';
    bodySecondary = '#1e293b';
    trimColor = '#06b6d4';
  } else if (carId === 'car-royal') {
    bodyPrimary = '#7e22ce';
    bodySecondary = '#facc15';
    trimColor = '#eab308';
  } else if (carId === 'car-ufo') {
    bodyPrimary = '#cbd5e1';
    bodySecondary = '#22d3ee';
    trimColor = '#0891b2';
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
  if (carId === 'car-ufo') {
    ctx.ellipse(0, 6, 28, 25, 0, 0, Math.PI * 2);
  } else {
    ctx.ellipse(0, 5, 30, 17, 0, 0, Math.PI * 2);
  }
  ctx.fill();

  // Hover glow ring underneath for Bubblegum Hovercraft & UFO Saucer
  if (carId === 'car-bubblegum') {
    const hoverPulse = 1 + Math.sin(timeMs / 130) * 0.08;
    ctx.save();
    const hGrad = ctx.createRadialGradient(0, 0, 8, 0, 0, 34 * hoverPulse);
    hGrad.addColorStop(0, 'rgba(103, 232, 249, 0.55)');
    hGrad.addColorStop(0.65, 'rgba(34, 211, 238, 0.35)');
    hGrad.addColorStop(1, 'rgba(34, 211, 238, 0)');
    ctx.fillStyle = hGrad;
    ctx.beginPath();
    ctx.ellipse(0, 0, 34 * hoverPulse, 22 * hoverPulse, 0, 0, Math.PI * 2);
    ctx.fill();

    // Glowing aqua bottom hover ring
    ctx.strokeStyle = '#67e8f9';
    ctx.shadowColor = '#22d3ee';
    ctx.shadowBlur = 10;
    ctx.lineWidth = 3.2;
    roundRect(ctx, -30, -17.5, 60, 35, 17.5);
    ctx.stroke();
    ctx.restore();
  } else if (carId === 'car-ufo') {
    const ufoPulse = 1 + Math.sin(timeMs / 140) * 0.07;
    ctx.save();
    const uGrad = ctx.createRadialGradient(0, 0, 10, 0, 0, 32 * ufoPulse);
    uGrad.addColorStop(0, 'rgba(34, 211, 238, 0.45)');
    uGrad.addColorStop(0.7, 'rgba(56, 189, 248, 0.25)');
    uGrad.addColorStop(1, 'rgba(56, 189, 248, 0)');
    ctx.fillStyle = uGrad;
    ctx.beginPath();
    ctx.arc(0, 0, 32 * ufoPulse, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // Mini rainbow side wings for Unicorn Car (drawn under/beside chassis)
  if (carId === 'car-unicorn') {
    const flutter = Math.sin(timeMs / 120) * 0.08;
    const wingColors = ['#fb7185', '#fbbf24', '#34d399', '#38bdf8', '#c084fc'];
    for (const side of [-1, 1]) {
      ctx.save();
      ctx.translate(-2, side * 13);
      ctx.rotate(side * flutter);
      for (let i = 0; i < wingColors.length; i++) {
        ctx.fillStyle = wingColors[i];
        ctx.strokeStyle = '#9333ea';
        ctx.lineWidth = 0.9;
        ctx.beginPath();
        ctx.ellipse(
          4 - i * 3.4,
          side * (5.5 + (wingColors.length - 1 - i) * 0.8),
          5.2 - i * 0.35,
          2.6,
          side * (-0.35 - i * 0.06),
          0,
          Math.PI * 2
        );
        ctx.fill();
        ctx.stroke();
      }
      ctx.restore();
    }
  }

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

  // Wheels (skip for hovercraft & UFO; oversized if Monster Crusher!)
  if (carId !== 'car-bubblegum' && carId !== 'car-ufo') {
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
      if (carId === 'car-royal') {
        ctx.strokeStyle = '#facc15';
        ctx.lineWidth = 1.2;
        ctx.stroke();
      } else if (carId === 'car-ninja') {
        ctx.strokeStyle = '#22d3ee';
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    }
  }

  // Main car chassis body
  ctx.fillStyle = bodyPrimary;
  ctx.strokeStyle = trimColor;
  ctx.lineWidth = 2.4;

  if (carId === 'car-ufo') {
    // Glowing circular silver-and-cyan flying saucer disc
    const saucerGrad = ctx.createRadialGradient(-4, -4, 4, 0, 0, 26);
    saucerGrad.addColorStop(0, '#f8fafc');
    saucerGrad.addColorStop(0.55, '#cbd5e1');
    saucerGrad.addColorStop(0.88, '#94a3b8');
    saucerGrad.addColorStop(1, '#475569');
    ctx.fillStyle = saucerGrad;
    ctx.strokeStyle = '#0891b2';
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.arc(0, 0, 25, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Inner glowing cyan saucer ring
    ctx.save();
    ctx.strokeStyle = '#22d3ee';
    ctx.shadowColor = '#22d3ee';
    ctx.shadowBlur = 7;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, 17, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    // Forward direction chevron indicator on saucer nose
    ctx.fillStyle = '#67e8f9';
    ctx.beginPath();
    ctx.moveTo(23.5, 0);
    ctx.lineTo(18.5, -4);
    ctx.lineTo(18.5, 4);
    ctx.closePath();
    ctx.fill();

    // Pulsing neon lights around the rim
    const lightCount = 8;
    const lightColors = ['#22d3ee', '#4ade80', '#f472b6', '#fde047'];
    for (let i = 0; i < lightCount; i++) {
      const a = (i * Math.PI * 2) / lightCount + timeMs / 900;
      const lx = Math.cos(a) * 21;
      const ly = Math.sin(a) * 21;
      const glow = 0.55 + 0.45 * Math.sin(timeMs / 120 + i * 1.1);
      ctx.save();
      ctx.globalAlpha = glow;
      ctx.fillStyle = lightColors[i % lightColors.length];
      ctx.shadowColor = lightColors[i % lightColors.length];
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.arc(lx, ly, 2.3, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Translucent cyan cockpit dome rim
    ctx.fillStyle = 'rgba(14, 116, 144, 0.72)';
    ctx.strokeStyle = '#67e8f9';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.arc(-2, 0, 12.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  } else if (carId === 'car-bubblegum') {
    // Pastel pink & aqua rounded hovercraft body
    const bgGrad = ctx.createLinearGradient(-28, -16, 28, 16);
    bgGrad.addColorStop(0, '#fbcfe8');
    bgGrad.addColorStop(0.5, '#f472b6');
    bgGrad.addColorStop(1, '#ec4899');
    ctx.fillStyle = bgGrad;
    ctx.strokeStyle = '#be185d';
    ctx.lineWidth = 2.2;
    roundRect(ctx, -28, -15, 56, 30, 15);
    ctx.fill();
    ctx.stroke();

    // Aqua side bumper trim & glossy highlight
    ctx.strokeStyle = '#67e8f9';
    ctx.lineWidth = 2.6;
    roundRect(ctx, -24, -12, 48, 24, 12);
    ctx.stroke();

    // Cute aqua hover-stripe on hood
    ctx.fillStyle = '#67e8f9';
    roundRect(ctx, -14, -4.5, 36, 9, 4.5);
    ctx.fill();

    // Glossy white bubble shine on nose
    ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
    ctx.beginPath();
    ctx.ellipse(17, -6, 5, 2.2, 0.25, 0, Math.PI * 2);
    ctx.fill();

    // Cute pastel aqua headlights
    ctx.fillStyle = '#e0f2fe';
    ctx.beginPath();
    ctx.ellipse(24.5, -7, 2.8, 2, 0, 0, Math.PI * 2);
    ctx.ellipse(24.5, 7, 2.8, 2, 0, 0, Math.PI * 2);
    ctx.fill();
  } else if (carId === 'car-ninja') {
    // Sleek stealth dark-slate/black angular chassis
    ctx.fillStyle = '#0f172a';
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(-28, -14);
    ctx.lineTo(14, -14);
    ctx.lineTo(29, -7);
    ctx.lineTo(32, 0);
    ctx.lineTo(29, 7);
    ctx.lineTo(14, 14);
    ctx.lineTo(-28, 14);
    ctx.lineTo(-24, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Glowing cyan neon trim stripes & hood chevron
    ctx.save();
    ctx.strokeStyle = '#22d3ee';
    ctx.shadowColor = '#06b6d4';
    ctx.shadowBlur = 8;
    ctx.lineWidth = 2.1;

    // Side neon edge stripes
    ctx.beginPath();
    ctx.moveTo(-24, -11.5);
    ctx.lineTo(13, -11.5);
    ctx.lineTo(26, -5.5);
    ctx.moveTo(-24, 11.5);
    ctx.lineTo(13, 11.5);
    ctx.lineTo(26, 5.5);
    ctx.stroke();

    // Hood neon V-chevron
    ctx.beginPath();
    ctx.moveTo(10, -6);
    ctx.lineTo(22, 0);
    ctx.lineTo(10, 6);
    ctx.stroke();

    // Stealth angular rear fin tips
    ctx.fillStyle = '#1e293b';
    ctx.strokeStyle = '#22d3ee';
    ctx.lineWidth = 1.6;
    roundRect(ctx, -30, -16, 6, 32, 2);
    ctx.fill();
    ctx.stroke();

    // Glowing cyan slit headlights
    ctx.fillStyle = '#67e8f9';
    ctx.beginPath();
    ctx.ellipse(25, -5.5, 3.2, 1.3, 0.3, 0, Math.PI * 2);
    ctx.ellipse(25, 5.5, 3.2, 1.3, -0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  } else if (carId === 'car-royal') {
    // Regal purple-and-gold curved carriage chassis
    const royalGrad = ctx.createLinearGradient(-28, -15, 28, 15);
    royalGrad.addColorStop(0, '#6b21a8');
    royalGrad.addColorStop(0.5, '#7e22ce');
    royalGrad.addColorStop(1, '#581c87');
    ctx.fillStyle = royalGrad;
    ctx.strokeStyle = '#facc15';
    ctx.lineWidth = 2.8;

    // Curved carriage body
    ctx.beginPath();
    ctx.moveTo(-25, -15);
    ctx.quadraticCurveTo(-5, -11, 14, -15);
    ctx.quadraticCurveTo(30, -13, 30, 0);
    ctx.quadraticCurveTo(30, 13, 14, 15);
    ctx.quadraticCurveTo(-5, 11, -25, 15);
    ctx.quadraticCurveTo(-31, 0, -25, -15);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Ornate gold center trim & scroll accent
    ctx.fillStyle = '#facc15';
    roundRect(ctx, -18, -4.5, 42, 9, 4);
    ctx.fill();

    // Golden rear royal crest spoiler
    ctx.fillStyle = '#facc15';
    ctx.strokeStyle = '#a16207';
    ctx.lineWidth = 1.8;
    roundRect(ctx, -30, -15, 6.5, 30, 3.5);
    ctx.fill();
    ctx.stroke();

    // Ruby gem accents on nose and rear crest
    const rubies: [number, number, number][] = [
      [23, 0, 2.7],
      [-26.8, -8, 2.1],
      [-26.8, 0, 2.4],
      [-26.8, 8, 2.1],
    ];
    for (const [rx, ry, rr] of rubies) {
      ctx.fillStyle = '#ef4444';
      ctx.strokeStyle = '#991b1b';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(rx, ry, rr, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#fecaca';
      ctx.beginPath();
      ctx.arc(rx - rr * 0.3, ry - rr * 0.3, rr * 0.35, 0, Math.PI * 2);
      ctx.fill();
    }

    // Warm golden carriage lanterns
    ctx.fillStyle = '#fef08a';
    ctx.beginPath();
    ctx.arc(24, -9.5, 2.4, 0, Math.PI * 2);
    ctx.arc(24, 9.5, 2.4, 0, Math.PI * 2);
    ctx.fill();
  } else {
    // Standard / Rocket / Dino / Unicorn chassis
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
    } else if (carId === 'car-unicorn') {
      // Pearlescent pastel lavender/white chassis
      const uniGrad = ctx.createLinearGradient(-27, -14, 28, 14);
      uniGrad.addColorStop(0, '#ffffff');
      uniGrad.addColorStop(0.45, '#f3e8ff');
      uniGrad.addColorStop(0.8, '#e9d5ff');
      uniGrad.addColorStop(1, '#fbcfe8');
      ctx.fillStyle = uniGrad;
      ctx.strokeStyle = '#9333ea';
      ctx.lineWidth = 2.2;
      roundRect(ctx, -27, -14, 55, 28, 11);
      ctx.fill();
      ctx.stroke();
    } else {
      roundRect(ctx, -27, -14, 55, 28, 10);
      ctx.fill();
      ctx.stroke();
    }

    // Racing stripe / hood accent
    if (carId === 'car-unicorn') {
      // Pastel rainbow hood stripe
      const stripeGrad = ctx.createLinearGradient(-16, -5, 22, 5);
      stripeGrad.addColorStop(0, '#f472b6');
      stripeGrad.addColorStop(0.35, '#fde047');
      stripeGrad.addColorStop(0.7, '#34d399');
      stripeGrad.addColorStop(1, '#38bdf8');
      ctx.fillStyle = stripeGrad;
      roundRect(ctx, -18, -5, 42, 10, 4);
      ctx.fill();
    } else {
      ctx.fillStyle = bodySecondary;
      roundRect(ctx, -18, -5, 42, 10, 4);
      ctx.fill();
    }

    // Dino-specific details: yellow dino spikes along rear & chompy white teeth on front bumper!
    if (carId === 'car-dino') {
      // Darker emerald dino spots on sides
      ctx.fillStyle = '#059669';
      ctx.beginPath();
      ctx.arc(-6, -10.5, 2.2, 0, Math.PI * 2);
      ctx.arc(8, -10, 1.8, 0, Math.PI * 2);
      ctx.arc(-6, 10.5, 2.2, 0, Math.PI * 2);
      ctx.arc(8, 10, 1.8, 0, Math.PI * 2);
      ctx.fill();

      // Yellow dino spikes along the rear
      ctx.fillStyle = '#facc15';
      ctx.strokeStyle = '#854d0e';
      ctx.lineWidth = 1.5;
      const spikeYs = [-9, -3, 3, 9];
      for (const sy of spikeYs) {
        ctx.beginPath();
        ctx.moveTo(-25, sy - 2.8);
        ctx.lineTo(-34, sy);
        ctx.lineTo(-25, sy + 2.8);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }
      // Ridge spikes along rear deck spine
      for (const sx of [-22, -16]) {
        ctx.beginPath();
        ctx.moveTo(sx - 2.5, -3);
        ctx.lineTo(sx, 0);
        ctx.lineTo(sx - 2.5, 3);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }

      // Chompy white teeth on the front bumper!
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#064e3b';
      ctx.lineWidth = 1.3;
      const toothYs = [-9, -4.5, 0, 4.5, 9];
      for (const ty of toothYs) {
        ctx.beginPath();
        ctx.moveTo(26.5, ty - 2.2);
        ctx.lineTo(32.5, ty);
        ctx.lineTo(26.5, ty + 2.2);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }
    } else {
      // Rear spoiler (standard, rocket, lightning, monster, champion, unicorn)
      ctx.fillStyle = bodySecondary;
      ctx.strokeStyle = trimColor;
      ctx.lineWidth = 2;
      roundRect(ctx, -29, -15, 7, 30, 3);
      ctx.fill();
      ctx.stroke();
    }

    // Tiny golden spiral hood horn for Unicorn Car!
    if (carId === 'car-unicorn') {
      ctx.save();
      ctx.fillStyle = '#facc15';
      ctx.strokeStyle = '#b45309';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(25, -3.5);
      ctx.lineTo(38, 0);
      ctx.lineTo(25, 3.5);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Spiral ridges on horn
      ctx.strokeStyle = '#fef08a';
      ctx.lineWidth = 1.1;
      ctx.beginPath();
      ctx.moveTo(28, -2.5);
      ctx.lineTo(30, 2);
      ctx.moveTo(31.5, -1.6);
      ctx.lineTo(33.5, 1.3);
      ctx.stroke();
      ctx.restore();
    }

    // Headlights
    ctx.fillStyle = '#fef9c3';
    ctx.beginPath();
    ctx.ellipse(25, -8, 3, 2.2, 0, 0, Math.PI * 2);
    ctx.ellipse(25, 8, 3, 2.2, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // Windshield (skip for UFO which has circular glass dome rim)
  if (carId !== 'car-ufo') {
    ctx.fillStyle = '#bae6fd';
    ctx.strokeStyle = carId === 'car-ninja' ? '#22d3ee' : '#0369a1';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.arc(8, 0, 10, -Math.PI / 2.3, Math.PI / 2.3);
    ctx.stroke();

    // Cockpit seat
    ctx.fillStyle = '#334155';
    ctx.beginPath();
    ctx.ellipse(-2, 0, 11, 10, 0, 0, Math.PI * 2);
    ctx.fill();
  }

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

  // Protective Star-Shield bubble around car when shieldActive is true
  if (shieldActive) {
    drawShieldBubble(ctx, timeMs);
  }

  ctx.restore();
}

function drawShieldBubble(ctx: CanvasRenderingContext2D, timeMs: number) {
  const pulse = 1 + Math.sin(timeMs / 170) * 0.045;
  const rx = 38 * pulse;
  const ry = 25 * pulse;

  ctx.save();

  // Translucent cyan/gold energy bubble fill
  const grad = ctx.createRadialGradient(0, 0, 6, 0, 0, rx);
  grad.addColorStop(0, 'rgba(56, 189, 248, 0.08)');
  grad.addColorStop(0.58, 'rgba(34, 211, 238, 0.22)');
  grad.addColorStop(0.84, 'rgba(250, 204, 21, 0.34)');
  grad.addColorStop(1, 'rgba(125, 211, 252, 0.52)');

  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();

  // Outer glowing cyan ring
  ctx.strokeStyle = 'rgba(56, 189, 248, 0.9)';
  ctx.lineWidth = 2.4;
  ctx.shadowColor = '#38bdf8';
  ctx.shadowBlur = 10;
  ctx.beginPath();
  ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
  ctx.stroke();

  // Inner shimmering gold accent ring
  ctx.shadowColor = '#facc15';
  ctx.shadowBlur = 6;
  ctx.strokeStyle = 'rgba(254, 240, 138, 0.8)';
  ctx.lineWidth = 1.4;
  ctx.setLineDash([8, 10]);
  ctx.lineDashOffset = -(timeMs / 28);
  ctx.beginPath();
  ctx.ellipse(0, 0, rx - 2.5, ry - 2, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);

  // Glossy specular bubble highlight
  ctx.shadowBlur = 0;
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.55)';
  ctx.lineWidth = 2.2;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.ellipse(0, 0, rx - 5, ry - 4.5, 0, -Math.PI * 0.78, -Math.PI * 0.42);
  ctx.stroke();

  // Orbiting gold & cyan protective stars around the shield perimeter
  const starCount = 3;
  for (let i = 0; i < starCount; i++) {
    const theta = timeMs / 460 + (i * Math.PI * 2) / starCount;
    const sx = Math.cos(theta) * (rx + 1);
    const sy = Math.sin(theta) * (ry + 1);
    const starScale = 0.85 + Math.sin(timeMs / 130 + i * 2) * 0.25;
    drawMiniStar(
      ctx,
      sx,
      sy,
      5.2 * starScale,
      i % 2 === 0 ? '#fef08a' : '#67e8f9',
      '#f59e0b'
    );
  }

  ctx.restore();
}

function drawMiniStar(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  fill: string,
  stroke: string
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = fill;
  ctx.strokeStyle = stroke;
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let i = 0; i < 5; i++) {
    const a = (i * Math.PI * 2) / 5 - Math.PI / 2;
    const px = Math.cos(a) * radius;
    const py = Math.sin(a) * radius;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
    const a2 = a + Math.PI / 5;
    ctx.lineTo(Math.cos(a2) * (radius * 0.45), Math.sin(a2) * (radius * 0.45));
  }
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

/**
 * Draws Mega-Bot 3000 — a fun, kid-friendly cartoon purple-and-silver robot boss
 * race car with chunky treads/wheels, glowing neon-red/orange visor eyes,
 * spinning antenna, and purple jet exhaust. Facing +X in local coordinates.
 */
export function drawBossCar(
  ctx: CanvasRenderingContext2D,
  timeMs: number,
  scale = 1
) {
  ctx.save();
  ctx.scale(scale, scale);

  // Subtle purple jet energy aura behind Mega-Bot
  const pulse = 1 + Math.sin(timeMs / 65) * 0.12;
  ctx.save();
  ctx.globalAlpha = 0.4;
  const aura = ctx.createRadialGradient(-20, 0, 4, -20, 0, 38 * pulse);
  aura.addColorStop(0, '#f0abfc');
  aura.addColorStop(0.5, '#a855f7');
  aura.addColorStop(1, 'rgba(126, 34, 206, 0)');
  ctx.fillStyle = aura;
  ctx.beginPath();
  ctx.arc(-20, 0, 38 * pulse, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Ground drop shadow
  ctx.fillStyle = 'rgba(15, 23, 42, 0.34)';
  ctx.beginPath();
  ctx.ellipse(0, 6, 34, 20, 0, 0, Math.PI * 2);
  ctx.fill();

  // Dual purple jet exhaust thrusters & pulsing purple/magenta flames
  ctx.fillStyle = '#94a3b8';
  ctx.strokeStyle = '#1e1b4b';
  ctx.lineWidth = 2;
  roundRect(ctx, -38, -12, 13, 8, 2.5);
  ctx.fill();
  ctx.stroke();
  roundRect(ctx, -38, 4, 13, 8, 2.5);
  ctx.fill();
  ctx.stroke();

  const flameLen = 15 + Math.sin(timeMs / 35) * 6;
  const innerFlameLen = flameLen * 0.58;
  for (const fy of [-8, 8]) {
    // Outer purple jet flame
    ctx.fillStyle = '#a855f7';
    ctx.beginPath();
    ctx.moveTo(-38, fy - 4.5);
    ctx.lineTo(-38 - flameLen, fy);
    ctx.lineTo(-38, fy + 4.5);
    ctx.closePath();
    ctx.fill();

    // Bright neon pink/lavender inner core
    ctx.fillStyle = '#f5d0fe';
    ctx.beginPath();
    ctx.moveTo(-38, fy - 2.3);
    ctx.lineTo(-38 - innerFlameLen, fy);
    ctx.lineTo(-38, fy + 2.3);
    ctx.closePath();
    ctx.fill();
  }

  // Chunky robot treads / oversized wheels with animated tread ribs
  const treadW = 18;
  const treadH = 9.5;
  const treadY = 16;
  const treadOffset = (timeMs / 35) % 5;
  const treadPositions = [
    [-16, -treadY - treadH / 2],
    [13, -treadY - treadH / 2],
    [-16, treadY - treadH / 2],
    [13, treadY - treadH / 2],
  ];
  for (const [tx, ty] of treadPositions) {
    ctx.fillStyle = '#0f172a';
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 1.6;
    roundRect(ctx, tx - treadW / 2, ty, treadW, treadH, 3.5);
    ctx.fill();
    ctx.stroke();

    // Animated metallic tread ribs
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 1.3;
    for (let rx = tx - treadW / 2 + 2 + treadOffset; rx < tx + treadW / 2 - 1; rx += 5) {
      ctx.beginPath();
      ctx.moveTo(rx, ty + 1.5);
      ctx.lineTo(rx, ty + treadH - 1.5);
      ctx.stroke();
    }
  }

  // Heavy armored purple-and-silver robot chassis
  ctx.fillStyle = '#7e22ce';
  ctx.strokeStyle = '#1e1b4b';
  ctx.lineWidth = 2.6;
  ctx.beginPath();
  ctx.moveTo(-28, -15);
  ctx.lineTo(18, -15);
  ctx.lineTo(31, -9);
  ctx.lineTo(34, 0);
  ctx.lineTo(31, 9);
  ctx.lineTo(18, 15);
  ctx.lineTo(-28, 15);
  ctx.lineTo(-31, 9);
  ctx.lineTo(-31, -9);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Metallic silver armor side plates & hood stripe
  ctx.fillStyle = '#cbd5e1';
  ctx.strokeStyle = '#475569';
  ctx.lineWidth = 1.4;
  roundRect(ctx, -20, -11, 44, 22, 6);
  ctx.fill();
  ctx.stroke();

  // Bold purple center stripe on hood
  ctx.fillStyle = '#9333ea';
  roundRect(ctx, -18, -5.5, 42, 11, 3.5);
  ctx.fill();

  // Silver front robot bumper teeth / grille
  ctx.fillStyle = '#e2e8f0';
  ctx.strokeStyle = '#334155';
  ctx.lineWidth = 1.5;
  roundRect(ctx, 25, -10, 6.5, 20, 2.5);
  ctx.fill();
  ctx.stroke();

  // Glowing neon orange headlights on bumper corners
  ctx.fillStyle = '#fb923c';
  ctx.beginPath();
  ctx.arc(28.5, -6.5, 2.2, 0, Math.PI * 2);
  ctx.arc(28.5, 6.5, 2.2, 0, Math.PI * 2);
  ctx.fill();

  // Chunky rear spoiler wing with neon magenta tips
  ctx.fillStyle = '#cbd5e1';
  ctx.strokeStyle = '#1e1b4b';
  ctx.lineWidth = 2;
  roundRect(ctx, -31, -17, 7.5, 34, 3);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#e879f9';
  roundRect(ctx, -31, -17, 7.5, 5, 2);
  ctx.fill();
  roundRect(ctx, -31, 12, 7.5, 5, 2);
  ctx.fill();

  // ==================== MEGA-BOT ROBOT HEAD ====================
  ctx.save();
  ctx.translate(-1, 0);

  // Side metallic ear bolts
  ctx.fillStyle = '#94a3b8';
  ctx.strokeStyle = '#1e1b4b';
  ctx.lineWidth = 1.6;
  roundRect(ctx, -3, -15, 6, 4.5, 1.5);
  ctx.fill();
  ctx.stroke();
  roundRect(ctx, -3, 10.5, 6, 4.5, 1.5);
  ctx.fill();
  ctx.stroke();

  // Rounded-square silver robot head
  ctx.fillStyle = '#e2e8f0';
  ctx.strokeStyle = '#1e1b4b';
  ctx.lineWidth = 2;
  roundRect(ctx, -11, -11.5, 23, 23, 6.5);
  ctx.fill();
  ctx.stroke();

  // Purple robot crown helmet plate
  ctx.fillStyle = '#9333ea';
  roundRect(ctx, -10, -8.5, 11, 17, 4);
  ctx.fill();

  // Dark visor housing facing +X
  ctx.fillStyle = '#0f172a';
  roundRect(ctx, 2, -9, 9.5, 18, 3.5);
  ctx.fill();

  // Glowing neon-red / orange visor eyes with subtle pulsing scan
  const eyeGlow = 0.8 + Math.sin(timeMs / 110) * 0.2;
  ctx.save();
  ctx.shadowColor = '#ff3b30';
  ctx.shadowBlur = 8;
  ctx.fillStyle = `rgba(255, 69, 0, ${eyeGlow})`;
  roundRect(ctx, 4.2, -7.2, 5.2, 6, 2);
  ctx.fill();
  roundRect(ctx, 4.2, 1.2, 5.2, 6, 2);
  ctx.fill();

  // Hot orange-yellow core inside each visor eye
  ctx.shadowBlur = 0;
  ctx.fillStyle = '#fde047';
  roundRect(ctx, 5.6, -5.6, 2.4, 2.8, 1);
  ctx.fill();
  roundRect(ctx, 5.6, 2.8, 2.4, 2.8, 1);
  ctx.fill();
  ctx.restore();

  // Spinning radar antenna on top of Mega-Bot's head
  ctx.save();
  ctx.translate(-4.5, 0);
  ctx.rotate(timeMs / 150);

  // Antenna crossbar
  ctx.strokeStyle = '#1e1b4b';
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  ctx.moveTo(-7.5, 0);
  ctx.lineTo(7.5, 0);
  ctx.stroke();

  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(-7.5, 0);
  ctx.lineTo(7.5, 0);
  ctx.stroke();

  // Glowing neon orb tips on spinning antenna
  ctx.fillStyle = '#f43f5e';
  ctx.beginPath();
  ctx.arc(7.5, 0, 2.6, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#38bdf8';
  ctx.beginPath();
  ctx.arc(-7.5, 0, 2.2, 0, Math.PI * 2);
  ctx.fill();

  // Center antenna hub
  ctx.fillStyle = '#c084fc';
  ctx.strokeStyle = '#1e1b4b';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.arc(0, 0, 3.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.restore();

  ctx.restore(); // end robot head
  ctx.restore(); // end drawBossCar
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
  } else if (activeAcc === 'acc-bow') {
    // Cute bright pink bow with white polka dots!
    ctx.fillStyle = '#ec4899';
    ctx.strokeStyle = '#9d174d';
    ctx.lineWidth = 1.4;

    // Top loop
    ctx.beginPath();
    ctx.moveTo(-7.5, -1);
    ctx.bezierCurveTo(-15, -3.5, -15, -11.5, -6, -9.5);
    ctx.bezierCurveTo(-3, -8.5, -3.5, -2.5, -7.5, -1);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Bottom loop
    ctx.beginPath();
    ctx.moveTo(-7.5, 1);
    ctx.bezierCurveTo(-15, 3.5, -15, 11.5, -6, 9.5);
    ctx.bezierCurveTo(-3, 8.5, -3.5, 2.5, -7.5, 1);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // White polka dots on bow loops
    ctx.fillStyle = '#ffffff';
    const dots: [number, number][] = [
      [-10.5, -6.5],
      [-7.2, -5.2],
      [-10.5, 6.5],
      [-7.2, 5.2],
    ];
    for (const [dx, dy] of dots) {
      ctx.beginPath();
      ctx.arc(dx, dy, 1.15, 0, Math.PI * 2);
      ctx.fill();
    }

    // Center bow knot
    ctx.fillStyle = '#f472b6';
    ctx.strokeStyle = '#9d174d';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(-7.5, 0, 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  } else if (activeAcc === 'acc-party') {
    // Striped colorful cone party hat with yellow pom-pom!
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(-4, -7.5);
    ctx.lineTo(-18, 0);
    ctx.lineTo(-4, 7.5);
    ctx.quadraticCurveTo(-2, 0, -4, -7.5);
    ctx.closePath();
    ctx.fillStyle = '#38bdf8';
    ctx.fill();

    // Clip colorful stripes inside cone
    ctx.save();
    ctx.clip();
    const stripeColors = ['#f472b6', '#facc15', '#34d399', '#a855f7'];
    for (let i = 0; i < stripeColors.length; i++) {
      ctx.fillStyle = stripeColors[i];
      ctx.fillRect(-17 + i * 3.5, -9, 2.1, 18);
    }
    ctx.restore();

    ctx.strokeStyle = '#1e3a8a';
    ctx.lineWidth = 1.4;
    ctx.stroke();

    // Fluffy yellow pom-pom at tip
    ctx.fillStyle = '#facc15';
    ctx.strokeStyle = '#b45309';
    ctx.lineWidth = 1.1;
    ctx.beginPath();
    ctx.arc(-18.5, 0, 2.9, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  } else if (activeAcc === 'acc-cat') {
    // Adorable sparkly cat-ear headband!
    ctx.strokeStyle = '#ec4899';
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.arc(-1, 0, 11.4, -Math.PI * 0.62, Math.PI * 0.62);
    ctx.stroke();

    // Cute pointed cat ears on top & bottom sides
    for (const side of [-1, 1]) {
      ctx.fillStyle = '#1e293b';
      ctx.strokeStyle = '#f472b6';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(-5, side * 9.5);
      ctx.lineTo(-1, side * 16.5);
      ctx.lineTo(3.5, side * 9.5);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Inner pastel pink triangle
      ctx.fillStyle = '#f9a8d4';
      ctx.beginPath();
      ctx.moveTo(-3.2, side * 10.2);
      ctx.lineTo(-1, side * 14.3);
      ctx.lineTo(1.6, side * 10.2);
      ctx.closePath();
      ctx.fill();

      // Sparkle dot on ear
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(-0.5, side * 12.2, 0.9, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (activeAcc === 'acc-flower') {
    // Colorful flower crown halo (pink/yellow/white blossoms)!
    ctx.strokeStyle = '#16a34a';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.arc(-1, 0, 10.8, Math.PI * 0.45, Math.PI * 1.55);
    ctx.stroke();

    const blossoms: { angle: number; petal: string; center: string }[] = [
      { angle: Math.PI * 0.58, petal: '#f472b6', center: '#fef08a' },
      { angle: Math.PI * 0.79, petal: '#facc15', center: '#f97316' },
      { angle: Math.PI, petal: '#ffffff', center: '#facc15' },
      { angle: Math.PI * 1.21, petal: '#fb7185', center: '#fef08a' },
      { angle: Math.PI * 1.42, petal: '#ffffff', center: '#ec4899' },
    ];
    for (const b of blossoms) {
      const fx = -1 + Math.cos(b.angle) * 10.8;
      const fy = Math.sin(b.angle) * 10.8;
      ctx.fillStyle = b.petal;
      for (let p = 0; p < 5; p++) {
        const pa = (p * Math.PI * 2) / 5;
        ctx.beginPath();
        ctx.arc(fx + Math.cos(pa) * 2.1, fy + Math.sin(pa) * 2.1, 1.5, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = b.center;
      ctx.beginPath();
      ctx.arc(fx, fy, 1.35, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (activeAcc === 'acc-cowboy') {
    // Tan cowboy hat brim & crown with gold star!
    ctx.fillStyle = '#d99b52';
    ctx.strokeStyle = '#78350f';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.ellipse(-4, 0, 11.5, 14.8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Brown hatband & pinched crown
    ctx.fillStyle = '#b47434';
    ctx.strokeStyle = '#78350f';
    ctx.lineWidth = 1.4;
    roundRect(ctx, -11.5, -7.2, 13.5, 14.4, 5.5);
    ctx.fill();
    ctx.stroke();

    // Crown crease
    ctx.strokeStyle = '#78350f';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(-9, 0);
    ctx.lineTo(-1, 0);
    ctx.stroke();

    // Gold sheriff star on front of crown
    drawMiniStar(ctx, 1.5, 0, 3.2, '#fde047', '#a16207');
  } else if (activeAcc === 'acc-pirate') {
    // Dark captain pirate hat with gold trim & tiny white skull/cross!
    ctx.fillStyle = '#1e293b';
    ctx.strokeStyle = '#facc15';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-2, -14.5);
    ctx.quadraticCurveTo(-13.5, -8, -14.5, 0);
    ctx.quadraticCurveTo(-13.5, 8, -2, 14.5);
    ctx.quadraticCurveTo(2.5, 6, 1.5, 0);
    ctx.quadraticCurveTo(2.5, -6, -2, -14.5);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Tiny white crossbones
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.4;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-9.5, -3.2);
    ctx.lineTo(-4.5, 3.2);
    ctx.moveTo(-9.5, 3.2);
    ctx.lineTo(-4.5, -3.2);
    ctx.stroke();

    // Tiny white skull
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(-6.8, 0, 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(-6.2, -0.9, 0.55, 0, Math.PI * 2);
    ctx.arc(-6.2, 0.9, 0.55, 0, Math.PI * 2);
    ctx.fill();
  } else if (activeAcc === 'acc-unicorn') {
    // Golden spiral unicorn horn + pastel ears!
    for (const side of [-1, 1]) {
      ctx.fillStyle = '#f3e8ff';
      ctx.strokeStyle = '#a855f7';
      ctx.lineWidth = 1.3;
      ctx.beginPath();
      ctx.moveTo(-3, side * 8.5);
      ctx.lineTo(1.5, side * 15);
      ctx.lineTo(4.5, side * 8);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#f9a8d4';
      ctx.beginPath();
      ctx.moveTo(-1.2, side * 9.2);
      ctx.lineTo(1.5, side * 13);
      ctx.lineTo(3, side * 8.8);
      ctx.closePath();
      ctx.fill();
    }

    // Golden spiral horn projecting forward
    ctx.fillStyle = '#facc15';
    ctx.strokeStyle = '#b45309';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(6.5, -3.2);
    ctx.lineTo(19, 0);
    ctx.lineTo(6.5, 3.2);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Spiral lines on horn
    ctx.strokeStyle = '#fef08a';
    ctx.lineWidth = 1.1;
    ctx.beginPath();
    ctx.moveTo(9.5, -2.2);
    ctx.lineTo(11.2, 1.9);
    ctx.moveTo(13, -1.4);
    ctx.lineTo(14.5, 1.1);
    ctx.stroke();
  } else if (activeAcc === 'acc-wizard') {
    // Midnight-blue wizard hat with gold stars!
    // Wide midnight-blue brim
    ctx.fillStyle = '#1e3a8a';
    ctx.strokeStyle = '#facc15';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.ellipse(-4, 0, 11.5, 13.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Pointed crooked wizard cone sweeping back
    ctx.fillStyle = '#172554';
    ctx.strokeStyle = '#60a5fa';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(-1, -7.5);
    ctx.quadraticCurveTo(-11, -5, -20, -2.5);
    ctx.quadraticCurveTo(-13, 3.5, -1, 7.5);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Gold stars on wizard hat
    drawMiniStar(ctx, -6, -3.2, 2.3, '#fde047', '#ca8a04');
    drawMiniStar(ctx, -11.5, 0.8, 2.1, '#fde047', '#ca8a04');
    drawMiniStar(ctx, -5, 4.5, 1.8, '#fef08a', '#ca8a04');
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
  } else if (trailId === 'trail-bubbles') {
    kind = 'bubble';
    color = Math.random() < 0.5 ? '#38bdf8' : '#f472b6';
  } else if (trailId === 'trail-hearts') {
    kind = 'heart';
    color = Math.random() < 0.5 ? '#f43f5e' : '#f472b6';
  } else if (trailId === 'trail-music') {
    kind = 'music';
    const noteColors = ['#a855f7', '#38bdf8', '#f43f5e', '#facc15', '#22c55e'];
    color = noteColors[Math.floor(Math.random() * noteColors.length)];
  } else if (trailId === 'trail-snow') {
    kind = 'snow';
    color = Math.random() < 0.5 ? '#ffffff' : '#67e8f9';
  } else if (trailId === 'trail-lightning') {
    kind = 'bolt';
    color = Math.random() < 0.5 ? '#facc15' : '#fef08a';
  } else if (trailId === 'trail-confetti') {
    kind = 'confetti';
    const confettiColors = [
      '#ef4444',
      '#f97316',
      '#facc15',
      '#22c55e',
      '#38bdf8',
      '#c084fc',
      '#f472b6',
    ];
    color = confettiColors[Math.floor(Math.random() * confettiColors.length)];
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
  } else if (p.kind === 'bubble') {
    const r = p.size * (0.85 + (p.life / p.maxLife) * 0.45);
    // Translucent pastel fill
    ctx.save();
    ctx.globalAlpha = alpha * 0.25;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Crisp colored ring
    ctx.strokeStyle = p.color;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.stroke();

    // White shine dot
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(-r * 0.32, -r * 0.32, Math.max(1.1, r * 0.24), 0, Math.PI * 2);
    ctx.fill();
  } else if (p.kind === 'heart') {
    const s = p.size * 0.85;
    ctx.beginPath();
    ctx.moveTo(0, s * 0.75);
    ctx.bezierCurveTo(-s * 1.15, s * 0.1, -s * 1.15, -s * 0.9, 0, -s * 0.3);
    ctx.bezierCurveTo(s * 1.15, -s * 0.9, s * 1.15, s * 0.1, 0, s * 0.75);
    ctx.closePath();
    ctx.fill();
  } else if (p.kind === 'music') {
    // Colorful eighth-note shape (unrotated slightly for readability)
    ctx.rotate(-p.rotation * 0.7);
    const s = p.size * 0.9;
    // Notehead
    ctx.beginPath();
    ctx.ellipse(-s * 0.2, s * 0.45, s * 0.48, s * 0.34, -0.35, 0, Math.PI * 2);
    ctx.fill();
    // Stem & flag
    ctx.strokeStyle = p.color;
    ctx.lineWidth = Math.max(1.5, s * 0.25);
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(s * 0.18, s * 0.38);
    ctx.lineTo(s * 0.18, -s * 0.85);
    ctx.quadraticCurveTo(s * 0.9, -s * 0.65, s * 0.75, -s * 0.1);
    ctx.stroke();
  } else if (p.kind === 'snow') {
    // Icy white/cyan 6-point crystal star
    const r = p.size * 1.05;
    ctx.strokeStyle = p.color;
    ctx.lineWidth = 1.4;
    ctx.lineCap = 'round';
    for (let i = 0; i < 3; i++) {
      const a = (i * Math.PI) / 3;
      const dx = Math.cos(a) * r;
      const dy = Math.sin(a) * r;
      ctx.beginPath();
      ctx.moveTo(-dx, -dy);
      ctx.lineTo(dx, dy);
      ctx.stroke();
    }
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(0, 0, Math.max(1.2, r * 0.24), 0, Math.PI * 2);
    ctx.fill();
  } else if (p.kind === 'bolt') {
    // Bright yellow zigzag lightning bolt
    const s = p.size * 1.1;
    ctx.beginPath();
    ctx.moveTo(s * 0.15, -s);
    ctx.lineTo(-s * 0.45, -s * 0.05);
    ctx.lineTo(s * 0.05, -s * 0.05);
    ctx.lineTo(-s * 0.25, s);
    ctx.lineTo(s * 0.45, 0);
    ctx.lineTo(-s * 0.02, 0);
    ctx.closePath();
    ctx.fill();
  } else if (p.kind === 'confetti') {
    // Colorful tumbling confetti rectangle
    const tumble = Math.max(0.25, Math.abs(Math.cos(p.rotation * 2)));
    ctx.fillRect(-p.size * 0.7, -p.size * 0.4 * tumble, p.size * 1.4, p.size * 0.8 * tumble);
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
