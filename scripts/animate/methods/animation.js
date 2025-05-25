/**
 * Machine Yearning Animation Controller - Animation Methods
 * Contains methods for handling animation processing
 */

// Load the necessary functions
// Add these imports at the top of the file
// Note: You'll need to adjust the import path based on the actual file structure
import { shouldDisplaySpeakerName, getSpeakerDisplayName } from '../../converter/utils/speakerIconMapper.js';

/**
 * Animate a header with simple fade-in animation
 * @param {Element} header - The header element to animate
 * @returns {Promise} A promise that resolves when animation completes
 */
export function animateHeader(header) {
  return new Promise((resolve) => {
    // Make the header element visible with animation
    header.classList.remove('header-hidden');
    header.classList.add('header-visible');
    
    // Short animation time for headers
    setTimeout(() => {
      resolve();
    }, 300); // Just a short delay for the animation to complete
  });
}

/**
 * Process the next message in the animation queue
 * @param {Object} animator - Reference to the ChatAnimator instance
 */
export function processNextInQueue(animator) {
  if (animator.animationQueue.length === 0 || 
      animator.animationInProgress || 
      animator.typingIndicatorVisible || 
      animator.headerAnimationInProgress) {
    return;
  }
  
  // Check for failed messages first and add them back to the front of the queue
  if (animator.animationFailedMessages.length > 0) {
    // Add them in reverse order to maintain original sequence
    for (let i = animator.animationFailedMessages.length - 1; i >= 0; i--) {
      animator.animationQueue.unshift({
        element: animator.animationFailedMessages[i],
        type: 'message'
      });
    }
    animator.animationFailedMessages = [];
  }
  
  // Get the next item in the queue
  const nextItem = animator.animationQueue[0];
  
  // Process differently based on type
  if (nextItem.type === 'header') {
    // Process header animation - simple fade in
    const header = nextItem.element;
    
    // Skip if header is already visible
    if (header.classList.contains('header-visible')) {
      animator.animationQueue.shift(); // Remove from queue
      animator.processNextInQueue(); // Process next item
      return;
    }
    
    // Remove from queue
    animator.animationQueue.shift();
    
    // Set header animation in progress
    animator.headerAnimationInProgress = true;
    
    // Animate the header with simple fade-in
    animator.animateHeader(header).then(() => {
      // When header animation is complete, process next item in queue
      animator.headerAnimationInProgress = false;
      animator.processNextInQueue();
    });
  } 
  else {
    // Process message animation
    const nextMsg = nextItem.element;
    
    // Skip if message is already visible
    if (nextMsg.classList.contains('visible')) {
      animator.animationQueue.shift(); // Remove from queue
      animator.processNextInQueue(); // Process next item
      return;
    }
    
    // Now process the message at the front of the queue
    animator.animationInProgress = true;
    const currentMsg = animator.animationQueue.shift().element;
    
    // Check if this is a direct-text element (empty speaker tags)
    const isDirectText = currentMsg.getAttribute('data-speaker') === 'direct-text';

    // If it's a direct-text element, we skip the typing indicator and show it immediately
    if (isDirectText) {
      // Mark message as processed to avoid double animations
      currentMsg.setAttribute('data-observed', 'processed');
      
      // Get the read delay if this isn't the first message
      const visibleCount = document.querySelectorAll('.message.visible').length;
      const isFirstMessage = visibleCount === 0;
      
      // Find the last visible message for read delay
      const lastVisibleMessage = Array.from(document.querySelectorAll('.message.visible'))
        .slice(-1)[0] || null;
        
      // Calculate a shorter read delay for direct-text elements
      const readDelay = isFirstMessage ? 0 : Math.min(
        animator.calculateReadDelay(lastVisibleMessage) / 2, 
        500
      );
      
      setTimeout(() => {
        // Show the direct-text with a simple fade in
        currentMsg.classList.remove('hidden');
        currentMsg.classList.add('visible');
        
        // Process next item in queue after a short delay
        setTimeout(() => {
          animator.animationInProgress = false;
          animator.processNextInQueue();
        }, 300);
      }, readDelay);
      
      return; // Exit early, we've handled this item
    }
    
    // Determine the speaker type from the message class
    const isUser = currentMsg.classList.contains('user');
    const isSpeakerC = currentMsg.classList.contains('speakerC');
    const isSpeakerD = currentMsg.classList.contains('speakerD');
    const isSpeakerE = currentMsg.classList.contains('speakerE');
    const isGenericSpeaker = currentMsg.classList.contains('generic-speaker');
    const isRandom = currentMsg.classList.contains('random');
    
    // Get the visible message count
    const visibleCount = document.querySelectorAll('.message.visible').length;
    
    // For the first message, always show the typing animation immediately
    const isFirstMessage = visibleCount === 0;
    
    // Find the last visible elements (both messages and headers) sorted by position
    const allVisibleElements = [];
    
    // Add visible messages
    const visibleMessages = Array.from(document.querySelectorAll('.message.visible'));
    visibleMessages.forEach(msg => {
      const rect = msg.getBoundingClientRect();
      allVisibleElements.push({
        element: msg,
        type: 'message',
        top: rect.top
      });
    });
    
    // Add visible headers
    const visibleHeaders = Array.from(document.querySelectorAll('.chat-section-header.header-visible'));
    visibleHeaders.forEach(header => {
      const rect = header.getBoundingClientRect();
      allVisibleElements.push({
        element: header,
        type: 'header',
        top: rect.top
      });
    });
    
    // Sort all visible elements by position
    allVisibleElements.sort((a, b) => a.top - b.top);
    
    // Find the last visible element (whether message or header)
    const lastVisibleElement = allVisibleElements.length > 0 ? 
                             allVisibleElements[allVisibleElements.length - 1].element : 
                             null;
    
    // Find the last visible message for read delay calculation
    const lastVisibleMessage = visibleMessages.length > 0 ? 
                             visibleMessages[visibleMessages.length - 1] : 
                             null;
    
    // Calculate read delay (only if this isn't the first message)
    const readDelay = isFirstMessage ? 0 : animator.calculateReadDelay(lastVisibleMessage);
    
    if (window.debugLog) {
      window.debugLog(`Read delay for message: ${readDelay}ms`, 'animation');
    }
    
    // Wait for read delay before showing typing indicator
    setTimeout(() => {
      // Create typing indicator with appropriate class based on speaker type
      const typingIndicator = document.createElement('div');
      
      // Determine speaker type
      let speakerType = 'agent';
      if (isUser) {
        speakerType = 'user';
      } else if (isSpeakerC) {
        speakerType = 'speakerC';
      } else if (isSpeakerD) {
        speakerType = 'speakerD';
      } else if (isSpeakerE) {
        speakerType = 'speakerE';
      } else if (isGenericSpeaker) {
        speakerType = 'generic-speaker';
      } else if (isRandom) {
        speakerType = 'random';
      }
      
      // Base class - typing-indicator
      typingIndicator.className = 'typing-indicator';
      
      // Set data attribute for speaker type
      typingIndicator.setAttribute('data-speaker', speakerType);
      
      // Set the same data-speaker-icon as the message for consistent icon display
      const speakerIcon = currentMsg.getAttribute('data-speaker-icon');
      if (speakerIcon) {
        typingIndicator.setAttribute('data-speaker-icon', speakerIcon);
      }
      
      // Set the same data-color-key as the message for consistent coloring
      const colorKey = currentMsg.getAttribute('data-color-key');
      if (colorKey) {
        typingIndicator.setAttribute('data-color-key', colorKey);
      }
      
      // Add speaker name caption for custom speakers
      const speakerNameFromMsg = currentMsg.getAttribute('data-speaker');
      if (speakerNameFromMsg) {
        // Always display speaker name in typing indicator just like in message bubbles
        typingIndicator.setAttribute('data-display-speaker', 'true');
        const displayName = getSpeakerDisplayName(speakerNameFromMsg);
        
        // Create caption element
        const caption = document.createElement('div');
        caption.className = 'speaker-caption';
        caption.textContent = displayName;
        typingIndicator.appendChild(caption);
      }
      
      // Create the three dots separately instead of using innerHTML
      for (let i = 0; i < 3; i++) {
        const dot = document.createElement('span');
        typingIndicator.appendChild(dot);
      }
      
      // Set size attribute based on message length
      if (!isUser) { // Only apply to non-user messages
        const messageSize = animator.getMessageSize(currentMsg);
        typingIndicator.setAttribute('data-size', messageSize);
        
        if (window.debugLog) {
          window.debugLog(`Message size category: ${messageSize}`, 'animation');
        }
      }
      
      // Position indicator appropriately based on type and layout
      if (isUser) {
        typingIndicator.style.alignSelf = 'flex-end'; // Align user typing to the right
        typingIndicator.style.marginLeft = 'auto';    // Push to the right side
      } else {
        typingIndicator.style.alignSelf = 'flex-start'; // Align all other speakers to the left
        typingIndicator.style.marginRight = 'auto';     // Keep on the left side
      }
      
      // Check if the message has custom layout positioning and apply the same to the indicator
      const layoutPosition = currentMsg.getAttribute('data-layout-position');
      const layoutOffset = currentMsg.getAttribute('data-layout-offset');
      
      if (layoutPosition && layoutOffset) {
        // Apply the same custom positioning as the message will have
        if (layoutPosition === 'left') {
          typingIndicator.style.alignSelf = 'flex-start';
          typingIndicator.style.marginRight = 'auto';
          typingIndicator.style.marginLeft = (layoutOffset * 100) + '%';
          typingIndicator.classList.add('custom-left');
        } else if (layoutPosition === 'right') {
          typingIndicator.style.alignSelf = 'flex-end';
          typingIndicator.style.marginLeft = 'auto';
          typingIndicator.style.marginRight = (layoutOffset * 100) + '%';
          typingIndicator.classList.add('custom-right');
        }
      }
      
      // Store reference to current message
      typingIndicator.messageReference = currentMsg;
      
      // Mark message as processed to avoid double animations
      currentMsg.setAttribute('data-observed', 'processed');
      
      // Find the chat container
      const container = document.querySelector('#markdown-content') || currentMsg.parentNode;
      
      // Position the typing indicator after the last visible element (message or header)
      if (lastVisibleElement) {
        lastVisibleElement.after(typingIndicator);
      } else {
        // If no visible elements yet, add it to beginning but INSIDE the .chat-container
        const chatContainer = document.querySelector('.chat-container');
        if (chatContainer) {
          chatContainer.prepend(typingIndicator);
        } else {
          // Fallback to container if .chat-container doesn't exist yet
          container.prepend(typingIndicator);
        }
      }
      
      // Flag that there's a typing indicator showing
      animator.typingIndicatorVisible = true;
      
      // Show the typing indicator with a small delay
      setTimeout(() => {
        typingIndicator.classList.add('visible');
      }, 50);
      
      // For debugging
      if (window.debugLog && isFirstMessage) {
        let speakerType = isUser ? 'user' : 
                         isSpeakerC ? 'speakerC' : 
                         isSpeakerD ? 'speakerD' : 
                         isSpeakerE ? 'speakerE' : 
                         isGenericSpeaker ? 'generic' : 
                         isRandom ? 'random' : 'assistant';
        window.debugLog(`Showing first message typing indicator - ${speakerType} message`, 'system');
      }
      
      // Calculate dynamic typing time based on message content
      const typingTime = animator.calculateTypingTime(currentMsg, isUser);
      
      if (window.debugLog) {
        let speakerType = isUser ? 'user' : 
                         isSpeakerC ? 'speakerC' : 
                         isSpeakerD ? 'speakerD' : 
                         isSpeakerE ? 'speakerE' : 
                         isGenericSpeaker ? 'generic' : 
                         isRandom ? 'random' : 'assistant';
        window.debugLog(`Typing time for message: ${typingTime}ms (${speakerType})`, 'animation');
      }
      
      // After typing animation completes, create a visual duplicate for fade-out and show the message
      setTimeout(() => {
        // Create a visual clone of the typing indicator for the fade-out effect
        const visualClone = typingIndicator.cloneNode(true);
        const rect = typingIndicator.getBoundingClientRect();
        
        // Style the clone to be positioned exactly where the original is
        visualClone.style.position = 'fixed';
        visualClone.style.top = rect.top + 'px';
        visualClone.style.left = rect.left + 'px';
        visualClone.style.width = rect.width + 'px';
        visualClone.style.height = rect.height + 'px';
        visualClone.style.zIndex = '10';
        visualClone.style.margin = '0';
        visualClone.style.transform = 'none';
        visualClone.style.transition = 'opacity 400ms var(--hover-transition-timing, cubic-bezier(0.19, 1, 0.22, 1))';
        
        // Add to body
        document.body.appendChild(visualClone);
        
        // Remove the original immediately to free up the layout
        typingIndicator.remove();
        animator.typingIndicatorVisible = false;
        
        // Trigger fade-out animation on the clone
        setTimeout(() => {
          visualClone.classList.remove('visible');
          visualClone.style.opacity = '0';
          
          // Remove clone after animation completes
          setTimeout(() => {
            visualClone.remove();
          }, 500);
        }, 50);
        
        // Get the message rect for viewport checking
        const rect2 = currentMsg.getBoundingClientRect();
        
        // Get animation buffer size from CSS variables - default to 200px if not defined
        const chatContainer = document.querySelector('.chat-container');
        let animationBuffer = 200;
        
        // Check if we're on mobile using the CSS variable
        if (chatContainer && window.getComputedStyle) {
          const computedStyle = window.getComputedStyle(document.documentElement);
          const bufferValue = computedStyle.getPropertyValue('--animation-visibility-buffer').trim();
          
          if (bufferValue) {
            // Parse the buffer value (removing 'px' if present)
            const parsedBuffer = parseInt(bufferValue.replace('px', ''), 10);
            if (!isNaN(parsedBuffer)) {
              animationBuffer = parsedBuffer;
            }
          }
          
          if (window.debugLog) {
            window.debugLog(`Using animation buffer of ${animationBuffer}px`, 'viewport');
          }
        }
        
        // Consider a message "in view" if it's within the defined buffer zone
        const isInView = rect2.top < window.innerHeight + animationBuffer;
        
        // If it's within the buffer zone, show the message
        if (isInView) {
          // Update the viewport state tracking
          if (!animator.hasOwnProperty('lastViewportState') || animator.lastViewportState !== 'in-view') {
            animator.lastViewportState = 'in-view';
            if (window.debugLog) {
              window.debugLog("Messages now in viewport, resuming animation", 'viewport');
            }
          }
          
          // Update the last sender type
          animator.lastSenderWasUser = isUser;
          
          // Show the message immediately
          currentMsg.classList.remove('hidden');
          currentMsg.classList.add('visible');
          
          // Wait for message animation to complete before processing next
          setTimeout(() => {
            animator.animationInProgress = false;
            animator.processNextInQueue();
          }, 600);
        } else {
          // Message is really far from viewport, don't show it yet
          // Only log once per session until the state changes
          if (!animator.hasOwnProperty('lastViewportState') || animator.lastViewportState !== 'out-of-view') {
            animator.lastViewportState = 'out-of-view';
            if (window.debugLog) {
              window.debugLog(`Messages far from viewport (${Math.round(rect2.top - window.innerHeight)}px below), waiting for user to scroll into view`, 'viewport');
            }
          }
          
          // Add message to failed list to retry later
          animator.animationFailedMessages.push(currentMsg);
          
          // Set a retry timeout that's shorter than normal animation
          setTimeout(() => {
            animator.animationInProgress = false;
            animator.processNextInQueue();
          }, 100);
        }
      }, typingTime);
    }, readDelay); // Add read delay before showing typing indicator
  }
} 