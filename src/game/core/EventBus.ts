export type GameEvent =
  | { type: "COIN_COLLECT" }
  | { type: "SHIELD_COLLECT" }
  | { type: "NEAR_MISS" }
  | { type: "PLAYER_HIT"; hadShield: boolean }
  | { type: "UI_CLICK" };

type Listener<T extends GameEvent["type"]> = (
  e: Extract<GameEvent, { type: T }>,
) => void;

export class EventBus {
  private static instance: EventBus | null = null;
  public static getInstance(): EventBus {
    if (!EventBus.instance) EventBus.instance = new EventBus();
    return EventBus.instance;
  }

  private listeners = new Map<GameEvent["type"], Set<Function>>();

  public on<T extends GameEvent["type"]>(type: T, fn: Listener<T>): () => void {
    if (!this.listeners.has(type)) this.listeners.set(type, new Set());
    this.listeners.get(type)!.add(fn);
    return () => this.off(type, fn);
  }

  public off<T extends GameEvent["type"]>(type: T, fn: Listener<T>) {
    this.listeners.get(type)?.delete(fn);
  }

  public emit(event: GameEvent) {
    const set = this.listeners.get(event.type);
    if (!set) return;
    for (const fn of set) (fn as any)(event);
  }
}
