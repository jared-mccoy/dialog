/**
 * Machine Yearning App - Chat Methods
 * Contains methods for handling chat viewing functionality
 */

import { scrollToHashFragment } from './navigation.js';

/**
 * Initialize the chat viewer with a specific chat file
 * @param {string} chatPath - Path to the chat markdown file
 */
export async function initChatViewer(chatPath) {
  try {
    debugLog(`Initializing chat viewer for path: ${chatPath}`);
    
    // Make sure chat scanner is initialized
    if (!window.chatScanner) {
      debugLog('Chat scanner not available');
      console.error('Chat scanner not available');
      return;
    }

    // Get the markdown content container
    const markdownContent = document.getElementById('markdown-content');
    if (!markdownContent) {
      debugLog('Markdown content container not found');
      console.error('Markdown content container not found');
      return;
    }
    
    // Define the minimum loading time for data fetching
    const MIN_LOADING_TIME = 500; // Reduced from 1800ms as we're not showing a loader anymore
    const startTime = Date.now();
    
    // Initialize the chat scanner to get navigation data
    debugLog('Initializing chat scanner');
    await window.chatScanner.init();
    
    // Get navigation links
    const nav = window.chatScanner.getNavigation(chatPath);
    debugLog(`Navigation: prev=${nav.prev ? 'yes' : 'no'}, next=${nav.next ? 'yes' : 'no'}`);
    
    // Fetch the chat content
    debugLog(`Fetching chat content from: ${chatPath}`);
    const response = await fetch(chatPath);
    if (!response.ok) {
      throw new Error(`Failed to load chat: ${response.status}`);
    }
    
    const markdown = await response.text();
    debugLog(`Received markdown content (${markdown.length} chars)`);
    
    // Extract the filename from the path to use as fallback
    const fileName = chatPath.split('/').pop().replace('.md', '');
    
    // Extract title from the markdown
    let title = fileName; // Default to filename instead of hardcoded 'Chat'
    const titleMatch = markdown.match(/^#\s+(.+)$/m);
    if (titleMatch) {
      title = titleMatch[1].trim();
      document.title = `${title} | Machine Yearning`;
      debugLog(`Set page title to: ${title} (from H1 header)`);
    } else {
      document.title = `${title} | Machine Yearning`;
      debugLog(`Set page title to: ${title} (from filename)`);
    }
    
    // Update navigation elements (both top and bottom)
    // Top navigation
    const navElement = document.getElementById('chat-nav');
    const prevLink = document.getElementById('prev-link');
    const nextLink = document.getElementById('next-link');
    const chatTitle = document.getElementById('chat-title');
    
    // Bottom navigation
    const footerNavElement = document.getElementById('chat-nav-footer');
    const prevLinkFooter = document.getElementById('prev-link-footer');
    const nextLinkFooter = document.getElementById('next-link-footer');
    const chatTitleFooter = document.getElementById('chat-title-footer');
    
    // Update top navigation
    if (navElement && prevLink && nextLink && chatTitle) {
      // Show the navigation
      navElement.style.display = 'flex';
      
      // Update title
      chatTitle.textContent = title;
      
      // Update prev link
      if (nav.prev) {
        prevLink.href = `index.html?path=${nav.prev.path}`;
        prevLink.classList.remove('disabled');
      } else {
        prevLink.href = '#';
        prevLink.classList.add('disabled');
      }
      
      // Update next link
      if (nav.next) {
        nextLink.href = `index.html?path=${nav.next.path}`;
        nextLink.classList.remove('disabled');
      } else {
        nextLink.href = '#';
        nextLink.classList.add('disabled');
      }
    }
    
    // Update footer navigation
    if (footerNavElement && prevLinkFooter && nextLinkFooter && chatTitleFooter) {
      // Show the navigation
      footerNavElement.style.display = 'flex';
      
      // Update title
      chatTitleFooter.textContent = title;
      
      // Update prev link
      if (nav.prev) {
        prevLinkFooter.href = `index.html?path=${nav.prev.path}`;
        prevLinkFooter.classList.remove('disabled');
      } else {
        prevLinkFooter.href = '#';
        prevLinkFooter.classList.add('disabled');
      }
      
      // Update next link
      if (nav.next) {
        nextLinkFooter.href = `index.html?path=${nav.next.path}`;
        nextLinkFooter.classList.remove('disabled');
      } else {
        nextLinkFooter.href = '#';
        nextLinkFooter.classList.add('disabled');
      }
    }
    
    // Calculate elapsed time so far
    const elapsed = Date.now() - startTime;
    const remainingDelay = Math.max(0, MIN_LOADING_TIME - elapsed);
    
    debugLog(`Page load took ${elapsed}ms, will wait additional ${remainingDelay}ms to meet minimum loading time`);
    
    // Initialize the chat converter with the markdown content
    if (window.initChatConverter) {
      debugLog('Initializing chat converter');
      window.initChatConverter({
        contentSelector: '#markdown-content',
        rawMarkdown: markdown,
        showTitle: false, // Set to false since we'll show our own navigation elements
        addNavigation: false // Explicitly disable navigation creation
      });
      debugLog('Chat converter initialized');
      
      // Make all messages hidden initially - animation system will reveal them
      const messages = markdownContent.querySelectorAll('.message');
      messages.forEach(msg => {
        msg.classList.add('hidden');
        msg.classList.remove('visible');
      });
      
      // Ensure the container has proper flex display for positioning
      markdownContent.style.display = 'flex';
      markdownContent.style.flexDirection = 'column';
      
      // Function to start animations once DOM is properly ready
      const startAnimations = () => {
        if (window.chatAnimations) {
          debugLog('Initializing chat animations');
          window.chatAnimations.initChatAnimations();
          
          // After initializing animations, scroll to the hash fragment
          setTimeout(scrollToHashFragment, 500);
        } else {
          debugLog('Chat animations not available');
          
          // If we don't have animations, make all messages visible
          const messages = markdownContent.querySelectorAll('.message');
          messages.forEach(msg => {
            msg.classList.remove('hidden');
            msg.classList.add('visible');
          });
          
          // Still need to scroll to hash fragment
          setTimeout(scrollToHashFragment, 100);
        }
        
        // Enhance code blocks after messages are shown
        if (typeof enhanceCodeBlocks === 'function') {
          debugLog('Enhancing code blocks');
          enhanceCodeBlocks();
        }
      };

      // Wait for next animation frame to ensure DOM is rendered
      requestAnimationFrame(() => {
        // Then wait one more frame to be extra sure
        requestAnimationFrame(startAnimations);
      });
    } else {
      debugLog('Chat converter not available');
      console.error('Chat converter not available');
      markdownContent.innerHTML = `<div class="error-message">Chat converter not available. Please check that all scripts are loaded correctly.</div>`;
    }
  } catch (error) {
    debugLog(`Error in initChatViewer: ${error.message}`);
    console.error('Error initializing chat viewer:', error);
    const content = document.querySelector('#markdown-content') || document.querySelector('.content') || document.body;
    content.innerHTML = `
      <div class="error-message" style="text-align: center; padding: 20px;">
        <p><strong>Error loading chat:</strong> ${error.message}</p>
        <p>Please check that the file exists and is accessible.</p>
        <p><a href="index.html">Return to Home</a></p>
      </div>
    `;
  }
} 