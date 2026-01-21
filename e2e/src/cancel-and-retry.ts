/**
 * Cancel and Retry
 *
 * Cancels current modal and tries to create application again properly.
 */

import puppeteer from "puppeteer";
import { appConfig } from "./config.js";

async function cancelAndRetry(appName: string): Promise<void> {
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

  // Click Cancel to close the modal
  console.log("Clicking Cancel...");
  await page.evaluate(() => {
    const buttons = document.querySelectorAll('button');
    for (const button of buttons) {
      if (button.textContent?.trim() === "Cancel") {
        (button as HTMLElement).click();
        return;
      }
    }
  });

  await new Promise((resolve) => setTimeout(resolve, 2000));

  // Refresh the page to start fresh
  console.log("Refreshing page...");
  await page.reload({ waitUntil: "networkidle0" });
  await new Promise((resolve) => setTimeout(resolve, 2000));

  // Click New Application
  console.log("Clicking New Application...");
  await page.evaluate(() => {
    const buttons = document.querySelectorAll('button');
    for (const button of buttons) {
      if (button.textContent?.includes("New Application")) {
        (button as HTMLElement).click();
        return;
      }
    }
  });

  await new Promise((resolve) => setTimeout(resolve, 2000));

  // Find the name input and enter the name
  console.log("Looking for name input...");
  const inputs = await page.$$('input[type="text"]');
  console.log(`Found ${inputs.length} text inputs`);

  // The second input is the name field (first is team selector)
  if (inputs.length >= 2) {
    const nameInput = inputs[1];
    console.log("Entering app name in second input...");
    await nameInput.click({ clickCount: 3 });
    await nameInput.type(appName, { delay: 30 });
  }

  await new Promise((resolve) => setTimeout(resolve, 1000));

  // Check the terms checkbox
  console.log("Checking terms checkbox...");
  await page.evaluate(() => {
    const checkboxes = document.querySelectorAll('input[type="checkbox"]');
    for (const checkbox of checkboxes) {
      if (!(checkbox as HTMLInputElement).checked) {
        (checkbox as HTMLInputElement).click();
      }
    }
  });

  await new Promise((resolve) => setTimeout(resolve, 500));

  // Take screenshot before clicking Create
  await page.screenshot({ path: "./screenshots/before-create.png" });
  console.log("Screenshot taken: before-create.png");

  // Click Create
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

  // Take screenshot after
  await page.screenshot({ path: "./screenshots/after-create.png" });
  console.log("Screenshot taken: after-create.png");
  console.log("Current URL:", page.url());

  browser.disconnect();
}

const appName = process.argv[2] ?? "Claude Test Bot";
cancelAndRetry(appName).catch(console.error);
