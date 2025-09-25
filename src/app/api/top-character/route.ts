import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

export async function GET() {
  try {
    const supabase = supabaseServer();

    const { data, error } = await supabase
      .from("ratings")
      .select(
        `
        rating,
        wins,
        losses,
        character:characters!inner (
          id,
          name,
          image_url,
          hidden
        )
      `
      )
      .eq("character.hidden", false)
      .order("rating", { ascending: false })
      .limit(1)
      .single();

    if (error) throw error;
    if (!data || !data.character) {
      return NextResponse.json(null, { status: 200 });
    }

    const row = data as any;

    const top = {
      id: row.character.id,
      name: row.character.name,
      image_url: row.character.image_url,
      rating: row.rating,
      wins: row.wins,
      losses: row.losses,
    };

    return NextResponse.json(top, { status: 200 });
  } catch (err: any) {
    console.error("GET /api/top-character error:", err);
    return NextResponse.json({ error: err?.message || "Server error" }, { status: 500 });
  }
}
