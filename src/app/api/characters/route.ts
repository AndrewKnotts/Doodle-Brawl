import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import { randomUUID } from "crypto";

export async function POST(req: NextRequest) {
  try {
    const { name, imageDataUrl } = await req.json();

    if (!name || !imageDataUrl) {
      return NextResponse.json({ error: "Missing name or image" }, { status: 400 });
    }

    const supabase = supabaseServer();

    // decode base64 → Buffer
    const base64 = imageDataUrl.split(",")[1];
    const buffer = Buffer.from(base64, "base64");

    // unique filename
    const id = randomUUID();
    const filePath = `${id}.png`;

    // upload to Supabase storage
    const { error: uploadError } = await supabase.storage.from(process.env.SUPABASE_BUCKET!).upload(filePath, buffer, {
      contentType: "image/png",
      upsert: false,
    });

    if (uploadError) throw uploadError;

    // get public URL
    const { data: urlData } = supabase.storage.from(process.env.SUPABASE_BUCKET!).getPublicUrl(filePath);

    const imageUrl = urlData.publicUrl;

    // insert into characters
    const { data: insertedChar, error: insertError } = await supabase
      .from("characters")
      .insert({ id, name, image_url: imageUrl })
      .select()
      .single();

    if (insertError) throw insertError;

    // insert into ratings
    const { error: ratingError } = await supabase.from("ratings").insert({ character_id: id });

    if (ratingError) throw ratingError;

    return NextResponse.json(insertedChar, { status: 201 });
  } catch (err: any) {
    console.error("POST /api/characters error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function GET() {
  try {
    const supabase = supabaseServer();

    const { data, error } = await supabase
      .from("characters")
      .select("id, name, image_url, created_at, ratings (rating, wins, losses)");

    if (error) throw error;

    return NextResponse.json(data, { status: 200 });
  } catch (err: any) {
    console.error("GET /api/characters error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
