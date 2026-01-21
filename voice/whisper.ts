// OpenAI Whisper voice transcription utility

const WHISPER_API_URL = "https://api.openai.com/v1/audio/transcriptions";
const WHISPER_MODEL = "whisper-1";

// Supported audio MIME types
const AUDIO_MIME_TYPES: Record<string, string> = {
  ".ogg": "audio/ogg",
  ".mp3": "audio/mpeg",
  ".wav": "audio/wav",
  ".flac": "audio/flac",
  ".m4a": "audio/mp4",
  ".webm": "audio/webm",
  ".opus": "audio/opus",
};

export interface TranscriptionResult {
  success: boolean;
  text?: string;
  error?: string;
}

// Check if an attachment is an audio file
export function isAudioAttachment(contentType: string | null): boolean {
  if (!contentType) return false;
  return contentType.startsWith("audio/");
}

// Get MIME type from file extension
function getMimeType(filename: string): string {
  const ext = filename.substring(filename.lastIndexOf(".")).toLowerCase();
  return AUDIO_MIME_TYPES[ext] || "application/octet-stream";
}

// Generate a random boundary for multipart form data
function generateBoundary(): string {
  return "----FormBoundary" + Math.random().toString(36).substring(2);
}

// Transcribe audio using OpenAI Whisper API
export async function transcribeAudio(
  audioUrl: string,
  filename: string = "audio.ogg",
): Promise<TranscriptionResult> {
  const apiKey = Deno.env.get("OPENAI_API_KEY");

  if (!apiKey) {
    return {
      success: false,
      error: "OPENAI_API_KEY not set. Voice transcription unavailable.",
    };
  }

  try {
    // Download the audio file
    console.log(`Downloading audio from: ${audioUrl}`);
    const audioResponse = await fetch(audioUrl);

    if (!audioResponse.ok) {
      return {
        success: false,
        error: `Failed to download audio: ${audioResponse.status}`,
      };
    }

    const audioData = await audioResponse.arrayBuffer();
    const audioBytes = new Uint8Array(audioData);

    // Build multipart form data
    const boundary = generateBoundary();
    const mimeType = getMimeType(filename);

    // Create form data parts
    const encoder = new TextEncoder();

    const formParts: Uint8Array[] = [];

    // File part
    const fileHeader = encoder.encode(
      `--${boundary}\r\n` +
        `Content-Disposition: form-data; name="file"; filename="${filename}"\r\n` +
        `Content-Type: ${mimeType}\r\n\r\n`,
    );
    formParts.push(fileHeader);
    formParts.push(audioBytes);
    formParts.push(encoder.encode("\r\n"));

    // Model part
    const modelPart = encoder.encode(
      `--${boundary}\r\n` +
        `Content-Disposition: form-data; name="model"\r\n\r\n` +
        `${WHISPER_MODEL}\r\n`,
    );
    formParts.push(modelPart);

    // End boundary
    formParts.push(encoder.encode(`--${boundary}--\r\n`));

    // Combine all parts
    const totalLength = formParts.reduce((sum, part) => sum + part.length, 0);
    const body = new Uint8Array(totalLength);
    let offset = 0;
    for (const part of formParts) {
      body.set(part, offset);
      offset += part.length;
    }

    // Send to Whisper API
    console.log("Sending audio to Whisper API...");
    const response = await fetch(WHISPER_API_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": `multipart/form-data; boundary=${boundary}`,
      },
      body: body,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Whisper API error: ${response.status} - ${errorText}`);
      return {
        success: false,
        error: `Whisper API error: ${response.status}`,
      };
    }

    const result = await response.json();
    console.log(`Transcription successful: "${result.text?.substring(0, 50)}..."`);

    return {
      success: true,
      text: result.text,
    };
  } catch (error) {
    console.error("Transcription error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown transcription error",
    };
  }
}

// Extract text content from a message, transcribing voice if needed
export async function getMessageContent(
  textContent: string,
  attachments: Array<{ url: string; contentType: string | null; name: string }>,
): Promise<{ text: string; wasVoice: boolean }> {
  // If there's text content, use it
  if (textContent && textContent.trim()) {
    return { text: textContent, wasVoice: false };
  }

  // Check for audio attachments
  for (const attachment of attachments) {
    if (isAudioAttachment(attachment.contentType)) {
      const result = await transcribeAudio(attachment.url, attachment.name);
      if (result.success && result.text) {
        return { text: result.text, wasVoice: true };
      } else {
        return {
          text: `[Voice message transcription failed: ${result.error}]`,
          wasVoice: true,
        };
      }
    }
  }

  return { text: "", wasVoice: false };
}
