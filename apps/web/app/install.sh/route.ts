export async function GET() {
  const script = `#!/usr/bin/env bash
set -euo pipefail

if ! command -v node >/dev/null 2>&1; then
  echo "Node.js 20+ is required before installing NeonForge."
  exit 1
fi

if ! command -v npm >/dev/null 2>&1; then
  echo "npm is required before installing NeonForge."
  exit 1
fi

npm install -g @neonforge/cli

echo
echo "NeonForge installed."
echo "Run: neonforge init --hub https://neonforge.app --license YOUR_NEONKEY"
`;

  return new Response(script, {
    headers: {
      "content-type": "text/x-shellscript; charset=utf-8",
      "cache-control": "no-store"
    }
  });
}
