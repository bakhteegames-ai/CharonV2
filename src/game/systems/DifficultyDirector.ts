import { GAME_CONFIG } from "../config/constants";

function clamp(v: number, a: number, b: number) {
  return Math.max(a, Math.min(b, v));
}

export class DifficultyDirector {
  private difficulty = 0;

  public update(distance: number) {
    const ramp = Math.max(1, GAME_CONFIG.DIFFICULTY_RAMP_DISTANCE);
    const x = clamp(distance / ramp, 0, 1);
    const curve = Math.max(0.1, GAME_CONFIG.DIFFICULTY_CURVE);
    const eased = Math.pow(x, curve);
    this.difficulty = clamp(eased, GAME_CONFIG.DIFFICULTY_MIN, GAME_CONFIG.DIFFICULTY_MAX);
    return this.difficulty;
  }

  public get value() {
    return this.difficulty;
  }
}
