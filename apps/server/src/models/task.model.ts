import { Schema, model, type Document, type Types } from "mongoose";
import type { ITask, TaskStatus } from "@taskflow/shared";

export interface ITaskDocument
  extends Document, Omit<ITask, "id" | "userId" | "createdAt" | "updatedAt"> {
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
    toJSON: {
      virtuals: true,
      transform: (_doc, ret: Record<string, any>) => {
        delete ret._id;
        delete ret.__v;
      },
    },
  }
);

export const Task = model<ITaskDocument>("Task", taskSchema);
