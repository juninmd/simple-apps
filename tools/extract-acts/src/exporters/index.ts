import type { ProviderType, TaskExporter } from "../types.js";
import { AsanaExporter } from "./asana.js";
import { GitHubExporter } from "./github.js";
import { JiraExporter } from "./jira.js";

export function createExporter(provider: ProviderType, config: unknown): TaskExporter {
  switch (provider) {
    case "github":
      return new GitHubExporter(config);
    case "jira":
      return new JiraExporter(config);
    case "asana":
      return new AsanaExporter(config);
    default: {
      const exhaustiveCheck: never = provider;
      throw new Error(`Unsupported exporter provider: ${exhaustiveCheck}`);
    }
  }
}

export { GitHubExporter, JiraExporter, AsanaExporter };
