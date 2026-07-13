import mongoose, { Schema, Document } from "mongoose";

export enum UserRole {
  VIEWER = "VIEWER",
  ANALYST = "ANALYST",
  ADMIN = "ADMIN",
}

export enum UserStatus {
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
  SUSPENDED = "SUSPENDED",
}

export interface IUser extends Document {
  email: string;
  passwordHash: string;
  name: string;
  role: UserRole;
  status: UserStatus;
  phoneNumber?: string;
  avatar?: string;
  timezone?: string;
  resetToken?: string;
  resetTokenExpires?: Date;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;
}

const UserSchema = new Schema<IUser>(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    name: { type: String, required: true, trim: true },
    role: { type: String, enum: Object.values(UserRole), default: UserRole.VIEWER },
    status: { type: String, enum: Object.values(UserStatus), default: UserStatus.ACTIVE },
    phoneNumber: { type: String },
    avatar: { type: String },
    timezone: { type: String, default: "UTC" },
    resetToken: { type: String },
    resetTokenExpires: { type: Date },
    lastLoginAt: { type: Date },
  },
  {
    timestamps: true,
    collection: "users",
    toJSON: {
      transform(_doc, ret) {
        delete ret.__v;
        return ret;
      },
    },
  }
);

UserSchema.index({ status: 1, role: 1 });

export const User = mongoose.model<IUser>("User", UserSchema);
