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

    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
      req.headers.get("x-real-ip") ||
      (req as any).ip ||
      "unknown";

    const supabase = supabaseServer();

    //Daily voting cap per IP
    const LIMIT_PER_DAY = 1000;
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const { count: voteCount, error: cntErr } = await supabase
      .from("fights")
      .select("*", { count: "exact", head: true })
      .gte("created_at", since)
      .eq("ip", ip);

    if (cntErr) throw cntErr;
    if ((voteCount ?? 0) >= LIMIT_PER_DAY) {
      return NextResponse.json({ error: "Daily voting limit reached" }, { status: 429 });
    }

    const { error: insFightErr } = await supabase.from("fights").insert({
      ip,
      winner_id: winnerId,
      loser_id: loserId,
    });

    // if (insFightErr) {
    //   const msg = String(insFightErr.message || "").toLowerCase();
    //   if (msg.includes("unique") || msg.includes("duplicate")) {
    //     return NextResponse.json({ error: "You already voted on this matchup" }, { status: 409 });
    //   }

    //   throw insFightErr;
    // }

    const K = typeof k === "number" ? k : 32;

    const { data: rows, error: selErr } = await supabase
      .from("ratings")
      .select("character_id, rating, wins, losses")
      .in("character_id", [winnerId, loserId]);

    if (selErr) throw selErr;

    const map = new Map<string, RatingRow>();
    for (const r of rows ?? []) map.set(r.character_id, r as RatingRow);

    const winner: RatingRow = map.get(winnerId) ?? { character_id: winnerId, rating: 1000, wins: 0, losses: 0 };
    const loser: RatingRow = map.get(loserId) ?? { character_id: loserId, rating: 1000, wins: 0, losses: 0 };

    const Ea = expectedScore(winner.rating, loser.rating);
    const Eb = 1 - Ea;

    const winnerNew = Math.round(winner.rating + K * (1 - Ea));
    const loserNew = Math.round(loser.rating + K * (0 - Eb));

    const now = new Date().toISOString();

    const payload = [
      { character_id: winnerId, rating: winnerNew, wins: winner.wins + 1, losses: winner.losses, updated_at: now },
      { character_id: loserId, rating: loserNew, wins: loser.wins, losses: loser.losses + 1, updated_at: now },
    ];

    const { error: upErr } = await supabase.from("ratings").upsert(payload);
    if (upErr) throw upErr;

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
    return NextResponse.json({ error: err?.message ?? "Server error" }, { status: 500 });
  }
}
