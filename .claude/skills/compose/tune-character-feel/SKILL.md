---
name: tune-character-feel
description: Iterate on a character's polish profile — the felt impact of hits, deaths, atmosphere. Use when the user says "this hit doesn't feel hard enough" or similar feel-tuning prompts.
---

## When to use

- User says "this doesn't feel hard enough", "deaths aren't satisfying", "make the hit feel weightier"
- The character is already drawn and playable; this skill changes *feel*, not gameplay
- Subject is a `Manga.characters.<name>` profile (or an inline equivalent)

## Required reading

- `/manga/CLAUDE.md` — defines the polish profile shape and which fields drive which sensation

## Inputs

| Input            | Default                | Notes                                        |
|------------------|------------------------|----------------------------------------------|
| character        | (ask)                  | the file under `manga/characters/<name>.js`  |
| sensation        | (ask)                  | "hit feels light", "death is muted", etc.    |

## Polish profile cheat sheet

```js
polish: {
  onHit: {
    flashColor:     '#ff8060',  // higher saturation + lighter = brighter impact
    punchIntensity: 8,           // px of camera punch — bigger = bigger hit feel
    punchDuration:  0.12,        // seconds; shorter = snappier, longer = lingering
    sfxText:        'BAM!',      // big comic-text overlay; null to disable
    slomoFactor:    0.4,         // 0..1; lower = slower slo-mo on hit
    slomoDuration:  0.10,        // seconds of slo-mo
  },
  onDeath: {
    slomoFactor:    0.15,        // slower than onHit — death is a moment
    slomoDuration:  0.6,
    panelSplit:     true,        // dramatic panel-slide overlay
    sfxText:        'FALLEN!',
    audioLayers: [               // stacked tones — chunkier means heavier
      { freq: 80,  type:'sawtooth', dur:0.4, vol:0.5 },
      { freq: 110, type:'square',   dur:0.2, vol:0.4, delay:0.05 },
    ],
  },
  atmosphere: {
    vignetteStrength: 0.3,       // dark edges; higher = more cinematic
    scanlineAlpha:    0.05,      // CRT feel; 0..0.15
    halftoneAlpha:    0.6,       // manga screen-tone density
  },
}
```

## Recipe

1. **Diagnose the sensation**:
   - "Light hit" → `flashColor` too dim or `punchIntensity` too low. Bump intensity to 12–14, brighten flash.
   - "Hit reads but doesn't impact" → add or extend `slomoFactor`/`slomoDuration` (try 0.4 / 0.10).
   - "Death is muted" → `slomoFactor` 0.15, longer `slomoDuration`, ensure `panelSplit:true` and chunky `audioLayers`.
   - "Too noisy / jarring" → reduce `punchIntensity` and `slomoDuration`. Cinematic ≠ chaotic.
   - "Atmosphere flat" → bump `vignetteStrength` 0.3 → 0.45, `scanlineAlpha` to 0.06–0.08.
2. **Edit the file**: open `manga/characters/<name>.js`, find the `polish` block, tweak ONE field at a time.
3. **Smoke-test**: run the game, trigger a hit and a death. Watch the change in isolation.
4. **Iterate**: if it feels off, take it further before reverting — most "feel" issues are too-subtle changes, not too-big ones.
5. **Don't move on** until the user confirms the new feel matches what they wanted.

## Verification

- A first-time player can describe the change without prompting ("the hit feels heavier now").
- No regression in framerate (slo-mo + heavy particles can cost ms).
- Doesn't accidentally affect *other* characters using the same effect — the profile is per-character.

## Pairs well with

- `manga/add-manga-character` (after creating a character, tune its profile)
- `genre/boss-rush` (boss attack feel)

## Updates

| Date       | Change          | Author |
|------------|-----------------|--------|
| 2026-05-07 | Initial recipe. | jim    |
