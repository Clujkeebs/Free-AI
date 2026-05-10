import { createAnthropic } from "@ai-sdk/anthropic";
import { createDeepSeek } from "@ai-sdk/deepseek";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createGroq } from "@ai-sdk/groq";
import { createOpenAI } from "@ai-sdk/openai";
import type { LanguageModelV1 } from "@ai-sdk/provider";
import { generateText, type CoreMessage } from "ai";
import { createOllama } from "ollama-ai-provider";
import { detectHardwareProfile } from "../config/hardware.js";
import { loadConfig } from "../config/loadConfig.js";
import type {
  NeonForgeConfig,
  ProviderConfig,
  ProviderName,
  ProviderSelection
} from "../types.js";

const CLOUD_DEFAULT_MODELS: Record<Exclude<ProviderName, "ollama">, string> = {
  anthropic: "claude-3-5-sonnet-latest",
  openai: "gpt-4.1",
  groq: "llama-3.3-70b-versatile",
  deepseek: "deepseek-chat",
  google: "gemini-2.0-flash"
};

export class ProviderEngine {
  private config: NeonForgeConfig;
  private selection?: ProviderSelection;

  private constructor(config: NeonForgeConfig) {
    this.config = config;
  }

  static async create(): Promise<ProviderEngine> {
    const config = await loadConfig();
    const engine = new ProviderEngine(config);
    engine.selection = engine.selectProvider(config.defaultProvider);
    return engine;
  }

  current(): ProviderSelection {
    if (!this.selection) {
      this.selection = this.selectProvider(this.config.defaultProvider);
    }

    return this.selection;
  }

  hotSwap(provider: ProviderName): ProviderSelection {
    this.selection = this.selectProvider(provider);
    return this.selection;
  }

  async reload(): Promise<ProviderSelection> {
    this.config = await loadConfig();
    this.selection = this.selectProvider(this.config.defaultProvider);
    return this.selection;
  }

  async complete(input: {
    prompt?: string;
    messages?: CoreMessage[];
    system?: string;
    temperature?: number;
  }): Promise<string> {
    const selected = this.current();
    const result = await generateText({
      model: selected.model,
      prompt: input.prompt,
      messages: input.messages,
      system: input.system,
      temperature: input.temperature ?? 0.2
    });

    return result.text;
  }

  private selectProvider(preferred?: ProviderName): ProviderSelection {
    const ordered = this.providerOrder(preferred);

    for (const name of ordered) {
      const providerConfig = this.config.providers?.[name];
      if (name === "ollama") {
        return this.createOllamaSelection(providerConfig);
      }

      if (providerConfig?.apiKey) {
        return this.createCloudSelection(name, providerConfig);
      }
    }

    return this.createOllamaSelection(this.config.providers?.ollama);
  }

  private providerOrder(preferred?: ProviderName): ProviderName[] {
    const base: ProviderName[] = [
      "anthropic",
      "openai",
      "groq",
      "deepseek",
      "google",
      "ollama"
    ];

    if (!preferred) {
      return base;
    }

    return [preferred, ...base.filter((name) => name !== preferred)];
  }

  private createOllamaSelection(config?: ProviderConfig): ProviderSelection {
    const hardware = detectHardwareProfile();
    const ollama = createOllama({
      baseURL: config?.baseURL ?? "http://localhost:11434/api"
    });
    const modelId =
      config?.model ??
      this.config.local?.preferredModel ??
      hardware.recommendedOllamaModel;

    return {
      name: "ollama",
      modelId,
      model: ollama(modelId) as LanguageModelV1,
      local: true
    };
  }

  private createCloudSelection(
    name: Exclude<ProviderName, "ollama">,
    config: ProviderConfig
  ): ProviderSelection {
    const modelId = config.model ?? CLOUD_DEFAULT_MODELS[name];
    const model = this.createCloudModel(name, config, modelId);

    return {
      name,
      modelId,
      model,
      local: false
    };
  }

  private createCloudModel(
    name: Exclude<ProviderName, "ollama">,
    config: ProviderConfig,
    modelId: string
  ): LanguageModelV1 {
    switch (name) {
      case "anthropic":
        return createAnthropic({
          apiKey: config.apiKey,
          baseURL: config.baseURL
        })(modelId) as LanguageModelV1;
      case "openai":
        return createOpenAI({
          apiKey: config.apiKey,
          baseURL: config.baseURL
        })(modelId) as LanguageModelV1;
      case "groq":
        return createGroq({
          apiKey: config.apiKey,
          baseURL: config.baseURL
        })(modelId) as LanguageModelV1;
      case "deepseek":
        return createDeepSeek({
          apiKey: config.apiKey,
          baseURL: config.baseURL
        })(modelId) as LanguageModelV1;
      case "google":
        return createGoogleGenerativeAI({
          apiKey: config.apiKey,
          baseURL: config.baseURL
        })(modelId) as LanguageModelV1;
    }
  }
}
