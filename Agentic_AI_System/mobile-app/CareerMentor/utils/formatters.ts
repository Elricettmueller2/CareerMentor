/**
 * Utility functions for formatting text and data
 */

// Format a percentage for display (e.g., 85 -> "85%")
export const formatPercentage = (value: number): string => {
  return `${Math.round(value)}%`;
};

// Truncate text to a specified length with ellipsis
export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
};

// Format a list of skills as a comma-separated string
export const formatSkillsList = (skills: string[]): string => {
  return skills.join(', ');
};

// Extract the first paragraph from a longer description
export const extractFirstParagraph = (text: string): string => {
  const paragraphs = text.split('\n\n');
  return paragraphs[0] || '';
};

// Format file size in bytes to human-readable format
export const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return bytes + ' B';
  else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
  else return (bytes / 1048576).toFixed(1) + ' MB';
};
