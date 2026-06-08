import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";

export async function GET() {
  try {
    const user = await requireUser();
    const locations = await prisma.savedLocation.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ locations });
  } catch (err) {
    if (err instanceof Error && err.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("GET /api/locations error:", err);
    return NextResponse.json({ error: "Failed to fetch locations" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const body = await request.json();
    const { name, description, latitude, longitude, elevation, liked } = body;

    if (!name || latitude == null || longitude == null) {
      return NextResponse.json({ error: "Name, latitude, and longitude are required" }, { status: 400 });
    }

    const location = await prisma.savedLocation.create({
      data: {
        name,
        description: description ?? null,
        latitude,
        longitude,
        elevation: elevation ?? null,
        liked: liked ?? false,
        userId: user.id,
      },
    });

    return NextResponse.json({ location }, { status: 201 });
  } catch (err) {
    if (err instanceof Error && err.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("POST /api/locations error:", err);
    return NextResponse.json({ error: "Failed to save location" }, { status: 500 });
  }
}
