import { assertEquals, assertExists } from "jsr:@std/assert@1";
import { checkAuthStatus } from "../claude/auth.ts";

Deno.test("checkAuthStatus - returns valid AuthStatus structure", async () => {
  const status = await checkAuthStatus();

  // Check structure
  assertExists(status.authenticated);
  assertExists(status.method);
  assertExists(status.message);

  // Method should be one of the valid types
  const validMethods = ["oauth", "api-key", "none"];
  assertEquals(validMethods.includes(status.method), true);

  // authenticated should be boolean
  assertEquals(typeof status.authenticated, "boolean");

  // message should be string
  assertEquals(typeof status.message, "string");
});

Deno.test("checkAuthStatus - method matches authenticated state", async () => {
  const status = await checkAuthStatus();

  if (status.method === "none") {
    assertEquals(status.authenticated, false);
  } else {
    assertEquals(status.authenticated, true);
  }
});
