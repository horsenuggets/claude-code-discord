/**
 * Find Buttons
 *
 * Lists all buttons on the current Discord page.
 */

import puppeteer from "puppeteer";
import { appConfig } from "./config.js";

async function findButtons(): Promise<void> {
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

  console.log("Finding all buttons...\n");

  const buttons = await page.$$eval("button", (elements) =>
    elements.map((el) => ({
      text: el.textContent?.trim() || "(no text)",
      className: el.className,
      ariaLabel: el.getAttribute("aria-label"),
    }))
  );

  console.log(`Found ${buttons.length} buttons:\n`);
  buttons.forEach((btn, i) => {
    console.log(`${i + 1}. "${btn.text}"`);
    if (btn.ariaLabel) console.log(`   aria-label: ${btn.ariaLabel}`);
    console.log(`   class: ${btn.className.slice(0, 100)}...`);
    console.log("");
  });

  browser.disconnect();
}

findButtons().catch(console.error);
