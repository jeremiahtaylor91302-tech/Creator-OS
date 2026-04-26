import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type FeedbackType = "feature" | "bug";

function isFeedbackType(value: string): value is FeedbackType {
  return value === "feature" || value === "bug";
}

export async function POST(request: Request) {
  const payload = (await request.json()) as {
    type?: string;
    message?: string;
    page_url?: string;
  };

  if (!payload.type || !isFeedbackType(payload.type)) {
    return NextResponse.json({ error: "Invalid feedback type." }, { status: 400 });
  }

  const message = payload.message?.trim() ?? "";
  if (!message) {
    return NextResponse.json({ error: "Message is required." }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase.from("feedback").insert({
    type: payload.type,
    message,
    page_url: payload.page_url ?? null,
    user_id: user?.id ?? null,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
