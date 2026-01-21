/**
 * Finish Create
 *
 * Assumes we're already on the customize screen. Enters name and clicks Create.
 */

import puppeteer from "puppeteer";
import { appConfig } from "./config.js";

async function finishCreate(serverName: string): Promise<void> {
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

  // Find the server name input
  console.log("Finding server name input...");
  const inputHandle = await page.evaluateHandle(() => {
    const inputs = document.querySelectorAll('input[type="text"]');
    for (const input of inputs) {
      if ((input as HTMLInputElement).value.toLowerCase().includes("server")) {
        return input;
      }
    }
    return null;
  });

  const inputElement = inputHandle.asElement();
  if (!inputElement) {
    throw new Error("Could not find server name input");
  }

  console.log(`Entering server name: ${serverName}`);
  await inputElement.click({ clickCount: 3 });
  await inputElement.type(serverName, { delay: 30 });

  await new Promise((resolve) => setTimeout(resolve, 500));

  // Click Create button
  console.log("Clicking Create button...");
  const clicked = await page.evaluate(() => {
    const buttons = document.querySelectorAll('button');
    for (const button of buttons) {
      if (button.textContent?.trim() === "Create") {
        (button as HTMLElement).click();
        return true;
      }
    }
    return false;
  });

  if (!clicked) {
    throw new Error("Could not find Create button");
  }

  console.log("Clicked Create!");
  await new Promise((resolve) => setTimeout(resolve, 5000));
  console.log("Done!");

  browser.disconnect();
}

const serverName = process.argv[2] ?? "My Test Server";
finishCreate(serverName).catch(console.error);
