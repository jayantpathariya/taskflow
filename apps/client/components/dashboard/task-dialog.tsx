"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import {
  createTaskSchema,
  type CreateTaskInput,
  type ITask,
  type TaskStatus,
  type AiTaskSuggestionResponse,
} from "@taskflow/shared";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sparkles, Loader2 } from "lucide-react";
import { isAxiosError } from "axios";

type TaskFormValues = {
  title: string;
  description?: string;
  status?: TaskStatus;
};

interface TaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  taskToEdit?: ITask | null;
}

export function TaskDialog({
  open,
  onOpenChange,
  taskToEdit,
}: TaskDialogProps) {
  const queryClient = useQueryClient();
  const [aiPrompt, setAiPrompt] = useState("");
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [serverError, setServerError] = useState("");

  const isEditing = !!taskToEdit;

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<TaskFormValues>({
    resolver: zodResolver(createTaskSchema) as any,
    defaultValues: {
      title: "",
      description: "",
      status: "PENDING",
    },
  });

  const selectedStatus = watch("status");

  useEffect(() => {
    if (taskToEdit) {
      reset({
        title: taskToEdit.title,
        description: taskToEdit.description || "",
        status: taskToEdit.status,
      });
    } else {
      reset({
        title: "",
        description: "",
        status: "PENDING",
      });
    }
    setAiPrompt("");
    setServerError("");
  }, [taskToEdit, open, reset]);

  const saveMutation = useMutation({
    mutationFn: async (data: TaskFormValues) => {
      if (isEditing) {
        return (await apiClient.put(`/tasks/${taskToEdit.id}`, data)).data;
      }
      return (await apiClient.post("/tasks", data)).data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["timer"] });
      queryClient.invalidateQueries({ queryKey: ["analytics"] });
      onOpenChange(false);
    },
    onError: (err) => {
      if (isAxiosError(err)) {
        setServerError(
          err.response?.data?.error ||
          err.response?.data?.message ||
          "Failed to save task."
        );
      } else {
        setServerError("An unexpected error occurred.");
      }
    },
  });

  const handleAiSuggest = async () => {
    if (!aiPrompt.trim() || aiPrompt.trim().length < 2) return;

    try {
      setIsGeneratingAi(true);
      setServerError("");
      const res = await apiClient.post<AiTaskSuggestionResponse>(
        "/tasks/ai-suggest",
        { prompt: aiPrompt.trim() }
      );
      if (res.data.title) {
        setValue("title", res.data.title, { shouldValidate: true });
      }
      if (res.data.description) {
        setValue("description", res.data.description, { shouldValidate: true });
      }
      setAiPrompt("");
    } catch (err) {
      if (isAxiosError(err)) {
        setServerError(
          err.response?.data?.error || "AI generation failed. Please try again."
        );
      }
    } finally {
      setIsGeneratingAi(false);
    }
  };

  const onSubmit = (data: TaskFormValues) => {
    setServerError("");
    saveMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Task" : "Create New Task"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update task details and workflow status"
              : "Add a new task or generate one using AI natural language"}
          </DialogDescription>
        </DialogHeader>

        {/* AI Quick Generator Prompt (Only for new tasks) */}
        {!isEditing && (
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-3.5 space-y-2.5">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-primary uppercase tracking-wider">
              <Sparkles className="size-3.5" />
              <span>AI Task Generator</span>
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="e.g. Finish client presentation and send email"
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAiSuggest();
                  }
                }}
                disabled={isGeneratingAi}
                className="bg-background text-xs h-9"
              />
              <Button
                type="button"
                size="sm"
                onClick={handleAiSuggest}
                disabled={isGeneratingAi || aiPrompt.trim().length < 2}
                className="gap-1.5 shrink-0 h-9 px-3 font-medium"
              >
                {isGeneratingAi ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <Sparkles className="size-3.5" />
                )}
                <span>Generate</span>
              </Button>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-1">
          {serverError && (
            <div className="rounded-xl bg-destructive/10 border border-destructive/20 p-3 text-xs text-destructive font-medium">
              {serverError}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              placeholder="e.g. Design Landing Page Wireframes"
              aria-invalid={!!errors.title}
              {...register("title")}
            />
            {errors.title && (
              <p className="text-xs text-destructive">{errors.title.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (optional)</Label>
            <textarea
              id="description"
              rows={3}
              placeholder="Add context, subtasks, or deliverables..."
              className="w-full rounded-2xl border border-border bg-input/40 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30 transition-all resize-none"
              {...register("description")}
            />
            {errors.description && (
              <p className="text-xs text-destructive">
                {errors.description.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Status</Label>
            <div className="grid grid-cols-3 gap-2">
              {(["PENDING", "IN_PROGRESS", "COMPLETED"] as TaskStatus[]).map(
                (status) => (
                  <button
                    key={status}
                    type="button"
                    onClick={() => setValue("status", status)}
                    className={`h-9 rounded-xl border text-xs font-medium transition-all ${
                      selectedStatus === status
                        ? "border-primary bg-primary/10 text-primary shadow-xs"
                        : "border-border text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    }`}
                  >
                    {status === "PENDING" && "Pending"}
                    {status === "IN_PROGRESS" && "In Progress"}
                    {status === "COMPLETED" && "Completed"}
                  </button>
                )
              )}
            </div>
          </div>

          <DialogFooter className="pt-3 gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || saveMutation.isPending}>
              {isSubmitting || saveMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Saving...
                </>
              ) : isEditing ? (
                "Save Changes"
              ) : (
                "Create Task"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
