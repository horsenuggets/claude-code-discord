/**
 * Read Messages
 *
 * Connects to the running Chrome instance and reads recent messages from Discord.
 * Usage: npm run read [count]
 */

import puppeteer, { type Page } from "puppeteer";
import { appConfig } from "./config.js";

interface DiscordMessage {
  author: string;
  content: string;
}

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

async function readMessages(count: number = 10): Promise<void> {
  console.log("Connecting to Chrome...");

  const discordPage = await findDiscordPage();
  console.log(`Found Discord page: ${discordPage.url()}`);
  console.log(`Reading last ${count} messages...`);
  console.log("");

  // Get message elements
  const messages = await discordPage.evaluate((messageCount: number): DiscordMessage[] => {
    const messageElements = document.querySelectorAll('[class*="messageContent"]');
    const results: DiscordMessage[] = [];

    // Get the last N messages
    const startIndex = Math.max(0, messageElements.length - messageCount);
    for (let i = startIndex; i < messageElements.length; i++) {
      const el = messageElements[i];
      if (!el) continue;

      const messageContainer = el.closest('[class*="message-"]');

      let author = "Unknown";
      const authorEl = messageContainer?.querySelector('[class*="username"]');
      if (authorEl) {
        author = authorEl.textContent ?? "Unknown";
      }

      results.push({
        author,
        content: el.textContent ?? "",
      });
    }

    return results;
  }, count);

  console.log("=== RECENT MESSAGES ===");
  for (const msg of messages) {
    const content = msg.content.length > 200 ? msg.content.substring(0, 200) + "..." : msg.content;
    console.log(`[${msg.author}]: ${content}`);
    console.log("");
  }

  // Disconnect (keep browser running)
  const browser = discordPage.browser();
  browser.disconnect();
}

const count = parseInt(process.argv[2] ?? "10", 10);
readMessages(count).catch((error: unknown) => {
  if (error instanceof Error && error.message.includes("ECONNREFUSED")) {
    console.error("Could not connect to Chrome. Make sure launch-browser is running.");
  } else {
    console.error("Error:", error);
  }
  process.exit(1);
});
