/**
 * Screenshot
 *
 * Captures a screenshot of the Discord page.
 * Usage: npm run screenshot [filename]
 */

import puppeteer, { type Page } from "puppeteer";
import { appConfig } from "./config.js";
import { mkdir } from "fs/promises";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function findDiscordPage(): Promise<Page> {
  const browser = await puppeteer.connect({
    browserURL: `http://localhost:${appConfig.chromeDebugPort}`,
    defaultViewport: null,
  });

  const pages = await browser.pages();
  const discordPage = pages.find((p) => p.url().includes("discord.com"));

  if (!discordPage) {
    browser.disconnect();
    throw new Error("No Discord page found. Make sure Discord is open in the browser.");
  }

  return discordPage;
}

async function takeScreenshot(filename?: string): Promise<string> {
  const discordPage = await findDiscordPage();

  const screenshotsDir = join(__dirname, "..", "screenshots");
  await mkdir(screenshotsDir, { recursive: true });

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const screenshotPath = join(screenshotsDir, filename ?? `discord-${timestamp}.png`);

  // Use captureBeyondViewport: false to capture only the visible area without changing viewport
  await discordPage.screenshot({
    path: screenshotPath,
    fullPage: false,
    captureBeyondViewport: false,
  });

  const browser = discordPage.browser();
  browser.disconnect();

  return screenshotPath;
}

const filename = process.argv[2];
takeScreenshot(filename)
  .then((path) => {
    console.log(`Screenshot saved: ${path}`);
  })
  .catch((error: unknown) => {
    if (error instanceof Error && error.message.includes("ECONNREFUSED")) {
      console.error("Could not connect to Chrome. Make sure launch-browser is running.");
    } else {
      console.error("Error:", error);
    }
    process.exit(1);
  });
