import { expect, Page, test } from '@playwright/test';

import { openTerminal, run, terminalText } from './terminal';

/**
 * `pkg` adds plugins that are not bundled with the app, from the npm registry
 * and the unpkg/jsDelivr CDNs. The network is mocked: one sample package, served
 * as the IIFE bundle every plugin publishes (it registers itself with the
 * engine through window.__cliModuleRegistry, as bootCliModule does).
 */
const SAMPLE = {
  name: '@qodalis/cli-e2e-sample',
  version: '1.0.0',
  description: 'Sample package for the end-to-end tests',
  umd: './umd/index.global.js',
  unpkg: './umd/index.global.js',
};

const BUNDLE = `"use strict";
(() => {
  const module = {
    apiVersion: 2,
    name: '${SAMPLE.name}',
    processors: [{
      command: 'e2e-sample',
      description: 'Says hello from an added package',
      processCommand: async (_, context) => context.writer.writeln('Hello from an added package'),
    }],
  };
  window.__cliModuleRegistry && window.__cliModuleRegistry.register(module);
})();`;

async function mockRegistry(page: Page): Promise<string[]> {
  const requests: string[] = [];
  await page.route('https://registry.npmjs.org/**', (route) => {
    requests.push(route.request().url());
    return route.fulfill({
      json: {
        objects: [{ package: { name: SAMPLE.name, version: SAMPLE.version, description: SAMPLE.description } }],
      },
    });
  });
  await page.route(/^https:\/\/(unpkg\.com|cdn\.jsdelivr\.net\/npm)\/.*/, (route) => {
    const url = decodeURIComponent(route.request().url());
    requests.push(url);
    if (!url.includes(SAMPLE.name)) {
      return route.fulfill({ status: 404, body: 'Not found' });
    }
    return url.endsWith('/package.json')
      ? route.fulfill({ json: SAMPLE })
      : route.fulfill({ body: BUNDLE, contentType: 'application/javascript' });
  });
  return requests;
}

test.describe('packages (pkg)', () => {
  // Requests the service worker passes on are not seen by page.route.
  test.use({ serviceWorkers: 'block' });
  test.beforeEach(({ isMobile }) => test.skip(!isMobile, 'same on desktop'));

  test('pkg browse lists packages that can be added', async ({ page }) => {
    await mockRegistry(page);
    await openTerminal(page);
    await run(page, 'pkg browse');
    await expect.poll(() => terminalText(page)).toContain('e2e-sample');
    expect(await terminalText(page)).toContain('not installed');
  });

  test('pkg add installs a package that is not bundled; it stays after a reload', async ({ page }) => {
    const requests = await mockRegistry(page);
    await openTerminal(page);
    await run(page, 'pkg add e2e-sample');
    await expect.poll(() => terminalText(page)).toMatch(/Package @qodalis\/cli-e2e-sample@1\.0\.0 added/);
    expect(requests.some((url) => url.endsWith(`${SAMPLE.name}/umd/index.global.js`))).toBe(true);

    await run(page, 'e2e-sample');
    await expect.poll(() => terminalText(page)).toContain('Hello from an added package');

    await page.reload();
    await openTerminal(page);
    await run(page, 'pkg ls');
    await expect.poll(() => terminalText(page)).toContain(`${SAMPLE.name}@${SAMPLE.version}`);
    await run(page, 'e2e-sample');
    await expect.poll(() => terminalText(page)).toContain('Hello from an added package');
  });
});
