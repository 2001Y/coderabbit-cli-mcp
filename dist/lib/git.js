import { execa } from 'execa';
export async function isGitAvailable() {
    try {
        await execa('git', ['--version']);
        return true;
    }
    catch {
        return false;
    }
}
export async function isInsideRepo(cwd) {
    try {
        const { stdout } = await execa('git', ['rev-parse', '--is-inside-work-tree'], { cwd });
        return stdout.trim() === 'true';
    }
    catch {
        return false;
    }
}
export async function hasPendingChanges(cwd) {
    try {
        const { stdout } = await execa('git', ['status', '--short'], { cwd });
        return stdout.trim().length > 0;
    }
    catch {
        return false;
    }
}
export async function currentBranch(cwd) {
    try {
        const { stdout } = await execa('git', ['rev-parse', '--abbrev-ref', 'HEAD'], { cwd });
        return stdout.trim();
    }
    catch {
        return null;
    }
}
//# sourceMappingURL=git.js.map