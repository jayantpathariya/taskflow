import { generateText, Output } from "ai";
import { google } from "@ai-sdk/google";
import { z } from "zod";
import type { AiTaskSuggestionResponse } from "@taskflow/shared";

const AI_MODEL = process.env.GOOGLE_AI_MODEL || "gemini-2.5-flash";

const taskSuggestionSchema = z.object({
  title: z
    .string()
    .describe(
      "A clean, professional, action-oriented task title (max 60 chars)"
    ),
  description: z
    .string()
    .describe(
      "A clear, structured, actionable breakdown of what needs to be done"
    ),
});

const fallbackSuggest = (prompt: string): AiTaskSuggestionResponse => {
  const words = prompt.trim().split(/\s+/);
  const capitalized = words
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");

  return {
    title: capitalized,
    description: `Follow up and complete: "${prompt.trim()}". Review progress and check deliverables.`,
  };
};

export const generateTaskSuggestion = async (
  prompt: string
): Promise<AiTaskSuggestionResponse> => {
  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;

  if (!apiKey) {
    return fallbackSuggest(prompt);
  }

  try {
    const { output } = await generateText({
      model: google(AI_MODEL),
      output: Output.object({
        schema: taskSuggestionSchema,
        name: "TaskSuggestion",
        description:
          "Structured task suggestion parsed from natural language prompt",
      }),
      instructions: `You are an AI task assistant in a productivity app. 
Transform natural language task inputs into a crisp, professional task title and a structured, actionable description.

Requirements:
- Title: Concise, active verb, professional (e.g., "Follow up with UI Designer")
- Description: Specific next steps, context, or action items (e.g., "Send a Slack message to confirm wireframe delivery status.")`,
      prompt: `User input: "${prompt}"`,
    });

    return output;
  } catch (error) {
    console.warn(
      "[AI SDK] Generation failed, using heuristic fallback:",
      error
    );
    return fallbackSuggest(prompt);
  }
};
