/**
 * Comprehensive cache cleanup utility for preventing cross-user data leakage
 * Use this when users sign out or when switching between different user accounts
 */

export interface CacheCleanupResult {
  success: boolean;
  errors: string[];
  clearedItems: string[];
}

/**
 * Clears all browser storage, caches, and cookies
 * This is the most aggressive cache clearing approach
 */
export async function clearAllBrowserData(): Promise<CacheCleanupResult> {
  const result: CacheCleanupResult = {
    success: true,
    errors: [],
    clearedItems: []
  };

  if (typeof window === 'undefined') {
    result.errors.push('Not running in browser environment');
    result.success = false;
    return result;
  }

  // Clear localStorage
  try {
    const localStorageKeys = Object.keys(localStorage);
    localStorage.clear();
    result.clearedItems.push(`localStorage (${localStorageKeys.length} items)`);
  } catch (error) {
    result.errors.push(`localStorage: ${error}`);
    result.success = false;
  }

  // Clear sessionStorage
  try {
    const sessionStorageKeys = Object.keys(sessionStorage);
    sessionStorage.clear();
    result.clearedItems.push(`sessionStorage (${sessionStorageKeys.length} items)`);
  } catch (error) {
    result.errors.push(`sessionStorage: ${error}`);
    result.success = false;
  }

  // Clear all cookies
  try {
    let cookieCount = 0;
    const cookies = document.cookie.split(';');
    
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i];
      const eqPos = cookie.indexOf('=');
      const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
      
      if (name) {
        // Clear with different path and domain combinations
        const clearOptions = [
          { path: '/', domain: '' },
          { path: '/', domain: window.location.hostname },
          { path: '/', domain: `.${window.location.hostname}` },
          { path: '/dashboard', domain: '' },
          { path: '/api', domain: '' }
        ];

        clearOptions.forEach(({ path, domain }) => {
          const domainStr = domain ? `; domain=${domain}` : '';
          document.cookie = `${name}=; path=${path}${domainStr}; expires=Thu, 01 Jan 1970 00:00:00 GMT; max-age=0; SameSite=Lax`;
          document.cookie = `${name}=; path=${path}${domainStr}; expires=Thu, 01 Jan 1970 00:00:00 GMT; max-age=0; SameSite=Lax; Secure`;
        });
        
        cookieCount++;
      }
    }
    
    result.clearedItems.push(`cookies (${cookieCount} items)`);
  } catch (error) {
    result.errors.push(`cookies: ${error}`);
    result.success = false;
  }

  // Clear Cache API
  try {
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map(cacheName => caches.delete(cacheName)));
      result.clearedItems.push(`Cache API (${cacheNames.length} caches)`);
    }
  } catch (error) {
    result.errors.push(`Cache API: ${error}`);
    result.success = false;
  }

  // Clear IndexedDB
  try {
    if ('indexedDB' in window && indexedDB.databases) {
      const databases = await indexedDB.databases();
      await Promise.all(
        databases.map(db => {
          if (db.name) {
            return new Promise<void>((resolve, reject) => {
              const deleteRequest = indexedDB.deleteDatabase(db.name!);
              deleteRequest.onsuccess = () => resolve();
              deleteRequest.onerror = () => reject(deleteRequest.error);
              deleteRequest.onblocked = () => {
                console.warn(`IndexedDB deletion blocked for ${db.name}`);
                resolve(); // Continue even if blocked
              };
            });
          }
          return Promise.resolve();
        })
      );
      result.clearedItems.push(`IndexedDB (${databases.length} databases)`);
    }
  } catch (error) {
    result.errors.push(`IndexedDB: ${error}`);
    result.success = false;
  }

  // Clear WebSQL (deprecated but still in some browsers)
  try {
    if ('webkitStorageInfo' in window) {
      (window as any).webkitStorageInfo.requestQuota(
        (window as any).TEMPORARY, 
        0, 
        () => result.clearedItems.push('WebSQL temporary storage'),
        (error: any) => result.errors.push(`WebSQL: ${error}`)
      );
    }
  } catch (error) {
    result.errors.push(`WebSQL: ${error}`);
  }

  // Clear Service Worker caches if available
  try {
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map(registration => registration.unregister()));
      result.clearedItems.push(`Service Workers (${registrations.length} registrations)`);
    }
  } catch (error) {
    result.errors.push(`Service Workers: ${error}`);
  }

  return result;
}

/**
 * Clears only authentication-related data (less aggressive)
 * Use this for partial cleanup when switching brands/workspaces
 */
export function clearAuthData(): CacheCleanupResult {
  const result: CacheCleanupResult = {
    success: true,
    errors: [],
    clearedItems: []
  };

  if (typeof window === 'undefined') {
    result.errors.push('Not running in browser environment');
    result.success = false;
    return result;
  }

  // Clear auth-related localStorage items
  try {
    const authKeys = [
      'selectedBrandId',
      'selectedWorkspaceId',
      'supabase.auth.token',
      'sb-auth-token',
      'user-preferences',
      'dashboard-state'
    ];

    authKeys.forEach(key => {
      if (localStorage.getItem(key)) {
        localStorage.removeItem(key);
        result.clearedItems.push(`localStorage.${key}`);
      }
    });

    // Clear any keys starting with dashboard_access_
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('dashboard_access_')) {
        localStorage.removeItem(key);
        result.clearedItems.push(`localStorage.${key}`);
      }
    });
  } catch (error) {
    result.errors.push(`localStorage auth data: ${error}`);
    result.success = false;
  }

  // Clear auth-related cookies
  try {
    const authCookies = [
      'selected-brand-id',
      'selected-workspace-id',
      'sb-auth-token',
      'sb-refresh-token',
      'supabase.auth.token',
      'session',
      'session.sig'
    ];

    authCookies.forEach(cookieName => {
      document.cookie = `${cookieName}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; max-age=0`;
      document.cookie = `${cookieName}=; path=/; domain=${window.location.hostname}; expires=Thu, 01 Jan 1970 00:00:00 GMT; max-age=0`;
      result.clearedItems.push(`cookie.${cookieName}`);
    });
  } catch (error) {
    result.errors.push(`auth cookies: ${error}`);
    result.success = false;
  }

  return result;
}

/**
 * Get cache headers for preventing caching on sensitive responses
 */
export function getNoCacheHeaders(): Record<string, string> {
  return {
    'Cache-Control': 'no-cache, no-store, must-revalidate, private, max-age=0',
    'Pragma': 'no-cache',
    'Expires': '0',
    'Last-Modified': new Date().toUTCString(),
    'ETag': '',
    'Vary': 'Cookie, Authorization',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'no-referrer'
  };
}

/**
 * Utility for debugging cache state
 */
export function getCacheInfo(): {
  localStorage: number;
  sessionStorage: number;
  cookies: number;
  cacheAPI?: number;
} {
  const info = {
    localStorage: 0,
    sessionStorage: 0,
    cookies: 0,
    cacheAPI: undefined as number | undefined
  };

  if (typeof window === 'undefined') {
    return info;
  }

  try {
    info.localStorage = Object.keys(localStorage).length;
  } catch (error) {
    console.warn('Cannot access localStorage:', error);
  }

  try {
    info.sessionStorage = Object.keys(sessionStorage).length;
  } catch (error) {
    console.warn('Cannot access sessionStorage:', error);
  }

  try {
    info.cookies = document.cookie.split(';').filter(c => c.trim()).length;
  } catch (error) {
    console.warn('Cannot access cookies:', error);
  }

  if ('caches' in window) {
    caches.keys().then(names => {
      info.cacheAPI = names.length;
    }).catch(error => {
      console.warn('Cannot access Cache API:', error);
    });
  }

  return info;
}