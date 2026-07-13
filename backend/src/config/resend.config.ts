import { Resend } from "resend";
import { getEnv } from "./env.config";
import { logger } from "../utils/logger.util";

class ResendConfig {
  private static client: Resend | null = null;

  private constructor() {}

  static getInstance(): Resend {
    if (!ResendConfig.client) {
      throw new Error("Resend not initialized. Call ResendConfig.init() first.");
    }
    return ResendConfig.client;
  }

  static init(): void {
    if (ResendConfig.client) {
      logger.debug("Resend already initialized");
      return;
    }

    const apiKey = getEnv.mail.resendApiKey();
    if (!apiKey) {
      logger.warn("RESEND_API_KEY not set — email service will be unavailable");
      return;
    }

    ResendConfig.client = new Resend(apiKey);
    logger.info("Resend client initialized");
  }

  static shutdown(): void {
    if (!ResendConfig.client) return;

    ResendConfig.client = null;
    logger.info("Resend client shut down");
  }

  static isAvailable(): boolean {
    return ResendConfig.client !== null;
  }
}

export default ResendConfig;
