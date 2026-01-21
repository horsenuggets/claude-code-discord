import { assertEquals, assertExists } from "jsr:@std/assert@1";
import {
  ANTHROPIC_RATE_LIMITS,
  OPERATION_MODES,
  THINKING_MODES,
  UNIFIED_DEFAULT_SETTINGS,
  unifiedSettingsCommands,
} from "../settings/unified-settings.ts";

Deno.test("UNIFIED_DEFAULT_SETTINGS - has all required properties", () => {
  const settings = UNIFIED_DEFAULT_SETTINGS;

  // Basic bot settings
  assertExists(settings.mentionEnabled);
  assertEquals(typeof settings.mentionEnabled, "boolean");

  // Claude settings
  assertExists(settings.defaultModel);
  assertEquals(typeof settings.defaultModel, "string");
  assertExists(settings.defaultTemperature);
  assertEquals(typeof settings.defaultTemperature, "number");

  // Mode settings
  assertExists(settings.thinkingMode);
  assertExists(settings.operationMode);

  // Output settings
  assertExists(settings.codeHighlighting);
  assertExists(settings.maxOutputLength);

  // Developer settings
  assertExists(settings.enableDebugMode);
  assertEquals(typeof settings.enableDebugMode, "boolean");

  // Proxy settings
  assertExists(settings.proxyEnabled);
  assertEquals(typeof settings.proxyEnabled, "boolean");
});

Deno.test("THINKING_MODES - has all expected modes", () => {
  const expectedModes = ["none", "think", "think-hard", "ultrathink"];

  for (const mode of expectedModes) {
    assertExists(THINKING_MODES[mode as keyof typeof THINKING_MODES]);
    const modeConfig = THINKING_MODES[mode as keyof typeof THINKING_MODES];
    assertExists(modeConfig.name);
    assertExists(modeConfig.description);
  }
});

Deno.test("OPERATION_MODES - has all expected modes with risk levels", () => {
  const expectedModes = ["normal", "plan", "auto-accept", "danger"];

  for (const mode of expectedModes) {
    assertExists(OPERATION_MODES[mode as keyof typeof OPERATION_MODES]);
    const modeConfig = OPERATION_MODES[mode as keyof typeof OPERATION_MODES];
    assertExists(modeConfig.name);
    assertExists(modeConfig.description);
    assertExists(modeConfig.riskLevel);
  }
});

Deno.test("ANTHROPIC_RATE_LIMITS - has all expected tiers", () => {
  const expectedTiers = ["free", "basic", "pro", "enterprise", "exceeds_200k_tokens"];

  for (const tier of expectedTiers) {
    assertExists(ANTHROPIC_RATE_LIMITS[tier]);
    const tierConfig = ANTHROPIC_RATE_LIMITS[tier];
    assertExists(tierConfig.name);
    assertExists(tierConfig.tokensPerMinute);
    assertExists(tierConfig.tokensPerHour);
    assertExists(tierConfig.tokensPerDay);
  }
});

Deno.test("unifiedSettingsCommands - has expected commands", () => {
  const expectedCommands = ["settings", "todos", "mcp"];
  const commandNames = unifiedSettingsCommands.map((cmd) => cmd.name);

  for (const expected of expectedCommands) {
    assertEquals(commandNames.includes(expected), true, `Missing command: ${expected}`);
  }
});

Deno.test("unifiedSettingsCommands - has no duplicate names", () => {
  const commandNames = unifiedSettingsCommands.map((cmd) => cmd.name);
  const uniqueNames = new Set(commandNames);

  assertEquals(commandNames.length, uniqueNames.size, "Duplicate command names found");
});
