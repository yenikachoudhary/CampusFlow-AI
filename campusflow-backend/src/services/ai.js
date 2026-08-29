import { env } from "../config/env.js";
import { HttpError } from "../utils/http.js";

export async function askAI({ question, student, user }) {
  if (!env.aiApiUrl || !env.aiApiKey || !env.aiModel) {
    throw new HttpError(503, "AI provider is not configured", "AI_NOT_CONFIGURED");
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);

  try {
    const response = await fetch(env.aiApiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${env.aiApiKey}`
      },
      body: JSON.stringify({
        model: env.aiModel,
        messages: [
          {
            role: "system",
            content: "You are CampusFlow AI, a helpful university assistant. Answer clearly and concisely. Do not claim access to information that is not provided."
          },
          {
            role: "user",
            content: JSON.stringify({
              question,
              context: {
                role: user?.role || null,
                studentId: student?.studentId || null,
                studentName: student?.name || null
              }
            })
          }
        ]
      }),
      signal: controller.signal
    });

    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new HttpError(502, "AI provider request failed", "AI_PROVIDER_ERROR");
    }

    const answer = payload.choices?.[0]?.message?.content;
    if (typeof answer !== "string" || !answer.trim()) {
      throw new HttpError(502, "AI provider returned an invalid response", "AI_INVALID_RESPONSE");
    }

    return {
      provider: "configured",
      status: "ok",
      intent: "general",
      answer: answer.trim(),
      confidence: null,
      action: null,
      question,
      model: env.aiModel
    };
  } catch (error) {
    if (error instanceof HttpError) throw error;
    if (error.name === "AbortError") {
      throw new HttpError(504, "AI provider request timed out", "AI_TIMEOUT");
    }
    throw new HttpError(502, "Unable to reach AI provider", "AI_PROVIDER_UNAVAILABLE");
  } finally {
    clearTimeout(timeout);
  }
}
