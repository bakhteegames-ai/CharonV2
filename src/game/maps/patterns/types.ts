import type { Lane } from "../types";
import type { PlanBuilder } from "../MapBuilder";

export type PatternContext = {
  // deterministic rng per pattern selection
  float(): number;
  int(min: number, max: number): number;
  chance(p: number): boolean;
};

export type PatternInput = {
  zStart: number; // chunk start Z (more negative = further ahead)
  zEnd: number; // chunk end Z
  lastSafeLane: Lane; // safe lane coming from previous chunk
};

export type PatternOutput = {
  // The lane that is guaranteed to be safe at the end of this pattern,
  // used to chain patterns without impossible transitions.
  exitSafeLane: Lane;
};

export type PatternFn = (
  b: PlanBuilder,
  ctx: PatternContext,
  input: PatternInput,
) => PatternOutput;
