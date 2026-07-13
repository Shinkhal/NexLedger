import bcrypt from "bcryptjs";
import { User, UserRole, UserStatus } from "../models";
import { AppError } from "../utils/appError.util";
import { logger } from "../utils/logger.util";
import { EmailService } from "./email.service";
import { PaginationParams } from "../types";

interface CreateUserInput {
  email: string;
  password: string;
  name: string;
  role: UserRole;
  status: UserStatus;
  phoneNumber?: string;
  timezone?: string;
}

interface ListUsersFilters {
  role?: UserRole;
  status?: UserStatus;
  search?: string;
}

interface UpdateUserInput {
  name?: string;
  phoneNumber?: string;
  avatar?: string;
  timezone?: string;
}

const SALT_ROUNDS = 12;

export class UserService {
  private constructor() {}

  static async create(input: CreateUserInput) {
    const existing = await User.findOne({ email: input.email }).lean();
    if (existing) throw AppError.conflict("A user with this email already exists");

    const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS);

    const user = await User.create({
      email: input.email,
      passwordHash,
      name: input.name,
      role: input.role,
      status: input.status,
      phoneNumber: input.phoneNumber,
      timezone: input.timezone || "UTC",
    });

    logger.info(`User created: ${user.email} (${user.role})`);

    EmailService.sendWelcomeEmail({
      name: input.name,
      email: input.email,
      password: input.password,
      role: input.role,
    }).catch((err) => logger.error("Failed to send welcome email", err));

    return user.toObject();
  }

  static async list(filters: ListUsersFilters, pagination: PaginationParams) {
    const query: Record<string, unknown> = {};

    if (filters.role) query.role = filters.role;
    if (filters.status) query.status = filters.status;
    if (filters.search) {
      query.$or = [
        { name: { $regex: filters.search, $options: "i" } },
        { email: { $regex: filters.search, $options: "i" } },
      ];
    }

    const [users, total] = await Promise.all([
      User.find(query)
        .sort({ createdAt: -1 })
        .skip(pagination.skip)
        .limit(pagination.limit)
        .lean(),
      User.countDocuments(query),
    ]);

    return { users, total };
  }

  static async getById(id: string) {
    const user = await User.findById(id).lean();
    if (!user) throw AppError.notFound("User");
    return user;
  }

  static async update(id: string, data: UpdateUserInput) {
    const user = await User.findByIdAndUpdate(id, data, { new: true }).lean();
    if (!user) throw AppError.notFound("User");
    logger.info(`User updated: ${user.email}`);
    return user;
  }

  static async updateRole(id: string, role: UserRole) {
    const user = await User.findByIdAndUpdate(id, { role }, { new: true }).lean();
    if (!user) throw AppError.notFound("User");
    logger.info(`User role updated: ${user.email} → ${role}`);
    return user;
  }

  static async updateStatus(id: string, status: UserStatus) {
    const user = await User.findByIdAndUpdate(id, { status }, { new: true }).lean();
    if (!user) throw AppError.notFound("User");
    logger.info(`User status updated: ${user.email} → ${status}`);
    return user;
  }

  static async delete(id: string) {
    const user = await User.findByIdAndDelete(id).lean();
    if (!user) throw AppError.notFound("User");
    logger.info(`User deleted: ${user.email}`);
  }

  static async getProfile(userId: string) {
    return UserService.getById(userId);
  }

  static async updateProfile(userId: string, data: UpdateUserInput) {
    return UserService.update(userId, data);
  }
}
