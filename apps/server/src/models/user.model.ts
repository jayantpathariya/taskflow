import { Schema, model, type Document } from "mongoose";
import type { IUser } from "@taskflow/shared";

export interface IUserDocument
  extends Document, Omit<IUser, "id" | "createdAt" | "updatedAt"> {
  passwordHash: string;
  refreshToken?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUserDocument>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    refreshToken: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

userSchema.set("toJSON", {
  transform: (_doc, ret: Record<string, any>): IUser => {
    return {
      id: ret._id.toString(),
      name: ret.name,
      email: ret.email,
      createdAt: ret.createdAt.toISOString(),
      updatedAt: ret.updatedAt.toISOString(),
    };
  },
});

export const User = model<IUserDocument>("User", userSchema);
