/**
 * Login
 *
 * Automatically logs into Discord using credentials from .env file.
 * Usage: npm run login
 */

import puppeteer, { type Page } from "puppeteer";
import { appConfig } from "./config.js";

async function findDiscordPage(): Promise<Page> {
  const browser = await puppeteer.connect({
    browserURL: `http://localhost:${appConfig.chromeDebugPort}`,
    defaultViewport: null,
  });

  const pages = await browser.pages();
  const discordPage = pages.find((p) => p.url().includes("discord.com"));

  if (!discordPage) {
    browser.disconnect();
    throw new Error("No Discord page found. Make sure Discord is open in the browser.");
  }

  return discordPage;
}

async function login(): Promise<void> {
  const { discordEmail, discordPassword } = appConfig;

  if (!discordEmail || !discordPassword) {
    throw new Error("DISCORD_EMAIL and DISCORD_PASSWORD must be set in .env");
  }

  console.log("Connecting to Chrome...");
  const discordPage = await findDiscordPage();
  console.log(`Found Discord page: ${discordPage.url()}`);

  // Check if we're on the login page
  const url = discordPage.url();
  if (!url.includes("login")) {
    console.log("Not on login page. Current URL:", url);
    console.log("Navigating to login page...");
    await discordPage.goto("https://discord.com/login");
    await discordPage.waitForNetworkIdle({ timeout: 10000 });
  }

  // Wait for login form
  console.log("Looking for email input...");
  const emailInput = await discordPage.waitForSelector('input[name="email"]', { timeout: 10000 });
  if (!emailInput) {
    throw new Error("Could not find email input");
  }

  console.log("Entering email...");
  await emailInput.click({ clickCount: 3 }); // Select all existing text
  await emailInput.type(discordEmail, { delay: 30 });

  console.log("Looking for password input...");
  const passwordInput = await discordPage.waitForSelector('input[name="password"]', {
    timeout: 5000,
  });
  if (!passwordInput) {
    throw new Error("Could not find password input");
  }

  console.log("Entering password...");
  await passwordInput.click();
  await passwordInput.type(discordPassword, { delay: 30 });

  // Find and click login button
  console.log("Looking for login button...");
  const loginButton = await discordPage.waitForSelector('button[type="submit"]', {
    timeout: 5000,
  });
  if (!loginButton) {
    throw new Error("Could not find login button");
  }

  console.log("Clicking login button...");
  await loginButton.click();

  // Wait for navigation
  console.log("Waiting for login to complete...");
  await discordPage.waitForNavigation({ timeout: 30000 }).catch(() => {
    // Navigation might not happen if there's a CAPTCHA or error
  });

  // Check if we logged in successfully
  await new Promise((resolve) => setTimeout(resolve, 3000));
  const newUrl = discordPage.url();
  console.log("Current URL:", newUrl);

  if (newUrl.includes("channels")) {
    console.log("Login successful!");
  } else if (newUrl.includes("login")) {
    console.log("Still on login page. There might be a CAPTCHA or error.");
    console.log("Please complete the login manually in the browser.");
  }

  const browser = discordPage.browser();
  browser.disconnect();
}

login().catch((error: unknown) => {
  if (error instanceof Error && error.message.includes("ECONNREFUSED")) {
    console.error("Could not connect to Chrome. Make sure launch-browser is running.");
  } else {
    console.error("Error:", error);
  }
  process.exit(1);
});
