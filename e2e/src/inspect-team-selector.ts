/**
 * Inspect Team Selector
 *
 * Inspects the team selector dropdown in the create application modal.
 */

import puppeteer from "puppeteer";
import { appConfig } from "./config.js";

async function inspectTeamSelector(): Promise<void> {
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

  // Find and click the combobox to open dropdown
  console.log("Looking for team selector...");

  const combobox = await page.$('input[role="combobox"]');
  if (combobox) {
    console.log("Found combobox, clicking to open dropdown...");
    await combobox.click();
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  // Look for dropdown options
  const options = await page.$$eval('[role="option"], [role="listbox"] > div, .css-1nmdiq5-menu > div', (elements) =>
    elements.map((el) => ({
      text: el.textContent?.trim().slice(0, 50),
      ariaSelected: el.getAttribute("aria-selected"),
    }))
  );

  console.log("\n=== Dropdown options ===");
  options.forEach((opt, i) => {
    console.log(`${i + 1}. "${opt.text}" selected=${opt.ariaSelected}`);
  });

  // Also look for any error messages
  const errors = await page.$$eval('[class*="error"], [class*="Error"]', (elements) =>
    elements.map((el) => el.textContent?.trim())
  );

  if (errors.length > 0) {
    console.log("\n=== Error messages ===");
    errors.forEach((err, i) => {
      console.log(`${i + 1}. ${err}`);
    });
  }

  browser.disconnect();
}

inspectTeamSelector().catch(console.error);
