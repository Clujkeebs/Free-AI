import type { LicenseTier } from "../types.js";

export interface LicenseStatus {
  tier: LicenseTier;
  hasPro: boolean;
  checkedAt: string;
  source: "hub" | "local";
}

export async function verifyLicense(input: {
  licenseKey?: string;
  hubUrl?: string;
}): Promise<LicenseStatus> {
  if (!input.licenseKey) {
    return freeStatus("local");
  }

  const hubUrl = input.hubUrl ?? "https://neonforge.app";
  const verifyUrl = new URL("/api/v1/verify", hubUrl);

  try {
    const response = await fetch(verifyUrl, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ licenseKey: input.licenseKey })
    });

    if (!response.ok) {
      return freeStatus("hub");
    }

    const data = (await response.json()) as { hasPro?: boolean; tier?: string };
    const hasPro = data.hasPro === true || data.tier === "pro";

    return {
      tier: hasPro ? "pro" : "free",
      hasPro,
      checkedAt: new Date().toISOString(),
      source: "hub"
    };
  } catch {
    return freeStatus("local");
  }
}

function freeStatus(source: "hub" | "local"): LicenseStatus {
  return {
    tier: "free",
    hasPro: false,
    checkedAt: new Date().toISOString(),
    source
  };
}
