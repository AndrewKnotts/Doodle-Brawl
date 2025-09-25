import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

export async function GET() {
  try {
    const supabase = supabaseServer();

    const { data, error } = await supabase
      .from("characters")
      .select("id, name, image_url, created_at, ratings (rating, wins, losses)")
      .eq("hidden", false)
      .order("rating", { ascending: false, foreignTable: "ratings" })
      .limit(1);

    if (error) throw error;

    const top = (data ?? [])[0] || null;
    return NextResponse.json(top, { status: 200 });
  } catch (err: any) {
    console.error("GET /api/top-character error:", err);
    return NextResponse.json({ error: err?.message || "Server error" }, { status: 500 });
  }
}
