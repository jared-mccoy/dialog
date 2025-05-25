/**
 * Machine Yearning Chat Converter - Parsing Methods
 * Contains methods for parsing and extracting information from markdown
 */

/**
 * Check if a line is a markdown header
 * @param {string} line - The line to check
 * @returns {boolean} Whether the line is a markdown header
 */
export function isMarkdownHeader(line) {
  return /^#{2,4}\s+.+/.test(line.trim());
}

/**
 * Get the level of a markdown header
 * @param {string} line - The header line
 * @returns {number} The header level (1-6)
 */
export function getMarkdownHeaderLevel(line) {
  const match = line.match(/^(#{2,4})\s+.+/);
  return match ? match[1].length : 0;
}

/**
 * Extract speaker name and layout information from a message marker comment
 * @param {string} line - The line containing the speaker marker
 * @returns {Object|null} Object with speaker name and layout info, or null if not found
 */
export function extractSpeaker(line) {
  let speakerInfo = null;
  
  // Check for << SPEAKER {LAYOUT} >> format (new primary format)
  const angleTagMatch = line.match(/<<\s*(.*?)(?:\s+\{(.*?)\})?\s*>>/);
  if (angleTagMatch) {
    // Handle empty speaker tags (<<>>) as special "direct-text" type
    const speakerRaw = angleTagMatch[1].trim() === "" ? "direct-text" : angleTagMatch[1].trim().toLowerCase();
    // Normalize speaker name: convert to lowercase and replace spaces with underscores
    const speaker = speakerRaw.replace(/\s+/g, '_');
    const layoutTag = angleTagMatch[2] || null;
    
    speakerInfo = {
      name: speaker,
      layout: parseLayoutTag(layoutTag)
    };
    
    return speakerInfo;
  }
  
  // Check for <<SPEAKER {LAYOUT}>> format (legacy format)
  const speakerMatch = line.match(/\[\[\[(.*?)(?:\s+\{(.*?)\})?\]\]\]/);
  if (speakerMatch) {
    // Handle empty speaker tags ([[[]]]) as special "direct-text" type
    const speakerRaw = speakerMatch[1].trim() === "" ? "direct-text" : speakerMatch[1].trim().toLowerCase();
    // Normalize speaker name: convert to lowercase and replace spaces with underscores
    const speaker = speakerRaw.replace(/\s+/g, '_');
    const layoutTag = speakerMatch[2] || null;
    
    speakerInfo = {
      name: speaker,
      layout: parseLayoutTag(layoutTag)
    };
    
    return speakerInfo;
  }
  
  // Check for <!-- SPEAKER {LAYOUT} --> format (alternate format)
  const htmlCommentMatch = line.match(/<!--\s*(.*?)(?:\s+\{(.*?)\})?\s*-->/);
  if (htmlCommentMatch) {
    // Handle empty speaker tags (<!-- -->) as special "direct-text" type
    const speakerRaw = htmlCommentMatch[1].trim() === "" ? "direct-text" : htmlCommentMatch[1].trim().toLowerCase();
    // Normalize speaker name: convert to lowercase and replace spaces with underscores
    const speaker = speakerRaw.replace(/\s+/g, '_');
    const layoutTag = htmlCommentMatch[2] || null;
    
    speakerInfo = {
      name: speaker,
      layout: parseLayoutTag(layoutTag)
    };
    
    return speakerInfo;
  }
  
  return null;
}

/**
 * Process wikilinks in text content
 * @param {string} text - Text containing wikilinks
 * @returns {string} Text with wikilinks converted to HTML anchors
 */
export function processWikilinks(text) {
  if (!text) return text;
  
  // Replace [[link]] or [[link|label]] with HTML
  return text.replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, (match, link, label) => {
    const displayText = label || link;
    return `<a href="#${encodeURIComponent(link)}" title="wiki: ${link}">${displayText}</a>`;
  });
}

/**
 * Parse layout tag to extract position and offset information
 * @param {string|null} layoutTag - The layout tag, e.g. "L", "R", "L.25"
 * @returns {Object} Layout information object
 */
export function parseLayoutTag(layoutTag) {
  if (!layoutTag) return null;
  
  const layout = {
    position: null,
    offset: 0
  };
  
  // Parse position (L or R)
  if (layoutTag.startsWith('L')) {
    layout.position = 'left';
    
    // Check for offset, e.g. L.25
    const offsetMatch = layoutTag.match(/L\.(\d+)/);
    if (offsetMatch) {
      layout.offset = parseFloat('0.' + offsetMatch[1]);
    }
  } else if (layoutTag.startsWith('R')) {
    layout.position = 'right';
    
    // Check for offset, e.g. R.25
    const offsetMatch = layoutTag.match(/R\.(\d+)/);
    if (offsetMatch) {
      layout.offset = parseFloat('0.' + offsetMatch[1]);
    }
  }
  
  return layout;
}

/**
 * Create a placeholder for spaces
 * @param {number} spaces - Number of spaces
 * @returns {string} Space placeholder
 */
export function createSpacePlaceholder(spaces) {
  return `__SPACES_${spaces}__`;
}

/**
 * Restore space placeholders to actual spaces
 * @param {string|Object} text - Text with space placeholders
 * @returns {string} Text with spaces restored
 */
export function restoreSpacePlaceholders(text) {
  // Handle case where text is an object (happens with newer marked versions)
  if (typeof text === 'object') {
    // Directly try the text property
    if (text && typeof text.text === 'string') {
      const processedText = text.text.replace(/__SPACES_(\d+)__/g, (match, count) => {
        return ' '.repeat(parseInt(count, 10));
      });
      return processedText;
    }
    console.warn('Unable to restore space placeholders on object:', text);
    return text && text.raw ? text.raw : String(text);
  }
  
  // Handle case where we got a string
  if (typeof text === 'string') {
    return text.replace(/__SPACES_(\d+)__/g, (match, count) => {
      return ' '.repeat(parseInt(count, 10));
    });
  }
  
  // Last resort - return as is
  console.warn('Unable to restore spaces on unexpected type:', typeof text);
  return text;
}

/**
 * Helper function to escape HTML
 * @param {string} text - Text to escape
 * @returns {string} HTML-escaped text
 */
export function escapeHtml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
} 