/**
 * Environment Detection Utility
 * =============================
 * 
 * Detects whether the app is running in development (localhost) or production.
 * Used to enable different authentication methods:
 * - Development: Email/password without verification for easy testing
 * - Production: Gmail OAuth and magic links with verification
 */

export function isProduction(): boolean {
  // Check if running on Vercel or custom production domain
  const isVercel = process.env.VERCEL === '1';
  const isCustomDomain = process.env.NEXT_PUBLIC_SITE_URL?.includes('withsoma.ai');
  const isNotLocalhost = !process.env.NEXT_PUBLIC_SITE_URL?.includes('localhost');
  
  return isVercel || isCustomDomain || (isNotLocalhost && process.env.NODE_ENV === 'production');
}

export function isDevelopment(): boolean {
  return !isProduction();
}

export function getAuthMethods() {
  const prod = isProduction();
  
  return {
    isProduction: prod,
    isDevelopment: !prod,
    allowPasswordAuth: !prod, // Only allow password auth in development
    requireEmailVerification: prod, // Only require email verification in production
    allowGoogleOAuth: prod, // Only allow Google OAuth in production
    allowMagicLink: prod, // Only allow magic links in production
    siteUrl: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  };
}

export function logEnvironment() {
  const auth = getAuthMethods();
  console.log('🔐 AUTH ENVIRONMENT:', {
    environment: auth.isProduction ? 'PRODUCTION' : 'DEVELOPMENT',
    site_url: auth.siteUrl,
    methods_enabled: {
      password: auth.allowPasswordAuth,
      google_oauth: auth.allowGoogleOAuth,
      magic_link: auth.allowMagicLink,
      email_verification: auth.requireEmailVerification
    }
  });
}