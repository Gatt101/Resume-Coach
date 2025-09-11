import { NextResponse } from "next/server";

function safeParseUrl(request: Request) {
  try {
    return new URL(request.url);
  } catch (e) {
    const host = request.headers?.get?.('host') || 'localhost';
    return new URL(request.url, `http://${host}`);
  }
}

export async function GET(request: Request) {
  try {
    const url = safeParseUrl(request);
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
