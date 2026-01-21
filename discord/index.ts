// Discord utilities and components
export { createDiscordBot } from "./bot.ts";
export { sanitizeChannelName, splitText } from "./utils.ts";
export {
  cleanupPaginationStates,
  createPaginatedEmbeds,
  createPaginatedMessage,
  createPaginationButtons,
  handlePaginationInteraction,
  initializePagination,
  smartSplit,
} from "./pagination.ts";
export {
  createFormattedEmbed,
  formatError,
  formatFileContent,
  formatGitOutput,
  formatShellOutput,
  formatText,
  needsFormatting,
} from "./formatting.ts";
export type {
  BotConfig,
  BotDependencies,
  ButtonHandlers,
  CommandHandlers,
  ComponentData,
  EmbedData,
  InteractionContext,
  MessageContent,
} from "./types.ts";
export type { PaginatedContent, PaginationOptions, PaginationState } from "./pagination.ts";
export type { FormatOptions } from "./formatting.ts";
