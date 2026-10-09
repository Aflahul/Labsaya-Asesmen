import { defineConfig } from "@playwright/test";
import fs from "node:fs";
export default defineConfig({
  testDir: "tests/browser",
  workers: 1,
  timeout: 120000,
  use: {
    baseURL: "http://127.0.0.1:5173",
    launchOptions: {
      executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || (fs.existsSync("/usr/bin/chromium")?"/usr/bin/chromium":undefined),
      args: ["--no-sandbox"],
    },
  },
  webServer: [
    { command: "node tests/server.js", port: 3000, reuseExistingServer: false },
    {
      command: process.env.TEST_BUILD
        ? "npm run preview -- --host 127.0.0.1 --port 5173"
        : "npm run dev -- --port 5173",
      port: 5173,
      reuseExistingServer: false,
    },
  ],
});
