/**
 * Machine Yearning App - Directory Methods
 * Contains methods for handling directory/home view functionality
 */

/**
 * Initialize the directory/home view
 */
export async function initDirectoryView() {
  try {
    // Make sure chat scanner is initialized
    if (!window.chatScanner) {
      console.error('Chat scanner not available');
      return;
    }
    
    // Get the post container
    const postContainer = document.getElementById('post-container');
    if (!postContainer) {
      debugLog('Post container not found');
      console.error('Post container not found');
      return;
    }
    
    // Add the directory container class to the post container
    postContainer.classList.add('directory-container');
    
    const loadingIndicator = document.getElementById('loading');
    if (loadingIndicator) {
      loadingIndicator.className = 'directory-loading-indicator';
    }
    
    // Initialize the chat scanner and get the dates
    debugLog('Initializing chat scanner');
    const dates = await window.chatScanner.init();
    debugLog(`Received ${dates.length} date directories`);
    
    if (dates.length === 0) {
      if (loadingIndicator) {
        loadingIndicator.innerHTML = '<div class="directory-info-message"><p>No conversations found.</p><p>Add markdown files to the content directory to get started.</p></div>';
      }
      return;
    }
    
    // Hide the loading indicator
    if (loadingIndicator) {
      loadingIndicator.style.display = 'none';
    }
    
    // Clear any existing content first (except the loading indicator)
    Array.from(postContainer.children).forEach(child => {
      if (child.id !== 'loading') {
        postContainer.removeChild(child);
      }
    });
    
    // Function to fetch and parse markdown content for headers
    async function getFileHeaders(filePath) {
      try {
        const response = await fetch(filePath);
        if (!response.ok) {
          return [];
        }
        
        const markdown = await response.text();
        const headerRegex = /^(#{2,4})\s+(.+)$/gm;
        const headers = [];
        
        let match;
        while ((match = headerRegex.exec(markdown)) !== null) {
          headers.push({
            level: match[1].length, // Number of # symbols
            text: match[2].trim()
          });
        }
        
        return headers;
      } catch (error) {
        console.error(`Error fetching headers from ${filePath}:`, error);
        return [];
      }
    }
    
    debugLog('Creating simplified directory structure');
    
    // Process each date
    for (const date of dates) {
      if (date.files.length === 0) continue; // Skip dates with no files
      
      // Create date entry
      const dateSection = document.createElement('div');
      dateSection.className = 'directory-section';
      
      // Create date header
      const dateHeader = document.createElement('div');
      dateHeader.className = 'directory-header-wrapper';
      dateHeader.textContent = date.displayName;
      dateSection.appendChild(dateHeader);
      
      // Create date content container
      const dateContent = document.createElement('div');
      dateContent.className = 'directory-content-container';
      dateSection.appendChild(dateContent);
      
      // Process each file in this date
      for (const file of date.files) {
        // Create file section
        const fileSection = document.createElement('div');
        fileSection.className = 'directory-section';
        
        // Create file header
        const fileHeader = document.createElement('div');
        fileHeader.className = 'directory-header-wrapper';
        fileHeader.textContent = file.title;
        
        // Add click handler to section as well as header
        const fileUrl = `index.html?path=${file.path}`;
        fileSection.addEventListener('click', () => {
          window.location.href = fileUrl;
        });
        
        fileHeader.addEventListener('click', (e) => {
          e.stopPropagation(); // Prevent triggering the parent's click event
          window.location.href = fileUrl;
        });
        
        fileSection.appendChild(fileHeader);
        
        // Fetch headers from the file
        const headers = await getFileHeaders(file.path);
        
        // Extract wikilinks and backticked spans using the external module
        let spans = { wikilinks: [], backticks: [] };
        if (window.spanExtractor && typeof window.spanExtractor.extractSpans === 'function') {
          spans = await window.spanExtractor.extractSpans(file.path);
        }
        
        // Check if span display is enabled in settings
        const spanSettings = window.appSettings && window.appSettings.get && 
                           window.appSettings.get().directory && 
                           window.appSettings.get().directory.spans;
        
        const spanEnabled = spanSettings ? spanSettings.enabled : true;
        
        // Check if we have headers, create file content structure
        if (headers.length > 0) {
          // Create content container for this file's headers
          const fileContent = document.createElement('div');
          fileContent.className = 'directory-content-container';
          fileSection.appendChild(fileContent);
          
          // Build a structure to track headers
          const headerElements = [];
          
          // Process headers based on their level
          headers.forEach((header, index) => {
            // Create section for this header
            const headerSection = document.createElement('div');
            headerSection.className = 'directory-section';
            
            // Create the header element
            const headerElement = document.createElement('div');
            headerElement.className = 'directory-header-wrapper';
            headerElement.textContent = header.text;
            
            // Add click handler to both section and header
            const headerUrl = `index.html?path=${file.path}#${header.text.toLowerCase().replace(/\s+/g, '-')}`;
            
            headerSection.addEventListener('click', (e) => {
              window.location.href = headerUrl;
            });
            
            headerElement.addEventListener('click', (e) => {
              e.stopPropagation(); // Prevent triggering the parent's click event
              window.location.href = headerUrl;
            });
            
            // Create content container for any children
            const contentElement = document.createElement('div');
            contentElement.className = 'directory-content-container';
            
            // Store all information about this header
            headerElements.push({
              level: header.level,
              section: headerSection,
              header: headerElement,
              content: contentElement,
              text: header.text
            });
            
            // Add header to section
            headerSection.appendChild(headerElement);
            headerSection.appendChild(contentElement);
          });
          
          // Use the hierarchical span tree for displaying tags
          if (spanEnabled && spans && spans.tree && 
              window.spanExtractor && typeof window.spanExtractor.createNodeSpansContainer === 'function') {
            
            debugLog('Processing spans for file:', file.title);
            
            // Function to recursively add spans from the tree
            function addSpansFromTree(node, headerElements, contentContainer) {
              // For each node in the tree
              if (node.text !== 'Root') {
                // Normalize node text for comparison (lowercase, trim whitespace)
                const normalizedNodeText = node.text.toLowerCase().trim();
                
                // Find matching header in UI, using normalized comparison
                const matchingHeader = headerElements.find(h => 
                  h.text.toLowerCase().trim() === normalizedNodeText);
                
                if (matchingHeader) {
                  debugLog('Found matching header for:', node.text);
                  debugLog('Node has wikilinks:', node.wikilinks.length, 'backticks:', node.backticks.length);
                  
                  // Create and add spans for this node
                  const spansContainer = window.spanExtractor.createNodeSpansContainer(node, spanSettings);
                  if (spansContainer) {
                    debugLog('Adding spans container to header:', matchingHeader.text);
                    matchingHeader.content.appendChild(spansContainer);
                  } else {
                    debugLog('No spans container created for:', node.text);
                  }
                } else {
                  debugLog('No matching header found for:', node.text);
                }
              } else if (node.text === 'Root' && node.wikilinks.length + node.backticks.length > 0) {
                // For root node (content before first header), add directly to the content container
                debugLog('Processing Root node, wikilinks:', node.wikilinks.length, 'backticks:', node.backticks.length);
                const spansContainer = window.spanExtractor.createNodeSpansContainer(node, spanSettings);
                if (spansContainer) {
                  debugLog('Adding Root spans to content container');
                  contentContainer.appendChild(spansContainer);
                }
              }
              
              // Process children recursively
              if (node.children && node.children.length) {
                debugLog('Processing', node.children.length, 'children of', node.text || 'Root');
                node.children.forEach(child => {
                  addSpansFromTree(child, headerElements, contentContainer);
                });
              }
            }
            
            // Log full tree structure for debugging
            debugLog('Full tree structure:', JSON.stringify(spans.tree, (key, value) => {
              // Exclude parent to avoid circular reference and content to reduce size
              if (key === 'parent' || key === 'content') return undefined;
              return value;
            }, 2));
            
            // Log header elements for debugging
            debugLog('UI Header elements:', headerElements.map(h => ({
              text: h.text,
              level: h.level
            })));
            
            // Start from the root of the span tree
            addSpansFromTree(spans.tree, headerElements, fileContent);
          }
          
          // Build the hierarchy (determine where each header should be placed)
          for (let i = 0; i < headerElements.length; i++) {
            const current = headerElements[i];
            
            if (i === 0 || current.level === 2) {
              // First header or level 2 header goes directly in file content
              fileContent.appendChild(current.section);
            } else {
              // Find the appropriate parent for this header
              let parentFound = false;
              
              // Look backward to find the closest header with a lower level
              for (let j = i - 1; j >= 0 && !parentFound; j--) {
                const potential = headerElements[j];
                
                if (potential.level < current.level) {
                  // Found a parent - add this header to its content
                  potential.content.appendChild(current.section);
                  parentFound = true;
                }
              }
              
              // If no parent found, add to file content
              if (!parentFound) {
                fileContent.appendChild(current.section);
              }
            }
          }
        } else {
          // No headers, but we might still want to show tags if they exist
          if (spanEnabled && spans && spans.tree && 
              window.spanExtractor && typeof window.spanExtractor.createNodeSpansContainer === 'function') {
            
            // Get the root node which contains all spans when no headers exist
            const rootNode = spans.tree;
            
            // No headers case logs
            debugLog('No headers case - Root node has wikilinks:', 
              rootNode.wikilinks?.length || 0, 'backticks:', rootNode.backticks?.length || 0);
            
            if (rootNode && (rootNode.wikilinks.length > 0 || rootNode.backticks.length > 0)) {
              // Create a content container structure
              const fileContent = document.createElement('div');
              fileContent.className = 'directory-content-container';
              
              const spansContainer = window.spanExtractor.createNodeSpansContainer(rootNode, spanSettings);
              
              if (spansContainer) {
                // Spans container logs
                debugLog('Adding spans container in no-headers case');
                fileContent.appendChild(spansContainer);
                fileSection.appendChild(fileContent);
              } else {
                // Spans container logs
                debugLog('No spans container created in no-headers case');
              }
            }
          }
        }
        
        // Add completed file section to date content
        dateContent.appendChild(fileSection);
      }
      
      // Add completed date section to post container
      postContainer.appendChild(dateSection);
    }
    
    debugLog('Directory view initialization completed with simplified structure');
    
    // Apply recursive styling after the directory structure is built
    if (window.recursiveStyling && typeof window.recursiveStyling.apply === 'function') {
      debugLog('Applying recursive styling to directory');
      // Call twice with a delay to ensure proper application
      window.recursiveStyling.apply();
      setTimeout(window.recursiveStyling.apply, 300);
    } else {
      debugLog('Recursive styling not available');
    }
    
  } catch (error) {
    debugLog(`Error in initDirectoryView: ${error.message}`);
    console.error('Error initializing directory view:', error);
    
    // Try to display an error message
    const postContainer = document.getElementById('post-container') || document.querySelector('.content') || document.body;
    if (postContainer) {
      postContainer.innerHTML = `
        <div class="directory-error-message">
          <p><strong>Error loading chat directory:</strong> ${error.message}</p>
          <p>Please check that the content directory exists and is accessible.</p>
        </div>
      `;
    }
  }
} 