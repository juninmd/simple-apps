import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  getGitHubAppConfigFromEnv,
  getInstallationToken,
  getInstallationOctokit,
} from "../src/auth.js";
import * as authApp from "@octokit/auth-app";
import { Octokit } from "@octokit/rest";

vi.mock("@octokit/auth-app", async (importOriginal) => {
  const actual = await importOriginal<typeof authApp>();
  return {
    ...actual,
    createAppAuth: vi.fn(),
  };
});

describe("GitHub App Authentication", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetAllMocks();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe("getGitHubAppConfigFromEnv", () => {
    it("throws an error when required environment variables are missing", () => {
      delete process.env.GITHUB_APP_ID;
      delete process.env.GITHUB_APP_PRIVATE_KEY;
      delete process.env.GITHUB_APP_INSTALLATION_ID;

      expect(() => getGitHubAppConfigFromEnv()).toThrow(
        "Missing required GitHub App environment variables"
      );
    });

    it("returns configuration when environment variables are set", () => {
      process.env.GITHUB_APP_ID = "123456";
      process.env.GITHUB_APP_PRIVATE_KEY = "-----BEGIN RSA PRIVATE KEY-----\\nFAKEKEY\\n-----END RSA PRIVATE KEY-----";
      process.env.GITHUB_APP_INSTALLATION_ID = "789012";
      process.env.GITHUB_API_URL = "https://github-enterprise.local/api/v3";

      const config = getGitHubAppConfigFromEnv();

      expect(config.appId).toBe("123456");
      expect(config.privateKey).toBe(
        "-----BEGIN RSA PRIVATE KEY-----\nFAKEKEY\n-----END RSA PRIVATE KEY-----"
      );
      expect(config.installationId).toBe("789012");
      expect(config.baseUrl).toBe("https://github-enterprise.local/api/v3");
    });
  });

  describe("getInstallationToken", () => {
    it("throws an error if appId, privateKey, or installationId are missing", async () => {
      await expect(
        getInstallationToken({
          appId: "",
          privateKey: "key",
          installationId: "123",
        })
      ).rejects.toThrow("Invalid GitHub App configuration");

      await expect(
        getInstallationToken({
          appId: "123",
          privateKey: "",
          installationId: "123",
        })
      ).rejects.toThrow("Invalid GitHub App configuration");

      await expect(
        getInstallationToken({
          appId: "123",
          privateKey: "key",
          installationId: "",
        })
      ).rejects.toThrow("Invalid GitHub App configuration");
    });

    it("fetches installation access token successfully", async () => {
      const mockAuth = Object.assign(
        vi.fn().mockResolvedValue({
          type: "token",
          tokenType: "installation",
          token: "ghs_mock_installation_token_12345",
          installationId: 789012,
          permissions: {},
          createdAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 3600 * 1000).toISOString(),
          repositorySelection: "all",
        }),
        { hook: vi.fn() }
      );

      vi.mocked(authApp.createAppAuth).mockReturnValue(mockAuth as any);

      const token = await getInstallationToken({
        appId: "123456",
        privateKey: "private_key_content",
        installationId: "789012",
      });

      expect(authApp.createAppAuth).toHaveBeenCalledWith({
        appId: "123456",
        privateKey: "private_key_content",
        installationId: "789012",
      });
      expect(mockAuth).toHaveBeenCalledWith({ type: "installation" });
      expect(token).toBe("ghs_mock_installation_token_12345");
    });
  });

  describe("getInstallationOctokit", () => {
    it("throws an error if configuration parameters are missing", () => {
      expect(() =>
        getInstallationOctokit({
          appId: "",
          privateKey: "key",
          installationId: "123",
        })
      ).toThrow("Invalid GitHub App configuration");
    });

    it("returns an Octokit instance configured with GitHub App auth", () => {
      const mockAuth = Object.assign(
        vi.fn().mockResolvedValue({
          type: "token",
          tokenType: "installation",
          token: "ghs_mock_installation_token_12345",
        }),
        { hook: vi.fn() }
      );

      vi.mocked(authApp.createAppAuth).mockReturnValue(mockAuth as any);

      const octokit = getInstallationOctokit({
        appId: "123456",
        privateKey: "private_key_content",
        installationId: "789012",
      });

      expect(octokit).toBeInstanceOf(Octokit);
    });
  });
});
