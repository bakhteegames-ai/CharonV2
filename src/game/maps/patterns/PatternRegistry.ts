import type { PatternFn } from "./types";

type ScaleFn = (id: string, baseWeight: number) => number;

export class PatternRegistry {
  private patterns: { id: string; weight: number; fn: PatternFn }[] = [];

  public add(id: string, weight: number, fn: PatternFn) {
    this.patterns.push({ id, weight: Math.max(0, weight), fn });
    return this;
  }

  public list() {
    return this.patterns;
  }

  public pick(r: number) {
    return this.pickScaled(r, (_id, w) => w);
  }

  public pickScaled(r: number, scale: ScaleFn) {
    const scaled = this.patterns.map((p) => ({
      ...p,
      w: Math.max(0, scale(p.id, p.weight)),
    }));
    const total = scaled.reduce((s, p) => s + p.w, 0);
    if (total <= 0)
      throw new Error("PatternRegistry has no patterns with weight > 0");
    let t = r * total;
    for (const p of scaled) {
      t -= p.w;
      if (t <= 0) return { id: p.id, weight: p.w, fn: p.fn };
    }
    const last = scaled[scaled.length - 1];
    return { id: last.id, weight: last.w, fn: last.fn };
  }
}
