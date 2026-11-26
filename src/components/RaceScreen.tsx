import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Delete, Flame, Radio, Volume2, VolumeX, X } from 'lucide-react';
import {
  EquippedLoadout,
  MathProblem,
  MissedQuestion,
  OperationStat,
  PlayerMathConfig,
  RaceConfig,
  RaceSummary,
  RacerLiveState,
  SingleOperation,
  TeamId,
} from '../types';
import { getEffectivePerks, getShopItem, getTeamMeta, SHOP_ITEMS } from '../data/shop';
import { generateProblem } from '../engine/mathGenerator';
import { arcadeAudio } from '../engine/audio';
import { calculateCoins } from '../engine/storage';
import { SpeedwayCanvas } from './SpeedwayCanvas';

interface RaceScreenProps {
  mode: 'solo' | 'multiplayer';
  myTeam: TeamId;
  myLoadout: EquippedLoadout;
  unlockedIds: string[];
  opponentLoadout: EquippedLoadout;
  config: RaceConfig;
  myMathConfig: PlayerMathConfig;
  remoteOpponentState: RacerLiveState | null;
  soundMuted: boolean;
  onToggleMute: () => void;
  onChangeRadio: (radioId: string) => void;
  onSendProgress: (state: RacerLiveState) => void;
  onRaceFinish: (summary: RaceSummary) => void;
  onQuit: () => void;
}

const LAP_COUNTS = {
  quick: 2,
  standard: 3,
  long: 5,
};

const BASE_LAP_STEP = 1 / 8; // 8 correct answers per lap

export const RaceScreen: React.FC<RaceScreenProps> = ({
  mode,
  myTeam,
  myLoadout,
  unlockedIds,
  opponentLoadout,
  config,
  myMathConfig,
  remoteOpponentState,
  soundMuted,
  onToggleMute,
  onChangeRadio,
  onSendProgress,
  onRaceFinish,
  onQuit,
}) => {
  const oppTeam: TeamId = myTeam === 'doggy' ? 'slothy' : 'doggy';
  const totalLaps = config.format === 'laps' ? LAP_COUNTS[config.lapPreset] : null;
  const perks = useMemo(
    () => getEffectivePerks(myLoadout, config.fairRaceNoPerks),
    [myLoadout, config.fairRaceNoPerks]
  );

  const unlockedRadios = useMemo(
    () =>
      SHOP_ITEMS.filter(
        (i) => i.category === 'radio' && unlockedIds.includes(i.id)
      ),
    [unlockedIds]
  );

  const [countdown, setCountdown] = useState<number>(3);
  const [raceStartedAt, setRaceStartedAt] = useState<number | null>(null);
  const [timeLeftSec, setTimeLeftSec] = useState<number>(config.sprintSeconds);

  const [myState, setMyState] = useState<RacerLiveState>({
    team: myTeam,
    progress: 0,
    correctCount: 0,
    wrongCount: 0,
    streak: 0,
    bestStreak: 0,
    turboUntil: 0,
    spinoutUntil: 0,
    finished: false,
    finishTimeMs: null,
    loadout: myLoadout,
  });

  const [cpuState, setCpuState] = useState<RacerLiveState>({
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
    loadout: opponentLoadout,
  });

  const opponentState: RacerLiveState =
    mode === 'multiplayer' && remoteOpponentState ? remoteOpponentState : cpuState;

  const [problem, setProblem] = useState<MathProblem>(() =>
    generateProblem(myMathConfig)
  );
  const [typedValue, setTypedValue] = useState('');
  const [feedback, setFeedback] = useState<
    | null
    | { kind: 'correct'; text: string }
    | { kind: 'wrong'; text: string }
  >(null);
  const [wrongTriesOnCurrent, setWrongTriesOnCurrent] = useState(0);
  const [turboBannerTeam, setTurboBannerTeam] = useState<TeamId | null>(null);

  const missedRef = useRef<MissedQuestion[]>([]);
  const perOpRef = useRef<Record<SingleOperation, OperationStat>>({
    addition: { correct: 0, total: 0 },
    subtraction: { correct: 0, total: 0 },
    multiplication: { correct: 0, total: 0 },
    division: { correct: 0, total: 0 },
  });
  const finishedRef = useRef(false);
  const myStateRef = useRef(myState);
  const oppStateRef = useRef(opponentState);
  const raceStartRef = useRef<number | null>(null);
  const lastLapRef = useRef(0);
  const bannerTimeoutRef = useRef<number | null>(null);

  myStateRef.current = myState;
  oppStateRef.current = opponentState;
  raceStartRef.current = raceStartedAt;

  // Manage Car Radio playback while racing
  useEffect(() => {
    if (raceStartedAt && !finishedRef.current && !soundMuted) {
      arcadeAudio.startRadio(myLoadout.radioId);
    } else {
      arcadeAudio.stopRadio();
    }
    return () => {
      arcadeAudio.stopRadio();
    };
  }, [raceStartedAt, myLoadout.radioId, soundMuted]);

  const cycleRadioStation = () => {
    if (unlockedRadios.length <= 1) return;
    const idx = unlockedRadios.findIndex((r) => r.id === myLoadout.radioId);
    const next = unlockedRadios[(idx + 1) % unlockedRadios.length];
    onChangeRadio(next.id);
  };

  const showTurboBanner = useCallback((team: TeamId) => {
    setTurboBannerTeam(team);
    if (bannerTimeoutRef.current) {
      window.clearTimeout(bannerTimeoutRef.current);
    }
    bannerTimeoutRef.current = window.setTimeout(() => {
      setTurboBannerTeam(null);
    }, 2400);
  }, []);

  const prevOppTurboRef = useRef(0);
  useEffect(() => {
    if (
      opponentState.turboUntil > Date.now() &&
      opponentState.turboUntil !== prevOppTurboRef.current
    ) {
      prevOppTurboRef.current = opponentState.turboUntil;
      if (myStateRef.current.turboUntil <= Date.now()) {
        showTurboBanner(oppTeam);
      }
    }
  }, [opponentState.turboUntil, oppTeam, showTurboBanner]);

  // 3 - 2 - 1 - GO Countdown
  useEffect(() => {
    arcadeAudio.playCountdown(false);
    const t1 = window.setTimeout(() => {
      setCountdown(2);
      arcadeAudio.playCountdown(false);
    }, 850);
    const t2 = window.setTimeout(() => {
      setCountdown(1);
      arcadeAudio.playCountdown(false);
    }, 1700);
    const t3 = window.setTimeout(() => {
      setCountdown(0);
      arcadeAudio.playCountdown(true);
      setRaceStartedAt(Date.now());
    }, 2550);
    const t4 = window.setTimeout(() => {
      setCountdown(-1);
    }, 3250);

    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      window.clearTimeout(t3);
      window.clearTimeout(t4);
    };
  }, []);

  const finalizeRace = useCallback(
    (finalMy: RacerLiveState, finalOpp: RacerLiveState) => {
      if (finishedRef.current) return;
      finishedRef.current = true;
      arcadeAudio.stopRadio();

      const durationMs = Math.max(
        1000,
        Date.now() - (raceStartRef.current ?? Date.now())
      );

      let result: 'win' | 'loss' | 'tie' = 'tie';
      if (config.format === 'laps' && totalLaps) {
        if (finalMy.finished && !finalOpp.finished) {
          result = 'win';
        } else if (!finalMy.finished && finalOpp.finished) {
          result = 'loss';
        } else if (finalMy.progress > finalOpp.progress + 0.001) {
          result = 'win';
        } else if (finalOpp.progress > finalMy.progress + 0.001) {
          result = 'loss';
        } else {
          result = 'tie';
        }
      } else {
        if (finalMy.progress > finalOpp.progress + 0.001) result = 'win';
        else if (finalOpp.progress > finalMy.progress + 0.001) result = 'loss';
        else result = 'tie';
      }

      const minutes = durationMs / 60000;
      const qpm = Math.round(finalMy.correctCount / Math.max(minutes, 0.08));
      const totalAtt = finalMy.correctCount + finalMy.wrongCount;
      const accuracy =
        totalAtt > 0 ? Math.round((finalMy.correctCount / totalAtt) * 100) : 100;

      const coins = calculateCoins(
        result,
        finalMy.correctCount,
        finalMy.wrongCount,
        finalMy.bestStreak,
        myLoadout,
        config.fairRaceNoPerks
      );

      arcadeAudio.playVictory(myLoadout.celebrationId);

      onRaceFinish({
        myTeam,
        opponentTeam: oppTeam,
        mode,
        config,
        myMathConfig,
        result,
        myState: finalMy,
        opponentState: finalOpp,
        durationMs,
        qpm,
        accuracy,
        missedQuestions: [...missedRef.current],
        coins,
        perOperationCounts: { ...perOpRef.current },
      });
    },
    [
      config,
      mode,
      myLoadout,
      myMathConfig,
      myTeam,
      onRaceFinish,
      oppTeam,
      totalLaps,
    ]
  );

  useEffect(() => {
    if (
      mode === 'multiplayer' &&
      config.format === 'laps' &&
      totalLaps &&
      remoteOpponentState?.finished &&
      !finishedRef.current
    ) {
      finalizeRace(myStateRef.current, remoteOpponentState);
    }
  }, [config.format, finalizeRace, mode, remoteOpponentState, totalLaps]);

  useEffect(() => {
    if (!raceStartedAt || config.format !== 'sprint') return;
    const interval = window.setInterval(() => {
      const elapsed = (Date.now() - raceStartedAt) / 1000;
      const remaining = Math.max(0, Math.ceil(config.sprintSeconds - elapsed));
      setTimeLeftSec(remaining);
      if (remaining <= 0 && !finishedRef.current) {
        window.clearInterval(interval);
        finalizeRace(myStateRef.current, oppStateRef.current);
      }
    }, 200);
    return () => window.clearInterval(interval);
  }, [config.format, config.sprintSeconds, finalizeRace, raceStartedAt]);

  useEffect(() => {
    if (mode !== 'solo' || !raceStartedAt) return;

    const baseMs =
      config.cpuDifficulty === 'easy'
        ? 4100
        : config.cpuDifficulty === 'medium'
        ? 2700
        : 1800;

    let timer = 0;
    const scheduleNext = () => {
      if (finishedRef.current) return;
      const jitter = (Math.random() - 0.5) * baseMs * 0.45;
      timer = window.setTimeout(() => {
        if (finishedRef.current) return;
        const cpuCorrect = Math.random() < 0.88;
        setCpuState((prev) => {
          if (finishedRef.current) return prev;
          if (!cpuCorrect) {
            return {
              ...prev,
              wrongCount: prev.wrongCount + 1,
              streak: 0,
              spinoutUntil: Date.now() + 900,
            };
          }
          const nextStreak = prev.streak + 1;
          const isTurbo = nextStreak >= 3;
          const step = BASE_LAP_STEP + (isTurbo ? 0.035 : 0);
          const nextProg = totalLaps
            ? Math.min(totalLaps, prev.progress + step)
            : prev.progress + step;
          const finished = Boolean(totalLaps && nextProg >= totalLaps);
          const nextState: RacerLiveState = {
            ...prev,
            progress: nextProg,
            correctCount: prev.correctCount + 1,
            streak: nextStreak,
            bestStreak: Math.max(prev.bestStreak, nextStreak),
            turboUntil: isTurbo ? Date.now() + 2400 : prev.turboUntil,
            finished,
            finishTimeMs: finished
              ? Date.now() - (raceStartRef.current ?? Date.now())
              : null,
          };
          if (finished) {
            window.setTimeout(() => finalizeRace(myStateRef.current, nextState), 120);
          }
          return nextState;
        });
        scheduleNext();
      }, Math.max(700, baseMs + jitter));
    };

    scheduleNext();
    return () => window.clearTimeout(timer);
  }, [config.cpuDifficulty, finalizeRace, mode, raceStartedAt, totalLaps]);

  const isSpinningOut = myState.spinoutUntil > Date.now();
  const [, setTick] = useState(0);
  useEffect(() => {
    if (!isSpinningOut) return;
    const id = window.setTimeout(
      () => setTick((n) => n + 1),
      Math.max(40, myState.spinoutUntil - Date.now() + 30)
    );
    return () => window.clearTimeout(id);
  }, [isSpinningOut, myState.spinoutUntil]);

  const submitAnswer = useCallback(
    (chosen: number) => {
      if (!raceStartedAt || finishedRef.current) return;
      if (myStateRef.current.spinoutUntil > Date.now()) return;

      const op = problem.operation;
      perOpRef.current[op].total += 1;

      if (chosen === problem.answer) {
        perOpRef.current[op].correct += 1;
        const prev = myStateRef.current;
        const nextStreak = prev.streak + 1;
        const triggeredTurbo =
          nextStreak >= perks.turboStreakReq &&
          (nextStreak === perks.turboStreakReq || nextStreak % 3 === 0);
        const turboActive = triggeredTurbo || prev.turboUntil > Date.now();

        const baseStep = BASE_LAP_STEP * (1 + perks.speedBonus);
        const turboStep = turboActive ? 0.042 * (1 + perks.turboBonus) : 0;
        const rawNext = prev.progress + baseStep + turboStep;
        const nextProg = totalLaps ? Math.min(totalLaps, rawNext) : rawNext;
        const finished = Boolean(totalLaps && nextProg >= totalLaps);

        const nextLap = Math.floor(nextProg);
        if (nextLap > lastLapRef.current && !finished) {
          lastLapRef.current = nextLap;
          arcadeAudio.playLapComplete();
        } else if (triggeredTurbo) {
          arcadeAudio.playTurbo(myTeam);
          showTurboBanner(myTeam);
        } else {
          arcadeAudio.playCorrect(nextStreak, myLoadout.soundId);
        }

        const nextState: RacerLiveState = {
          ...prev,
          progress: nextProg,
          correctCount: prev.correctCount + 1,
          streak: nextStreak,
          bestStreak: Math.max(prev.bestStreak, nextStreak),
          turboUntil: triggeredTurbo ? Date.now() + 2600 : prev.turboUntil,
          finished,
          finishTimeMs: finished ? Date.now() - raceStartedAt : null,
        };

        setMyState(nextState);
        onSendProgress(nextState);
        setFeedback({
          kind: 'correct',
          text: triggeredTurbo ? '🔥 TURBO BOOST!' : '⚡ ZOOM!',
        });
        setTypedValue('');
        setWrongTriesOnCurrent(0);

        if (finished) {
          window.setTimeout(() => finalizeRace(nextState, oppStateRef.current), 180);
        } else {
          const promptStr = `${problem.a} ${problem.symbol} ${problem.b}`;
          setProblem(generateProblem(myMathConfig, promptStr));
        }
      } else {
        arcadeAudio.playWrong(myLoadout.soundId);
        const spinMs = Math.round(950 * (1 - perks.spinoutReduction));
        const prev = myStateRef.current;
        const nextState: RacerLiveState = {
          ...prev,
          wrongCount: prev.wrongCount + 1,
          streak: 0,
          turboUntil: 0,
          spinoutUntil: Date.now() + spinMs,
        };
        setMyState(nextState);
        onSendProgress(nextState);

        missedRef.current.push({
          prompt: `${problem.a} ${problem.symbol} ${problem.b}`,
          correctAnswer: problem.answer,
          givenAnswer: chosen,
          operation: problem.operation,
        });

        const nextTries = wrongTriesOnCurrent + 1;
        setTypedValue('');
        if (nextTries >= 2) {
          setFeedback({
            kind: 'wrong',
            text: `Spin-out! Answer was ${problem.answer}`,
          });
          setWrongTriesOnCurrent(0);
          window.setTimeout(() => {
            if (!finishedRef.current) {
              const promptStr = `${problem.a} ${problem.symbol} ${problem.b}`;
              setProblem(generateProblem(myMathConfig, promptStr));
            }
          }, spinMs);
        } else {
          setFeedback({
            kind: 'wrong',
            text: 'WHOA! Spin-out — try again!',
          });
          setWrongTriesOnCurrent(nextTries);
        }
      }
    },
    [
      finalizeRace,
      myLoadout.soundId,
      myMathConfig,
      myTeam,
      onSendProgress,
      perks.spinoutReduction,
      perks.speedBonus,
      perks.turboBonus,
      perks.turboStreakReq,
      problem,
      raceStartedAt,
      showTurboBanner,
      totalLaps,
      wrongTriesOnCurrent,
    ]
  );

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (!raceStartedAt || finishedRef.current) return;
      if (myMathConfig.inputMode === 'multiple-choice') {
        const idx = ['1', '2', '3', '4'].indexOf(e.key);
        if (idx !== -1 && problem.choices[idx] !== undefined) {
          e.preventDefault();
          submitAnswer(problem.choices[idx]);
        }
      } else {
        if (e.key >= '0' && e.key <= '9') {
          e.preventDefault();
          setTypedValue((v) => (v.length < 4 ? v + e.key : v));
        } else if (e.key === 'Backspace') {
          e.preventDefault();
          setTypedValue((v) => v.slice(0, -1));
        } else if (e.key === 'Enter') {
          e.preventDefault();
          if (typedValue.length > 0) {
            submitAnswer(parseInt(typedValue, 10));
          }
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [myMathConfig.inputMode, problem.choices, raceStartedAt, submitAnswer, typedValue]);

  const myMeta = getTeamMeta(myTeam);
  const oppMeta = getTeamMeta(oppTeam);
  const activeRadioItem = getShopItem(myLoadout.radioId);

  const currentLap = totalLaps
    ? Math.min(totalLaps, Math.floor(myState.progress) + 1)
    : Math.floor(myState.progress) + 1;

  const isLeading = myState.progress >= opponentState.progress;
  const turboProgress = Math.min(1, myState.streak / perks.turboStreakReq);

  return (
    <div className="screen race-screen">
      {/* Compact Racing HUD */}
      <div className="race-hud">
        <div className="hud-left">
          <button
            className="icon-btn icon-btn--sm"
            onClick={onQuit}
            title="Exit Race"
          >
            <X size={18} />
          </button>
          <div className="hud-pill hud-pill--lap">
            {totalLaps ? `LAP ${currentLap} / ${totalLaps}` : `⏱️ ${timeLeftSec}s`}
          </div>
          <div
            className={`hud-pill ${isLeading ? 'hud-pill--lead' : 'hud-pill--chase'}`}
          >
            {isLeading ? '1st Place! 🥇' : '2nd Place! 💨'}
          </div>
        </div>

        <div className="hud-right">
          {/* Live Car Radio Tuner */}
          <button
            className={`radio-tuner-btn ${
              myLoadout.radioId !== 'radio-off' && !soundMuted ? 'is-playing' : ''
            }`}
            onClick={cycleRadioStation}
            title="Tap to switch Car Radio stations!"
          >
            <Radio size={15} />
            <span>{activeRadioItem?.name ?? 'Radio Off'}</span>
          </button>

          <div className="turbo-meter" title="Answer streak for Turbo Boost!">
            <Flame
              size={16}
              className={myState.streak >= perks.turboStreakReq ? 'flame-lit' : ''}
            />
            <div className="turbo-bar">
              <div
                className="turbo-bar-fill"
                style={{ width: `${turboProgress * 100}%` }}
              />
            </div>
            <span>{myState.streak}🔥</span>
          </div>
          <button className="icon-btn icon-btn--sm" onClick={onToggleMute}>
            {soundMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
          </button>
        </div>
      </div>

      {/* Live Progress Bars for Both Teams */}
      <div className="racer-bars">
        <div className={`racer-bar racer-bar--${myTeam}`}>
          <span>
            {myMeta.emoji} {myMeta.shortName} (You)
          </span>
          <div className="racer-bar-track">
            <div
              className="racer-bar-fill"
              style={{
                width: `${
                  totalLaps
                    ? Math.min(100, (myState.progress / totalLaps) * 100)
                    : Math.min(100, (myState.progress % 1) * 100)
                }%`,
              }}
            />
          </div>
          <strong>{myState.correctCount} ✓</strong>
        </div>

        <div className={`racer-bar racer-bar--${oppTeam}`}>
          <span>
            {oppMeta.emoji} {oppMeta.shortName}{' '}
            {mode === 'solo' ? '(CPU)' : '(Sister)'}
          </span>
          <div className="racer-bar-track">
            <div
              className="racer-bar-fill"
              style={{
                width: `${
                  totalLaps
                    ? Math.min(100, (opponentState.progress / totalLaps) * 100)
                    : Math.min(100, (opponentState.progress % 1) * 100)
                }%`,
              }}
            />
          </div>
          <strong>{opponentState.correctCount} ✓</strong>
        </div>
      </div>

      {/* Animated Oval Speedway Track */}
      <div className="track-stage">
        <SpeedwayCanvas
          myState={myState}
          opponentState={opponentState}
          totalLaps={totalLaps}
          myTeam={myTeam}
          turboBannerTeam={turboBannerTeam}
        />

        {countdown >= 0 && (
          <div className="countdown-overlay">
            <div className="countdown-bubble" key={countdown}>
              {countdown > 0 ? countdown : 'GO!! 🏁'}
            </div>
          </div>
        )}
      </div>

      {/* Math Question & Answer Arena */}
      <div className={`math-arena ${isSpinningOut ? 'math-arena--spinout' : ''}`}>
        <div className="problem-header">
          <div className="problem-equation">
            <span>{problem.a}</span>
            <span className="eq-op">{problem.symbol}</span>
            <span>{problem.b}</span>
            <span className="eq-equals">=</span>
            <span className="eq-box">
              {myMathConfig.inputMode === 'type-answer'
                ? typedValue || '?'
                : '?'}
            </span>
          </div>

          {feedback && (
            <div className={`feedback-chip feedback-chip--${feedback.kind}`}>
              {feedback.text}
            </div>
          )}
        </div>

        {myMathConfig.inputMode === 'multiple-choice' ? (
          <div className="choices-grid">
            {problem.choices.map((choice, idx) => (
              <button
                key={`${problem.id}-${choice}`}
                className={`choice-btn choice-btn--${idx}`}
                disabled={!raceStartedAt || isSpinningOut}
                onClick={() => submitAnswer(choice)}
              >
                <span className="choice-key">{idx + 1}</span>
                <span className="choice-num">{choice}</span>
              </button>
            ))}
          </div>
        ) : (
          <div className="numpad-grid">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
              <button
                key={digit}
                className="num-btn"
                disabled={!raceStartedAt || isSpinningOut}
                onClick={() =>
                  setTypedValue((v) => (v.length < 4 ? v + digit : v))
                }
              >
                {digit}
              </button>
            ))}
            <button
              className="num-btn num-btn--clear"
              disabled={!raceStartedAt || isSpinningOut}
              onClick={() => setTypedValue((v) => v.slice(0, -1))}
            >
              <Delete size={22} />
            </button>
            <button
              className="num-btn"
              disabled={!raceStartedAt || isSpinningOut}
              onClick={() =>
                setTypedValue((v) => (v.length < 4 ? v + '0' : v))
              }
            >
              0
            </button>
            <button
              className="num-btn num-btn--go"
              disabled={!raceStartedAt || isSpinningOut || typedValue.length === 0}
              onClick={() => submitAnswer(parseInt(typedValue, 10))}
            >
              GO!
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
