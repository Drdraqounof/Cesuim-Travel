import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const location = searchParams.get("location") || "Downtown San Francisco";
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    return NextResponse.json({ error: "Google Maps API key not configured" }, { status: 500 });
  }

  try {
    const url = new URL("https://maps.googleapis.com/maps/api/geocode/json");
    url.searchParams.set("address", location);
    url.searchParams.set("key", apiKey);

    const response = await fetch(url.toString());
    const data = await response.json();

    if (data.status !== "OK") {
      return NextResponse.json(
        { error: `Geocoding failed: ${data.status}` },
        { status: 400 }
      );
    }

    const result = data.results[0];
    if (!result) {
      return NextResponse.json({ error: "No results found" }, { status: 404 });
    }

    const { lat, lng } = result.geometry.location;
    const formattedAddress = result.formatted_address;

    return NextResponse.json({
      latitude: lat,
      longitude: lng,
      address: formattedAddress,
      location,
    });
  } catch (error) {
    console.error("[Geocode API] Error:", error);
    return NextResponse.json(
      { error: "Failed to geocode location" },
      { status: 500 }
    );
  }
}
