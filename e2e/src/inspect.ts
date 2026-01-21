/**
 * Inspect
 *
 * Inspect the Discord page HTML to find servers, channels, and other navigation elements.
 * Usage: npm run inspect [servers|channels|messages|all]
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

interface ServerInfo {
  name: string;
  href: string;
  guildId: string | null;
}

interface ChannelInfo {
  name: string;
  href: string;
  channelId: string | null;
  type: string;
}

interface MessageInfo {
  author: string;
  content: string;
  timestamp: string;
}

async function getServers(page: Page): Promise<ServerInfo[]> {
  return await page.evaluate(() => {
    const servers: { name: string; href: string; guildId: string | null }[] = [];

    // Find all server links in the guild nav
    const guildNav = document.querySelector('[data-list-id="guildsnav"]');
    if (!guildNav) return servers;

    const links = guildNav.querySelectorAll("a[href]");
    links.forEach((link) => {
      const href = link.getAttribute("href") || "";
      const ariaLabel = link.getAttribute("aria-label") || "";
      const name = ariaLabel.replace(/, \d+ notification.*$/, "").trim();

      // Extract guild ID from href like /channels/1234567890
      const match = href.match(/\/channels\/(\d+)/);
      const guildId = match ? match[1] : null;

      if (name && guildId) {
        servers.push({ name, href, guildId });
      }
    });

    return servers;
  });
}

async function getChannels(page: Page): Promise<ChannelInfo[]> {
  return await page.evaluate(() => {
    const channels: { name: string; href: string; channelId: string | null; type: string }[] = [];

    // Find all channel links in the channel list
    const channelLinks = document.querySelectorAll('a[href*="/channels/"][data-list-item-id]');
    channelLinks.forEach((link) => {
      const href = link.getAttribute("href") || "";
      const nameEl = link.querySelector('[class*="name"]');
      const name = nameEl?.textContent?.trim() || "";

      // Extract channel ID from href
      const match = href.match(/\/channels\/\d+\/(\d+)/);
      const channelId = match ? match[1] : null;

      // Determine channel type from icon or class
      const isVoice = link.querySelector('[class*="voice"]') !== null;
      const type = isVoice ? "voice" : "text";

      if (name && channelId) {
        channels.push({ name, href, channelId, type });
      }
    });

    return channels;
  });
}

async function getMessages(page: Page, limit: number = 10): Promise<MessageInfo[]> {
  return await page.evaluate((msgLimit) => {
    const messages: { author: string; content: string; timestamp: string }[] = [];

    const messageEls = document.querySelectorAll('[class*="message-"]');
    const msgArray = Array.from(messageEls).slice(-msgLimit);

    msgArray.forEach((msg) => {
      const authorEl = msg.querySelector('[class*="username"]');
      const contentEl = msg.querySelector('[class*="messageContent"]');
      const timestampEl = msg.querySelector("time");

      const author = authorEl?.textContent?.trim() || "Unknown";
      const content = contentEl?.textContent?.trim() || "";
      const timestamp = timestampEl?.getAttribute("datetime") || "";

      if (content) {
        messages.push({ author, content, timestamp });
      }
    });

    return messages;
  }, limit);
}

async function getCurrentLocation(page: Page): Promise<{ url: string; serverName: string | null }> {
  return await page.evaluate(() => {
    const url = window.location.href;
    const headerEl = document.querySelector('[class*="header"] h1, [class*="title"]');
    const serverName = headerEl?.textContent?.trim() || null;
    return { url, serverName };
  });
}

async function main(): Promise<void> {
  const mode = process.argv[2] ?? "all";

  console.log("Connecting to Chrome...");
  const discordPage = await findDiscordPage();

  const location = await getCurrentLocation(discordPage);
  console.log(`\nCurrent URL: ${location.url}`);
  if (location.serverName) {
    console.log(`Current location: ${location.serverName}`);
  }

  if (mode === "servers" || mode === "all") {
    console.log("\n=== Servers ===");
    const servers = await getServers(discordPage);
    if (servers.length === 0) {
      console.log("No servers found");
    } else {
      servers.forEach((s) => {
        console.log(`  ${s.name}: ${s.guildId} (${s.href})`);
      });
    }
  }

  if (mode === "channels" || mode === "all") {
    console.log("\n=== Channels ===");
    const channels = await getChannels(discordPage);
    if (channels.length === 0) {
      console.log("No channels found (may need to be in a server)");
    } else {
      channels.forEach((c) => {
        console.log(`  #${c.name} [${c.type}]: ${c.channelId} (${c.href})`);
      });
    }
  }

  if (mode === "messages" || mode === "all") {
    console.log("\n=== Recent Messages ===");
    const messages = await getMessages(discordPage);
    if (messages.length === 0) {
      console.log("No messages found");
    } else {
      messages.forEach((m) => {
        const preview = m.content.length > 80 ? m.content.slice(0, 80) + "..." : m.content;
        console.log(`  [${m.author}]: ${preview}`);
      });
    }
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
