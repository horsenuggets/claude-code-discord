#!/usr/bin/env -S lune run

--[[

bot-wrapper

A Lune wrapper script for the claude-code-discord Deno bot. This allows the bot to be managed
by lune-pm (lpm) for process management, logging, and deployment features.

[Usage]
> lpm start ./bot-wrapper.luau --name discord-bot
> lpm logs discord-bot
> lpm restart discord-bot
> lpm stop discord-bot

--]]

local process = require("@lune/process")
local task = require("@lune/task")

local BOT_DIR = "/home/claude/repos/claude-code-discord"
local DENO_PATH = "/home/claude/.deno/bin/deno"

local function botWrapper()
	print("Starting claude-code-discord bot...")
	print(`Working directory: {BOT_DIR}`)

	-- Spawn the Deno process
	local child = process.spawn(DENO_PATH, {
		"run",
		"--allow-all",
		"index.ts",
	}, {
		cwd = BOT_DIR,
		env = process.env,
		stdio = "inherit",
	})

	-- Wait for the process to exit
	local exitCode = child.code

	if exitCode ~= 0 then
		print(`Bot exited with code {exitCode}`)
		print("Waiting 5 seconds before exit (lpm will restart)...")
		task.wait(5)
	end

	process.exit(exitCode)
end

botWrapper()
