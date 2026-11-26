import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  EquippedLoadout,
  GameMode,
  GrandPrixState,
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
  recordRaceWithProgression,
} from './engine/storage';
import { openMysteryGift } from './engine/progression';
import { SpeedwayPeer } from './engine/peer';
import { HomeScreen } from './components/HomeScreen';
import { LobbyScreen } from './components/LobbyScreen';
import { RaceScreen } from './components/RaceScreen';
import { PodiumScreen } from './components/PodiumScreen';
import { GarageScreen } from './components/GarageScreen';
import { StatsScreen } from './components/StatsScreen';

type ScreenName = 'home' | 'lobby' | 'race' | 'podium' | 'garage' | 'stats';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

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
  grandPrixMode: false,
  trackId: 'track-sunny',
  hostMath: { ...DEFAULT_MATH },
  guestMath: { ...DEFAULT_MATH },
  cpuDifficulty: 'medium',
};

const GRAND_PRIX_CUPS: { name: string; tracks: string[] }[] = [
  {
    name: 'Sunshine Star Cup',
    tracks: ['track-sunny', 'track-candy', 'track-beach'],
  },
  {
    name: 'Magic Kingdom Cup',
    tracks: ['track-forest', 'track-coral', 'track-space'],
  },
  {
    name: 'Turbo Legends Cup',
    tracks: ['track-snow', 'track-volcano', 'track-neon'],
  },
];

function createGrandPrix(): GrandPrixState {
  const cup =
    GRAND_PRIX_CUPS[Math.floor(Math.random() * GRAND_PRIX_CUPS.length)];
  return {
    active: true,
    cupName: cup.name,
    tracks: cup.tracks,
    raceIndex: 0,
    myPoints: 0,
    opponentPoints: 0,
  };
}

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
  const [grandPrix, setGrandPrix] = useState<GrandPrixState | null>(null);
  const [raceKey, setRaceKey] = useState(0);

  // PWA Install Prompt
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallPwa = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
  };

  // Multiplayer & Emote state
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

  const [myEmote, setMyEmote] = useState<string | null>(null);
  const [opponentEmote, setOpponentEmote] = useState<string | null>(null);
  const myEmoteTimerRef = useRef<number | null>(null);
  const oppEmoteTimerRef = useRef<number | null>(null);

  // Post-race state
  const [lastSummary, setLastSummary] = useState<RaceSummary | null>(null);
  const [rematchStatus, setRematchStatus] = useState<string | null>(null);
  const peerRequestedRematchRef = useRef(false);
  const iRequestedRematchRef = useRef(false);

  const activeTeamRef = useRef(activeTeam);
  const raceConfigRef = useRef(raceConfig);
  const grandPrixRef = useRef(grandPrix);
  const saveRef = useRef(save);
  const modeRef = useRef(mode);
  const oppLoadoutRef = useRef(opponentLoadout);

  activeTeamRef.current = activeTeam;
  raceConfigRef.current = raceConfig;
  grandPrixRef.current = grandPrix;
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
    setGrandPrix(null);
    peerRequestedRematchRef.current = false;
    iRequestedRematchRef.current = false;
  }, []);

  useEffect(() => {
    return () => {
      peerRef.current?.destroy();
    };
  }, []);

  const showMyEmote = useCallback((em: string) => {
    setMyEmote(em);
    if (myEmoteTimerRef.current) window.clearTimeout(myEmoteTimerRef.current);
    myEmoteTimerRef.current = window.setTimeout(() => setMyEmote(null), 2600);
  }, []);

  const showOppEmote = useCallback((em: string) => {
    setOpponentEmote(em);
    if (oppEmoteTimerRef.current) window.clearTimeout(oppEmoteTimerRef.current);
    oppEmoteTimerRef.current = window.setTimeout(() => setOpponentEmote(null), 2600);
  }, []);

  const handleSendEmote = useCallback(
    (emote: string) => {
      arcadeAudio.playCoin();
      showMyEmote(emote);
      if (peerRef.current?.isConnected()) {
        peerRef.current.send({ type: 'emote', emote });
      }
    },
    [showMyEmote]
  );

  const launchRace = useCallback(
    (
      cfg: RaceConfig,
      nextMode?: GameMode,
      nextGp?: GrandPrixState | null
    ) => {
      if (nextMode) setMode(nextMode);
      const activeGp = nextGp !== undefined ? nextGp : grandPrixRef.current;
      if (nextGp !== undefined) setGrandPrix(nextGp);

      const effectiveTrackId =
        activeGp && activeGp.active
          ? activeGp.tracks[activeGp.raceIndex] ?? cfg.trackId
          : cfg.trackId;

      const finalCfg: RaceConfig = {
        ...cfg,
        trackId: effectiveTrackId,
      };

      const oppTeam: TeamId =
        activeTeamRef.current === 'doggy' ? 'slothy' : 'doggy';
      setRaceConfig(finalCfg);
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
    },
    []
  );

  const advanceNextRaceOrRematch = useCallback(() => {
    const gp = grandPrixRef.current;
    if (gp && gp.active && gp.raceIndex < 2) {
      const nextGp: GrandPrixState = {
        ...gp,
        raceIndex: gp.raceIndex + 1,
      };
      launchRace(raceConfigRef.current, undefined, nextGp);
    } else if (raceConfigRef.current.grandPrixMode) {
      launchRace(raceConfigRef.current, undefined, createGrandPrix());
    } else {
      launchRace(raceConfigRef.current, undefined, null);
    }
  }, [launchRace]);

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
        launchRace(msg.config, msg.mode, msg.grandPrix ?? null);
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
      } else if (msg.type === 'emote') {
        arcadeAudio.playCoin();
        showOppEmote(msg.emote);
      } else if (msg.type === 'rematch-request') {
        peerRequestedRematchRef.current = true;
        if (iRequestedRematchRef.current) {
          peerRef.current?.send({ type: 'rematch-accept' });
          advanceNextRaceOrRematch();
        } else {
          setRematchStatus('Your sister is ready for the next race! Tap below 🏁');
        }
      } else if (msg.type === 'rematch-accept') {
        advanceNextRaceOrRematch();
      }
    },
    [advanceNextRaceOrRematch, launchRace, showOppEmote]
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
    const nextGp = raceConfig.grandPrixMode ? createGrandPrix() : null;
    if (mpRole === 'host' && peerConnected) {
      peerRef.current?.send({
        type: 'start-race',
        mode,
        startAt: Date.now(),
        config: raceConfig,
        grandPrix: nextGp,
      });
    }
    launchRace(raceConfig, undefined, nextGp);
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
    let updatedGp = grandPrixRef.current;
    if (updatedGp && updatedGp.active) {
      const myAdd = summary.result === 'win' ? 10 : summary.result === 'tie' ? 8 : 7;
      const oppAdd = summary.result === 'loss' ? 10 : summary.result === 'tie' ? 8 : 7;
      updatedGp = {
        ...updatedGp,
        myPoints: updatedGp.myPoints + myAdd,
        opponentPoints: updatedGp.opponentPoints + oppAdd,
      };
      setGrandPrix(updatedGp);
    }

    const summaryWithGp: RaceSummary = {
      ...summary,
      grandPrix: updatedGp,
    };

    const { nextSave, enrichedSummary } = recordRaceWithProgression(
      saveRef.current,
      summaryWithGp
    );
    setSave(nextSave);
    setLastSummary(enrichedSummary);
    setScreen('podium');
  }, []);

  const handleRematch = () => {
    if (!peerRef.current?.isConnected()) {
      advanceNextRaceOrRematch();
      return;
    }
    iRequestedRematchRef.current = true;
    if (peerRequestedRematchRef.current) {
      peerRef.current.send({ type: 'rematch-accept' });
      advanceNextRaceOrRematch();
    } else {
      peerRef.current.send({ type: 'rematch-request' });
      setRematchStatus('Ready! Waiting for your sister to tap Next Race...');
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

  const handleOpenMysteryGift = (team: TeamId) => {
    const prof = save.profiles[team];
    if (prof.mysteryGiftsReady <= 0) return null;
    arcadeAudio.playVictory('cel-champion');
    const res = openMysteryGift(save, team);
    setSave(res.nextSave);
    return { coinsWon: res.coinsWon, message: res.message };
  };

  const handleToggleMute = () => {
    setSave((prev) => ({ ...prev, soundMuted: !prev.soundMuted }));
  };

  const openLobby = (nextMode: GameMode, isGrandPrix = false) => {
    cleanupPeer();
    setMode(nextMode);
    setRaceConfig((prev) => ({
      ...prev,
      grandPrixMode: isGrandPrix,
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
          onOpenMysteryGift={handleOpenMysteryGift}
          onStartMultiplayer={() => openLobby('multiplayer', false)}
          onStartSolo={() => openLobby('solo', false)}
          onStartCoopBoss={() => openLobby('coop-boss', false)}
          onStartGrandPrix={() => openLobby('solo', true)}
          onOpenGarage={() => setScreen('garage')}
          onOpenStats={() => setScreen('stats')}
          onToggleMute={handleToggleMute}
          canInstallPwa={Boolean(deferredPrompt)}
          onInstallPwa={handleInstallPwa}
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
          grandPrix={grandPrix}
          myMathConfig={myMathConfig}
          remoteOpponentState={remoteOpponentState}
          peerConnected={peerConnected}
          myEmote={myEmote}
          opponentEmote={opponentEmote}
          soundMuted={save.soundMuted}
          onToggleMute={handleToggleMute}
          onChangeRadio={(radioId) => handleEquipItem('radio', radioId)}
          onSendEmote={handleSendEmote}
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
          peerConnected={peerConnected}
          opponentEmote={opponentEmote}
          onSendEmote={handleSendEmote}
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
