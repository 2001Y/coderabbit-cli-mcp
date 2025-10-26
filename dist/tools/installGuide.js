import os from 'node:os';
export function buildInstallGuide() {
    const platform = os.platform();
    if (platform === 'win32') {
        return [
            'CodeRabbit CLI is not available on native Windows. Use WSL2 and install it inside your Linux distro.',
            '',
            'WSL2 setup checklist:',
            '1. From PowerShell run `wsl --install` (or open an existing Ubuntu distro).',
            '2. Inside the WSL terminal run:',
            '   curl -fsSL https://cli.coderabbit.ai/install.sh | sh',
            '3. After installation run `coderabbit auth login`, open the printed URL in a browser, and finish authentication.',
            '4. Confirm with `coderabbit auth status` until it prints "Logged in as ...".',
            '5. If necessary export the absolute binary path via `CODERABBIT_CLI_PATH` before calling run_review again.'
        ].join('\n');
    }
    const osLabel = platform === 'darwin' ? 'macOS' : 'Linux';
    const homebrewHint = platform === 'darwin'
        ? '\n   # Homebrew alternative\n   brew install coderabbitai/cli/coderabbit'
        : '';
    return [
        `CodeRabbit CLI was not detected. Please follow these steps on your ${osLabel} terminal:`,
        '',
        '1. Run the official installer:',
        '   curl -fsSL https://cli.coderabbit.ai/install.sh | sh',
        homebrewHint,
        '2. Authenticate the CLI:',
        '   coderabbit auth login   # open the printed URL in your browser',
        '3. Verify status:',
        '   coderabbit auth status  # should show "Logged in as ..."',
        '4. If the binary still cannot be found, export its absolute path via the CODERABBIT_CLI_PATH environment variable.'
    ].filter(Boolean).join('\n');
}
//# sourceMappingURL=installGuide.js.map