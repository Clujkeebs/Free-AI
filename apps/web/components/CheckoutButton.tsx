"use client";

import { useState } from "react";

export function CheckoutButton({ disabled }: { disabled?: boolean }) {
  const [pending, setPending] = useState(false);

  async function checkout() {
    setPending(true);
    const response = await fetch("/api/checkout", { method: "POST" });
    const data = (await response.json()) as { url?: string; error?: string };
    setPending(false);

    if (data.url) {
      window.location.href = data.url;
      return;
    }

    alert(data.error ?? "Unable to start checkout.");
  }

  return (
    <button
      className="rounded bg-neon-pink px-4 py-2 text-sm font-medium text-black disabled:cursor-not-allowed disabled:opacity-50"
      disabled={disabled || pending}
      onClick={checkout}
      type="button"
    >
      {pending ? "Opening Stripe..." : "Upgrade to Pro"}
    </button>
  );
}
