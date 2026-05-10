import Link from "next/link";

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col px-6 py-8">
      <nav className="flex items-center justify-between border-b border-white/10 pb-4">
        <div className="text-lg font-semibold tracking-[0.18em] text-neon-green">
          NEONFORGE
        </div>
        <Link
          href="/login"
          className="rounded border border-neon-cyan/50 px-3 py-2 text-sm text-neon-cyan"
        >
          Sign in
        </Link>
      </nav>
      <section className="grid flex-1 content-center gap-8 py-12 md:grid-cols-[1.1fr_0.9fr] md:items-center">
        <div>
          <h1 className="max-w-3xl text-5xl font-semibold leading-tight text-white md:text-7xl">
            NeonForge
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-white/72">
            Local-first AI coding with encrypted cloud settings, license sync,
            and team-ready agent controls.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/login"
              className="rounded bg-neon-green px-4 py-2 text-sm font-medium text-black"
            >
              Open Hub
            </Link>
            <code className="rounded border border-white/10 bg-black/40 px-4 py-2 text-sm text-neon-cyan">
              curl -fsSL /install.sh | bash
            </code>
          </div>
        </div>
        <div className="rounded-lg border border-white/10 bg-white/[0.03] p-5 shadow-2xl shadow-neon-cyan/10">
          <div className="mb-4 text-sm text-neon-pink">Control plane</div>
          <div className="space-y-3 text-sm text-white/75">
            <div className="flex justify-between border-b border-white/10 pb-3">
              <span>License verify API</span>
              <span className="text-neon-green">ready</span>
            </div>
            <div className="flex justify-between border-b border-white/10 pb-3">
              <span>Vault-backed API keys</span>
              <span className="text-neon-cyan">schema</span>
            </div>
            <div className="flex justify-between">
              <span>Stripe subscription sync</span>
              <span className="text-neon-pink">webhook</span>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
