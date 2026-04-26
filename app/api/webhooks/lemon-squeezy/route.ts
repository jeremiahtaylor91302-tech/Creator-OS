import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

type LemonWebhookPayload = {
  meta?: {
    custom_data?: {
      creatoros_user_id?: string;
    };
  };
  data?: {
    id?: string;
    attributes?: {
      user_email?: string;
      status?: string;
    };
  };
};

function verifySignature(rawBody: string, signature: string | null) {
  const secret = process.env.LEMON_SQUEEZY_WEBHOOK_SECRET;
  if (!secret) {
    return true;
  }
  if (!signature) {
    return false;
  }
  const digest = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
  return crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(signature));
}

export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-signature");

  if (!verifySignature(rawBody, signature)) {
    return NextResponse.json({ error: "Invalid webhook signature." }, { status: 401 });
  }

  const eventName = request.headers.get("x-event-name") ?? "";
  const payload = JSON.parse(rawBody) as LemonWebhookPayload;

  if (eventName !== "order_created" && eventName !== "subscription_payment_success") {
    return NextResponse.json({ ok: true });
  }

  const supabase = createAdminClient();

  const userId = payload.meta?.custom_data?.creatoros_user_id ?? null;

  if (!userId) {
    return NextResponse.json({ ok: true });
  }

  await supabase.from("user_access").upsert(
    {
      user_id: userId,
      lifetime_access: true,
      lemon_order_id: payload.data?.id ?? null,
      purchased_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );

  return NextResponse.json({ ok: true });
}
