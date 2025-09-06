"use client";

type Message = {
  role: "user" | "assistant";
  content: string;
};

export async function runQandA(
  messages: Message[],
  userText: string,
  selectedModel: string
): Promise<string> {
  try {
    const response = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model:
            selectedModel === "Gemma 3 27B"
              ? "google/gemma-3-27b-it:free"
              : "deepseek/deepseek-r1-0528:free",
          messages: [
            {
              role: "system",
              content:
                "You are SafeGIS AI. Only answer questions related to disaster management, GIS, and mapping. If the user asks about unrelated topics, politely refuse and remind them you are specialized only in these domains.",
            },
            ...messages,
            { role: "user", content: userText },
          ],
        }),
      }
    );

    const data = await response.json();
    const aiMessage =
      data?.choices?.[0]?.message?.content ||
      "Sorry, I couldn’t generate a response.";

    return aiMessage
      .split("\n")
      .map((line: string) => line.trim())
      .join("\n\n");
  } catch (err) {
    console.error("Q&A error:", err);
    return "Error: Failed to connect to SafeGIS AI.";
  }
}
