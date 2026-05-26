# Geospactial

Geospactial is a Next.js geospatial viewer and dashboard project built with Cesium, Resium, React Three Fiber, and Tailwind CSS.

The current runnable application lives inside the `my-app` folder.

## Project Structure

- `my-app/app` - Next.js App Router pages, including the dashboard and 3D viewer
- `my-app/components` - UI components and Cesium map components
- `my-app/lib` - shared types and storage helpers
- `my-app/public/cesium` - copied Cesium runtime assets
- `my-app/scripts/copy-cesium-assets.mjs` - postinstall/build asset copy script

## Requirements

- Node.js 20 or newer
- npm
- A Google Maps API key for geocoding, place search, and elevation endpoints

## Getting Started

From the repository root:

```bash
cd my-app
npm install
npm run dev
```

Open `http://localhost:3000` in the browser.

## Environment Variables

Create `my-app/.env.local` and add the variables you need:

```env
GOOGLE_MAPS_API_KEY=your_google_maps_api_key
NEXT_PUBLIC_CESIUM_ION_TOKEN=your_cesium_ion_token
NEXT_PUBLIC_3DTILES_URL=
NEXT_PUBLIC_DOWNTOWN_ASSET_ID=96188
```

Notes:

- `GOOGLE_MAPS_API_KEY` is required for `/api/geocode`, `/api/place-search`, and `/api/elevation`.
- `NEXT_PUBLIC_CESIUM_ION_TOKEN` is needed when loading Cesium terrain or an Ion-hosted 3D tileset.
- `NEXT_PUBLIC_3DTILES_URL` can be used instead of an Ion asset if you have a direct 3D Tiles endpoint.
- `NEXT_PUBLIC_DOWNTOWN_ASSET_ID` is optional and defaults to `96188`.

## Available Scripts

Run these inside `my-app`:

```bash
npm run dev
npm run build
npm run start
npm run lint
```

The project also runs `npm run copy:cesium-assets` during install and before development/build so the Cesium runtime files are available under `public/cesium`.

## Main Views

- `/` - dashboard-style home screen with saved locations, notes, and quick actions
- `/viewer` - Cesium-based 3D downtown viewer with place search and scene controls
- `/dashboard` - dashboard route for saved exploration data

## Important Note About This Repo

If GitHub shows `my-app` as a nested folder, that is expected with the current repository layout because the actual app is inside that directory. If you want the app files to appear at the repository root on GitHub, the repository itself needs to be rooted at `my-app` instead.