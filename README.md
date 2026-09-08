<p align="center">
  <a href="https://omegarusdev.github.io/PurePazaak/" style="display:inline-block;padding:16px 52px;font:bold 26px sans-serif;color:#fff;background:#1f9d2f;border-radius:12px;text-decoration:none;">▶ PLAY PURE PAZAAK</a>
</p>
<p align="center">
  <a href="https://omegarusdev.github.io/PurePazaak/">
    <img src="https://img.shields.io/badge/▶_PLAY_NOW-playable_in_browser-brightgreen?style=for-the-badge&logo=googlechrome&logoColor=white" alt="Play Now" height="40" />
  </a>
</p>
<p align="center"><strong>No install.</strong> Works in the browser (desktop &amp; mobile).</p>

# Pure Pazaak — Outer Rim Circuit

A tactical card duel inspired by the Pazaak minigame from *Knights of the Old Republic*.

- **Zero assets** — game art is fully self-contained in `index.html` (inline CSS/JS, canvas-rendered).
- **Installable PWA** — Add to Home Screen / install for a no-URL-bar app; updates on each open.
- **No runtime deps** — no libraries; play works offline after the first visit.
- **Works on desktop & mobile** — responsive layout; portrait and landscape aware.
- **Strategic AI** — three opponent tiers with distinct decks and play styles.

## Controls

| Key / Button | Action |
| --- | --- |
| `E` / `Space` / **END TURN** | End your turn (deals a card to the opponent) |
| `Enter` / `S` / **STAND** | Lock in your total and pass |
| `Esc` | Cancel hand-card selection |
| Click / tap | Select a hand card, click again to play |

## How to play

Each turn you automatically draw a Main-Deck card (values 1–10) onto your 3×3 board.
You may then play **at most one** side-deck card from your 4-card hand, then END TURN or STAND.

- **Over 20 = BUST** — but only at the end of your turn, so if a draw pushes you past 20
  you can still play a minus card to recover.
- **Exactly 20 auto-stands.** Fill all 9 slots without busting for an instant win.
- First to win **3 sets** takes the match. Tied sets replay.

Climb the Outer Rim circuit through six opponents across three tiers, unlocking stronger
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
manifest.webmanifest  install metadata (standalone display)
sw.js                 network-first shell; checks for updates on open only
icons/                PWA / home-screen icons
scripts/build.py      concatenates src/ -> index.html
scripts/serve.py      local server + src/ watch (http://127.0.0.1:8765/)
scripts/logic-test.js headless game-logic smoke test (node, no deps)
```

### Install / auto-update

On a supporting browser (Chrome/Edge/Android, or Add to Home Screen on iOS), open
the live game and install it. The installed app opens without a URL bar
(`display: standalone`). Each **cold open** asks the service worker for a fresh
build and reloads once if GitHub Pages has a newer `index.html` — not on
focus/visibility regain mid-session.

```bash
bash scripts/check.sh            # rebuild + syntax + logic tests + freshness
python3 scripts/serve.py --open  # play at http://127.0.0.1:8765/
```

Always commit the rebuilt `index.html` — GitHub Pages serves the repo root, and
CI fails if `index.html` is stale relative to `src/`.

## Links

- Live game: <https://omegarusdev.github.io/PurePazaak/>
