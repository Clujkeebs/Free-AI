"use client";

import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function SignOutButton() {
  const router = useRouter();

  async function signOut() {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  return (
    <button
      className="rounded border border-white/10 px-3 py-2 text-sm text-white/70 hover:border-neon-pink hover:text-neon-pink"
      onClick={signOut}
      type="button"
    >
      Sign out
    </button>
  );
}
