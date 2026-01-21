/**
 * Click Create
 *
 * Clicks the Create button on the current modal.
 */

import puppeteer from "puppeteer";
import { appConfig } from "./config.js";

async function clickCreate(): Promise<void> {
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

  console.log("Looking for Create button...");
  const clicked = await page.evaluate(() => {
    const buttons = document.querySelectorAll('button');
    for (const button of buttons) {
      if (button.textContent?.trim() === "Create") {
        console.log("Found Create button, clicking...");
        (button as HTMLElement).click();
        return true;
      }
    }
    return false;
  });

  if (clicked) {
    console.log("Clicked Create button!");
  } else {
    console.log("Could not find Create button");
  }

  await new Promise((resolve) => setTimeout(resolve, 3000));
  console.log("Current URL:", page.url());

  browser.disconnect();
}

clickCreate().catch(console.error);
