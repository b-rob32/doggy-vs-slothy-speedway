import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  EquippedLoadout,
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
};

const DEFAULT_RACE_CONFIG: RaceConfig = {
  format: 'laps',
  lapPreset: 'standard',
  sprintSeconds: 60,
  sharedMath: true,
  fairRaceNoPerks: false,
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
  const [mode, setMode] = useState<'solo' | 'multiplayer'>('solo');
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
  const [remoteOpponentState, setRemoteOpponentState] =
    useState<RacerLiveState | null>(null);

  // Post-race state
  const [lastSummary, setLastSummary] = useState<RaceSummary | null>(null);
  const [rematchStatus, setRematchStatus] = useState<string | null>(null);
  const peerRequestedRematchRef = useRef(false);
  const iRequestedRematchRef = useRef(false);

  // Refs for peer callbacks
  const activeTeamRef = useRef(activeTeam);
  const raceConfigRef = useRef(raceConfig);
  const saveRef = useRef(save);
  const mpRoleRef = useRef(mpRole);
  const oppLoadoutRef = useRef(opponentLoadout);

  activeTeamRef.current = activeTeam;
  raceConfigRef.current = raceConfig;
  saveRef.current = save;
  mpRoleRef.current = mpRole;
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

  const launchRace = useCallback((cfg: RaceConfig) => {
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
        // Host received Guest hello -> assign opposite team to Guest and send lobby-state
        const hostTeam = activeTeamRef.current;
        const guestTeam: TeamId = hostTeam === 'doggy' ? 'slothy' : 'doggy';
        setOpponentLoadout(msg.loadout);
        peerRef.current?.send({
          type: 'lobby-state',
          config: raceConfigRef.current,
          hostTeam,
          hostLoadout: saveRef.current.profiles[hostTeam].equipped,
          guestTeam,
          guestLoadout: msg.loadout,
        });
      } else if (msg.type === 'lobby-state') {
        // Guest receives authoritative lobby config & assigned team
        setActiveTeam(msg.guestTeam);
        setOpponentLoadout(msg.hostLoadout);
        setRaceConfig(msg.config);
      } else if (msg.type === 'guest-update') {
        setOpponentLoadout(msg.loadout);
        setRaceConfig((prev) => ({
          ...prev,
          guestMath: msg.guestMath,
        }));
      } else if (msg.type === 'start-race') {
        launchRace(msg.config);
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
        const myLoadout = saveRef.current.profiles[activeTeamRef.current].equipped;
        p.send({
          type: 'hello',
          team: activeTeamRef.current,
          loadout: myLoadout,
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
    if (mode === 'multiplayer' && peerConnected) {
      if (mpRole === 'host') {
        const hostTeam = activeTeam;
        const guestTeam: TeamId = hostTeam === 'doggy' ? 'slothy' : 'doggy';
        peerRef.current?.send({
          type: 'lobby-state',
          config: next,
          hostTeam,
          hostLoadout: save.profiles[hostTeam].equipped,
          guestTeam,
          guestLoadout: opponentLoadout,
        });
      } else if (mpRole === 'guest') {
        peerRef.current?.send({
          type: 'guest-update',
          guestMath: next.guestMath,
          loadout: save.profiles[activeTeam].equipped,
        });
      }
    }
  };

  const handleStartRace = () => {
    if (mode === 'multiplayer' && mpRole === 'host') {
      peerRef.current?.send({
        type: 'start-race',
        startAt: Date.now(),
        config: raceConfig,
      });
    }
    launchRace(raceConfig);
  };

  const handleSendProgress = useCallback(
    (st: RacerLiveState) => {
      if (mode !== 'multiplayer' || !peerRef.current?.isConnected()) return;
      peerRef.current.send({
        type: 'progress',
        progress: st.progress,
        correctCount: st.correctCount,
        wrongCount: st.wrongCount,
        streak: st.streak,
        bestStreak: st.bestStreak,
        turboActive: st.turboUntil > Date.now(),
        spinoutActive: st.spinoutUntil > Date.now(),
        finished: st.finished,
        finishTimeMs: st.finishTimeMs,
      });
    },
    [mode]
  );

  const handleRaceFinish = useCallback((summary: RaceSummary) => {
    setLastSummary(summary);
    setSave((prev) => recordRaceInSave(prev, summary));
    setScreen('podium');
  }, []);

  const handleRematch = () => {
    if (mode === 'solo') {
      launchRace(raceConfig);
      return;
    }
    if (!peerRef.current?.isConnected()) {
      setRematchStatus('Connection closed — tap Home to start a new room!');
      return;
    }
    iRequestedRematchRef.current = true;
    if (peerRequestedRematchRef.current) {
      peerRef.current.send({ type: 'rematch-accept' });
      launchRace(raceConfig);
    } else {
      peerRef.current.send({ type: 'rematch-request' });
      setRematchStatus('Rematch requested! Waiting for your sister to tap Race Again...');
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

  const handleToggleMute = () => {
    setSave((prev) => ({ ...prev, soundMuted: !prev.soundMuted }));
  };

  const myMathConfig: PlayerMathConfig =
    mode === 'multiplayer' && !raceConfig.sharedMath && mpRole === 'guest'
      ? raceConfig.guestMath
      : raceConfig.hostMath;

  const oppTeam: TeamId = activeTeam === 'doggy' ? 'slothy' : 'doggy';
  const effectiveOpponentLoadout =
    mode === 'multiplayer'
      ? opponentLoadout
      : save.profiles[oppTeam].equipped;

  return (
    <div className="app-shell">
      {screen === 'home' && (
        <HomeScreen
          save={save}
          activeTeam={activeTeam}
          onSelectTeam={setActiveTeam}
          onStartMultiplayer={() => {
            cleanupPeer();
            setMode('multiplayer');
            setScreen('lobby');
          }}
          onStartSolo={() => {
            cleanupPeer();
            setMode('solo');
            setScreen('lobby');
          }}
          onOpenGarage={() => setScreen('garage')}
          onOpenStats={() => setScreen('stats')}
          onToggleMute={handleToggleMute}
        />
      )}

      {screen === 'lobby' && (
        <LobbyScreen
          mode={mode}
          myTeam={activeTeam}
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
          myLoadout={save.profiles[activeTeam].equipped}
          opponentLoadout={effectiveOpponentLoadout}
          config={raceConfig}
          myMathConfig={myMathConfig}
          remoteOpponentState={remoteOpponentState}
          soundMuted={save.soundMuted}
          onToggleMute={handleToggleMute}
          onSendProgress={handleSendProgress}
          onRaceFinish={handleRaceFinish}
          onQuit={() => {
            cleanupPeer();
            setScreen('home');
          }}
        />
      )}

      {screen === 'podium' && lastSummary && (
        <PodiumScreen
          summary={lastSummary}
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
