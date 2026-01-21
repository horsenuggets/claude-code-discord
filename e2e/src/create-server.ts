/**
 * Create Server
 *
 * Creates a new Discord server with a given name.
 * Usage: npm run create-server -- "Server Name"
 */

import puppeteer, { type Page } from "puppeteer";
import { appConfig } from "./config.js";

async function findDiscordPage(): Promise<Page> {
  const browser = await puppeteer.connect({
    browserURL: `http://localhost:${appConfig.chromeDebugPort}`,
    defaultViewport: null,
  });

  const pages = await browser.pages();
  const discordPage = pages.find((p) => p.url().includes("discord.com"));

  if (!discordPage) {
    browser.disconnect();
    throw new Error("No Discord page found. Make sure Discord is open in the browser.");
  }

  return discordPage;
}

async function createServer(serverName: string): Promise<void> {
  console.log(`Creating server: ${serverName}`);

  const page = await findDiscordPage();
  console.log(`Found Discord page: ${page.url()}`);

  // Dismiss any tooltips that might be present
  console.log("Checking for tooltips...");
  const buttons = await page.$$('button');
  for (const button of buttons) {
    const text = await button.evaluate((el) => el.textContent);
    if (text?.includes("Got it")) {
      console.log("Dismissing tooltip...");
      await button.click();
      await new Promise((resolve) => setTimeout(resolve, 500));
      break;
    }
  }

  // Click the "Add a Server" button (the + icon in the server list)
  console.log("Looking for Add Server button...");
  const addServerButton = await page.waitForSelector('div[data-list-item-id="guildsnav___create-join-button"]', {
    timeout: 10000,
  });
  if (!addServerButton) {
    throw new Error("Could not find Add Server button");
  }

  // Check if we're already on the customize screen (has server name input)
  const alreadyOnCustomize = await page.evaluate(() => {
    const inputs = document.querySelectorAll('input[type="text"]');
    for (const input of inputs) {
      if ((input as HTMLInputElement).value.toLowerCase().includes("server")) {
        return true;
      }
    }
    return false;
  });

  if (!alreadyOnCustomize) {
    console.log("Clicking Add Server button...");
    await addServerButton.evaluate((el) => (el as HTMLElement).click());
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Wait for the modal to appear and find "Create My Own"
    console.log("Waiting for server creation modal...");

    // Use evaluate to click the button by text content directly in the DOM
    const clickedCreateMyOwn = await page.evaluate(() => {
      const buttons = document.querySelectorAll('button');
      for (const button of buttons) {
        if (button.textContent?.includes("Create My Own")) {
          (button as HTMLElement).click();
          return true;
        }
      }
      return false;
    });

    if (!clickedCreateMyOwn) {
      throw new Error("Could not find Create My Own button");
    }

    console.log("Clicked Create My Own");
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Click "For me and my friends" option
    console.log("Looking for 'For me and my friends' option...");

    const clickedForMe = await page.evaluate(() => {
      const buttons = document.querySelectorAll('button');
      for (const button of buttons) {
        if (button.textContent?.includes("For me and my friends")) {
          (button as HTMLElement).click();
          return true;
        }
      }
      return false;
    });

    if (clickedForMe) {
      console.log("Clicked 'For me and my friends'");
      await new Promise((resolve) => setTimeout(resolve, 2000));
    } else {
      console.log("No server type selection found, continuing...");
    }
  } else {
    console.log("Already on customize screen, skipping initial steps...");
  }

  // Find and fill the server name input (it has no name attr, find by value pattern)
  console.log("Looking for server name input...");

  // Find the text input that contains "server" in its value (the default server name)
  const nameInput = await page.evaluateHandle(() => {
    const inputs = document.querySelectorAll('input[type="text"]');
    for (const input of inputs) {
      if ((input as HTMLInputElement).value.toLowerCase().includes("server")) {
        return input;
      }
    }
    return null;
  });

  if (!nameInput || !(await nameInput.asElement())) {
    throw new Error("Could not find server name input");
  }

  const inputElement = nameInput.asElement();
  if (!inputElement) {
    throw new Error("Could not find server name input element");
  }

  console.log("Entering server name...");
  await inputElement.click({ clickCount: 3 }); // Select all existing text
  await inputElement.type(serverName, { delay: 30 });

  // Click Create button (find by text since it doesn't have type="submit")
  console.log("Looking for Create button...");

  const clickedCreate = await page.evaluate(() => {
    const buttons = document.querySelectorAll('button');
    for (const button of buttons) {
      // Look for a button with exactly "Create" text (not "Create My Own")
      if (button.textContent?.trim() === "Create") {
        (button as HTMLElement).click();
        return true;
      }
    }
    return false;
  });

  if (!clickedCreate) {
    throw new Error("Could not find Create button");
  }

  console.log("Clicked Create button");

  // Wait for server to be created
  await new Promise((resolve) => setTimeout(resolve, 3000));
  console.log(`Server "${serverName}" created successfully!`);

  const browser = page.browser();
  browser.disconnect();
}

// Get server name from command line args
const serverName = process.argv[2] ?? "Test Server";

createServer(serverName).catch((error: unknown) => {
  if (error instanceof Error && error.message.includes("ECONNREFUSED")) {
    console.error("Could not connect to Chrome. Make sure launch-browser is running.");
  } else {
    console.error("Error:", error);
  }
  process.exit(1);
});
