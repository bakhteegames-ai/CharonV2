import { EventBus } from "../core/EventBus";
import { GameState, GameStatus } from "../state/GameState";
import type { AudioPack, EngineSoundId } from "../platform/ContentPacks";

type SoundId = EngineSoundId;

export class AudioManager {
  private static instance: AudioManager;
  private ctx: AudioContext | null = null;
  private buffers: Map<SoundId, AudioBuffer> = new Map();
  private soundUrls: Map<SoundId, string> = new Map();
  private masterGain: GainNode | null = null;
  
  private activeLoopIds: Set<SoundId> = new Set();
  private loopSources: Map<SoundId, AudioBufferSourceNode> = new Map();
  private isPaused: boolean = false;
  
  private ambienceLoopId: SoundId | null = null;

  private constructor() {
    this.syncPauseStateFromGameState();
    // Default URLs (can be overridden by platform ContentPacks).
    // Expected formats: mp3 or ogg
    // Place files in /public/audio/
    this.soundUrls.set("coin", "/audio/coin.mp3");
    this.soundUrls.set("hit", "/audio/hit.mp3");
    this.soundUrls.set("ui_click", "/audio/ui_click.mp3");
    this.soundUrls.set("ambience", "/audio/ambience.mp3");
    this.ambienceLoopId = null;

    const initAudio = () => {
      if (!this.ctx) {
        this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        this.masterGain = this.ctx.createGain();
        this.masterGain.connect(this.ctx.destination);
        this.updateVolume();
        
        // Load current pack (may include missing files; that's OK).
        this.reloadAllSounds();
      }
      document.removeEventListener("click", initAudio);
      document.removeEventListener("keydown", initAudio);
      document.removeEventListener("touchstart", initAudio);
    };
    
    document.addEventListener("click", initAudio);
    document.addEventListener("keydown", initAudio);
    document.addEventListener("touchstart", initAudio);

    EventBus.getInstance().on("COIN_COLLECT", () => this.play("coin"));
    EventBus.getInstance().on("PLAYER_HIT", () => this.play("hit"));
    EventBus.getInstance().on("UI_CLICK", () => this.play("ui_click", true));

    GameState.getInstance().subscribe(() => {
      this.updateVolume();
      this.updatePauseState();
    });
  }

  public static getInstance(): AudioManager {
    if (!AudioManager.instance) {
      AudioManager.instance = new AudioManager();
    }
    return AudioManager.instance;
  }

  private async loadSound(id: SoundId, url: string) {
    if (!this.ctx) return;
    try {
      const response = await fetch(url);
      if (!response.ok) return; // Fail silently if file doesn't exist yet
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await this.ctx.decodeAudioData(arrayBuffer);
      this.buffers.set(id, audioBuffer);

      // If this sound is expected to be looping and we are currently unpaused,
      // start (or restart) it once the buffer becomes available.
      if (!this.isPaused && this.activeLoopIds.has(id)) {
        this.startLoopSource(id);
      }
    } catch (e) {
      console.warn(`Failed to load audio: ${url}`, e);
    }
  }

  private syncPauseStateFromGameState() {
    const state = GameState.getInstance();
    this.isPaused =
      state.status === GameStatus.PAUSED ||
      state.status === GameStatus.MENU ||
      state.status === GameStatus.GAME_OVER;
  }

  private reloadAllSounds() {
    if (!this.ctx) return;
    for (const [id, url] of this.soundUrls.entries()) {
      if (!url) continue;
      void this.loadSound(id, url);
    }
  }

  /**
   * Phase 2B: asset layer hook.
   * Overwrites URLs and (optionally) enables a looped ambience id.
   */
  public applyAudioPack(pack: AudioPack) {
    if (pack?.sounds) {
      for (const [id, url] of Object.entries(pack.sounds) as [SoundId, string][]) {
        if (!url) continue;
        this.soundUrls.set(id, url);
        if (this.ctx) void this.loadSound(id, url);
      }
    }

    const nextAmbience = (pack?.ambienceLoopId as SoundId | undefined) ?? null;
    if (nextAmbience !== this.ambienceLoopId) {
      // Stop previous ambience if any.
      if (this.ambienceLoopId) {
        this.stopLoop(this.ambienceLoopId);
        this.activeLoopIds.delete(this.ambienceLoopId);
      }

      this.ambienceLoopId = nextAmbience;

      // Enable new ambience.
      if (this.ambienceLoopId) {
        this.activeLoopIds.add(this.ambienceLoopId);
        if (!this.isPaused) this.startLoopSource(this.ambienceLoopId);
      }
    }
  }

  private updateVolume() {
    if (!this.masterGain || !this.ctx) return;
    const state = GameState.getInstance();
    const volume = state.effectiveMute ? 0 : state.masterVolume;
    
    // Smooth volume transition to avoid clicking
    this.masterGain.gain.setTargetAtTime(volume, this.ctx.currentTime, 0.05);
  }

  private updatePauseState() {
    const wasPaused = this.isPaused;
    this.syncPauseStateFromGameState();

    if (this.isPaused && !wasPaused) {
      this.loopSources.forEach(source => {
        try { source.stop(); } catch(e) {}
      });
      this.loopSources.clear();
    } else if (!this.isPaused && wasPaused) {
      this.activeLoopIds.forEach(id => this.startLoopSource(id));
    }
  }

  public play(id: SoundId, isUi: boolean = false) {
    if (!this.ctx || !this.masterGain) return;
    
    const state = GameState.getInstance();
    if (state.effectiveMute) return;
    
    // Don't play game sounds if paused
    if (!isUi && state.status === GameStatus.PAUSED) return;

    const buffer = this.buffers.get(id);
    if (!buffer) return;

    const source = this.ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(this.masterGain);
    source.start(0);
  }

  public playLoop(id: SoundId) {
    this.activeLoopIds.add(id);
    if (!this.isPaused) {
      this.startLoopSource(id);
    }
  }

  public stopLoop(id: SoundId) {
    this.activeLoopIds.delete(id);
    const source = this.loopSources.get(id);
    if (source) {
      try { source.stop(); } catch(e) {}
      this.loopSources.delete(id);
    }
  }

  private startLoopSource(id: SoundId) {
    if (!this.ctx || !this.masterGain) return;
    if (this.loopSources.has(id)) return;
    
    const buffer = this.buffers.get(id);
    if (!buffer) return;

    const source = this.ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    source.connect(this.masterGain);
    source.start(0);
    this.loopSources.set(id, source);
  }

  // Public API for external integrations (e.g., ads)
  public beginExternalMute(reason: string) {
    GameState.getInstance().beginExternalMute(reason);
  }

  public endExternalMute(reason: string) {
    GameState.getInstance().endExternalMute(reason);
  }
}
