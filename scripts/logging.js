/**
 * Simple Logging System
 * Does NOT override console methods - just provides a clean logging interface
 */

// Set up default logging configuration
let loggingMode = 'production'; // Start in production by default
let allowedLevels = ['warning', 'error', 'critical'];

// Create a basic no-op function that does nothing when called
const noop = function() {};

// Ensure debugLog is defined immediately based on settings
window.debugLog = function(message, category = 'system') {
  // If in production mode and debug logs are not allowed, do nothing
  if (!allowedLevels.includes('debug')) {
    return; // Silent in production
  }
  console.log(`[DEBUG] ${message}`);
};

// Global appLog object for direct use
window.appLog = {
  // Core logging methods
  debug: (message, ...data) => {
    if (allowedLevels.includes('debug')) {
      console.log(`[DEBUG] ${message}`, ...data);
    }
  },
  
  info: (message, ...data) => {
    if (allowedLevels.includes('info')) {
      console.info(`[INFO] ${message}`, ...data);
    }
  },
  
  warning: (message, ...data) => {
    if (allowedLevels.includes('warning')) {
      console.warn(`[WARNING] ${message}`, ...data);
    }
  },
  
  error: (message, ...data) => {
    if (allowedLevels.includes('error')) {
      console.error(`[ERROR] ${message}`, ...data);
    }
  },
  
  critical: (message, ...data) => {
    if (allowedLevels.includes('critical')) {
      console.error(`[CRITICAL] ${message}`, ...data);
    }
  },
  
  // Update logging configuration
  setMode: function(mode, levels) {
    loggingMode = mode;
    allowedLevels = levels[mode] || allowedLevels;
    console.info(`[Logging] Mode set to: ${mode}, levels: ${allowedLevels.join(', ')}`);
    
    // Update the global debugLog function to respect logging levels
    if (allowedLevels.includes('debug')) {
      window.debugLog = function(message, category = 'system') {
        console.log(`[DEBUG] ${message}`);
      };
    } else {
      window.debugLog = noop; // Replace with no-op in production
    }
  }
};

// Immediately try to load settings.json directly (faster than waiting for settings.js)
(async function loadLoggingConfig() {
  try {
    const response = await fetch('settings.json');
    if (response.ok) {
      const settings = await response.json();
      if (settings.logging && settings.logging.mode && settings.logging.levels) {
        // Apply settings immediately
        loggingMode = settings.logging.mode;
        allowedLevels = settings.logging.levels[loggingMode] || allowedLevels;
        
        // Update the debugLog function right away
        if (!allowedLevels.includes('debug')) {
          window.debugLog = noop; // Replace with no-op in production
        }
        
        console.info(`[Logging] Loaded settings directly from settings.json, mode: ${loggingMode}`);
      }
    }
  } catch (e) {
    console.warn('[Logging] Failed to load settings.json directly:', e);
  }
})();

// Also check localStorage for settings (as backup)
try {
  const savedSettings = localStorage.getItem('appSettings');
  if (savedSettings) {
    const settings = JSON.parse(savedSettings);
    if (settings.logging && settings.logging.mode && settings.logging.levels) {
      loggingMode = settings.logging.mode;
      allowedLevels = settings.logging.levels[loggingMode] || allowedLevels;
      
      // Update the debugLog function to match the settings
      if (!allowedLevels.includes('debug')) {
        window.debugLog = noop; // Replace with no-op in production
      }
      
      console.info(`[Logging] Using settings from localStorage, mode: ${loggingMode}`);
    }
  }
} catch (e) {
  console.warn('[Logging] Error loading settings from localStorage:', e);
} 