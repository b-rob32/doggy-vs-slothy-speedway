import React, { useState } from 'react';
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  Copy,
  Download,
  Flame,
  Trophy,
  Upload,
  Zap,
} from 'lucide-react';
import { SaveData, SingleOperation, TeamId } from '../types';
import { getTeamMeta } from '../data/shop';
import { exportSaveCode, importSaveCode } from '../engine/storage';

interface StatsScreenProps {
  save: SaveData;
  activeTeam: TeamId;
  onSwitchTeam: (team: TeamId) => void;
  onImportSave: (imported: SaveData) => void;
  onBack: () => void;
}

const OP_LABELS: { id: SingleOperation; label: string; color: string }[] = [
  { id: 'addition', label: 'Addition (+)', color: '#3b82f6' },
  { id: 'subtraction', label: 'Subtraction (−)', color: '#8b5cf6' },
  { id: 'multiplication', label: 'Multiplication (×)', color: '#f59e0b' },
  { id: 'division', label: 'Division (÷)', color: '#10b981' },
];

export const StatsScreen: React.FC<StatsScreenProps> = ({
  save,
  activeTeam,
  onSwitchTeam,
  onImportSave,
  onBack,
}) => {
  const [showTransfer, setShowTransfer] = useState(false);
  const [importText, setImportText] = useState('');
  const [transferMsg, setTransferMsg] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const profile = save.profiles[activeTeam];
  const stats = profile.stats;
  const meta = getTeamMeta(activeTeam);

  const winRate =
    stats.totalRaces > 0
      ? Math.round((stats.wins / stats.totalRaces) * 100)
      : 0;
  const accuracy =
    stats.totalQuestions > 0
      ? Math.round((stats.totalCorrect / stats.totalQuestions) * 100)
      : 0;

  const handleCopyBackup = () => {
    const code = exportSaveCode(save);
    navigator.clipboard?.writeText(code).catch(() => {});
    setCopied(true);
    setTransferMsg('Backup code copied! Paste it on another tablet to transfer profiles.');
    window.setTimeout(() => setCopied(false), 2000);
  };

  const handleImport = () => {
    const parsed = importSaveCode(importText);
    if (!parsed) {
      setTransferMsg('Hmm, that backup code did not look valid. Please copy the full code!');
      return;
    }
    onImportSave(parsed);
    setImportText('');
    setTransferMsg('Profiles & Career Stats imported successfully! 🎉');
  };

  return (
    <div className="screen stats-screen">
      <div className="top-bar">
        <button className="back-btn" onClick={onBack}>
          <ArrowLeft size={20} /> Back
        </button>
        <h2 className="screen-title">📊 Career Stats</h2>
        <button
          className="transfer-btn"
          onClick={() => setShowTransfer((s) => !s)}
        >
          <Download size={16} /> Transfer
        </button>
      </div>

      {/* Transfer / Backup Drawer */}
      {showTransfer && (
        <div className="transfer-card">
          <h4>Sync / Backup Profiles Between Devices</h4>
          <p>
            Copy your save code from one tablet and paste it on another to move
            coins, cars, and lifetime stats!
          </p>
          <div className="transfer-actions">
            <button className="shop-btn shop-btn--equip" onClick={handleCopyBackup}>
              {copied ? <Check size={16} /> : <Copy size={16} />}
              {copied ? 'Copied Backup Code!' : 'Copy My Backup Code'}
            </button>
          </div>
          <div className="transfer-import-row">
            <input
              type="text"
              placeholder="Paste backup code here..."
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
            />
            <button
              className="shop-btn shop-btn--buy"
              disabled={!importText.trim()}
              onClick={handleImport}
            >
              <Upload size={16} /> Import
            </button>
          </div>
          {transferMsg && <div className="transfer-msg">{transferMsg}</div>}
        </div>
      )}

      {/* Overall Head-to-Head Rivalry */}
      <div className="h2h-strip">
        <div className="h2h-side h2h-doggy">
          <span>🐶 Doggy</span>
          <strong>{save.headToHead.doggyWins}</strong>
        </div>
        <div className="h2h-center">
          <Trophy size={16} />
          <span>ALL-TIME RIVALRY</span>
        </div>
        <div className="h2h-side h2h-slothy">
          <strong>{save.headToHead.slothyWins}</strong>
          <span>Slothy 🦥</span>
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
                activeTeam === t ? 'active' : ''
              }`}
              onClick={() => onSwitchTeam(t)}
            >
              {tm.emoji} {tm.name}
            </button>
          );
        })}
      </div>

      {/* Career Overview Cards */}
      <div className="career-grid">
        <div className="career-card">
          <Trophy size={22} className="career-ico career-ico--gold" />
          <strong>{stats.totalRaces}</strong>
          <span>Total Races</span>
          <small>
            {stats.wins}W – {stats.losses}L
            {stats.ties > 0 ? ` – ${stats.ties}T` : ''} ({winRate}%)
          </small>
        </div>

        <div className="career-card">
          <CheckCircle2 size={22} className="career-ico career-ico--green" />
          <strong>{accuracy}%</strong>
          <span>Lifetime Accuracy</span>
          <small>
            {stats.totalCorrect} / {stats.totalQuestions} solved
          </small>
        </div>

        <div className="career-card">
          <Zap size={22} className="career-ico career-ico--blue" />
          <strong>{stats.bestQpm}</strong>
          <span>Best Speed (QPM)</span>
          <small>Answers per minute</small>
        </div>

        <div className="career-card">
          <Flame size={22} className="career-ico career-ico--orange" />
          <strong>{stats.longestStreak}</strong>
          <span>Longest Streak</span>
          <small>Correct in a row</small>
        </div>
      </div>

      {/* Mastery by Math Operation */}
      <div className="mastery-card">
        <h3>{meta.name}&apos;s Math Mastery</h3>
        <div className="mastery-list">
          {OP_LABELS.map((op) => {
            const st = stats.byOperation[op.id];
            const pct =
              st.total > 0 ? Math.round((st.correct / st.total) * 100) : 0;
            return (
              <div key={op.id} className="mastery-row">
                <div className="mastery-row-head">
                  <span>{op.label}</span>
                  <strong>
                    {st.total > 0
                      ? `${pct}% (${st.correct}/${st.total})`
                      : 'Not raced yet'}
                  </strong>
                </div>
                <div className="mastery-bar-bg">
                  <div
                    className="mastery-bar-fill"
                    style={{
                      width: `${pct}%`,
                      backgroundColor: op.color,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Race History */}
      <div className="history-card">
        <h3>Recent Races ({profile.recentRaces.length})</h3>
        {profile.recentRaces.length === 0 ? (
          <p className="empty-history">
            No races yet for {meta.name}! Hit the speedway to start tracking
            stats!
          </p>
        ) : (
          <div className="history-list">
            {profile.recentRaces.map((r) => (
              <div key={r.id} className="history-row">
                <span className={`result-pill result-pill--${r.result}`}>
                  {r.result === 'win'
                    ? 'WIN 🏆'
                    : r.result === 'tie'
                    ? 'TIE 🤝'
                    : '2ND 💨'}
                </span>
                <div className="history-info">
                  <strong>
                    {r.operation.toUpperCase()} ({r.difficulty})
                  </strong>
                  <small>
                    {r.mode === 'multiplayer' ? '2-Player' : 'Solo vs CPU'} •{' '}
                    {r.correctCount}✓ {r.wrongCount}✗ • {r.qpm} QPM
                  </small>
                </div>
                <span className="history-coins">+{r.coinsEarned} 🪙</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
