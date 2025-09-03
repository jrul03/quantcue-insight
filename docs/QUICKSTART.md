# QuantCue Quick Start

Run locally

- Node.js 18+ recommended.
- Install deps: `npm i`
- Start dev server: `npm run dev`

Environment

- Set `VITE_POLYGON_KEY` in `.env` (Polygon API key).
- Optional flags via URL or env:
  - `?debug=1` → shows debug HUD and API dot.
  - `?lazy=1` → enable lazy loading (defaults on in production).
  - `?aihud=1` → force AI HUD overlay on.

Keyboard shortcuts

- `/`: Focus search (opens search in supported views)
- `f`: Toggle focus layout
- `o`: Toggle AI overlay
- `g`: Open AI Signals panel

Features overview

- Right sidebar tabs: AI Signals, Multi‑TF, Overview (Top Movers)
- Insights bar: Toggle overlays (EMA Cloud, VWAP, Volume Profile, Patterns)
- Mobile: Right sidebar collapses into a sheet via “Insights” button
- Live updates toast when symbol change crosses 1% buckets

