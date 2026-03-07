# Current Project State — CharonV2 (after Phase 2C prep passes + latest resync)

## 1. Current truth
Текущий архив проекта уже не просто имеет закрытый asset-layer, но и прошёл первый структурный и визуальный prep внутри Phase 2C.

## 2. What is done
- endless runner core works
- menu / HUD / pause / game over implemented
- v2 and v3 movement canon implemented
- chunk/pattern content system implemented
- difficulty waves implemented
- visual theme system implemented
- content packs implemented
- game profile bootstrap implemented
- audio pack hook implemented
- environment directives implemented
- primitive player art directives implemented
- GLTF player activation with safe fallback implemented
- runtime asset folder scaffold created in `/public`
- first conservative readability pass applied through `ContentPacks.ts`
- fallback player visual distinction pass applied through `ContentPacks.ts`
- manifest pack for first real assets exists in Sources

## 3. What is not done yet
- реальные runtime model/audio files в проекте ещё не подтверждены
- obstacle readability still needs manual verify
- final contrast pass not yet confirmed
- auto-pause on blur / visibility loss not confirmed
- YSDK / monetization not implemented
- final mobile QA not done
- final publish pack not done
- final UI/comic presentation not done

## 4. Current next recommended step
**Phase 2C — first real asset drop + visual verification**

Immediate subgoals:
1. положить первые реальные runtime files по каноническим путям:
   - `public/models/charon_boat.glb`
   - `public/models/runner.glb`
   - `public/audio/v2_ambience.mp3`
   - `public/audio/v3_ambience.mp3`
2. выгрузить свежий архив после asset drop
3. сделать archive-vs-manifest / archive-vs-contract review
4. вручную проверить obstacle readability и общий visual read
5. потом двигаться либо в mobile must-pass, либо в platform/monetization

## 5. Risk notes
- docs previously lagged behind code and archive state
- runtime scaffold now exists, so do not waste iterations recreating `/public`
- manifest pack already exists, so do not waste iterations recreating manifests from scratch
- current archive still needs manual runtime verification with real assets present

## 6. Working status summary
- Phase 0: done
- Phase 1: done
- Phase 2A: done
- Phase 2B: done
- Phase 2C: in progress
- Phase 3+: not started
