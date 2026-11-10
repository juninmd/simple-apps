import * as fs from 'node:fs';
import * as path from 'node:path';
import { TokenManager } from './token-manager.js';

export interface PackageMetadata {
  name: string;
  version: string;
  publishConfig?: {
    access?: 'public' | 'restricted';
    registry?: string;
    tag?: string;
    [key: string]: unknown;
  };
}

/**
 * Options for publishing an npm package.
 */
export interface PublishOptions {
  /** Relative or absolute path to the package directory to publish. Passed as argument to `npm publish`. */
  packagePath?: string;
  /** Working directory where the publish command is executed. Defaults to `process.cwd()`. */
  cwd?: string;
  /** Access level for the package ('public' | 'restricted'). */
  access?: 'public' | 'restricted';
  /** Registry URL to publish to. */
  registry?: string;
  /** Distribution tag (e.g. 'latest', 'next'). */
  tag?: string;
  /** Perform a dry run without publishing. */
  dryRun?: boolean;
  /** Extra arguments passed to `npm publish`. */
  extraArgs?: string[];
  /** Maximum retry attempts. Defaults to number of valid tokens. */
  maxRetries?: number;
}

export interface PublishResult {
  success: boolean;
  packageName: string;
  version: string;
  isScoped: boolean;
  scope?: string;
  access: 'public' | 'restricted';
  usedTokenMasked: string;
  attempts: number;
  commandExecuted?: string;
  output?: string;
  error?: string;
}

export interface ExecRunner {
  (command: string, args: string[], options: { env: Record<string, string>; cwd?: string }): Promise<{
    exitCode: number;
    stdout: string;
    stderr: string;
  }>;
}

export class NpmPublisher {
  private tokenManager: TokenManager;
  private execRunner?: ExecRunner;

  constructor(tokenManager: TokenManager, execRunner?: ExecRunner) {
    this.tokenManager = tokenManager;
    this.execRunner = execRunner;
  }

  public static isScopedPackage(packageName: string): boolean {
    return packageName.startsWith('@') && packageName.includes('/');
  }

  public static extractScope(packageName: string): string | undefined {
    if (!this.isScopedPackage(packageName)) {
      return undefined;
    }
    return packageName.split('/')[0];
  }

  public buildPublishArgs(metadata: PackageMetadata, options: PublishOptions = {}): {
    args: string[];
    access: 'public' | 'restricted';
    registry?: string;
  } {
    const isScoped = NpmPublisher.isScopedPackage(metadata.name);

    // Access determination: option override > publishConfig > default for scoped (public) / default for unscoped
    const access: 'public' | 'restricted' =
      options.access ||
      metadata.publishConfig?.access ||
      (isScoped ? 'public' : 'restricted');

    const registry = options.registry || metadata.publishConfig?.registry;
    const tag = options.tag || metadata.publishConfig?.tag || 'latest';

    const args: string[] = ['publish'];

    if (options.packagePath) {
      args.push(options.packagePath);
    }

    if (isScoped || options.access || metadata.publishConfig?.access) {
      args.push('--access', access);
    }

    if (registry) {
      args.push('--registry', registry);
    }

    if (tag && tag !== 'latest') {
      args.push('--tag', tag);
    }

    if (options.dryRun) {
      args.push('--dry-run');
    }

    if (options.extraArgs && options.extraArgs.length > 0) {
      args.push(...options.extraArgs);
    }

    return { args, access, registry };
  }

  public async publish(metadata: PackageMetadata, options: PublishOptions = {}): Promise<PublishResult> {
    const isScoped = NpmPublisher.isScopedPackage(metadata.name);
    const scope = NpmPublisher.extractScope(metadata.name);
    const workingDir = options.cwd || process.cwd();

    if (options.packagePath) {
      const resolvedPackagePath = path.resolve(workingDir, options.packagePath);
      if (!fs.existsSync(resolvedPackagePath)) {
        return {
          success: false,
          packageName: metadata.name,
          version: metadata.version,
          isScoped,
          scope,
          access: options.access || metadata.publishConfig?.access || (isScoped ? 'public' : 'restricted'),
          usedTokenMasked: TokenManager.maskToken(this.tokenManager.getActiveToken()),
          attempts: 0,
          error: `Package path does not exist: ${options.packagePath}`,
        };
      }
    }

    const maxRetries = options.maxRetries ?? this.tokenManager.getValidTokenCount();

    let attempt = 0;
    let lastError = '';

    while (attempt < maxRetries) {
      attempt++;
      const currentToken = this.tokenManager.getActiveToken();
      const maskedToken = TokenManager.maskToken(currentToken);

      const { args, access, registry } = this.buildPublishArgs(metadata, options);

      const env: Record<string, string> = {
        ...process.env,
        NODE_AUTH_TOKEN: currentToken,
        NPM_TOKEN: currentToken,
      };

      if (!this.execRunner) {
        return {
          success: true,
          packageName: metadata.name,
          version: metadata.version,
          isScoped,
          scope,
          access,
          usedTokenMasked: maskedToken,
          attempts: attempt,
          commandExecuted: `npm ${args.join(' ')}`,
          output: `[Dry Run / Mocked] Command would run: npm ${args.join(' ')} with token ${maskedToken}`,
        };
      }

      try {
        const result = await this.execRunner('npm', args, {
          env,
          cwd: workingDir,
        });

        if (result.exitCode === 0) {
          return {
            success: true,
            packageName: metadata.name,
            version: metadata.version,
            isScoped,
            scope,
            access,
            usedTokenMasked: maskedToken,
            attempts: attempt,
            commandExecuted: `npm ${args.join(' ')}`,
            output: result.stdout,
          };
        }

        const combinedOutput = `${result.stdout}\n${result.stderr}`;
        lastError = combinedOutput;

        const isAuthError =
          result.exitCode === 401 ||
          result.exitCode === 403 ||
          /E401|E403|ENEEDAUTH|401 Unauthorized|403 Forbidden/i.test(combinedOutput);

        if (isAuthError && attempt < maxRetries && this.tokenManager.getValidTokenCount() > 1) {
          this.tokenManager.rotateToken(`NPM Publish failed with authentication error: ${result.stderr || result.stdout}`);
          continue;
        }

        return {
          success: false,
          packageName: metadata.name,
          version: metadata.version,
          isScoped,
          scope,
          access,
          usedTokenMasked: maskedToken,
          attempts: attempt,
          commandExecuted: `npm ${args.join(' ')}`,
          error: combinedOutput,
        };
      } catch (err: unknown) {
        const errMessage = err instanceof Error ? err.message : String(err);
        lastError = errMessage;

        const isAuthError = /401|403|E401|E403|ENEEDAUTH|Unauthorized|Forbidden/i.test(errMessage);
        if (isAuthError && attempt < maxRetries && this.tokenManager.getValidTokenCount() > 1) {
          this.tokenManager.rotateToken(`Execution error with auth issue: ${errMessage}`);
          continue;
        }

        return {
          success: false,
          packageName: metadata.name,
          version: metadata.version,
          isScoped,
          scope,
          access,
          usedTokenMasked: maskedToken,
          attempts: attempt,
          commandExecuted: `npm ${args.join(' ')}`,
          error: errMessage,
        };
      }
    }

    return {
      success: false,
      packageName: metadata.name,
      version: metadata.version,
      isScoped,
      scope,
      access: (options.access || metadata.publishConfig?.access || (isScoped ? 'public' : 'restricted')),
      usedTokenMasked: TokenManager.maskToken(this.tokenManager.getActiveToken()),
      attempts: attempt,
      error: `Failed after ${attempt} attempts. Last error: ${lastError}`,
    };
  }
}
