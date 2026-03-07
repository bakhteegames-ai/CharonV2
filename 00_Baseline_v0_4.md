# CharonV2 — Canon v0.4 (Baseline / Freeze Point)

## Что это
Набор канонических правил проекта после закрытия:
- Phase 0 — baseline
- Phase 1 — content
- Phase 2A — art variants wiring
- Phase 2B — asset layer integration

## Коротко о проекте
Один кодовый скелет обслуживает **две версии игры**:

- **v2: Charon on Styx**
  - лодка / река / dark fantasy
  - jump выключен
  - down action = crouch
- **v3: Retro / Cyber Runner**
  - неон / sci-fi / synthwave
  - jump включён
  - down action = slide

## Что уже зафиксировано как канон

### Core movement
- 3 lane runner
- v2: jump disabled
- v2: crouch фиксированной длительности, без кулдауна
- v3: jump enabled
- v3: slide фиксированной длительности, без кулдауна
- dash / dive отсутствуют

### Core content
- Контент строится паттернами / чанками
- Capability gating обязателен
- Jump-only контент не попадает в v2
- OVERHEAD контент допустим и в v2, и в v3

### Core architecture
- gameplay systems не должны зависеть от конкретного арт-пака
- visual / audio / model activation идут через pack-layer
- один engine должен масштабироваться дальше на другие игры BTG

## Что теперь уже есть в коде
- работающий endless runner skeleton
- menu / HUD / pause / game over
- chunk content system
- difficulty waves
- biome-aware visual themes
- content pack layer
- game profile bootstrap
- audio pack hook
- environment art directives
- primitive player art directives
- GLTF player activation with fallback

## Что не менять без отдельной команды
- базовые правила движения
- отсутствие dash / dive
- one-skeleton-two-variants модель
- diff-review workflow
- resync после нескольких патчей

## Текущая цель проекта
Не “изобрести игру заново”, а **довести текущий skeleton до publishable product** через:
1. visual polish
2. asset drop
3. mobile must-pass
4. YSDK / monetization
5. QA / release package
