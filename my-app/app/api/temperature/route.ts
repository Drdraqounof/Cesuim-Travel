import { NextResponse } from 'next/server';

type TempPoint = {
  latitude: number;
  longitude: number;
  tempC: number;
};

// Simple demo endpoint: returns a small grid of temperature points around a center.
// If you provide `lat` and `lng` query params, the grid will center there.
// In future we can proxy to OpenWeatherMap or other providers when an API key is configured.

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const lat = Number(url.searchParams.get('lat') ?? '37.7749');
    const lng = Number(url.searchParams.get('lng') ?? '-122.4194');
    const spacing = Number(url.searchParams.get('spacing') ?? '0.02'); // degrees
    const rows = 3;
    const cols = 3;

    const points: TempPoint[] = [];

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const offsetLat = (r - Math.floor(rows / 2)) * spacing;
        const offsetLng = (c - Math.floor(cols / 2)) * spacing;
        // Demo temperature distribution: higher to the south-east
        const tempC = Math.round(15 + (r - c) * 2 + (Math.random() - 0.5) * 3);

        points.push({
          latitude: lat + offsetLat,
          longitude: lng + offsetLng,
          tempC,
        });
      }
    }

    return NextResponse.json({ points });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to generate temperature points' }, { status: 500 });
  }
}
