/**
 * Launch Browser
 *
 * Launches Chrome with remote debugging enabled for Discord authentication.
 * Run this first, then log into Discord manually.
 */

import puppeteer from "puppeteer";
import { appConfig } from "./config.js";

async function launchBrowser(): Promise<void> {
  console.log("Launching Chrome with remote debugging...");
  console.log("Please log into Discord manually in the browser window.");
  console.log("");

  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: null,
    args: [
      `--remote-debugging-port=${appConfig.chromeDebugPort}`,
      "--no-first-run",
      "--no-default-browser-check",
      "--start-maximized",
    ],
    userDataDir: appConfig.chromeUserDataDir,
  });

  // Get existing pages and use the first one instead of creating a new tab
  const pages = await browser.pages();
  const page = pages[0] ?? (await browser.newPage());

  await page.goto("https://discord.com/channels/@me");

  console.log("Browser launched!");
  console.log("1. Log into Discord if not already logged in");
  console.log("2. Navigate to your DM with Horsecode or HorsecodeDev");
  console.log('3. Run "npm run send -- your message" to send messages');
  console.log('4. Run "npm run read" to read recent messages');
  console.log("");
  console.log("Press Ctrl+C to close the browser when done.");

  // Keep the script running until interrupted
  await new Promise<void>(() => {});
}

launchBrowser().catch((error: unknown) => {
  console.error("Error launching browser:", error);
  process.exit(1);
});
