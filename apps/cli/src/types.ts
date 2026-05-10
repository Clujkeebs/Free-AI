import type { LanguageModelV1 } from "@ai-sdk/provider";

export type ProviderName =
  | "ollama"
  | "anthropic"
  | "openai"
  | "groq"
  | "deepseek"
  | "google";

export type LicenseTier = "free" | "pro";

export interface ProviderConfig {
  apiKey?: string;
  baseURL?: string;
  model?: string;
}

export interface NeonForgeConfig {
  defaultProvider?: ProviderName;
  licenseKey?: string;
  hubUrl?: string;
  providers?: Partial<Record<ProviderName, ProviderConfig>>;
  local?: {
    preferredModel?: string;
    lowMemoryModel?: string;
  };
}

export interface ProviderSelection {
  name: ProviderName;
  modelId: string;
  model: LanguageModelV1;
  local: boolean;
}

export interface ContextSymbol {
  name: string;
  kind: "function" | "class" | "type" | "interface" | "export" | "variable";
  file: string;
  line: number;
}

export interface ContextMap {
  root: string;
  generatedAt: string;
  files: Array<{
    path: string;
    language: string;
    symbols: ContextSymbol[];
  }>;
}
