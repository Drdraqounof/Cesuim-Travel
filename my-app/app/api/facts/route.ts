import { NextResponse } from "next/server";
import OpenAI from "openai";
import {
  findFamousPlace,
  getRandomFact,
  getCachedFact,
  setCachedFact,
} from "@/lib/facts";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function generateFacts(lat: number, lng: number): Promise<string[]> {
  const prompt = `You are a geography expert. Give me exactly one short, interesting, verified fact about the location at coordinates ${lat.toFixed(4)}, ${lng.toFixed(4)}. The fact must be historically or geographically accurate.

Rules:
- Keep it to 1-2 sentences max.
- Do NOT make up any facts — only state things you are highly confident are true.
- Start with the fact directly, no preamble.

Fact:`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
    max_tokens: 100,
    temperature: 0.7,
  });

  const fact = completion.choices[0]?.message?.content?.trim() ?? "";
  if (!fact) return [];

  const verifyPrompt = `Is the following claim factually accurate? Answer ONLY with YES or NO.

Claim: ${fact}`;

  const verifyCompletion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: verifyPrompt }],
    max_tokens: 10,
    temperature: 0,
  });

  const verdict = verifyCompletion.choices[0]?.message?.content?.trim() ?? "";

  if (verdict === "YES") {
    return [fact];
  }

  return [];
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const lat = parseFloat(searchParams.get("lat") ?? "");
  const lng = parseFloat(searchParams.get("lng") ?? "");

  if (isNaN(lat) || isNaN(lng)) {
    return NextResponse.json(
      { error: "lat and lng query parameters are required" },
      { status: 400 },
    );
  }

  // Check cache first
  const cached = getCachedFact(lat, lng);
  if (cached) {
    return NextResponse.json({
      name: cached.name,
      country: null,
      fact: getRandomFact(cached.facts),
    });
  }

  // Check hardcoded famous places
  const famous = findFamousPlace(lat, lng);
  if (famous) {
    return NextResponse.json({
      name: famous.name,
      country: famous.country,
      fact: getRandomFact(famous.facts),
    });
  }

  // No API key — return no fact
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ fact: null });
  }

  // Generate via OpenAI
  try {
    const facts = await generateFacts(lat, lng);
    if (facts.length > 0) {
      setCachedFact(lat, lng, facts);
      return NextResponse.json({ name: null, fact: getRandomFact(facts) });
    }
  } catch {
    // OpenAI failed — return no fact
  }

  return NextResponse.json({ fact: null });
}
