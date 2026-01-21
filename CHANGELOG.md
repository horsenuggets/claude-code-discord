# Changelog

## 0.1.2

- Removed DM support to simplify bot architecture
- Added configurable title separator style via TITLE_SEPARATOR_STYLE env var
- Added e2e test utilities for Discord automation
- Excluded e2e and logs directories from CI lint and format checks

## 0.1.1

- Added DM support - bot now responds to direct messages
- Added voice message transcription using OpenAI Whisper
- Added OAuth/Claude subscription authentication support
- Added 28 unit tests with CI integration
- Updated default model to Claude Opus 4.5
- Fixed all deno lint issues across codebase
- Fixed deno.json config and verification scripts
- Added logs directory to gitignore

## 0.1.0

- Initial release with Discord bot functionality
- Claude Code SDK integration
- Text command support (! prefix)
- Slash command support
- Git operations (status, worktree management)
- Shell command execution
- System monitoring commands
