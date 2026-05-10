import { readFile, writeFile } from "node:fs/promises";
import { execa } from "execa";
import type { TierController } from "../license/TierController.js";
import type { ProviderEngine } from "./ProviderEngine.js";

export interface ExecutionStep {
  kind: "writeFile" | "runCommand";
  path?: string;
  content?: string;
  command?: string;
  args?: string[];
}

export class ExecutionLoop {
  constructor(
    private readonly provider: ProviderEngine,
    private readonly tier: TierController
  ) {}

  async plan(prompt: string, context: string): Promise<string> {
    return this.provider.complete({
      system:
        "You are NeonForge. Return a concise engineering plan with verification steps.",
      prompt: `User request:\n${prompt}\n\nRepo context:\n${context}`
    });
  }

  async execute(steps: ExecutionStep[]): Promise<string[]> {
    const results: string[] = [];

    for (const step of steps) {
      if (step.kind === "writeFile") {
        if (!step.path || step.content === undefined) {
          throw new Error("writeFile step requires path and content.");
        }

        this.tier.recordFileEdit();
        const before = await readFile(step.path, "utf8").catch(() => "");
        await writeFile(step.path, step.content, "utf8");
        results.push(
          `wrote ${step.path} (${before.length} -> ${step.content.length} bytes)`
        );
      }

      if (step.kind === "runCommand") {
        if (!step.command) {
          throw new Error("runCommand step requires command.");
        }

        const result = await execa(step.command, step.args ?? [], {
          reject: false
        });
        results.push(result.stdout || result.stderr || `exit ${result.exitCode}`);
      }
    }

    return results;
  }

  async verify(command = "npm", args = ["test"]): Promise<boolean> {
    const result = await execa(command, args, { reject: false });
    return result.exitCode === 0;
  }
}
