import { Schema, model, type Document, type Types } from "mongoose";
import type { ITask, TaskStatus } from "@taskflow/shared";

export interface ITaskDocument
  extends Document,
    Omit<ITask, "id" | "userId" | "createdAt" | "updatedAt"> {
  userId: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const taskSchema = new Schema<ITaskDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    description: {
      type: String,
      trim: true,
      default: "",
      maxlength: 1000,
    },
    status: {
      type: String,
      enum: ["PENDING", "IN_PROGRESS", "COMPLETED"],
      default: "PENDING",
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

taskSchema.set("toJSON", {
  transform: (_doc, ret: Record<string, any>): ITask => {
    return {
      id: ret._id.toString(),
      userId: ret.userId.toString(),
      title: ret.title,
      description: ret.description,
      status: ret.status as TaskStatus,
      createdAt: ret.createdAt.toISOString(),
      updatedAt: ret.updatedAt.toISOString(),
    };
  },
});

export const Task = model<ITaskDocument>("Task", taskSchema);
