/**
 * Configuration module for claude-code-discord E2E tests.
 * Loads settings from .env file with type-safe access.
 */

import { config } from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

// Load .env from project root
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
config({ path: join(__dirname, "..", ".env") });

interface Config {
  // Production bot (Horsecode#4817)
  horsecodeProductionBotId: string;
  // Dev bot (HorsecodeDev#8997)
  horsecodeDevBotId: string;
  chromeDebugPort: number;
  chromeUserDataDir: string;
  discordEmail: string;
  discordPassword: string;
}

function getEnvVar(name: string, defaultValue?: string): string {
  const value = process.env[name] ?? defaultValue;
  if (value === undefined) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const appConfig: Config = {
  horsecodeProductionBotId: getEnvVar("HORSECODE_PRODUCTION_BOT_ID", "1330398911898464296"),
  horsecodeDevBotId: getEnvVar("HORSECODE_DEV_BOT_ID", "1463380978289442826"),
  chromeDebugPort: parseInt(getEnvVar("CHROME_DEBUG_PORT", "9222"), 10),
  chromeUserDataDir: getEnvVar("CHROME_USER_DATA_DIR", "./chrome-user-data"),
  discordEmail: getEnvVar("DISCORD_EMAIL", ""),
  discordPassword: getEnvVar("DISCORD_PASSWORD", ""),
};
