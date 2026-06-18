/**
 * Validates required environment variables at startup so the server fails fast
 * with a clear message instead of crashing cryptically (or running insecurely)
 * later. Call this before connecting to anything.
 */
export function validateEnv() {
  const isProd = process.env.NODE_ENV === 'production';

  // Hard requirements — the app cannot run safely without these.
  const required = ['JWT_SECRET', 'MONGO_URI'];

  // In production we additionally require a dedicated refresh secret so we never
  // fall back to the predictable `JWT_SECRET + '_refresh'` derivation.
  if (isProd) {
    required.push('JWT_REFRESH_SECRET');
  }

  const missing = required.filter((key) => !process.env[key] || !process.env[key]!.trim());

  if (missing.length > 0) {
    console.error(
      `[FATAL] Missing required environment variable(s): ${missing.join(', ')}.\n` +
        `Set them in your .env file (see README .env.example) before starting the server.`
    );
    process.exit(1);
  }

  // Weak-secret guard — short secrets are trivially brute-forced.
  if (isProd && (process.env.JWT_SECRET as string).length < 32) {
    console.error('[FATAL] JWT_SECRET must be at least 32 characters in production.');
    process.exit(1);
  }

  // Soft warnings — features degrade but the server can still boot.
  const recommended = ['GEMINI_API_KEY', 'EMAIL_USER', 'EMAIL_APP_PASSWORD', 'REDIS_URL', 'FRONTEND_URL'];
  const warn = recommended.filter((key) => !process.env[key] || !process.env[key]!.trim());
  if (warn.length > 0) {
    console.warn(
      `[WARN] Recommended environment variable(s) not set: ${warn.join(', ')}. ` +
        `Related features (AI generation, email, queue, CORS) may not work correctly.`
    );
  }

  if (!isProd && !process.env.JWT_REFRESH_SECRET) {
    console.warn('[WARN] JWT_REFRESH_SECRET not set — using a derived dev fallback. Set it explicitly for production.');
  }
}
