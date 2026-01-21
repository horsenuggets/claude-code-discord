/**
 * Debug Modal
 *
 * Lists all interactive elements in the current modal.
 */

import puppeteer from "puppeteer";
import { appConfig } from "./config.js";

async function debugModal(): Promise<void> {
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

  console.log("=== Inputs ===");
  const inputs = await page.$$eval("input", (elements) =>
    elements.map((el) => ({
      type: (el as HTMLInputElement).type,
      value: (el as HTMLInputElement).value,
      placeholder: (el as HTMLInputElement).placeholder,
      disabled: (el as HTMLInputElement).disabled,
    }))
  );
  inputs.forEach((input, i) => {
    console.log(`${i + 1}. type="${input.type}" value="${input.value}" placeholder="${input.placeholder}" disabled=${input.disabled}`);
  });

  console.log("\n=== Buttons ===");
  const buttons = await page.$$eval("button", (elements) =>
    elements.map((el) => ({
      text: el.textContent?.trim(),
      disabled: (el as HTMLButtonElement).disabled,
      type: (el as HTMLButtonElement).type,
    }))
  );
  buttons.forEach((btn, i) => {
    console.log(`${i + 1}. "${btn.text}" type="${btn.type}" disabled=${btn.disabled}`);
  });

  console.log("\n=== Select elements ===");
  const selects = await page.$$eval("select, [role='listbox'], [role='combobox']", (elements) =>
    elements.map((el) => ({
      tag: el.tagName,
      role: el.getAttribute("role"),
      text: el.textContent?.trim().slice(0, 50),
    }))
  );
  selects.forEach((sel, i) => {
    console.log(`${i + 1}. ${sel.tag} role="${sel.role}" text="${sel.text}"`);
  });

  browser.disconnect();
}

debugModal().catch(console.error);
