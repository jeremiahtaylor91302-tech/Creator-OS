import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createLemonCheckoutUrl } from "@/lib/lemon-squeezy";
import { hasLifetimeAccess } from "@/lib/access";

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { error: "Please sign in to continue checkout." },
      { status: 401 },
    );
  }

  if (await hasLifetimeAccess(user.id)) {
    return NextResponse.json({ url: "/dashboard" });
  }

  try {
    const url = await createLemonCheckoutUrl({
      userId: user.id,
      userEmail: user.email ?? null,
    });
    return NextResponse.json({ url });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Checkout setup failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
