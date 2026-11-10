import { execFile as defaultExecFile } from 'child_process';
import { promisify } from 'util';
import { GitTagManager, TagRollbackOptions, TagRollbackResult } from '../types.js';

const execFileAsync = promisify(defaultExecFile);

export type ExecFunction = (
  file: string,
  args: string[]
) => Promise<{ stdout: string; stderr: string }>;

export class DefaultGitTagManager implements GitTagManager {
  private execFn: ExecFunction;
  private cwd?: string;

  constructor(execFn?: ExecFunction, cwd?: string) {
    this.execFn =
      execFn ||
      (async (file: string, args: string[]) => {
        const result = await execFileAsync(file, args, { cwd: this.cwd });
        return { stdout: result.stdout, stderr: result.stderr };
      });
    this.cwd = cwd;
  }

  async tagExists(tagName: string): Promise<boolean> {
    try {
      const { stdout } = await this.execFn('git', ['tag', '-l', tagName]);
      return stdout.trim().split('\n').some((t) => t.trim() === tagName);
    } catch {
      return false;
    }
  }

  async revertTag(tagName: string, options: TagRollbackOptions = {}): Promise<TagRollbackResult> {
    const deleteRemote = options.deleteRemote ?? true;
    const remoteName = options.remoteName || 'origin';

    let localDeleted = false;
    let remoteDeleted = false;
    let rollbackError: Error | undefined;

    // 1. Delete local tag
    try {
      await this.execFn('git', ['tag', '-d', tagName]);
      localDeleted = true;
    } catch (err) {
      rollbackError = err instanceof Error ? err : new Error(String(err));
    }

    // 2. Delete remote tag if requested
    if (deleteRemote) {
      try {
        await this.execFn('git', ['push', remoteName, '--delete', tagName]);
        remoteDeleted = true;
      } catch (err) {
        if (!rollbackError) {
          rollbackError = err instanceof Error ? err : new Error(String(err));
        }
      }
    }

    const success = localDeleted && (!deleteRemote || remoteDeleted);

    return {
      success,
      tagName,
      localDeleted,
      remoteDeleted,
      error: rollbackError,
    };
  }
}
