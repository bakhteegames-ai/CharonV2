import * as THREE from "three";
import { GAME_CONFIG } from "../config/constants";
import { GameState, GameStatus } from "../state/GameState";
import { GameWorld } from "./GameWorld";
import { disposeSceneResources } from "../utils/threeDispose";

export class Engine {
  private container: HTMLElement;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private world: GameWorld;

  private lastTime: number = 0;
  private animationFrameId: number | null = null;
  private currentDprCap: number = 2;
  
  private autoPausedByFocusLoss: boolean = false;
  private readonly FOCUS_MUTE_REASON = "focus_loss";

  constructor(container: HTMLElement) {
    this.container = container;

    // Init Three.js
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(GAME_CONFIG.COLOR_BG);
    this.scene.fog = new THREE.FogExp2(GAME_CONFIG.COLOR_BG, 0.025);

    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000,
    );

    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: "high-performance",
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.container.appendChild(this.renderer.domElement);
    this.world = new GameWorld(this.scene, this.camera);

    // Event listeners for resize and orientation
    window.addEventListener("resize", this.onWindowResize);
    window.addEventListener("orientationchange", this.onWindowResize);
    document.addEventListener("fullscreenchange", this.onWindowResize);
    if (window.visualViewport) {
      window.visualViewport.addEventListener("resize", this.onWindowResize);
    }
    
    this.setupFocusAutoPause();

    // Start loop
    this.start();
  }

  private onVisibilityChange = () => {
    if (document.hidden) this.pauseForFocusLoss();
    else this.resumeFromFocusLoss();
  };

  private onWindowBlur = () => {
    this.pauseForFocusLoss();
  };

  private onWindowFocus = () => {
    this.resumeFromFocusLoss();
  };

  private onPageHide = () => {
    this.pauseForFocusLoss();
  };

  private onPageShow = () => {
    this.resumeFromFocusLoss();
  };

  private setupFocusAutoPause() {
    // Ensure we don't carry stale mute flags across dev remounts.
    if (!document.hidden) {
      GameState.getInstance().endExternalMute(this.FOCUS_MUTE_REASON);
    }

    document.addEventListener("visibilitychange", this.onVisibilityChange);
    window.addEventListener("blur", this.onWindowBlur);
    window.addEventListener("focus", this.onWindowFocus);
    // iOS/Safari: pagehide/pageshow can be more reliable than visibilitychange.
    window.addEventListener("pagehide", this.onPageHide);
    window.addEventListener("pageshow", this.onPageShow);
  }

  private teardownFocusAutoPause() {
    document.removeEventListener("visibilitychange", this.onVisibilityChange);
    window.removeEventListener("blur", this.onWindowBlur);
    window.removeEventListener("focus", this.onWindowFocus);
    window.removeEventListener("pagehide", this.onPageHide);
    window.removeEventListener("pageshow", this.onPageShow);
    GameState.getInstance().endExternalMute(this.FOCUS_MUTE_REASON);
    this.autoPausedByFocusLoss = false;
  }

  private pauseForFocusLoss() {
    const state = GameState.getInstance();
    state.beginExternalMute(this.FOCUS_MUTE_REASON);
    this.stop();

    // Only auto-pause if we were actively playing.
    if (state.status === GameStatus.PLAYING) {
      this.autoPausedByFocusLoss = true;
      state.setStatus(GameStatus.PAUSED);
    }
  }

  private resumeFromFocusLoss() {
    const state = GameState.getInstance();
    state.endExternalMute(this.FOCUS_MUTE_REASON);
    if (!document.hidden) this.start();

    // Keep PAUSED; user resumes manually. Just clear the flag.
    if (!document.hidden && this.autoPausedByFocusLoss) {
      this.autoPausedByFocusLoss = false;
    }
  }

  private onWindowResize = () => {
    const width = window.visualViewport ? window.visualViewport.width : window.innerWidth;
    const height = window.visualViewport ? window.visualViewport.height : window.innerHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  };

  public start() {
    if (this.animationFrameId === null) {
      this.lastTime = performance.now();
      this.loop(this.lastTime);
    }
  }

  public stop() {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  public resetGame() {
    this.world.resetGame();
  }

  public resumeGame() {
    this.world.resumeGame();
  }

  private loop = (time: number) => {
    this.animationFrameId = requestAnimationFrame(this.loop);

    // Apply DPR changes dynamically
    const stateDpr = GameState.getInstance().dprCap;
    if (this.currentDprCap !== stateDpr) {
      this.currentDprCap = stateDpr;
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, stateDpr));
    }

    // Clamp dt to avoid logic/physics explosions after tab switching / hiccups
    const dt = Math.min(Math.max((time - this.lastTime) / 1000, 0), 0.05);
    this.lastTime = time;

    this.world.update(dt, time);
    this.render();
  };

  private render() {
    this.renderer.render(this.scene, this.camera);
  }

  public dispose() {
    this.stop();
    this.teardownFocusAutoPause();
    window.removeEventListener("resize", this.onWindowResize);
    window.removeEventListener("orientationchange", this.onWindowResize);
    document.removeEventListener("fullscreenchange", this.onWindowResize);
    if (window.visualViewport) {
      window.visualViewport.removeEventListener("resize", this.onWindowResize);
    }
    this.world.dispose();
    // Dispose GPU resources for dev HMR / remounts
    disposeSceneResources(this.scene);
    this.renderer.renderLists.dispose();
    this.renderer.dispose();
    (this.renderer as any).forceContextLoss?.();
    if (this.container.contains(this.renderer.domElement)) {
      this.container.removeChild(this.renderer.domElement);
    }
  }
}
