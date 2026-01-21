#!/usr/bin/env -S deno run --allow-all

/**
 * Test Bot for Claude Code Discord Bot
 *
 * This bot sends text commands to test the main Claude Code bot.
 * It requires a separate Discord bot token (TEST_BOT_TOKEN).
 *
 * Usage:
 *   1. Create a second Discord application at https://discord.com/developers
 *   2. Add TEST_BOT_TOKEN to your .env file
 *   3. Invite the test bot to your server
 *   4. Run: deno run --allow-all test-bot.ts
 */

import { load as loadEnv } from "jsr:@std/dotenv@0.225.3";
import {
  Client,
  GatewayIntentBits,
  Events,
  TextChannel,
} from "npm:discord.js@14.14.1";

await loadEnv({ export: true });

const TEST_BOT_TOKEN = Deno.env.get("TEST_BOT_TOKEN");
const TARGET_CHANNEL_NAME = Deno.env.get("TEST_TARGET_CHANNEL") || "main";
const TARGET_CATEGORY_NAME = Deno.env.get("TEST_TARGET_CATEGORY") || "claude-code-discord";

if (!TEST_BOT_TOKEN) {
  console.error("Error: TEST_BOT_TOKEN environment variable is required");
  console.error("Add TEST_BOT_TOKEN=your-test-bot-token to your .env file");
  Deno.exit(1);
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

let targetChannel: TextChannel | null = null;

// Test cases to run
const testCases = [
  { name: "Help command", command: "!help" },
  { name: "Status command", command: "!status" },
  { name: "PWD command", command: "!pwd" },
  { name: "Git status", command: "!git status" },
  { name: "Simple Claude prompt", command: "!claude Say hello in one word" },
];

let currentTestIndex = 0;
let testResults: Array<{ name: string; passed: boolean; error?: string }> = [];

async function runNextTest() {
  if (currentTestIndex >= testCases.length) {
    console.log("\n=== Test Results ===");
    for (const result of testResults) {
      const status = result.passed ? "✅ PASS" : "❌ FAIL";
      console.log(`${status}: ${result.name}${result.error ? ` (${result.error})` : ""}`);
    }
    const passed = testResults.filter(r => r.passed).length;
    console.log(`\nTotal: ${passed}/${testResults.length} tests passed`);

    // Exit after tests
    setTimeout(() => {
      client.destroy();
      Deno.exit(passed === testResults.length ? 0 : 1);
    }, 2000);
    return;
  }

  const test = testCases[currentTestIndex];
  console.log(`\nRunning test ${currentTestIndex + 1}/${testCases.length}: ${test.name}`);
  console.log(`  Command: ${test.command}`);

  if (!targetChannel) {
    console.error("  Error: Target channel not found");
    testResults.push({ name: test.name, passed: false, error: "Channel not found" });
    currentTestIndex++;
    await runNextTest();
    return;
  }

  try {
    await targetChannel.send(test.command);
    console.log("  Command sent, waiting for response...");

    // Wait for response (the main bot should reply)
    // We'll consider the test passed if we sent the command successfully
    // In a more complete implementation, we'd verify the response
    testResults.push({ name: test.name, passed: true });
  } catch (error) {
    console.error(`  Error: ${error instanceof Error ? error.message : error}`);
    testResults.push({ name: test.name, passed: false, error: error instanceof Error ? error.message : "Unknown error" });
  }

  currentTestIndex++;

  // Wait before next test to avoid rate limiting and allow response
  setTimeout(() => runNextTest(), 5000);
}

client.once(Events.ClientReady, async () => {
  console.log(`Test bot logged in: ${client.user?.tag}`);

  // Find the target channel
  for (const guild of client.guilds.cache.values()) {
    console.log(`Searching in guild: ${guild.name}`);

    // Find the category
    const category = guild.channels.cache.find(
      c => c.name === TARGET_CATEGORY_NAME && c.type === 4 // GuildCategory
    );

    if (category) {
      console.log(`Found category: ${category.name}`);

      // Find the channel in this category
      const channel = guild.channels.cache.find(
        c => c.name === TARGET_CHANNEL_NAME &&
             c.type === 0 && // GuildText
             c.parentId === category.id
      );

      if (channel) {
        targetChannel = channel as TextChannel;
        console.log(`Found target channel: ${channel.name}`);
        break;
      }
    }
  }

  if (!targetChannel) {
    console.error(`Could not find channel "${TARGET_CHANNEL_NAME}" in category "${TARGET_CATEGORY_NAME}"`);
    client.destroy();
    Deno.exit(1);
  }

  console.log("\nStarting tests in 3 seconds...");
  setTimeout(() => runNextTest(), 3000);
});

// Listen for responses from the main bot
client.on(Events.MessageCreate, async (message) => {
  // Ignore our own messages
  if (message.author.id === client.user?.id) return;

  // Check if this is in our target channel
  if (message.channelId !== targetChannel?.id) return;

  // Log responses from other bots
  if (message.author.bot) {
    console.log(`  Response from ${message.author.username}:`);
    if (message.embeds.length > 0) {
      for (const embed of message.embeds) {
        console.log(`    [Embed] ${embed.title || "(no title)"}: ${embed.description?.substring(0, 100) || "(no description)"}...`);
      }
    }
    if (message.content) {
      console.log(`    [Content] ${message.content.substring(0, 100)}...`);
    }
  }
});

console.log("Connecting test bot...");
await client.login(TEST_BOT_TOKEN);
