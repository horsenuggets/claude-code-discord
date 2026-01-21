import { assertEquals } from "jsr:@std/assert@1";
import { isAudioAttachment } from "../voice/whisper.ts";

Deno.test("isAudioAttachment - returns true for audio MIME types", () => {
  assertEquals(isAudioAttachment("audio/ogg"), true);
  assertEquals(isAudioAttachment("audio/mpeg"), true);
  assertEquals(isAudioAttachment("audio/wav"), true);
  assertEquals(isAudioAttachment("audio/flac"), true);
  assertEquals(isAudioAttachment("audio/mp4"), true);
  assertEquals(isAudioAttachment("audio/webm"), true);
  assertEquals(isAudioAttachment("audio/opus"), true);
});

Deno.test("isAudioAttachment - returns false for non-audio MIME types", () => {
  assertEquals(isAudioAttachment("image/png"), false);
  assertEquals(isAudioAttachment("video/mp4"), false);
  assertEquals(isAudioAttachment("text/plain"), false);
  assertEquals(isAudioAttachment("application/json"), false);
});

Deno.test("isAudioAttachment - returns false for null or empty", () => {
  assertEquals(isAudioAttachment(null), false);
  assertEquals(isAudioAttachment(""), false);
});
