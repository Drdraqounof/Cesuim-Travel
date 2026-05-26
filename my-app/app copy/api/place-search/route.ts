export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("query");

  if (!query) {
    return Response.json({ error: "Query parameter required" }, { status: 400 });
  }

  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    return Response.json({ error: "API key not configured" }, { status: 500 });
  }

  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(query)}&key=${apiKey}`
    );

    if (!response.ok) {
      throw new Error("Google Maps API error");
    }

    const data = await response.json();

    if (data.status !== "OK" || !data.results.length) {
      return Response.json({ error: "Place not found" }, { status: 404 });
    }

    const result = data.results[0];
    const { lat, lng } = result.geometry.location;

    return Response.json({
      latitude: lat,
      longitude: lng,
      address: result.formatted_address,
      placeId: result.place_id,
    });
  } catch (error) {
    console.error("Place search error:", error);
    return Response.json({ error: "Failed to search place" }, { status: 500 });
  }
}
