/**
 * Environment detection utilities for authentication flows
 * Determines whether we're in development (localhost) or production
 */

/**
 * Check if we're running in development environment (localhost)
 */
export function isDevelopment(): boolean {
  // Check both client and server environments
  if (typeof window !== 'undefined') {
    // Client-side check
    return window.location.hostname === 'localhost' || 
           window.location.hostname === '127.0.0.1' ||
           window.location.hostname.includes('localhost');
  } else {
    // Server-side check
    return process.env.NODE_ENV === 'development' ||
           process.env.VERCEL_ENV === undefined;
  }
}

/**
 * Check if we're running in production environment (Vercel/withsoma.ai)
 */
export function isProduction(): boolean {
  return !isDevelopment();
}

/**
 * Get the appropriate authentication methods based on environment
 */
export function getAuthMethods() {
  const isDev = isDevelopment();
  
  return {
    isDevelopment: isDev,
    isProduction: !isDev,
    allowEmailPassword: isDev, // Email/password only in dev
    allowGoogleAuth: !isDev,   // Google only in production  
    allowMagicLink: !isDev,    // Magic link only in production
    requireEmailVerification: !isDev // No verification in dev
  };
}

/**
 * Get environment-specific configuration
 */
export function getEnvironmentConfig() {
  const authMethods = getAuthMethods();
  
  return {
    ...authMethods,
    siteDomain: authMethods.isProduction ? 'withsoma.ai' : 'localhost:3000',
    apiBaseUrl: authMethods.isProduction 
      ? 'https://withsoma.ai/api' 
      : 'http://localhost:3000/api',
    supabaseRedirectUrl: authMethods.isProduction
      ? 'https://withsoma.ai/auth/callback'
      : 'http://localhost:3000/auth/callback'
  };
}

/**
 * Log current environment for debugging
 */
export function logEnvironment() {
  const config = getEnvironmentConfig();
  
  if (typeof window !== 'undefined') {
    console.log('🌍 Environment Detection:', {
      hostname: window.location.hostname,
      isDevelopment: config.isDevelopment,
      isProduction: config.isProduction,
      authMethods: {
        emailPassword: config.allowEmailPassword,
        googleAuth: config.allowGoogleAuth,
        magicLink: config.allowMagicLink,
        emailVerification: config.requireEmailVerification
      }
    });
  }
}