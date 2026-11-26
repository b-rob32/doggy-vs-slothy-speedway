import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  EquippedLoadout,
  GameMode,
  PeerMessage,
  PlayerMathConfig,
  RaceConfig,
  RaceSummary,
  RacerLiveState,
  SaveData,
  ShopCategory,
  TeamId,
} from './types';
import { DEFAULT_LOADOUT, getShopItem } from './data/shop';
import { arcadeAudio } from './engine/audio';
import {
  claimQuestReward,
  loadSaveData,
  persistSaveData,
  recordRaceInSave,
} from './engine/storage';
import { SpeedwayPeer } from './engine/peer';
import { HomeScreen } from './components/HomeScreen';
import { LobbyScreen } from './components/LobbyScreen';
import { RaceScreen } from './components/RaceScreen';
import { PodiumScreen } from './components/PodiumScreen';
import { GarageScreen } from './components/GarageScreen';
import { StatsScreen } from './components/StatsScreen';

type ScreenName = 'home' | 'lobby' | 'race' | 'podium' | 'garage' | 'stats';

const DEFAULT_MATH: PlayerMathConfig = {
  operation: 'multiplication',
  difficulty: 'medium',
  timesTableFocus: null,
  inputMode: 'multiple-choice',
  smartPractice: true,
};

const DEFAULT_RACE_CONFIG: RaceConfig = {
  format: 'laps',
  lapPreset: 'standard',
  sprintSeconds: 60,
  sharedMath: true,
  fairRaceNoPerks: false,
  powerUpsEnabled: true,
  trackId: 'track-sunny',
  hostMath: { ...DEFAULT_MATH },
  guestMath: { ...DEFAULT_MATH },
  cpuDifficulty: 'medium',
};

export const App: React.FC = () => {
  const [save, setSave] = useState<SaveData>(() => {
    const loaded = loadSaveData();
    arcadeAudio.muted = loaded.soundMuted;
    return loaded;
  });

  const [screen, setScreen] = useState<ScreenName>('home');
  const [activeTeam, setActiveTeam] = useState<TeamId>('doggy');
  const [mode, setMode] = useState<GameMode>('solo');
  const [raceConfig, setRaceConfig] = useState<RaceConfig>(DEFAULT_RACE_CONFIG);
  const [raceKey, setRaceKey] = useState(0);

  // Multiplayer state
  const peerRef = useRef<SpeedwayPeer | null>(null);
  const [mpRole, setMpRole] = useState<'none' | 'host' | 'guest'>('none');
  const [roomCode, setRoomCode] = useState('');
  const [peerConnected, setPeerConnected] = useState(false);
  const [peerStatus, setPeerStatus] = useState('');
  const [peerError, setPeerError] = useState<string | null>(null);
  const [opponentLoadout, setOpponentLoadout] =
    useState<EquippedLoadout>(DEFAULT_LOADOUT);
  const [remoteOpponentName, setRemoteOpponentName] = useState('');
  const [remoteOpponentState, setRemoteOpponentState] =
    useState<RacerLiveState | null>(null);

  // Post-race state
  const [lastSummary, setLastSummary] = useState<RaceSummary | null>(null);
  const [rematchStatus, setRematchStatus] = useState<string | null>(null);
  const peerRequestedRematchRef = useRef(false);
  const iRequestedRematchRef = useRef(false);

  const activeTeamRef = useRef(activeTeam);
  const raceConfigRef = useRef(raceConfig);
  const saveRef = useRef(save);
  const modeRef = useRef(mode);
  const oppLoadoutRef = useRef(opponentLoadout);

  activeTeamRef.current = activeTeam;
  raceConfigRef.current = raceConfig;
  saveRef.current = save;
  modeRef.current = mode;
  oppLoadoutRef.current = opponentLoadout;

  useEffect(() => {
    persistSaveData(save);
    arcadeAudio.muted = save.soundMuted;
  }, [save]);

  const cleanupPeer = useCallback(() => {
    peerRef.current?.destroy();
    peerRef.current = null;
    setMpRole('none');
    setRoomCode('');
    setPeerConnected(false);
    setPeerStatus('');
    setPeerError(null);
    setRemoteOpponentName('');
    setRemoteOpponentState(null);
    setRematchStatus(null);
    peerRequestedRematchRef.current = false;
    iRequestedRematchRef.current = false;
  }, []);

  useEffect(() => {
    return () => {
      peerRef.current?.destroy();
    };
  }, []);

  const launchRace = useCallback((cfg: RaceConfig, nextMode?: GameMode) => {
    if (nextMode) setMode(nextMode);
    const oppTeam: TeamId = activeTeamRef.current === 'doggy' ? 'slothy' : 'doggy';
    setRaceConfig(cfg);
    setRemoteOpponentState({
      team: oppTeam,
      progress: 0,
      correctCount: 0,
      wrongCount: 0,
      streak: 0,
      bestStreak: 0,
      turboUntil: 0,
      spinoutUntil: 0,
      shieldActive: false,
      finished: false,
      finishTimeMs: null,
      loadout: oppLoadoutRef.current,
    });
    setRematchStatus(null);
    peerRequestedRematchRef.current = false;
    iRequestedRematchRef.current = false;
    setRaceKey((k) => k + 1);
    setScreen('race');
  }, []);

  const handlePeerMessage = useCallback(
    (msg: PeerMessage) => {
      if (msg.type === 'hello') {
        const hostTeam = activeTeamRef.current;
        const guestTeam: TeamId = hostTeam === 'doggy' ? 'slothy' : 'doggy';
        setOpponentLoadout(msg.loadout);
        setRemoteOpponentName(msg.racerName || '');
        peerRef.current?.send({
          type: 'lobby-state',
          mode: modeRef.current,
          config: raceConfigRef.current,
          hostTeam,
          hostName: saveRef.current.profiles[hostTeam].racerName,
          hostLoadout: saveRef.current.profiles[hostTeam].equipped,
          guestTeam,
          guestName: msg.racerName || '',
          guestLoadout: msg.loadout,
        });
      } else if (msg.type === 'lobby-state') {
        setMode(msg.mode);
        setActiveTeam(msg.guestTeam);
        setOpponentLoadout(msg.hostLoadout);
        setRemoteOpponentName(msg.hostName || '');
        setRaceConfig(msg.config);
      } else if (msg.type === 'guest-update') {
        setOpponentLoadout(msg.loadout);
        setRemoteOpponentName(msg.guestName || '');
        setRaceConfig((prev) => ({
          ...prev,
          guestMath: msg.guestMath,
        }));
      } else if (msg.type === 'start-race') {
        launchRace(msg.config, msg.mode);
      } else if (msg.type === 'progress') {
        const oppTeam: TeamId =
          activeTeamRef.current === 'doggy' ? 'slothy' : 'doggy';
        setRemoteOpponentState((prev) => ({
          team: oppTeam,
          progress: msg.progress,
          correctCount: msg.correctCount,
          wrongCount: msg.wrongCount,
          streak: msg.streak,
          bestStreak: msg.bestStreak,
          turboUntil: msg.turboActive ? Date.now() + 2200 : prev?.turboUntil ?? 0,
          spinoutUntil: msg.spinoutActive ? Date.now() + 800 : 0,
          shieldActive: msg.shieldActive ?? false,
          finished: msg.finished,
          finishTimeMs: msg.finishTimeMs,
          loadout: oppLoadoutRef.current,
        }));
      } else if (msg.type === 'rematch-request') {
        peerRequestedRematchRef.current = true;
        if (iRequestedRematchRef.current) {
          peerRef.current?.send({ type: 'rematch-accept' });
          launchRace(raceConfigRef.current);
        } else {
          setRematchStatus('Your sister wants a REMATCH! Tap "Race Again!" 🏁');
        }
      } else if (msg.type === 'rematch-accept') {
        launchRace(raceConfigRef.current);
      }
    },
    [launchRace]
  );

  const initPeer = useCallback(() => {
    const p = new SpeedwayPeer();
    p.onConnected = () => {
      setPeerConnected(true);
      setPeerError(null);
      setPeerStatus('Connected! Both devices are ready to race!');
      if (!p.isHost) {
        const prof = saveRef.current.profiles[activeTeamRef.current];
        p.send({
          type: 'hello',
          team: activeTeamRef.current,
          racerName: prof.racerName,
          loadout: prof.equipped,
        });
      }
    };
    p.onDisconnected = () => {
      setPeerConnected(false);
      setPeerStatus('Other device disconnected.');
    };
    p.onError = (err) => setPeerError(err);
    p.onMessage = handlePeerMessage;
    peerRef.current = p;
    return p;
  }, [handlePeerMessage]);

  const handleHostRoom = async () => {
    setPeerError(null);
    setMpRole('host');
    setPeerStatus('Creating room code...');
    const p = initPeer();
    try {
      const code = await p.hostRoom();
      setRoomCode(code);
      setPeerStatus('Waiting for your sister to enter this code...');
    } catch (e) {
      setPeerError(e instanceof Error ? e.message : 'Failed to create room');
      setMpRole('none');
    }
  };

  const handleJoinRoom = async (code: string) => {
    setPeerError(null);
    setMpRole('guest');
    setRoomCode(code.toUpperCase());
    setPeerStatus(`Joining room ${code.toUpperCase()}...`);
    const p = initPeer();
    try {
      await p.joinRoom(code);
    } catch (e) {
      setPeerError(e instanceof Error ? e.message : 'Could not join room');
      setMpRole('none');
    }
  };

  const handleChangeConfig = (next: RaceConfig) => {
    setRaceConfig(next);
    if (peerConnected) {
      if (mpRole === 'host') {
        const hostTeam = activeTeam;
        const guestTeam: TeamId = hostTeam === 'doggy' ? 'slothy' : 'doggy';
        peerRef.current?.send({
          type: 'lobby-state',
          mode,
          config: next,
          hostTeam,
          hostName: save.profiles[hostTeam].racerName,
          hostLoadout: save.profiles[hostTeam].equipped,
          guestTeam,
          guestName: remoteOpponentName,
          guestLoadout: opponentLoadout,
        });
      } else if (mpRole === 'guest') {
        peerRef.current?.send({
          type: 'guest-update',
          guestMath: next.guestMath,
          guestName: save.profiles[activeTeam].racerName,
          loadout: save.profiles[activeTeam].equipped,
        });
      }
    }
  };

  const handleStartRace = () => {
    if (mpRole === 'host' && peerConnected) {
      peerRef.current?.send({
        type: 'start-race',
        mode,
        startAt: Date.now(),
        config: raceConfig,
      });
    }
    launchRace(raceConfig);
  };

  const handleSendProgress = useCallback((st: RacerLiveState) => {
    if (!peerRef.current?.isConnected()) return;
    peerRef.current.send({
      type: 'progress',
      progress: st.progress,
      correctCount: st.correctCount,
      wrongCount: st.wrongCount,
      streak: st.streak,
      bestStreak: st.bestStreak,
      turboActive: st.turboUntil > Date.now(),
      spinoutActive: st.spinoutUntil > Date.now(),
      shieldActive: st.shieldActive ?? false,
      finished: st.finished,
      finishTimeMs: st.finishTimeMs,
    });
  }, []);

  const handleRaceFinish = useCallback((summary: RaceSummary) => {
    const prevBadges = new Set(saveRef.current.profiles[summary.myTeam].badges);
    const updated = recordRaceInSave(saveRef.current, summary);
    const newlyUnlocked = updated.profiles[summary.myTeam].badges.filter(
      (b) => !prevBadges.has(b)
    );
    setSave(updated);
    setLastSummary({
      ...summary,
      newlyUnlockedBadges: newlyUnlocked,
    });
    setScreen('podium');
  }, []);

  const handleRematch = () => {
    if (!peerRef.current?.isConnected()) {
      launchRace(raceConfig);
      return;
    }
    iRequestedRematchRef.current = true;
    if (peerRequestedRematchRef.current) {
      peerRef.current.send({ type: 'rematch-accept' });
      launchRace(raceConfig);
    } else {
      peerRef.current.send({ type: 'rematch-request' });
      setRematchStatus(
        'Rematch requested! Waiting for your sister to tap Race Again...'
      );
    }
  };

  const handleBuyItem = (itemId: string) => {
    const item = getShopItem(itemId);
    if (!item) return;
    setSave((prev) => {
      const prof = prev.profiles[activeTeam];
      if (prof.unlockedIds.includes(itemId) || prof.coins < item.price) {
        return prev;
      }
      const nextEquipped = { ...prof.equipped };
      if (item.category === 'car') nextEquipped.carId = itemId;
      if (item.category === 'gear') nextEquipped.gearId = itemId;
      if (item.category === 'accessory') nextEquipped.accessoryId = itemId;
      if (item.category === 'trail') nextEquipped.trailId = itemId;
      if (item.category === 'track') nextEquipped.trackId = itemId;
      if (item.category === 'sound') nextEquipped.soundId = itemId;
      if (item.category === 'radio') nextEquipped.radioId = itemId;
      if (item.category === 'celebration') nextEquipped.celebrationId = itemId;

      return {
        ...prev,
        profiles: {
          ...prev.profiles,
          [activeTeam]: {
            ...prof,
            coins: prof.coins - item.price,
            unlockedIds: [...prof.unlockedIds, itemId],
            equipped: nextEquipped,
          },
        },
      };
    });
  };

  const handleEquipItem = (category: ShopCategory, itemId: string) => {
    setSave((prev) => {
      const prof = prev.profiles[activeTeam];
      if (!prof.unlockedIds.includes(itemId)) return prev;
      const nextEquipped = { ...prof.equipped };
      if (category === 'car') nextEquipped.carId = itemId;
      if (category === 'gear') nextEquipped.gearId = itemId;
      if (category === 'accessory') nextEquipped.accessoryId = itemId;
      if (category === 'trail') nextEquipped.trailId = itemId;
      if (category === 'track') nextEquipped.trackId = itemId;
      if (category === 'sound') nextEquipped.soundId = itemId;
      if (category === 'radio') nextEquipped.radioId = itemId;
      if (category === 'celebration') nextEquipped.celebrationId = itemId;
      return {
        ...prev,
        profiles: {
          ...prev.profiles,
          [activeTeam]: {
            ...prof,
            equipped: nextEquipped,
          },
        },
      };
    });
  };

  const handleUpdateRacerName = (team: TeamId, name: string) => {
    setSave((prev) => ({
      ...prev,
      profiles: {
        ...prev.profiles,
        [team]: {
          ...prev.profiles[team],
          racerName: name.slice(0, 16),
        },
      },
    }));
  };

  const handleClaimQuest = (team: TeamId, questId: string) => {
    arcadeAudio.playCoin();
    setSave((prev) => claimQuestReward(prev, team, questId));
  };

  const handleToggleMute = () => {
    setSave((prev) => ({ ...prev, soundMuted: !prev.soundMuted }));
  };

  const openLobby = (nextMode: GameMode) => {
    cleanupPeer();
    setMode(nextMode);
    setRaceConfig((prev) => ({
      ...prev,
      trackId: save.profiles[activeTeam].equipped.trackId || 'track-sunny',
    }));
    setScreen('lobby');
  };

  const myMathConfig: PlayerMathConfig =
    !raceConfig.sharedMath && mpRole === 'guest'
      ? raceConfig.guestMath
      : raceConfig.hostMath;

  const oppTeam: TeamId = activeTeam === 'doggy' ? 'slothy' : 'doggy';
  const effectiveOpponentLoadout = peerConnected
    ? opponentLoadout
    : save.profiles[oppTeam].equipped;
  const effectiveOpponentName = peerConnected
    ? remoteOpponentName
    : save.profiles[oppTeam].racerName;

  return (
    <div className="app-shell">
      {screen === 'home' && (
        <HomeScreen
          save={save}
          activeTeam={activeTeam}
          onSelectTeam={setActiveTeam}
          onUpdateRacerName={handleUpdateRacerName}
          onClaimQuest={handleClaimQuest}
          onStartMultiplayer={() => openLobby('multiplayer')}
          onStartSolo={() => openLobby('solo')}
          onStartCoopBoss={() => openLobby('coop-boss')}
          onOpenGarage={() => setScreen('garage')}
          onOpenStats={() => setScreen('stats')}
          onToggleMute={handleToggleMute}
        />
      )}

      {screen === 'lobby' && (
        <LobbyScreen
          mode={mode}
          myTeam={activeTeam}
          myName={save.profiles[activeTeam].racerName}
          opponentName={effectiveOpponentName}
          unlockedIds={save.profiles[activeTeam].unlockedIds}
          config={raceConfig}
          onChangeConfig={handleChangeConfig}
          mpRole={mpRole}
          roomCode={roomCode}
          peerConnected={peerConnected}
          peerStatus={peerStatus}
          peerError={peerError}
          onHostRoom={handleHostRoom}
          onJoinRoom={handleJoinRoom}
          onStartRace={handleStartRace}
          onBack={() => {
            cleanupPeer();
            setScreen('home');
          }}
        />
      )}

      {screen === 'race' && (
        <RaceScreen
          key={raceKey}
          mode={mode}
          myTeam={activeTeam}
          myName={save.profiles[activeTeam].racerName}
          opponentName={effectiveOpponentName}
          myLoadout={save.profiles[activeTeam].equipped}
          unlockedIds={save.profiles[activeTeam].unlockedIds}
          missedFactCounts={save.profiles[activeTeam].missedFactCounts}
          opponentLoadout={effectiveOpponentLoadout}
          config={raceConfig}
          myMathConfig={myMathConfig}
          remoteOpponentState={remoteOpponentState}
          peerConnected={peerConnected}
          soundMuted={save.soundMuted}
          onToggleMute={handleToggleMute}
          onChangeRadio={(radioId) => handleEquipItem('radio', radioId)}
          onSendProgress={handleSendProgress}
          onRaceFinish={handleRaceFinish}
          onQuit={() => {
            arcadeAudio.stopRadio();
            cleanupPeer();
            setScreen('home');
          }}
        />
      )}

      {screen === 'podium' && lastSummary && (
        <PodiumScreen
          summary={lastSummary}
          myName={save.profiles[activeTeam].racerName}
          opponentName={effectiveOpponentName}
          headToHead={save.headToHead}
          totalCoins={save.profiles[activeTeam].coins}
          rematchStatus={rematchStatus}
          onRematch={handleRematch}
          onOpenGarage={() => {
            cleanupPeer();
            setScreen('garage');
          }}
          onGoHome={() => {
            cleanupPeer();
            setScreen('home');
          }}
        />
      )}

      {screen === 'garage' && (
        <GarageScreen
          profile={save.profiles[activeTeam]}
          onSwitchTeam={setActiveTeam}
          onBuyItem={handleBuyItem}
          onEquipItem={handleEquipItem}
          onBack={() => setScreen('home')}
        />
      )}

      {screen === 'stats' && (
        <StatsScreen
          save={save}
          activeTeam={activeTeam}
          onSwitchTeam={setActiveTeam}
          onImportSave={(imported) => setSave(imported)}
          onBack={() => setScreen('home')}
        />
      )}
    </div>
  );
};

export default App;
