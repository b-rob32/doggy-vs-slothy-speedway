import React from 'react';
import {
  BarChart3,
  Bot,
  Check,
  Coins,
  Cpu,
  Pencil,
  ShoppingBag,
  Sparkles,
  Trophy,
  Users,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { SaveData, TeamId } from '../types';
import { getTeamMeta } from '../data/shop';

interface HomeScreenProps {
  save: SaveData;
  activeTeam: TeamId;
  onSelectTeam: (team: TeamId) => void;
  onStartMultiplayer: () => void;
  onStartSolo: () => void;
  onStartCoopBoss: () => void;
  onUpdateRacerName: (team: TeamId, name: string) => void;
  onClaimQuest: (team: TeamId, questId: string) => void;
  onOpenGarage: () => void;
  onOpenStats: () => void;
  onToggleMute: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  save,
  activeTeam,
  onSelectTeam,
  onStartMultiplayer,
  onStartSolo,
  onStartCoopBoss,
  onUpdateRacerName,
  onClaimQuest,
  onOpenGarage,
  onOpenStats,
  onToggleMute,
}) => {
  const doggyProfile = save.profiles.doggy;
  const slothyProfile = save.profiles.slothy;
  const activeProfile = save.profiles[activeTeam];
  const doggyMeta = getTeamMeta('doggy', doggyProfile.racerName);
  const slothyMeta = getTeamMeta('slothy', slothyProfile.racerName);
  const activeMeta = getTeamMeta(activeTeam, activeProfile.racerName);
  const quests = activeProfile.dailyQuests?.quests ?? [];

  return (
    <div className="screen home-screen">
      <div className="top-bar">
        <div className="brand-pill">🏁 Doggy vs. Slothy Speedway</div>
        <div className="top-bar-right">
          <div className="coin-pill">
            <Coins size={18} />
            <span>{activeProfile.coins}</span>
          </div>
          <button
            className="icon-btn"
            onClick={onToggleMute}
            aria-label={save.soundMuted ? 'Unmute sounds' : 'Mute sounds'}
            title={save.soundMuted ? 'Unmute sounds' : 'Mute sounds'}
          >
            {save.soundMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
          </button>
        </div>
      </div>

      {/* Hero Banner */}
      <div className="hero-card">
        <img
          src="./art/hero-banner.jpg"
          alt="Doggy and Slothy racing toward the checkered flag"
          className="hero-img"
        />
        <div className="hero-overlay">
          <h1 className="hero-title">DOGGY vs. SLOTHY</h1>
          <p className="hero-subtitle">SPEEDWAY MATH RACING!</p>
        </div>
      </div>

      {/* Head-to-Head Rivalry Scoreboard */}
      <div className="h2h-strip">
        <div className="h2h-side h2h-doggy">
          <span>🐶 {doggyMeta.shortName}</span>
          <strong>{save.headToHead.doggyWins}</strong>
        </div>
        <div className="h2h-center">
          <Trophy size={18} />
          <span>ALL-TIME WINS</span>
        </div>
        <div className="h2h-side h2h-slothy">
          <strong>{save.headToHead.slothyWins}</strong>
          <span>{slothyMeta.shortName} 🦥</span>
        </div>
      </div>

      {/* Team Picker */}
      <section className="section-block">
        <h2 className="section-label">Choose Your Racer</h2>
        <div className="team-picker-grid">
          {(['doggy', 'slothy'] as TeamId[]).map((team) => {
            const prof = team === 'doggy' ? doggyProfile : slothyProfile;
            const meta = getTeamMeta(team, prof.racerName);
            const selected = activeTeam === team;
            return (
              <div
                key={team}
                role="button"
                tabIndex={0}
                className={`team-card team-card--${team} ${
                  selected ? 'team-card--selected' : ''
                }`}
                style={{ cursor: 'pointer' }}
                onClick={() => onSelectTeam(team)}
                onKeyDown={(e) => {
                  if (
                    e.target === e.currentTarget &&
                    (e.key === 'Enter' || e.key === ' ')
                  ) {
                    e.preventDefault();
                    onSelectTeam(team);
                  }
                }}
              >
                <div className="team-card-avatar-wrap">
                  <img
                    src={meta.portrait}
                    alt={meta.name}
                    className="team-card-avatar"
                  />
                  {selected && <span className="selected-badge">PLAYING AS</span>}
                </div>
                <div className="team-card-info" style={{ flex: 1, minWidth: 0 }}>
                  <h3>{meta.name}</h3>
                  <div className="team-card-meta">
                    <span className="mini-coin">🪙 {prof.coins}</span>
                    <span>🏆 {prof.stats.wins} Wins</span>
                  </div>
                  <div
                    className="racer-name-input-wrap"
                    onClick={(e) => e.stopPropagation()}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      marginTop: '8px',
                      background: 'rgba(255, 255, 255, 0.85)',
                      border: `2px solid ${selected ? meta.border : '#e2e8f0'}`,
                      borderRadius: '10px',
                      padding: '4px 8px',
                    }}
                  >
                    <Pencil size={13} style={{ color: '#64748b', flexShrink: 0 }} />
                    <input
                      type="text"
                      value={prof.racerName}
                      maxLength={16}
                      placeholder="Type your name..."
                      aria-label={`Custom racer name for ${
                        team === 'doggy' ? 'Team Doggy' : 'Team Slothy'
                      }`}
                      onClick={(e) => e.stopPropagation()}
                      onFocus={(e) => e.stopPropagation()}
                      onChange={(e) => onUpdateRacerName(team, e.target.value)}
                      style={{
                        width: '100%',
                        border: 'none',
                        outline: 'none',
                        background: 'transparent',
                        fontFamily: 'inherit',
                        fontWeight: 800,
                        fontSize: '0.82rem',
                        color: '#1e293b',
                      }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Daily Quests Panel */}
      {quests.length > 0 && (
        <section
          className="daily-quests-card"
          style={{
            background: '#ffffff',
            borderRadius: '20px',
            border: '3px solid #fde68a',
            padding: '14px 16px',
            boxShadow: '0 10px 25px rgba(15, 23, 42, 0.08)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '8px',
              marginBottom: '10px',
            }}
          >
            <h3
              style={{
                margin: 0,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '1.08rem',
              }}
            >
              <Sparkles size={18} style={{ color: '#f59e0b' }} />
              <span>{activeMeta.shortName}&apos;s Daily Quests</span>
            </h3>
            <span
              style={{
                fontSize: '0.76rem',
                fontWeight: 900,
                color: '#92400e',
                background: '#fef3c7',
                padding: '3px 10px',
                borderRadius: '999px',
              }}
            >
              {quests.filter((q) => q.claimed).length}/{quests.length} Claimed
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {quests.map((q) => {
              const clampedProgress = Math.min(q.progress, q.target);
              const pct = Math.min(
                100,
                Math.round((clampedProgress / Math.max(1, q.target)) * 100)
              );
              const isReady = q.progress >= q.target && !q.claimed;

              return (
                <div
                  key={q.id}
                  className={`quest-row ${isReady ? 'quest-row--ready' : ''} ${
                    q.claimed ? 'quest-row--claimed' : ''
                  }`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '10px 12px',
                    borderRadius: '14px',
                    background: q.claimed
                      ? '#f0fdf4'
                      : isReady
                      ? '#fffbeb'
                      : '#f8fafc',
                    border: q.claimed
                      ? '2px solid #86efac'
                      : isReady
                      ? '2px solid #f59e0b'
                      : '2px solid #e2e8f0',
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: '8px',
                        marginBottom: '5px',
                        fontSize: '0.88rem',
                        fontWeight: 800,
                      }}
                    >
                      <span
                        style={{
                          color: q.claimed ? '#166534' : '#1e293b',
                        }}
                      >
                        {q.title}
                      </span>
                      <span style={{ color: '#64748b', fontSize: '0.78rem', whiteSpace: 'nowrap' }}>
                        {clampedProgress}/{q.target}
                      </span>
                    </div>
                    <div
                      style={{
                        height: '9px',
                        background: '#e2e8f0',
                        borderRadius: '999px',
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        style={{
                          width: `${pct}%`,
                          height: '100%',
                          borderRadius: '999px',
                          background: q.claimed
                            ? '#22c55e'
                            : isReady
                            ? 'linear-gradient(90deg, #f59e0b, #eab308)'
                            : `linear-gradient(90deg, ${activeMeta.primary}, ${activeMeta.secondary})`,
                          transition: 'width 0.3s ease',
                        }}
                      />
                    </div>
                  </div>

                  {q.claimed ? (
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        background: '#dcfce7',
                        color: '#166534',
                        padding: '6px 10px',
                        borderRadius: '12px',
                        fontWeight: 900,
                        fontSize: '0.8rem',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      <Check size={15} /> Done
                    </span>
                  ) : isReady ? (
                    <button
                      type="button"
                      className="quest-claim-btn"
                      onClick={() => onClaimQuest(activeTeam, q.id)}
                      style={{
                        background: 'linear-gradient(135deg, #facc15, #f59e0b)',
                        color: '#78350f',
                        padding: '7px 12px',
                        borderRadius: '12px',
                        fontWeight: 900,
                        fontSize: '0.84rem',
                        boxShadow:
                          '0 3px 0 #b45309, 0 0 14px rgba(250, 204, 21, 0.75)',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      Claim +{q.reward} 🪙
                    </button>
                  ) : (
                    <span
                      style={{
                        background: '#fef3c7',
                        color: '#92400e',
                        padding: '5px 10px',
                        borderRadius: '10px',
                        fontWeight: 900,
                        fontSize: '0.78rem',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      +{q.reward} 🪙
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Main Action Buttons */}
      <div className="home-actions">
        <button
          className="arcade-btn arcade-btn--primary"
          onClick={onStartMultiplayer}
        >
          <Users size={24} />
          <div className="btn-text">
            <strong>2-Player Race</strong>
            <span>Play on 2 tablets or laptops with a room code!</span>
          </div>
        </button>

        <button
          className="arcade-btn arcade-btn--boss"
          onClick={onStartCoopBoss}
          style={{
            background: 'linear-gradient(135deg, #9333ea, #ec4899, #f97316)',
            boxShadow: '0 5px 0 #7e22ce',
          }}
        >
          <Bot size={24} />
          <div className="btn-text">
            <strong>Co-Op vs. Mega-Bot!</strong>
            <span>Team up together (or solo) to beat the Math Boss!</span>
          </div>
        </button>

        <button className="arcade-btn arcade-btn--secondary" onClick={onStartSolo}>
          <Cpu size={24} />
          <div className="btn-text">
            <strong>Solo vs. CPU</strong>
            <span>Practice as {activeMeta.shortName} &amp; earn Speed Coins!</span>
          </div>
        </button>

        <div className="home-sub-actions">
          <button className="arcade-btn arcade-btn--gold" onClick={onOpenGarage}>
            <ShoppingBag size={22} />
            <span>Garage Shop</span>
          </button>

          <button className="arcade-btn arcade-btn--indigo" onClick={onOpenStats}>
            <BarChart3 size={22} />
            <span>Career Stats</span>
          </button>
        </div>
      </div>
    </div>
  );
};

