import mongoose from "mongoose";
import { getEnv } from "./env.config";
import { logger } from "../utils/logger.util";

class DatabaseConfig {
  private static isConnected = false;

  private constructor() {}

  public static async connect(): Promise<void> {
    if (DatabaseConfig.isConnected) {
      logger.debug("MongoDB already connected");
      return;
    }

    const url = getEnv.database.mongo();
    
    const sanitizedUrl = url.replace(/\/\/[^:]+:[^@]+@/, '//***:***@');
    logger.debug(`Connecting to MongoDB: ${sanitizedUrl.substring(0, 50)}...`);

    try {
      mongoose.connection.on("connected", () => {
        logger.info("MongoDB connected");
        DatabaseConfig.isConnected = true;
      });

      mongoose.connection.on("error", (err) => {
        logger.error("MongoDB connection error", { error: err.message });
      });

      mongoose.connection.on("disconnected", () => {
        logger.warn("MongoDB disconnected");
        DatabaseConfig.isConnected = false;
      });

      await mongoose.connect(url, {
        dbName: 'NexLedger',
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
        retryWrites: true,
      } as any);

      logger.info("MongoDB connected successfully");
    } catch (error: any) {
      logger.error("Failed to connect to MongoDB", { error: error.message });
      throw error;
    }
  }

  public static async disconnect(): Promise<void> {
    if (!DatabaseConfig.isConnected) return;

    await mongoose.disconnect();
    DatabaseConfig.isConnected = false;
    logger.info("MongoDB disconnected");
  }

  public static async healthCheck(): Promise<boolean> {
    try {
      if (!mongoose.connection.db) return false;
      await mongoose.connection.db.admin().ping();
      return true;
    } catch (error) {
      logger.error("MongoDB health check failed", { error });
      return false;
    }
  }

  public static async forceCleanup(): Promise<void> {
    await mongoose.disconnect();
    DatabaseConfig.isConnected = false;
    logger.warn("MongoDB connection force cleaned");
  }

  public static get isConnectedStatus(): boolean {
    return DatabaseConfig.isConnected;
  }
}

export const mongooseConnection = mongoose.connection;
export default DatabaseConfig;
