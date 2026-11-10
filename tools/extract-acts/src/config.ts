import type { AzureOpenAIConfig, OpenAIConfig, ProviderType } from "./types.js";

export interface CliOptions {
  provider: ProviderType;
  filePath?: string;
  format: "markdown" | "json";
  openai?: OpenAIConfig;
  azure?: AzureOpenAIConfig;
  help?: boolean;
  version?: boolean;
}

/**
 * Resolves CLI arguments and environment variables into application configuration.
 * Precedence: Command line flag -> Environment variable -> Default value.
 */
export function parseArgs(args: string[]): CliOptions {
  const options: CliOptions = {
    provider: "azure", // Default to azure if azure env is present, or fallback to openai
    format: "markdown",
  };

  let azureKeys: string[] = [];
  let azureResource = process.env.AZURE_OPENAI_RESOURCE;
  let azureEndpoint = process.env.AZURE_OPENAI_ENDPOINT;
  let azureDeployment = process.env.AZURE_OPENAI_DEPLOYMENT;
  let azureApiVersion = process.env.AZURE_OPENAI_API_VERSION;

  // Read Azure keys from env: AZURE_OPENAI_API_KEYS (comma-separated) or AZURE_OPENAI_API_KEY
  if (process.env.AZURE_OPENAI_API_KEYS) {
    azureKeys = process.env.AZURE_OPENAI_API_KEYS.split(",")
      .map((k) => k.trim())
      .filter(Boolean);
  } else if (process.env.AZURE_OPENAI_API_KEY) {
    azureKeys = [process.env.AZURE_OPENAI_API_KEY.trim()];
  }

  let openaiKey = process.env.OPENAI_API_KEY;
  let openaiModel = process.env.OPENAI_MODEL;
  let openaiBaseUrl = process.env.OPENAI_BASE_URL;

  let explicitProvider: ProviderType | undefined;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (!arg) continue;

    if (arg === "--help" || arg === "-h") {
      options.help = true;
      return options;
    }

    if (arg === "--version" || arg === "-v") {
      options.version = true;
      return options;
    }

    if (arg === "--provider" || arg === "-p") {
      const val = args[++i];
      if (val === "openai" || val === "azure") {
        explicitProvider = val;
      } else {
        throw new Error(`Invalid provider: ${val}. Supported: openai, azure`);
      }
    } else if (arg === "--format" || arg === "-f") {
      const val = args[++i];
      if (val === "markdown" || val === "json") {
        options.format = val;
      } else {
        throw new Error(`Invalid format: ${val}. Supported: markdown, json`);
      }
    } else if (arg === "--json") {
      options.format = "json";
    } else if (arg === "--azure-keys" || arg === "--azure-key") {
      const val = args[++i];
      if (val) {
        azureKeys = val
          .split(",")
          .map((k) => k.trim())
          .filter(Boolean);
      }
    } else if (arg === "--azure-resource") {
      azureResource = args[++i];
    } else if (arg === "--azure-endpoint") {
      azureEndpoint = args[++i];
    } else if (arg === "--azure-deployment") {
      azureDeployment = args[++i];
    } else if (arg === "--azure-api-version") {
      azureApiVersion = args[++i];
    } else if (arg === "--openai-key") {
      openaiKey = args[++i];
    } else if (arg === "--openai-model" || arg === "--model" || arg === "-m") {
      const val = args[++i];
      openaiModel = val;
    } else if (arg === "--openai-base-url") {
      openaiBaseUrl = args[++i];
    } else if (!arg.startsWith("-")) {
      options.filePath = arg;
    } else {
      throw new Error(`Unknown option: ${arg}. Run with --help for usage.`);
    }
  }

  // Determine provider if not explicitly set
  if (explicitProvider) {
    options.provider = explicitProvider;
  } else if (azureDeployment || azureResource || azureEndpoint || azureKeys.length > 0) {
    options.provider = "azure";
  } else if (openaiKey) {
    options.provider = "openai";
  } else {
    options.provider = "azure";
  }

  if (azureKeys.length > 0 || azureDeployment || azureResource || azureEndpoint) {
    options.azure = {
      apiKeys: azureKeys,
      resourceName: azureResource,
      endpoint: azureEndpoint,
      deploymentName: azureDeployment ?? "",
      apiVersion: azureApiVersion,
    };
  }

  if (openaiKey) {
    options.openai = {
      apiKey: openaiKey,
      model: openaiModel,
      baseUrl: openaiBaseUrl,
    };
  }

  return options;
}

export function printHelp(): void {
  const helpText = `extract-acts - Turn meeting transcripts into checkable task lists.

USAGE:
  extract-acts [OPTIONS] [FILE]
  cat transcript.txt | extract-acts [OPTIONS]

PROVIDERS:
  --provider, -p <azure|openai>   LLM Provider to use (default: azure if configured, else openai)

AZURE OPENAI OPTIONS:
  --azure-keys <k1,k2,...>       One or more comma-separated Azure API keys (Key Rotation)
  --azure-resource <name>        Azure OpenAI resource name (e.g. "my-resource")
  --azure-endpoint <url>         Full endpoint URL (e.g. "https://my-res.openai.azure.com")
  --azure-deployment <name>      Deployment name in Azure OpenAI Studio
  --azure-api-version <version>  API version (default: 2024-02-15-preview)

OPENAI OPTIONS:
  --openai-key <key>             OpenAI API key
  --model, -m <model>            OpenAI model name (default: gpt-4o)
  --openai-base-url <url>        Custom OpenAI API base URL

FORMAT OPTIONS:
  --format, -f <markdown|json>   Output format (default: markdown)
  --json                         Shortcut for --format json

GENERAL:
  --help, -h                     Show this help message
  --version, -v                  Show version

ENVIRONMENT VARIABLES:
  AZURE_OPENAI_API_KEYS          Comma-separated list of Azure OpenAI API keys
  AZURE_OPENAI_API_KEY           Single Azure OpenAI API key
  AZURE_OPENAI_RESOURCE          Azure OpenAI resource name
  AZURE_OPENAI_ENDPOINT          Azure OpenAI endpoint URL
  AZURE_OPENAI_DEPLOYMENT        Azure OpenAI deployment name
  AZURE_OPENAI_API_VERSION       Azure OpenAI API version
  OPENAI_API_KEY                 OpenAI API Key
  OPENAI_MODEL                   OpenAI Model
`;
  process.stdout.write(helpText);
}
