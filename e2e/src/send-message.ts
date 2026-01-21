/**
 * Send Message
 *
 * Connects to the running Chrome instance and sends a message to the current Discord channel.
 * Usage: npm run send -- "Your message here"
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

async function sendMessage(message: string): Promise<void> {
  if (!message) {
    console.log('Usage: npm run send -- "Your message here"');
    process.exit(1);
  }

  console.log("Connecting to Chrome...");

  const discordPage = await findDiscordPage();
  console.log(`Found Discord page: ${discordPage.url()}`);
  console.log(`Sending message: "${message}"`);

  // Find the message input and type the message
  const messageInput = await discordPage.$('div[role="textbox"][data-slate-editor="true"]');

  if (!messageInput) {
    throw new Error("Could not find message input. Make sure you're in a DM or channel.");
  }

  // Click the input to focus it
  await messageInput.click();

  // Type the message
  await discordPage.keyboard.type(message, { delay: 20 });

  // Press Enter to send
  await discordPage.keyboard.press("Enter");

  console.log("Message sent!");

  // Wait a moment for the message to be sent
  await new Promise((resolve) => setTimeout(resolve, 1000));

  // Disconnect (keep browser running)
  const browser = discordPage.browser();
  browser.disconnect();
}

const message = process.argv.slice(2).join(" ");
sendMessage(message).catch((error: unknown) => {
  if (error instanceof Error && error.message.includes("ECONNREFUSED")) {
    console.error("Could not connect to Chrome. Make sure launch-browser is running.");
  } else {
    console.error("Error:", error);
  }
  process.exit(1);
});
