# Heat Map (Temperature Overlay) — Implementation Guide

## Summary
- The current heat map is implemented as a temperature overlay in the Cesium viewer.
- Data comes from a demo API that returns a small grid of temperature points around a center coordinate.
- Visualization is rendered as 3D colored pillars with labels, not as raster tiles.

## Files Involved
- `app/api/temperature/route.ts`
  - Provides `GET /api/temperature`.
  - Accepts `lat`, `lng`, and optional `spacing` query params.
  - Returns `{ points: [{ latitude, longitude, tempC }] }`.
- `components/CesiumMap.tsx`
  - Adds `Show Temps` / `Hide Temps` UI control.
  - Fetches temperature points when overlay is enabled.
  - Maps each temperature point to a pillar color and height.
  - Renders Cesium `Entity` cylinders and numeric labels.

## Data Flow
1. User enables overlay with the map button: `Show Temps`.
2. Client fetches:
   - `/api/temperature?lat={centerLat}&lng={centerLng}`
3. API returns a 3x3 grid (`rows = 3`, `cols = 3`) of demo temperatures.
4. Client stores points in component state.
5. Viewer renders one Cesium `Entity` per point.

## API Contract
### Endpoint
- `GET /api/temperature`

### Query Parameters
- `lat` (number, optional, default `37.7749`)
- `lng` (number, optional, default `-122.4194`)
- `spacing` (number, optional, default `0.02` degrees)

### Success Response
```json
{
  "points": [
    {
      "latitude": 37.7749,
      "longitude": -122.4194,
      "tempC": 19
    }
  ]
}
```

### Error Response
```json
{
  "error": "Failed to generate temperature points"
}
```

## Rendering Logic
- Temperature color mapping uses a simple threshold palette:
  - `<= 0`: blue
  - `<= 10`: green
  - `<= 20`: yellow
  - `<= 30`: orange
  - `> 30`: red
- Pillar height is normalized per returned dataset:
  - minimum height: `50m`
  - maximum height: `500m`
- Each pillar is rendered as a Cesium `cylinder`.
- Labels show `tempC` values (for example `22°C`) above each pillar.

## How to Try Locally
1. From `my-app`, start the app:
```bash
npm run dev
```
2. Open `http://localhost:3000/viewer`.
3. Click `Show Temps` in the map header.
4. Confirm that colored pillars and temperature labels appear.

## Quick API Test
```bash
curl "http://localhost:3000/api/temperature?lat=37.7749&lng=-122.4194&spacing=0.02"
```

## Notes and Caveats
- Current API data is demo/randomized, not from a real weather provider.
- Current overlay is entity-based (pillars), not a continuous raster heat map.
- Grid density is intentionally small (3x3) for demonstration.
- Pillar base altitude is fixed in the current implementation.

## Production-Oriented Next Steps
1. Replace demo generator with a real temperature data source.
2. Increase spatial density or introduce tiled data retrieval.
3. Add interpolation/smoothing for a continuous heat surface effect.
4. Add caching and rate limiting to the API layer.
5. Offer both modes:
   - entity pillars for exact sampled points
   - raster heat layer for continuous gradients
