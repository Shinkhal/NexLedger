import mongoose from "mongoose";

export class HealthService {
  private constructor() {}

  static async getStatus() {
    const uptime = process.uptime();
    const memoryUsage = process.memoryUsage();

    let dbStatus = "disconnected";
    try {
      if (mongoose.connection.db) {
        await mongoose.connection.db.admin().ping();
        dbStatus = "connected";
      }
    } catch {
      dbStatus = "error";
    }

    return {
      status: "ok",
      timestamp: new Date().toISOString(),
      uptime: `${Math.floor(uptime / 60)}m ${Math.floor(uptime % 60)}s`,
      memory: {
        heapTotal: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)} MB`,
        heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)} MB`,
        rss: `${Math.round(memoryUsage.rss / 1024 / 1024)} MB`,
      },
      database: dbStatus,
    };
  }
}
