import React from 'react';
import {
  BarChart3,
  Coins,
  Cpu,
  ShoppingBag,
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
  onOpenGarage,
  onOpenStats,
  onToggleMute,
}) => {
  const doggyProfile = save.profiles.doggy;
  const slothyProfile = save.profiles.slothy;
  const activeProfile = save.profiles[activeTeam];
  const activeMeta = getTeamMeta(activeTeam);

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
          <span>🐶 Doggy</span>
          <strong>{save.headToHead.doggyWins}</strong>
        </div>
        <div className="h2h-center">
          <Trophy size={18} />
          <span>ALL-TIME WINS</span>
        </div>
        <div className="h2h-side h2h-slothy">
          <strong>{save.headToHead.slothyWins}</strong>
          <span>Slothy 🦥</span>
        </div>
      </div>

      {/* Team Picker */}
      <section className="section-block">
        <h2 className="section-label">Choose Your Racer</h2>
        <div className="team-picker-grid">
          {(['doggy', 'slothy'] as TeamId[]).map((team) => {
            const meta = getTeamMeta(team);
            const prof = team === 'doggy' ? doggyProfile : slothyProfile;
            const selected = activeTeam === team;
            return (
              <button
                key={team}
                className={`team-card team-card--${team} ${
                  selected ? 'team-card--selected' : ''
                }`}
                onClick={() => onSelectTeam(team)}
              >
                <div className="team-card-avatar-wrap">
                  <img
                    src={meta.portrait}
                    alt={meta.name}
                    className="team-card-avatar"
                  />
                  {selected && <span className="selected-badge">PLAYING AS</span>}
                </div>
                <div className="team-card-info">
                  <h3>{meta.name}</h3>
                  <div className="team-card-meta">
                    <span className="mini-coin">🪙 {prof.coins}</span>
                    <span>🏆 {prof.stats.wins} Wins</span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </section>

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
