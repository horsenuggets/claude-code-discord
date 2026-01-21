import { assertEquals } from "jsr:@std/assert@1";

// Import all command arrays
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

// Combine all commands as they would be registered
function getAllCommands() {
  return [
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
}

Deno.test("All commands - no duplicate names", () => {
  const allCommands = getAllCommands();
  const commandNames = allCommands.map((cmd) => cmd.name);
  const uniqueNames = new Set(commandNames);

  assertEquals(
    commandNames.length,
    uniqueNames.size,
    `Duplicate command names found. Total: ${commandNames.length}, Unique: ${uniqueNames.size}`,
  );
});

Deno.test("All commands - have valid names", () => {
  const allCommands = getAllCommands();

  for (const cmd of allCommands) {
    // Command names must be lowercase
    assertEquals(
      cmd.name,
      cmd.name.toLowerCase(),
      `Command name "${cmd.name}" should be lowercase`,
    );

    // Command names must not be empty
    assertEquals(cmd.name.length > 0, true, "Command name should not be empty");

    // Command names should only contain valid characters (letters, numbers, hyphens)
    const validPattern = /^[a-z0-9-]+$/;
    assertEquals(
      validPattern.test(cmd.name),
      true,
      `Command name "${cmd.name}" contains invalid characters`,
    );
  }
});

Deno.test("All commands - have descriptions", () => {
  const allCommands = getAllCommands();

  for (const cmd of allCommands) {
    assertEquals(
      typeof cmd.description,
      "string",
      `Command "${cmd.name}" should have a description`,
    );
    assertEquals(
      cmd.description.length > 0,
      true,
      `Command "${cmd.name}" description should not be empty`,
    );
  }
});

Deno.test("Claude commands - exist", () => {
  assertEquals(claudeCommands.length > 0, true, "Should have claude commands");
});

Deno.test("Git commands - exist", () => {
  assertEquals(gitCommands.length > 0, true, "Should have git commands");
});

Deno.test("Shell commands - exist", () => {
  assertEquals(shellCommands.length > 0, true, "Should have shell commands");
});

Deno.test("Help command - exists", () => {
  assertEquals(helpCommand.name, "help");
});
