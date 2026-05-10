import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { createSupabaseAdmin } from "@/lib/supabaseAdmin";

const settingsSchema = z.object({
  defaultProvider: z.enum([
    "ollama",
    "anthropic",
    "openai",
    "groq",
    "deepseek",
    "google"
  ]),
  rules: z.string().max(12000),
  cloudSyncEnabled: z.boolean()
});

export async function PUT(request: Request) {
  const parsed = settingsSchema.safeParse(await request.json().catch(() => null));

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid settings." }, { status: 400 });
  }

  const { supabase, user } = await requireUser();
  const { error } = await supabase
    .from("agent_settings")
    .update({
      default_provider: parsed.data.defaultProvider,
      rules: parsed.data.rules,
      cloud_sync_enabled: parsed.data.cloudSyncEnabled
    })
    .eq("user_id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const licenseKey =
    request.headers.get("x-neonforge-license") ??
    url.searchParams.get("licenseKey");

  if (!licenseKey) {
    return NextResponse.json({ error: "Missing license key." }, { status: 401 });
  }

  const admin = createSupabaseAdmin();
  const { data: license, error } = await admin
    .from("license_keys")
    .select("user_id, key, status, profiles(has_pro)")
    .eq("key", licenseKey)
    .eq("status", "active")
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!license) {
    return NextResponse.json({ error: "Invalid license key." }, { status: 403 });
  }

  const { data: settings, error: settingsError } = await admin
    .from("agent_settings")
    .select("default_provider, rules, cloud_sync_enabled")
    .eq("user_id", license.user_id)
    .maybeSingle();

  if (settingsError) {
    return NextResponse.json({ error: settingsError.message }, { status: 500 });
  }

  const profile = Array.isArray(license.profiles)
    ? license.profiles[0]
    : license.profiles;
  const hasPro = profile?.has_pro === true;

  if (!hasPro || !settings?.cloud_sync_enabled) {
    return NextResponse.json({
      tier: hasPro ? "pro" : "free",
      cloudSyncEnabled: false,
      settings: null
    });
  }

  return NextResponse.json({
    tier: "pro",
    cloudSyncEnabled: true,
    settings: {
      defaultProvider: settings.default_provider,
      rules: settings.rules
    }
  });
}
