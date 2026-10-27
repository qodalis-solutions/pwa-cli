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

/** The test account the first-run setup creates. */
export const TEST_USER = { name: 'tester', email: 'tester@example.com', password: 'Test-passw0rd!' };

/** The lines drawn by the terminal, read from the DOM (works before the engine is ready). */
async function drawnLines(page: Page): Promise<string[]> {
  return (await page.locator('.xterm-rows').innerText()).split('\n').map((l) => l.trimEnd()).filter(Boolean);
}

/**
 * Answers the users plugin's first-run setup (shown on a fresh install, before
 * the engine reports ready) with {@link TEST_USER}. Returns once the app is ready.
 */
export async function completeFirstRunSetup(page: Page): Promise<void> {
  const ready = () => page.evaluate(() => !!(window as any).qodalisCli);
  const deadline = Date.now() + 30_000;
  // The screen when the last answer was typed: the next one waits for a new prompt.
  let answered = '';
  while (!(await ready())) {
    const lines = await drawnLines(page);
    const line = lines[lines.length - 1] ?? '';
    if (Date.now() > deadline) throw new Error(`The app did not get ready; last line: ${line}`);
    const screen = lines.join('\n');
    const answer = /Username:\s*$/.test(line)
      ? TEST_USER.name
      : /Email:\s*$/.test(line)
        ? TEST_USER.email
        : /Full name.*:\s*$/.test(line) || /Home directory.*:\s*$/.test(line)
          ? ''
          : /[Pp]assword.*:\s*$/.test(line)
            ? TEST_USER.password
            : undefined;
    if (answer !== undefined && screen !== answered) {
      await page.locator('.xterm-helper-textarea').focus();
      await page.keyboard.type(answer);
      await page.keyboard.press('Enter');
      answered = screen;
    }
    await page.waitForTimeout(200);
  }
}

/** Opens the app (creating the test account on a fresh install) and waits for the prompt. */
export async function openTerminal(page: Page): Promise<void> {
  await page.goto('/');
  await completeFirstRunSetup(page);
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
