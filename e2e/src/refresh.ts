/**
 * Refresh
 *
 * Refreshes the current Discord page.
 */

import puppeteer from "puppeteer";
import { appConfig } from "./config.js";

async function refresh(): Promise<void> {
  const browser = await puppeteer.connect({
    browserURL: `http://localhost:${appConfig.chromeDebugPort}`,
    defaultViewport: null,
  });

  const pages = await browser.pages();
  const page = pages.find((p) => p.url().includes("discord.com"));

  if (!page) {
    browser.disconnect();
    throw new Error("No Discord page found");
  }

  console.log("Refreshing page...");
  await page.reload({ waitUntil: "networkidle0" });
  console.log("Page refreshed!");

  browser.disconnect();
}

refresh().catch(console.error);
