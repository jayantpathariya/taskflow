import { z } from "zod";

export const taskStatusSchema = z.enum(["PENDING", "IN_PROGRESS", "COMPLETED"]);

export const createTaskSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Task title is required")
    .max(120, "Title cannot exceed 120 characters"),
  description: z
    .string()
    .trim()
    .max(1000, "Description cannot exceed 1000 characters")
    .optional()
    .default(""),
  status: taskStatusSchema.optional().default("PENDING"),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;

export const updateTaskSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Task title cannot be empty")
    .max(120, "Title cannot exceed 120 characters")
    .optional(),
  description: z
    .string()
    .trim()
    .max(1000, "Description cannot exceed 1000 characters")
    .optional(),
  status: taskStatusSchema.optional(),
});

export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;

export const aiTaskSuggestionSchema = z.object({
  prompt: z
    .string()
    .trim()
    .min(2, "Prompt must be at least 2 characters")
    .max(300, "Prompt cannot exceed 300 characters"),
});

export type AiTaskSuggestionInput = z.infer<typeof aiTaskSuggestionSchema>;
