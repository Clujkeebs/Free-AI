import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseAdmin } from "@/lib/supabaseAdmin";

const verifySchema = z.object({
  licenseKey: z.string().min(32).max(64)
});

export async function POST(request: Request) {
  const parsed = verifySchema.safeParse(await request.json().catch(() => null));

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid license key." },
      { status: 400 }
    );
  }

  const supabase = createSupabaseAdmin();
  const { data, error } = await supabase
    .from("license_keys")
    .select("id, key, status, profiles(has_pro)")
    .eq("key", parsed.data.licenseKey)
    .eq("status", "active")
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const profile = Array.isArray(data?.profiles)
    ? data?.profiles[0]
    : data?.profiles;
  const hasPro = profile?.has_pro === true;

  if (data?.id) {
    await supabase
      .from("license_keys")
      .update({ last_verified_at: new Date().toISOString() })
      .eq("id", data.id);
  }

  return NextResponse.json({
    valid: Boolean(data),
    hasPro,
    tier: hasPro ? "pro" : "free"
  });
}
