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

- **Zero assets** — fully self-contained `index.html` (inline CSS/JS, canvas-rendered).
- **No runtime deps** — no build step, no libraries, no network calls.
- **Works on desktop & mobile** — responsive layout; portrait and landscape aware.
- **Strategic AI** — three opponent tiers with distinct decks and play styles.

## Controls

| Key / Button | Action |
| --- | --- |
| `E` / `Space` / **END TURN** | End your turn (deals a card to the opponent) |
| `S` / **STAND** | Lock in your total and pass |
| `F` / **FLIP** | Flip a selected dual card between + and − |
| `Enter` | Play / confirm the selected hand card |
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

## Run locally

No build needed — it's a single HTML file:

```bash
python3 -m http.server 8000
```

Then open <http://localhost:8000> (or just double-click `index.html`).

## Development

Pure Pazaak is a single self-contained `index.html` (HTML + CSS + ES-module script).
There is no bundler or dependency tree — edit the file and reload.

## Links

- Live game: <https://omegarusdev.github.io/PurePazaak/>
