# TerraScope — Geospatial 3D Viewer

Interactive 3D globe for exploring cities, landmarks, and terrain. Built with Cesium, Resium, and Next.js.

## Quick Start

```bash
npm install
cp .env.example .env   # add your API keys
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment Variables

| Variable | Required | Purpose |
|---|---|---|
| `NEXT_PUBLIC_CESIUM_ION_TOKEN` | Yes | Cesium terrain & 3D tiles |
| `DATABASE_URL` | For auth | PostgreSQL connection |
| `OPENAI_API_KEY` | Optional | AI-generated location facts |
| `OPENWEATHERMAP_API_KEY` | Optional | Live temperature heatmap data |

## Pages

| Route | Description |
|---|---|
| `/` | Landing page with Three.js wireframe globe |
| `/viewer` | 3D Cesium globe with search, facts, heatmap |
| `/dashboard` | Saved locations, notes, stats |
| `/login` | Authentication |

## Documentation

- [`docs/cesium-render.md`](docs/cesium-render.md) — Cesium viewer architecture
- [`docs/location-info-overlay.md`](docs/location-info-overlay.md) — Auto place detection, elevation, more details
- [`docs/facts-pipeline.md`](docs/facts-pipeline.md) — Location facts (hardcoded + AI, fact-checked)
- [`docs/heatmap-implementation.md`](docs/heatmap-implementation.md) — Temperature heatmap overlay
- [`docs/heat-map.md`](docs/heat-map.md) — Original heat map docs
- [`docs/temperature-overlay.md`](docs/temperature-overlay.md) — Legacy temperature overlay docs
