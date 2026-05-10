"use client";

import { useState, useTransition } from "react";

const providers = ["anthropic", "openai", "groq", "deepseek", "google"];

export function ProviderKeyForm() {
  const [provider, setProvider] = useState("anthropic");
  const [apiKey, setApiKey] = useState("");
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();

  function save() {
    setMessage("");
    startTransition(async () => {
      const response = await fetch("/api/provider-keys", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ provider, apiKey })
      });
      const data = (await response.json()) as { error?: string };
      setApiKey("");
      setMessage(
        response.ok ? "Key encrypted in Supabase Vault." : data.error ?? "Save failed."
      );
    });
  }

  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.03] p-5">
      <h2 className="text-base font-medium text-neon-cyan">Provider Vault</h2>
      <label className="mt-4 block text-sm text-white/70">
        Provider
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
      <label className="mt-4 block text-sm text-white/70">
        API key
        <input
          className="mt-2 w-full rounded border border-white/10 bg-black/40 px-3 py-2 text-white"
          onChange={(event) => setApiKey(event.target.value)}
          type="password"
          value={apiKey}
        />
      </label>
      <button
        className="mt-4 rounded bg-neon-green px-4 py-2 text-sm font-medium text-black disabled:opacity-50"
        disabled={pending || apiKey.length < 8}
        onClick={save}
        type="button"
      >
        {pending ? "Encrypting..." : "Save encrypted key"}
      </button>
      {message ? <p className="mt-3 text-sm text-neon-cyan">{message}</p> : null}
    </div>
  );
}
