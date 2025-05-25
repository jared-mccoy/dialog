/**
 * Machine Yearning App - Initialization Methods
 * Contains methods for initializing the application
 */

// Track initialization state
let isInitialized = false;

/**
 * Initialize message click toggle functionality
 * This adds click listeners to all message elements to toggle the 'selected' state
 */
export function initMessageClickToggle() {
  // Set up a delegated event listener on the document body to handle all message clicks
  document.body.addEventListener('click', function(event) {
    // Find if a message was clicked (or any of its children)
    const messageEl = event.target.closest('.message');
    
    // If we didn't click on a message, deselect any selected message
    if (!messageEl) {
      if (selectedMessage) {
        selectedMessage.classList.remove('selected');
        selectedMessage = null;
      }
      return;
    }
    
    // Don't trigger if we're clicking on a link or other interactive element within the message
    if (event.target.tagName === 'A' || 
        event.target.tagName === 'BUTTON' || 
        event.target.closest('a') || 
        event.target.closest('button') ||
        event.target.closest('pre') ||
        event.target.closest('.code-header') ||
        event.target.closest('.section-toggle')) {
      return;
    }
    
    // Skip direct-text messages which don't have avatar icons
    if (messageEl.getAttribute('data-speaker') === 'direct-text') {
      return;
    }
    
    // If the message is already selected, deselect it
    if (messageEl.classList.contains('selected')) {
      messageEl.classList.remove('selected');
      selectedMessage = null;
    } else {
      // Deselect any previously selected message
      if (selectedMessage) {
        selectedMessage.classList.remove('selected');
      }
      
      // Select this message
      messageEl.classList.add('selected');
      selectedMessage = messageEl;
    }
  });
  
  if (window.debugLog) {
    window.debugLog('Message click toggle functionality initialized', 'system');
  }
}

// Track which message is currently selected
let selectedMessage = null;

/**
 * Initialize the application
 */
export async function initApp() {
  // Prevent double initialization
  if (isInitialized) {
    debugLog('App already initialized, skipping');
    return;
  }
  
  try {
    debugLog(`Document readyState: ${document.readyState}`);
    
    // Mark as initialized immediately to prevent race conditions
    isInitialized = true;
    
    // Apply theme immediately to avoid flicker
    if (window.themeControls) {
      window.themeControls.initTheme();
      debugLog('Theme initialized');
    } else {
      debugLog('Theme controls not available');
      
      // Fallback theme initialization if themeControls isn't loaded yet
      const savedTheme = localStorage.getItem('theme');
      if (savedTheme) {
        document.documentElement.setAttribute('data-theme', savedTheme);
        if (typeof window.togglePrismTheme === 'function') {
          window.togglePrismTheme(savedTheme === 'dark');
        }
      }
    }

    // Initialize message click toggle functionality
    initMessageClickToggle();

    // Determine which view to show based on URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const chatPath = urlParams.get('path');
    
    debugLog(`URL parameters: path=${chatPath}`);
    debugLog(`Current URL: ${window.location.href}`);
    
    // Check for the container elements
    let markdownContent = null;
    let postContainer = null;
    
    try {
      markdownContent = document.getElementById('markdown-content');
      debugLog(`markdown-content element: ${markdownContent ? 'found' : 'not found'}`);
    } catch (e) {
      debugLog(`Error getting markdown-content: ${e.message}`);
    }
    
    try {
      postContainer = document.getElementById('post-container');
      debugLog(`post-container element: ${postContainer ? 'found' : 'not found'}`);
    } catch (e) {
      debugLog(`Error getting post-container: ${e.message}`);
    }
    
    // Check if the chat scanner is available
    debugLog(`chatScanner available: ${window.chatScanner ? 'yes' : 'no'}`);
    
    if (chatPath) {
      // Chat viewer mode - show specific chat
      debugLog('Starting chat viewer mode');
      
      // Show chat view, hide directory view
      if (markdownContent) markdownContent.style.display = 'block';
      if (postContainer) postContainer.style.display = 'none';
      
      try {
        await window.appController.initChatViewer(chatPath);
      } catch (e) {
        debugLog(`Error in chat viewer: ${e.message}`);
        console.error('Chat viewer error:', e);
      }
    } else {
      // Home/directory mode - show list of chats
      debugLog('Starting directory view mode');
      
      // Show directory view, hide chat view
      if (markdownContent) markdownContent.style.display = 'none';
      if (postContainer) postContainer.style.display = 'block';
      
      try {
        await window.appController.initDirectoryView();
      } catch (e) {
        debugLog(`Error in directory view: ${e.message}`);
        console.error('Directory view error:', e);
      }
    }
  } catch (error) {
    debugLog(`Error in initApp: ${error.message}`);
    console.error('App initialization error:', error);
    
    // Create a visible error message on the page
    window.appController.errorLog(`App initialization error: ${error.message}`);
  }
} 