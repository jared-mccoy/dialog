/**
 * Machine Yearning Animation Controller - Scroll Methods
 * Contains methods for scroll detection and message observation
 */

/**
 * Set up intersection observers for scroll-based message reveal
 * @param {Object} animator - Reference to the ChatAnimator instance
 */
export function setupScrollObservers(animator) {
  // Get all messages and headers
  const messages = document.querySelectorAll('.message');
  const headers = document.querySelectorAll('.chat-section-header');
  
  // Create observer for messages and headers with a sensitive threshold
  animator.messageObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      const element = entry.target;
      const isHeader = element.classList.contains('chat-section-header');
      
      // Process when element enters viewport or gets close to it
      if (entry.isIntersecting || entry.intersectionRatio > 0.05) {
        // For headers
        if (isHeader) {
          if (!element.hasAttribute('data-observed') || element.classList.contains('header-hidden')) {
            // Mark as observed
            element.setAttribute('data-observed', 'true');
            
            // Queue this header if it's not already visible and not already queued
            if (element.classList.contains('header-hidden') && 
                !animator.animationQueue.some(item => item.element === element)) {
              
              // Important: We need to ensure headers are added BEFORE any messages that come after them
              let insertIndex = 0;
              const elementRect = element.getBoundingClientRect();
              
              // Find the right position in queue
              for (let i = 0; i < animator.animationQueue.length; i++) {
                const queuedItem = animator.animationQueue[i];
                const queuedRect = queuedItem.element.getBoundingClientRect();
                
                if (queuedRect.top > elementRect.top) {
                  // Found a position where this header should be inserted
                  insertIndex = i;
                  break;
                } else {
                  insertIndex = i + 1;
                }
              }
              
              // Insert the header at proper position
              animator.animationQueue.splice(insertIndex, 0, {
                element: element,
                type: 'header',
                top: elementRect.top
              });
              
              // Trigger animation if not already running
              animator.processNextInQueue();
            }
          }
          
          // If header is fully visible, stop observing
          if (entry.intersectionRatio > 0.8 || element.classList.contains('header-visible')) {
            animator.messageObserver.unobserve(element);
          }
        } 
        // For messages
        else {
          const index = Array.from(messages).indexOf(element);
          
          // Ensure we're handling this message if it's not processed yet
          if (!element.hasAttribute('data-observed') || element.classList.contains('hidden')) {
            // Mark as observed
            element.setAttribute('data-observed', 'true');
            
            // Queue this message if it's not already visible and not already queued
            if (element.classList.contains('hidden') && 
                !animator.animationQueue.some(item => item.element === element) && 
                !animator.animationFailedMessages.includes(element)) {
              
              // Find any headers that should appear before this message
              const messageRect = element.getBoundingClientRect();
              const headersBeforeMessage = [];
              
              headers.forEach(header => {
                if (header.classList.contains('header-hidden') && 
                    !header.classList.contains('header-visible') &&
                    !animator.animationQueue.some(item => item.element === header)) {
                  const headerRect = header.getBoundingClientRect();
                  if (headerRect.top < messageRect.top) {
                    headersBeforeMessage.push({
                      element: header,
                      type: 'header',
                      top: headerRect.top
                    });
                  }
                }
              });
              
              // Sort headers by position
              headersBeforeMessage.sort((a, b) => a.top - b.top);
              
              // Add headers before message
              headersBeforeMessage.forEach(header => {
                animator.animationQueue.push(header);
              });
              
              // Add message
              animator.animationQueue.push({
                element: element,
                type: 'message',
                top: messageRect.top
              });
              
              animator.processNextInQueue();
            }
            
            // Check for more messages to queue
            animator.checkFollowingMessages(index);
          }
          
          // If message is fully visible, stop observing
          if (entry.intersectionRatio > 0.8 || element.classList.contains('visible')) {
            animator.messageObserver.unobserve(element);
          }
        }
      }
    });
  }, {
    threshold: [0.05, 0.5, 0.8], // Observe at multiple thresholds
    rootMargin: "0px 0px 0px 0px" // No extension to prevent viewport overrun
  });
  
  // Create a combined sorted array of elements
  const allElements = [];
  const headersArray = Array.from(headers);
  const messagesArray = Array.from(messages);
  
  // Add headers with positions
  headersArray.forEach(header => {
    const rect = header.getBoundingClientRect();
    allElements.push({
      element: header,
      type: 'header',
      top: rect.top
    });
  });
  
  // Add messages with positions
  messagesArray.forEach(message => {
    const rect = message.getBoundingClientRect();
    allElements.push({
      element: message,
      type: 'message',
      top: rect.top
    });
  });
  
  // Sort by vertical position
  allElements.sort((a, b) => a.top - b.top);
  
  // Start by observing the first few elements
  const initialVisibleCount = Math.min(8, allElements.length);
  for (let i = 0; i < initialVisibleCount; i++) {
    const element = allElements[i].element;
    animator.messageObserver.observe(element);
    element.setAttribute('data-observed', 'true');
  }
}

/**
 * Set up scroll handler for bottom-of-page detection
 * @param {Object} animator - Reference to the ChatAnimator instance
 */
export function setupScrollHandler(animator) {
  window.addEventListener('scroll', function() {
    // Handle failed messages
    if (animator.animationFailedMessages.length > 0 && 
        !animator.animationInProgress && 
        !animator.typingIndicatorVisible) {
      clearTimeout(window.scrollDebounceTimer);
      window.scrollDebounceTimer = setTimeout(() => {
        animator.processNextInQueue();
      }, 100);
      return;
    }
    
    // Check if we're near the bottom of the page
    const scrollPosition = window.scrollY + window.innerHeight;
    const pageHeight = document.documentElement.scrollHeight;
    const isNearBottom = (pageHeight - scrollPosition) < 300;
    
    if (isNearBottom) {
      // Find all elements and sort by position
      const messages = document.querySelectorAll('.message');
      const headers = document.querySelectorAll('.chat-section-header');
      
      // Find the last visible message
      const visibleMessages = Array.from(document.querySelectorAll('.message.visible'));
      if (visibleMessages.length > 0) {
        const lastVisible = visibleMessages[visibleMessages.length - 1];
        const lastVisibleIndex = Array.from(messages).indexOf(lastVisible);
        
        // Queue more messages when near the bottom
        animator.checkFollowingMessages(lastVisibleIndex);
      }
    }
  }, { passive: true });
}

/**
 * Check and queue messages following the current one
 * @param {Object} animator - Reference to the ChatAnimator instance
 * @param {number} currentIndex - Index of the current message
 */
export function checkFollowingMessages(animator, currentIndex) {
  const messages = document.querySelectorAll('.message');
  const headers = document.querySelectorAll('.chat-section-header');
  
  // Check for next messages to reveal
  if (currentIndex < messages.length - 1) {
    // Look ahead for up to 3 messages
    const lookaheadCount = Math.min(3, messages.length - currentIndex - 1);
    
    for (let i = 1; i <= lookaheadCount; i++) {
      const nextMsg = messages[currentIndex + i];
      
      // Skip if already being processed
      if (nextMsg.hasAttribute('data-observed') && !nextMsg.classList.contains('hidden')) {
        continue;
      }
      
      // Check if in view or near viewport
      const rect = nextMsg.getBoundingClientRect();
      const distanceFromViewport = rect.top - window.innerHeight;
      
      // Queue only if in viewport
      if (distanceFromViewport < 0) { // Only queue elements in viewport
        if (nextMsg.classList.contains('hidden') && 
            !animator.animationQueue.some(item => item.element === nextMsg) && 
            !animator.animationFailedMessages.includes(nextMsg)) {
          
          // First, find any headers that should be shown before this message
          const messageRect = nextMsg.getBoundingClientRect();
          const headersBeforeMessage = [];
          
          headers.forEach(header => {
            if (header.classList.contains('header-hidden') && 
                !animator.animationQueue.some(item => item.element === header)) {
              const headerRect = header.getBoundingClientRect();
              if (headerRect.top < messageRect.top) {
                headersBeforeMessage.push({
                  element: header,
                  type: 'header',
                  top: headerRect.top
                });
              }
            }
          });
          
          // Sort headers by position
          headersBeforeMessage.sort((a, b) => a.top - b.top);
          
          // Add headers before message
          headersBeforeMessage.forEach(header => {
            animator.animationQueue.push(header);
          });
          
          // Mark message for observation
          nextMsg.setAttribute('data-observed', 'true');
          
          // Then add message
          animator.animationQueue.push({
            element: nextMsg,
            type: 'message',
            top: messageRect.top
          });
          
          animator.processNextInQueue();
        }
      }
      
      // Always observe the next message for better tracking
      animator.messageObserver.observe(nextMsg);
    }
  }
} 