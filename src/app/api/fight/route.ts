import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

type RatingRow = { character_id: string; rating: number; wins: number; losses: number };

function expectedScore(ra: number, rb: number) {
  return 1 / (1 + Math.pow(10, (rb - ra) / 400));
}

export async function POST(req: NextRequest) {
  try {
    const { winnerId, loserId, k } = (await req.json()) as {
      winnerId?: string;
      loserId?: string;
      k?: number;
    };

    if (!winnerId || !loserId || winnerId === loserId) {
      return NextResponse.json({ error: "Invalid winner/loser ids" }, { status: 400 });
    }

    const K = typeof k === "number" ? k : 32;
    const supabase = supabaseServer();

    // 1) fetch current ratings (or init if missing)
    const { data: rows, error: selErr } = await supabase
      .from("ratings")
      .select("character_id, rating, wins, losses")
      .in("character_id", [winnerId, loserId]);

    if (selErr) throw selErr;

    const map = new Map<string, RatingRow>();
    for (const r of rows ?? []) map.set(r.character_id, r as RatingRow);

    const winner: RatingRow = map.get(winnerId) ?? { character_id: winnerId, rating: 1000, wins: 0, losses: 0 };
    const loser: RatingRow = map.get(loserId) ?? { character_id: loserId, rating: 1000, wins: 0, losses: 0 };

    // 2) apply Elo
    const Ea = expectedScore(winner.rating, loser.rating);
    const Eb = 1 - Ea;

    const winnerNew = Math.round(winner.rating + K * (1 - Ea));
    const loserNew = Math.round(loser.rating + K * (0 - Eb));

    const now = new Date().toISOString();

    // 3) upsert both rows
    const payload = [
      { character_id: winnerId, rating: winnerNew, wins: winner.wins + 1, losses: winner.losses, updated_at: now },
      { character_id: loserId, rating: loserNew, wins: loser.wins, losses: loser.losses + 1, updated_at: now },
    ];

    const { error: upErr } = await supabase.from("ratings").upsert(payload);
    if (upErr) throw upErr;

    // 4) return updated ratings
    return NextResponse.json(
      {
        winner: { id: winnerId, rating: winnerNew, wins: winner.wins + 1, losses: winner.losses },
        loser: { id: loserId, rating: loserNew, wins: loser.wins, losses: loser.losses + 1 },
        K,
      },
      { status: 200 }
    );
  } catch (err: any) {
    console.error("POST /api/fight error:", err);
    return NextResponse.json({ error: err.message ?? "Server error" }, { status: 500 });
  }
}
