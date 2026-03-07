import * as THREE from "three";
import { GAME_CONFIG, GAME_HOOKS } from "../config/constants";
import { Player } from "../entities/Player";
import { InputSystem } from "../systems/InputSystem";
import { SpawnSystem } from "../systems/SpawnSystem";
import { MapSystem } from "../systems/MapSystem";
import { CollisionSystem } from "../systems/CollisionSystem";
import { GameState, GameStatus } from "../state/GameState";
import { CameraSystem } from "../systems/CameraSystem";
import { TrackSystem } from "../systems/TrackSystem";
import { DebugSystem } from "../systems/DebugSystem";
import { VisualPlayer } from "../visual/VisualPlayer";
import { GameFeelSystem } from "../systems/GameFeelSystem";
import { PlayerVfxSystem } from "../systems/PlayerVfxSystem";
import { CoinParticlesSystem } from "../systems/CoinParticlesSystem";
import { EventBus } from "./EventBus";
import { ChunkMapScript } from "../maps/ChunkMapScript";
import { DifficultyDirector } from "../systems/DifficultyDirector";
import { BiomeDirector } from "../systems/BiomeDirector";
import { VisualThemeSystem } from "../systems/VisualThemeSystem";
import { GAME_VARIANT } from "../config/variant";

export class GameWorld {
  public readonly root = new THREE.Group();
  public readonly envRoot = new THREE.Group();
  public readonly entitiesRoot = new THREE.Group();
  public readonly vfxRoot = new THREE.Group(); // reserved for later

  private gameState: GameState;
  private input: InputSystem;
  private player: Player;
  private visualPlayer: VisualPlayer;
  private spawnSystem: SpawnSystem;
  private mapSystem: MapSystem;
  private collisionSystem: CollisionSystem;
  private cameraSystem: CameraSystem;
  private trackSystem: TrackSystem;
  private debugSystem: DebugSystem;

  private ambientLight: THREE.AmbientLight | null = null;
  private dirLight: THREE.DirectionalLight | null = null;
  private visualTheme: VisualThemeSystem | null = null;

  private bus: EventBus;
  private gameFeel: GameFeelSystem;
  private playerVfx: PlayerVfxSystem;
  private coinParticles: CoinParticlesSystem;
  private difficultyDirector: DifficultyDirector;
  private biomeDirector: BiomeDirector;

  constructor(
    private scene: THREE.Scene,
    private camera: THREE.PerspectiveCamera,
  ) {
    this.gameState = GameState.getInstance();
    this.bus = EventBus.getInstance();

    // Roots (skeleton: clear scene graph)
    this.root.name = "WorldRoot";
    this.envRoot.name = "EnvRoot";
    this.entitiesRoot.name = "EntitiesRoot";
    this.vfxRoot.name = "VfxRoot";
    this.root.add(this.envRoot, this.entitiesRoot, this.vfxRoot);
    this.scene.add(this.root);

    this.setupLighting();

    this.input = new InputSystem();
    this.player = new Player(this.input);
    this.entitiesRoot.add(this.player.mesh);
    this.visualPlayer = new VisualPlayer(this.player);

    const seed = Date.now() >>> 0;
    this.gameState.setRunSeed(seed);
    this.difficultyDirector = new DifficultyDirector();
    this.biomeDirector = new BiomeDirector();

    this.trackSystem = new TrackSystem(this.envRoot as unknown as THREE.Scene);
    // TrackSystem expects a Scene-like add(); Group has add() too, so OK.

    // Phase 2: Visual Theme (variant × biome) — strictly visual changes only.
    if (this.ambientLight && this.dirLight) {
      this.visualTheme = new VisualThemeSystem(
        this.scene,
        this.ambientLight,
        this.dirLight,
        this.trackSystem,
      );
      // Apply initial theme (default biome is styx).
      this.visualTheme.applyIfChanged(this.gameState.biomeId, GAME_VARIANT);
    }

    this.spawnSystem = new SpawnSystem(
      this.entitiesRoot as unknown as THREE.Scene,
    );
    this.mapSystem = new MapSystem(new ChunkMapScript());
    this.mapSystem.reset(seed);
    this.collisionSystem = new CollisionSystem(this.player);
    this.cameraSystem = new CameraSystem(
      this.camera,
      this.player,
      this.gameState,
    );
    this.debugSystem = new DebugSystem(
      this.gameState,
      this.spawnSystem,
      this.player,
    );

    this.gameFeel = new GameFeelSystem(this.bus, this.gameState);
    this.playerVfx = new PlayerVfxSystem(this.player, this.gameState, this.bus);
    this.coinParticles = new CoinParticlesSystem(
      this.vfxRoot as unknown as THREE.Scene,
      this.player,
      this.gameState,
    );
  }

  private setupLighting() {
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
    this.ambientLight = ambientLight;
    this.envRoot.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffddaa, 1.5);
    this.dirLight = dirLight;
    dirLight.position.set(20, 100, 50);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    dirLight.shadow.camera.top = 50;
    dirLight.shadow.camera.bottom = -50;
    dirLight.shadow.camera.left = -50;
    dirLight.shadow.camera.right = 50;
    dirLight.shadow.camera.near = 0.5;
    dirLight.shadow.camera.far = 150;
    this.envRoot.add(dirLight);
  }

  public update(dt: number, timeMs: number) {
    // Pause toggle (skeleton: centralized)
    if (this.input.pause) {
      if (this.gameState.status === GameStatus.PLAYING)
        this.gameState.setStatus(GameStatus.PAUSED);
      else if (this.gameState.status === GameStatus.PAUSED)
        this.gameState.setStatus(GameStatus.PLAYING);
    }

    if (this.gameState.status === GameStatus.PLAYING) {
      if (this.gameState.currentSpeed < GAME_CONFIG.MAX_SPEED) {
        this.gameState.currentSpeed += GAME_CONFIG.SPEED_ACCELERATION * dt;
      }

      this.player.update(dt);
      this.visualPlayer.update(dt);

      const distance = Math.abs(this.player.mesh.position.z);
      this.gameState.difficulty = this.difficultyDirector.update(distance);

      this.spawnSystem.update(dt, this.player.mesh.position.z);

      // Map planning ahead of the player (skeleton)
      const lookAhead = 180; // safe buffer; tune later
      const biomeId = this.biomeDirector.getBiome(distance);
      this.gameState.biomeId = biomeId;
      
      // Visual Theme reacts to biome changes (no gameplay impact).
      this.visualTheme?.applyIfChanged(biomeId, GAME_VARIANT);
      this.visualTheme?.update(dt);

      this.mapSystem.update({
        playerZ: this.player.mesh.position.z,
        generateToZ: this.player.mesh.position.z - lookAhead,
        distance,
        speed: this.gameState.currentSpeed,
        difficulty: this.gameState.difficulty,
        biomeId,
      });

      const dbg = this.mapSystem.getDebugInfo();
      if (dbg) {
        this.gameState.debugChunkIndex = dbg.chunkIndex;
        this.gameState.debugPatternId = dbg.patternId;
      }

      // Consume planned events that are within a forward window (AHEAD of the player).
      // Player moves along -Z (more negative). Ahead means: e.z < playerZ.
      const minAhead = 12; // don't spawn almost-on-top
      const maxAhead = 220; // how far ahead we allow spawns
      const pz = this.player.mesh.position.z;

      const events = this.mapSystem.drainEvents((e) => {
        const dz = pz - e.z; // positive if e is ahead (more negative)
        return dz >= minAhead && dz <= maxAhead;
      });
      this.spawnSystem.applyPlan(events);

      this.collisionSystem.update(
        dt,
        this.spawnSystem.getActiveObstacles(),
        this.spawnSystem.getActiveCoins(),
        this.spawnSystem.getActiveShields(),
      );

      if (GAME_HOOKS.ENABLE_COIN_COMBO && this.gameState.comboTimer > 0) {
        this.gameState.comboTimer -= dt;
        if (this.gameState.comboTimer <= 0) {
          this.gameState.comboMultiplier = 1;
          this.gameState.notify();
        }
      }

      this.gameState.setDistance(distance);

      this.trackSystem.update(
        dt,
        this.player.mesh.position.z,
        this.gameState.currentSpeed,
      );
      this.cameraSystem.update(dt);

      this.playerVfx.update(dt);
      this.coinParticles.update(dt);
    }

    this.debugSystem.update(timeMs);

    // Clear one-frame inputs
    this.input.update();
  }

  public resetGame() {
    this.gameState.reset();
    this.gameState.currentSpeed = GAME_CONFIG.INITIAL_SPEED;
    const seed = Date.now() >>> 0;
    this.gameState.setRunSeed(seed);
    this.gameState.difficulty = 0;
    this.mapSystem.reset(seed);
    this.player.reset();
    this.spawnSystem.reset();
    this.gameState.setStatus(GameStatus.PLAYING);
  }

  public resumeGame() {
    if (this.gameState.status === GameStatus.PAUSED) {
      this.gameState.setStatus(GameStatus.PLAYING);
    }
  }

  public dispose() {
    this.scene.remove(this.root);
    this.input.dispose();
    this.gameFeel.dispose();
    this.playerVfx.dispose();
    this.visualPlayer.dispose();
    this.coinParticles.dispose();
  }
}
