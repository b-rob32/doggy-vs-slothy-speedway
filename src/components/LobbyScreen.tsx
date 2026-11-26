import React, { useState } from 'react';
import {
  ArrowLeft,
  Check,
  Copy,
  Flag,
  Play,
  ShieldCheck,
  Sparkles,
  Wifi,
} from 'lucide-react';
import {
  CpuDifficulty,
  Difficulty,
  InputMode,
  LapPreset,
  Operation,
  PlayerMathConfig,
  RaceConfig,
  TeamId,
} from '../types';
import { getTeamMeta } from '../data/shop';

interface LobbyScreenProps {
  mode: 'solo' | 'multiplayer';
  myTeam: TeamId;
  config: RaceConfig;
  onChangeConfig: (next: RaceConfig) => void;
  // Multiplayer props
  mpRole: 'none' | 'host' | 'guest';
  roomCode: string;
  peerConnected: boolean;
  peerStatus: string;
  peerError: string | null;
  onHostRoom: () => void;
  onJoinRoom: (code: string) => void;
  onStartRace: () => void;
  onBack: () => void;
}

const OPERATIONS: { id: Operation; label: string; symbol: string }[] = [
  { id: 'addition', label: 'Add', symbol: '+' },
  { id: 'subtraction', label: 'Sub', symbol: '−' },
  { id: 'multiplication', label: 'Mult', symbol: '×' },
  { id: 'division', label: 'Div', symbol: '÷' },
  { id: 'mixed', label: 'Mixed', symbol: '★' },
];

const DIFFICULTIES: { id: Difficulty; label: string; hint: string }[] = [
  { id: 'easy', label: 'Easy', hint: 'Up to 10 / ×1–5' },
  { id: 'medium', label: 'Medium', hint: 'Up to 20 / ×2–10' },
  { id: 'hard', label: 'Hard', hint: 'Up to 95 / ×3–12' },
];

const MathConfigEditor: React.FC<{
  title: string;
  value: PlayerMathConfig;
  disabled?: boolean;
  onChange: (next: PlayerMathConfig) => void;
}> = ({ title, value, disabled, onChange }) => {
  return (
    <div className={`math-editor-card ${disabled ? 'is-disabled' : ''}`}>
      <div className="math-editor-title">{title}</div>

      <div className="field-group">
        <label>Math Mode</label>
        <div className="pill-row">
          {OPERATIONS.map((op) => (
            <button
              key={op.id}
              type="button"
              disabled={disabled}
              className={`pill-btn ${value.operation === op.id ? 'active' : ''}`}
              onClick={() =>
                onChange({
                  ...value,
                  operation: op.id,
                  timesTableFocus:
                    op.id === 'multiplication' ? value.timesTableFocus : null,
                })
              }
            >
              <span className="op-sym">{op.symbol}</span> {op.label}
            </button>
          ))}
        </div>
      </div>

      {value.operation === 'multiplication' && (
        <div className="field-group">
          <label>Times Table Focus (Optional)</label>
          <div className="times-grid">
            <button
              type="button"
              disabled={disabled}
              className={`tiny-pill ${value.timesTableFocus === null ? 'active' : ''}`}
              onClick={() => onChange({ ...value, timesTableFocus: null })}
            >
              All
            </button>
            {[2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((n) => (
              <button
                key={n}
                type="button"
                disabled={disabled}
                className={`tiny-pill ${value.timesTableFocus === n ? 'active' : ''}`}
                onClick={() => onChange({ ...value, timesTableFocus: n })}
              >
                ×{n}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="field-group">
        <label>Difficulty</label>
        <div className="pill-row pill-row--3">
          {DIFFICULTIES.map((d) => (
            <button
              key={d.id}
              type="button"
              disabled={disabled}
              className={`pill-btn pill-btn--stack ${
                value.difficulty === d.id ? 'active' : ''
              }`}
              onClick={() => onChange({ ...value, difficulty: d.id })}
            >
              <strong>{d.label}</strong>
              <small>{d.hint}</small>
            </button>
          ))}
        </div>
      </div>

      <div className="field-group">
        <label>Answer Style</label>
        <div className="pill-row pill-row--2">
          {(
            [
              { id: 'multiple-choice', label: '4 Big Buttons' },
              { id: 'type-answer', label: 'Type Number' },
            ] as { id: InputMode; label: string }[]
          ).map((m) => (
            <button
              key={m.id}
              type="button"
              disabled={disabled}
              className={`pill-btn ${value.inputMode === m.id ? 'active' : ''}`}
              onClick={() => onChange({ ...value, inputMode: m.id })}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export const LobbyScreen: React.FC<LobbyScreenProps> = ({
  mode,
  myTeam,
  config,
  onChangeConfig,
  mpRole,
  roomCode,
  peerConnected,
  peerStatus,
  peerError,
  onHostRoom,
  onJoinRoom,
  onStartRace,
  onBack,
}) => {
  const [joinInput, setJoinInput] = useState('');
  const [copied, setCopied] = useState(false);

  const myMeta = getTeamMeta(myTeam);
  const oppTeam: TeamId = myTeam === 'doggy' ? 'slothy' : 'doggy';
  const oppMeta = getTeamMeta(oppTeam);

  const isGuest = mode === 'multiplayer' && mpRole === 'guest';

  const handleCopyCode = () => {
    if (!roomCode) return;
    navigator.clipboard?.writeText(roomCode).catch(() => {});
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div className="screen lobby-screen">
      <div className="top-bar">
        <button className="back-btn" onClick={onBack}>
          <ArrowLeft size={20} /> Back
        </button>
        <h2 className="screen-title">
          {mode === 'multiplayer' ? '2-Player Race Lobby' : 'Solo vs. CPU Setup'}
        </h2>
        <div className="team-badge-mini">
          {myMeta.emoji} {myMeta.shortName}
        </div>
      </div>

      {/* 2-Player Room Connection Panel */}
      {mode === 'multiplayer' && (
        <div className="mp-card">
          {mpRole === 'none' ? (
            <div className="mp-choice-grid">
              <div className="mp-choice-box">
                <h3>1. Start a Room (Host)</h3>
                <p>
                  Create a 4-letter room code on this device so your sister can join
                  from hers!
                </p>
                <button
                  className="arcade-btn arcade-btn--primary"
                  onClick={onHostRoom}
                >
                  <Wifi size={20} /> Create Room Code
                </button>
              </div>

              <div className="mp-choice-box">
                <h3>2. Join a Room</h3>
                <p>Type the 4-letter code shown on the other device:</p>
                <div className="join-row">
                  <input
                    type="text"
                    maxLength={4}
                    placeholder="ABCD"
                    value={joinInput}
                    onChange={(e) =>
                      setJoinInput(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))
                    }
                    className="code-input"
                  />
                  <button
                    className="arcade-btn arcade-btn--secondary"
                    disabled={joinInput.length < 4}
                    onClick={() => onJoinRoom(joinInput)}
                  >
                    Join
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="mp-connected-box">
              <div className="room-code-display">
                <span className="room-code-label">ROOM CODE</span>
                <div className="room-code-value">
                  <strong>{roomCode || '....'}</strong>
                  {roomCode && (
                    <button
                      className="copy-btn"
                      onClick={handleCopyCode}
                      title="Copy room code"
                    >
                      {copied ? <Check size={16} /> : <Copy size={16} />}
                      {copied ? 'Copied!' : 'Copy'}
                    </button>
                  )}
                </div>
              </div>

              <div
                className={`connection-pill ${
                  peerConnected ? 'connected' : 'waiting'
                }`}
              >
                <span className="status-dot" />
                <span>{peerStatus}</span>
              </div>

              <div className="matchup-strip">
                <div className="matchup-racer">
                  <img src={myMeta.portrait} alt={myMeta.name} />
                  <span>{myMeta.name} (You)</span>
                </div>
                <span className="vs-badge">VS</span>
                <div className="matchup-racer">
                  <img src={oppMeta.portrait} alt={oppMeta.name} />
                  <span>
                    {oppMeta.name} {peerConnected ? '(Ready!)' : '(Waiting...)'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {peerError && <div className="error-banner">{peerError}</div>}
        </div>
      )}

      {/* Race Settings (shown in Solo or once Host/Guest is active) */}
      {(mode === 'solo' || mpRole !== 'none') && (
        <div className="lobby-config-grid">
          {/* Format & Track Options */}
          <div className="config-card">
            <h3 className="config-card-title">
              <Flag size={18} /> Race Format
            </h3>

            <div className="field-group">
              <label>Race Type</label>
              <div className="pill-row pill-row--2">
                <button
                  type="button"
                  disabled={isGuest}
                  className={`pill-btn ${config.format === 'laps' ? 'active' : ''}`}
                  onClick={() => onChangeConfig({ ...config, format: 'laps' })}
                >
                  🏁 Lap Race
                </button>
                <button
                  type="button"
                  disabled={isGuest}
                  className={`pill-btn ${config.format === 'sprint' ? 'active' : ''}`}
                  onClick={() => onChangeConfig({ ...config, format: 'sprint' })}
                >
                  ⏱️ 60s Timed Sprint
                </button>
              </div>
            </div>

            {config.format === 'laps' && (
              <div className="field-group">
                <label>Race Length</label>
                <div className="pill-row pill-row--3">
                  {(
                    [
                      { id: 'quick', label: 'Quick', hint: '2 Laps' },
                      { id: 'standard', label: 'Standard', hint: '3 Laps' },
                      { id: 'long', label: 'Long', hint: '5 Laps' },
                    ] as { id: LapPreset; label: string; hint: string }[]
                  ).map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      disabled={isGuest}
                      className={`pill-btn pill-btn--stack ${
                        config.lapPreset === p.id ? 'active' : ''
                      }`}
                      onClick={() => onChangeConfig({ ...config, lapPreset: p.id })}
                    >
                      <strong>{p.label}</strong>
                      <small>{p.hint}</small>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {mode === 'solo' && (
              <div className="field-group">
                <label>CPU Speed ({oppMeta.shortName})</label>
                <div className="pill-row pill-row--3">
                  {(
                    [
                      { id: 'easy', label: 'Chill', hint: 'Great for warmups' },
                      { id: 'medium', label: 'Speedy', hint: 'Fun challenge' },
                      { id: 'fast', label: 'Turbo Pro', hint: 'Super fast!' },
                    ] as { id: CpuDifficulty; label: string; hint: string }[]
                  ).map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      className={`pill-btn pill-btn--stack ${
                        config.cpuDifficulty === c.id ? 'active' : ''
                      }`}
                      onClick={() =>
                        onChangeConfig({ ...config, cpuDifficulty: c.id })
                      }
                    >
                      <strong>{c.label}</strong>
                      <small>{c.hint}</small>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Toggles */}
            {mode === 'multiplayer' && (
              <div className="toggle-list">
                <label className="toggle-row">
                  <div>
                    <strong>
                      <Sparkles size={15} /> Custom Math per Player
                    </strong>
                    <small>
                      Let each sister pick her own math mode &amp; difficulty!
                    </small>
                  </div>
                  <input
                    type="checkbox"
                    disabled={isGuest}
                    checked={!config.sharedMath}
                    onChange={(e) =>
                      onChangeConfig({
                        ...config,
                        sharedMath: !e.target.checked,
                      })
                    }
                  />
                </label>

                <label className="toggle-row">
                  <div>
                    <strong>
                      <ShieldCheck size={15} /> Fair Race (No Garage Perks)
                    </strong>
                    <small>
                      Keep cool cars &amp; trails, but make speed 100% math-only.
                    </small>
                  </div>
                  <input
                    type="checkbox"
                    disabled={isGuest}
                    checked={config.fairRaceNoPerks}
                    onChange={(e) =>
                      onChangeConfig({
                        ...config,
                        fairRaceNoPerks: e.target.checked,
                      })
                    }
                  />
                </label>
              </div>
            )}
          </div>

          {/* Math Settings */}
          {mode === 'solo' || config.sharedMath ? (
            <MathConfigEditor
              title={
                mode === 'solo'
                  ? `${myMeta.name}'s Math Settings`
                  : 'Shared Math Settings (Both Players)'
              }
              value={config.hostMath}
              disabled={isGuest}
              onChange={(next) =>
                onChangeConfig({
                  ...config,
                  hostMath: next,
                  guestMath: config.sharedMath ? next : config.guestMath,
                })
              }
            />
          ) : (
            <MathConfigEditor
              title={
                isGuest
                  ? `${myMeta.name}'s Custom Math Settings (Yours)`
                  : `${myMeta.name}'s Custom Math Settings (Host)`
              }
              value={isGuest ? config.guestMath : config.hostMath}
              disabled={false}
              onChange={(next) =>
                onChangeConfig(
                  isGuest
                    ? { ...config, guestMath: next }
                    : { ...config, hostMath: next }
                )
              }
            />
          )}
        </div>
      )}

      {/* Start Button */}
      {(mode === 'solo' || mpRole === 'host') && (
        <div className="lobby-footer">
          <button
            className="arcade-btn arcade-btn--start"
            disabled={mode === 'multiplayer' && !peerConnected}
            onClick={onStartRace}
          >
            <Play size={24} />
            {mode === 'multiplayer'
              ? peerConnected
                ? 'START 2-PLAYER RACE!'
                : 'Waiting for Sister to Join...'
              : 'START RACE!'}
          </button>
        </div>
      )}

      {isGuest && (
        <div className="lobby-footer">
          <div className="waiting-host-banner">
            {peerConnected
              ? 'Connected! Waiting for Host to press START RACE...'
              : 'Connecting to Host...'}
          </div>
        </div>
      )}
    </div>
  );
};
