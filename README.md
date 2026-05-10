# NeonForge

NeonForge is an open-core AI coding ecosystem with a local-first TypeScript CLI agent and a SaaS hub for license, settings, and billing management.

## Apps

- `apps/cli`: Node.js CLI agent with Ollama-first provider routing, license gates, repo context mapping, and a neon Ink/Chalk TUI.
- `apps/web`: Next.js App Router dashboard and API surface for license verification.
- `supabase/migrations`: Supabase schema for profiles, license keys, settings, and Stripe subscription state.

## Quick Start

```bash
npm install
npm run typecheck
npm run cli -- chat "map this repo"
npm run web
```

## Install The Coder

After publishing `@neonforge/cli`, users install the coder from the hub:

```bash
curl -fsSL https://neonforge.app/install.sh | bash
```

For local development in this repo:

```bash
npm install
npm run build
npm --workspace @neonforge/cli link
neonforge init --hub http://localhost:3000 --license YOUR_32_CHAR_NEONKEY
```

Then check it:

```bash
neonforge status
neonforge doctor
neonforge agent "add a health check endpoint" --root .
neonforge map . --out .neonforge-context.json
neonforge key --provider anthropic --api-key sk-ant-...
neonforge sync
```

The free coding path is local-first: start Ollama, pull the recommended model,
and run the agent without any paid license:

```bash
ollama serve
ollama pull qwen2.5-coder:14b-instruct-q4_K_M
neonforge agent "make the README clearer" --root .
neonforge agent "make the README clearer" --root . --apply
```

## Hub Environment

Create `apps/web/.env.local`:

```bash
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
STRIPE_SECRET_KEY=...
STRIPE_WEBHOOK_SECRET=...
STRIPE_PRO_PRICE_ID=...
```

Create `~/.neonforge/config.json` to enable cloud providers:

```json
{
  "defaultProvider": "anthropic",
  "licenseKey": "YOUR_32_CHAR_NEONKEY",
  "providers": {
    "anthropic": {
      "apiKey": "sk-ant-...",
      "model": "claude-3-5-sonnet-latest"
    }
  }
}
```
