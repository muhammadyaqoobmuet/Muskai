import path from 'node:path';
import { z } from 'zod';

/**
 * Environment configuration, validated once at boot. If something is wrong
 * the process fails fast with a readable message instead of crashing later
 * inside a request.
 */
const envSchema = z.object({
  API_PORT: z.coerce.number().int().positive().default(4000),
  DASHSCOPE_API_KEY: z.string().optional().default(''),
  DATABASE_URL: z
    .string()
    .min(1)
    .default('postgresql://muskai:muskai_dev@localhost:5432/muskai'),
  STORAGE_DIR: z.string().default('./storage'),
  PUBLIC_FILES_BASE_URL: z.string().optional().default(''),
  WEB_ORIGIN: z.string().default('http://localhost:3000'),
  DASHSCOPE_BASE_URL: z.string().url().default('https://dashscope-intl.aliyuncs.com'),
  /** Secret used to sign session cookies. Must be set in production. */
  SESSION_SECRET: z.string().min(16).default('muskai-dev-secret-change-me'),
  /** Extra browser origins allowed to send credentials (comma separated). */
  EXTRA_WEB_ORIGINS: z.string().optional().default(''),
});

const env = envSchema.parse(process.env);

export const config = {
  port: env.API_PORT,
  dashscopeApiKey: env.DASHSCOPE_API_KEY.trim(),
  dashscopeBaseUrl: env.DASHSCOPE_BASE_URL.replace(/\/$/, ''),
  databaseUrl: env.DATABASE_URL,
  /** Absolute path to the generated-files root (apps/api/storage by default). */
  storageDir: path.resolve(process.cwd(), env.STORAGE_DIR),
  /** Optional public origin for /files, so DashScope can fetch frame images. */
  publicFilesBaseUrl: env.PUBLIC_FILES_BASE_URL.replace(/\/$/, ''),
  webOrigin: env.WEB_ORIGIN,
  sessionSecret: env.SESSION_SECRET,
  /** Origins allowed to call the API with credentials (cookies). */
  allowedOrigins: [
    env.WEB_ORIGIN,
    ...env.EXTRA_WEB_ORIGINS.split(',')
      .map((o) => o.trim())
      .filter(Boolean),
  ],
  get hasDashscopeKey(): boolean {
    return config.dashscopeApiKey.length > 0;
  },
};
