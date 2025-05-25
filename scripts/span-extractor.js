/**
 * Fixed Span Extractor
 * Extracts wikilinks and backticked spans from markdown content
 * with hierarchical section awareness
 */

// Module for extracting wikilinks and backticked spans from markdown content
const spanExtractor = (function() {
  // Debug mode - turn off to reduce logging
  const DEBUG = false;
  
  /**
   * Debug logger
   */
  function debug(message) {
    if (DEBUG && typeof console !== 'undefined') {
      // Don't log speaker markers - too noisy
      if (message.includes('Speaker marker')) {
        return;
      }
      debugLog(`[SpanExtractor] ${message}`);
    }
  }
  
  /**
   * Extract wikilinks and backticked spans from markdown content
   * with hierarchical section awareness
   * @param {string} filePath - Path to the markdown file
   * @returns {Object} Object containing hierarchical section tree with spans
   */
  async function extractSpans(filePath) {
    try {
      debug(`Extracting spans from ${filePath}`);
      const response = await fetch(filePath);
      if (!response.ok) {
        debug(`Failed to fetch ${filePath}: ${response.status}`);
        return { 
          wikilinks: [], 
          backticks: [],
          tree: { children: [] } 
        };
      }
      
      const markdown = await response.text();
      debug(`Markdown loaded: ${markdown.length} chars`);
      
      // Extract hierarchical sections with their spans
      const tree = extractHierarchicalSections(markdown);
      
      // For backward compatibility, also extract global spans
      const lines = markdown.split('\n');
      const wikilinks = extractWikilinks(markdown);
      const backticks = extractBackticks(lines);
      const wikilinksCount = countOccurrences(wikilinks);
      const backticksCount = countOccurrences(backticks);
      
      debug(`Extraction complete. Found ${wikilinks.length} wikilinks and ${backticks.length} code spans`);
      debug(`Tree has ${countNodes(tree)} nodes`);
      
      return { 
        wikilinks: wikilinksCount,
        backticks: backticksCount,
        tree: tree
      };
    } catch (error) {
      console.error(`Error extracting spans from ${filePath}:`, error);
      return { 
        wikilinks: [], 
        backticks: [],
        tree: { children: [] } 
      };
    }
  }
  
  /**
   * Count nodes in a tree
   */
  function countNodes(node) {
    let count = 1;
    if (node.children) {
      node.children.forEach(child => {
        count += countNodes(child);
      });
    }
    return count;
  }
  
  /**
   * Extract hierarchical sections with their spans
   * @param {string} markdown - Markdown content
   * @returns {Object} Root node of section tree with spans
   */
  function extractHierarchicalSections(markdown) {
    debug(`Parsing ${markdown.length} chars of markdown`);
    
    // Create root node
    const root = {
      id: 'root',
      level: 0,
      text: 'Root',
      wikilinks: [],
      backticks: [],
      content: '',
      children: [],
      parent: null,
      lineStart: 0,
      lineEnd: -1 // Will be set later
    };
    
    // Find all headers using the same regex as app.js (match headers with multi-line flag)
    const headers = [];
    const headerRegex = /^(#{2,4})\s+(.+)$/gm;
    const lines = markdown.split('\n');
    
    let match;
    while ((match = headerRegex.exec(markdown)) !== null) {
      // Calculate line number from character index
      const lineNumber = markdown.substring(0, match.index).split('\n').length - 1;
      
      headers.push({
        level: match[1].length, // Number of # symbols
        text: match[2].trim(),
        lineNumber: lineNumber
      });
      
      debug(`Found header: Level ${match[1].length}, text: "${match[2].trim()}", line: ${lineNumber}`);
    }
    
    debug(`Found ${headers.length} headers`);
    
    // If no headers, just process the root
    if (headers.length === 0) {
      debug(`No headers found, processing entire content as root`);
      root.lineEnd = lines.length - 1;
      processContent(root, lines, 0, lines.length - 1);
      return root;
    }
    
    // Convert headers to nodes with proper hierarchy
    const nodes = [];
    let currentParent = root;
    const parentStack = [root];
    
    // Create all header nodes first
    for (let i = 0; i < headers.length; i++) {
      const header = headers[i];
      
      debug(`Processing header: ${header.text} (level ${header.level})`);
      
      // Create node for this header
      const node = {
        id: `header-${i}`,
        level: header.level,
        text: header.text,
        lineNumber: header.lineNumber,
        wikilinks: [],
        backticks: [],
        content: '',
        children: [],
        parent: null
      };
      
      // Find correct parent by adjusting stack
      while (parentStack.length > 1 && parentStack[parentStack.length - 1].level >= node.level) {
        parentStack.pop();
      }
      
      // Get parent from top of stack
      const parent = parentStack[parentStack.length - 1];
      node.parent = parent;
      parent.children.push(node);
      
      // Add this node to the stack as potential parent for future nodes
      parentStack.push(node);
      nodes.push(node);
      
      debug(`Assigned parent: ${parent.text || 'root'}, level ${parent.level}`);
    }
    
    // Calculate content ranges for each node
    debug(`Calculating content ranges for ${nodes.length} nodes`);
    
    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i];
      const startLine = node.lineNumber; // Header line
      
      // End is either the next header at same or higher level, or the end of document
      let endLine = lines.length - 1;
      
      // Find next sibling or higher header
      for (let j = i + 1; j < nodes.length; j++) {
        const nextNode = nodes[j];
        
        // If we find a header at same or higher level, that's our boundary
        if (nextNode.level <= node.level) {
          endLine = nextNode.lineNumber - 1;
          break;
        }
      }
      
      node.lineStart = startLine;
      node.lineEnd = endLine;
      
      debug(`Node "${node.text}" range: lines ${startLine} to ${endLine}`);
    }
    
    // Now extract content and spans from each node
    debug('Extracting content and spans from each node');
    
    // NEW: Track which lines have already been processed to avoid double-counting
    const processedLines = new Set();
    
    // Start with leaf nodes (bottom-up)
    const leafNodes = nodes.filter(node => node.children.length === 0);
    debug(`Processing ${leafNodes.length} leaf nodes`);
    
    leafNodes.forEach(node => {
      processContent(node, lines, node.lineStart + 1, node.lineEnd, processedLines);
      debug(`Processed leaf node: "${node.text}" - found ${node.wikilinks.length} wikilinks, ${node.backticks.length} code spans`);
    });
    
    // Now process non-leaf nodes, excluding content from their children
    const nonLeafNodes = nodes.filter(node => node.children.length > 0);
    debug(`Processing ${nonLeafNodes.length} non-leaf nodes`);
    
    // Sort by depth descending (process deepest nodes first)
    nonLeafNodes.sort((a, b) => b.level - a.level);
    
    nonLeafNodes.forEach(node => {
      // Process content between the header and the first child
      let currentLine = node.lineStart + 1;
      
      // Sort children by line number
      const sortedChildren = [...node.children].sort((a, b) => a.lineStart - b.lineStart);
      
      // Process content before each child
      for (const child of sortedChildren) {
        if (currentLine < child.lineStart) {
          debug(`Node "${node.text}" - Processing content from line ${currentLine} to ${child.lineStart - 1}`);
          processContentRange(node, lines, currentLine, child.lineStart - 1, processedLines);
        }
        currentLine = child.lineEnd + 1;
      }
      
      // Process content after the last child
      if (currentLine <= node.lineEnd) {
        debug(`Node "${node.text}" - Processing content from line ${currentLine} to ${node.lineEnd}`);
        processContentRange(node, lines, currentLine, node.lineEnd, processedLines);
      }
      
      debug(`Processed non-leaf node: "${node.text}" - found ${node.wikilinks.length} wikilinks, ${node.backticks.length} code spans`);
    });
    
    // Finally process root content (before first header)
    if (headers.length > 0) {
      const firstHeaderLine = headers[0].lineNumber;
      if (firstHeaderLine > 0) {
        debug(`Processing root content from line 0 to ${firstHeaderLine - 1}`);
        root.lineEnd = firstHeaderLine - 1;
        processContent(root, lines, 0, firstHeaderLine - 1, processedLines);
      }
    }
    
    // Print debug info about what was found in each section
    if (DEBUG) {
      debug('-- SPANS BY SECTION --');
      debugNode(root, 0);
    }
    
    return root;
  }
  
  /**
   * Debug output for node
   */
  function debugNode(node, indent) {
    const prefix = ' '.repeat(indent * 2);
    debug(`${prefix}${node.text || 'ROOT'} (level ${node.level}):`);
    debug(`${prefix}  Wikilinks: ${node.wikilinks.length}`);
    debug(`${prefix}  Code spans: ${node.backticks.length}`);
    
    if (node.children && node.children.length > 0) {
      debug(`${prefix}  Children: ${node.children.length}`);
      node.children.forEach(child => debugNode(child, indent + 1));
    }
  }
  
  /**
   * Process content for a specific range of lines
   * @param {Object} node - Section node
   * @param {Array} lines - All lines in document
   * @param {number} startLine - Start line for this section
   * @param {number} endLine - End line for this section
   * @param {Set} processedLines - Set of line numbers that have already been processed
   */
  function processContentRange(node, lines, startLine, endLine, processedLines = new Set()) {
    if (startLine <= endLine) {
      // Add these lines to the node's content, excluding speaker marker lines
      for (let i = startLine; i <= endLine; i++) {
        const line = lines[i];
        
        // Special handling for speaker marker lines
        if ((line.includes('<<') && line.includes('>>')) || 
            (line.includes('[[') && line.includes(']]')) ||
            (line.includes('<!--') && line.includes('-->'))) {
          debug(`Speaker marker line ${i}: ${line.substring(0, 30)}...`);
          
          // Before skipping, extract any wikilinks in this line
          // But only if this line hasn't been processed yet
          if (!processedLines.has(i)) {
            const speakerWikiRegex = /\[\[([^\]\|]+)(?:\|[^\]]+)?\]\]/g;
            let speakerWikiMatch;
            while ((speakerWikiMatch = speakerWikiRegex.exec(line)) !== null) {
              const link = speakerWikiMatch[1].trim();
              debug(`Found wikilink in speaker line "${node.text || 'root'}": [[${link}]] at line ${i}`);
              node.wikilinks.push(link);
            }
            
            // Mark this line as processed
            processedLines.add(i);
          }
          
          continue;
        }
        
        node.content += line + '\n';
      }
      
      // Extract spans from these lines
      extractSpansFromLines(node, lines, startLine, endLine, processedLines);
    }
  }
  
  /**
   * Process content for a node
   * @param {Object} node - Section node
   * @param {Array} lines - All lines in document
   * @param {number} startLine - Start line for this section
   * @param {number} endLine - End line for this section
   * @param {Set} processedLines - Set of line numbers that have already been processed
   */
  function processContent(node, lines, startLine, endLine, processedLines = new Set()) {
    // Add these lines to the node's content, excluding speaker marker lines
    for (let i = startLine; i <= endLine; i++) {
      const line = lines[i];
      
      // Special handling for speaker marker lines
      if ((line.includes('<<') && line.includes('>>')) || 
          (line.includes('[[') && line.includes(']]')) ||
          (line.includes('<!--') && line.includes('-->'))) {
        debug(`Speaker marker line ${i}: ${line.substring(0, 30)}...`);
        
        // Before skipping, extract any wikilinks in this line
        // But only if this line hasn't been processed yet
        if (!processedLines.has(i)) {
          const speakerWikiRegex = /\[\[([^\]\|]+)(?:\|[^\]]+)?\]\]/g;
          let speakerWikiMatch;
          while ((speakerWikiMatch = speakerWikiRegex.exec(line)) !== null) {
            const link = speakerWikiMatch[1].trim();
            debug(`Found wikilink in speaker line "${node.text || 'root'}": [[${link}]] at line ${i}`);
            node.wikilinks.push(link);
          }
          
          // Mark this line as processed
          processedLines.add(i);
        }
        
        continue;
      }
      
      node.content += line + '\n';
    }
    
    // Extract spans from these lines
    extractSpansFromLines(node, lines, startLine, endLine, processedLines);
    
    // Count and sort spans
    node.wikilinks = countOccurrences(node.wikilinks);
    node.backticks = countOccurrences(node.backticks);
  }
  
  /**
   * Extract spans from a range of lines
   * @param {Object} node - Section node
   * @param {Array} lines - All lines in document
   * @param {number} startLine - Start line for this range
   * @param {number} endLine - End line for this range
   * @param {Set} processedLines - Set of line numbers that have already been processed
   */
  function extractSpansFromLines(node, lines, startLine, endLine, processedLines = new Set()) {
    let inCodeBlock = false;
    let spanCount = 0;
    
    // Process each line in range
    for (let i = startLine; i <= endLine; i++) {
      const line = lines[i];
      
      // Special handling for speaker marker lines
      if ((line.includes('<<') && line.includes('>>')) || 
          (line.includes('[[') && line.includes(']]')) ||
          (line.includes('<!--') && line.includes('-->'))) {
        debug(`Speaker marker line ${i}: ${line.substring(0, 30)}...`);
        
        // Before skipping, extract any wikilinks in this line
        // But only if this line hasn't been processed yet
        if (!processedLines.has(i)) {
          const speakerWikiRegex = /\[\[([^\]\|]+)(?:\|[^\]]+)?\]\]/g;
          let speakerWikiMatch;
          while ((speakerWikiMatch = speakerWikiRegex.exec(line)) !== null) {
            const link = speakerWikiMatch[1].trim();
            debug(`Found wikilink in speaker line "${node.text || 'root'}": [[${link}]] at line ${i}`);
            node.wikilinks.push(link);
            spanCount++;
          }
          
          // Mark this line as processed
          processedLines.add(i);
        }
        
        continue;
      }
      
      // Check for code fence markers
      if (line.trim().startsWith('```') || line.trim().startsWith('~~~')) {
        inCodeBlock = !inCodeBlock;
        continue;
      }
      
      // Skip extracting spans inside code blocks
      if (inCodeBlock) continue;
      
      // Extract wikilinks from this line - more comprehensive regex to catch all formats
      // This handles [[term]] and also catches terms within speaker lines like <<user>> Does electron have its own [[interface]]
      const wikiRegex = /\[\[([^\]\|]+)(?:\|[^\]]+)?\]\]/g;
      let wikiMatch;
      while ((wikiMatch = wikiRegex.exec(line)) !== null) {
        const link = wikiMatch[1].trim();
        debug(`Found wikilink in "${node.text || 'root'}": [[${link}]] at line ${i}`);
        node.wikilinks.push(link);
        spanCount++;
      }
      
      // Extract backticked spans from this line
      const codeRegex = /`([^`]+)`/g;
      let codeMatch;
      while ((codeMatch = codeRegex.exec(line)) !== null) {
        const content = codeMatch[1].trim();
        if (content.length > 1) {
          debug(`Found code span in "${node.text || 'root'}": \`${content}\` at line ${i}`);
          node.backticks.push(content);
          spanCount++;
        }
      }
    }
    
    if (spanCount > 0) {
      debug(`Extracted ${spanCount} spans from lines ${startLine}-${endLine} for node "${node.text || 'root'}"`);
    }
  }
  
  /**
   * Extract wikilinks from markdown text
   * @param {string} markdown - Markdown content
   * @returns {Array} Array of wikilinks
   */
  function extractWikilinks(markdown) {
    const wikiRegex = /\[\[([^\]\|]+)(?:\|[^\]]+)?\]\]/g;
    const wikilinks = [];
    let wikiMatch;
    
    while ((wikiMatch = wikiRegex.exec(markdown)) !== null) {
      wikilinks.push(wikiMatch[1].trim());
    }
    
    return wikilinks;
  }
  
  /**
   * Extract backticked spans from markdown lines
   * @param {Array} lines - Markdown content split into lines
   * @returns {Array} Array of backticked spans
   */
  function extractBackticks(lines) {
    const backticks = [];
    let inCodeBlock = false;
    
    // Process each line, tracking whether we're inside a code block
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Check for code fence markers (``` or ~~~)
      if (line.trim().startsWith('```') || line.trim().startsWith('~~~')) {
        inCodeBlock = !inCodeBlock;
        continue;
      }
      
      // Skip extracting backticks inside code blocks
      if (!inCodeBlock) {
        // Extract inline code spans
        const codeRegex = /`([^`]+)`/g;
        let codeMatch;
        
        while ((codeMatch = codeRegex.exec(line)) !== null) {
          const content = codeMatch[1].trim();
          // Only include spans with meaningful content (more than 1 character)
          if (content.length > 1) {
            backticks.push(content);
          }
        }
      }
    }
    
    return backticks;
  }
  
  /**
   * Count occurrences of items and sort by frequency
   * @param {Array} items - Array of items to count
   * @returns {Array} Array of [item, count] pairs sorted by count
   */
  function countOccurrences(items) {
    const counts = {};
    
    // Count occurrences
    items.forEach(item => {
      counts[item] = (counts[item] || 0) + 1;
    });
    
    // Convert to array of [item, count] pairs and sort by count (descending)
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1]);
  }
  
  /**
   * Create span tags for a node in the section tree
   * @param {Object} node - Section node with spans
   * @param {Object} settings - Span display settings
   * @returns {HTMLElement} Span container element or null if no spans
   */
  function createNodeSpansContainer(node, settings) {
    debug(`Creating spans container for node "${node.text || 'root'}"`);
    
    // Parse settings with defaults
    const maxTags = settings && settings.maxTags !== undefined ? settings.maxTags : 15;
    const wikiTagsRatio = settings && settings.wikiTagsRatio !== undefined ? settings.wikiTagsRatio : 0.6;
    const codeTagsRatio = settings && settings.codeTagsRatio !== undefined ? settings.codeTagsRatio : 0.4;
    const minCount = settings && settings.minCount !== undefined ? settings.minCount : 1; // Always show tags with at least 1 occurrence
    const showCounts = settings && settings.showCounts !== undefined ? settings.showCounts : true;
    
    // Handle different formats for wikilinks and backticks
    // They might be arrays of strings or arrays of [string, count] pairs
    let processedWikilinks = [];
    let processedBackticks = [];
    
    // Process wikilinks
    if (node.wikilinks && node.wikilinks.length > 0) {
      // Check if wikilinks is already in [string, count] format
      if (Array.isArray(node.wikilinks[0])) {
        processedWikilinks = node.wikilinks.filter(([_, count]) => count >= minCount);
      } else {
        // Convert from string array to [string, 1] pairs
        const tempWikilinks = {};
        node.wikilinks.forEach(link => {
          tempWikilinks[link] = 1; // Each one has a count of 1
        });
        processedWikilinks = Object.entries(tempWikilinks);
      }
    }
    
    // Process backticks
    if (node.backticks && node.backticks.length > 0) {
      // Check if backticks is already in [string, count] format
      if (Array.isArray(node.backticks[0])) {
        processedBackticks = node.backticks.filter(([_, count]) => count >= minCount);
      } else {
        // Convert from string array to [string, 1] pairs or count occurrences
        const tempBackticks = {};
        node.backticks.forEach(code => {
          tempBackticks[code] = (tempBackticks[code] || 0) + 1;
        });
        processedBackticks = Object.entries(tempBackticks);
      }
    }
    
    // Debug information about what we found
    debug(`Processed wikilinks: ${processedWikilinks.length}, backticks: ${processedBackticks.length}`);
    
    // If no tags meet requirements, return null
    if (processedWikilinks.length === 0 && processedBackticks.length === 0) {
      debug(`No spans meet minimum count requirement for node "${node.text || 'root'}"`);
      return null;
    }
    
    debug(`Creating container with ${processedWikilinks.length} wikilinks and ${processedBackticks.length} code spans`);
    
    // Create spans container
    const spansContainer = document.createElement('div');
    spansContainer.className = 'directory-spans-container';
    
    // Create a single container for all tags
    const tagsContainer = document.createElement('div');
    tagsContainer.className = 'directory-tags';
    
    // Calculate how many of each type to include based on ratios
    let maxWikiTags = Math.round(maxTags * wikiTagsRatio);
    let maxCodeTags = Math.round(maxTags * codeTagsRatio);
    
    // Adjust if we have fewer items of one type
    if (processedWikilinks.length < maxWikiTags) {
      maxCodeTags += (maxWikiTags - processedWikilinks.length);
      maxWikiTags = processedWikilinks.length;
    }
    
    if (processedBackticks.length < maxCodeTags) {
      maxWikiTags += (maxCodeTags - processedBackticks.length);
      maxCodeTags = processedBackticks.length;
    }
    
    // Ensure we don't exceed the limits
    maxWikiTags = Math.min(maxWikiTags, processedWikilinks.length);
    maxCodeTags = Math.min(maxCodeTags, processedBackticks.length);
    
    // Prepare combined array of all spans with their types
    const allSpans = [];
    
    // Add wikilinks with type indicator
    processedWikilinks
      .slice(0, maxWikiTags)
      .forEach(([link, count]) => {
        allSpans.push({
          text: link,
          count: count,
          type: 'wiki'
        });
      });
    
    // Add backticked spans with type indicator
    processedBackticks
      .slice(0, maxCodeTags)
      .forEach(([code, count]) => {
        allSpans.push({
          text: code,
          count: count,
          type: 'code'
        });
      });
    
    // Sort all spans by count (descending)
    allSpans.sort((a, b) => b.count - a.count);
    
    // Create spans in the unified container
    allSpans.forEach(span => {
      const spanElement = document.createElement('span');
      spanElement.className = `directory-tag ${span.type === 'wiki' ? 'wiki-tag' : 'code-tag'}`;
      
      // Include the count in the text content with a delimiter
      if (span.count > 1 && showCounts) {
        spanElement.textContent = `${span.text} | ${span.count}`;
        spanElement.title = `${span.text} (${span.count})`;
      } else {
        spanElement.textContent = span.text;
      }
      
      tagsContainer.appendChild(spanElement);
    });
    
    // Only add the container if it has children
    if (tagsContainer.children.length > 0) {
      spansContainer.appendChild(tagsContainer);
      debug(`Created span container with ${tagsContainer.children.length} tags`);
      return spansContainer;
    }
    
    return null;
  }
  
  // Expose public methods
  return {
    extractSpans,
    createNodeSpansContainer
  };
})();

// Make methods available globally
window.spanExtractor = spanExtractor; 