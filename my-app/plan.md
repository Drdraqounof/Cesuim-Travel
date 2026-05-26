# TerraScope - Environmental Dashboard Plan

## Project Overview

**Project Name**: TerraScope
**Type**: Multi-page Next.js Web Application
**Purpose**: Environmental data visualization and immersive 3D geospatial exploration
**Core Features**: Dashboard with notes/thoughts gathering + 3D Environment with CesiumJS and Google Photorealistic Tiles

---

## Tech Stack

- **Framework**: Next.js 16
- **UI Library**: React 19
- **Styling**: Tailwind CSS 4
- **3D Engine**: CesiumJS via Resium
- **3D Library**: Three.js (for custom overlays)
- **APIs**: Google Maps Platform (Map Tiles, Elevation, Geocoding)

---

## Current Project State

Existing code in `C:\Projects\geospactial\my-app\`:
- ✅ 3D Cesium viewer with San Francisco downtown tileset at `/` (page.tsx)
- ✅ Elevation API endpoint (`/api/elevation`)
- ✅ Geocode API endpoint (`/api/geocode`)
- ✅ CesiumMap component with view presets and camera controls
- ✅ Google Maps API key configured in environment

---

## Constraints

1. **Existing 3D Page**: The root page (`/`) already contains a fully functional 3D Cesium environment. Do NOT recreate it - it works as-is.

2. **API Keys Required**:
   - `NEXT_PUBLIC_CESIUM_ION_TOKEN` - For Cesium assets
   - `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` - For Google 3D tiles & APIs

3. **Styling**: Must match existing dark theme with cyan accents (`#22d3ee`), slate grays, and glass-morphism effects.

4. **Responsive**: Must work on desktop and tablet (mobile is optional for 3D).

5. **No Backend Required**: Use localStorage for notes/locations persistence initially.

---

## Pages to Create

### Page 1: Dashboard (`/dashboard`) - NEW

**Route**: `/dashboard`
**Status**: TO BE CREATED
**Purpose**: Central hub for gathering thoughts, viewing metrics, and managing saved data

**Sections**:
1. **Header**
   - Logo/Brand "TerraScope"
   - Navigation to 3D Environment (`/`)

2. **Stats Cards**
   - Quick overview metrics (saved locations count, notes count, last activity)
   - Data layer status indicators

3. **Notes Panel**
   - Text area for user thoughts
   - Auto-save to localStorage
   - List of recent notes with timestamps

4. **Saved Locations**
   - List of bookmarked coordinates
   - Name + description for each
   - Quick action to fly to location in 3D

5. **Quick Actions**
   - "Open 3D Environment" button
   - "Add New Location" button

### Page 2: 3D Environment (`/`) - EXISTING ✅

**Route**: `/`
**Status**: ALREADY DONE - No changes needed
**Current**: Full CesiumJS viewer with downtown San Francisco tileset, view presets, elevation comparison

---

## What Needs to Be Changed

### In Existing Files:

1. **`app/page.tsx`** (Current 3D page)
   - Add link/navigation to Dashboard (`/dashboard`)
   - Optional: Add "Save to Dashboard" button for current view

2. **`app/layout.tsx`**
   - Update to support multi-page layout (shared header/nav)
   - Or keep separate layouts per page

### New Files to Create:

1. **`app/dashboard/page.tsx`** - Dashboard page component

2. **`components/Dashboard/Header.tsx`** - Dashboard header with nav

3. **`components/Dashboard/StatsCards.tsx`** - Overview metrics

4. **`components/Dashboard/NotesPanel.tsx`** - Notes input and list

5. **`components/Dashboard/SavedLocations.tsx`** - Location bookmarks

6. **`lib/storage.ts`** - localStorage helpers for notes/locations

7. **`lib/types.ts`** - TypeScript interfaces

---

## Implementation Roadmap

### Phase 1: Dashboard Core (Priority: High)
- [ ] Create `/dashboard` route with basic layout
- [ ] Build Dashboard Header with navigation to 3D
- [ ] Create StatsCards component
- [ ] Implement NotesPanel with localStorage
- [ ] Build SavedLocations list component

### Phase 2: Integration (Priority: High)
- [ ] Add link on 3D page to navigate to Dashboard
- [ ] Add "Save Location" action from 3D page
- [ ] Connect saved locations to fly-to in 3D

### Phase 3: Polish (Priority: Medium)
- [ ] Add layer toggle controls
- [ ] Add search/filter for notes
- [ ] Responsive layout adjustments

---

## API Integration

### Google Maps Platform (Existing)
- **Map Tiles API**: For Google Photorealistic 3D Tiles
- **Elevation API**: For elevation data comparison
- **Geocoding API**: For address search

### Endpoints (Existing)
- `GET /api/elevation?lat=<>&lng=<>` - Fetch Google elevation
- `GET /api/geocode?location=<>` - Geocode address to coordinates

---

## Creative Use Cases (Google Maps API + Cesium)

1. **Google Photorealistic 3D Tiles** - Global photorealistic buildings/terrain
2. **Google 2D Satellite Imagery** - Replace default Bing imagery
3. **Google Street View Panoramas** - 360° ground-level context
4. **Google Geocoding** - Address search
5. **Building Insertion** - Overlay proposed models on 3D context
6. **Elevation Enhancement** - Combine Google + Cesium terrain data

---

## Design System

### Color Palette (Dark Theme)
- Background: `#02050b` to `#12314f` radial gradient
- Primary accent: Cyan (`#22d3ee`)
- Secondary: Slate grays (`#0f172a`, `#1e293b`)
- Text: White / Slate-200

### Typography
- Headings: Sans-serif, bold
- Body: Sans-serif, regular
- Labels: Uppercase, tracked (letter-spacing)

### UI Components
- Rounded corners: `24px` - `32px`
- Borders: `1px solid white/10`
- Backdrop blur on panels
- Glass-morphism effects

---

## Environment Variables

```
NEXT_PUBLIC_CESIUM_ION_TOKEN=     # Required for Cesium assets
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY= # Required for Google 3D tiles & APIs
NEXT_PUBLIC_3DTILES_URL=          # Optional: custom 3D tiles URL
NEXT_PUBLIC_DOWNTOWN_ASSET_ID=    # Optional: fallback asset ID
```

---

## File Structure (Target)

```
my-app/
├── app/
│   ├── page.tsx                    # 3D Environment (EXISTING ✅)
│   ├── dashboard/
│   │   └── page.tsx               # Dashboard (NEW)
│   ├── api/
│   │   ├── elevation/route.ts      # Existing
│   │   └── geocode/route.ts        # Existing
│   ├── layout.tsx
│   └── globals.css
├── components/
│   ├── CesiumMap.tsx               # Existing
│   ├── CesiumMapShell.tsx          # Existing
│   └── Dashboard/
│       ├── Header.tsx              # NEW
│       ├── StatsCards.tsx          # NEW
│       ├── NotesPanel.tsx          # NEW
│       └── SavedLocations.tsx      # NEW
├── lib/
│   ├── storage.ts                  # NEW
│   └── types.ts                    # NEW
├── public/
│   └── cesium/                     # Cesium assets
├── package.json
└── plan.md
```

---

## Implementation Notes

1. **Cesium + Next.js**: Set `CESIUM_BASE_URL` to `/cesium` for proper asset loading
2. **Google 3D Tiles**: Use `createGooglePhotorealistic3DTileset()` with `globe: false`
3. **State Management**: Use React context or localStorage for notes/locations
4. **3D Page**: Already done at `/` - just add navigation link to Dashboard

---

## Next Steps

1. Create `/dashboard` page layout
2. Build Dashboard Header component with nav
3. Add StatsCards component
4. Implement NotesPanel with localStorage persistence
5. Build SavedLocations component
6. Add navigation link on 3D page to Dashboard
7. Test flow between Dashboard and 3D Environment