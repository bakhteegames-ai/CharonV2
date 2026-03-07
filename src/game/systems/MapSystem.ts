import type { IMapScript, MapQuery, MapDebugInfo } from "../maps/IMapScript";
import type { SpawnPlan, SpawnEvent } from "../maps/types";

// MapSystem holds the active "map script" and produces spawn plans.
export class MapSystem {
  private plannedEvents: SpawnEvent[] = [];
  private lastDebug: MapDebugInfo | null = null;

  constructor(private script: IMapScript) {}

  public setScript(script: IMapScript) {
    this.script = script;
  }

  public reset(runSeed: number) {
    this.plannedEvents = [];
    this.script.reset({ runSeed });
  }

  public update(query: MapQuery) {
    const plan: SpawnPlan = this.script.generate(query);
    if (plan.events.length > 0) {
      // Append new events; SpawnSystem will consume them
      this.plannedEvents.push(...plan.events);
    }

    if (this.script.getDebugInfo) {
      this.lastDebug = this.script.getDebugInfo();
    }
  }

  public getDebugInfo(): MapDebugInfo | null {
    return this.lastDebug;
  }

  // SpawnSystem pulls and removes events that are now inside spawn window.
  public drainEvents(filter: (e: SpawnEvent) => boolean): SpawnEvent[] {
    const out: SpawnEvent[] = [];
    const keep: SpawnEvent[] = [];
    for (const e of this.plannedEvents) {
      if (filter(e)) out.push(e);
      else keep.push(e);
    }
    this.plannedEvents = keep;
    return out;
  }
}
