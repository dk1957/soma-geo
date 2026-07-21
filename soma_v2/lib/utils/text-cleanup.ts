/**
 * Utility function to clean markdown formatting from AI responses
 * Removes ### headers, ** bold text, and other markdown elements
 * while preserving the content in a clean, readable format
 */

export function cleanMarkdownFromResponse(text: string): string {
  if (!text || typeof text !== 'string') return text;
  
  let cleaned = text;
  
  // Remove ### headers but keep the text
  cleaned = cleaned.replace(/^#{1,6}\s+(.+)$/gm, '$1');
  
  // Remove ** bold markers but keep the text
  cleaned = cleaned.replace(/\*\*([^*]+)\*\*/g, '$1');
  
  // Remove * italic markers but keep the text
  cleaned = cleaned.replace(/\*([^*]+)\*/g, '$1');
  
  // Remove --- horizontal rules
  cleaned = cleaned.replace(/^---+$/gm, '');
  
  // Remove [link text](url) but keep the link text
  cleaned = cleaned.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
  
  // Remove numbered list markers at the beginning of lines (1. 2. etc.)
  cleaned = cleaned.replace(/^\d+\.\s+/gm, '');
  
  // Remove bullet point markers (- or * at start of line)
  cleaned = cleaned.replace(/^[-*]\s+/gm, '');
  
  // Remove multiple consecutive line breaks
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n');
  
  // Remove emojis and special unicode characters that are often used as decorative elements
  cleaned = cleaned.replace(/[🥇🥈🥉⭐️🌟✨💫🔝🎯📈📊🚀💡🏆🎖️⚡️]/g, '');
  
  // Clean up any remaining markdown-style formatting
  cleaned = cleaned.replace(/`([^`]+)`/g, '$1'); // Remove code backticks
  cleaned = cleaned.replace(/_{2,}([^_]+)_{2,}/g, '$1'); // Remove underline emphasis
  
  // Trim extra whitespace
  cleaned = cleaned.trim();
  
  return cleaned;
}

/**
 * Clean up response text specifically for display in reports
 * This is a more aggressive cleanup for consistent presentation
 */
export function cleanResponseForReport(text: string): string {
  let cleaned = cleanMarkdownFromResponse(text);
  
  // Remove citation markers like [1], [2], etc.
  cleaned = cleaned.replace(/\[\d+\]/g, '');
  
  // Remove URLs that might be standalone
  cleaned = cleaned.replace(/https?:\/\/[^\s]+/g, '');
  
  // Remove parenthetical citations like (source.com)
  cleaned = cleaned.replace(/\([^)]*\.com[^)]*\)/g, '');
  
  // Clean up extra spaces and normalize formatting
  cleaned = cleaned.replace(/\s+/g, ' ');
  cleaned = cleaned.replace(/\n\s+/g, '\n');
  
  return cleaned.trim();
}