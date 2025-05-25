/**
 * Machine Yearning Chat Converter - Processing Methods
 * Contains methods for processing markdown content
 */

import { 
  isMarkdownHeader, 
  getMarkdownHeaderLevel,
  extractSpeaker,
  createSpacePlaceholder,
  processWikilinks
} from './parsing.js';

import {
  markdownHeaderToHtml,
  createNavigationUI,
  createCustomRenderer,
  processConversation,
  getSpeakerClass
} from './rendering.js';

import { 
  getSpeakerIcon, 
  resetSpeakerIconMapping, 
  getSpeakerColor, 
  setupCustomIconCSS, 
  shouldDisplaySpeakerName, 
  getSpeakerDisplayName,
  collectSpeakerIcon 
} from '../utils/speakerIconMapper.js';

/**
 * Process chat content from markdown to HTML
 * @param {Object} options - Processing options
 */
export function processChatContent(options) {
  // Make sure marked.js is available
  if (!window.marked) {
    console.error('Marked.js is required. Please add: <script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>');
    return;
  }

  // Track all unique speakers in the conversation - this is important for proper message styling
  const speakers = [];
  
  // Reset the speaker icon mapping at the start of processing
  resetSpeakerIconMapping();
  
  // Track layouts for each speaker
  const speakerLayouts = {};
  
  // Import custom renderer and functions from rendering module
  const renderer = createCustomRenderer(escapeHtml, restoreSpacePlaceholders);
  
  // Helper function to get the class for a speaker
  const getSpeakerClassLocal = (speaker) => getSpeakerClass(speaker, speakers);
  
  // Configure marked.js
  window.marked.setOptions({
    renderer: renderer,
    highlight: null, // No highlighting, we'll rely on Prism for that
    pedantic: false,
    gfm: true,
    breaks: true,
    sanitize: false,
    smartypants: false,
    xhtml: false
  });

  // Get content either from selector or provided raw markdown
  let content, rawContent;
  
  if (options.rawMarkdown) {
    // For fetched content
    content = document.getElementById('markdown-content') || document.createElement('div');
    rawContent = options.rawMarkdown;
    content.innerHTML = rawContent;
  } else {
    // For inline content
    content = document.querySelector(options.contentSelector) || document.body;
    rawContent = content.innerHTML;
  }
  
  // Parse the markdown content into sections and messages
  const lines = rawContent.split('\n');
  const contentItems = []; // Will hold all items (headers and messages) in sequence
  
  // Track the current speaker and accumulated message
  let currentSpeaker = null;
  let currentMessage = '';
  let currentSectionId = 0;
  
  // First pass: collect all unique speakers
  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const line = rawLine.trim();
    
    if ((line.includes('<<') && line.includes('>>')) || (line.includes('<<') && line.includes('>>'))) {
      const speakerInfo = extractSpeaker(line);
      if (speakerInfo && !speakers.includes(speakerInfo.name)) {
        speakers.push(speakerInfo.name);
        // Pre-collect the icon for this speaker
        collectSpeakerIcon(speakerInfo.name);
      }
    }
  }
  
  // Now that we have all speakers, set up CSS once
  setupCustomIconCSS();
  
  // Second pass: process the content
  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const line = rawLine.trim();
    
    // Detect headers (## style markdown headers)
    if (isMarkdownHeader(line)) {
      // Save current message if exists
      if (currentSpeaker && currentMessage) {
        // Process wikilinks in message content before adding to content items
        const processedMessage = processWikilinks(currentMessage);
        
        contentItems.push({
          type: 'message',
          speaker: currentSpeaker.name,
          layout: currentSpeaker.layout,
          content: processedMessage
        });
      }
      
      // Add the header
      contentItems.push({
        type: 'header',
        level: getMarkdownHeaderLevel(line),
        content: markdownHeaderToHtml(line),
        id: 'header-' + currentSectionId
      });
      
      currentSectionId++;
      
      // Reset the current speaker and message
      currentSpeaker = null;
      currentMessage = '';
    }
    // Detect speaker change using << speaker >> or << speaker >> format
    else if ((line.includes('<<') && line.includes('>>')) || (line.includes('<<') && line.includes('>>'))) {
      // Save the previous message if there is one
      if (currentSpeaker && currentMessage) {
        // Process wikilinks in message content before adding to content items
        const processedMessage = processWikilinks(currentMessage);
        
        contentItems.push({
          type: 'message',
          speaker: currentSpeaker.name,
          layout: currentSpeaker.layout,
          content: processedMessage
        });
      }
      
      // Extract the new speaker name and layout from between delimiters
      const speakerInfo = extractSpeaker(line);
      if (speakerInfo) {
        currentSpeaker = speakerInfo;
        currentMessage = '';
      }
    } else if (currentSpeaker) {
      // Skip the comment line itself
      if (!line.includes('<!--') && !line.includes('-->')) {
        // Add this line to the current message
        currentMessage += (currentMessage ? '\n' : '') + rawLine;
      }
    }
  }
  
  // Add any final message
  if (currentSpeaker && currentMessage) {
    // Process wikilinks in message content before adding to content items
    const processedMessage = processWikilinks(currentMessage);
    
    contentItems.push({
      type: 'message',
      speaker: currentSpeaker.name,
      layout: currentSpeaker.layout,
      content: processedMessage
    });
  }
  
  // Create hierarchical structure for nested sections
  function createHierarchy(items) {
    // Start with a root section
    const root = {
      id: 'root',
      type: 'section',
      header: null,
      messages: [],
      children: []
    };
    
    // Current section being processed
    let currentSection = root;
    
    // Stack of sections for hierarchy
    const sectionStack = [root];
    
    // Process each item
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      
      if (item.type === 'header') {
        // Create a new section
        const newSection = {
          id: item.id,
          type: 'section',
          header: {
            level: item.level,
            content: item.content
          },
          messages: [],
          children: []
        };
        
        // Find the appropriate parent for this section
        let parentFound = false;
        
        // Pop sections from stack until we find a level lower than this header
        while (sectionStack.length > 1 && !parentFound) {
          const potentialParent = sectionStack[sectionStack.length - 1];
          
          if (potentialParent.header && potentialParent.header.level < item.level) {
            // This is a valid parent
            parentFound = true;
          } else {
            // Pop this section from the stack
            sectionStack.pop();
          }
        }
        
        // Add to parent's children
        const parent = sectionStack[sectionStack.length - 1];
        parent.children.push(newSection);
        
        // Update current section
        currentSection = newSection;
        
        // Add to stack
        sectionStack.push(newSection);
      } else if (item.type === 'message') {
        // Add message to current section
        currentSection.messages.push(item);
      }
    }
    
    return root;
  }
  
  // Build the DOM based on the hierarchical structure
  function buildDOMFromHierarchy(section, container) {
    // If this is not the root section, create a header and content container
    if (section.id !== 'root') {
      // Create the header element
      const headerData = section.header;
      const headerDiv = document.createElement('div');
      headerDiv.className = 'chat-section-header';
      headerDiv.setAttribute('data-level', headerData.level);
      
      // Create toggle button
      const toggleButton = document.createElement('button');
      toggleButton.className = 'section-toggle';
      toggleButton.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="toggle-icon">
        <path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z"/>
      </svg>`;
      toggleButton.setAttribute('aria-expanded', 'true');
      
      // Create header content
      const headerContent = document.createElement('div');
      headerContent.className = 'header-content';
      headerContent.innerHTML = headerData.content;
      
      // Assemble header
      headerDiv.appendChild(toggleButton);
      headerDiv.appendChild(headerContent);
      container.appendChild(headerDiv);
      
      // Create content container for this section
      const sectionDiv = document.createElement('div');
      sectionDiv.className = 'chat-section';
      sectionDiv.id = section.id;
      container.appendChild(sectionDiv);
      
      // Set up container for building the rest of this section
      container = sectionDiv;
      
      // Set up click handlers for this header
      toggleButton.addEventListener('click', function(e) {
        e.stopPropagation(); // Prevent bubbling to the header
        const expanded = this.getAttribute('aria-expanded') === 'true';
        this.setAttribute('aria-expanded', !expanded);
        
        if (expanded) {
          sectionDiv.classList.add('collapsed');
        } else {
          sectionDiv.classList.remove('collapsed');
        }
      });
      
      headerDiv.addEventListener('click', function() {
        const button = this.querySelector('.section-toggle');
        if (button) {
          const expanded = button.getAttribute('aria-expanded') === 'true';
          button.setAttribute('aria-expanded', !expanded);
          
          if (expanded) {
            sectionDiv.classList.add('collapsed');
          } else {
            sectionDiv.classList.remove('collapsed');
          }
        }
      });
    }
    
    // Process messages directly in this section
    if (section.messages.length > 0) {
      // Group messages by speaker for rendering
      const messageGroups = [];
      let currentGroup = null;
      
      section.messages.forEach(msg => {
        if (!currentGroup || currentGroup.speaker !== msg.speaker) {
          currentGroup = {
            speaker: msg.speaker,
            layout: msg.layout,
            messages: []
          };
          messageGroups.push(currentGroup);
        }
        currentGroup.messages.push(msg.content);
      });
      
      // Render message groups
      messageGroups.forEach(group => {
        const msgContent = group.messages.join('\n');
        const messageEl = document.createElement('div');
        messageEl.className = 'message';
        
        // Get speaker class
        const speakerClass = getSpeakerClassLocal(group.speaker);
        messageEl.classList.add(speakerClass);
        messageEl.setAttribute('data-speaker', group.speaker);
        
        // Add the speaker icon attribute based on appearance order
        const speakerIcon = getSpeakerIcon(group.speaker);
        messageEl.setAttribute('data-speaker-icon', speakerIcon);
        
        // Add the dynamic color key attribute based on appearance order
        const colorKey = getSpeakerColor(group.speaker);
        messageEl.setAttribute('data-color-key', colorKey);
        
        // Add speaker name caption for custom speakers
        if (shouldDisplaySpeakerName(group.speaker)) {
          messageEl.setAttribute('data-display-speaker', 'true');
          const displayName = getSpeakerDisplayName(group.speaker);
          
          // Create caption element
          const caption = document.createElement('div');
          caption.className = 'speaker-caption';
          caption.textContent = displayName;
          messageEl.appendChild(caption);
        }
        
        // Apply custom layout if provided
        if (group.layout) {
          if (group.layout.position === 'left') {
            messageEl.style.alignSelf = 'flex-start';
            messageEl.style.marginRight = 'auto';
            messageEl.style.marginLeft = group.layout.offset ? (group.layout.offset * 100) + '%' : '0';
            messageEl.classList.add('custom-left');
          } else if (group.layout.position === 'right') {
            messageEl.style.alignSelf = 'flex-end';
            messageEl.style.marginLeft = 'auto';
            messageEl.style.marginRight = group.layout.offset ? (group.layout.offset * 100) + '%' : '0';
            messageEl.classList.add('custom-right');
          }
          
          messageEl.setAttribute('data-layout-position', group.layout.position || '');
          messageEl.setAttribute('data-layout-offset', group.layout.offset || 0);
        }
        
        // Create content container
        const contentContainer = document.createElement('div');
        contentContainer.className = 'content-container';
        
        // Create content element
        const contentEl = document.createElement('div');
        contentEl.className = 'content';
        contentEl.innerHTML = window.marked.parse(msgContent, { renderer });
        
        // Add the speaker color as a direct style variable for SVG icons and other uses
        const speakerColor = getSpeakerColor(group.speaker);
        if (speakerColor) {
          // Apply the color as both a CSS variable and direct style for better compatibility
          const colorVar = `var(--${speakerColor}-color, var(--${speakerColor === 'user' ? 'user' : speakerColor === 'assistant' ? 'assistant' : 'accent' + speakerColor.charAt(speakerColor.length-1).toUpperCase()}-color))`;
          messageEl.style.setProperty('--speaker-color', colorVar);
        }
        
        // Assemble message
        contentContainer.appendChild(contentEl);
        messageEl.appendChild(contentContainer);
        container.appendChild(messageEl);
      });
    }
    
    // Process child sections recursively
    section.children.forEach(childSection => {
      buildDOMFromHierarchy(childSection, container);
    });
    
    return container;
  }
  
  // Create chat container
  const chatContainer = document.createElement('div');
  chatContainer.className = 'chat-container';
  
  // Add navigation header if navConfig is provided and showTitle is true
  if (options.navConfig && options.showTitle && options.addNavigation !== false) {
    const headerNav = createNavigationUI('header-nav', options.navConfig);
    chatContainer.appendChild(headerNav);
  }
  
  // Create the hierarchy from content items
  const hierarchy = createHierarchy(contentItems);
  
  // Build the DOM from the hierarchy
  buildDOMFromHierarchy(hierarchy, chatContainer);
  
  // Replace the content with our chat UI
  content.innerHTML = '';
  
  // Add navigation footer if navConfig is provided
  if (options.navConfig && options.addNavigation !== false) {
    const footerNav = createNavigationUI('footer-nav', options.navConfig);
    chatContainer.appendChild(footerNav);
  }
  
  // Apply hidden class to all messages for animation
  const allMessages = chatContainer.querySelectorAll('.message');
  allMessages.forEach(msg => {
    msg.classList.add('hidden');
  });
  
  // Apply hidden class to headers for animation
  const allHeaders = chatContainer.querySelectorAll('.chat-section-header');
  allHeaders.forEach(header => {
    header.classList.add('header-hidden');
  });
  
  // Add the chat container to the content element
  content.appendChild(chatContainer);
  
  // Return the content element for any further processing
  return content;
}

/**
 * Helper function to restore space placeholders to actual spaces
 * (Imported from parsing.js but needed directly here for compatibility)
 */
function restoreSpacePlaceholders(text) {
  if (typeof text === 'object') {
    if (text && typeof text.text === 'string') {
      return text.text.replace(/__SPACES_(\d+)__/g, (match, count) => {
        return ' '.repeat(parseInt(count, 10));
      });
    }
    return text && text.raw ? text.raw : String(text);
  }
  
  if (typeof text === 'string') {
    return text.replace(/__SPACES_(\d+)__/g, (match, count) => {
      return ' '.repeat(parseInt(count, 10));
    });
  }
  
  return text;
}

/**
 * Helper function to escape HTML
 * (Imported from parsing.js but needed directly here for compatibility)
 */
function escapeHtml(text) {
  if (typeof text !== 'string') return text;
  
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}