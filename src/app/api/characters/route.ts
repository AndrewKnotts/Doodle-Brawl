import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { supabaseServer } from "@/lib/supabaseServer";

type PostBody = {
  name?: string;
  imageDataUrl?: string;
};

const SUBMISSION_LIMIT_PER_24H = 500;

function bad(status: number, error: string) {
  return NextResponse.json({ error }, { status });
}

export async function POST(req: NextRequest) {
  try {
    const { name, imageDataUrl } = (await req.json()) as PostBody;

    if (typeof name !== "string" || !name.trim()) {
      return bad(400, "Name is required");
    }
    const safeName = name.trim();
    if (safeName.length > 40) {
      return bad(400, "Name too long (max 40)");
    }
    if (typeof imageDataUrl !== "string" || !imageDataUrl.startsWith("data:image/png;base64,")) {
      return bad(400, "Invalid image format (must be PNG data URL)");
    }

    const base64 = imageDataUrl.split(",")[1]!;
    const approxBytes = (base64.length * 3) / 4;
    const MAX_BYTES = 1.5 * 1024 * 1024;
    if (approxBytes > MAX_BYTES) {
      return bad(413, "Image too large (max ~1.5MB)");
    }

    const supabase = supabaseServer();

    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
      req.headers.get("x-real-ip") ||
      (req as any).ip ||
      "unknown";

    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { count, error: countErr } = await supabase
      .from("submissions")
      .select("*", { count: "exact", head: true })
      .gte("created_at", since)
      .eq("ip", ip);

    if (countErr) throw countErr;

    if ((count ?? 0) >= SUBMISSION_LIMIT_PER_24H) {
      return bad(429, "Daily submission limit reached!");
    }

    const remainingBefore = Math.max(0, SUBMISSION_LIMIT_PER_24H - (count ?? 0));

    const buffer = Buffer.from(base64, "base64");
    const id = randomUUID();
    const filePath = `${id}.png`;

    const bucket = process.env.SUPABASE_BUCKET!;
    const { error: uploadError } = await supabase.storage.from(bucket).upload(filePath, buffer, {
      contentType: "image/png",
      upsert: false,
    });
    if (uploadError) throw uploadError;

    const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(filePath);
    const imageUrl = urlData.publicUrl;

    const { data: insertedChar, error: insertError } = await supabase
      .from("characters")
      .insert({ id, name: safeName, image_url: imageUrl })
      .select()
      .single();
    if (insertError) throw insertError;

    const { error: ratingErr } = await supabase.from("ratings").insert({ character_id: id });
    if (ratingErr) throw ratingErr;

    await supabase.from("submissions").insert({ ip, character_id: id });

    const remaining = Math.max(0, remainingBefore - 1);

    return NextResponse.json({ ...insertedChar, remaining }, { status: 201 });
  } catch (err: any) {
    console.error("POST /api/characters error:", err);
    return bad(500, err?.message || "Server error");
  }
}

export async function GET(req: NextRequest) {
  try {
    const supabase = supabaseServer();

    // const ip =
    //   req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    //   req.headers.get("x-real-ip") ||
    //   // @ts-ignore
    //   (req as any).ip ||
    //   "unknown";

    // // fetch character ids created by this IP
    // const sinceEpoch = "1970-01-01T00:00:00.000Z";
    // const { data: mine, error: mineErr } = await supabase
    //   .from("submissions")
    //   .select("character_id")
    //   .eq("ip", ip)
    //   .gte("created_at", sinceEpoch);

    // if (mineErr) throw mineErr;

    // const excludeIds = (mine ?? []).map((r) => r.character_id).filter(Boolean) as string[];

    // pull characters not hidden and not created by this IP
    // Supabase "not in" expects a CSV tuple string like "(id1,id2,...)"
    // const notIn = excludeIds.length ? `(${excludeIds.join(",")})` : null;

    let query = supabase
      .from("characters")
      .select("id, name, image_url, created_at, ratings (rating, wins, losses)")
      .eq("hidden", false);

    // if (notIn) {
    //   // @ts-ignore - supabase types accept this
    //   query = query.not("id", "in", notIn);
    // }

    const { data, error } = await query;
    if (error) throw error;

    return NextResponse.json(data ?? [], { status: 200 });
  } catch (err: any) {
    console.error("GET /api/characters error:", err);
    return NextResponse.json({ error: err?.message || "Server error" }, { status: 500 });
  }
}
