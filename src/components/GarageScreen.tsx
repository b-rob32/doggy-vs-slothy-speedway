import React, { useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  Car,
  Check,
  Coins,
  Crown,
  Lock,
  Sparkles,
  Wrench,
} from 'lucide-react';
import { EquippedLoadout, ShopCategory, TeamId, TeamProfile } from '../types';
import { getEffectivePerks, getTeamMeta, SHOP_ITEMS } from '../data/shop';
import {
  drawRacerCar,
  drawTrailParticle,
  spawnTrailParticle,
  TrailParticle,
} from './CarRenderer';
import { arcadeAudio } from '../engine/audio';

interface GarageScreenProps {
  profile: TeamProfile;
  onSwitchTeam: (team: TeamId) => void;
  onBuyItem: (itemId: string) => void;
  onEquipItem: (category: ShopCategory, itemId: string) => void;
  onBack: () => void;
}

const CATEGORIES: {
  id: ShopCategory;
  label: string;
  icon: React.ReactNode;
}[] = [
  { id: 'car', label: 'Cars', icon: <Car size={18} /> },
  { id: 'gear', label: 'Gear', icon: <Wrench size={18} /> },
  { id: 'accessory', label: 'Accessories', icon: <Crown size={18} /> },
  { id: 'trail', label: 'Trails', icon: <Sparkles size={18} /> },
];

const GaragePreviewCanvas: React.FC<{
  team: TeamId;
  loadout: EquippedLoadout;
}> = ({ team, loadout }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const loadoutRef = useRef(loadout);
  const teamRef = useRef(team);
  loadoutRef.current = loadout;
  teamRef.current = team;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let raf = 0;
    let last = performance.now();
    let pTimer = 0;
    let roadOffset = 0;
    const particles: TrailParticle[] = [];

    const draw = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      roadOffset = (roadOffset + dt * 160) % 48;

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas.getBoundingClientRect();
      const w = Math.max(260, rect.width);
      const h = Math.max(130, rect.height);

      if (
        canvas.width !== Math.round(w * dpr) ||
        canvas.height !== Math.round(h * dpr)
      ) {
        canvas.width = Math.round(w * dpr);
        canvas.height = Math.round(h * dpr);
      }

      ctx.save();
      ctx.scale(dpr, dpr);

      // Asphalt garage test strip
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(0, 0, w, h);

      // Curbs top & bottom
      for (let x = -48; x < w + 48; x += 24) {
        const idx = Math.floor((x + roadOffset) / 24);
        ctx.fillStyle = idx % 2 === 0 ? '#ef4444' : '#ffffff';
        ctx.fillRect(x - (roadOffset % 24), 0, 24, 9);
        ctx.fillRect(x - (roadOffset % 24), h - 9, 24, 9);
      }

      // Dashed center road lines scrolling left
      ctx.fillStyle = 'rgba(255,255,255,0.45)';
      for (let x = -48; x < w + 48; x += 48) {
        ctx.fillRect(x - roadOffset, h / 2 - 2, 26, 4);
      }

      const carX = w * 0.56;
      const carY = h * 0.5 + Math.sin(now / 180) * 2.5;

      pTimer += dt;
      if (pTimer > 0.04) {
        pTimer = 0;
        const p = spawnTrailParticle(
          carX - 24,
          carY,
          0,
          teamRef.current,
          loadoutRef.current.trailId,
          false
        );
        p.vx = -150;
        p.vy = (Math.random() - 0.5) * 24;
        p.size *= 1.35;
        particles.push(p);
      }

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.life += dt;
        if (p.life >= p.maxLife) {
          particles.splice(i, 1);
        } else {
          p.x += p.vx * dt;
          p.y += p.vy * dt;
          p.rotation += dt * 4;
          drawTrailParticle(ctx, p);
        }
      }

      ctx.save();
      ctx.translate(carX, carY);
      drawRacerCar(ctx, teamRef.current, loadoutRef.current, now, {
        scale: 1.55,
      });
      ctx.restore();

      ctx.restore();
      raf = requestAnimationFrame(draw);
    };

    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, []);

  return <canvas ref={canvasRef} className="garage-preview-canvas" />;
};

export const GarageScreen: React.FC<GarageScreenProps> = ({
  profile,
  onSwitchTeam,
  onBuyItem,
  onEquipItem,
  onBack,
}) => {
  const [category, setCategory] = useState<ShopCategory>('car');
  const meta = getTeamMeta(profile.team);
  const perks = getEffectivePerks(profile.equipped, false);
  const items = SHOP_ITEMS.filter((i) => i.category === category);

  const isEquipped = (cat: ShopCategory, id: string) => {
    if (cat === 'car') return profile.equipped.carId === id;
    if (cat === 'gear') return profile.equipped.gearId === id;
    if (cat === 'accessory') return profile.equipped.accessoryId === id;
    return profile.equipped.trailId === id;
  };

  return (
    <div className="screen garage-screen">
      <div className="top-bar">
        <button className="back-btn" onClick={onBack}>
          <ArrowLeft size={20} /> Back
        </button>
        <h2 className="screen-title">🏎️ Speedway Garage</h2>
        <div className="coin-pill">
          <Coins size={18} />
          <span>{profile.coins}</span>
        </div>
      </div>

      {/* Team Switcher */}
      <div className="team-tabs">
        {(['doggy', 'slothy'] as TeamId[]).map((t) => {
          const tm = getTeamMeta(t);
          return (
            <button
              key={t}
              className={`team-tab team-tab--${t} ${
                profile.team === t ? 'active' : ''
              }`}
              onClick={() => onSwitchTeam(t)}
            >
              {tm.emoji} {tm.name}&apos;s Garage
            </button>
          );
        })}
      </div>

      {/* Live Preview Stage */}
      <div className="garage-stage">
        <GaragePreviewCanvas team={profile.team} loadout={profile.equipped} />
        <div className="garage-perks-strip">
          <span>
            ⚡ Speed: <strong>+{Math.round(perks.speedBonus * 100)}%</strong>
          </span>
          <span>
            🔥 Turbo:{' '}
            <strong>
              {perks.turboStreakReq}-streak
              {perks.turboBonus > 0
                ? ` (+${Math.round(perks.turboBonus * 100)}%)`
                : ''}
            </strong>
          </span>
          <span>
            🛞 Grip:{' '}
            <strong>
              -{Math.round(perks.spinoutReduction * 100)}% spin-out
            </strong>
          </span>
          <span>
            🪙 Coins: <strong>+{Math.round(perks.coinMultiplier * 100)}%</strong>
          </span>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="category-tabs">
        {CATEGORIES.map((c) => (
          <button
            key={c.id}
            className={`cat-tab ${category === c.id ? 'active' : ''}`}
            onClick={() => setCategory(c.id)}
          >
            {c.icon}
            <span>{c.label}</span>
          </button>
        ))}
      </div>

      {/* Items Grid */}
      <div className="shop-grid">
        {items.map((item) => {
          const owned = profile.unlockedIds.includes(item.id);
          const equipped = isEquipped(item.category, item.id);
          const canAfford = profile.coins >= item.price;

          return (
            <div
              key={item.id}
              className={`shop-card ${equipped ? 'shop-card--equipped' : ''}`}
            >
              <div className="shop-card-top">
                <h4>{item.name}</h4>
                <span className="perk-badge">{item.perkLabel}</span>
              </div>
              <p className="shop-card-desc">{item.description}</p>
              <div className="shop-card-footer">
                {equipped ? (
                  <button className="shop-btn shop-btn--equipped" disabled>
                    <Check size={16} /> Equipped on {meta.shortName}
                  </button>
                ) : owned ? (
                  <button
                    className="shop-btn shop-btn--equip"
                    onClick={() => {
                      arcadeAudio.playCoin();
                      onEquipItem(item.category, item.id);
                    }}
                  >
                    Equip
                  </button>
                ) : (
                  <button
                    className="shop-btn shop-btn--buy"
                    disabled={!canAfford}
                    onClick={() => {
                      arcadeAudio.playVictory();
                      onBuyItem(item.id);
                    }}
                  >
                    {canAfford ? <Coins size={16} /> : <Lock size={16} />}
                    Buy for {item.price} 🪙
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
