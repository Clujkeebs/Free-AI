"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function AuthForm() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function submit() {
    setMessage("");
    startTransition(async () => {
      const supabase = createSupabaseBrowserClient();
      const result =
        mode === "signin"
          ? await supabase.auth.signInWithPassword({ email, password })
          : await supabase.auth.signUp({
              email,
              password,
              options: {
                emailRedirectTo: `${window.location.origin}/auth/callback`
              }
            });

      if (result.error) {
        setMessage(result.error.message);
        return;
      }

      if (mode === "signup" && !result.data.session) {
        setMessage("Check your email to confirm your NeonForge account.");
        return;
      }

      router.replace("/dashboard");
      router.refresh();
    });
  }

  return (
    <div className="w-full max-w-md rounded-lg border border-white/10 bg-white/[0.04] p-6">
      <div className="mb-5 flex rounded border border-white/10 p-1 text-sm">
        <button
          className={`flex-1 rounded px-3 py-2 ${
            mode === "signin" ? "bg-neon-cyan text-black" : "text-white/70"
          }`}
          onClick={() => setMode("signin")}
          type="button"
        >
          Sign in
        </button>
        <button
          className={`flex-1 rounded px-3 py-2 ${
            mode === "signup" ? "bg-neon-green text-black" : "text-white/70"
          }`}
          onClick={() => setMode("signup")}
          type="button"
        >
          Create account
        </button>
      </div>
      <label className="block text-sm text-white/70">
        Email
        <input
          className="mt-2 w-full rounded border border-white/10 bg-black/30 px-3 py-2 text-white outline-none focus:border-neon-cyan"
          onChange={(event) => setEmail(event.target.value)}
          type="email"
          value={email}
        />
      </label>
      <label className="mt-4 block text-sm text-white/70">
        Password
        <input
          className="mt-2 w-full rounded border border-white/10 bg-black/30 px-3 py-2 text-white outline-none focus:border-neon-cyan"
          minLength={6}
          onChange={(event) => setPassword(event.target.value)}
          type="password"
          value={password}
        />
      </label>
      <button
        className="mt-5 w-full rounded bg-neon-green px-4 py-2 font-medium text-black disabled:cursor-not-allowed disabled:opacity-50"
        disabled={pending || !email || password.length < 6}
        onClick={submit}
        type="button"
      >
        {pending ? "Working..." : mode === "signin" ? "Sign in" : "Create account"}
      </button>
      {message ? <p className="mt-4 text-sm text-neon-pink">{message}</p> : null}
    </div>
  );
}
