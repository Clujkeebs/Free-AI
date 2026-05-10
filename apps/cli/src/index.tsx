#!/usr/bin/env node
import { writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import chalk from "chalk";
import { Command } from "commander";
import { render } from "ink";
import React from "react";
import { detectHardwareProfile } from "./config/hardware.js";
import { configPath, loadConfig, saveConfig } from "./config/loadConfig.js";
import { ProviderEngine } from "./engine/ProviderEngine.js";
import { LocalCodingAgent, printAgentPlan } from "./engine/LocalCodingAgent.js";
import { TierController } from "./license/TierController.js";
import { verifyLicense } from "./license/verifyLicense.js";
import { RepoMapper } from "./repo/RepoMapper.js";
import { Splash } from "./tui/Splash.js";
import type { ProviderName } from "./types.js";
import { listSourceFiles } from "./utils/files.js";

const green = "#00FF9D";
const pink = "#FF00E5";
const cyan = "#00E5FF";

const program = new Command();

program
  .name("neonforge")
  .alias("nf")
  .description("Local-first AI coding agent with cloud-hybrid provider routing.")
  .version("0.1.0");

program
  .command("init")
  .description("Connect the local CLI to your NeonForge Hub account.")
  .requiredOption("--license <key>", "32-character NeonKey from the hub")
  .option("--hub <url>", "Hub URL", "https://neonforge.app")
  .option("--provider <name>", "Default provider", "ollama")
  .action(async (options: { license: string; hub: string; provider: string }) => {
    const provider = parseProviderName(options.provider);
    const existing = await loadConfig();
    await saveConfig({
      ...existing,
      hubUrl: options.hub,
      licenseKey: options.license,
      defaultProvider: provider,
      providers: existing.providers ?? {}
    });

    const license = await verifyLicense({
      licenseKey: options.license,
      hubUrl: options.hub
    });
    console.log(chalk.hex(green)(`NeonForge config saved: ${configPath}`));
    console.log(chalk.hex(cyan)(`Tier: ${license.tier.toUpperCase()}`));
  });

program
  .command("key")
  .description("Store a local provider API key in ~/.neonforge/config.json.")
  .requiredOption("--provider <name>", "Provider name")
  .requiredOption("--api-key <key>", "Provider API key")
  .option("--model <model>", "Default model for this provider")
  .action(
    async (options: { provider: string; apiKey: string; model?: string }) => {
      const provider = parseProviderName(options.provider);
      if (provider === "ollama") {
        throw new Error("Ollama does not need an API key.");
      }

      const config = await loadConfig();
      await saveConfig({
        ...config,
        defaultProvider: provider,
        providers: {
          ...config.providers,
          [provider]: {
            ...config.providers?.[provider],
            apiKey: options.apiKey,
            model: options.model ?? config.providers?.[provider]?.model
          }
        }
      });

      console.log(chalk.hex(green)(`Saved ${provider} key to ${configPath}`));
    }
  );

program
  .command("status")
  .description("Show local provider, hardware, config, and license status.")
  .action(async () => {
    const context = await boot(false);
    const current = context.provider.current();
    console.log(chalk.hex(cyan)(`config=${configPath}`));
    console.log(chalk.hex(cyan)(`hub=${context.config.hubUrl ?? "https://neonforge.app"}`));
    console.log(chalk.hex(green)(`provider=${current.name}`));
    console.log(chalk.hex(green)(`model=${current.modelId}`));
    console.log(chalk.hex(pink)(`tier=${context.license.tier}`));
    console.log(
      chalk.hex(cyan)(`memory=${context.hardware.totalMemoryGb}GB`)
    );
  });

program
  .command("doctor")
  .description("Check local tools needed for free local coding.")
  .action(async () => {
    const checks = [
      ["node", process.version],
      ["config", configPath],
      ["ollama", "run `ollama serve` and `ollama pull qwen2.5-coder:14b-instruct-q4_K_M` if missing"]
    ];

    for (const [name, detail] of checks) {
      console.log(chalk.hex(cyan)(`${name}=`) + detail);
    }

    const context = await boot(false);
    const current = context.provider.current();
    console.log(chalk.hex(green)(`selected=${current.name}/${current.modelId}`));
  });

program
  .command("agent")
  .argument("<prompt...>", "Coding task for the local/free agent")
  .option("--apply", "Apply the proposed file edits")
  .option("--root <path>", "Repository root", process.cwd())
  .description("Free local coding agent: plan changes and optionally apply them.")
  .action(
    async (
      promptParts: string[],
      options: { apply?: boolean; root: string }
    ) => {
      const context = await boot();
      const tier = new TierController(context.license.tier);
      const agent = new LocalCodingAgent(
        context.provider,
        tier,
        resolve(options.root)
      );
      const plan = await agent.plan(promptParts.join(" "));
      printAgentPlan(plan);

      if (!options.apply) {
        console.log(
          chalk.hex(cyan)("dry-run:: rerun with --apply to write these files")
        );
        return;
      }

      await agent.apply(plan);
    }
  );

program
  .command("sync")
  .description("Pull Pro Cloud-Sync agent rules from the NeonForge Hub.")
  .action(async () => {
    const config = await loadConfig();
    if (!config.licenseKey) {
      throw new Error("Run neonforge init --license YOUR_NEONKEY first.");
    }

    const hubUrl = config.hubUrl ?? "https://neonforge.app";
    const syncUrl = new URL("/api/settings/sync", hubUrl);
    const response = await fetch(syncUrl, {
      headers: {
        "x-neonforge-license": config.licenseKey
      }
    });
    const data = (await response.json()) as {
      tier?: string;
      cloudSyncEnabled?: boolean;
      settings?: { defaultProvider?: ProviderName; rules?: string } | null;
      error?: string;
    };

    if (!response.ok) {
      throw new Error(data.error ?? "Cloud-Sync failed.");
    }

    if (!data.cloudSyncEnabled || !data.settings) {
      console.log(
        chalk.hex(pink)(
          "Cloud-Sync is disabled or unavailable for this license."
        )
      );
      return;
    }

    await saveConfig({
      ...config,
      defaultProvider: data.settings.defaultProvider ?? config.defaultProvider,
      providers: config.providers ?? {}
    });

    console.log(chalk.hex(green)("Cloud-Sync complete."));
    if (data.settings.rules) {
      console.log(chalk.hex(cyan)("Remote rules:"));
      console.log(data.settings.rules);
    }
  });

program
  .command("splash")
  .description("Render the NeonForge terminal splash screen.")
  .action(async () => {
    const context = await boot(false);
    const app = render(
      <Splash
        provider={context.provider.current()}
        license={context.license}
        hardware={context.hardware}
      />
    );
    app.unmount();
  });

program
  .command("providers")
  .description("Show the selected provider and model.")
  .action(async () => {
    const context = await boot(false);
    const current = context.provider.current();
    console.log(chalk.hex(cyan)(`provider=${current.name}`));
    console.log(chalk.hex(green)(`model=${current.modelId}`));
    console.log(chalk.hex(pink)(`local=${String(current.local)}`));
  });

program
  .command("map")
  .argument("[root]", "Repository root", process.cwd())
  .option("-o, --out <path>", "Write context map JSON to a file")
  .description("Generate a lightweight Tree-Sitter context map.")
  .action(async (root: string, options: { out?: string }) => {
    await boot(false);
    const repoRoot = resolve(root);
    const files = await listSourceFiles(repoRoot);
    const mapper = new RepoMapper(repoRoot);
    const contextMap = await mapper.map(files);
    const json = mapper.summarize(contextMap);

    if (options.out) {
      await writeFile(resolve(options.out), `${json}\n`, "utf8");
      console.log(chalk.hex(cyan)(`Context map written to ${options.out}`));
      return;
    }

    console.log(json);
  });

program
  .command("chat")
  .argument("<prompt...>", "Prompt to send to the selected model")
  .option("--provider <name>", "Hot-swap provider for this request")
  .description("Send a coding prompt through the Omni-Brain provider engine.")
  .action(async (promptParts: string[], options: { provider?: string }) => {
    const context = await boot();
    if (options.provider) {
      context.provider.hotSwap(parseProviderName(options.provider));
    }

    const current = context.provider.current();
    console.log(
      chalk.hex(pink)(`thought:: routing to ${current.name}/${current.modelId}`)
    );

    const text = await context.provider.complete({
      system:
        "You are NeonForge, a pragmatic senior coding agent. Be concise and actionable.",
      prompt: promptParts.join(" ")
    });
    console.log(chalk.hex(green)(text));
  });

program
  .command("swarm")
  .description("Start multi-agent orchestration. Requires Pro.")
  .action(async () => {
    const context = await boot();
    const tier = new TierController(context.license.tier);
    tier.assertPro("Swarm Mode");
    console.log(chalk.hex(green)("Swarm Mode armed."));
  });

program.parseAsync(process.argv);

async function boot(showSplash = true) {
  const [config, provider] = await Promise.all([
    loadConfig(),
    ProviderEngine.create()
  ]);
  const [license, hardware] = await Promise.all([
    verifyLicense({ licenseKey: config.licenseKey, hubUrl: config.hubUrl }),
    Promise.resolve(detectHardwareProfile())
  ]);

  if (showSplash) {
    const app = render(
      <Splash provider={provider.current()} license={license} hardware={hardware} />
    );
    app.unmount();
  }

  return { config, provider, license, hardware };
}

function parseProviderName(value: string): ProviderName {
  const providers: ProviderName[] = [
    "ollama",
    "anthropic",
    "openai",
    "groq",
    "deepseek",
    "google"
  ];

  if (providers.includes(value as ProviderName)) {
    return value as ProviderName;
  }

  throw new Error(`Unknown provider "${value}".`);
}
