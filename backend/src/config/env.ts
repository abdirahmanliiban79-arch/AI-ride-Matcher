import 'dotenv/config';
import { z } from 'zod';

const emptyStringToUndefined = (value: unknown): unknown => (value === '' ? undefined : value);

const optionalSecret = z.preprocess(emptyStringToUndefined, z.string().min(1).optional());

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(4000),
  MONGODB_URI: z.string().min(1, 'MONGODB_URI is required'),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  TYPE_SAFE_API_KEY: optionalSecret,
  TYPE_SAFE_MODEL: z.string().min(1).default('typesafe/jev-router'),
  TYPE_SAFE_CONFIDENCE_THRESHOLD: z.coerce.number().min(0).max(1).default(0.7),
  OPENROUTER_API_KEY: optionalSecret,
  DEEPSEEK_MODEL: z.string().min(1).default('deepseek/deepseek-v4.1-flash'),
});

export type Env = z.infer<typeof envSchema>;

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const problems = parsed.error.issues
    .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
    .join('; ');
  console.error(`Invalid environment configuration -> ${problems}`);
  process.exit(1);
}

export const env: Env = parsed.data;