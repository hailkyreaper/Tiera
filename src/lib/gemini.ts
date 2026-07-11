import { GoogleGenAI, Type } from "@google/genai";

export const MAX_BOOKS_PER_PHOTO = 50;

export type IdentifiedBook = {
  title: string;
  author: string | null;
};

let client: GoogleGenAI | null = null;

function getClient(): GoogleGenAI {
  if (!client) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not set");
    }
    client = new GoogleGenAI({ apiKey });
  }
  return client;
}

// Reads up to MAX_BOOKS_PER_PHOTO distinct books from a photo — anything
// from a single cover up to a full shelf. Still capped rather than
// unbounded: every guess here gets re-matched against real book search
// afterward (see the AI import action, which runs that matching — and the
// eventual catalog creation — with bounded concurrency specifically
// because this cap is high enough now that doing it one at a time would be
// noticeably slow).
export async function identifyBooksInImage(
  base64Data: string,
  mimeType: string,
): Promise<IdentifiedBook[]> {
  const ai = getClient();

  const response = await ai.models.generateContent({
    model: "gemini-3.5-flash",
    contents: [
      {
        role: "user",
        parts: [
          {
            text: `Identify up to ${MAX_BOOKS_PER_PHOTO} distinct physical books visible in this photo — it might be a single cover, a small stack, a series lined up, or a shelf. For each one, give your best reading of its exact title and author as printed on the cover or spine — include your best guess even if the text is small, angled, or partially obscured, rather than skipping it; only leave a book out entirely if you genuinely cannot make out enough of the title to guess. Return at most ${MAX_BOOKS_PER_PHOTO} books, ordered left-to-right / most prominent first.`,
          },
          { inlineData: { mimeType, data: base64Data } },
        ],
      },
    ],
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        maxItems: MAX_BOOKS_PER_PHOTO,
        items: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            author: { type: Type.STRING },
          },
          required: ["title"],
        },
      },
    },
  });

  const text = response.text;
  if (!text) return [];

  try {
    const parsed: { title?: string; author?: string }[] = JSON.parse(text);
    return parsed
      .filter((book) => book.title?.trim())
      .slice(0, MAX_BOOKS_PER_PHOTO)
      .map((book) => ({
        title: book.title!.trim(),
        author: book.author?.trim() || null,
      }));
  } catch {
    return [];
  }
}
