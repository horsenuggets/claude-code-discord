/**
 * Create App Final
 *
 * Creates a Discord application using keyboard typing.
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

  // Click New Application button
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

  // Wait for modal and find the name input
  console.log("Waiting for modal...");
  await new Promise((resolve) => setTimeout(resolve, 1000));

  // Focus on the name input and type
  console.log(`Typing app name: ${appName}`);

  // Click on the visible name input field
  const nameInput = await page.$('input[type="text"]');
  if (nameInput) {
    await nameInput.click();
    await new Promise((resolve) => setTimeout(resolve, 200));
    // Clear any existing text and type
    await nameInput.click({ clickCount: 3 });
    await nameInput.type(appName, { delay: 50 });
  } else {
    console.log("Could not find name input!");
  }

  await new Promise((resolve) => setTimeout(resolve, 500));

  // Check the terms checkbox by clicking it
  console.log("Checking terms checkbox...");
  const checkbox = await page.$('input[type="checkbox"]');
  if (checkbox) {
    const isChecked = await checkbox.evaluate((el) => (el as HTMLInputElement).checked);
    if (!isChecked) {
      await checkbox.click();
    }
  }

  await new Promise((resolve) => setTimeout(resolve, 500));

  // Screenshot before clicking create
  await page.screenshot({ path: "./screenshots/final-before-create.png" });
  console.log("Screenshot: final-before-create.png");

  // Click Create button
  console.log("Clicking Create...");
  const createBtn = await page.evaluateHandle(() => {
    const buttons = document.querySelectorAll('button');
    for (const button of buttons) {
      if (button.textContent?.trim() === "Create") {
        return button;
      }
    }
    return null;
  });

  if (createBtn) {
    const btn = createBtn.asElement();
    if (btn) {
      await btn.click();
      console.log("Clicked Create button");
    }
  }

  await new Promise((resolve) => setTimeout(resolve, 5000));

  // Screenshot after
  await page.screenshot({ path: "./screenshots/final-after-create.png" });
  console.log("Screenshot: final-after-create.png");
  console.log("Current URL:", page.url());

  browser.disconnect();
}

const appName = process.argv[2] ?? "Test Bot Alpha";
createApp(appName).catch(console.error);
