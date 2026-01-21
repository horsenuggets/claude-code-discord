/**
 * Navigate
 *
 * Navigate to a specific Discord DM or close popups.
 * Usage: npm run nav [close-popup|horsecode|horsecode-dev]
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

async function closePopups(page: Page): Promise<void> {
  // Try to close any modal/popup by pressing Escape or clicking X
  try {
    // Look for close button (X) in modals
    const closeButton = await page.$('button[aria-label="Close"]');
    if (closeButton) {
      await closeButton.click();
      console.log("Closed popup via close button");
      await new Promise((r) => setTimeout(r, 500));
      return;
    }

    // Try clicking the X button in the modal
    const modalClose = await page.$('div[class*="modal"] svg[class*="close"]');
    if (modalClose) {
      await modalClose.click();
      console.log("Closed modal");
      await new Promise((r) => setTimeout(r, 500));
      return;
    }

    // Press Escape to close any popup
    await page.keyboard.press("Escape");
    console.log("Pressed Escape to close any popup");
    await new Promise((r) => setTimeout(r, 500));
  } catch {
    console.log("No popup to close");
  }
}

async function searchAndStartDM(page: Page, username: string): Promise<void> {
  // Click on "Find or start a conversation" search bar
  const searchButton = await page.$('button[aria-label="Find or start a conversation"]');
  if (searchButton) {
    await searchButton.click();
    console.log("Clicked search button");
    await new Promise((r) => setTimeout(r, 500));
  } else {
    // Try finding by placeholder text
    const searchInput = await page.$('input[placeholder*="Find or start"]');
    if (searchInput) {
      await searchInput.click();
      console.log("Clicked search input");
      await new Promise((r) => setTimeout(r, 500));
    }
  }

  // Type the username to search
  await page.keyboard.type(`@${username}`, { delay: 50 });
  console.log(`Typed search query: @${username}`);
  await new Promise((r) => setTimeout(r, 1000));

  // Look for the result and click it
  const results = await page.$$('div[class*="result"], li[class*="option"]');
  for (const result of results) {
    const text = await result.evaluate((el) => el.textContent);
    if (text?.toLowerCase().includes(username.toLowerCase())) {
      await result.click();
      console.log(`Clicked on ${username} in search results`);
      await new Promise((r) => setTimeout(r, 1000));
      return;
    }
  }

  // Try clicking the first result
  const firstResult = await page.$(
    'div[class*="result"]:first-child, li[class*="option"]:first-child',
  );
  if (firstResult) {
    await firstResult.click();
    console.log("Clicked first search result");
    await new Promise((r) => setTimeout(r, 1000));
    return;
  }

  console.log("Could not find user in search results");
}

async function navigateToDM(page: Page, botName: string): Promise<void> {
  // Find and click on the bot in the DM list
  const botButton = await page.$(`a[aria-label*="${botName}"]`);
  if (botButton) {
    await botButton.click();
    console.log(`Clicked on ${botName} DM`);
    await new Promise((r) => setTimeout(r, 1000));
    return;
  }

  // Try finding by text content
  const dmLinks = await page.$$('a[class*="channel"]');
  for (const link of dmLinks) {
    const text = await link.evaluate((el) => el.textContent);
    if (text?.toLowerCase().includes(botName.toLowerCase())) {
      await link.click();
      console.log(`Clicked on ${botName} DM (found by text)`);
      await new Promise((r) => setTimeout(r, 1000));
      return;
    }
  }

  // Try searching for the bot
  console.log(`Could not find ${botName} in DM list, trying search...`);
  await searchAndStartDM(page, botName);
}

async function navigateToUrl(page: Page, url: string): Promise<void> {
  console.log(`Navigating to: ${url}`);
  await page.goto(url, { waitUntil: "networkidle2" });
  console.log(`Now at: ${page.url()}`);
}

async function main(): Promise<void> {
  const action = process.argv[2] ?? "horsecode";

  console.log("Connecting to Chrome...");
  const discordPage = await findDiscordPage();
  console.log(`Found Discord page: ${discordPage.url()}`);

  // Handle direct URL navigation
  if (action.startsWith("http://") || action.startsWith("https://")) {
    await closePopups(discordPage);
    await navigateToUrl(discordPage, action);
  } else if (action === "close-popup" || action === "close") {
    await closePopups(discordPage);
  } else if (action === "horsecode" || action === "prod") {
    await closePopups(discordPage);
    await navigateToDM(discordPage, "Horsecode");
  } else if (action === "horsecode-dev" || action === "dev") {
    await closePopups(discordPage);
    await navigateToDM(discordPage, "HorsecodeDev");
  } else {
    // Assume it's a custom search term
    await closePopups(discordPage);
    await searchAndStartDM(discordPage, action);
  }

  const browser = discordPage.browser();
  browser.disconnect();
}

main().catch((error: unknown) => {
  if (error instanceof Error && error.message.includes("ECONNREFUSED")) {
    console.error("Could not connect to Chrome. Make sure launch-browser is running.");
  } else {
    console.error("Error:", error);
  }
  process.exit(1);
});
