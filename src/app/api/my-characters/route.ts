// src/app/api/my-characters/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

export async function GET(req: NextRequest) {
  try {
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
      req.headers.get("x-real-ip") ||
      // @ts-ignore
      (req as any).ip ||
      "unknown";

    const supabase = supabaseServer();

    // fetch character ids created by this IP
    const { data: mine, error: mineErr } = await supabase.from("submissions").select("character_id").eq("ip", ip);

    if (mineErr) throw mineErr;

    const ids = (mine ?? []).map((x) => x.character_id).filter(Boolean) as string[];
    if (ids.length === 0) {
      return NextResponse.json([], { status: 200 });
    }

    const { data, error } = await supabase
      .from("characters")
      .select("id, name, image_url, created_at, ratings (rating, wins, losses)")
      .in("id", ids)
      .eq("hidden", false);

    if (error) throw error;

    return NextResponse.json(data ?? [], { status: 200 });
  } catch (err: any) {
    console.error("GET /api/my-characters error:", err);
    return NextResponse.json({ error: err?.message || "Server error" }, { status: 500 });
  }
}
