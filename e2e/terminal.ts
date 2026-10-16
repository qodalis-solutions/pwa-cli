import { expect, Page } from '@playwright/test';

/** Lines currently in the terminal buffer, trailing spaces trimmed. */
export async function terminalLines(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    const engine = (window as any).qodalisCli;
    const buffer = engine.getTerminal().buffer.active;
    const lines: string[] = [];
    for (let i = 0; i < buffer.length; i++) {
      lines.push(buffer.getLine(i)?.translateToString(true) ?? '');
    }
    return lines;
  });
}

export async function terminalText(page: Page): Promise<string> {
  return (await terminalLines(page)).join('\n');
}

/** The line the cursor is on. */
export async function currentLine(page: Page): Promise<string> {
  return page.evaluate(() => {
    const buffer = (window as any).qodalisCli.getTerminal().buffer.active;
    return buffer.getLine(buffer.baseY + buffer.cursorY)?.translateToString(true) ?? '';
  });
}

/** Opens the app and waits until the terminal shows its prompt. */
export async function openTerminal(page: Page): Promise<void> {
  await page.goto('/');
  await page.waitForFunction(() => !!(window as any).qodalisCli, null, { timeout: 30_000 });
  await expect.poll(() => currentLine(page), { timeout: 15_000 }).toMatch(/[$#>]\s*$/);
}

export async function focusTerminal(page: Page): Promise<void> {
  await page.locator('.xterm-helper-textarea').focus();
}

/** Number of prompts in the buffer, used to tell when a command finished. */
async function promptCount(page: Page): Promise<number> {
  return (await terminalLines(page)).filter((l) => /^\S*[$#] /.test(l + ' ')).length;
}

/** Types a command, presses Enter and waits for the next prompt. */
export async function run(page: Page, command: string, options: { wait?: boolean } = {}): Promise<void> {
  await focusTerminal(page);
  const before = await promptCount(page);
  await page.keyboard.type(command);
  await page.keyboard.press('Enter');
  if (options.wait !== false) {
    await expect.poll(() => promptCount(page), { timeout: 15_000 }).toBeGreaterThan(before);
  }
}

/** Taps a key on the extra-keys row. */
export async function tapKey(page: Page, name: string): Promise<void> {
  await page.locator(`app-extra-keys [data-key="${name}"]`).tap();
}
