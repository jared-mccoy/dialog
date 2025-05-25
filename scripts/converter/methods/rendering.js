/**
 * Machine Yearning Chat Converter - Rendering Methods
 * Contains methods for rendering HTML components
 */

import { getMarkdownHeaderLevel } from './parsing.js';
import { getSpeakerIcon, resetSpeakerIconMapping, getSpeakerColor, shouldDisplaySpeakerName, getSpeakerDisplayName } from '../utils/speakerIconMapper.js';

/**
 * Convert a markdown header to HTML
 * @param {string} line - The markdown header line
 * @returns {string} The HTML header
 */
export function markdownHeaderToHtml(line) {
  const level = getMarkdownHeaderLevel(line);
  const content = line.replace(/^#{2,4}\s+/, '');
  return `<h${level}>${content}</h${level}>`;
}

/**
 * Create navigation UI (used for both header and footer)
 * @param {string} className - The CSS class for the navigation container
 * @param {Object} navConfig - Navigation configuration
 * @returns {HTMLElement} The navigation element
 */
export function createNavigationUI(className, navConfig) {
  // Create the navigation container
  const navContainer = document.createElement('div');
  navContainer.className = `chat-nav ${className}`;
  
  // Create previous link
  const prevLink = document.createElement('a');
  prevLink.className = 'nav-link prev-link';
  prevLink.href = navConfig.prevLink ? navConfig.prevLink : '#';
  prevLink.setAttribute('aria-label', 'Previous conversation');
  prevLink.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
    <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/>
  </svg>`;
  
  // Create title
  const title = document.createElement('h2');
  title.className = 'chat-title';
  title.textContent = navConfig.title || 'Conversation';
  
  // Create next link
  const nextLink = document.createElement('a');
  nextLink.className = 'nav-link next-link';
  nextLink.href = navConfig.nextLink ? navConfig.nextLink : '#';
  nextLink.setAttribute('aria-label', 'Next conversation');
  nextLink.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
    <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/>
  </svg>`;
  
  // Disable navigation links if they don't lead anywhere
  if (!navConfig.prevLink) {
    prevLink.classList.add('disabled');
  }
  
  if (!navConfig.nextLink) {
    nextLink.classList.add('disabled');
  }
  
  // Assemble the navigation
  navContainer.appendChild(prevLink);
  navContainer.appendChild(title);
  navContainer.appendChild(nextLink);
  
  return navContainer;
}

/**
 * Create a custom renderer for marked.js
 * @param {Function} escapeHtml - Function to escape HTML
 * @param {Function} restoreSpacePlaceholders - Function to restore space placeholders
 * @returns {Object} Marked renderer object
 */
export function createCustomRenderer(escapeHtml, restoreSpacePlaceholders) {
  // Create a new renderer
  const renderer = new window.marked.Renderer();
  
  // Override the code renderer with our own implementation
  renderer.code = function(code, language) {
    debugLog("Code renderer received:", typeof code, code, "Language:", language);
    
    try {
      // Extract code content
      let codeText;
      if (typeof code === 'object') {
        codeText = code.text || '';
        // If no explicit language was provided but the object has a lang property, use it
        if (!language && code.lang) {
          language = code.lang;
          debugLog("Using language from object:", language);
        }
      } else {
        codeText = code || '';
      }
      
      // Restore spaces from placeholders
      codeText = restoreSpacePlaceholders(codeText);
      
      // For debugging
      debugLog("After space restoration:", codeText.substring(0, 100) + "...");
      debugLog("Final language:", language);
      
      // Create language class and attribute
      const languageClass = language ? ` class="language-${language}"` : '';
      
      // Basic Prism highlighting if available and language is supported
      let highlighted;
      if (window.Prism && language && Prism.languages[language]) {
        try {
          highlighted = Prism.highlight(codeText, Prism.languages[language], language);
        } catch (e) {
          console.warn('Error highlighting code with Prism:', e);
          highlighted = escapeHtml(codeText);
        }
      } else {
        highlighted = escapeHtml(codeText);
      }
      
      // Return the HTML with data attribute for language
      return `<pre${languageClass} data-language="${language || 'code'}"><code${languageClass}>${highlighted}</code></pre>`;
    } catch (e) {
      console.error("Error in custom code renderer:", e);
      return `<pre><code>Error rendering code block</code></pre>`;
    }
  };
  
  // Override the link renderer to properly handle wiki links
  renderer.link = function(href, title, text) {
    let titleAttr = title ? ` title="${title}"` : '';
    
    // Check if href is a string before using string methods
    if (typeof href === 'string') {
      // Check if it looks like it could be from a wiki link [[text]]
      if (href.startsWith('#') || href.includes('wiki')) {
        // Add special attribute for wiki links to help with styling
        if (!title) {
          titleAttr = ` title="wiki: ${text}"`;
        } else if (!title.includes('wiki')) {
          titleAttr = ` title="wiki: ${title}"`;
        }
      }
    }
    
    // Make sure href is converted to string
    href = (href || '').toString();
    
    return `<a href="${href}"${titleAttr}>${text}</a>`;
  };
  
  // Process text to convert [[wiki links]] to anchor tags
  const originalTextRenderer = renderer.text;
  renderer.text = function(text) {
    // Handle the object format that marked.js sometimes passes
    if (typeof text !== 'string') {
      // If text is an object with a 'text' property, use that
      if (text && typeof text === 'object' && typeof text.text === 'string') {
        // We no longer need to process wikilinks here since they're processed earlier
        // Just return the text or pass to original renderer
        return originalTextRenderer ? originalTextRenderer.call(this, text) : text.text;
      }
      
      // Fallback for other non-string values
      console.warn('Non-string text in renderer without text property:', text);
      return originalTextRenderer ? originalTextRenderer.call(this, text) : String(text || '');
    }
    
    // For string text, no need to process wikilinks anymore
    // Just return or pass to original renderer
    return originalTextRenderer ? originalTextRenderer.call(this, text) : text;
  };
  
  return renderer;
}

/**
 * Process a conversation section into DOM elements
 * @param {Array} messages - Array of message objects
 * @param {Object} renderer - Custom marked renderer
 * @param {Function} getSpeakerClassFn - Function to get proper speaker class
 * @returns {HTMLElement} Container with rendered messages
 */
export function processConversation(messages, renderer, getSpeakerClassFn) {
  const messageContainer = document.createElement('div');
  messageContainer.className = 'message-container';
  
  // Track speakers for alternating UI
  let lastSpeaker = null;
  
  // Process each message in the current section
  messages.forEach(msgData => {
    // Create the message element
    const messageEl = document.createElement('div');
    messageEl.className = 'message';
    
    // Get the appropriate class for this speaker
    const speakerClass = getSpeakerClassFn(msgData.speaker);
    messageEl.classList.add(speakerClass);
    
    // Always add the visible class to ensure the message is displayed
    messageEl.classList.add('visible');
    
    // Add a data attribute for the speaker's actual name
    // This ensures CSS rules based on data-speaker will work correctly
    messageEl.setAttribute('data-speaker', msgData.speaker);
    
    // Add the speaker icon attribute based on appearance order
    const speakerIcon = getSpeakerIcon(msgData.speaker);
    messageEl.setAttribute('data-speaker-icon', speakerIcon);
    
    // Add the dynamic color key attribute based on appearance order
    const colorKey = getSpeakerColor(msgData.speaker);
    messageEl.setAttribute('data-color-key', colorKey);
    
    // Apply the speaker color as a direct style variable
    if (colorKey) {
      // Use a CSS variable format that falls back to the appropriate theme color
      const colorVar = `var(--${colorKey}-color, var(--${colorKey === 'user' ? 'user' : colorKey === 'assistant' ? 'assistant' : 'accent' + colorKey.charAt(colorKey.length-1).toUpperCase()}-color))`;
      messageEl.style.setProperty('--speaker-color', colorVar);
    }
    
    // Add speaker name caption for custom speakers
    if (shouldDisplaySpeakerName(msgData.speaker)) {
      messageEl.setAttribute('data-display-speaker', 'true');
      const displayName = getSpeakerDisplayName(msgData.speaker);
      
      // Create caption element
      const caption = document.createElement('div');
      caption.className = 'speaker-caption';
      caption.textContent = displayName;
      messageEl.appendChild(caption);
    }
    
    // Apply custom layout if provided
    if (msgData.layout) {
      // Apply custom positioning based on layout
      if (msgData.layout.position === 'left') {
        messageEl.style.alignSelf = 'flex-start';
        messageEl.style.marginRight = 'auto';
        messageEl.style.marginLeft = msgData.layout.offset ? (msgData.layout.offset * 100) + '%' : '0';
        messageEl.classList.add('custom-left');
      } else if (msgData.layout.position === 'right') {
        messageEl.style.alignSelf = 'flex-end';
        messageEl.style.marginLeft = 'auto';
        messageEl.style.marginRight = msgData.layout.offset ? (msgData.layout.offset * 100) + '%' : '0';
        messageEl.classList.add('custom-right');
      }
      
      // Add layout data attributes for potential CSS styling
      messageEl.setAttribute('data-layout-position', msgData.layout.position || '');
      messageEl.setAttribute('data-layout-offset', msgData.layout.offset || 0);
    }
    
    // Create a timestamp if it exists
    if (msgData.timestamp) {
      const timestamp = document.createElement('div');
      timestamp.className = 'timestamp';
      timestamp.textContent = msgData.timestamp;
      messageEl.appendChild(timestamp);
    }
    
    // Create a container for the message content
    const contentContainer = document.createElement('div');
    contentContainer.className = 'content-container';
    
    // Create the message content
    const contentEl = document.createElement('div');
    contentEl.className = 'content';
    contentEl.innerHTML = window.marked.parse(msgData.content, { renderer });
    
    // Add content to container
    contentContainer.appendChild(contentEl);
    messageEl.appendChild(contentContainer);
    
    // Add this message to the container
    messageContainer.appendChild(messageEl);
    
    // Update the last speaker
    lastSpeaker = msgData.speaker;
  });
  
  return messageContainer;
}

/**
 * Enhance code blocks with language tags and copy buttons
 */
export function enhanceCodeBlocks() {
  // Wait until the DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', addCodeEnhancements);
  } else {
    addCodeEnhancements();
  }
  
  // Function to add enhancements to code blocks
  function addCodeEnhancements() {
    // Find all code blocks - check for both data-language and regular pre elements
    const codeBlocks = document.querySelectorAll('pre');
    
    codeBlocks.forEach(codeBlock => {
      // Skip if already enhanced
      if (codeBlock.classList.contains('enhanced')) return;
      
      // Add the enhanced class to prevent double enhancement
      codeBlock.classList.add('enhanced');
      
      // Get the language from data attribute or class
      let language = codeBlock.getAttribute('data-language') || 'plaintext';
      const codeElement = codeBlock.querySelector('code');
      
      if (codeElement && codeElement.className) {
        const match = codeElement.className.match(/language-(\w+)/);
        if (match) language = match[1];
      }
      
      // Apply styling directly to ensure consistency
      codeBlock.style.padding = "10px";
      codeBlock.style.paddingTop = "10px";
      codeBlock.style.borderRadius = "6px";
      codeBlock.style.backgroundColor = "var(--code-block-bg)";
      codeBlock.style.border = "1px solid var(--border-color)";
      codeBlock.style.fontSize = "0.9rem"; // Enforce consistent font size for all code blocks
      
      // Create a container for the language tag and copy button
      const toolbarContainer = document.createElement('div');
      toolbarContainer.className = 'code-controls'; // Use both class names for compatibility
      toolbarContainer.classList.add('code-toolbar');
      
      // Create the language tag
      const languageTag = document.createElement('div');
      languageTag.className = 'lang-tag';
      languageTag.textContent = language || 'plaintext';
      
      // Create the copy button
      const copyButton = document.createElement('button');
      copyButton.className = 'copy-button';
      copyButton.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
      </svg>`;
      
      copyButton.addEventListener('click', function() {
        // Find the code element inside
        const codeEl = codeBlock.querySelector('code');
        if (codeEl) {
          // Get the text content
          const codeText = codeEl.textContent || '';
          
          // Use the Clipboard API if available
          if (navigator.clipboard) {
            navigator.clipboard.writeText(codeText)
              .then(() => {
                // Show success state
                copyButton.classList.add('copied');
                copyButton.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>`;
                setTimeout(() => {
                  copyButton.classList.remove('copied');
                  copyButton.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                  </svg>`;
                }, 2000);
              })
              .catch(err => {
                console.error('Failed to copy text: ', err);
                fallbackCopy(codeText);
              });
          } else {
            fallbackCopy(codeText);
          }
        }
      });
      
      // Fallback copy method for older browsers
      function fallbackCopy(text) {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.opacity = '0';
        document.body.appendChild(textArea);
        textArea.select();
        try {
          document.execCommand('copy');
          copyButton.classList.add('copied');
          copyButton.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>`;
          setTimeout(() => {
            copyButton.classList.remove('copied');
            copyButton.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
            </svg>`;
          }, 2000);
        } catch (err) {
          console.error('Fallback copy failed: ', err);
        }
        document.body.removeChild(textArea);
      }
      
      // Add the language tag and copy button to the toolbar
      toolbarContainer.appendChild(languageTag);
      toolbarContainer.appendChild(copyButton);
      
      // Add the toolbar to the code block
      codeBlock.insertBefore(toolbarContainer, codeBlock.firstChild);
      
      // Ensure consistent code styling
      if (codeElement) {
        codeElement.style.padding = "10px";
        codeElement.style.fontSize = "0.9rem"; // Use rem units for consistency
        codeElement.style.lineHeight = "1.5";
        codeElement.style.backgroundColor = "transparent";
        codeElement.style.fontFamily = "Consolas, Monaco, 'Andale Mono', 'Ubuntu Mono', monospace"; // Enforce same font family
      }
      
      // If using Prism for highlighting, ensure theme-appropriate styling
      if (window.Prism) {
        // Ensure token backgrounds are transparent
        codeBlock.querySelectorAll('.token').forEach(token => {
          token.style.background = 'transparent';
        });
      }
    });
    
    // If there's a theme toggle, monitor for changes to re-apply code block styling
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
      themeToggle.addEventListener('click', () => {
        // Wait for theme change to complete
        setTimeout(() => {
          document.querySelectorAll('pre').forEach(pre => {
            pre.style.backgroundColor = "var(--code-block-bg)";
            const controls = pre.querySelector('.code-controls, .code-toolbar');
            if (controls) {
              controls.style.backgroundColor = "var(--code-header-bg)";
            }
          });
        }, 50);
      });
    }
  }
}

/**
 * Get the appropriate CSS class for a speaker
 * Used for styling messages differently based on the speaker
 * @param {string} speaker - The speaker identifier
 * @param {Array} speakers - Array of unique speakers seen so far
 * @returns {string} CSS class name for the speaker
 */
export function getSpeakerClass(speaker, speakers = []) {
  // Return the actual speaker tag as the class
  // This ensures we use the speaker tag from the markdown directly
  
  // Add speaker to tracking array if not seen before
  if (speakers.indexOf(speaker) === -1) {
    speakers.push(speaker);
  }
  
  // Return the speaker name directly - this avoids the position-based mapping
  // that was causing the issue with hardcoded user/assistant classes
  return speaker;
} 