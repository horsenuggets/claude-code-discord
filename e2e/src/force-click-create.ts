/**
 * Force Click Create
 *
 * Forcefully clicks the Create button and waits.
 */

import puppeteer from "puppeteer";
import { appConfig } from "./config.js";

async function forceClickCreate(): Promise<void> {
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

  // Use puppeteer's native click on the Create button
  console.log("Finding Create button using native selector...");
  const buttons = await page.$$('button');

  for (const button of buttons) {
    const text = await button.evaluate((el) => el.textContent?.trim());
    if (text === "Create") {
      console.log("Found Create button, clicking with native click...");
      await button.click();
      console.log("Clicked!");
      break;
    }
  }

  await new Promise((resolve) => setTimeout(resolve, 5000));

  // Take a screenshot of the result
  console.log("Taking screenshot...");
  await page.screenshot({ path: "./screenshots/after-create-click.png" });

  console.log("Current URL:", page.url());

  browser.disconnect();
}

forceClickCreate().catch(console.error);
