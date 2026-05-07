# God Games Skills

Recipe library for building, polishing, and operating mini-games in this repo.
Each skill is a SKILL.md that Claude pulls in *only when its trigger fires* —
so the project's domain knowledge stays cheap and discoverable.

## Layered architecture

The library splits into four layers. A new game = pick one from each of the
first two, plus any number from the third.

```
.claude/skills/
├── bootstrap/   Renderer scaffolds. Pick exactly one per game.
│   ├── 2d-canvas/      Plain <canvas> 2d ctx. Current default.       (engine.js)
│   ├── 2d-webgl/       PixiJS / regl. For >5k sprites or particles.  (engine-2d-gl.js)
│   ├── 2-5d-iso/       Top-down with depth sort. Hades-style.        (engine-iso.js)
│   ├── 3d/             Three.js. Boss arenas, racing, FPS.           (engine-3d.js)
│   ├── pixel/          Palette + grid lock on top of 2d-canvas.      (engine.js + pixel.js)
│   └── shader/         Fullscreen GLSL quad. Rhythm / abstract.      (engine-shader.js)
│
├── genre/       Game-shape recipes. Pick one to drop into a bootstrap.
│   ├── twitch-action/      Icarus / Achilles / Orion-like.
│   ├── bullet-hell/        Danmaku patterns + grazing.
│   ├── boss-rush/          Multi-phase telegraph→windup→payoff.
│   ├── roguelike-run/      Procgen rooms, doors, run meta.
│   ├── rhythm/             Beat-synced spawns, timing windows.
│   ├── platformer/         Tilemap, jump tuning, hazards.
│   ├── wave-survival/      Escalating wave manifest.
│   ├── auto-runner/        Endless lane scroller.
│   ├── puzzle/             Turn-based or constraint-solving.
│   ├── racing/             Lap-based with checkpoints.
│   └── first-person/       POV bow / sword / exploration.
│
├── compose/     Drop-in additions. Use any number, any time.
│   ├── add-power-up/        Pickup → timed effect on player.
│   ├── add-enemy-archetype/ Sprite + AI + drop table.
│   ├── add-boss-phase/      Add a phase to an existing boss.
│   ├── add-progression-meta/ XP/unlocks across runs.
│   ├── tune-character-feel/ Iterate polish profile (flash/punch/slomo/sfx).
│   └── port-2d-to-3d/       Take an existing 2D game, scaffold a 3D sibling.
│
├── manga/       Visual library skills (live in /manga subtree).
│   ├── add-manga-character/ New character with draw + polish profile.
│   ├── add-manga-effect/    Stateless render helper.
│   ├── add-polish-fx/       Stateful per-frame fx (factory pattern).
│   └── add-3d-polish/       Three.js equivalent of manga/fx polish.
│
└── ops/         Operational chores.
    ├── deploy-prod/         Commit → push → vercel --prod, with safety checks.
    └── debug-leaderboard/   Inspect Redis, clean test entries.
```

## How a skill fires

Each `SKILL.md` has a YAML frontmatter `description` field that tells Claude
when to invoke it. Examples:

- "User wants to add a new character to the manga visual library"
- "User wants to scaffold a brand-new 3D mini-game"
- "User says 'this hit doesn't feel hard enough' or similar feel-tuning prompt"

Claude reads the user's intent, picks the matching skill, and follows its
recipe. The user does not need to type `/<skill-name>` — though they may.

## Skill anatomy

```markdown
---
name: <slug>
description: <one line that surfaces this skill at the right moment>
---

## When to use
<bulleted intent triggers>

## Required reading
<paths to relevant CLAUDE.md routers — never duplicate their content>

## Inputs
<what the skill needs from the user (or sensible defaults)>

## Recipe
<numbered steps with file paths and concrete edits>

## Verification
<smoke test the user can run — what to type, what to see>

## Updates
<table: Date | Change | Author>
```

## Future direction (note for skill authors)

These skills are a **dry-run** for a future kid-facing game-builder app
(separate repo). Keep each skill self-contained, parameterizable, and
renderer-agnostic where the genre allows. The skill's `description` and
`Inputs` are what would later become a card + form in the builder UI — they
should read cleanly without context from sibling skills.

## Updates

| Date       | Change                                                          | Author |
|------------|-----------------------------------------------------------------|--------|
| 2026-05-07 | Initial skill tree scaffold: bootstrap, genre, compose, manga, ops layers. | jim |
