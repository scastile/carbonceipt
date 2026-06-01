import { NextRequest, NextResponse } from "next/server";

const BACKEND = process.env.BACKEND_URL || "http://localhost:8000";

function buildBackendUrl(req: NextRequest): string {
  const path = (req.nextUrl.pathname as string).replace("/api/proxy", "");
  return `${BACKEND}${path}${req.nextUrl.search}`;
}

export async function GET(req: NextRequest) {
  const res = await fetch(buildBackendUrl(req), { cache: "no-store" });
  const data = await res.json();
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const res = await fetch(buildBackendUrl(req), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  const data = await res.json();
  return NextResponse.json(data);
}

export async function DELETE(req: NextRequest) {
  const res = await fetch(buildBackendUrl(req), { method: "DELETE", cache: "no-store" });
  if (res.status === 204) return new NextResponse(null, { status: 204 });
  const data = await res.json().catch(() => ({}));
  return NextResponse.json(data);
}
