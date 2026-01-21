#!/usr/bin/env -S deno run --allow-all

/**
 * Final cleanup verification script
 * Verifies all cleanup actions were successful
 */

// Test for duplicate commands
import { claudeCommands } from "../claude/command.ts";
import { enhancedClaudeCommands } from "../claude/enhanced-commands.ts";
import { additionalClaudeCommands } from "../claude/additional-commands.ts";
import { advancedSettingsCommands } from "../settings/advanced-settings.ts";
import { unifiedSettingsCommands } from "../settings/unified-settings.ts";
import { agentCommand } from "../agent/index.ts";
import { gitCommands } from "../git/command.ts";
import { shellCommands } from "../shell/command.ts";
import { utilsCommands } from "../util/command.ts";
import { systemCommands } from "../system/commands.ts";
import { helpCommand } from "../help/commands.ts";

async function verifyCleanup() {
  console.log("🔍 Final Cleanup Verification\n");

  let allPassed = true;

  // Test 1: No duplicate commands
  console.log("1. 🧪 Checking for duplicate commands...");
  const allCommands = [
    ...claudeCommands,
    ...enhancedClaudeCommands,
    ...additionalClaudeCommands,
    ...advancedSettingsCommands,
    ...unifiedSettingsCommands,
    agentCommand,
    ...gitCommands,
    ...shellCommands,
    ...utilsCommands,
    ...systemCommands,
    helpCommand,
  ];

  const commandNames = allCommands.map((cmd) => cmd.name);
  const duplicates = commandNames.filter((name, index) => commandNames.indexOf(name) !== index);

  if (duplicates.length > 0) {
    console.log(`   ❌ Found duplicates: ${duplicates.join(", ")}`);
    allPassed = false;
  } else {
    console.log(`   ✅ No duplicates found (${commandNames.length} unique commands)`);
  }

  // Test 2: Verify removed commands
  console.log("\n2. 🧪 Verifying removed commands...");
  const removedCommands = [
    "claude-templates",
    "developer-settings",
    "session-settings",
    "monitoring-settings",
    "profile-settings",
  ];
  const foundRemoved = removedCommands.filter((cmd) => commandNames.includes(cmd));

  if (foundRemoved.length > 0) {
    console.log(`   ❌ Found commands that should be removed: ${foundRemoved.join(", ")}`);
    allPassed = false;
  } else {
    console.log(`   ✅ All unwanted commands successfully removed`);
  }

  // Test 3: Verify new commands exist
  console.log("\n3. 🧪 Verifying new commands exist...");
  const newCommands = ["settings", "todos", "mcp", "agent"];
  const missingNew = newCommands.filter((cmd) => !commandNames.includes(cmd));

  if (missingNew.length > 0) {
    console.log(`   ❌ Missing new commands: ${missingNew.join(", ")}`);
    allPassed = false;
  } else {
    console.log(`   ✅ All new commands present`);
  }

  // Test 4: Check file structure
  console.log("\n4. 🧪 Checking file structure...");

  try {
    const testsExists = await Deno.stat("./tests").then(() => true).catch(() => false);

    if (!testsExists) {
      console.log(`   ❌ Missing tests directory`);
      allPassed = false;
    } else {
      console.log(`   ✅ Proper directory structure in place`);
    }
  } catch (error) {
    console.log(
      `   ❌ Error checking directory structure: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
    allPassed = false;
  }

  // Test 5: Check for obsolete test files in root
  console.log("\n5. 🧪 Checking for obsolete files...");

  try {
    const rootFiles = [];
    // Allowed test files in root (test-bot.ts is a legitimate Discord bot test)
    const allowedTestFiles = ["test-bot.ts"];

    for await (const entry of Deno.readDir(".")) {
      if (
        entry.isFile && entry.name.startsWith("test-") && !allowedTestFiles.includes(entry.name)
      ) {
        rootFiles.push(entry.name);
      }
    }

    if (rootFiles.length > 0) {
      console.log(`   ❌ Found obsolete test files in root: ${rootFiles.join(", ")}`);
      allPassed = false;
    } else {
      console.log(`   ✅ No obsolete files in root directory`);
    }
  } catch (error) {
    console.log(
      `   ⚠️  Could not check root directory: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  }

  // Test 6: Verify essential functionality
  console.log("\n6. 🧪 Verifying essential functionality...");

  try {
    // Check that unified settings are properly structured
    const { UNIFIED_DEFAULT_SETTINGS } = await import("../settings/unified-settings.ts");
    const requiredSettings = ["thinkingMode", "operationMode", "defaultModel"];
    const missingSettings = requiredSettings.filter((setting) =>
      !(setting in UNIFIED_DEFAULT_SETTINGS)
    );

    if (missingSettings.length > 0) {
      console.log(`   ❌ Missing required settings: ${missingSettings.join(", ")}`);
      allPassed = false;
    } else {
      console.log(`   ✅ Unified settings properly configured`);
    }
  } catch (error) {
    console.log(
      `   ❌ Error checking unified settings: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
    allPassed = false;
  }

  // Summary
  console.log("\n" + "=".repeat(50));
  if (allPassed) {
    console.log("🎉 ALL CLEANUP VERIFICATIONS PASSED!");
    console.log("\n📋 Summary:");
    console.log("   ✅ No duplicate commands");
    console.log("   ✅ Unwanted commands removed");
    console.log("   ✅ New commands implemented");
    console.log("   ✅ Proper file structure");
    console.log("   ✅ No obsolete files");
    console.log("   ✅ Essential functionality verified");
    console.log("\n🚀 The bot is ready for use!");
  } else {
    console.log("❌ SOME VERIFICATIONS FAILED!");
    console.log("\nPlease review the issues above and fix them.");
    Deno.exit(1);
  }
}

if (import.meta.main) {
  await verifyCleanup();
}
