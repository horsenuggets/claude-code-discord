// Claude authentication utilities

export interface AuthStatus {
  authenticated: boolean;
  method: "oauth" | "api-key" | "none";
  account?: string;
  message: string;
}

// Check Claude authentication status
export async function checkAuthStatus(): Promise<AuthStatus> {
  // Check for API key
  const hasApiKey = !!Deno.env.get("ANTHROPIC_API_KEY");

  // Check if Claude CLI is available (indicates possible OAuth login)
  let hasCliAuth = false;
  try {
    const command = new Deno.Command("claude", {
      args: ["--version"],
      stdout: "piped",
      stderr: "piped",
    });

    const { code } = await command.output();
    hasCliAuth = code === 0;
  } catch {
    // Claude CLI not available
    hasCliAuth = false;
  }

  // Determine authentication method
  // The Claude Code SDK will automatically use OAuth if the user has logged in with `claude login`
  // It will use ANTHROPIC_API_KEY if that's set instead
  if (hasApiKey) {
    return {
      authenticated: true,
      method: "api-key",
      message: "Authenticated via ANTHROPIC_API_KEY",
    };
  }

  if (hasCliAuth) {
    // Claude CLI is available - it may have OAuth credentials from `claude login`
    return {
      authenticated: true,
      method: "oauth",
      message: "Using Claude CLI authentication (run `claude login` if not logged in)",
    };
  }

  // No authentication found
  return {
    authenticated: false,
    method: "none",
    message:
      "Not authenticated. Run `claude login` for subscription access or set ANTHROPIC_API_KEY.",
  };
}

// Print authentication status to console
export async function printAuthStatus(): Promise<AuthStatus> {
  const status = await checkAuthStatus();

  if (status.authenticated) {
    console.log(`✓ ${status.message}`);
  } else {
    console.warn(`⚠ ${status.message}`);
  }

  return status;
}
