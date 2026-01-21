import { assertEquals } from "jsr:@std/assert@1";
import { sanitizeChannelName, splitText } from "../discord/utils.ts";

Deno.test("sanitizeChannelName - converts to lowercase", () => {
  assertEquals(sanitizeChannelName("MyChannel"), "mychannel");
  assertEquals(sanitizeChannelName("UPPERCASE"), "uppercase");
  assertEquals(sanitizeChannelName("MixedCase"), "mixedcase");
});

Deno.test("sanitizeChannelName - replaces invalid characters with hyphens", () => {
  assertEquals(sanitizeChannelName("my channel"), "my-channel");
  assertEquals(sanitizeChannelName("my.channel"), "my-channel");
  assertEquals(sanitizeChannelName("my@channel"), "my-channel");
  assertEquals(sanitizeChannelName("my#channel"), "my-channel");
});

Deno.test("sanitizeChannelName - removes consecutive hyphens", () => {
  assertEquals(sanitizeChannelName("my--channel"), "my-channel");
  assertEquals(sanitizeChannelName("my---channel"), "my-channel");
  assertEquals(sanitizeChannelName("my  channel"), "my-channel");
});

Deno.test("sanitizeChannelName - removes leading/trailing hyphens", () => {
  assertEquals(sanitizeChannelName("-mychannel"), "mychannel");
  assertEquals(sanitizeChannelName("mychannel-"), "mychannel");
  assertEquals(sanitizeChannelName("-mychannel-"), "mychannel");
  assertEquals(sanitizeChannelName(" mychannel "), "mychannel");
});

Deno.test("sanitizeChannelName - preserves valid characters", () => {
  assertEquals(sanitizeChannelName("my-channel"), "my-channel");
  assertEquals(sanitizeChannelName("my_channel"), "my_channel");
  assertEquals(sanitizeChannelName("channel123"), "channel123");
  assertEquals(sanitizeChannelName("my-channel_123"), "my-channel_123");
});

Deno.test("sanitizeChannelName - truncates to 100 characters", () => {
  const longName = "a".repeat(150);
  const result = sanitizeChannelName(longName);
  assertEquals(result.length, 100);
});

Deno.test("splitText - splits text into chunks", () => {
  const text = "abcdefghij";
  const chunks = splitText(text, 3);
  assertEquals(chunks, ["abc", "def", "ghi", "j"]);
});

Deno.test("splitText - handles text shorter than maxLength", () => {
  const text = "abc";
  const chunks = splitText(text, 10);
  assertEquals(chunks, ["abc"]);
});

Deno.test("splitText - handles empty string", () => {
  const chunks = splitText("", 10);
  assertEquals(chunks, []);
});

Deno.test("splitText - handles exact multiple of maxLength", () => {
  const text = "abcdef";
  const chunks = splitText(text, 3);
  assertEquals(chunks, ["abc", "def"]);
});
