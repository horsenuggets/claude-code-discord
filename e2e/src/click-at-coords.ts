/**
 * Click at Coords
 *
 * Clicks at specific screen coordinates.
 */

import puppeteer from "puppeteer";
import { appConfig } from "./config.js";

async function clickAtCoords(x: number, y: number): Promise<void> {
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

  console.log(`Clicking at coordinates: (${x}, ${y})`);
  await page.mouse.click(x, y);
  console.log("Clicked!");

  await new Promise((resolve) => setTimeout(resolve, 2000));

  // Screenshot
  await page.screenshot({ path: "./screenshots/after-coord-click.png" });
  console.log("Screenshot: after-coord-click.png");

  browser.disconnect();
}

const x = parseInt(process.argv[2] ?? "530");
const y = parseInt(process.argv[3] ?? "320");

clickAtCoords(x, y).catch(console.error);
