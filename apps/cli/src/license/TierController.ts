import chalk from "chalk";
import type { LicenseTier } from "../types.js";

const neonPink = "#FF00E5";
const neonGreen = "#00FF9D";
const cyan = "#00E5FF";

export class TierController {
  private fileEdits = 0;

  constructor(private readonly tier: LicenseTier = "free") {}

  get currentTier(): LicenseTier {
    return this.tier;
  }

  canUseSwarmMode(): boolean {
    return this.tier === "pro";
  }

  canUseDeepSearch(): boolean {
    return this.tier === "pro";
  }

  canUseCloudSync(): boolean {
    return this.tier === "pro";
  }

  assertAgentCapacity(activeAgents: number): void {
    if (this.tier === "free" && activeAgents >= 1) {
      throw new Error(this.upsell("Swarm Mode unlocks multiple active agents."));
    }
  }

  recordFileEdit(): void {
    this.fileEdits += 1;

    if (this.tier === "free" && this.fileEdits > 5) {
      throw new Error(
        this.upsell("Pro unlocks unlimited file edits per agent session.")
      );
    }
  }

  assertPro(feature: "Swarm Mode" | "Deep-Search" | "Cloud-Sync"): void {
    if (this.tier === "pro") {
      return;
    }

    throw new Error(this.upsell(`${feature} is a NeonForge Pro capability.`));
  }

  private upsell(reason: string): string {
    return [
      "",
      chalk.hex(neonPink)("╔════════════════════════════════════════════╗"),
      chalk.hex(neonPink)("║") +
        chalk.hex(neonGreen)("      NEONFORGE PRO ACCESS REQUIRED       ") +
        chalk.hex(neonPink)("║"),
      chalk.hex(neonPink)("╚════════════════════════════════════════════╝"),
      chalk.hex(cyan)(reason),
      chalk.white("Upgrade: https://neonforge.app/checkout"),
      ""
    ].join("\n");
  }
}
