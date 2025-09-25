import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

const SUBMISSION_LIMIT_PER_24H = 5;

export async function GET(req: NextRequest) {
  try {
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
      req.headers.get("x-real-ip") ||
      // @ts-ignore
      (req as any).ip ||
      "unknown";

    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const supabase = supabaseServer();
    const { count, error } = await supabase
      .from("submissions")
      .select("*", { count: "exact", head: true })
      .gte("created_at", since)
      .eq("ip", ip);

    if (error) throw error;

    const used = count ?? 0;
    const remaining = Math.max(0, SUBMISSION_LIMIT_PER_24H - used);

    return NextResponse.json({ used, remaining, limit: SUBMISSION_LIMIT_PER_24H });
  } catch (err: any) {
    console.error("GET /api/quota error", err);
    return NextResponse.json({ error: err.message || "Server error" }, { status: 500 });
  }
}
