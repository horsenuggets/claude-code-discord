/**
 * Drag Pipe
 *
 * Drags the pipe piece to complete the puzzle.
 */

import puppeteer from "puppeteer";
import { appConfig } from "./config.js";

async function dragPipe(): Promise<void> {
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

  // Find the challenge frame
  const frames = page.frames();
  for (const frame of frames) {
    const url = frame.url();
    if (url.includes("hcaptcha") && url.includes("challenge")) {
      console.log("Found challenge frame!");

      const frameElement = await frame.frameElement();
      if (frameElement) {
        const box = await frameElement.boundingBox();
        if (box) {
          console.log(`Frame at: x=${box.x}, y=${box.y}`);

          // The puzzle shows:
          // - Pipe piece on the right side (needs to be dragged)
          // - Empty slot in the middle of the pipe system

          // Looking at the image:
          // - Source (pipe piece): approximately at x=615, y=215 in the frame
          // - Target (empty slot): approximately at x=510, y=285 in the frame

          // Convert to page coordinates
          const sourceX = box.x + 180; // Right side where the pipe piece is
          const sourceY = box.y + 90;  // Upper area

          const targetX = box.x + 120; // Center where the gap is
          const targetY = box.y + 140; // Middle of the pipe

          console.log(`Dragging from (${sourceX}, ${sourceY}) to (${targetX}, ${targetY})`);

          // Perform drag and drop
          await page.mouse.move(sourceX, sourceY);
          await page.mouse.down();
          await new Promise(r => setTimeout(r, 100));

          // Move slowly to target
          const steps = 10;
          for (let i = 1; i <= steps; i++) {
            const x = sourceX + (targetX - sourceX) * (i / steps);
            const y = sourceY + (targetY - sourceY) * (i / steps);
            await page.mouse.move(x, y);
            await new Promise(r => setTimeout(r, 50));
          }

          await page.mouse.up();
          console.log("Drag completed!");
        }
      }
      break;
    }
  }

  await new Promise((resolve) => setTimeout(resolve, 3000));

  // Screenshot
  await page.screenshot({ path: "./screenshots/after-drag.png" });
  console.log("Screenshot: after-drag.png");

  browser.disconnect();
}

dragPipe().catch(console.error);
