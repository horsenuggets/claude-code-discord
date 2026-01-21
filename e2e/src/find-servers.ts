/**
 * Find Servers
 *
 * Lists all server-related elements in the sidebar.
 */

import puppeteer from "puppeteer";
import { appConfig } from "./config.js";

async function findServers(): Promise<void> {
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

  console.log("Finding server elements...\n");

  // Look for elements in the guild nav
  const guildItems = await page.$$eval('[data-list-item-id^="guildsnav___"]', (elements) =>
    elements.map((el) => ({
      id: el.getAttribute("data-list-item-id"),
      ariaLabel: el.getAttribute("aria-label"),
      text: el.textContent?.trim().slice(0, 50),
    }))
  );

  console.log(`Found ${guildItems.length} guild nav items:\n`);
  guildItems.forEach((item, i) => {
    console.log(`${i + 1}. ${item.id}`);
    if (item.ariaLabel) console.log(`   aria-label: ${item.ariaLabel}`);
    if (item.text) console.log(`   text: ${item.text}`);
    console.log("");
  });

  // Also check the URL
  console.log(`Current URL: ${page.url()}`);

  browser.disconnect();
}

findServers().catch(console.error);
