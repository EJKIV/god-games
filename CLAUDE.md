# God Games

A series of Greek mythology mini-games built by a Theo.

## Architecture
- Each mini-game is a standalone HTML file (icarus.html, achilles.html, etc.)
- A hub world (index.html) will link to all games once multiple exist
- Each game file is fully self-contained: HTML + CSS + JS in one file

## Design Rules
- Use HTML canvas for all gameplay
- Epic visual style: dark backgrounds, glowing effects, particle systems
- Color palette: deep navy/black backgrounds, gold (#D4AF37) for UI and accents, mythological colors per game (sun orange for Icarus, blood red for Achilles, forest green for Artemis, etc.)
- Every action needs visual feedback: hits flash, deaths explode, pickups glow and pulse, score floats up from the action
- Use Web Audio API for synthesized retro sound effects (no audio files)
- Screen shake on big impacts
- Smooth acceleration/deceleration on player movement
- Always include: title screen, HUD (score/health/XP), game over screen with final score and play again button
- Show XP prominently — it's the core reward across all games
- Use emoji or canvas-drawn sprites for characters (no external images)
- When adding new features, NEVER break existing features
- Make controls responsive and satisfying
- Target 60fps smooth gameplay

## Git Workflow
- After completing each major feature, commit with a descriptive message
- Push to GitHub after each session
- Use present tense commit messages: "add wing burning effect"
