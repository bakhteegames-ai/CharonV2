import { GAME_CONFIG, GAME_HOOKS } from "../config/constants";
import type { BiomeId } from "../systems/BiomeDirector";

export enum GameStatus {
  MENU = "MENU",
  PLAYING = "PLAYING",
  PAUSED = "PAUSED",
  GAME_OVER = "GAME_OVER",
}

type Listener = () => void;

export class GameState {
  private static instance: GameState;

  public status: GameStatus = GameStatus.MENU;
  public bestScore: number = 0;
  public distance: number = 0;
  public coins: number = 0;
  public currentSpeed: number = 0;

  // Progression (0..1)
  public difficulty: number = 0;

  // Map debug
  public biomeId: BiomeId = "styx";
  public debugChunkIndex: number = 0;
  public debugPatternId: string = "none";

  // Determinism (debuggable runs)
  public runSeed: number = 0;

  // Hooks state
  public bonusScore: number = 0;
  public comboMultiplier: number = 1;
  public comboTimer: number = 0;
  public hasShield: boolean = false;
  public nearMissCount: number = 0;

  // Juice
  public shakeTimer: number = 0;

  // Settings
  public isMuted: boolean = false;
  public masterVolume: number = 1.0;
  public dprCap: number = 2;
  private externalMuteReasons: Set<string> = new Set();

  public get effectiveMute(): boolean {
    return this.isMuted || this.externalMuteReasons.size > 0;
  }

  // Debug Stats
  public isDebug: boolean = import.meta.env.DEV;
  public fps: number = 0;
  public activeObstacles: number = 0;
  public activeCoins: number = 0;
  public playerX: number = 0;
  public targetX: number = 0;

  public get score(): number {
    return (
      Math.floor(this.distance) +
      this.coins * GAME_CONFIG.SCORE_PER_COIN +
      this.bonusScore
    );
  }

  private listeners: Set<Listener> = new Set();

  // React HUD can be expensive if we notify every frame.
  // We throttle "distance-driven" updates to keep UI smooth on mobile.
  private lastHudNotifyMs: number = 0;
  private readonly HUD_NOTIFY_INTERVAL_MS: number = 80;

  private constructor() {
    const savedBest = localStorage.getItem("runner_best_score");
    if (savedBest) {
      this.bestScore = parseInt(savedBest, 10) || 0;
    }
    const savedMute = localStorage.getItem("runner_is_muted");
    if (savedMute !== null) this.isMuted = savedMute === "true";
    const savedVol = localStorage.getItem("runner_master_volume");
    if (savedVol !== null) this.masterVolume = parseFloat(savedVol);
  }

  public static getInstance(): GameState {
    if (!GameState.instance) {
      GameState.instance = new GameState();
    }
    return GameState.instance;
  }

  public setStatus(newStatus: GameStatus) {
    if (this.status !== newStatus) {
      this.status = newStatus;

      if (newStatus === GameStatus.GAME_OVER) {
        if (this.score > this.bestScore) {
          this.bestScore = this.score;
          localStorage.setItem("runner_best_score", this.bestScore.toString());
        }
      }

      this.notify();
    }
  }

  public addCoin() {
    this.coins += 1;
    if (GAME_HOOKS.ENABLE_COIN_COMBO) {
      this.comboMultiplier = Math.min(
        GAME_CONFIG.MAX_COIN_COMBO,
        this.comboMultiplier + 1,
      );
      this.comboTimer = GAME_CONFIG.COIN_COMBO_TIMEOUT;
      if (this.comboMultiplier > 1) {
        this.bonusScore +=
          GAME_CONFIG.SCORE_PER_COIN * (this.comboMultiplier - 1);
      }
    }
    this.notify();
  }

  public activateShield() {
    if (GAME_HOOKS.ENABLE_SHIELD) {
      this.hasShield = true;
      this.notify();
    }
  }

  public breakShield() {
    this.hasShield = false;
    this.notify();
  }

  public triggerNearMiss() {
    if (GAME_HOOKS.ENABLE_NEAR_MISS) {
      this.bonusScore += GAME_CONFIG.NEAR_MISS_BONUS;
      this.nearMissCount++;
      this.notify();
    }
  }

  public triggerShake(duration: number = GAME_CONFIG.SHAKE_DURATION) {
    this.shakeTimer = duration;
  }

  public setDistance(dist: number) {
    this.distance = dist;
    this.notifyHudThrottled();
  }

  private notifyHudThrottled() {
    const now = performance.now();
    if (now - this.lastHudNotifyMs >= this.HUD_NOTIFY_INTERVAL_MS) {
      this.lastHudNotifyMs = now;
      this.notify();
    }
  }

  public setDebugStats(
    fps: number,
    obs: number,
    coins: number,
    pX: number,
    tX: number,
  ) {
    this.fps = fps;
    this.activeObstacles = obs;
    this.activeCoins = coins;
    this.playerX = pX;
    this.targetX = tX;
    this.notify();
  }

  public toggleDebug() {
    this.isDebug = !this.isDebug;
    this.notify();
  }

  public toggleMute() {
    this.isMuted = !this.isMuted;
    localStorage.setItem("runner_is_muted", this.isMuted.toString());
    this.notify();
  }

  public setMasterVolume(vol: number) {
    this.masterVolume = Math.max(0, Math.min(1, vol));
    localStorage.setItem("runner_master_volume", this.masterVolume.toString());
    this.notify();
  }

  public beginExternalMute(reason: string) {
    this.externalMuteReasons.add(reason);
    this.notify();
  }

  public endExternalMute(reason: string) {
    this.externalMuteReasons.delete(reason);
    this.notify();
  }

  public setDprCap(cap: number) {
    this.dprCap = cap;
    this.notify();
  }

  public setRunSeed(seed: number) {
    this.runSeed = seed >>> 0;
  }

  public reset() {
    this.status = GameStatus.MENU;
    this.distance = 0;
    this.coins = 0;
    this.currentSpeed = 0;
    this.bonusScore = 0;
    this.comboMultiplier = 1;
    this.comboTimer = 0;
    this.hasShield = false;
    this.nearMissCount = 0;
    this.shakeTimer = 0;
    this.notify();
  }

  public subscribe(listener: Listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  public notify() {
    this.listeners.forEach((l) => l());
  }
}
