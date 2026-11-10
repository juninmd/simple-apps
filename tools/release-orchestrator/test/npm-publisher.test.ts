import { describe, it, expect, vi } from 'vitest';
import { TokenManager } from '../src/token-manager.js';
import { NpmPublisher, PackageMetadata, ExecRunner } from '../src/npm-publisher.js';

describe('NpmPublisher', () => {
  it('should identify scoped packages correctly', () => {
    expect(NpmPublisher.isScopedPackage('@my-scope/my-pkg')).toBe(true);
    expect(NpmPublisher.isScopedPackage('my-pkg')).toBe(false);
    expect(NpmPublisher.extractScope('@my-scope/my-pkg')).toBe('@my-scope');
    expect(NpmPublisher.extractScope('my-pkg')).toBeUndefined();
  });

  it('should default --access public for scoped packages', () => {
    const tm = new TokenManager({ tokens: ['tok-1'] });
    const publisher = new NpmPublisher(tm);
    const meta: PackageMetadata = { name: '@my-org/core', version: '1.0.0' };

    const { args, access } = publisher.buildPublishArgs(meta);
    expect(access).toBe('public');
    expect(args).toContain('--access');
    expect(args).toContain('public');
  });

  it('should allow overriding access and registry', () => {
    const tm = new TokenManager({ tokens: ['tok-1'] });
    const publisher = new NpmPublisher(tm);
    const meta: PackageMetadata = {
      name: '@my-org/core',
      version: '1.0.0',
      publishConfig: { registry: 'https://custom-registry.com/' },
    };

    const { args, access, registry } = publisher.buildPublishArgs(meta, {
      access: 'restricted',
      tag: 'next',
    });

    expect(access).toBe('restricted');
    expect(registry).toBe('https://custom-registry.com/');
    expect(args).toEqual(['publish', '--access', 'restricted', '--registry', 'https://custom-registry.com/', '--tag', 'next']);
  });

  it('should rotate auth token and retry when receiving 401/403 errors', async () => {
    const tm = new TokenManager({ tokens: ['bad-token', 'good-token'] });

    let callCount = 0;
    const mockExec: ExecRunner = async (cmd, args, options) => {
      callCount++;
      const token = options.env['NPM_TOKEN'];

      if (token === 'bad-token') {
        return {
          exitCode: 401,
          stdout: '',
          stderr: 'npm ERR! code E401\nnpm ERR! 401 Unauthorized - PUT https://registry.npmjs.org/@my-org%2fcore',
        };
      }

      return {
        exitCode: 0,
        stdout: '+ @my-org/core@1.0.0',
        stderr: '',
      };
    };

    const publisher = new NpmPublisher(tm, mockExec);
    const result = await publisher.publish({ name: '@my-org/core', version: '1.0.0' });

    expect(result.success).toBe(true);
    expect(result.attempts).toBe(2);
    expect(callCount).toBe(2);
    expect(result.usedTokenMasked).toBe('good....oken');
  });

  it('should fail gracefully if all rotated tokens fail authentication', async () => {
    const tm = new TokenManager({ tokens: ['bad-tok-1', 'bad-tok-2'] });

    const mockExec: ExecRunner = async () => ({
      exitCode: 403,
      stdout: '',
      stderr: 'npm ERR! 403 Forbidden - You do not have permission to publish',
    });

    const publisher = new NpmPublisher(tm, mockExec);
    const result = await publisher.publish({ name: '@my-org/core', version: '1.0.0' });

    expect(result.success).toBe(false);
    expect(result.attempts).toBe(2);
    expect(result.error).toContain('403 Forbidden');
  });

  it('should not combine cwd and packagePath into duplicated paths when using relative path', async () => {
    const tm = new TokenManager({ tokens: ['tok-1'] });
    let recordedArgs: string[] = [];
    let recordedCwd: string | undefined;

    const mockExec: ExecRunner = async (cmd, args, options) => {
      recordedArgs = args;
      recordedCwd = options.cwd;
      return { exitCode: 0, stdout: '+ pkg@1.0.0', stderr: '' };
    };

    const publisher = new NpmPublisher(tm, mockExec);
    const result = await publisher.publish(
      { name: 'pkg', version: '1.0.0' },
      { packagePath: 'fixtures/pkg' }
    );

    expect(result.success).toBe(true);
    expect(recordedArgs).toEqual(['publish', 'fixtures/pkg']);
    expect(recordedCwd).toBe(process.cwd());
  });

  it('should return error if packagePath does not exist without calling runner', async () => {
    const tm = new TokenManager({ tokens: ['tok-1'] });
    const mockExec = vi.fn();

    const publisher = new NpmPublisher(tm, mockExec as ExecRunner);
    const result = await publisher.publish(
      { name: 'pkg', version: '1.0.0' },
      { packagePath: 'fixtures/non-existent-pkg-path' }
    );

    expect(result.success).toBe(false);
    expect(result.attempts).toBe(0);
    expect(result.error).toContain('Package path does not exist: fixtures/non-existent-pkg-path');
    expect(mockExec).not.toHaveBeenCalled();
  });
});
