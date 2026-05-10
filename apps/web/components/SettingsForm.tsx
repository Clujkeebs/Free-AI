"use client";

import { useState, useTransition } from "react";

const providers = ["ollama", "anthropic", "openai", "groq", "deepseek", "google"];

export function SettingsForm({
  initialProvider,
  initialRules,
  initialCloudSync
}: {
  initialProvider: string;
  initialRules: string;
  initialCloudSync: boolean;
}) {
  const [provider, setProvider] = useState(initialProvider);
  const [rules, setRules] = useState(initialRules);
  const [cloudSync, setCloudSync] = useState(initialCloudSync);
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();

  function save() {
    setMessage("");
    startTransition(async () => {
      const response = await fetch("/api/settings/sync", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          defaultProvider: provider,
          rules,
          cloudSyncEnabled: cloudSync
        })
      });
      const data = (await response.json()) as { error?: string };
      setMessage(response.ok ? "Settings saved." : data.error ?? "Save failed.");
    });
  }

  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.03] p-5">
      <h2 className="text-base font-medium text-neon-green">Agent Settings</h2>
      <label className="mt-4 block text-sm text-white/70">
        Default provider
        <select
          className="mt-2 w-full rounded border border-white/10 bg-black/40 px-3 py-2 text-white"
          onChange={(event) => setProvider(event.target.value)}
          value={provider}
        >
          {providers.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>
      </label>
      <label className="mt-4 flex items-center gap-3 text-sm text-white/70">
        <input
          checked={cloudSync}
          onChange={(event) => setCloudSync(event.target.checked)}
          type="checkbox"
        />
        Enable Cloud-Sync for this workspace
      </label>
      <label className="mt-4 block text-sm text-white/70">
        Agent rules
        <textarea
          className="mt-2 min-h-36 w-full rounded border border-white/10 bg-black/40 px-3 py-2 font-mono text-sm text-white"
          onChange={(event) => setRules(event.target.value)}
          value={rules}
        />
      </label>
      <button
        className="mt-4 rounded bg-neon-cyan px-4 py-2 text-sm font-medium text-black disabled:opacity-50"
        disabled={pending}
        onClick={save}
        type="button"
      >
        {pending ? "Saving..." : "Save settings"}
      </button>
      {message ? <p className="mt-3 text-sm text-neon-cyan">{message}</p> : null}
    </div>
  );
}
