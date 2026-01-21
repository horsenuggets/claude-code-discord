/**
 * Scroll
 *
 * Scroll the Discord message area up or down.
 * Usage: npm run scroll [up|down|top|bottom] [amount]
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

async function scroll(direction: string, amount: number): Promise<void> {
  console.log("Connecting to Chrome...");
  const discordPage = await findDiscordPage();
  console.log(`Found Discord page: ${discordPage.url()}`);

  // Find the scrollable message container
  const scrolled = await discordPage.evaluate(
    (dir: string, scrollAmount: number) => {
      // Discord uses a scroller element for messages
      const scroller = document.querySelector('[class*="scroller"][class*="messages"]');
      if (!scroller) {
        // Fallback to any scroller in the main area
        const fallback = document.querySelector(
          '[class*="chatContent"] [class*="scroller"]',
        );
        if (!fallback) return { success: false, message: "No scroller found" };

        if (dir === "up") {
          fallback.scrollTop -= scrollAmount;
        } else if (dir === "down") {
          fallback.scrollTop += scrollAmount;
        } else if (dir === "top") {
          fallback.scrollTop = 0;
        } else if (dir === "bottom") {
          fallback.scrollTop = fallback.scrollHeight;
        }
        return {
          success: true,
          scrollTop: fallback.scrollTop,
          scrollHeight: fallback.scrollHeight,
        };
      }

      if (dir === "up") {
        scroller.scrollTop -= scrollAmount;
      } else if (dir === "down") {
        scroller.scrollTop += scrollAmount;
      } else if (dir === "top") {
        scroller.scrollTop = 0;
      } else if (dir === "bottom") {
        scroller.scrollTop = scroller.scrollHeight;
      }

      return {
        success: true,
        scrollTop: scroller.scrollTop,
        scrollHeight: scroller.scrollHeight,
      };
    },
    direction,
    amount,
  );

  if (scrolled.success) {
    console.log(`Scrolled ${direction} (position: ${scrolled.scrollTop}/${scrolled.scrollHeight})`);
  } else {
    console.log(`Failed to scroll: ${scrolled.message}`);
  }

  // Wait a moment for content to load
  await new Promise((r) => setTimeout(r, 500));

  const browser = discordPage.browser();
  browser.disconnect();
}

const direction = process.argv[2] ?? "down";
const amount = parseInt(process.argv[3] ?? "500", 10);

if (!["up", "down", "top", "bottom"].includes(direction)) {
  console.error("Usage: npm run scroll [up|down|top|bottom] [amount]");
  process.exit(1);
}

scroll(direction, amount).catch((error: unknown) => {
  if (error instanceof Error && error.message.includes("ECONNREFUSED")) {
    console.error("Could not connect to Chrome. Make sure launch-browser is running.");
  } else {
    console.error("Error:", error);
  }
  process.exit(1);
});
