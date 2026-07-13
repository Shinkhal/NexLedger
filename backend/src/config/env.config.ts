import dotenv from "dotenv";

dotenv.config();

/* =====================================
   INTERNAL HELPERS
===================================== */

function required(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`❌ Missing environment variable: ${key}`);
  }
  return value;
}

function optional(key: string, defaultValue = ""): string {
  return process.env[key] ?? defaultValue;
}

function number(key: string, defaultValue?: number): number {
  const raw = process.env[key];
  if (!raw) {
    if (defaultValue !== undefined) return defaultValue;
    throw new Error(`❌ Missing environment variable: ${key}`);
  }

  const parsed = Number(raw);
  if (Number.isNaN(parsed)) {
    throw new Error(`❌ ${key} must be a number (got "${raw}")`);
  }
  return parsed;
}

function boolean(key: string, defaultValue = false): boolean {
  const raw = process.env[key];
  if (raw === undefined) return defaultValue;
  return raw === "true" || raw === "1";
}

function present(value: unknown): string {
  return value ? "✔ PRESENT" : "❌ MISSING";
}

function yesNo(value: boolean): string {
  return value ? "ON" : "OFF";
}

/* =====================================
   ENV CONFIG (PUBLIC API)
===================================== */

export const getEnv = {
  /* ---------- APP ---------- */
  app: {
    env: () => optional("NODE_ENV", "development"),
    isDev: () => optional("NODE_ENV", "development") === "development",
    isProd: () => optional("NODE_ENV", "development") === "production",
    port: () => number("PORT", 5000),
  },

  /* ---------- CLIENT ---------- */
  client: {
    url: () => optional("CLIENT_URL", "http://localhost:3000"),
  },

  /* ---------- DATABASE ---------- */
  database: {
    mongo: () => required("DATABASE_URL"),
  },

  /* ---------- JWT / AUTH ---------- */
  jwt: {
    accessSecret: () => required("ACCESS_TOKEN_SECRET"),
    refreshSecret: () => required("REFRESH_TOKEN_SECRET"),
    accessExpiresIn: () => optional("ACCESS_TOKEN_EXPIRES_IN", "15m"),
    refreshExpiresIn: () => optional("REFRESH_TOKEN_EXPIRES_IN", "7d"),
  },

  /* ---------- CORS ---------- */
  cors: {
    origin: () => optional("CORS_ORIGIN", ""),
  },

  /* ---------- PAGINATION DEFAULTS ---------- */
  pagination: {
    defaultPage: () => number("DEFAULT_PAGE", 1),
    defaultLimit: () => number("DEFAULT_LIMIT", 20),
    maxLimit: () => number("MAX_LIMIT", 100),
  },

  /* ---------- RESEND / EMAIL ---------- */
  mail: {
    resendApiKey: () => optional("RESEND_API_KEY"),
    from: () => optional("EMAIL_FROM", "NexLedger <onboarding@resend.dev>"),
  },

  /* ---------- FEATURE FLAGS ---------- */
  features: {
    seedOnStart: () => boolean("FEATURE_SEED_ON_START", false),
  },

  /* =====================================
     VALIDATION
  ===================================== */

  validate(): void {
    console.log("🔍 Validating environment configuration...");

    try {
      // App
      this.app.env();

      // Database
      this.database.mongo();

      // Auth
      this.jwt.accessSecret();
      this.jwt.refreshSecret();

      // Mail (in prod, we might want to ensure these are set)
      if (this.app.isProd()) {
        if (!process.env.RESEND_API_KEY) throw new Error("❌ Missing RESEND_API_KEY in production");
      }

      console.log("✅ Environment validation successful");
      console.log(`   Environment: ${this.app.env()}`);
    } catch (err: any) {
      console.error("❌ Environment validation failed:");
      console.error(`   ${err.message}`);
      process.exit(1);
    }
  },

  /* =====================================
     SAFE PRINT (NO SECRETS)
  ===================================== */
  print(): void {
    console.log("");
    console.log("💰 NEXLEDGER FINANCE DASHBOARD CONFIG");
    console.log("════════════════════════════════════");

    /* ---------- RUNTIME ---------- */
    console.log("🧩 Runtime");
    console.log(`  Environment        : ${this.app.env()}`);
    console.log(`  Port               : ${this.app.port()}`);
    console.log("");

    /* ---------- CLIENT ---------- */
    console.log("🌐 Client");
    console.log(`  Client URL         : ${this.client.url()}`);
    console.log("");

    /* ---------- DATABASE ---------- */
    console.log("🗄️  Database");
    console.log(`  MongoDB            : ${present(process.env.DATABASE_URL)}`);
    console.log("");

    /* ---------- AUTH ---------- */
    console.log("🔐 Auth");
    console.log(`  JWT Access Secret  : ${present(process.env.ACCESS_TOKEN_SECRET)}`);
    console.log(`  JWT Refresh Secret : ${present(process.env.REFRESH_TOKEN_SECRET)}`);
    console.log(`  Access Expires In  : ${this.jwt.accessExpiresIn()}`);
    console.log(`  Refresh Expires In : ${this.jwt.refreshExpiresIn()}`);
    console.log("");

    /* ---------- CORS ---------- */
    console.log("🌍 CORS");
    console.log(`  Allowed Origin     : ${this.cors.origin()}`);
    console.log("");

    /* ---------- PAGINATION ---------- */
    console.log("📄 Pagination");
    console.log(`  Default Limit      : ${this.pagination.defaultLimit()}`);
    console.log(`  Max Limit          : ${this.pagination.maxLimit()}`);
    console.log("");

    /* ---------- MAIL ---------- */
    console.log("📧 Mail");
    console.log(`  Provider           : Resend`);
    console.log(`  API Key            : ${present(process.env.RESEND_API_KEY)}`);
    console.log(`  From               : ${this.mail.from()}`);
    console.log("");

    /* ---------- FEATURES ---------- */
    console.log("🚀 Feature Flags");
    console.log(`  Seed on Start      : ${yesNo(this.features.seedOnStart())}`);
    console.log("");

    console.log("════════════════════════════════════");
    console.log("✅ Environment loaded (secrets hidden)");
    console.log("");
  },
};

/* =====================================
   AUTO VALIDATE (PROD)
===================================== */

if (getEnv.app.isProd()) {
  getEnv.validate();
}
