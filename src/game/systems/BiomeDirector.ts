export type BiomeId = "styx" | "asphodel" | "tartarus";

export class BiomeDirector {
  // Skeleton rule: simple distance thresholds. Tune later.
  public getBiome(distance: number): BiomeId {
    if (distance < 1500) return "styx";
    if (distance < 3000) return "asphodel";
    return "tartarus";
  }
}
