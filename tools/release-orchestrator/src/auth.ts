import { createAppAuth } from "@octokit/auth-app";
import { Octokit } from "@octokit/rest";
import { request as octokitRequest } from "@octokit/request";

export interface GitHubAppConfig {
  appId: string | number;
  privateKey: string;
  installationId: string | number;
  baseUrl?: string;
}

/**
 * Loads GitHub App configuration from environment variables.
 * Format for GITHUB_APP_PRIVATE_KEY allows multiline or \n escaped string.
 */
export function getGitHubAppConfigFromEnv(): GitHubAppConfig {
  const appId = process.env.GITHUB_APP_ID;
  const privateKey = process.env.GITHUB_APP_PRIVATE_KEY;
  const installationId = process.env.GITHUB_APP_INSTALLATION_ID;

  if (!appId || !privateKey || !installationId) {
    throw new Error(
      "Missing required GitHub App environment variables: GITHUB_APP_ID, GITHUB_APP_PRIVATE_KEY, and GITHUB_APP_INSTALLATION_ID must be set."
    );
  }

  return {
    appId,
    privateKey: privateKey.replace(/\\n/g, "\n"),
    installationId,
    baseUrl: process.env.GITHUB_API_URL,
  };
}

/**
 * Obtains an installation access token for a GitHub App.
 */
export async function getInstallationToken(
  config: GitHubAppConfig
): Promise<string> {
  if (!config.appId || !config.privateKey || !config.installationId) {
    throw new Error(
      "Invalid GitHub App configuration: appId, privateKey, and installationId are required."
    );
  }

  const auth = createAppAuth({
    appId: config.appId,
    privateKey: config.privateKey,
    installationId: config.installationId,
    ...(config.baseUrl
      ? { request: octokitRequest.defaults({ baseUrl: config.baseUrl }) }
      : {}),
  });

  const authentication = await auth({ type: "installation" });
  return authentication.token;
}

/**
 * Returns an Octokit instance authenticated as a GitHub App installation.
 */
export function getInstallationOctokit(config: GitHubAppConfig): Octokit {
  if (!config.appId || !config.privateKey || !config.installationId) {
    throw new Error(
      "Invalid GitHub App configuration: appId, privateKey, and installationId are required."
    );
  }

  return new Octokit({
    authStrategy: createAppAuth,
    auth: {
      appId: config.appId,
      privateKey: config.privateKey,
      installationId: config.installationId,
    },
    ...(config.baseUrl ? { baseUrl: config.baseUrl } : {}),
  });
}
