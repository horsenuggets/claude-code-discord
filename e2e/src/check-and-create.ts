/**
 * Check and Create
 *
 * Checks the terms checkbox and clicks Create.
 */

import puppeteer from "puppeteer";
import { appConfig } from "./config.js";

async function checkAndCreate(): Promise<void> {
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

  // Look for the checkbox and click it using evaluate
  console.log("Looking for terms checkbox...");

  // Try to click the checkbox's parent or label
  const checked = await page.evaluate(() => {
    // Look for checkbox and click its container
    const checkbox = document.querySelector('input[type="checkbox"]') as HTMLInputElement;
    if (checkbox) {
      // Click the checkbox itself
      checkbox.click();
      return checkbox.checked;
    }
    return false;
  });

  console.log(`Checkbox checked: ${checked}`);
  await new Promise((resolve) => setTimeout(resolve, 500));

  // Try clicking on the checkbox container/label as well
  await page.evaluate(() => {
    // Find the text "By clicking Create" and click near it
    const labels = document.querySelectorAll('label, span, div');
    for (const el of labels) {
      if (el.textContent?.includes("By clicking Create")) {
        (el as HTMLElement).click();
        return;
      }
    }
  });

  await new Promise((resolve) => setTimeout(resolve, 500));

  // Screenshot to see current state
  await page.screenshot({ path: "./screenshots/after-checkbox.png" });
  console.log("Screenshot: after-checkbox.png");

  // Click Create button
  console.log("Clicking Create...");
  const buttons = await page.$$('button');
  for (const button of buttons) {
    const text = await button.evaluate((el) => el.textContent?.trim());
    if (text === "Create") {
      await button.click();
      console.log("Clicked Create!");
      break;
    }
  }

  await new Promise((resolve) => setTimeout(resolve, 5000));

  // Final screenshot
  await page.screenshot({ path: "./screenshots/after-final-create.png" });
  console.log("Screenshot: after-final-create.png");
  console.log("Current URL:", page.url());

  browser.disconnect();
}

checkAndCreate().catch(console.error);
