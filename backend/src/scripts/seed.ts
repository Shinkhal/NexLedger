import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { User, UserRole, UserStatus, FinancialRecord, RecordType, RecordCategory } from "../models";
import { getEnv } from "../config/env.config";
import { logger } from "../utils/logger.util";

const SALT_ROUNDS = 12;

async function main() {
  logger.info("🌱 Starting database seeding...");

  const url = getEnv.database.mongo();
  await mongoose.connect(url);
  logger.info("📦 Connected to MongoDB for seeding");

  try {
    logger.info("🗑️  Cleaning existing data...");
    await Promise.all([
      FinancialRecord.deleteMany({}),
      mongoose.connection.db?.collection("sessions").deleteMany({}),
      mongoose.connection.db?.collection("audit_logs").deleteMany({}),
      User.deleteMany({}),
    ]);

    logger.info("👤 Creating seed users...");
    const passwordHash = await bcrypt.hash("password123", SALT_ROUNDS);

    const admin = await User.create({
      email: "admin@nexledger.com",
      name: "NexLedger Admin",
      passwordHash,
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
      timezone: "UTC",
    });

    const analyst = await User.create({
      email: "analyst@nexledger.com",
      name: "NexLedger Analyst",
      passwordHash,
      role: UserRole.ANALYST,
      status: UserStatus.ACTIVE,
      timezone: "UTC",
    });

    const viewer = await User.create({
      email: "viewer@nexledger.com",
      name: "NexLedger Viewer",
      passwordHash,
      role: UserRole.VIEWER,
      status: UserStatus.ACTIVE,
      timezone: "UTC",
    });

    logger.info(`   - Created Admin: ${admin.email}`);
    logger.info(`   - Created Analyst: ${analyst.email}`);
    logger.info(`   - Created Viewer: ${viewer.email}`);

    logger.info("💰 Creating financial records for analytics...");
    const records: Record<string, unknown>[] = [];
    const now = new Date();

    for (let i = 0; i < 100; i++) {
      const isIncome = Math.random() > 0.7;
      const type = isIncome ? RecordType.INCOME : RecordType.EXPENSE;

      const incomeCategories = [RecordCategory.SALARY, RecordCategory.FREELANCE, RecordCategory.INVESTMENT];
      const expenseCategories = [
        RecordCategory.HOUSING, RecordCategory.UTILITIES, RecordCategory.GROCERIES,
        RecordCategory.TRANSPORTATION, RecordCategory.DINING, RecordCategory.ENTERTAINMENT,
      ];

      const category = isIncome
        ? incomeCategories[Math.floor(Math.random() * incomeCategories.length)]
        : expenseCategories[Math.floor(Math.random() * expenseCategories.length)];

      const amount = isIncome
        ? Math.round((Math.random() * 5000 + 1000) * 100) / 100
        : Math.round((Math.random() * 200 + 10) * 100) / 100;

      const date = new Date();
      date.setDate(now.getDate() - Math.floor(Math.random() * 180));

      records.push({
        userId: admin._id,
        amount,
        type,
        category,
        date,
        description: `${type.toLowerCase()} record #${i + 1}`,
        tags: ["seed", category.toLowerCase()],
      });
    }

    for (let m = 0; m < 6; m++) {
      const date = new Date();
      date.setMonth(now.getMonth() - m);
      date.setDate(1);

      records.push({
        userId: admin._id,
        amount: 5000,
        type: RecordType.INCOME,
        category: RecordCategory.SALARY,
        date,
        description: "Monthly salary",
        tags: ["seed", "salary"],
      });

      records.push({
        userId: admin._id,
        amount: 1500,
        type: RecordType.EXPENSE,
        category: RecordCategory.HOUSING,
        date,
        description: "Monthly rent payment",
        tags: ["seed", "rent"],
      });
    }

    await FinancialRecord.insertMany(records);

    logger.info(`✅ Seeded ${records.length} financial records.`);
    logger.info("🏁 Database seeding complete!");
  } catch (error) {
    logger.error("❌ Seeding failed:", error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

main();
