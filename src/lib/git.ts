import { execa } from 'execa';

export async function isGitAvailable(): Promise<boolean> {
  try {
    await execa('git', ['--version']);
    return true;
  } catch {
    return false;
  }
}

export async function isInsideRepo(cwd?: string): Promise<boolean> {
  try {
    const { stdout } = await execa('git', ['rev-parse', '--is-inside-work-tree'], { cwd });
    return stdout.trim() === 'true';
  } catch {
    return false;
  }
}

export async function hasPendingChanges(cwd?: string): Promise<boolean> {
  try {
    const { stdout } = await execa('git', ['status', '--short'], { cwd });
    return stdout.trim().length > 0;
  } catch {
    return false;
  }
}

export async function currentBranch(cwd?: string): Promise<string | null> {
  try {
    const { stdout } = await execa('git', ['rev-parse', '--abbrev-ref', 'HEAD'], { cwd });
    return stdout.trim();
  } catch {
    return null;
  }
}
