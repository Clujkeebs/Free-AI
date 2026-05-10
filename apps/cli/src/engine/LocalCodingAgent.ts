import { mkdir, writeFile } from "node:fs/promises";
import { dirname, relative, resolve } from "node:path";
import chalk from "chalk";
import { z } from "zod";
import type { TierController } from "../license/TierController.js";
import { RepoMapper } from "../repo/RepoMapper.js";
import { listSourceFiles } from "../utils/files.js";
import type { ProviderEngine } from "./ProviderEngine.js";

const green = "#00FF9D";
const pink = "#FF00E5";
const cyan = "#00E5FF";

const agentPlanSchema = z.object({
  summary: z.string(),
  changes: z
    .array(
      z.object({
        path: z.string(),
        action: z.enum(["create", "replace"]),
        content: z.string()
      })
    )
    .max(5),
  verify: z.array(z.string()).default([])
});

export type AgentPlan = z.infer<typeof agentPlanSchema>;

export class LocalCodingAgent {
  constructor(
    private readonly provider: ProviderEngine,
    private readonly tier: TierController,
    private readonly root = process.cwd()
  ) {}

  async plan(prompt: string): Promise<AgentPlan> {
    const files = await listSourceFiles(this.root);
    const mapper = new RepoMapper(this.root);
    const context = await mapper.map(files);
    const compactContext = JSON.stringify({
      root: context.root,
      files: context.files.slice(0, 80).map((file) => ({
        path: file.path,
        symbols: file.symbols.slice(0, 20)
      }))
    });

    const response = await this.provider.complete({
      system: [
        "You are NeonForge Free Coder, a local-first coding agent.",
        "Return only valid JSON with this shape:",
        '{"summary":"...","changes":[{"path":"relative/file.ts","action":"create|replace","content":"full file content"}],"verify":["npm run typecheck"]}',
        "Keep changes minimal. Maximum 5 file edits. Never use markdown fences."
      ].join("\n"),
      prompt: `Request:\n${prompt}\n\nContext map:\n${compactContext}`
    });

    return parseAgentPlan(response);
  }

  async apply(plan: AgentPlan): Promise<void> {
    for (const change of plan.changes) {
      this.tier.recordFileEdit();
      const target = resolve(this.root, change.path);
      const rel = relative(this.root, target);

      if (rel.startsWith("..")) {
        throw new Error(`Refusing to write outside repo: ${change.path}`);
      }

      await mkdir(dirname(target), { recursive: true });
      await writeFile(target, change.content, "utf8");
      console.log(chalk.hex(green)(`wrote ${change.path}`));
    }
  }
}

export function printAgentPlan(plan: AgentPlan): void {
  console.log(chalk.hex(pink)("plan:: ") + plan.summary);
  if (plan.changes.length === 0) {
    console.log(chalk.hex(cyan)("No file edits proposed."));
  }

  for (const change of plan.changes) {
    console.log(
      chalk.hex(cyan)(`${change.action} ${change.path}`) +
        chalk.white(` (${change.content.length} chars)`)
    );
  }

  if (plan.verify.length > 0) {
    console.log(chalk.hex(green)("verify:: ") + plan.verify.join(" && "));
  }
}

function parseAgentPlan(raw: string): AgentPlan {
  const json = extractJson(raw);
  const parsed = agentPlanSchema.safeParse(JSON.parse(json));

  if (!parsed.success) {
    throw new Error(`Model returned invalid plan: ${parsed.error.message}`);
  }

  return parsed.data;
}

function extractJson(raw: string): string {
  const trimmed = raw.trim();
  if (trimmed.startsWith("{")) {
    return trimmed;
  }

  const match = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (match?.[1]) {
    return match[1].trim();
  }

  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  if (start >= 0 && end > start) {
    return trimmed.slice(start, end + 1);
  }

  throw new Error("Model did not return JSON.");
}
