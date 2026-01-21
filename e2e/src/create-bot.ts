/**
 * Create Bot
 *
 * Creates a new Discord bot application in the Developer Portal.
 * Usage: npm run create-bot -- "Bot Name"
 *
 * NOTE: Discord Developer Portal uses hCaptcha verification when creating
 * applications. This script will fill in the form, but you may need to
 * manually solve the CAPTCHA challenge in the browser window.
 */

import puppeteer, { type Page } from "puppeteer";
import { appConfig } from "./config.js";

async function findDiscordPage(): Promise<Page> {
  const browser = await puppeteer.connect({
    browserURL: `http://localhost:${appConfig.chromeDebugPort}`,
    defaultViewport: null,
  });

  const pages = await browser.pages();
  let discordPage = pages.find((p) => p.url().includes("discord.com"));

  if (!discordPage) {
    // Create a new page if none found
    discordPage = await browser.newPage();
  }

  return discordPage;
}

async function createBot(botName: string): Promise<void> {
  console.log(`Creating bot: ${botName}`);

  const page = await findDiscordPage();

  // Navigate to the Developer Portal
  console.log("Navigating to Developer Portal...");
  await page.goto("https://discord.com/developers/applications", {
    waitUntil: "networkidle0",
    timeout: 30000,
  });

  await new Promise((resolve) => setTimeout(resolve, 2000));

  // Check if we need to accept terms
  console.log("Checking for terms acceptance...");
  const acceptedTerms = await page.evaluate(() => {
    const buttons = document.querySelectorAll('button');
    for (const button of buttons) {
      if (button.textContent?.includes("I agree")) {
        (button as HTMLElement).click();
        return true;
      }
    }
    return false;
  });
  if (acceptedTerms) {
    console.log("Accepted developer terms");
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }

  // Click "New Application" button
  console.log("Looking for New Application button...");
  let clickedNewApp = false;
  for (let i = 0; i < 10; i++) {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    clickedNewApp = await page.evaluate(() => {
      const buttons = document.querySelectorAll('button');
      for (const button of buttons) {
        if (button.textContent?.includes("New Application")) {
          (button as HTMLElement).click();
          return true;
        }
      }
      return false;
    });
    if (clickedNewApp) break;
  }

  if (!clickedNewApp) {
    throw new Error("Could not find New Application button");
  }

  console.log("Clicked New Application");
  await new Promise((resolve) => setTimeout(resolve, 2000));

  // Enter the application name
  console.log("Looking for name input...");
  const nameInput = await page.waitForSelector('input[placeholder*="name" i], input[type="text"]', {
    timeout: 10000,
  });

  if (nameInput) {
    console.log("Entering bot name...");
    await nameInput.click({ clickCount: 3 });
    await nameInput.type(botName, { delay: 30 });
  }

  await new Promise((resolve) => setTimeout(resolve, 1000));

  // Accept the terms checkbox if present
  const acceptedCheckbox = await page.evaluate(() => {
    const checkboxes = document.querySelectorAll('input[type="checkbox"]');
    for (const checkbox of checkboxes) {
      if (!(checkbox as HTMLInputElement).checked) {
        (checkbox as HTMLInputElement).click();
        return true;
      }
    }
    return false;
  });
  if (acceptedCheckbox) {
    console.log("Checked terms checkbox");
  }

  await new Promise((resolve) => setTimeout(resolve, 500));

  // Click Create button
  console.log("Clicking Create button...");
  const clickedCreate = await page.evaluate(() => {
    const buttons = document.querySelectorAll('button');
    for (const button of buttons) {
      if (button.textContent?.trim() === "Create") {
        (button as HTMLElement).click();
        return true;
      }
    }
    return false;
  });

  if (!clickedCreate) {
    throw new Error("Could not find Create button");
  }

  console.log("Clicked Create!");
  await new Promise((resolve) => setTimeout(resolve, 3000));

  // Now we should be on the application page. Navigate to Bot section.
  console.log("Navigating to Bot section...");
  const clickedBot = await page.evaluate(() => {
    const links = document.querySelectorAll('a, div[role="button"]');
    for (const link of links) {
      if (link.textContent?.trim() === "Bot") {
        (link as HTMLElement).click();
        return true;
      }
    }
    return false;
  });

  if (clickedBot) {
    console.log("Clicked Bot section");
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }

  // Click "Add Bot" or "Reset Token" to create/get the bot token
  console.log("Looking for Add Bot button...");
  const clickedAddBot = await page.evaluate(() => {
    const buttons = document.querySelectorAll('button');
    for (const button of buttons) {
      if (button.textContent?.includes("Add Bot")) {
        (button as HTMLElement).click();
        return true;
      }
    }
    return false;
  });

  if (clickedAddBot) {
    console.log("Clicked Add Bot");
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Confirm in the modal
    const confirmed = await page.evaluate(() => {
      const buttons = document.querySelectorAll('button');
      for (const button of buttons) {
        if (button.textContent?.includes("Yes, do it")) {
          (button as HTMLElement).click();
          return true;
        }
      }
      return false;
    });
    if (confirmed) {
      console.log("Confirmed bot creation");
    }
  }

  await new Promise((resolve) => setTimeout(resolve, 3000));
  console.log(`Bot "${botName}" created successfully!`);
  console.log("Current URL:", page.url());

  const browser = page.browser();
  browser.disconnect();
}

const botName = process.argv[2] ?? "Test Bot";

createBot(botName).catch((error: unknown) => {
  if (error instanceof Error && error.message.includes("ECONNREFUSED")) {
    console.error("Could not connect to Chrome. Make sure launch-browser is running.");
  } else {
    console.error("Error:", error);
  }
  process.exit(1);
});
