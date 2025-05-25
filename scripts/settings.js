/**
 * Machine Yearning Settings
 * Loads and manages application settings
 */

// Default settings if settings.json fails to load
const DEFAULT_SETTINGS = {
  chat: {
    typingAnimation: {
      enabled: true,
      wordsPerMinute: 200,
      minTypingTime: 800,
      maxTypingTime: 6000,
      variancePercentage: 15,
      typingAppliesTo: "both"
    },
    readDelay: {
      enabled: true,
      wordsPerMinute: 300,
      minReadTime: 300,
      maxReadTime: 3000,
      variancePercentage: 20
    },
    timeEffects: {
      transitionDelay: 0.5,
      easing: "cubic-bezier(0.19, 1, 0.22, 1)"
    }
  },
  logging: {
    mode: "production",
    levels: {
      production: ["warning", "error", "critical"],
      debug: ["debug", "info", "warning", "error", "critical"]
    }
  },
  theme: {
    accentA: "#192b91",
    accentB: "#ffc400"
  },
  directory: {
    recursiveStyling: {
      base: {
        borderWidth: 0.125,      // rem - ~2px at 16px root font size
        borderRadius: 0.375,     // rem
        verticalPadding: 0.75,   // rem
        horizontalPadding: 0.9,  // rem
        marginBottom: 0.75,      // rem
        fontSize: 1              // rem - relative to parent
      },
      scale: {
        borderWidth: 0.8,        // Border width scales more dramatically (smaller number)
        borderRadius: 0.85,      // Border radius scales moderately
        spacing: 0.9,            // Padding and margins scale gently
        fontSize: 0.95           // Font size scales very gently
      }
    }
  }
};

// Global settings object
let appSettings = { ...DEFAULT_SETTINGS };

/**
 * Load settings from settings.json
 * @returns {Promise} Resolves when settings are loaded
 */
async function loadSettings() {
  try {
    if (window.appLog) {
      appLog.debug('Loading application settings');
    } else {
      console.info('Loading application settings');
    }
    
    const response = await fetch('settings.json');
    if (!response.ok) {
      console.warn('Failed to load settings.json, using defaults');
      return DEFAULT_SETTINGS;
    }
    
    const settings = await response.json();
    // Merge with defaults to ensure all properties exist
    appSettings = mergeWithDefaults(settings, DEFAULT_SETTINGS);
    
    if (window.appLog) {
      appLog.debug('Settings loaded successfully');
    } else {
      console.info('Settings loaded successfully');
    }
    
    // Apply any immediate settings
    applySettings();
    
    return appSettings;
  } catch (error) {
    console.error('Error loading settings:', error);
    return DEFAULT_SETTINGS;
  }
}

/**
 * Apply loaded settings to the application
 */
function applySettings() {
  try {
    // Get current theme
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
    
    // Apply accent colors from settings as CSS variables
    // The theme.css will derive the specific role colors (user/assistant) based on the theme
    document.documentElement.style.setProperty('--accentA-color', appSettings.theme.accentA);
    document.documentElement.style.setProperty('--accentB-color', appSettings.theme.accentB);
    document.documentElement.style.setProperty('--accentC-color', appSettings.theme.accentC || '#000000');
    document.documentElement.style.setProperty('--accentD-color', appSettings.theme.accentD || '#000000');
    document.documentElement.style.setProperty('--accentE-color', appSettings.theme.accentE || '#000000');
    document.documentElement.style.setProperty('--accentF-color', appSettings.theme.accentF || '#000000');
    document.documentElement.style.setProperty('--accentG-color', appSettings.theme.accentG || '#000000');
    document.documentElement.style.setProperty('--accentH-color', appSettings.theme.accentH || '#000000');
    document.documentElement.style.setProperty('--accentI-color', appSettings.theme.accentI || '#000000');
    document.documentElement.style.setProperty('--accentJ-color', appSettings.theme.accentJ || '#000000');
    document.documentElement.style.setProperty('--accentK-color', appSettings.theme.accentK || '#000000');
    document.documentElement.style.setProperty('--accentL-color', appSettings.theme.accentL || '#000000');
    document.documentElement.style.setProperty('--generic-color', appSettings.theme.genericAccent || '#909090');
    
    // Set semi-transparent versions
    document.documentElement.style.setProperty('--accentA-color-light', appSettings.theme.accentA + '71');
    document.documentElement.style.setProperty('--accentB-color-light', appSettings.theme.accentB + '78');
    document.documentElement.style.setProperty('--accentC-color-light', (appSettings.theme.accentC || '#000000') + '71');
    document.documentElement.style.setProperty('--accentD-color-light', (appSettings.theme.accentD || '#000000') + '71');
    document.documentElement.style.setProperty('--accentE-color-light', (appSettings.theme.accentE || '#000000') + '71');
    document.documentElement.style.setProperty('--accentF-color-light', (appSettings.theme.accentF || '#000000') + '71');
    document.documentElement.style.setProperty('--accentG-color-light', (appSettings.theme.accentG || '#000000') + '71');
    document.documentElement.style.setProperty('--accentH-color-light', (appSettings.theme.accentH || '#000000') + '71');
    document.documentElement.style.setProperty('--accentI-color-light', (appSettings.theme.accentI || '#000000') + '71');
    document.documentElement.style.setProperty('--accentJ-color-light', (appSettings.theme.accentJ || '#000000') + '71');
    document.documentElement.style.setProperty('--accentK-color-light', (appSettings.theme.accentK || '#000000') + '71');
    document.documentElement.style.setProperty('--accentL-color-light', (appSettings.theme.accentL || '#000000') + '71');
    document.documentElement.style.setProperty('--generic-color-light', (appSettings.theme.genericAccent || '#909090') + '71');
    
    // Set hover effect settings
    const timeEffects = appSettings.chat.timeEffects || { transitionDelay: 0.5, easing: "cubic-bezier(0.19, 1, 0.22, 1)" };
    document.documentElement.style.setProperty('--hover-transition-duration', `${timeEffects.transitionDelay}s`);
    document.documentElement.style.setProperty('--hover-transition-timing', timeEffects.easing);
    
    // Set animation enabled state
    const animationEnabled = appSettings.chat.typingAnimation.enabled;
    document.documentElement.setAttribute('data-animation', animationEnabled ? 'enabled' : 'disabled');
    
    // Update animation toggle button state if it exists
    const animationToggle = document.getElementById('animation-toggle');
    if (animationToggle) {
      animationToggle.setAttribute('data-state', animationEnabled ? 'enabled' : 'disabled');
    }
    
    // Apply logging settings
    applyLoggingSettings();
    
    // Trigger a settings changed event
    dispatchSettingsChangedEvent();
  } catch (error) {
    console.error('Error applying settings:', error);
  }
}

/**
 * Apply logging settings based on current configuration
 */
function applyLoggingSettings() {
  const loggingMode = appSettings.logging.mode;
  const allowedLevels = appSettings.logging.levels[loggingMode] || [];
  
  // If our logging system is already initialized, just update it
  if (window.appLog && window.appLog.setMode) {
    // This will update both appLog methods and the global debugLog function
    window.appLog.setMode(loggingMode, appSettings.logging.levels);
  } else {
    console.warn('Logging system not properly initialized');
  }
  
  // Store settings in localStorage for persistence across page loads
  try {
    localStorage.setItem('appSettings', JSON.stringify(appSettings));
  } catch (e) {
    console.warn('Failed to save settings to localStorage:', e);
  }
}

/**
 * Dispatch a custom event when settings change
 */
function dispatchSettingsChangedEvent() {
  // Create and dispatch a custom event
  const event = new CustomEvent('settingsChanged', {
    detail: { settings: appSettings },
    bubbles: true,
    cancelable: true
  });
  
  window.dispatchEvent(event);
}

/**
 * Get the current application settings
 * @returns {Object} Current settings
 */
function getSettings() {
  return appSettings;
}

/**
 * Update settings with new values
 * @param {Object} newSettings - New settings to apply
 */
function updateSettings(newSettings) {
  appSettings = mergeWithDefaults(newSettings, appSettings);
  applySettings();
  
  // If animations were changed, update the animation system
  if (window.chatAnimations && window.chatAnimations.updateAnimationState) {
    window.chatAnimations.updateAnimationState(appSettings.chat.typingAnimation.enabled);
  }
  
  return appSettings;
}

/**
 * Recursively merge an object with defaults
 * @param {Object} obj - Source object
 * @param {Object} defaults - Default values
 * @returns {Object} Merged object
 */
function mergeWithDefaults(obj, defaults) {
  const result = { ...defaults };
  
  for (const key in obj) {
    if (obj[key] && typeof obj[key] === 'object' && !Array.isArray(obj[key]) &&
        defaults[key] && typeof defaults[key] === 'object' && !Array.isArray(defaults[key])) {
      // Recursively merge nested objects
      result[key] = mergeWithDefaults(obj[key], defaults[key]);
    } else {
      // Use the value from obj, or default if not present
      result[key] = obj[key] !== undefined ? obj[key] : defaults[key];
    }
  }
  
  return result;
}

/**
 * Set up and show the settings panel
 */
function setupSettingsPanel() {
  // Create the settings panel if it doesn't exist
  let settingsPanel = document.getElementById('settings-panel');
  
  if (!settingsPanel) {
    settingsPanel = document.createElement('div');
    settingsPanel.id = 'settings-panel';
    settingsPanel.className = 'settings-panel';
    document.body.appendChild(settingsPanel);
    
    // Create panel content
    settingsPanel.innerHTML = `
      <h3>Settings</h3>
      
      <div class="setting-group">
        <h4>Typing Animation</h4>
        <div>
          <label>
            <input type="checkbox" id="animation-enabled">
            <span>Enable typing animation</span>
          </label>
        </div>
        <label for="typing-applies-to">Apply typing animation to:</label>
        <select id="typing-applies-to" class="settings-select">
          <option value="both">Both user and assistant</option>
          <option value="assistant">Assistant messages only</option>
          <option value="user">User messages only</option>
        </select>
        
        <div class="settings-row">
          <div class="settings-col">
            <label for="words-per-minute">WPM:</label>
            <input type="number" id="words-per-minute" min="50" max="1000" step="10">
          </div>
        </div>
        
        <div class="settings-row">
          <div class="settings-col">
            <label for="min-typing-time">Min Time (ms):</label>
            <input type="number" id="min-typing-time" min="200" max="3000" step="100">
          </div>
          <div class="settings-col">
            <label for="max-typing-time">Max Time (ms):</label>
            <input type="number" id="max-typing-time" min="1000" max="10000" step="100">
          </div>
        </div>
        
        <label for="variance-percentage">Typing Variance (%):</label>
        <input type="number" id="variance-percentage" min="0" max="50" step="5">
      </div>
      
      <div class="setting-group">
        <h4>Read Delay</h4>
        <div>
          <label>
            <input type="checkbox" id="read-delay-enabled">
            <span>Add reading delay between messages</span>
          </label>
        </div>
        
        <label for="read-delay-wpm">Reading Speed (WPM):</label>
        <input type="number" id="read-delay-wpm" min="100" max="1500" step="50">
        
        <div class="settings-row">
          <div class="settings-col">
            <label for="min-read-time">Min Time (ms):</label>
            <input type="number" id="min-read-time" min="0" max="2000" step="100">
          </div>
          <div class="settings-col">
            <label for="max-read-time">Max Time (ms):</label>
            <input type="number" id="max-read-time" min="500" max="8000" step="100">
          </div>
        </div>
        
        <label for="read-variance">Reading Variance (%):</label>
        <input type="number" id="read-variance" min="0" max="50" step="5">
      </div>
      
      <div class="setting-group">
        <h4>Logging</h4>
        <label for="logging-mode">Logging Mode:</label>
        <select id="logging-mode" class="settings-select">
          <option value="production">Production (Warnings & Errors only)</option>
          <option value="debug">Debug (All logs)</option>
        </select>
      </div>
      
      <div class="setting-group">
        <h4>Theme Colors</h4>
        
        <div class="color-grid">
          <div class="color-row">
            <label for="accent-a">Assistant:</label>
            <input type="text" id="accent-a" class="color-input">
          </div>
          
          <div class="color-row">
            <label for="accent-b">User:</label>
            <input type="text" id="accent-b" class="color-input">
          </div>
          
          <div class="color-row">
            <label for="accent-c">Speaker C:</label>
            <input type="text" id="accent-c" class="color-input">
          </div>
          
          <div class="color-row">
            <label for="accent-d">Speaker D:</label>
            <input type="text" id="accent-d" class="color-input">
          </div>
          
          <div class="color-row">
            <label for="accent-e">Speaker E:</label>
            <input type="text" id="accent-e" class="color-input">
          </div>
          
          <div class="color-row">
            <label for="accent-f">Speaker F:</label>
            <input type="text" id="accent-f" class="color-input">
          </div>
          
          <div class="color-row">
            <label for="accent-g">Speaker G:</label>
            <input type="text" id="accent-g" class="color-input">
          </div>
          
          <div class="color-row">
            <label for="generic-accent">Generic:</label>
            <input type="text" id="generic-accent" class="color-input">
          </div>
        </div>
      </div>
      
      <div class="settings-actions">
        <button id="settings-save">Save</button>
        <button id="settings-cancel">Cancel</button>
      </div>
    `;
    
    // Add event listeners for the buttons
    const saveButton = settingsPanel.querySelector('#settings-save');
    const cancelButton = settingsPanel.querySelector('#settings-cancel');
    
    saveButton.addEventListener('click', () => {
      saveSettingsFromPanel();
      toggleSettingsPanel(false);
    });
    
    cancelButton.addEventListener('click', () => {
      toggleSettingsPanel(false);
    });
    
    // Add click event listener to close panel when clicking outside
    document.addEventListener('click', (event) => {
      const panel = document.getElementById('settings-panel');
      const settingsToggle = document.getElementById('settings-toggle');
      
      if (panel && panel.classList.contains('visible')) {
        // If the click is outside the panel and not on the settings toggle button
        if (!panel.contains(event.target) && event.target !== settingsToggle && !settingsToggle.contains(event.target)) {
          toggleSettingsPanel(false);
        }
      }
    }, true);
  }
  
  // Update the panel with current settings
  populateSettingsPanel();
  
  // Show or toggle the panel
  const panel = document.getElementById('settings-panel');
  if (panel.classList.contains('visible')) {
    toggleSettingsPanel(false);
  } else {
    toggleSettingsPanel(true);
  }
}

/**
 * Populate the settings panel with current values
 */
function populateSettingsPanel() {
  const panel = document.getElementById('settings-panel');
  if (!panel) return;
  
  const animation = appSettings.chat.typingAnimation;
  const readDelay = appSettings.chat.readDelay;
  const theme = appSettings.theme;
  
  // Animation settings
  panel.querySelector('#animation-enabled').checked = animation.enabled;
  panel.querySelector('#typing-applies-to').value = animation.typingAppliesTo;
  panel.querySelector('#words-per-minute').value = animation.wordsPerMinute;
  panel.querySelector('#min-typing-time').value = animation.minTypingTime;
  panel.querySelector('#max-typing-time').value = animation.maxTypingTime;
  panel.querySelector('#variance-percentage').value = animation.variancePercentage;
  
  // Read delay settings
  panel.querySelector('#read-delay-enabled').checked = readDelay.enabled;
  panel.querySelector('#read-delay-wpm').value = readDelay.wordsPerMinute;
  panel.querySelector('#min-read-time').value = readDelay.minReadTime;
  panel.querySelector('#max-read-time').value = readDelay.maxReadTime;
  panel.querySelector('#read-variance').value = readDelay.variancePercentage;
  
  // Logging settings
  panel.querySelector('#logging-mode').value = appSettings.logging.mode;
  
  // Theme settings
  panel.querySelector('#accent-a').value = theme.accentA;
  panel.querySelector('#accent-b').value = theme.accentB;
  panel.querySelector('#accent-c').value = theme.accentC || '';
  panel.querySelector('#accent-d').value = theme.accentD || '';
  panel.querySelector('#accent-e').value = theme.accentE || '';
  panel.querySelector('#accent-f').value = theme.accentF || '';
  panel.querySelector('#accent-g').value = theme.accentG || '';
  panel.querySelector('#generic-accent').value = theme.genericAccent || '';
}

/**
 * Save settings from the panel inputs
 */
function saveSettingsFromPanel() {
  const panel = document.getElementById('settings-panel');
  if (!panel) return;
  
  const newSettings = { ...appSettings };
  
  // Animation settings
  newSettings.chat.typingAnimation.enabled = panel.querySelector('#animation-enabled').checked;
  newSettings.chat.typingAnimation.typingAppliesTo = panel.querySelector('#typing-applies-to').value;
  newSettings.chat.typingAnimation.wordsPerMinute = parseInt(panel.querySelector('#words-per-minute').value);
  newSettings.chat.typingAnimation.minTypingTime = parseInt(panel.querySelector('#min-typing-time').value);
  newSettings.chat.typingAnimation.maxTypingTime = parseInt(panel.querySelector('#max-typing-time').value);
  newSettings.chat.typingAnimation.variancePercentage = parseInt(panel.querySelector('#variance-percentage').value);
  
  // Read delay settings
  newSettings.chat.readDelay.enabled = panel.querySelector('#read-delay-enabled').checked;
  newSettings.chat.readDelay.wordsPerMinute = parseInt(panel.querySelector('#read-delay-wpm').value);
  newSettings.chat.readDelay.minReadTime = parseInt(panel.querySelector('#min-read-time').value);
  newSettings.chat.readDelay.maxReadTime = parseInt(panel.querySelector('#max-read-time').value);
  newSettings.chat.readDelay.variancePercentage = parseInt(panel.querySelector('#read-variance').value);
  
  // Logging settings
  newSettings.logging.mode = panel.querySelector('#logging-mode').value;
  
  // Theme settings
  newSettings.theme.accentA = panel.querySelector('#accent-a').value;
  newSettings.theme.accentB = panel.querySelector('#accent-b').value;
  newSettings.theme.accentC = panel.querySelector('#accent-c').value || null;
  newSettings.theme.accentD = panel.querySelector('#accent-d').value || null;
  newSettings.theme.accentE = panel.querySelector('#accent-e').value || null;
  newSettings.theme.accentF = panel.querySelector('#accent-f').value || null;
  newSettings.theme.accentG = panel.querySelector('#accent-g').value || null;
  newSettings.theme.genericAccent = panel.querySelector('#generic-accent').value || null;
  
  // Update settings
  updateSettings(newSettings);
  
  // Store in local storage for persistence
  localStorage.setItem('appSettings', JSON.stringify(newSettings));
}

/**
 * Toggle the settings panel visibility
 * @param {boolean} show - Whether to show or hide the panel
 */
function toggleSettingsPanel(show) {
  const panel = document.getElementById('settings-panel');
  if (!panel) return;
  
  if (show) {
    panel.classList.add('visible');
    
    // Update select elements to ensure consistent styling
    const selects = panel.querySelectorAll('select.settings-select');
    selects.forEach(select => {
      // Ensure text color matches the theme
      select.style.color = 'var(--accent-color)';
      
      // Add custom styling for options
      const options = select.querySelectorAll('option');
      options.forEach(option => {
        option.style.backgroundColor = 'var(--background-color)';
        option.style.color = 'var(--accent-color)';
      });
      
      // Add event listener to update selected option styling
      select.addEventListener('change', () => {
        select.style.color = 'var(--accent-color)';
      });
    });
  } else {
    panel.classList.remove('visible');
  }
}

// Initialize settings on page load
document.addEventListener('DOMContentLoaded', function() {
  loadSettings();
  
  // Set up the settings button click handler
  const settingsButton = document.getElementById('settings-toggle');
  if (settingsButton) {
    settingsButton.addEventListener('click', () => {
      setupSettingsPanel();
    });
  }
});

// Export methods for use in other scripts
window.appSettings = {
  load: loadSettings,
  get: getSettings,
  update: updateSettings,
  showPanel: setupSettingsPanel,
  log: window.appLog
}; 