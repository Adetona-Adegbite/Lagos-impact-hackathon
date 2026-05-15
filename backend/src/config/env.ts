import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  PORT: z
    .string()
    .default("3000")
    .transform((val) => parseInt(val, 10)),
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  JWT_SECRET: z.string().min(1, "JWT_SECRET is required"),
  GEMINI_API_KEY: z.string().optional(),
  SQUAD_SECRET_KEY: z.string().min(1, "SQUAD_SECRET_KEY is required"),
  SQUAD_PUBLIC_KEY: z.string().optional(),
  SQUAD_WEBHOOK_SECRET: z.string().optional(),
});

const envParsed = envSchema.safeParse(process.env);

if (!envParsed.success) {
  console.error(
    "❌ Invalid environment variables:",
    JSON.stringify(envParsed.error.format(), null, 4),
  );
  process.exit(1);
}

export const env = envParsed.data;
