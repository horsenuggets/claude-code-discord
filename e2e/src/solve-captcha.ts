/**
 * Solve Captcha
 *
 * Attempts to solve the hCaptcha image challenge.
 */

import puppeteer from "puppeteer";
import { appConfig } from "./config.js";

async function solveCaptcha(): Promise<void> {
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

  // Find the hCaptcha challenge frame
  console.log("Looking for hCaptcha challenge frame...");

  const frames = page.frames();

  for (const frame of frames) {
    const url = frame.url();
    if (url.includes("hcaptcha") && url.includes("challenge")) {
      console.log("Found challenge frame!");

      // The grid is typically 3x3, look for clickable cells
      // Try clicking the different-looking one (the fish at position 7 - bottom middle)
      // Grid positions: 0 1 2
      //                 3 4 5
      //                 6 7 8

      // Look for task grid cells
      const cells = await frame.$$('.task-image, [class*="task"]');
      console.log(`Found ${cells.length} cells`);

      if (cells.length > 0) {
        // The fish appears to be at index 7 (bottom middle)
        // Let's click it
        const targetIndex = 7; // Bottom middle
        if (cells[targetIndex]) {
          console.log(`Clicking cell ${targetIndex}...`);
          await cells[targetIndex].click();
        }
      } else {
        // Alternative: click by coordinates on the grid
        // The grid appears to be roughly 200x200 pixels, centered
        // Click the bottom middle cell
        console.log("Trying coordinate click...");

        // Get frame bounding box or click in the center-bottom area
        await frame.click('body', { offset: { x: 240, y: 280 } }).catch(() => {
          console.log("Coordinate click failed");
        });
      }
    }
  }

  await new Promise((resolve) => setTimeout(resolve, 3000));

  // Screenshot
  await page.screenshot({ path: "./screenshots/after-solve.png" });
  console.log("Screenshot: after-solve.png");

  browser.disconnect();
}

solveCaptcha().catch(console.error);
