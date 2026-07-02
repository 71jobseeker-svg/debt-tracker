import { Redis } from "@upstash/redis";
import { NextResponse } from "next/server";
import {
  KV_STATE_KEY,
  deserializeAppState,
  serializeAppState,
  type PersistedAppState,
} from "@/lib/stateSchema";

function getRedis(): Redis | null {
  const url =
    process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL;
  const token =
    process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) return null;

  return new Redis({ url, token });
}

export async function GET() {
  const redis = getRedis();
  if (!redis) {
    return NextResponse.json(
      { error: "Redis not configured", state: null },
      { status: 503 }
    );
  }

  try {
    const raw = await redis.get<unknown>(KV_STATE_KEY);
    if (!raw) {
      return NextResponse.json({ state: null });
    }

    const state = deserializeAppState(raw);
    if (!state) {
      return NextResponse.json({ state: null });
    }

    return NextResponse.json({ state: serializeAppState(state) });
  } catch (error) {
    console.error("GET /api/state failed:", error);
    return NextResponse.json(
      { error: "Failed to load state" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  const redis = getRedis();
  if (!redis) {
    return NextResponse.json(
      { error: "Redis not configured" },
      { status: 503 }
    );
  }

  try {
    const body = (await request.json()) as PersistedAppState;
    const serialized = serializeAppState(body);
    await redis.set(KV_STATE_KEY, serialized);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const detail =
      error instanceof Error ? error.message : String(error);
    console.error("PUT /api/state failed:", error);
    return NextResponse.json(
      { error: "Failed to save state", detail },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  const redis = getRedis();
  if (!redis) {
    return NextResponse.json(
      { error: "Redis not configured" },
      { status: 503 }
    );
  }

  try {
    await redis.del(KV_STATE_KEY);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("DELETE /api/state failed:", error);
    return NextResponse.json(
      { error: "Failed to reset state" },
      { status: 500 }
    );
  }
}
