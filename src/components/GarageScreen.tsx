import React, { useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  Car,
  Check,
  Coins,
  Crown,
  Eye,
  Lock,
  Map as MapIcon,
  PartyPopper,
  Play,
  Radio,
  RotateCcw,
  Sparkles,
  Square,
  Volume2,
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
import { runCelebrationAnimation } from '../engine/celebrations';

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
  { id: 'car', label: 'Cars', icon: <Car size={16} /> },
  { id: 'gear', label: 'Gear', icon: <Wrench size={16} /> },
  { id: 'accessory', label: 'Style', icon: <Crown size={16} /> },
  { id: 'trail', label: 'Trails', icon: <Sparkles size={16} /> },
  { id: 'track', label: 'Tracks', icon: <MapIcon size={16} /> },
  { id: 'sound', label: 'Sounds', icon: <Volume2 size={16} /> },
  { id: 'radio', label: 'Radio', icon: <Radio size={16} /> },
  { id: 'celebration', label: 'Win Show', icon: <PartyPopper size={16} /> },
];

const TRACK_SWATCHES: Record<string, string[]> = {
  'track-sunny': ['#4ade80', '#22c55e', '#334155', '#ef4444', '#ffffff'],
  'track-candy': ['#fbcfe8', '#f472b6', '#78350f', '#fb7185', '#fef08a'],
  'track-beach': ['#22d3ee', '#06b6d4', '#fde68a', '#d97706', '#fb7185'],
  'track-snow': ['#e0f2fe', '#7dd3fc', '#38bdf8', '#15803d', '#ffffff'],
  'track-space': ['#1e1b4b', '#6366f1', '#ec4899', '#22d3ee', '#facc15'],
  'track-coral': ['#0891b2', '#22d3ee', '#fb7185', '#f472b6', '#fde047'],
  'track-forest': ['#166534', '#22c55e', '#84cc16', '#92400e', '#fef08a'],
  'track-volcano': ['#1c1917', '#dc2626', '#f97316', '#facc15', '#44403c'],
  'track-neon': ['#0f172a', '#d946ef', '#06b6d4', '#a855f7', '#22d3ee'],
};

const TRACK_ROAD_THEME: Record<
  string,
  { road: string; curbA: string; curbB: string; dash: string }
> = {
  'track-sunny': {
    road: '#1e293b',
    curbA: '#ef4444',
    curbB: '#ffffff',
    dash: 'rgba(255,255,255,0.45)',
  },
  'track-candy': {
    road: '#5c2d16',
    curbA: '#f472b6',
    curbB: '#ffffff',
    dash: '#fbcfe8',
  },
  'track-beach': {
    road: '#92400e',
    curbA: '#22d3ee',
    curbB: '#fde68a',
    dash: 'rgba(254, 243, 199, 0.7)',
  },
  'track-snow': {
    road: '#0284c7',
    curbA: '#ef4444',
    curbB: '#f0f9ff',
    dash: 'rgba(255,255,255,0.75)',
  },
  'track-space': {
    road: '#1e1b4b',
    curbA: '#ec4899',
    curbB: '#22d3ee',
    dash: '#fde047',
  },
  'track-coral': {
    road: '#164e63',
    curbA: '#fb7185',
    curbB: '#67e8f9',
    dash: 'rgba(165, 243, 252, 0.78)',
  },
  'track-forest': {
    road: '#3f2e21',
    curbA: '#22c55e',
    curbB: '#bef264',
    dash: 'rgba(254, 240, 138, 0.72)',
  },
  'track-volcano': {
    road: '#292524',
    curbA: '#f97316',
    curbB: '#facc15',
    dash: 'rgba(251, 146, 60, 0.85)',
  },
  'track-neon': {
    road: '#0f172a',
    curbA: '#d946ef',
    curbB: '#06b6d4',
    dash: '#22d3ee',
  },
};

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

      const theme =
        TRACK_ROAD_THEME[loadoutRef.current.trackId] ??
        TRACK_ROAD_THEME['track-sunny'];

      ctx.fillStyle = theme.road;
      ctx.fillRect(0, 0, w, h);

      // Subtle stars on space track
      if (loadoutRef.current.trackId === 'track-space') {
        ctx.fillStyle = 'rgba(255,255,255,0.55)';
        for (let i = 0; i < 18; i++) {
          const sx = ((i * 73 - roadOffset * 2) % w + w) % w;
          const sy = 16 + ((i * 41) % (h - 32));
          ctx.fillRect(sx, sy, 2.5, 2.5);
        }
      }

      for (let x = -48; x < w + 48; x += 24) {
        const idx = Math.floor((x + roadOffset) / 24);
        ctx.fillStyle = idx % 2 === 0 ? theme.curbA : theme.curbB;
        ctx.fillRect(x - (roadOffset % 24), 0, 24, 9);
        ctx.fillRect(x - (roadOffset % 24), h - 9, 24, 9);
      }

      ctx.fillStyle = theme.dash;
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

function categoryToLoadoutKey(cat: ShopCategory): keyof EquippedLoadout {
  switch (cat) {
    case 'car':
      return 'carId';
    case 'gear':
      return 'gearId';
    case 'accessory':
      return 'accessoryId';
    case 'trail':
      return 'trailId';
    case 'track':
      return 'trackId';
    case 'sound':
      return 'soundId';
    case 'radio':
      return 'radioId';
    case 'celebration':
      return 'celebrationId';
  }
}

export const GarageScreen: React.FC<GarageScreenProps> = ({
  profile,
  onSwitchTeam,
  onBuyItem,
  onEquipItem,
  onBack,
}) => {
  const [category, setCategory] = useState<ShopCategory>('car');
  const [previewOverrides, setPreviewOverrides] = useState<
    Partial<EquippedLoadout>
  >({});
  const [previewingRadio, setPreviewingRadio] = useState<string | null>(null);
  const celCleanupRef = useRef<(() => void) | null>(null);

  const previewLoadout: EquippedLoadout = {
    ...profile.equipped,
    ...previewOverrides,
  };

  const hasPreview = Object.keys(previewOverrides).length > 0;
  const meta = getTeamMeta(profile.team, profile.racerName);
  const perks = getEffectivePerks(previewLoadout, false);
  const items = SHOP_ITEMS.filter((i) => i.category === category);

  useEffect(() => {
    return () => {
      arcadeAudio.stopRadio();
      celCleanupRef.current?.();
    };
  }, []);

  // Clear try-on preview when switching teams
  useEffect(() => {
    setPreviewOverrides({});
  }, [profile.team]);

  const stopRadioPreview = () => {
    arcadeAudio.stopRadio();
    setPreviewingRadio(null);
  };

  const handleToggleRadioPreview = (radioId: string) => {
    if (previewingRadio === radioId) {
      stopRadioPreview();
    } else {
      arcadeAudio.startRadio(radioId);
      setPreviewingRadio(radioId);
    }
  };

  const handlePreviewCelebration = (celId: string) => {
    celCleanupRef.current?.();
    arcadeAudio.playVictory(celId);
    celCleanupRef.current = runCelebrationAnimation(celId, profile.team);
  };

  const handleSelectCardForPreview = (cat: ShopCategory, itemId: string) => {
    if (cat === 'sound') {
      arcadeAudio.previewSound(itemId);
      return;
    }
    if (cat === 'radio') {
      if (itemId === 'radio-off') stopRadioPreview();
      else handleToggleRadioPreview(itemId);
      return;
    }
    if (cat === 'celebration') {
      handlePreviewCelebration(itemId);
      return;
    }

    const key = categoryToLoadoutKey(cat);
    setPreviewOverrides((prev) => {
      // If clicking the already-equipped item, clear the override for this category
      if (profile.equipped[key] === itemId) {
        const next = { ...prev };
        delete next[key];
        return next;
      }
      return { ...prev, [key]: itemId };
    });
  };

  const clearCategoryOverride = (cat: ShopCategory) => {
    const key = categoryToLoadoutKey(cat);
    setPreviewOverrides((prev) => {
      if (!(key in prev)) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const isEquipped = (cat: ShopCategory, id: string) => {
    return profile.equipped[categoryToLoadoutKey(cat)] === id;
  };

  const isPreviewed = (cat: ShopCategory, id: string) => {
    const key = categoryToLoadoutKey(cat);
    return previewOverrides[key] === id;
  };

  const isVisualPreviewCategory =
    category === 'car' ||
    category === 'gear' ||
    category === 'accessory' ||
    category === 'trail' ||
    category === 'track';

  return (
    <div className="screen garage-screen">
      <div className="top-bar">
        <button
          className="back-btn"
          onClick={() => {
            stopRadioPreview();
            onBack();
          }}
        >
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
        <GaragePreviewCanvas team={profile.team} loadout={previewLoadout} />

        {hasPreview && (
          <div className="preview-active-bar">
            <span>
              <Eye size={15} /> Try-On Preview active! Tap any item below to try
              it on {meta.shortName}.
            </span>
            <button
              type="button"
              className="preview-reset-btn"
              onClick={() => setPreviewOverrides({})}
            >
              <RotateCcw size={13} /> Reset
            </button>
          </div>
        )}

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
      <div className="category-tabs category-tabs--wrap">
        {CATEGORIES.map((c) => (
          <button
            key={c.id}
            className={`cat-tab ${category === c.id ? 'active' : ''}`}
            onClick={() => {
              if (c.id !== 'radio') stopRadioPreview();
              setCategory(c.id);
            }}
          >
            {c.icon}
            <span>{c.label}</span>
          </button>
        ))}
      </div>

      {isVisualPreviewCategory && (
        <div className="garage-hint">
          👀 Tap any card to try it on {meta.shortName} before buying!
        </div>
      )}

      {/* Items Grid */}
      <div className="shop-grid">
        {items.map((item) => {
          const owned = profile.unlockedIds.includes(item.id);
          const equipped = isEquipped(item.category, item.id);
          const previewed = isPreviewed(item.category, item.id);
          const canAfford = profile.coins >= item.price;

          return (
            <div
              key={item.id}
              role="button"
              tabIndex={0}
              onClick={() => handleSelectCardForPreview(item.category, item.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleSelectCardForPreview(item.category, item.id);
                }
              }}
              className={`shop-card shop-card--interactive ${
                equipped ? 'shop-card--equipped' : ''
              } ${previewed ? 'shop-card--previewing' : ''}`}
            >
              <div className="shop-card-top">
                <div className="shop-card-title-row">
                  <h4>{item.name}</h4>
                  {previewed && (
                    <span className="previewing-pill">
                      <Eye size={12} /> Trying On
                    </span>
                  )}
                  {item.category === 'sound' && (
                    <button
                      type="button"
                      className="preview-mini-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        arcadeAudio.previewSound(item.id);
                      }}
                      title="Hear this car sound!"
                    >
                      <Volume2 size={14} /> Test
                    </button>
                  )}
                  {item.category === 'radio' && item.id !== 'radio-off' && (
                    <button
                      type="button"
                      className={`preview-mini-btn ${
                        previewingRadio === item.id ? 'is-active' : ''
                      }`}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleRadioPreview(item.id);
                      }}
                      title="Listen to this radio station!"
                    >
                      {previewingRadio === item.id ? (
                        <>
                          <Square size={12} /> Stop
                        </>
                      ) : (
                        <>
                          <Play size={12} /> Listen
                        </>
                      )}
                    </button>
                  )}
                  {item.category === 'celebration' && (
                    <button
                      type="button"
                      className="preview-mini-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePreviewCelebration(item.id);
                      }}
                      title="Preview this celebration!"
                    >
                      <PartyPopper size={14} /> Watch
                    </button>
                  )}
                </div>
                <span className="perk-badge">{item.perkLabel}</span>
              </div>
              {item.category === 'track' && TRACK_SWATCHES[item.id] && (
                <div
                  className="track-swatch-bar"
                  aria-label={`${item.name} theme colors`}
                  style={{
                    display: 'flex',
                    height: '16px',
                    borderRadius: '999px',
                    overflow: 'hidden',
                    border: '2px solid #cbd5e1',
                    boxShadow: 'inset 0 1px 2px rgba(15, 23, 42, 0.12)',
                  }}
                >
                  {TRACK_SWATCHES[item.id].map((color, idx) => (
                    <span
                      key={idx}
                      style={{
                        flex: 1,
                        backgroundColor: color,
                      }}
                    />
                  ))}
                </div>
              )}
              <p className="shop-card-desc">{item.description}</p>
              <div className="shop-card-footer">
                {equipped ? (
                  <button
                    className="shop-btn shop-btn--equipped"
                    disabled
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Check size={16} /> Equipped on {meta.shortName}
                  </button>
                ) : owned ? (
                  <button
                    className="shop-btn shop-btn--equip"
                    onClick={(e) => {
                      e.stopPropagation();
                      clearCategoryOverride(item.category);
                      if (item.category === 'sound') {
                        arcadeAudio.previewSound(item.id);
                      } else {
                        arcadeAudio.playCoin();
                      }
                      onEquipItem(item.category, item.id);
                    }}
                  >
                    Equip
                  </button>
                ) : (
                  <button
                    className="shop-btn shop-btn--buy"
                    disabled={!canAfford}
                    onClick={(e) => {
                      e.stopPropagation();
                      clearCategoryOverride(item.category);
                      arcadeAudio.playVictory(
                        item.category === 'celebration' ? item.id : undefined
                      );
                      if (item.category === 'celebration') {
                        handlePreviewCelebration(item.id);
                      }
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
