# Next Agent Handoff

## Current State

Pure Pazaak is playable. Main remaining product gap after this pass is real-browser coverage and a later name-generator content pass.

This pass added a semantic overlay for match controls, arrow-key / focus navigation, modal focus trapping, atomic interrupted-wager recovery, persist rollback on failed store/spoils writes, tighter layout tests, and Pages CI concurrency isolation.

The ninth-card behavior is intentional: when the ninth draw fills the board, the full-board result resolves immediately. There is no remaining board slot for a rescue play. The README documents this explicitly.

## Verification

Run:

```bash
bash scripts/check.sh
```

This rebuilds `index.html`, checks JavaScript and service-worker syntax, runs game-logic tests (including wager/recovery), exercises viewport layouts, and validates the seven-file Pages package.

## Follow-Up Work

### Accessibility

The match table stays canvas-rendered. A DOM overlay now exposes hand cards plus End / Stand / Flip / Forfeit, with `aria-live` status, modal focus restore, and arrow-key movement on menus, deck, store, circuit, and the table overlay. Circuit / deck / store cells are real buttons.

Not done: a full HTML mirror of both 3×3 boards, `prefers-reduced-motion`, and browser-based screen-reader / focus tests.

### Multi-Tab Ownership

Save revisions, `storage`, and `BroadcastChannel` conflict detection are implemented. Strict atomic ownership is not. If required later, add a single active-tab lease using `navigator.locks` with a timeout fallback, and make mutations go through one async save transaction API.

### Interrupted Matches

An interrupted active wager is recovered on the next cold start instead of being silently lost. Recovery only commits after a successful persist, so a failed write cannot double-refund. Exact mid-match resume is not implemented and should stay skipped unless it remains a small, reliable change.

### Browser Integration Tests

Add browser-level tests for:

- Portrait, landscape, square, ultra-wide, tiny, and notched viewports.
- Rotation and dynamic viewport changes.
- DPR 1/2/3 rendering and pointer hit testing.
- PWA install, offline shell/font/icon loading, and update activation.
- Active-match update/reload behavior.
- Keyboard traversal, modal focus, and the match overlay.
- Screenshot/pixel regression checks for the card and table renderers.

### Name Generator

The current generator is deterministic in shape but still needs a later content pass for stronger uniqueness, better KOTOR naming coverage, and clearer tier flavor. Preserve the existing roster migration and uniqueness guarantees when expanding it.

### Reference Assets

`refs/` and `K2boardRef.webp` are internal-only reference material and are gitignored. They must never be included in the Pages artifact or distributed with the game.

## Deployment Notes

GitHub Pages now packages only `index.html`, `manifest.webmanifest`, `sw.js`, the Orbitron font, and the three install icons. Source, scripts, workflow files, and references are excluded. The service worker receives the GitHub commit SHA as its cache version during packaging. PR verify jobs no longer share a cancel group with production deploys.
