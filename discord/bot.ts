// deno-lint-ignore-file no-explicit-any no-unused-vars
import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonInteraction,
  ButtonStyle,
  ChannelType,
  Client,
  CommandInteraction,
  DMChannel,
  EmbedBuilder,
  Events,
  GatewayIntentBits,
  Message,
  Partials,
  REST,
  Routes,
  TextChannel,
} from "npm:discord.js@14.14.1";

import { sanitizeChannelName } from "./utils.ts";
import { handlePaginationInteraction } from "./pagination.ts";
import { getMessageContent, isAudioAttachment } from "../voice/index.ts";
import type {
  BotConfig,
  BotDependencies,
  ButtonHandlers,
  CommandHandlers,
  InteractionContext,
  MessageContent,
} from "./types.ts";

// ================================
// Helper Functions
// ================================

function convertMessageContent(content: MessageContent): any {
  const payload: any = {};

  if (content.content) payload.content = content.content;

  if (content.embeds) {
    payload.embeds = content.embeds.map((e) => {
      const embed = new EmbedBuilder();
      if (e.color !== undefined) embed.setColor(e.color);
      if (e.title) embed.setTitle(e.title);
      if (e.description) embed.setDescription(e.description);
      if (e.fields) e.fields.forEach((f) => embed.addFields(f));
      if (e.footer) embed.setFooter(e.footer);
      if (e.timestamp) embed.setTimestamp();
      return embed;
    });
  }

  if (content.components) {
    payload.components = content.components.map((row) => {
      const actionRow = new ActionRowBuilder<ButtonBuilder>();
      row.components.forEach((comp) => {
        const button = new ButtonBuilder()
          .setCustomId(comp.customId)
          .setLabel(comp.label);

        switch (comp.style) {
          case "primary":
            button.setStyle(ButtonStyle.Primary);
            break;
          case "secondary":
            button.setStyle(ButtonStyle.Secondary);
            break;
          case "success":
            button.setStyle(ButtonStyle.Success);
            break;
          case "danger":
            button.setStyle(ButtonStyle.Danger);
            break;
          case "link":
            button.setStyle(ButtonStyle.Link);
            break;
        }

        actionRow.addComponents(button);
      });
      return actionRow;
    });
  }

  return payload;
}

// ================================
// Main Bot Creation Function
// ================================

export async function createDiscordBot(
  config: BotConfig,
  handlers: CommandHandlers,
  buttonHandlers: ButtonHandlers,
  dependencies: BotDependencies,
  crashHandler?: any,
) {
  const { discordToken, applicationId, workDir, repoName, branchName, categoryName } = config;
  const actualCategoryName = categoryName || repoName;

  let myChannel: TextChannel | null = null;
  let myCategory: any = null;

  const botSettings = dependencies.botSettings || {
    mentionEnabled: !!config.defaultMentionUserId,
    mentionUserId: config.defaultMentionUserId || null,
  };

  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent,
      GatewayIntentBits.DirectMessages,
      GatewayIntentBits.DirectMessageTyping,
    ],
    // Required for receiving DM events
    partials: [Partials.Channel, Partials.Message],
  });

  // Text command prefix
  const TEXT_COMMAND_PREFIX = "!";

  // Use commands from dependencies
  const commands = dependencies.commands;

  // Helper to check if message/interaction should be processed
  // Returns true for DMs or for messages in the bot's designated channel
  function shouldProcessMessage(channelId: string, channel: any): boolean {
    // Always process DMs
    if (channel?.type === ChannelType.DM) {
      return true;
    }
    // Process if it's in our designated channel
    if (myChannel && channelId === myChannel.id) {
      return true;
    }
    return false;
  }

  // Check if a channel is a DM
  function isDMChannel(channel: any): boolean {
    return channel?.type === ChannelType.DM;
  }

  // Channel management
  async function ensureChannelExists(guild: any): Promise<TextChannel> {
    const channelName = sanitizeChannelName(branchName);

    console.log(`Checking category "${actualCategoryName}"...`);

    let category = guild.channels.cache.find(
      (c: any) => c.type === ChannelType.GuildCategory && c.name === actualCategoryName,
    );

    if (!category) {
      console.log(`Creating category "${actualCategoryName}"...`);
      try {
        category = await guild.channels.create({
          name: actualCategoryName,
          type: ChannelType.GuildCategory,
        });
        console.log(`Created category "${actualCategoryName}"`);
      } catch (error) {
        console.error(`Category creation error: ${error}`);
        throw new Error(
          `Cannot create category. Please ensure the bot has "Manage Channels" permission.`,
        );
      }
    }

    myCategory = category;

    let channel = guild.channels.cache.find(
      (c: any) =>
        c.type === ChannelType.GuildText && c.name === channelName && c.parentId === category.id,
    );

    if (!channel) {
      console.log(`Creating channel "${channelName}"...`);
      try {
        channel = await guild.channels.create({
          name: channelName,
          type: ChannelType.GuildText,
          parent: category.id,
          topic:
            `Repository: ${repoName} | Branch: ${branchName} | Machine: ${Deno.hostname()} | Path: ${workDir}`,
        });
        console.log(`Created channel "${channelName}"`);
      } catch (error) {
        console.error(`Channel creation error: ${error}`);
        throw new Error(
          `Cannot create channel. Please ensure the bot has "Manage Channels" permission.`,
        );
      }
    }

    return channel as TextChannel;
  }

  // Create interaction context wrapper
  function createInteractionContext(
    interaction: CommandInteraction | ButtonInteraction,
  ): InteractionContext {
    return {
      async deferReply(): Promise<void> {
        await interaction.deferReply();
      },

      async editReply(content: MessageContent): Promise<void> {
        await interaction.editReply(convertMessageContent(content));
      },

      async followUp(content: MessageContent & { ephemeral?: boolean }): Promise<void> {
        const payload = convertMessageContent(content);
        payload.ephemeral = content.ephemeral || false;
        await interaction.followUp(payload);
      },

      async reply(content: MessageContent & { ephemeral?: boolean }): Promise<void> {
        const payload = convertMessageContent(content);
        payload.ephemeral = content.ephemeral || false;
        await interaction.reply(payload);
      },

      async update(content: MessageContent): Promise<void> {
        if ("update" in interaction) {
          await (interaction as ButtonInteraction).update(convertMessageContent(content));
        }
      },

      getString(name: string, required?: boolean): string | null {
        if (interaction.isCommand && interaction.isCommand()) {
          return (interaction as any).options.getString(name, required ?? false);
        }
        return null;
      },

      getInteger(name: string, required?: boolean): number | null {
        if (interaction.isCommand && interaction.isCommand()) {
          return (interaction as any).options.getInteger(name, required ?? false);
        }
        return null;
      },

      getBoolean(name: string, required?: boolean): boolean | null {
        if (interaction.isCommand && interaction.isCommand()) {
          return (interaction as any).options.getBoolean(name, required ?? false);
        }
        return null;
      },
    };
  }

  // Create interaction context from a text message (for text commands)
  function createTextCommandContext(
    message: Message,
    args: Map<string, string>,
  ): InteractionContext {
    let replyMessage: Message | null = null;
    let hasReplied = false;

    return {
      async deferReply(): Promise<void> {
        // For text commands, send a "processing" message
        replyMessage = await message.reply({
          embeds: [{
            color: 0xffff00,
            description: "Processing...",
          }],
        });
        hasReplied = true;
      },

      async editReply(content: MessageContent): Promise<void> {
        const payload = convertMessageContent(content);
        if (replyMessage) {
          await replyMessage.edit(payload);
        } else if (!hasReplied) {
          replyMessage = await message.reply(payload);
          hasReplied = true;
        }
      },

      async followUp(content: MessageContent & { ephemeral?: boolean }): Promise<void> {
        const payload = convertMessageContent(content);
        await message.channel.send(payload);
      },

      async reply(content: MessageContent & { ephemeral?: boolean }): Promise<void> {
        const payload = convertMessageContent(content);
        if (!hasReplied) {
          replyMessage = await message.reply(payload);
          hasReplied = true;
        } else {
          await message.channel.send(payload);
        }
      },

      async update(content: MessageContent): Promise<void> {
        // For text commands, update acts like editReply
        const payload = convertMessageContent(content);
        if (replyMessage) {
          await replyMessage.edit(payload);
        }
      },

      getString(name: string, _required?: boolean): string | null {
        return args.get(name) || null;
      },

      getInteger(name: string, _required?: boolean): number | null {
        const val = args.get(name);
        if (val) {
          const num = parseInt(val, 10);
          return isNaN(num) ? null : num;
        }
        return null;
      },

      getBoolean(name: string, _required?: boolean): boolean | null {
        const val = args.get(name)?.toLowerCase();
        if (val === "true" || val === "yes" || val === "1") return true;
        if (val === "false" || val === "no" || val === "0") return false;
        return null;
      },
    };
  }

  // Parse text command arguments
  // Format: !command arg1 arg2 or !command key:value key2:value2
  function parseTextCommandArgs(commandName: string, argsString: string): Map<string, string> {
    const args = new Map<string, string>();

    // Handle special cases for common commands
    if (commandName === "claude" || commandName === "claude-enhanced") {
      // Everything after the command is the prompt
      args.set("prompt", argsString.trim());
      return args;
    }

    if (commandName === "git" || commandName === "shell") {
      // Everything after the command is the command to run
      args.set("command", argsString.trim());
      return args;
    }

    // For other commands, try to parse key:value pairs
    const parts = argsString.match(/(?:[^\s"]+|"[^"]*")+/g) || [];
    let positionalIndex = 0;
    const positionalNames = ["prompt", "command", "content", "action", "value"];

    for (const part of parts) {
      if (part.includes(":") && !part.startsWith('"')) {
        const [key, ...valueParts] = part.split(":");
        args.set(key, valueParts.join(":").replace(/^"|"$/g, ""));
      } else {
        // Positional argument
        if (positionalIndex < positionalNames.length) {
          args.set(positionalNames[positionalIndex], part.replace(/^"|"$/g, ""));
          positionalIndex++;
        }
      }
    }

    return args;
  }

  // Text command handler
  async function handleTextCommand(message: Message) {
    // Process messages from DMs or our designated channel
    if (!shouldProcessMessage(message.channelId, message.channel)) {
      return;
    }

    // Ignore bot messages (but not from other bots for testing)
    if (message.author.id === client.user?.id) {
      return;
    }

    // Get message content (with voice transcription support)
    const attachments = message.attachments.map((a) => ({
      url: a.url,
      contentType: a.contentType,
      name: a.name || "audio.ogg",
    }));

    const { text: messageContent, wasVoice } = await getMessageContent(
      message.content,
      attachments,
    );

    // Log voice transcription
    if (wasVoice) {
      console.log(`Voice message transcribed: "${messageContent.substring(0, 50)}..."`);
      // Optionally notify the user that their voice was transcribed
      if (isDMChannel(message.channel)) {
        await message.reply({
          content: `🎤 Voice transcribed: "${messageContent}"`,
        });
      }
    }

    const content = messageContent.trim();
    if (!content.startsWith(TEXT_COMMAND_PREFIX)) {
      // For DMs, if no command prefix, treat the whole message as a prompt for Claude
      if (isDMChannel(message.channel) && content) {
        // Use the "claude" command handler directly with the content as prompt
        const claudeHandler = handlers.get("claude");
        if (claudeHandler) {
          const args = new Map<string, string>();
          args.set("prompt", content);
          const ctx = createTextCommandContext(message, args);
          try {
            await claudeHandler.execute(ctx);
          } catch (error) {
            console.error("Error executing DM Claude prompt:", error);
            await message.reply({
              embeds: [{
                color: 0xff0000,
                title: "Error",
                description: `Error: ${error instanceof Error ? error.message : "Unknown error"}`,
              }],
            });
          }
        }
      }
      return;
    }

    // Parse command and arguments
    const withoutPrefix = content.slice(TEXT_COMMAND_PREFIX.length);
    const spaceIndex = withoutPrefix.indexOf(" ");
    const commandName = spaceIndex === -1 ? withoutPrefix : withoutPrefix.slice(0, spaceIndex);
    const argsString = spaceIndex === -1 ? "" : withoutPrefix.slice(spaceIndex + 1);

    console.log(`Text command received: ${commandName} from ${message.author.tag}`);

    const handler = handlers.get(commandName);
    if (!handler) {
      await message.reply({
        embeds: [{
          color: 0xff0000,
          title: "Unknown Command",
          description:
            `Command \`${commandName}\` not found. Use \`!help\` for available commands.`,
        }],
      });
      return;
    }

    const args = parseTextCommandArgs(commandName, argsString);
    const ctx = createTextCommandContext(message, args);

    try {
      await handler.execute(ctx);
    } catch (error) {
      console.error(`Error executing text command ${commandName}:`, error);
      try {
        await message.reply({
          embeds: [{
            color: 0xff0000,
            title: "Command Error",
            description: `Error: ${error instanceof Error ? error.message : "Unknown error"}`,
          }],
        });
      } catch {
        // Ignore errors when sending error message
      }
    }
  }

  // Command handler - completely generic
  async function handleCommand(interaction: CommandInteraction) {
    // Process commands from DMs or our designated channel
    if (!shouldProcessMessage(interaction.channelId, interaction.channel)) {
      return;
    }

    const ctx = createInteractionContext(interaction);
    const handler = handlers.get(interaction.commandName);

    if (!handler) {
      await ctx.reply({
        content: `Unknown command: ${interaction.commandName}`,
        ephemeral: true,
      });
      return;
    }

    try {
      await handler.execute(ctx);
    } catch (error) {
      console.error(`Error executing command ${interaction.commandName}:`, error);
      // Try to send error message if possible
      try {
        if (interaction.deferred) {
          await ctx.editReply({
            content: `Error executing command: ${
              error instanceof Error ? error.message : "Unknown error"
            }`,
          });
        } else {
          await ctx.reply({
            content: `Error executing command: ${
              error instanceof Error ? error.message : "Unknown error"
            }`,
            ephemeral: true,
          });
        }
      } catch {
        // Ignore errors when sending error message
      }
    }
  }

  // Button handler - completely generic
  async function handleButton(interaction: ButtonInteraction) {
    // Process buttons from DMs or our designated channel
    if (!shouldProcessMessage(interaction.channelId, interaction.channel)) {
      return;
    }

    const ctx = createInteractionContext(interaction);

    // Handle pagination buttons first
    if (interaction.customId.startsWith("pagination:")) {
      try {
        const paginationResult = handlePaginationInteraction(interaction.customId);
        if (paginationResult) {
          await ctx.update({
            embeds: [paginationResult.embed],
            components: paginationResult.components
              ? [{ type: "actionRow", components: paginationResult.components }]
              : [],
          });
          return;
        }
      } catch (error) {
        console.error("Error handling pagination:", error);
        if (crashHandler) {
          await crashHandler.reportCrash(
            "main",
            error instanceof Error ? error : new Error(String(error)),
            "pagination",
            "Button interaction",
          );
        }
      }
    }

    const handler = buttonHandlers.get(interaction.customId);

    if (handler) {
      try {
        await handler(ctx);
      } catch (error) {
        console.error(`Error handling button ${interaction.customId}:`, error);
        if (crashHandler) {
          await crashHandler.reportCrash(
            "main",
            error instanceof Error ? error : new Error(String(error)),
            "button",
            `ID: ${interaction.customId}`,
          );
        }
        try {
          await ctx.followUp({
            content: `Error handling button: ${
              error instanceof Error ? error.message : "Unknown error"
            }`,
            ephemeral: true,
          });
        } catch {
          // Ignore errors when sending error message
        }
      }
      return;
    }

    // Handle dynamic button IDs with patterns
    const buttonId = interaction.customId;

    // Handle continue with session ID pattern: "continue:sessionId"
    if (buttonId.startsWith("continue:")) {
      const sessionId = buttonId.split(":")[1];
      const continueHandler = buttonHandlers.get("continue");
      if (continueHandler) {
        try {
          await continueHandler(ctx);
        } catch (error) {
          console.error(`Error handling continue button:`, error);
        }
      }
      return;
    }

    // Handle copy session ID pattern: "copy-session:sessionId"
    if (buttonId.startsWith("copy-session:")) {
      const sessionId = buttonId.split(":")[1];
      try {
        await ctx.update({
          embeds: [{
            color: 0x00ff00,
            title: "📋 Session ID",
            description: `\`${sessionId}\``,
            fields: [
              {
                name: "Usage",
                value: "Copy this ID to use with `/claude session_id:...`",
                inline: false,
              },
            ],
            timestamp: true,
          }],
        });
      } catch (error) {
        console.error(`Error handling copy-session button:`, error);
      }
      return;
    }

    // Handle expand content pattern: "expand:contentId"
    if (buttonId.startsWith("expand:")) {
      const expandId = buttonId.substring(7);

      // Try to find a handler that can process expand buttons
      for (const [handlerName, handler] of handlers.entries()) {
        if (handler.handleButton) {
          try {
            await handler.handleButton(ctx, buttonId);
            return;
          } catch (error) {
            console.error(`Error in ${handlerName} handleButton for expand:`, error);
          }
        }
      }

      // If no handler found, show default message
      try {
        await ctx.update({
          embeds: [{
            color: 0xffaa00,
            title: "📖 Content Not Available",
            description: "The full content is no longer available for expansion.",
            timestamp: true,
          }],
          components: [],
        });
      } catch (error) {
        console.error(`Error handling expand button fallback:`, error);
      }
      return;
    }

    // If no specific handler found, try to delegate to command handlers with handleButton method
    const commandHandler = Array.from(handlers.values()).find((h) => h.handleButton);
    if (commandHandler?.handleButton) {
      try {
        await commandHandler.handleButton(ctx, interaction.customId);
      } catch (error) {
        console.error(`Error handling button ${interaction.customId} via command handler:`, error);
        try {
          await ctx.followUp({
            content: `Error handling button: ${
              error instanceof Error ? error.message : "Unknown error"
            }`,
            ephemeral: true,
          });
        } catch {
          // Ignore errors when sending error message
        }
      }
    } else {
      console.warn(`No handler found for button: ${interaction.customId}`);
    }
  }

  // Register commands
  const rest = new REST({ version: "10" }).setToken(discordToken);

  try {
    console.log("Registering slash commands...");
    await rest.put(
      Routes.applicationCommands(applicationId),
      { body: commands.map((cmd) => cmd.toJSON()) },
    );
    console.log("Slash commands registered");
  } catch (error) {
    console.error("Failed to register slash commands:", error);
    throw error;
  }

  // Event handlers
  client.once(Events.ClientReady, async () => {
    console.log(`Bot logged in: ${client.user?.tag}`);
    console.log(`Category: ${actualCategoryName}`);
    console.log(`Branch: ${branchName}`);
    console.log(`Working directory: ${workDir}`);

    const guilds = client.guilds.cache;
    if (guilds.size === 0) {
      console.error("Error: Bot is not in any servers");
      return;
    }

    const guild = guilds.first();
    if (!guild) {
      console.error("Error: Guild not found");
      return;
    }

    try {
      myChannel = await ensureChannelExists(guild);
      console.log(`Using channel "${myChannel.name}"`);

      await myChannel.send(convertMessageContent({
        embeds: [{
          color: 0x00ff00,
          title: "🚀 Startup Complete",
          description: `Claude Code bot for branch ${branchName} has started`,
          fields: [
            { name: "Category", value: actualCategoryName, inline: true },
            { name: "Repository", value: repoName, inline: true },
            { name: "Branch", value: branchName, inline: true },
            { name: "Working Directory", value: `\`${workDir}\``, inline: false },
            {
              name: "Commands",
              value: "Use `/command` (slash) or `!command` (text)",
              inline: false,
            },
          ],
          timestamp: true,
        }],
      }));
    } catch (error) {
      console.error("Channel creation/retrieval error:", error);
    }
  });

  client.on(Events.InteractionCreate, async (interaction) => {
    if (interaction.isCommand()) {
      await handleCommand(interaction as CommandInteraction);
    } else if (interaction.isButton()) {
      await handleButton(interaction as ButtonInteraction);
    }
  });

  // Text command handler
  client.on(Events.MessageCreate, async (message) => {
    await handleTextCommand(message);
  });

  // Login
  await client.login(discordToken);

  // Return bot control functions
  return {
    client,
    getChannel() {
      return myChannel;
    },
    updateBotSettings(settings: { mentionEnabled: boolean; mentionUserId: string | null }) {
      botSettings.mentionEnabled = settings.mentionEnabled;
      botSettings.mentionUserId = settings.mentionUserId;
    },
    getBotSettings() {
      return { ...botSettings };
    },
  };
}
