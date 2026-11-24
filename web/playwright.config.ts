import fs from 'node:fs';
import path from 'node:path';
import { chromium, defineConfig } from '@playwright/test';

const API_DIR = path.resolve(process.cwd(), '..', 'api');

function resolveApiPythonCommand(): string {
  if (process.env.ALGOMIRI_API_PYTHON) {
    return process.env.ALGOMIRI_API_PYTHON;
  }
  const winVenv = path.join(API_DIR, '.venv', 'Scripts', 'python.exe');
  if (fs.existsSync(winVenv)) {
    return `"${winVenv}"`;
  }
  const unixVenv = path.join(API_DIR, '.venv', 'bin', 'python');
  if (fs.existsSync(unixVenv)) {
    return `"${unixVenv}"`;
  }
  return process.platform === 'win32' ? 'python' : 'python3';
}

function resolveBrowserExecutablePath(): string | undefined {
  if (process.env.PLAYWRIGHT_EXECUTABLE_PATH) {
    return process.env.PLAYWRIGHT_EXECUTABLE_PATH;
  }
  try {
    const bundled = chromium.executablePath();
    if (bundled && fs.existsSync(bundled)) {
      return undefined; // Use Playwright's bundled Chromium
    }
  } catch {
    // Fall through to system browser lookup on local dev machines
  }
  if (process.platform === 'win32') {
    const candidates = [
      'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
      'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    ];
    for (const candidate of candidates) {
      if (fs.existsSync(candidate)) {
        return candidate;
      }
    }
  }
  return undefined;
}

const FRONTEND_PORT = 4173;
const API_PORT = 8000;
const FRONTEND_URL = `http://127.0.0.1:${FRONTEND_PORT}`;
const API_URL = `http://127.0.0.1:${API_PORT}`;

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  timeout: 45_000,
  expect: {
    timeout: 10_000,
  },
  reporter: [
    ['list'],
    ['html', { open: 'never', outputFolder: 'playwright-report' }],
  ],
  outputDir: 'test-results',
  use: {
    baseURL: FRONTEND_URL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    launchOptions: {
      executablePath: resolveBrowserExecutablePath(),
    },
  },
  projects: [
    {
      name: 'chromium',
      use: {
        browserName: 'chromium',
        viewport: { width: 1440, height: 900 },
      },
    },
  ],
  webServer: [
    {
      command: `${resolveApiPythonCommand()} -m uvicorn app.main:app --host 127.0.0.1 --port ${API_PORT}`,
      cwd: API_DIR,
      url: `${API_URL}/health`,
      reuseExistingServer: !process.env.CI,
      timeout: 30_000,
      env: {
        ...process.env,
        // Force deterministic offline-demo mode during automated browser tests (no external billable calls)
        GEMINI_API_KEY: '',
        CORS_ORIGINS: `${FRONTEND_URL},http://localhost:${FRONTEND_PORT},http://localhost:5173`,
      },
    },
    {
      command: `npx vite --host 127.0.0.1 --port ${FRONTEND_PORT} --strictPort`,
      cwd: process.cwd(),
      url: FRONTEND_URL,
      reuseExistingServer: !process.env.CI,
      timeout: 30_000,
      env: {
        ...process.env,
        VITE_API_BASE_URL: API_URL,
      },
    },
  ],
});
