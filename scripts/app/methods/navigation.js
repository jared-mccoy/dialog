/**
 * Machine Yearning App - Navigation Methods
 * Contains methods for handling page navigation and scrolling
 */

/**
 * Function to scroll to the hash fragment after page load
 */
export function scrollToHashFragment() {
  if (window.location.hash) {
    debugLog(`Scrolling to hash fragment: ${window.location.hash}`);
    const hashFragment = window.location.hash.substring(1); // Remove the # character
    
    // Try to find element by ID or by header text
    let targetElement = document.getElementById(hashFragment);
    
    // If not found by ID, try to find by header text (for section headers)
    if (!targetElement) {
      // Normalize the hash fragment (this matches how header IDs are generated in many systems)
      const normalizedHash = hashFragment.toLowerCase().replace(/-/g, ' ');
      
      // Look for chat section headers that match
      const headers = document.querySelectorAll('.chat-section-header .header-content');
      for (const header of headers) {
        const headerText = header.textContent.toLowerCase().trim();
        if (headerText === normalizedHash || headerText.replace(/\s+/g, '-') === hashFragment) {
          targetElement = header.closest('.chat-section-header');
          break;
        }
      }
    }
    
    if (targetElement) {
      // Make all elements up to this target visible immediately
      if (window.chatAnimations && window.chatAnimations.makeElementsVisibleUpTo) {
        // Use the new method to make all elements up to and including the target visible
        const elementsShown = window.chatAnimations.makeElementsVisibleUpTo(targetElement);
        debugLog(`Made ${elementsShown} elements visible immediately to reveal target section`);
      }
      
      // Add a slight delay to ensure animations have completed
      setTimeout(() => {
        // Get the position of the element
        const rect = targetElement.getBoundingClientRect();
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        
        // Calculate exact position to scroll to, with a small offset to ensure the header is visible
        const scrollToY = scrollTop + rect.top - 50; // 50px from the top of viewport
        
        // Scroll to position
        window.scrollTo({
          top: scrollToY,
          behavior: 'smooth'
        });
        
        debugLog(`Scrolled to element: ${targetElement.id || targetElement.className}`);
      }, 300);
    } else {
      debugLog(`Element not found for hash fragment: ${hashFragment}`);
    }
  }
}

/**
 * Function to toggle speaking animation on double-click
 */
export function initSpeakingAnimation() {
  // Basic double-click handler to toggle speaking state
  document.addEventListener('dblclick', function(event) {
    // Find if we clicked on a message
    let target = event.target;
    let messageElement = null;
    
    while (target && target !== document.body) {
      if (target.classList.contains('message')) {
        messageElement = target;
        break;
      }
      target = target.parentElement;
    }
    
    if (messageElement) {
      // Toggle speaking class
      if (messageElement.classList.contains('speaking')) {
        messageElement.classList.remove('speaking');
      } else {
        // Clear any other speaking messages first
        document.querySelectorAll('.message.speaking').forEach(function(msg) {
          msg.classList.remove('speaking');
        });
        messageElement.classList.add('speaking');
      }
    }
  });
} 