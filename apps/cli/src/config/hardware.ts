import { totalmem } from "node:os";

const GIB = 1024 ** 3;

export interface HardwareProfile {
  totalMemoryGb: number;
  lowMemory: boolean;
  recommendedOllamaModel: string;
  note: string;
}

export function detectHardwareProfile(): HardwareProfile {
  const totalMemoryGb = Math.round((totalmem() / GIB) * 10) / 10;
  const lowMemory = totalMemoryGb < 16;

  return {
    totalMemoryGb,
    lowMemory,
    recommendedOllamaModel: lowMemory
      ? "qwen2.5-coder:14b-instruct-q4_K_M"
      : "qwen2.5-coder:32b-instruct-q4_K_M",
    note: lowMemory
      ? "Low-memory profile detected; using 4-bit local coding model."
      : "Apple Silicon profile detected; using higher-capacity local coding model."
  };
}
