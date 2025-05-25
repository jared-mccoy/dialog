/**
 * Machine Yearning App - Logging Methods
 * Contains methods for logging and error handling
 */

// Track last log messages to avoid repetition
export const lastLogMessages = {
  messages: {},
  timestamps: {}
};

// Log settings for different message types
export const logSettings = {
  animation: {
    enabled: false,         // Disable most animation logging by default
    cooldownPeriod: 5000    // 5 seconds cooldown for animation messages
  },
  system: {
    enabled: true,          // Always log system messages
    cooldownPeriod: 2000    // 2 seconds cooldown for system messages
  },
  viewport: {
    enabled: true,          // Always log viewport state changes
    cooldownPeriod: 1000    // 1 second cooldown for viewport messages
  }
};

/**
 * Special function for error messages that should be visible on the page
 * @param {string} message - The error message to display
 */
export function errorLog(message) {
  console.error(message);
  try {
    const errorElement = document.createElement('div');
    errorElement.className = 'error-message';
    errorElement.style.padding = '16px';
    errorElement.style.margin = '16px';
    errorElement.style.background = '#ffeeee';
    errorElement.style.border = '1px solid #cc0000';
    errorElement.style.color = '#cc0000';
    errorElement.innerHTML = `<strong>Error:</strong> ${message}`;
    document.body.appendChild(errorElement);
  } catch (e) {
    console.error('Failed to add error element:', e);
  }
} 