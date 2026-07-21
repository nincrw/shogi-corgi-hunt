import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabaseServer";

const LEADERBOARD_SIZE = 10;
const MAX_NAME_LENGTH = 24;

export async function GET() {
  try {
    const supabase = getSupabaseServerClient();
    const { data, error } = await supabase
      .from("scores")
      .select("winner_name, score, created_at")
      .order("score", { ascending: false })
      .order("created_at", { ascending: true })
      .limit(LEADERBOARD_SIZE);

    if (error) throw error;
    return NextResponse.json({ scores: data ?? [] });
  } catch {
    return NextResponse.json({ error: "Couldn't load the leaderboard." }, { status: 502 });
  }
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const winnerName = String(body.winnerName ?? "").trim().slice(0, MAX_NAME_LENGTH);
  const score = Number(body.score);

  if (!winnerName) {
    return NextResponse.json({ error: "A username is required." }, { status: 400 });
  }
  if (!Number.isInteger(score) || score < 0) {
    return NextResponse.json({ error: "Invalid score." }, { status: 400 });
  }

  try {
    const supabase = getSupabaseServerClient();
    const { error } = await supabase.from("scores").insert({ winner_name: winnerName, score });

    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Couldn't save the score." }, { status: 502 });
  }
}
