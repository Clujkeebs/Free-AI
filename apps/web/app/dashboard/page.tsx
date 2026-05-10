import { redirect } from "next/navigation";
import { CheckoutButton } from "@/components/CheckoutButton";
import { ProviderKeyForm } from "@/components/ProviderKeyForm";
import { SettingsForm } from "@/components/SettingsForm";
import { SignOutButton } from "@/components/SignOutButton";
import { requireUser } from "@/lib/auth";

export default async function DashboardPage() {
  const { supabase, user } = await requireUser();
  const [{ data: profile }, { data: license }, { data: settings }] =
    await Promise.all([
      supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
      supabase
        .from("license_keys")
        .select("key, status, last_verified_at")
        .eq("user_id", user.id)
        .eq("status", "active")
        .maybeSingle(),
      supabase
        .from("agent_settings")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle()
    ]);

  if (!profile || !license || !settings) {
    redirect("/login");
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://neonforge.app";
  const installCommand = `curl -fsSL ${appUrl}/install.sh | bash`;
  const initCommand = `neonforge init --hub ${appUrl} --license ${license.key}`;

  return (
    <main className="mx-auto max-w-6xl px-6 py-8">
      <header className="flex flex-col gap-4 border-b border-white/10 pb-5 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-neon-cyan">
            NeonForge Hub
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-white">
            License and Agent Settings
          </h1>
          <p className="mt-2 text-sm text-white/55">{user.email}</p>
        </div>
        <SignOutButton />
      </header>
      <section className="mt-8 grid gap-4 md:grid-cols-3">
        <article className="rounded-lg border border-white/10 bg-white/[0.03] p-5">
          <h2 className="text-base font-medium text-neon-green">Tier</h2>
          <p className="mt-3 text-3xl font-semibold">
            {profile.has_pro ? "Pro" : "Free"}
          </p>
          <p className="mt-2 text-sm text-white/60">
            {profile.has_pro
              ? "Swarm Mode, Deep-Search, and Cloud-Sync are enabled."
              : "One active agent and five file edits per session."}
          </p>
          <div className="mt-4">
            <CheckoutButton disabled={profile.has_pro} />
          </div>
        </article>
        <article className="rounded-lg border border-white/10 bg-white/[0.03] p-5 md:col-span-2">
          <h2 className="text-base font-medium text-neon-cyan">NeonKey</h2>
          <code className="mt-3 block overflow-x-auto rounded border border-white/10 bg-black/40 p-3 text-neon-green">
            {license.key}
          </code>
          <p className="mt-3 text-sm text-white/60">
            The CLI uses this key to verify Pro status on launch.
          </p>
        </article>
      </section>
      <section className="mt-4 grid gap-4 md:grid-cols-[0.95fr_1.05fr]">
        <article className="rounded-lg border border-white/10 bg-white/[0.03] p-5">
          <h2 className="text-base font-medium text-neon-pink">
            Install the coder
          </h2>
          <p className="mt-3 text-sm text-white/60">
            Run these in your terminal after publishing the package or serving
            the install script.
          </p>
          <code className="mt-4 block overflow-x-auto rounded border border-white/10 bg-black/40 p-3 text-sm text-neon-cyan">
            {installCommand}
          </code>
          <code className="mt-3 block overflow-x-auto rounded border border-white/10 bg-black/40 p-3 text-sm text-neon-green">
            {initCommand}
          </code>
        </article>
        <SettingsForm
          initialCloudSync={settings.cloud_sync_enabled}
          initialProvider={settings.default_provider}
          initialRules={settings.rules}
        />
      </section>
      <section className="mt-4">
        <ProviderKeyForm />
      </section>
    </main>
  );
}
