# Project Structure and Asset Contract v0.4a

## 1. Зачем нужен этот файл
Этот файл должен объяснять любому ИИ и любому человеку:
- где лежит код
- где лежат runtime-ассеты
- где лежат source-ассеты
- кто и как их подхватывает
- какой формат допустим
- что уже wired, а что пока only planned

---

## 2. Актуальная структура проекта по архиву

```text
project-root/
  public/
    models/
    audio/
    textures/
    ui/
  src/
    game/
      audio/
      config/
      core/
      entities/
      maps/
      platform/
      state/
      systems/
      utils/
      visual/
    ui/
  package.json
  vite.config.ts
  ...
```

### Важно
В текущем архиве папка `/public` уже существует как **runtime scaffold**:
- `public/models/`
- `public/audio/`
- `public/textures/`
- `public/ui/`

На текущем этапе внутри неё могут лежать только служебные placeholder-файлы (`.gitkeep`).
Это **не значит**, что реальные runtime assets уже заинтегрированы.
Это значит только то, что структура под asset drop уже подготовлена.

---

## 3. Каноническое разделение директорий

### 3.1 Runtime assets
Это файлы, которые реально грузятся игрой в браузере.

```text
public/models
public/audio
public/textures
public/ui
```

### 3.2 Source assets
Это рабочие исходники, которые не должны напрямую ехать в браузер.

```text
design_source/models
design_source/textures
design_source/audio
design_source/ui
marketing
```

### 3.3 Docs / manifests
```text
docs/
asset_manifests/
```

### Важно
Manifest pack уже существует и должен считаться частью handoff bundle.
Не предлагать "создать manifests с нуля", если в Sources уже лежит актуальный manifest pack.

---

## 4. Что уже wired в коде

## 4.1 Player models
### Consumer
- `src/game/visual/VisualPlayer.ts`
- `src/game/core/AssetCache.ts`
- `src/game/platform/GameProfile.ts`
- `src/game/platform/ContentPacks.ts`

### Current behavior
- `ContentPack.art.player.visualMode`
- `modelUrl`
- `modelScale`
- `colliderVisible`
- `lockRotation`
- `lockScale`

Если `visualMode = "gltf"`, `VisualPlayer` пытается загрузить модель.  
Если загрузка падает, primitive collider остаётся fallback-визуалом.

### Current target runtime paths
- `/models/charon_boat.glb`
- `/models/runner.glb`

### Формат
- предпочтительно `.glb`
- self-contained binary
- без внешних ссылок на текстуры, если можно
- scale в метрах / игровых единицах, где 1 unit ≈ 1 meter

### Рекомендации
- Up axis: `+Y`
- forward direction: `-Z`
- origin желательно около центра по X/Z
- нижняя точка модели должна быть на уровне пола или близко; код всё равно bottom-align’ит модель
- минимум 1 animation clip, если нужен autoplay: код играет **первый clip**

### Анимации
Сейчас код использует:
- только **первый animation clip** из GLTF

Значит на текущем этапе:
- допустимо иметь 1 clip `Idle` или `RowingLoop`
- многосоставные state machines пока не wired

---

## 4.2 Audio assets
### Consumer
- `src/game/audio/AudioManager.ts`
- `src/game/platform/ContentPacks.ts`

### Current target runtime paths
- `/audio/coin.mp3`
- `/audio/hit.mp3`
- `/audio/ui_click.mp3`
- `/audio/v2_ambience.mp3`
- `/audio/v3_ambience.mp3`

### Формат
- `mp3` как канонический минимум
- `ogg` допустим как дополнительная версия позже
- 44.1kHz или 48kHz
- короткие SFX — mono или stereo
- ambience — seamless loop

### Current behavior
- missing files не валят игру
- ambience loop управляется через pack-layer и game state lifecycle
- audio context стартует после user gesture

---

## 4.3 Environment art directives
### Consumer
- `src/game/visual/VisualTheme.ts`
- `src/game/systems/VisualThemeSystem.ts`
- `src/game/systems/TrackSystem.ts`
- `src/game/visual/MeshFactory.ts`

### Current behavior
Через `ContentPacks.art.environment` уже управляются:
- scene background / fog
- lighting
- track visuals
- entity colors (coin / shield / obstacle)

### Что это значит
Уже можно безопасно обновлять:
- palette
- fog ranges
- track edge/divider feel
- readability colors

Без изменения gameplay systems.

---

## 4.4 Primitive player visuals
### Consumer
- `src/game/entities/Player.ts`
- `src/game/platform/GameProfile.ts`
- `src/game/platform/ContentPacks.ts`

### Current pack-driven properties
- `color`
- `roughness`
- `metalness`
- `emissiveIntensity`

То есть даже если GLTF не загрузился, версия всё равно визуально различается.

---

## 5. Что НЕ wired прямо сейчас

### 5.1 General texture asset loading
Нет отдельного texture pack loader для:
- obstacle textures
- track textures from file
- UI atlases
- skybox cubemaps

Сейчас визуал трека — canvas-generated.  
Если нужны реальные texture maps, это отдельная будущая задача.

### 5.2 Multi-state character animation system
Нет state machine для:
- run
- jump
- slide
- hit
- death

Есть только autoplay первого clip.

### 5.3 UI art runtime contract
Пока нет готовой системы, которая автоматически подхватывает:
- loading screens
- panel frames
- comic-style overlays
- logo variants

Это либо будущий React UI asset pass, либо отдельный UI pack layer.

---

## 6. Форматы и требования по категориям

## 6.1 Models
**Runtime path:** `public/models/...`

### Канонические имена сейчас
- `charon_boat.glb`
- `runner.glb`

### Рекомендуемые ограничения
- 1 основной mesh root
- compressed if possible
- texture budget умеренный
- без гигантских embedded textures на мобильную цель

### Рекомендуемый экспорт
- GLB
- apply transforms before export
- remove unused materials / empty nodes
- bake simple materials where possible

---

## 6.2 Audio
**Runtime path:** `public/audio/...`

### Канонические имена сейчас
- `coin.mp3`
- `hit.mp3`
- `ui_click.mp3`
- `v2_ambience.mp3`
- `v3_ambience.mp3`

### Рекомендуемые ограничения
- ambience loops seamless
- avoid clipping
- SFX короткие и читаемые
- не раздувать размер без необходимости

---

## 6.3 Textures / UI
**Runtime path:** `public/textures/...`, `public/ui/...`

### Текущий статус
Папки уже существуют, но general runtime texture/UI pack layer пока не wired.

### Формат
- `.webp` или `.png`
- runtime-ready dimensions
- не хранить тяжёлые production source files в `/public`

---

## 7. Manifest rule

Для любого реального asset drop должно быть понятно:
- `asset_id`
- `source_file`
- `runtime_target_path`
- `format`
- `used_by_code`
- `fallback`
- `status`

Если manifest pack уже существует, его надо использовать как source of truth, а не дублировать заново.

---

## 8. Что грузить в Sources для работы с ИИ

### Обязательный минимум
- свежий архив проекта
- docs pack
- asset manifests

### Когда прикладывать сами бинарные ассеты
- когда нужен review ассета
- когда надо проверить точное имя / формат / путь
- когда надо объяснить агенту, что именно уже готово

### Когда не надо
- не нужно каждый раз грузить весь набор source files в Sources, если задача про код
- но runtime target path и manifest должны быть зафиксированы обязательно

---

## 9. Рекомендуемое будущее расширение структуры

```text
project-root/
  public/
    models/
    audio/
    textures/
    ui/
  design_source/
    models/
    textures/
    audio/
    ui/
  marketing/
  docs/
  asset_manifests/
  src/
```

Это самый понятный вид для новых ИИ и новых людей в проекте.

---

## 10. Главное правило
Если новый агент не может за 2 минуты понять:
- где runtime assets
- где source assets
- чем уже управляет код
- что wired / not wired

значит документация всё ещё недостаточно конкретная.
