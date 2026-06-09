# Facts Pipeline — Implementation Guide

## Summary
- Every location the user looks at loads a fun, verified fact in the bottom-left overlay.
- Famous places (40+) use **hardcoded curated facts** with a randomizer.
- Unknown/obscure places use **OpenAI** with a double fact-checking step.
- Aggressive caching avoids redundant API calls.

## Files
- `lib/facts.ts` — hardcoded database, haversine matching, cache, randomizer
- `app/api/facts/route.ts` — API endpoint with OpenAI integration

## API Endpoint

```
GET /api/facts?lat=35.6762&lng=139.6503
```

### Response
```json
{
  "name": "Tokyo",
  "country": "Japan",
  "fact": "Tokyo was originally a small fishing village called Edo before becoming the de facto capital in 1603."
}
```

For unknown locations (no hardcoded match, OpenAI generated):
```json
{
  "name": null,
  "country": null,
  "fact": "This area is part of the Great Plains, one of the largest grassland ecosystems in the world."
}
```

### Pipeline

```
Request: lat=35.6762, lng=139.6503
         │
         ▼
  ① In-memory cache check (24h TTL, 30km radius)
         │
         ├── Hit → pick random fact from cache → return
         │
         └── Miss
              │
              ▼
  ② Hardcoded famous places check (haversine distance)
         │
         ├── Match → pick random fact from DB → return
         │
         └── No match
              │
              ▼
  ③ OpenAI generate (gpt-4o-mini, 100 max_tokens)
         │
         ▼
  ④ Fact-check: send same fact back with "YES/NO" prompt
         │
         ├── YES → cache result → return
         │
         └── NO  → discard → return { fact: null }
```

## Hardcoded Database

40+ famous places across all continents, each with 4-5 curated facts:

| Place | Country | Facts |
|-------|---------|-------|
| Tokyo | Japan | 5 facts |
| New York City | America | 5 facts |
| Paris | France | 5 facts |
| London | United Kingdom | 5 facts |
| Great Wall of China | China | 5 facts |
| Mount Everest | Nepal | 5 facts |
| Amazon Rainforest | South America | 5 facts |
| ... | ... | ... |

Each entry has:
```typescript
{
  name: "Tokyo",
  country: "Japan",
  lat: 35.6762,
  lng: 139.6503,
  radiusKm: 60,  // how close camera must be to trigger
  facts: ["fact 1", "fact 2", ...]
}
```

## Randomizer

`getRandomFact(facts: string[]): string` — picks a random index from the facts array using `Math.random()`. Each pan back to the same location may show a different fact.

## Caching

In-memory `Map<string, { facts: string[], timestamp: number }>`:
- Keyed by rounded lat/lng: `"35.676,139.650"`
- TTL: 24 hours
- Radius match: within 30km of cached coordinates
- Used for OpenAI-generated facts to avoid regenerating on every visit

## Hardcoded vs AI

| Aspect | Hardcoded | OpenAI |
|--------|-----------|--------|
| Fact quality | Manually curated, guaranteed accurate | Generated, then verified |
| Latency | Instant (no network) | ~1-2s per call |
| Token cost | Zero | ~150 tokens per fact |
| Coverage | 40+ famous places | Any location on Earth |
| Fact-checking | Not needed | YES/NO verification prompt |

## Token Optimization

- Uses `gpt-4o-mini` (cheapest model)
- Generation: `max_tokens: 100`, concise single-sentence prompt
- Verification: `max_tokens: 10`, `temperature: 0`, forces YES/NO
- No preamble requested — model outputs the fact directly
- Cached facts never regenerate

## Adding New Facts

To add a new hardcoded place, add an entry to the `FAMOUS_PLACES` array in `lib/facts.ts`:

```typescript
{
  name: "Barcelona",
  country: "Spain",
  lat: 41.3874,
  lng: 2.1686,
  radiusKm: 30,
  facts: [
    "Barcelona's La Sagrada Familia has been under construction since 1882 and is expected to finish in 2026.",
    "The city has 9 UNESCO World Heritage Sites, more than any other city in the world.",
  ],
},
```
