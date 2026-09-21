# Business World

Business World is an autonomous 3D business-city simulation. Workers move through a living island city and perform business roles such as marketing, accounting and brainstorming while the city's revenue, profit and expansion systems grow.

## Run it

This prototype uses Three.js from a CDN, so it must be served over HTTP instead of opened as a local file.

From the repository folder:

```bash
python3 -m http.server 8000
```

Then open `http://localhost:8000`.

## Current prototype

- Interactive 3D island city
- Autonomous workers: Reynaldo, Moshe and Victor
- Traffic and connected roads
- Business buildings and a central growth monument
- Revenue/profit simulation
- Day/night and rain controls
- Locked airport island that unlocks at $10,000 revenue
- Animated bridge reveal
- Mobile-friendly orbit/pan/zoom controls

See [docs/roadmap.md](docs/roadmap.md) for the build plan.

## Project structure

```
Business-world/
├── index.html
├── src/
│   ├── game.js
│   └── styles.css
└── docs/
    └── roadmap.md
```
