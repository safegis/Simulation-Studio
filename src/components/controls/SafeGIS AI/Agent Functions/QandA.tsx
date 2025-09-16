// \components\controls\SafeGIS AI\Agent Functions\QandA.tsx
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
Conversation so far:
${messages.map((m) => `${m.role}: ${m.content}`).join("\n")}

User: ${userText}
        `,
        max_tokens: 512,
      }),
    });

    const data = await response.json();
    let aiMessage = data?.response || "Sorry, I couldn't generate a response.";

    // Clean up the response to remove any code blocks or tool syntax
    aiMessage = aiMessage
      .replace(/```[\s\S]*?```/g, "") // Remove code blocks
      .replace(/`[^`]*`/g, "") // Remove inline code
      .replace(/^tool_code[\s\S]*$/gm, "") // Remove tool_code lines
      .replace(/import[\s\S]*?;/g, "") // Remove import statements
      .replace(/folium[\s\S]*?html"/g, "") // Remove folium-specific code
      .split("\n")
      .filter((line: string) => {
        const trimmed = line.trim();
        return (
          trimmed &&
          !trimmed.startsWith("import ") &&
          !trimmed.startsWith("from ") &&
          !trimmed.startsWith("#") &&
          !trimmed.includes("folium") &&
          !trimmed.includes(".save(") &&
          !trimmed.includes("print(")
        );
      })
      .map((line: string) => line.trim())
      .join("\n\n")
      .trim();

    // If the response is empty after cleaning, provide a fallback
    if (!aiMessage) {
      aiMessage =
        "I can help you with questions about GIS, disaster management, and mapping technologies. Please feel free to ask about these topics!";
    }

    return aiMessage;
  } catch (err) {
    console.error("Q&A error:", err);
    return "Error: Failed to connect to SafeGIS AI.";
  }
}
