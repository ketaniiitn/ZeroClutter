// Set test environment variables before any imports
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'mongodb://localhost:27017/hintro_test';
process.env.JWT_SECRET = 'test-secret-key-for-unit-tests';
process.env.JWT_EXPIRES_IN = '1h';
process.env.GEMINI_API_KEY = 'test-gemini-key';
process.env.TELEGRAM_BOT_TOKEN = 'test-telegram-token';
process.env.TELEGRAM_CHAT_ID = '123456789';
process.env.CANDIDATE_NAME = 'Test User';
process.env.CANDIDATE_EMAIL = 'test@example.com';
process.env.REPOSITORY_URL = 'https://github.com/test/repo';
process.env.DEPLOYED_URL = 'https://test.example.com';
