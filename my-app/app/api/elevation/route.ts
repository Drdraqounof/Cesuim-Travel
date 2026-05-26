import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const lat = searchParams.get("lat");
  const lng = searchParams.get("lng");
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;

  if (!lat || !lng) {
    return NextResponse.json(
      { error: "Latitude and longitude are required" },
      { status: 400 }
    );
  }

  if (!apiKey) {
    return NextResponse.json({ error: "Google Maps API key not configured" }, { status: 500 });
  }

  try {
    const url = new URL("https://maps.googleapis.com/maps/api/elevation/json");
    url.searchParams.set("locations", `${lat},${lng}`);
    url.searchParams.set("key", apiKey);

    const response = await fetch(url.toString());
    const data = await response.json();

    if (data.status !== "OK") {
      return NextResponse.json(
        { error: `Elevation API failed: ${data.status}` },
        { status: 400 }
      );
    }

    const result = data.results[0];
    if (!result) {
      return NextResponse.json({ error: "No elevation data found" }, { status: 404 });
    }

    return NextResponse.json({
      googleElevation: result.elevation,
      googleResolution: result.resolution,
      latitude: result.location.lat,
      longitude: result.location.lng,
    });
  } catch (error) {
    console.error("[Elevation API] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch elevation data" },
      { status: 500 }
    );
  }
}
