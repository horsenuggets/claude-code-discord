/**
 * Find Inputs
 *
 * Lists all input elements on the current Discord page.
 */

import puppeteer from "puppeteer";
import { appConfig } from "./config.js";

async function findInputs(): Promise<void> {
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

  console.log("Finding all inputs...\n");

  const inputs = await page.$$eval("input", (elements) =>
    elements.map((el) => ({
      type: el.type,
      name: el.name,
      placeholder: el.placeholder,
      value: el.value,
      className: el.className,
      ariaLabel: el.getAttribute("aria-label"),
    }))
  );

  console.log(`Found ${inputs.length} inputs:\n`);
  inputs.forEach((input, i) => {
    console.log(`${i + 1}. type="${input.type}" name="${input.name}"`);
    if (input.placeholder) console.log(`   placeholder: ${input.placeholder}`);
    if (input.value) console.log(`   value: ${input.value}`);
    if (input.ariaLabel) console.log(`   aria-label: ${input.ariaLabel}`);
    console.log(`   class: ${input.className.slice(0, 80)}...`);
    console.log("");
  });

  browser.disconnect();
}

findInputs().catch(console.error);
