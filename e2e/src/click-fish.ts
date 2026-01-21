/**
 * Click Fish
 *
 * Clicks on the fish image in the captcha grid.
 */

import puppeteer from "puppeteer";
import { appConfig } from "./config.js";

async function clickFish(): Promise<void> {
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

  // The captcha grid is visible on the main page
  // Let's click directly on the fish location using page coordinates
  // The fish is at bottom middle of the grid

  // First, let's find the captcha modal's position
  console.log("Looking for captcha grid...");

  // Take a screenshot first to analyze
  const screenshot = await page.screenshot({ encoding: "base64" });

  // The fish appears to be at approximately:
  // Grid starts around x=415, y=195
  // Each cell is about 65x65 pixels
  // Fish is at row 2 (bottom), column 1 (middle) = position (1, 2)
  // So fish center would be around: x=415+65+32=512, y=195+130+32=357

  // Actually, looking at the screenshot, the grid is within the hcaptcha iframe
  // We need to click within the challenge frame

  const frames = page.frames();
  for (const frame of frames) {
    const url = frame.url();
    if (url.includes("hcaptcha") && url.includes("challenge")) {
      console.log("Found challenge frame!");

      // Get all clickable areas in the grid
      // Try clicking at bottom-middle of the grid (where the fish is)
      // Grid cells are typically around 67px each in a 3x3 layout
      // Fish position: column 1 (middle), row 2 (bottom)

      // Click at coordinates within the frame
      // Grid appears to start at around (65, 55) and each cell is ~67x67
      // Fish center: x = 65 + 67 + 33 = 165, y = 55 + 134 + 33 = 222

      try {
        // Try using mouse to click at specific coordinates
        const frameElement = await frame.frameElement();
        if (frameElement) {
          const box = await frameElement.boundingBox();
          if (box) {
            console.log(`Frame bounding box: x=${box.x}, y=${box.y}, w=${box.width}, h=${box.height}`);

            // Fish is at bottom middle of the 3x3 grid
            // Grid is roughly 200x200 within the frame, starting around (65, 55)
            const gridStartX = 65;
            const gridStartY = 55;
            const cellWidth = 67;
            const cellHeight = 67;

            // Fish position: col=1 (middle), row=2 (bottom)
            const fishX = box.x + gridStartX + cellWidth * 1 + cellWidth / 2;
            const fishY = box.y + gridStartY + cellHeight * 2 + cellHeight / 2;

            console.log(`Clicking fish at: x=${fishX}, y=${fishY}`);
            await page.mouse.click(fishX, fishY);
            console.log("Clicked fish!");
          }
        }
      } catch (e) {
        console.log("Error clicking:", e);
      }

      break;
    }
  }

  await new Promise((resolve) => setTimeout(resolve, 2000));

  // Screenshot
  await page.screenshot({ path: "./screenshots/after-fish-click.png" });
  console.log("Screenshot: after-fish-click.png");

  browser.disconnect();
}

clickFish().catch(console.error);
