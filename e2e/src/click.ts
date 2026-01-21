/**
 * Click
 *
 * Click an element on the page by selector or text content.
 * Usage: npm run click -- "selector" or npm run click -- "text:Continue in Browser"
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

async function clickElement(selectorOrText: string): Promise<void> {
  console.log("Connecting to Chrome...");

  const discordPage = await findDiscordPage();
  console.log(`Found Discord page: ${discordPage.url()}`);

  if (selectorOrText.startsWith("text:")) {
    // Click by text content
    const text = selectorOrText.slice(5);
    console.log(`Looking for element with text: "${text}"`);

    const clicked = await discordPage.evaluate((searchText) => {
      const elements = document.querySelectorAll("*");
      for (const el of elements) {
        if (el.textContent?.trim() === searchText) {
          (el as HTMLElement).click();
          return true;
        }
      }
      return false;
    }, text);

    if (clicked) {
      console.log(`Clicked element with text: "${text}"`);
    } else {
      console.log(`Could not find element with text: "${text}"`);
    }
  } else {
    // Click by selector
    console.log(`Looking for element: ${selectorOrText}`);
    const element = await discordPage.$(selectorOrText);

    if (element) {
      await element.click();
      console.log(`Clicked: ${selectorOrText}`);
    } else {
      console.log(`Could not find element: ${selectorOrText}`);
    }
  }

  await new Promise((resolve) => setTimeout(resolve, 1000));

  const browser = discordPage.browser();
  browser.disconnect();
}

const selector = process.argv.slice(2).join(" ") || "text:Continue in Browser";
clickElement(selector).catch((error: unknown) => {
  if (error instanceof Error && error.message.includes("ECONNREFUSED")) {
    console.error("Could not connect to Chrome. Make sure launch-browser is running.");
  } else {
    console.error("Error:", error);
  }
  process.exit(1);
});
