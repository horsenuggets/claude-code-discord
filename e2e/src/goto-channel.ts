/**
 * Go To Channel
 *
 * Navigate directly to a Discord channel by ID.
 * Usage: npm run goto [channel-id]
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

async function gotoChannel(channelId: string): Promise<void> {
  console.log("Connecting to Chrome...");

  const discordPage = await findDiscordPage();
  console.log(`Found Discord page: ${discordPage.url()}`);

  const targetUrl = `https://discord.com/channels/@me/${channelId}`;
  console.log(`Navigating to: ${targetUrl}`);

  await discordPage.goto(targetUrl);
  await new Promise((resolve) => setTimeout(resolve, 2000));

  console.log(`Now at: ${discordPage.url()}`);

  const browser = discordPage.browser();
  browser.disconnect();
}

// Known channel IDs:
// HorsecodeDev DM: 1463443644169191500
const channelId = process.argv[2] ?? "1463443644169191500";
gotoChannel(channelId).catch((error: unknown) => {
  if (error instanceof Error && error.message.includes("ECONNREFUSED")) {
    console.error("Could not connect to Chrome. Make sure launch-browser is running.");
  } else {
    console.error("Error:", error);
  }
  process.exit(1);
});
