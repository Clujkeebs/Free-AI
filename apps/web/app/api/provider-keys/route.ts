import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { createSupabaseAdmin } from "@/lib/supabaseAdmin";

const providerKeySchema = z.object({
  provider: z.enum(["anthropic", "openai", "groq", "deepseek", "google"]),
  apiKey: z.string().min(8).max(4000)
});

export async function POST(request: Request) {
  const parsed = providerKeySchema.safeParse(
    await request.json().catch(() => null)
  );

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid provider key." }, { status: 400 });
  }

  const { user } = await requireUser();
  const admin = createSupabaseAdmin();
  const { error } = await admin.rpc("store_provider_api_key", {
    p_user_id: user.id,
    p_provider: parsed.data.provider,
    p_secret: parsed.data.apiKey
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
