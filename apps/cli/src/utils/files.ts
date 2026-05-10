import { readdir } from "node:fs/promises";
import { join } from "node:path";

const IGNORED = new Set([
  ".git",
  "node_modules",
  ".next",
  "dist",
  "build",
  "coverage",
  ".turbo"
]);

export async function listSourceFiles(root: string): Promise<string[]> {
  const output: string[] = [];

  async function walk(dir: string): Promise<void> {
    const entries = await readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      if (IGNORED.has(entry.name)) {
        continue;
      }

      const fullPath = join(dir, entry.name);
      if (entry.isDirectory()) {
        await walk(fullPath);
      } else if (/\.(tsx?|jsx?)$/.test(entry.name)) {
        output.push(fullPath);
      }
    }
  }

  await walk(root);
  return output;
}
