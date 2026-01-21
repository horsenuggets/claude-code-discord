/**
 * Create App Simple
 *
 * Creates a Discord application with a simple approach.
 */

import puppeteer from "puppeteer";
import { appConfig } from "./config.js";

async function createApp(appName: string): Promise<void> {
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

  // Close any existing modal first
  console.log("Closing any existing modal...");
  await page.keyboard.press("Escape");
  await new Promise((resolve) => setTimeout(resolve, 1000));

  // Refresh to get a clean state
  console.log("Refreshing page...");
  await page.goto("https://discord.com/developers/applications", {
    waitUntil: "networkidle0",
  });
  await new Promise((resolve) => setTimeout(resolve, 2000));

  // Click New Application
  console.log("Clicking New Application...");
  const newAppBtn = await page.waitForSelector('button:has-text("New Application")', {
    timeout: 5000,
  }).catch(() => null);

  if (newAppBtn) {
    await newAppBtn.click();
  } else {
    // Fallback: find by text
    await page.evaluate(() => {
      const buttons = document.querySelectorAll('button');
      for (const button of buttons) {
        if (button.textContent?.includes("New Application")) {
          (button as HTMLElement).click();
          return;
        }
      }
    });
  }

  await new Promise((resolve) => setTimeout(resolve, 2000));

  // Wait for and fill the name input
  console.log("Looking for name input...");
  await page.waitForSelector('input', { timeout: 10000 });

  // Type in the input that's visible - the Name field
  console.log(`Typing app name: ${appName}`);
  // First, click on the visible input with label "Name"
  await page.evaluate((name) => {
    const inputs = document.querySelectorAll('input[type="text"]');
    // Find the one that's empty or the first visible one
    for (const input of inputs) {
      const inp = input as HTMLInputElement;
      if (inp.offsetParent !== null) { // Check if visible
        inp.focus();
        inp.value = name;
        // Trigger React's onChange
        const event = new Event('input', { bubbles: true });
        inp.dispatchEvent(event);
        break;
      }
    }
  }, appName);

  await new Promise((resolve) => setTimeout(resolve, 500));

  // Check the terms checkbox
  console.log("Checking terms checkbox...");
  await page.evaluate(() => {
    const checkboxes = document.querySelectorAll('input[type="checkbox"]');
    for (const checkbox of checkboxes) {
      const cb = checkbox as HTMLInputElement;
      if (!cb.checked) {
        cb.click();
      }
    }
  });

  await new Promise((resolve) => setTimeout(resolve, 500));

  // Screenshot before clicking create
  await page.screenshot({ path: "./screenshots/app-before-create.png" });
  console.log("Screenshot: app-before-create.png");

  // Click Create
  console.log("Clicking Create...");
  await page.evaluate(() => {
    const buttons = document.querySelectorAll('button');
    for (const button of buttons) {
      if (button.textContent?.trim() === "Create") {
        (button as HTMLElement).click();
        return;
      }
    }
  });

  await new Promise((resolve) => setTimeout(resolve, 5000));

  // Screenshot after
  await page.screenshot({ path: "./screenshots/app-after-create.png" });
  console.log("Screenshot: app-after-create.png");
  console.log("Current URL:", page.url());

  browser.disconnect();
}

const appName = process.argv[2] ?? "Test Bot Alpha";
createApp(appName).catch(console.error);
