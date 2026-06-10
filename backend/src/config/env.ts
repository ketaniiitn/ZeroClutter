import dotenv from 'dotenv';
dotenv.config();

const required = (key: string): string => {
  const val = process.env[key];
  if (!val) throw new Error(`Missing required environment variable: ${key}`);
  return val;
};

const optional = (key: string, fallback: string): string =>
  process.env[key] || fallback;

export const env = {
  NODE_ENV: optional('NODE_ENV', 'development'),
  PORT: parseInt(optional('PORT', '3000'), 10),

  DATABASE_URL: required('DATABASE_URL'),

  JWT_SECRET: required('JWT_SECRET'),

  // Google OAuth (optional — app works without it; Google sign-in requires both)
  GOOGLE_CLIENT_ID: optional('GOOGLE_CLIENT_ID', ''),
  GOOGLE_CLIENT_SECRET: optional('GOOGLE_CLIENT_SECRET', ''),

  // Frontend origin for CORS and OAuth redirects
  FRONTEND_URL: optional('FRONTEND_URL', 'http://localhost:5173'),

  GEMINI_API_KEY: required('GEMINI_API_KEY'),

  TELEGRAM_BOT_TOKEN: required('TELEGRAM_BOT_TOKEN'),
  TELEGRAM_CHAT_ID: required('TELEGRAM_CHAT_ID'),

  REDIS_URL: optional('REDIS_URL', ''),

  CANDIDATE_NAME: optional('CANDIDATE_NAME', 'Vyhm Dwivedi'),
  CANDIDATE_EMAIL: optional('CANDIDATE_EMAIL', 'dwivedivyhm@gmail.com'),
  REPOSITORY_URL: optional('REPOSITORY_URL', ''),
  DEPLOYED_URL: optional('DEPLOYED_URL', ''),

  isProd: () => process.env.NODE_ENV === 'production',
  isDev: () => process.env.NODE_ENV === 'development',
};
