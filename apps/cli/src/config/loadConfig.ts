import { mkdir, readFile, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { dirname, join } from "node:path";
import { z } from "zod";
import type { NeonForgeConfig } from "../types.js";

const providerNameSchema = z.enum([
  "ollama",
  "anthropic",
  "openai",
  "groq",
  "deepseek",
  "google"
]);

const configSchema = z.object({
  defaultProvider: providerNameSchema.optional(),
  licenseKey: z.string().optional(),
  hubUrl: z.string().url().optional(),
  providers: z
    .record(
      providerNameSchema,
      z.object({
        apiKey: z.string().optional(),
        baseURL: z.string().url().optional(),
        model: z.string().optional()
      })
    )
    .optional(),
  local: z
    .object({
      preferredModel: z.string().optional(),
      lowMemoryModel: z.string().optional()
    })
    .optional()
});

export const configPath = join(homedir(), ".neonforge", "config.json");

export async function loadConfig(): Promise<NeonForgeConfig> {
  try {
    const raw = await readFile(configPath, "utf8");
    return configSchema.parse(JSON.parse(raw));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return {};
    }

    throw new Error(
      `Failed to read ${configPath}: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}

export async function saveConfig(config: NeonForgeConfig): Promise<void> {
  await mkdir(dirname(configPath), { recursive: true });
  await writeFile(configPath, `${JSON.stringify(config, null, 2)}\n`, "utf8");
}
