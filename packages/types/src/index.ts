export type LicenseTier = "free" | "pro";

export interface LicenseVerificationResponse {
  valid: boolean;
  hasPro: boolean;
  tier: LicenseTier;
}
