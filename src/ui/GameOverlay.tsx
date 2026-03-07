import React, { useEffect, useRef, useState } from "react";
import { GameState, GameStatus } from "../game/state/GameState";
import { GAME_CONFIG, GAME_HOOKS } from "../game/config/constants";
import { Engine } from "../game/core/Engine";
import { GAME_VARIANT } from "../game/config/variant";
import { MOVEMENT_PROFILE, hasCapability } from "../game/config/movementProfile";
import { EventBus } from "../game/core/EventBus";

interface GameOverlayProps {
  engine: Engine | null;
}

export const GameOverlay: React.FC<GameOverlayProps> = ({ engine }) => {
  const [status, setStatus] = useState<GameStatus>(GameStatus.MENU);
  const [score, setScore] = useState<number>(0);
  const [bestScore, setBestScore] = useState<number>(0);
  const [distance, setDistance] = useState<number>(0);
  const [speed, setSpeed] = useState<number>(0);
  const [coins, setCoins] = useState<number>(0);
  const [coinFlash, setCoinFlash] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // Hooks state
  const [comboMultiplier, setComboMultiplier] = useState(1);
  const [hasShield, setHasShield] = useState(false);
  const [nearMissCount, setNearMissCount] = useState(0);
  const [showNearMiss, setShowNearMiss] = useState(false);

  // Debug stats
  const [isDebug, setIsDebug] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [masterVolume, setMasterVolume] = useState(1.0);
  const [dprCap, setDprCap] = useState(2);
  const [fps, setFps] = useState(0);
  const [activeObstacles, setActiveObstacles] = useState(0);
  const [activeCoins, setActiveCoins] = useState(0);
  const [playerX, setPlayerX] = useState(0);
  const [targetX, setTargetX] = useState(0);
  const [seed, setSeed] = useState(0);
  const [difficulty, setDifficulty] = useState(0);
  const [biomeId, setBiomeId] = useState("styx");
  const [chunkIndex, setChunkIndex] = useState(0);
  const [patternId, setPatternId] = useState("none");

  const coinFlashTimeoutRef = useRef<number | null>(null);
  const nearMissTimeoutRef = useRef<number | null>(null);
  const prevCoinsRef = useRef<number>(0);
  const prevNearMissRef = useRef<number>(0);

  useEffect(() => {
    const gameState = GameState.getInstance();

    // Initial state
    setStatus(gameState.status);
    setScore(gameState.score);
    setBestScore(gameState.bestScore);
    setDistance(gameState.distance);
    setSpeed(Math.floor(gameState.currentSpeed));
    setCoins(gameState.coins);
    setComboMultiplier(gameState.comboMultiplier);
    setHasShield(gameState.hasShield);
    setNearMissCount(gameState.nearMissCount);
    setIsDebug(gameState.isDebug);
    setIsMuted(gameState.isMuted);
    setMasterVolume(gameState.masterVolume);
    setDprCap(gameState.dprCap);
    setFps(gameState.fps);
    setActiveObstacles(gameState.activeObstacles);
    setActiveCoins(gameState.activeCoins);
    setPlayerX(gameState.playerX);
    setTargetX(gameState.targetX);
    setSeed(gameState.runSeed);
    setDifficulty(gameState.difficulty ?? 0);
    setBiomeId(gameState.biomeId ?? "styx");
    setChunkIndex(gameState.debugChunkIndex ?? 0);
    setPatternId(gameState.debugPatternId ?? "none");

    // Refs for delta detection
    prevCoinsRef.current = gameState.coins;
    prevNearMissRef.current = gameState.nearMissCount;

    const unsubscribe = gameState.subscribe(() => {
      setStatus(gameState.status);
      setScore(gameState.score);
      setBestScore(gameState.bestScore);
      setDistance(gameState.distance);
      setSpeed(Math.floor(gameState.currentSpeed));

      // Coin flash (only on increment)
      if (gameState.coins > prevCoinsRef.current) {
        setCoinFlash(true);
        if (coinFlashTimeoutRef.current !== null) {
          window.clearTimeout(coinFlashTimeoutRef.current);
        }
        coinFlashTimeoutRef.current = window.setTimeout(() => {
          setCoinFlash(false);
          coinFlashTimeoutRef.current = null;
        }, 150);
      }
      prevCoinsRef.current = gameState.coins;
      setCoins(gameState.coins);

      // Hooks UI
      setComboMultiplier(gameState.comboMultiplier);
      setHasShield(gameState.hasShield);

      // Near-miss popup (only on increment)
      if (gameState.nearMissCount > prevNearMissRef.current) {
        setShowNearMiss(true);
        if (nearMissTimeoutRef.current !== null) {
          window.clearTimeout(nearMissTimeoutRef.current);
        }
        nearMissTimeoutRef.current = window.setTimeout(() => {
          setShowNearMiss(false);
          nearMissTimeoutRef.current = null;
        }, 450);
      }
      prevNearMissRef.current = gameState.nearMissCount;
      setNearMissCount(gameState.nearMissCount);

      // Debug
      setIsDebug(gameState.isDebug);
      setIsMuted(gameState.isMuted);
      setMasterVolume(gameState.masterVolume);
      setDprCap(gameState.dprCap);
      setFps(gameState.fps);
      setActiveObstacles(gameState.activeObstacles);
      setActiveCoins(gameState.activeCoins);
      setPlayerX(gameState.playerX);
      setTargetX(gameState.targetX);
      setSeed(gameState.runSeed);
      setDifficulty(gameState.difficulty ?? 0);
      setBiomeId(gameState.biomeId ?? "styx");
      setChunkIndex(gameState.debugChunkIndex ?? 0);
      setPatternId(gameState.debugPatternId ?? "none");
    });

    return () => {
      unsubscribe();
      if (coinFlashTimeoutRef.current !== null) {
        window.clearTimeout(coinFlashTimeoutRef.current);
      }
      if (nearMissTimeoutRef.current !== null) {
        window.clearTimeout(nearMissTimeoutRef.current);
      }
    };
  }, []);

  const playClick = () => EventBus.getInstance().emit({ type: "UI_CLICK" });

  const handleStart = () => {
    playClick();
    setShowSettings(false);
    if (engine) {
      engine.resetGame();
    }
  };

  const handleResume = () => {
    playClick();
    setShowSettings(false);
    if (engine) {
      engine.resumeGame();
    }
  };

  const toggleDebug = () => { playClick(); GameState.getInstance().toggleDebug(); };
  const toggleMute = () => { playClick(); GameState.getInstance().toggleMute(); };
  const cycleVolume = () => {
    playClick();
    const current = GameState.getInstance().masterVolume;
    const next = current >= 1.0 ? 0.25 : current + 0.25;
    GameState.getInstance().setMasterVolume(next);
  };
  const cycleDpr = () => {
    playClick();
    const current = GameState.getInstance().dprCap;
    const next = current === 1 ? 1.5 : current === 1.5 ? 2 : 1;
    GameState.getInstance().setDprCap(next);
  };

  return (
    <div 
      className="absolute inset-0 pointer-events-none flex flex-col justify-between overflow-hidden"
      style={{
        paddingTop: 'calc(12px + env(safe-area-inset-top))',
        paddingBottom: 'calc(12px + env(safe-area-inset-bottom))',
        paddingLeft: 'calc(12px + env(safe-area-inset-left))',
        paddingRight: 'calc(12px + env(safe-area-inset-right))',
      }}
    >
      {/* Debug Overlay */}
      {isDebug && (
        <div className="absolute top-4 right-4 bg-black/50 text-green-400 font-mono text-xs p-2 rounded pointer-events-none text-right z-50">
          <div>VAR: {GAME_VARIANT}</div>
          <div>SEED: {seed}</div>
          <div>DIFF: {difficulty.toFixed(3)}</div>
          <div>BIOME: {biomeId}</div>
          <div>CHUNK: {chunkIndex}</div>
          <div>PAT: {patternId}</div>
          <div className="opacity-80">{MOVEMENT_PROFILE.controlsHint}</div>
          <div>FPS: {fps}</div>
          <div>OBS: {activeObstacles}</div>
          <div>COINS: {activeCoins}</div>
          <div>PX: {playerX.toFixed(3)}</div>
          <div>TX: {targetX.toFixed(3)}</div>
        </div>
      )}

      {/* HUD Top */}
      <div className="w-full max-w-5xl mx-auto flex flex-wrap justify-between items-start gap-4 px-2">
        <div className="flex flex-wrap gap-x-4 gap-y-1 items-baseline">
          <div className="text-white font-mono text-[clamp(1.25rem,5vw,1.5rem)] font-bold drop-shadow-md min-w-[100px]">
            SCORE: {score}
          </div>
          <div className="text-gray-300 font-mono text-[clamp(1rem,4vw,1.125rem)] font-bold drop-shadow-md min-w-[80px]">
            DIST: {Math.floor(distance)}m
          </div>
          <div
            className={`text-yellow-400 font-mono text-[clamp(1.125rem,4.5vw,1.25rem)] font-bold drop-shadow-md min-w-[90px] transition-transform ${coinFlash ? "scale-125 text-yellow-200 origin-left" : "scale-100 origin-left"}`}
          >
            COINS: {coins}
          </div>
          {GAME_HOOKS.ENABLE_COIN_COMBO && comboMultiplier > 1 && (
            <div className="text-orange-400 font-mono text-[clamp(1rem,4vw,1.125rem)] font-bold drop-shadow-md animate-pulse min-w-[90px]">
              COMBO x{comboMultiplier}
            </div>
          )}
          {GAME_HOOKS.ENABLE_SHIELD && hasShield && (
            <div className="text-cyan-400 font-mono text-[clamp(1rem,4vw,1.125rem)] font-bold drop-shadow-md min-w-[90px]">
              🛡️ SHIELD
            </div>
          )}
          {status === GameStatus.PLAYING && bestScore > 0 && (
            <div className="text-white font-mono text-[clamp(0.875rem,3vw,1rem)] font-bold drop-shadow-md opacity-80 min-w-[80px]">
              BEST: {bestScore}
            </div>
          )}
        </div>

        {status === GameStatus.PLAYING && (
          <div className="flex flex-col items-end min-w-[80px]">
            <div className="text-white font-mono text-[clamp(1.125rem,4.5vw,1.25rem)] font-bold drop-shadow-md opacity-80">
              SPEED: {speed}
            </div>
            <div className="text-gray-300 font-mono text-[clamp(0.75rem,2.5vw,0.875rem)] mt-1 drop-shadow-md opacity-60">
              Press ESC to pause
            </div>
          </div>
        )}
      </div>

      {/* Floating Near Miss */}
      {GAME_HOOKS.ENABLE_NEAR_MISS && showNearMiss && (
        <div className="absolute top-1/3 left-1/2 transform -translate-x-1/2 text-white font-black italic text-[clamp(1.5rem,6vw,2.25rem)] drop-shadow-[0_0_15px_rgba(255,255,255,0.8)] animate-bounce pointer-events-none w-full text-center">
          NEAR MISS! +{GAME_CONFIG.NEAR_MISS_BONUS}
        </div>
      )}

      {/* Menus */}
      <div className="flex-1 flex items-center justify-center w-full max-w-md mx-auto px-4 my-4">
        {status === GameStatus.MENU && (
          <div className="bg-black/70 p-6 sm:p-8 rounded-2xl backdrop-blur-sm pointer-events-auto text-center border border-white/10 w-full max-h-full overflow-y-auto">
            <h1 className="text-[clamp(2.5rem,10vw,3rem)] font-black text-white mb-2 tracking-tight leading-none">
              3D RUNNER
            </h1>
            {bestScore > 0 && (
              <p className="text-yellow-400 font-mono mb-6 text-[clamp(0.875rem,4vw,1rem)]">
                BEST SCORE: {bestScore}
              </p>
            )}
            <div className="text-gray-300 mb-6 sm:mb-8 text-sm bg-white/5 p-4 rounded-xl text-left">
              <p className="mb-2">
                🎮 <strong>Controls:</strong>
              </p>
              <ul className="space-y-1 ml-2 text-[clamp(0.75rem,3vw,0.875rem)]">
                <li>
                  <kbd className="bg-white/20 px-1 rounded">A</kbd> /{" "}
                  <kbd className="bg-white/20 px-1 rounded">D</kbd> - Move
                  Left/Right
                </li>
                {hasCapability("jump") && (
                  <li>
                    <kbd className="bg-white/20 px-1 rounded">W</kbd> /{" "}
                    <kbd className="bg-white/20 px-1 rounded">Space</kbd> - Jump
                  </li>
                )}
                <li>
                  <kbd className="bg-white/20 px-1 rounded">S</kbd> /{" "}
                  <kbd className="bg-white/20 px-1 rounded">Down</kbd> -{" "}
                  {MOVEMENT_PROFILE.downActionLabel}
                </li>
                <li>
                  <kbd className="bg-white/20 px-1 rounded">Esc</kbd> - Pause
                </li>
              </ul>
              <p className="mt-3 text-xs opacity-70">
                {hasCapability("jump")
                  ? "Mobile: Swipe to move/jump/slide"
                  : "Mobile: Swipe left/right to steer, swipe down to crouch"}
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:gap-4">
              <button
                onClick={handleStart}
                className="bg-emerald-500 hover:bg-emerald-400 text-white font-bold py-3 sm:py-4 px-6 sm:px-10 rounded-full transition-all transform hover:scale-105 active:scale-95 text-lg sm:text-xl shadow-lg shadow-emerald-500/30 w-full"
              >
                START GAME
              </button>
              <button
                onClick={() => setShowSettings(true)}
                className="bg-white/10 hover:bg-white/20 text-white font-bold py-3 px-6 sm:px-8 rounded-full transition-colors text-base sm:text-lg w-full"
              >
                SETTINGS
              </button>
            </div>
          </div>
        )}

        {status === GameStatus.PAUSED && !showSettings && (
          <div className="bg-black/80 p-6 sm:p-8 rounded-2xl backdrop-blur-sm pointer-events-auto text-center border border-white/10 w-full max-h-full overflow-y-auto">
            <h1 className="text-[clamp(2rem,8vw,2.5rem)] font-bold text-white mb-6 sm:mb-8 tracking-widest leading-none">
              PAUSED
            </h1>
            <div className="flex flex-col gap-3 sm:gap-4">
              <button
                onClick={handleResume}
                className="bg-emerald-500 hover:bg-emerald-400 text-white font-bold py-3 px-6 sm:px-8 rounded-full transition-colors text-lg sm:text-xl w-full"
              >
                RESUME
              </button>
              <button
                onClick={() => setShowSettings(true)}
                className="bg-white/10 hover:bg-white/20 text-white font-bold py-3 px-6 sm:px-8 rounded-full transition-colors text-base sm:text-lg w-full"
              >
                SETTINGS
              </button>
              <button
                onClick={handleStart}
                className="bg-red-500/80 hover:bg-red-500 text-white font-bold py-3 px-6 sm:px-8 rounded-full transition-colors text-base sm:text-lg w-full"
              >
                RESTART
              </button>
            </div>
          </div>
        )}

        {showSettings && (status === GameStatus.MENU || status === GameStatus.PAUSED) && (
          <div className="bg-black/90 p-6 sm:p-8 rounded-2xl backdrop-blur-md pointer-events-auto text-center border border-white/20 w-full max-h-full overflow-y-auto">
            <h2 className="text-[clamp(1.5rem,6vw,1.875rem)] font-bold text-white mb-6 sm:mb-8 tracking-widest leading-none">
              SETTINGS
            </h2>
            <div className="flex flex-col gap-3 sm:gap-4 mb-6 sm:mb-8">
              <button
                onClick={toggleDebug}
                className="bg-white/10 hover:bg-white/20 text-white font-mono py-3 px-4 sm:px-6 rounded-lg transition-colors flex justify-between items-center text-[clamp(0.75rem,3.5vw,1rem)]"
              >
                <span>Debug Overlay</span>
                <span className={isDebug ? "text-green-400" : "text-gray-500"}>{isDebug ? "ON" : "OFF"}</span>
              </button>
              <button
                onClick={cycleDpr}
                className="bg-white/10 hover:bg-white/20 text-white font-mono py-3 px-4 sm:px-6 rounded-lg transition-colors flex justify-between items-center text-[clamp(0.75rem,3.5vw,1rem)]"
              >
                <span>Graphics Quality</span>
                <span className="text-yellow-400">{dprCap === 1 ? "LOW" : dprCap === 1.5 ? "MED" : "HIGH"}</span>
              </button>
              <button
                onClick={cycleVolume}
                className="bg-white/10 hover:bg-white/20 text-white font-mono py-3 px-4 sm:px-6 rounded-lg transition-colors flex justify-between items-center text-[clamp(0.75rem,3.5vw,1rem)]"
              >
                <span>Master Volume</span>
                <span className="text-blue-400">{Math.round(masterVolume * 100)}%</span>
              </button>
              <button
                onClick={toggleMute}
                className="bg-white/10 hover:bg-white/20 text-white font-mono py-3 px-4 sm:px-6 rounded-lg transition-colors flex justify-between items-center text-[clamp(0.75rem,3.5vw,1rem)]"
              >
                <span>Audio Master</span>
                <span className={isMuted ? "text-red-400" : "text-green-400"}>{isMuted ? "MUTED" : "ON"}</span>
              </button>
            </div>
            <button
              onClick={() => { playClick(); setShowSettings(false); }}
              className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-3 px-6 sm:px-10 rounded-full transition-colors text-lg sm:text-xl w-full"
            >
              BACK
            </button>
          </div>
        )}

        {status === GameStatus.GAME_OVER && (
          <div className="bg-red-950/80 p-6 sm:p-8 rounded-2xl backdrop-blur-md pointer-events-auto text-center border border-red-500/30 w-full max-h-full overflow-y-auto">
            <h1 className="text-[clamp(2.5rem,10vw,3rem)] font-black text-red-500 mb-2 leading-none">CRASHED!</h1>

            <div className="bg-black/50 rounded-xl p-4 sm:p-6 mb-6 sm:mb-8 mt-4 sm:mt-6">
              <p className="text-gray-400 text-xs sm:text-sm uppercase tracking-wider mb-1">
                Final Score
              </p>
              <p className="text-[clamp(2.5rem,10vw,3rem)] font-mono text-white mb-4 leading-none">{score}</p>

              <div className="h-px w-full bg-white/10 my-4"></div>

              <p className="text-gray-400 text-xs sm:text-sm uppercase tracking-wider mb-1">
                Best Score
              </p>
              <p className="text-[clamp(1.25rem,6vw,1.5rem)] font-mono text-yellow-400 leading-none">{bestScore}</p>
            </div>

            <button
              onClick={handleStart}
              className="bg-white hover:bg-gray-200 text-black font-bold py-3 sm:py-4 px-6 sm:px-10 rounded-full transition-all transform hover:scale-105 active:scale-95 text-lg sm:text-xl w-full"
            >
              PLAY AGAIN
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
