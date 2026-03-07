# Agent Handoff v0.4

## Read this first
If you are a new AI/agent entering the Charon project, do not guess.

Read in this order:
1. `PROJECT_RULES.md`
2. `06_Current_Project_State.md`
3. `04_Checklists_v0_4.md`
4. `02_Project_Structure_And_Asset_Contract_v0_4.md`
5. `03_Roadmap_v0_4.md`

Then inspect the **latest project archive**.

---

## Project in one paragraph
CharonV2 is a reusable Three.js endless runner skeleton with two variants (`v2` and `v3`) on one codebase. Core gameplay is frozen. The current code already has content packs, environment theming, audio hooks, primitive player visual directives, and GLTF player activation with safe fallback. The current next step is not core gameplay invention, but visual polish, asset drop prep, mobile must-pass, then platform/monetization.

---

## Absolute rules
- Do not redesign gameplay without explicit request.
- Do not skip diff-review.
- Do not assume old docs are accurate if a newer docs pack is present.
- Do not treat chat alone as source of truth.
- Use English for coding prompts, Russian for discussion.

---

## What the code already supports
- `ContentPacks.ts`: pack-defined art/audio contract
- `GameProfile.ts`: runtime bootstrap
- `VisualTheme.ts` / `VisualThemeSystem.ts`: environment visuals
- `TrackSystem.ts`: track presentation
- `VisualPlayer.ts`: GLTF loading + fallback
- `AudioManager.ts`: audio pack loading + ambience lifecycle

---

## Where assets are expected
Runtime:
- `public/models/...`
- `public/audio/...`
- `public/textures/...`
- `public/ui/...`

Source:
- `design_source/...`
- `marketing/...`

If runtime folders do not exist yet, create them as part of asset-drop tasks.

---

## What to ask for before changing code
If the archive is not fresh:
- ask for resync / new archive

If the task concerns assets:
- ask for manifest or define one first

If multiple systems are touched:
- split into smaller patches unless explicitly requested otherwise

---

## Preferred patch format
Each patch should include:
- Intent / rationale
- How to test
- One single prompt block for coding agent
- Return-required diff request inside the same prompt block

---

## Status checkpoint at time of this handoff
- Phase 2B completed
- project archive includes asset-layer code
- next meaningful step = Phase 2C or mobile must-pass
