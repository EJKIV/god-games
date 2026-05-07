---
name: genre-rhythm
description: Drop a rhythm-game system — beat-synced spawns, timing windows, score grading (Perfect/Great/Miss). Best paired with bootstrap-shader for music-driven visuals.
---

## When to use

- User says "rhythm", "beat", "Apollo's lyre", "Orpheus", "music game"
- Gameplay is timing inputs to a beat
- Best paired with `bootstrap-shader` so visuals breathe with the music

## Required reading

- `/CLAUDE.md`

## Inputs

| Input             | Default                             | Notes                                            |
|-------------------|-------------------------------------|--------------------------------------------------|
| track             | (ask) — must be authored or licensed| BPM + beat map                                   |
| timing windows    | `±35ms perfect, ±80ms great, ±150ms ok` | tune for difficulty                          |
| input lanes       | `4`                                 | 2–6 typical                                      |
| beat source       | `precomputed map`                   | `analysis from audio` is much harder; defer      |

## Recipe

1. **Beat map format**: a JSON file listing `{time: ms, lane: 0..N-1, type: 'tap'|'hold', heldUntil?: ms}`. Author by hand or with a beat-mapper tool.
2. **Audio playback**: use `Engine.audio._ctx` (init it explicitly). Play the track via a `BufferSource`. Crucially, **measure latency**: schedule first beat, store `audioStartTime = ctx.currentTime`, then `nowInTrack = ctx.currentTime - audioStartTime`.
3. **Note spawning**: each frame, spawn any note whose `time` is within `lookaheadMs` of `nowInTrack`. Notes travel down their lane and arrive at the judgment line exactly at `time`.
4. **Input judgment**: on input, find the closest unjudged note in the input's lane within `±150ms`. Grade by distance: ≤35 perfect, ≤80 great, ≤150 ok, else miss. Score per grade; combo breaks on miss.
5. **Visual feedback**: on each judgment, flash the lane (color by grade), spawn particles, optionally bump a shader uniform `u_beat_pulse`.
6. **End of track**: when last note is past, transition to victory; submit final score.

## Verification

- Run a known beatmap with a click track and confirm timing feels tight (no audible delay between input and SFX).
- Audio + visuals stay in sync over the full track (no drift past 30s).
- Pause/resume preserves position correctly.

## Pairs well with

- `bootstrap/shader` (recommended) — shader breathes with audio
- `bootstrap/2d-canvas` if shader is overkill
- `compose/tune-character-feel` for hit-flash polish on judgments

## Notes

- Audio scheduling latency is the #1 trap. Use Web Audio's `AudioBufferSourceNode.start(when)` and track `audioCtx.currentTime`, NOT `performance.now()` or `Date.now()`.
- Authoring a beatmap by hand is doable for a 90-second mini-game. Don't try beat-detection from raw audio for a first pass.

## Updates

| Date       | Change          | Author |
|------------|-----------------|--------|
| 2026-05-07 | Initial recipe. | jim    |
