/**
 * Open Create Modal
 *
 * Opens the server creation modal and navigates to the customize screen.
 */

import puppeteer from "puppeteer";
import { appConfig } from "./config.js";

async function openCreateModal(): Promise<void> {
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

  // Click the "Add a Server" button
  console.log("Looking for Add Server button...");
  const addServerButton = await page.waitForSelector('div[data-list-item-id="guildsnav___create-join-button"]', {
    timeout: 10000,
  });

  if (!addServerButton) {
    throw new Error("Could not find Add Server button");
  }

  console.log("Clicking Add Server button...");
  await addServerButton.evaluate((el) => (el as HTMLElement).click());
  await new Promise((resolve) => setTimeout(resolve, 2000));

  // Click "Create My Own"
  console.log("Clicking Create My Own...");
  await page.evaluate(() => {
    const buttons = document.querySelectorAll('button');
    for (const button of buttons) {
      if (button.textContent?.includes("Create My Own")) {
        (button as HTMLElement).click();
        return;
      }
    }
  });
  await new Promise((resolve) => setTimeout(resolve, 2000));

  // Click "For me and my friends"
  console.log("Clicking 'For me and my friends'...");
  await page.evaluate(() => {
    const buttons = document.querySelectorAll('button');
    for (const button of buttons) {
      if (button.textContent?.includes("For me and my friends")) {
        (button as HTMLElement).click();
        return;
      }
    }
  });
  await new Promise((resolve) => setTimeout(resolve, 2000));

  console.log("Modal should now be on customize screen");
  browser.disconnect();
}

openCreateModal().catch(console.error);
