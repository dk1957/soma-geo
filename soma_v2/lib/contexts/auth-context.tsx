'use client';

// Re-export from Clerk-based auth context
// This maintains backward compatibility with existing code
export { AuthProvider, useAuth } from './auth-context-clerk';