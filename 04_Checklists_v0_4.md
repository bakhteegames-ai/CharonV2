# Checklists — Charon Canon v0.4a

## A. Gameplay Canon
- [x] v2 jump disabled
- [x] v2 down action = crouch
- [x] v3 jump enabled
- [x] v3 down action = slide
- [x] no cooldown on down action
- [x] no dash
- [x] no dive
- [x] jump-only content gated out of v2
- [x] overhead solved only via crouch/slide

## B. Core Runner State
- [x] menu
- [x] playing
- [x] pause
- [x] game over
- [x] restart loop exists
- [ ] long-run restart regression verified manually

## C. Content / Map
- [x] v2 content pack present
- [x] v3 content pack present
- [x] jump-only patterns present
- [x] difficulty waves present
- [x] risk vs safe coin routes present
- [x] breather logic present

## D. Phase 2A / 2B Visual Architecture
- [x] variant visual wiring exists
- [x] biome-aware visual theme exists
- [x] content packs exist
- [x] game profile bootstrap exists
- [x] audio pack integration exists
- [x] environment directives exist
- [x] primitive player art directives exist
- [x] GLTF player activation exists
- [x] GLTF fallback to primitive exists

## E. Current Runtime Asset Contract
- [x] player model target paths defined
- [x] audio target paths defined
- [x] environment art contract defined
- [x] runtime asset layer decoupled from gameplay
- [x] runtime folder scaffold present in `/public`
- [ ] actual runtime asset files present in `/public`
- [ ] first real model files dropped
- [ ] first real ambience files dropped

## F. Mobile Must-Pass
- [x] no selection / no context menu
- [x] no overscroll / no system scroll
- [x] resize/orientation handling exists
- [x] safe-area UI exists
- [ ] auto-pause on visibility loss / blur / pagehide
- [ ] mobile matrix manually tested
- [ ] nothing clips on all target aspect ratios

## G. Tech Stability
- [x] object pooling / cleanup exists
- [x] missing audio files do not crash the game
- [x] missing GLTF files do not crash the game
- [ ] 3–5 minute manual stability run passed
- [ ] no uncaught runtime errors verified
- [ ] build / lint clean verified after latest archive

## H. Readability / Art
- [x] v2 and v3 visually differ at system level
- [x] first conservative contrast/readability pass applied
- [x] fallback player visual distinction pass applied
- [ ] obstacle readability manually verified
- [ ] final contrast pass complete
- [ ] BTG comic/manhwa presentation integrated in UI layer
- [ ] first real model look approved
- [ ] first ambience look approved

## I. Platform / Monetization
- [ ] YSDK adapter
- [ ] interstitial policy
- [ ] rewarded opt-in (пользователь добровольно смотрит наградную рекламу ради бонуса)
- [ ] external mute integration
- [ ] ad pause / resume integrity
- [ ] localization via SDK hooks

## J. Publish Pack
- [ ] icon
- [ ] screenshots
- [ ] cover / capsule
- [ ] metadata
- [ ] title consistency
- [ ] moderation preflight

## K. Docs / Agent Readability
- [x] docs pack updated to current code state
- [x] asset contract documented
- [x] agent handoff documented
- [x] manifests for first real assets created
- [ ] docs re-exported after next major phase
