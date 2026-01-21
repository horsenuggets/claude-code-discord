/**
 * Drag Pipe 2
 *
 * Drags the pipe piece with better coordinates.
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

  // First take a screenshot to check current state
  await page.screenshot({ path: "./screenshots/before-drag2.png" });

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
          console.log(`Frame bounding box: x=${box.x}, y=${box.y}, w=${box.width}, h=${box.height}`);

          // The puzzle area within the frame:
          // Looking at the image, the pipe puzzle is in the center
          // The draggable piece is in the top-right area with "Move" label
          // It needs to go into the horizontal pipe in the middle

          // Puzzle area seems to be offset about 65px from frame top, 70px from left
          // Grid appears to be about 200x150 pixels

          // Pipe piece (source) - in the top right "Move" area
          // Roughly at: frame_x + 195, frame_y + 85
          const sourceX = box.x + 195;
          const sourceY = box.y + 85;

          // Target - the gap in the horizontal pipe (middle)
          // Roughly at: frame_x + 145, frame_y + 120
          const targetX = box.x + 145;
          const targetY = box.y + 120;

          console.log(`Source (pipe piece): (${sourceX}, ${sourceY})`);
          console.log(`Target (pipe gap): (${targetX}, ${targetY})`);

          // Perform drag
          console.log("Starting drag...");
          await page.mouse.move(sourceX, sourceY);
          await new Promise(r => setTimeout(r, 200));
          await page.mouse.down();
          await new Promise(r => setTimeout(r, 200));

          // Move in steps
          const steps = 20;
          for (let i = 1; i <= steps; i++) {
            const x = sourceX + (targetX - sourceX) * (i / steps);
            const y = sourceY + (targetY - sourceY) * (i / steps);
            await page.mouse.move(x, y);
            await new Promise(r => setTimeout(r, 30));
          }

          await new Promise(r => setTimeout(r, 200));
          await page.mouse.up();
          console.log("Drag completed!");
        }
      }
      break;
    }
  }

  await new Promise((resolve) => setTimeout(resolve, 3000));

  // Screenshot
  await page.screenshot({ path: "./screenshots/after-drag2.png" });
  console.log("Screenshot: after-drag2.png");

  browser.disconnect();
}

dragPipe().catch(console.error);
