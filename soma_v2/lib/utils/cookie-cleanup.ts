/**
 * Utility to clean up problematic cookies that might cause HTTP 431 errors
 */
export function clearProblematicCookies() {
  if (typeof document === 'undefined') return;
  
  try {
    // List of cookie names that might be causing issues
    const problematicCookies = [
      'selected-brand-id',
      'selected-workspace-id',
      // Add other cookies that might be accumulating
    ];
    
    problematicCookies.forEach(cookieName => {
      // Clear the cookie by setting it to expire in the past
      document.cookie = `${cookieName}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`;
      // Also try with different path variations
      document.cookie = `${cookieName}=; path=/dashboard; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`;
      document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`;
    });
    
    console.log('Cleared problematic cookies');
  } catch (error) {
    console.error('Failed to clear problematic cookies:', error);
  }
}

/**
 * Get the total size of all cookies to help debug HTTP 431 errors
 */
export function getCookieSize(): number {
  if (typeof document === 'undefined') return 0;
  
  try {
    const cookies = document.cookie;
    return new Blob([cookies]).size;
  } catch (error) {
    console.error('Failed to calculate cookie size:', error);
    return 0;
  }
}

/**
 * Log cookie information for debugging
 */
export function debugCookies() {
  if (typeof document === 'undefined') return;
  
  try {
    const cookies = document.cookie.split(';');
    const cookieSize = getCookieSize();
    
    console.log('Cookie Debug Info:', {
      totalCookies: cookies.length,
      totalSize: cookieSize,
      sizeInKB: (cookieSize / 1024).toFixed(2),
      cookies: cookies.map(cookie => {
        const [name, value] = cookie.trim().split('=');
        return {
          name,
          size: new Blob([cookie]).size
        };
      })
    });
    
    if (cookieSize > 4000) {
      console.warn('Cookie size is getting large, this might cause HTTP 431 errors');
    }
  } catch (error) {
    console.error('Failed to debug cookies:', error);
  }
}