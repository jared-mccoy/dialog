/**
 * Machine Yearning App
 * Main application logic and routing
 */

import { initApp, initMessageClickToggle } from './methods/initialization.js';
import { initChatViewer } from './methods/chat.js';
import { initDirectoryView } from './methods/directory.js';
import { scrollToHashFragment, initSpeakingAnimation } from './methods/navigation.js';
import { errorLog } from './methods/logging.js';

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
  debugLog('DOM content loaded event triggered');
  if (document.readyState === 'loading') {
    debugLog('Document still loading, waiting for load event');
  } else {
    debugLog('Document ready, initializing now');
    initApp();
  }
});

// Also try again after window load to be extra sure
window.addEventListener('load', function() {
  debugLog('Window load event triggered');
  setTimeout(function() {
    debugLog('Running delayed initialization');
    initApp();
  }, 100); // Small delay to ensure everything is ready
});

// Initialize the speaking animation feature
document.addEventListener('DOMContentLoaded', initSpeakingAnimation);

// Expose methods for use in other scripts
window.appController = {
  initApp,
  initChatViewer,
  initDirectoryView,
  scrollToHashFragment,
  errorLog
}; 