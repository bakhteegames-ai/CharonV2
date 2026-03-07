export class Rng {
  private t: number;

  constructor(seed: number) {
    this.t = seed >>> 0;
  }

  // mulberry32
  public float(): number {
    let t = (this.t += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  public int(min: number, max: number): number {
    const r = this.float();
    return Math.floor(r * (max - min + 1)) + min;
  }

  public chance(p: number): boolean {
    return this.float() < p;
  }
}
