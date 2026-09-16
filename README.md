<p align="center">
  <a href="https://omegarusdev.github.io/PurePazaak/" style="display:inline-block;padding:16px 52px;font:bold 26px sans-serif;color:#fff;background:#1f9d2f;border-radius:12px;text-decoration:none;">▶ PLAY PURE PAZAAK</a>
</p>
<p align="center">
  <a href="https://omegarusdev.github.io/PurePazaak/">
    <img src="https://img.shields.io/badge/▶_PLAY_NOW-playable_in_browser-brightgreen?style=for-the-badge&logo=googlechrome&logoColor=white" alt="Play Now" height="40" />
  </a>
</p>
<p align="center"><strong>Play in the browser</strong> — or install as a fullscreen app from the live game page.</p>

# Pure Pazaak — Outer Rim Circuit

A tactical card duel inspired by the Pazaak minigame from *Knights of the Old Republic*.

- **Zero assets** — game art is fully self-contained in `index.html` (inline CSS/JS, canvas-rendered).
- **Fullscreen WebAPK** — Install from the live page (Android Chrome) or Add to Home Screen (iOS); updates on each open.
- **No runtime deps** — no libraries; play works offline after the first visit.
- **Works on desktop & mobile** — responsive layout; portrait and landscape aware.
- **Strategic AI** — three opponent tiers with distinct decks and play styles.

## Controls

| Key / Button | Action |
| --- | --- |
| `E` / `Space` / **END TURN** | End your turn (deals a card to the opponent). Space activates the focused control if one is selected. |
| `Enter` / `S` / **STAND** | Lock in your total and pass |
| `F` | Flip the armed dual / tie / 1±2 card |
| `Esc` | Cancel hand-card selection, or close a dialog |
| Arrow keys / `Tab` | Move between menus, cards, and table actions |
| Click / tap | Select a hand card, click again to play |

## How to play

Each turn you automatically draw a Main-Deck card (values 1–10) onto your 3×3 board.
You may then play **at most one** side-deck card from your 4-card hand, then END TURN or STAND.

- **Over 20 = BUST** — but only at the end of your turn, so if a draw pushes you past 20
  you can still play a minus card to recover. A ninth draw fills the board and resolves
  immediately, so there is no remaining slot for a rescue play.
- **Exactly 20 auto-stands.** Fill all 9 slots without busting for an instant win.
- First to win **3 sets** takes the match. Tied sets replay.
- Completed opponents can be replayed for any wager from 0 up to that tier's standard
  stake. A zero-credit replay is practice and awards no credits or card spoil.
- The cantina buys owned cards for half their listed price. You must keep at least
  10 cards so a playable side deck always remains.

Climb the Outer Rim circuit through nine opponents across three tiers, unlocking stronger
side-deck cards as you win.

## Ideas

After the player plays a side-deck card from hand, a dialogue could ask whether they
want to **stand** or **keep playing** (end the turn and draw next round). Right now that
choice stays on the table buttons.

## Run locally

Use a **Cursor/VS Code task or a terminal you leave open**. Agent background shells get killed with the chat, which is why `http://127.0.0.1:8765/` sometimes says connection refused.

```bash
python3 scripts/serve.py --open
```

That rebuilds from `src/`, serves at <http://127.0.0.1:8765/>, and rebuilds again when you edit `src/`. Leave the browser tab open and refresh after a rebuild. Cursor will also offer to start **Serve Pure Pazaak** when you open this folder (Tasks: Run Task).

## Development

The shipped game is still a single self-contained `index.html` (inline CSS/JS,
procedural art, no game image assets) — but it is **built** from `src/`.
Install chrome sits beside it (`manifest.webmanifest`, `sw.js`, `icons/`).

```
src/template_parts/  page shell (head/body markup)
src/styles/           tokens, base, components, circuit, deck, match, responsive
src/js/               util, audio, cards, ai, data, layout, textures, geom,
                      draw, chrome, game, render, ui, pwa, main (concatenated
                      in order, one shared classic-script scope — no modules)
manifest.webmanifest  install metadata (fullscreen WebAPK / standalone fallback)
sw.js                 network-first shell; checks for updates on open only
icons/                PWA / home-screen icons
scripts/build.py      concatenates src/ -> index.html
scripts/package-pages.py creates the allowlisted Pages artifact
scripts/serve.py      local server + src/ watch (http://127.0.0.1:8765/)
scripts/logic-test.js headless game-logic smoke test (node, no deps)
```

### Install / auto-update (WebAPK)

Install as a fullscreen app (no URL bar) from the live game page — not from this
README. On Android Chrome that install is a WebAPK.

1. Open [omegarusdev.github.io/PurePazaak](https://omegarusdev.github.io/PurePazaak/) (the PLAY button).
2. Install from that page:
   - **Android Chrome:** title menu **INSTALL APP**, address-bar install icon, or menu → Install app / Add to Home screen
   - **iPhone/iPad (Safari):** Share → Add to Home Screen
3. Later launches use the home-screen icon. That installed app is fullscreen;
   the browser tab never requests fullscreen on click. Pushes to `main` deploy a
   new Pages build; each **cold open** pulls it. Updates discovered during an
   active match wait until the match is left.

Portrait and landscape both work. The manifest uses `display: fullscreen` with
`standalone` as fallback — that display mode applies only after install.

GitHub Pages publishes only `index.html`, `manifest.webmanifest`, `sw.js`, the
bundled fonts (Orbitron, Star Jedi, Science Gothic), and the three install icons.
Development sources, scripts, and reference material stay out of the deployment
artifact.

```bash
bash scripts/check.sh            # rebuild + syntax + logic tests + freshness
python3 scripts/serve.py --open  # play at http://127.0.0.1:8765/
```

Always commit the rebuilt `index.html` — GitHub Pages serves the repo root, and
CI fails if `index.html` is stale relative to `src/`.

## Links

- Live game: <https://omegarusdev.github.io/PurePazaak/>
