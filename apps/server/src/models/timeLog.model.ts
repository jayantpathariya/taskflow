import { Schema, model, type Document, type Types } from "mongoose";
import type { ITimeLog } from "@taskflow/shared";

export interface ITimeLogDocument
  extends Document,
    Omit<
      ITimeLog,
      | "id"
      | "taskId"
      | "userId"
      | "createdAt"
      | "updatedAt"
      | "startTime"
      | "endTime"
    > {
  taskId: Types.ObjectId;
  userId: Types.ObjectId;
  startTime: Date;
  endTime?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const timeLogSchema = new Schema<ITimeLogDocument>(
  {
    taskId: {
      type: Schema.Types.ObjectId,
      ref: "Task",
      required: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    startTime: {
      type: Date,
      default: Date.now,
      required: true,
    },
    endTime: {
      type: Date,
      default: null,
    },
    durationSeconds: {
      type: Number,
      default: 0,
      min: 0,
    },
    isRunning: {
      type: Boolean,
      default: true,
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

export const TimeLog = model<ITimeLogDocument>("TimeLog", timeLogSchema);
