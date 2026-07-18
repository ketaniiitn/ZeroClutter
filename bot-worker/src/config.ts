import dotenv from 'dotenv';
dotenv.config();

export type GoogleAuthMode = 'guest' | 'account' | 'hybrid';

const required = (key: string): string => {
  const val = process.env[key];
  if (!val) throw new Error(`Missing required environment variable: ${key}`);
  return val;
};

const authMode = (process.env.GOOGLE_AUTH_MODE || 'hybrid') as GoogleAuthMode;
if (!['guest', 'account', 'hybrid'].includes(authMode)) {
  throw new Error('GOOGLE_AUTH_MODE must be guest, account, or hybrid');
}

export const config = {
  DATABASE_URL: required('DATABASE_URL'),
  REDIS_URL: required('REDIS_URL'),
  BOT_DEFAULT_NAME: process.env.BOT_DEFAULT_NAME || 'ZeroClutter Notetaker',
  NAV_TIMEOUT_MS: parseInt(process.env.NAV_TIMEOUT_MS || '30000', 10),
  ADMISSION_TIMEOUT_MS: parseInt(process.env.ADMISSION_TIMEOUT_MS || '300000', 10),
  IN_CALL_POLL_MS: parseInt(process.env.IN_CALL_POLL_MS || '2000', 10),
  HEADLESS: (process.env.HEADLESS || 'true') !== 'false',
  GOOGLE_AUTH_MODE: authMode,
  GOOGLE_STORAGE_STATE_PATH:
    process.env.GOOGLE_STORAGE_STATE_PATH || '.auth/google-state.json',
  GOOGLE_BOT_EMAIL: process.env.GOOGLE_BOT_EMAIL || null,
};
