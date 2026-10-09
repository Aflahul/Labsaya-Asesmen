import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "tests/browser",
  timeout: 120000,
  use: {
    baseURL: "http://127.0.0.1:5173",
    launchOptions: {
      executablePath: "/usr/bin/chromium",
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
