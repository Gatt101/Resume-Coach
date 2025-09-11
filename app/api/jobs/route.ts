import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const params = url.searchParams;

    // Build SerpAPI URL
    const serpParams = new URLSearchParams();
    params.forEach((value, key) => {
      serpParams.set(key, value);
    });

    const SERP_API_KEY = process.env.SERP_API_KEY;
    if (!SERP_API_KEY) {
      return NextResponse.json({ error: "Server missing SERP_API_KEY" }, { status: 500 });
    }

    serpParams.set("api_key", SERP_API_KEY);

    const serpUrl = `https://serpapi.com/search?${serpParams.toString()}`;

    const resp = await fetch(serpUrl);
    const text = await resp.text();

    // Forward status and body
    return new NextResponse(text, {
      status: resp.status,
      headers: { "content-type": resp.headers.get("content-type") || "application/json" },
    });
  } catch (err) {
    console.error("/api/jobs error", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
