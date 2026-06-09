# Location Info Overlay — Implementation Guide

## Summary
- As the user pans the 3D globe, the bottom-left overlay automatically identifies whatever location they're looking at.
- Displays: **Country: City** name, elevation, coordinates, a fun fact, and a "More Details" toggle for the full address.

## Files Involved
- `components/CesiumMap.tsx` — overlay UI, reverse-geocode fetch, elevation fetch, fact fetch
- `app/api/facts/route.ts` — facts API endpoint with hardcoded DB + OpenAI pipeline
- `lib/facts.ts` — hardcoded facts database (40+ famous places), caching, randomizer

## Data Flow

```
Camera moves → 500ms debounce → setCenterLocation({lat, lng})
                                       │
                          ┌────────────┼────────────┐
                          ▼            ▼            ▼
                   Nominatim      open-elevation   /api/facts
                   reverse geo    API             (hardcoded DB
                   (place name)   (elevation)      or OpenAI)
                          │            │            │
                          └────────────┼────────────┘
                                       ▼
                              setCenterPlaceName
                              setCenterElevation
                              setCenterFact
                              setCenterFullAddress
                                       │
                                       ▼
                              Bottom-left overlay updates
```

## Overlay Display

### Compact Mode (default)
```
Japan: Tokyo
23m · 35.67347, 139.76689
Tokyo was originally a small fishing village called Edo…
[More Details]
```

### Expanded Mode (after clicking "More Details")
```
Chuo, Tokyo, Japan  (full Nominatim address)
23m · 35.67347, 139.76689
[Less Details]
```

## Name Resolution Priority

1. **Facts API** — if the hardcoded database matches a famous place, returns `country: name` (e.g. "Japan: Tokyo"). This takes highest priority.
2. **Nominatim structured address** — extracts `addr.city/town/village` + `addr.country`, normalized via `COUNTRY_ALIASES` map (e.g. "United States" → "America").
3. **Nominatim display_name fallback** — parses the last part as country and second-to-last as city.

## Country Name Normalization

Defined in `CesiumMap.tsx`:
```typescript
const COUNTRY_ALIASES: Record<string, string> = {
  "United States": "America",
  "United States of America": "America",
  "USA": "America",
  "UK": "United Kingdom",
  // others pass through as-is
};
```

## Elevation

- Fetched from `https://api.open-elevation.com/api/v1/lookup` with the center lat/lng.
- Displayed as `{elevation}m` next to the coordinates.
- Fetched in parallel with Nominatim and facts via `Promise.all`.

## "More Details" Button

- Appears only when `centerFullAddress` is available (from Nominatim's `display_name`).
- Toggles `showDetails` state to show the raw full address string.
- Resets automatically when the user pans to a new location.

## Facts Pipeline

See `docs/facts-pipeline.md` for detailed documentation.
