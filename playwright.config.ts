import { defineConfig, devices } from '@playwright/test';
import { existsSync } from 'node:fs';
const localChrome = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
// Serve the production build: Next 16 refuses a second dev server for the same project,
// so `next dev` here fails whenever `npm run dev` is already running. Set E2E_PORT to
// run against a different port (e.g. while another e2e run is in progress).
const port = Number(process.env.E2E_PORT) || 3100;
export default defineConfig({testDir:'./tests/e2e',fullyParallel:false,workers:1,use:{baseURL:`http://localhost:${port}`,trace:'retain-on-failure'},webServer:{command:`npm run build && npm run start -- --port ${port}`,url:`http://localhost:${port}`,timeout:180_000,reuseExistingServer:!process.env.CI},projects:[{name:'chromium',use:{...devices['Desktop Chrome'],launchOptions:{executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || (existsSync(localChrome)?localChrome:undefined)}}}]});
