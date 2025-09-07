"use client";

type Message = {
  role: "user" | "assistant";
  content: string;
};

export async function runQandA(
  messages: Message[],
  userText: string
): Promise<string> {
  try {
    const response = await fetch(process.env.NEXT_PUBLIC_MODEL_ENDPOINT!, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt: `
You are SafeGIS AI. Only answer questions related to disaster management, GIS, and mapping. 
If the user asks about unrelated topics, politely refuse and remind them you are specialized only in these domains.

Conversation so far:
${messages.map((m) => `${m.role}: ${m.content}`).join("\n")}

User: ${userText}
`,
        max_tokens: 256,
      }),
    });

    const data = await response.json();
    const aiMessage =
      data?.response || "Sorry, I couldn’t generate a response.";

    return aiMessage
      .split("\n")
      .map((line: string) => line.trim())
      .join("\n\n");
  } catch (err) {
    console.error("Q&A error:", err);
    return "Error: Failed to connect to SafeGIS AI.";
  }
}
