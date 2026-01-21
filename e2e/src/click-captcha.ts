/**
 * Click Captcha
 *
 * Clicks the hCaptcha checkbox.
 */

import puppeteer from "puppeteer";
import { appConfig } from "./config.js";

async function clickCaptcha(): Promise<void> {
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

  // hCaptcha is in an iframe, we need to find it
  console.log("Looking for hCaptcha iframe...");

  const frames = page.frames();
  console.log(`Found ${frames.length} frames`);

  for (const frame of frames) {
    const url = frame.url();
    console.log(`Frame URL: ${url}`);

    if (url.includes("hcaptcha")) {
      console.log("Found hCaptcha frame!");

      // Click the checkbox in this frame
      const checkbox = await frame.$('#checkbox');
      if (checkbox) {
        console.log("Found checkbox, clicking...");
        await checkbox.click();
        console.log("Clicked!");
      } else {
        // Try alternative selector
        const altCheckbox = await frame.$('[id="checkbox"]');
        if (altCheckbox) {
          await altCheckbox.click();
          console.log("Clicked alt checkbox!");
        }
      }
    }
  }

  await new Promise((resolve) => setTimeout(resolve, 5000));

  // Screenshot
  await page.screenshot({ path: "./screenshots/after-captcha.png" });
  console.log("Screenshot: after-captcha.png");

  browser.disconnect();
}

clickCaptcha().catch(console.error);
