**Temperature Overlay — Changes & Usage**

Summary
- Added a demo temperature API and a client-side 3D visualization overlay in the Cesium map.
- Visualization supports toggleable numeric labels and 3D pillars whose height maps to temperature.

Files changed / added
- `app/api/temperature/route.ts` — new demo endpoint that returns a small grid of temperature points (JSON).
- `components/CesiumMap.tsx` — added:
  - toggle button in the map header (`Show Temps` / `Hide Temps`)
  - client-side fetch to `/api/temperature`
  - rendering of temperature as tall 3D `cylinder` Entities with labels
  - helper mapping `tempToColor()` for a blue→yellow→red palette
- `prisma/schema.prisma` and `.env` — switched to SQLite for local dev and added `DATABASE_URL="file:./dev.db"` so auth routes work without Postgres (local-only change).

How it works (high-level)
- The map component toggles a fetch to `/api/temperature?lat={lat}&lng={lng}`. The API returns an array of points: `{ latitude, longitude, tempC }`.
- Each point is rendered as a Cesium `Entity` with a `cylinder` primitive. Cylinder `length` (height) is computed from temperature (normalized across returned points). Labels are placed above pillars.

How to try locally
1. Start dev server (from `my-app`):
```bash
npm run dev
```
2. Open `http://localhost:3000` and navigate to the viewer page.
3. In the top-right of the `CesiumMap` panel click the `Show Temps` button.
4. Fly/zoom into the downtown area — you should see vertical colored pillars and numeric labels.

Quick API test
```bash
curl "http://localhost:3000/api/temperature?lat=37.7749&lng=-122.4194"
```

Notes & caveats
- The API is a demo generator (randomized grid). Replace it with a real provider (OpenWeatherMap, NOAA, etc.) for production.
- Pillars are currently placed at a fixed altitude; they do not sample terrain height. For exact ground alignment we can sample terrain (viewer.scene.sampleHeight) per point and adjust cylinder center.
- The SQLite switch in `prisma/schema.prisma` is only intended for local dev convenience. If you need Postgres in CI/production, revert the datasource to PostgreSQL and set `DATABASE_URL` appropriately.

Next steps (optional enhancements)
- Sample terrain heights for each point so pillars sit exactly on the ground.
- Support raster heatmap tiles (ImageryLayer) as an alternative to point pillars.
- Add clustering or filtering for dense datasets.
- Replace demo API with a real weather data source and implement server-side caching.

If you want, I can implement terrain sampling so pillars rest on the ground and adjust height by surface elevation. Which enhancement should I do next?
