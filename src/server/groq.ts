export interface GroqMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface GroqEnv {
  GROQ_API_KEY?: string;
  GROQ_MODEL?: string;
}

export const buildPactSystemPrompt = (taskSummary: string) => `
You are Pact, a personal accountability assistant.
Your role is to help the user stay honest, realistic, and focused on their plan.
Do not sound corporate or robotic.
Keep language calm, direct, supportive, and practical.

Current task context:
${taskSummary}

Rules:
- Prioritize honest progress over morale-driven optimism.
- If the user says they are blocked, irritated, or losing momentum, suggest a smaller next action.
- If tasks are slipping, be realistic about the schedule and recommend a narrower scope.
- Never invent missing facts about the user's life, work, or schedule.
- Keep responses brief and actionable.
`;

export const generateGroqReply = async (
  env: GroqEnv,
  messages: GroqMessage[],
): Promise<string> => {
  const apiKey = env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error(
      "GROQ_API_KEY is not configured. Add it to .dev.vars before running the local app.",
    );
  }

  const response = await fetch(
    "https://api.groq.com/openai/v1/chat/completions",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: env.GROQ_MODEL ?? "openai/gpt-oss-120b",
        messages,
        temperature: 0.7,
        max_tokens: 300,
      }),
    },
  );

  if (!response.ok) {
    const text = await response.text();
    throw new Error(
      `Groq request failed with status ${response.status}: ${text.slice(0, 250)}`,
    );
  }

  const payload = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };

  const content = payload.choices?.[0]?.message?.content?.trim();
  if (!content) {
    throw new Error("Groq returned no reply content.");
  }

  return content;
};
