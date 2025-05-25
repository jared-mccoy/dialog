/**
 * Chat Directory Scanner
 * Uses api.json to discover all chat files in the content directory
 */

// Add base URL config to handle both local and GitHub Pages environments
const baseUrl = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
  ? '' 
  : '/machine-yearning';

// Add more detailed logging
if (window.appLog) {
  appLog.info(`Running on ${window.location.hostname} with baseUrl set to: "${baseUrl}"`);
  appLog.info(`Full current URL: ${window.location.href}`);
} else {
  console.info(`Running on ${window.location.hostname} with baseUrl set to: "${baseUrl}"`);
  console.info(`Full current URL: ${window.location.href}`);
}

class ChatDirectoryScanner {
  constructor() {
    this.chats = [];
    this.dates = [];
    this.isLoading = false;
    this.cacheKey = 'machine-yearning-chats';
    this.cacheDuration = 3600000; // 1 hour in milliseconds
    
    // Clear the cache on page load to force a fresh scan
    this.clearCache();
    
    // Log constructor completion
    if (window.appLog) {
      appLog.debug('ChatDirectoryScanner constructor completed');
    } else {
      console.info('ChatDirectoryScanner constructor completed');
    }
  }
  
  // Clear the browser cache for this app
  clearCache() {
    try {
      localStorage.removeItem(this.cacheKey);
      if (window.appLog) {
        appLog.debug('Chat scanner cache cleared');
      } else {
        console.info('Chat scanner cache cleared');
      }
    } catch (e) {
      console.warn('Failed to clear cache:', e);
    }
  }

  /**
   * Initialize the scanner
   * @returns {Promise} Resolves when scan is complete
   */
  async init() {
    const log = (msg) => {
      if (window.appLog) {
        appLog.debug(msg);
      } else {
        console.info(msg);
      }
    };
    
    log('ChatDirectoryScanner.init() called');
    
    // Check for cached data first
    const cachedData = this.loadFromCache();
    if (cachedData) {
      log('Using cached directory data');
      this.dates = cachedData.dates;
      this.chats = cachedData.chats;
      return Promise.resolve(this.dates);
    }

    // If no cached data, fetch from api.json
    log('No cache found, fetching from api.json');
    return this.fetchFromApi().catch(error => {
      log(`API fetch error: ${error.message}`);
      
      // Display a user-friendly error on the page
      const postContainer = document.getElementById('post-container');
      if (postContainer) {
        postContainer.innerHTML = `
          <div class="error-message" style="padding: 16px; margin: 16px; background: #ffeeee; border: 1px solid #cc0000; color: #cc0000;">
            <strong>Error loading conversations:</strong> ${error.message}<br><br>
            <p>Please check that:</p>
            <ul>
              <li>The api.json file exists and is properly formatted</li>
              <li>Your content directory contains markdown files</li>
              <li>There are no JavaScript errors in the console</li>
            </ul>
          </div>
        `;
      }
      
      // Return empty result
      return [];
    });
  }

  /**
   * Attempt to load data from cache
   * @returns {Object|null} Cached data or null if no valid cache exists
   */
  loadFromCache() {
    try {
      const cached = localStorage.getItem(this.cacheKey);
      if (!cached) return null;

      const data = JSON.parse(cached);
      const timestamp = data.timestamp || 0;
      const now = Date.now();

      // Check if cache is still valid
      if (now - timestamp < this.cacheDuration) {
        return data;
      }
      
      return null;
    } catch (e) {
      console.warn('Failed to load from cache:', e);
      return null;
    }
  }

  /**
   * Save data to cache
   */
  saveToCache() {
    try {
      const data = {
        dates: this.dates,
        chats: this.chats,
        timestamp: Date.now()
      };
      localStorage.setItem(this.cacheKey, JSON.stringify(data));
    } catch (e) {
      console.warn('Failed to save to cache:', e);
    }
  }

  /**
   * Fetch and process data from api.json
   * @returns {Promise} Resolves with an array of date objects
   */
  async fetchFromApi() {
    if (this.isLoading) {
      return new Promise(resolve => {
        // Poll until loading is complete
        const checkLoading = () => {
          if (!this.isLoading) {
            resolve(this.dates);
          } else {
            setTimeout(checkLoading, 100);
          }
        };
        checkLoading();
      });
    }

    this.isLoading = true;
    this.dates = [];
    this.chats = [];
    
    const logMsg = (msg) => {
      if (window.appLog) {
        appLog.debug(msg);
      } else {
        console.info(msg);
      }
    };

    try {
      logMsg('Fetching api.json');
      const response = await fetch(`${baseUrl}/api.json`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch api.json: ${response.status} ${response.statusText}`);
      }

      const apiData = await response.json();
      
      // Process each directory
      for (const [dirName, files] of Object.entries(apiData.directories)) {
        const dateObj = {
          name: dirName,
          displayName: dirName,
          files: files.map(file => ({
            path: file.path,
            name: file.name,
            title: file.name.replace('.md', '')
          }))
        };
        
        this.dates.push(dateObj);
        this.chats.push(...dateObj.files);
      }
      
      // Sort dates in reverse chronological order
      this.dates.sort((a, b) => b.name.localeCompare(a.name));
      
      logMsg(`Processed ${this.dates.length} date directories with a total of ${this.chats.length} files`);
      
      this.saveToCache();
    } catch (error) {
      console.error('Error fetching from api.json:', error);
      logMsg(`API fetch error: ${error.message}`);
      this.isLoading = false;
      throw error;
    }
    
    this.isLoading = false;
    return this.dates;
  }

  /**
   * Get a flat array of all chat files
   * @returns {Array} Array of chat file objects
   */
  getAllChats() {
    return this.chats;
  }

  /**
   * Find the previous and next chats relative to a given path
   * @param {string} currentPath Path of the current chat
   * @returns {Object} Object with prev and next properties
   */
  getNavigation(currentPath) {
    const index = this.chats.findIndex(chat => chat.path === currentPath);
    
    let prev = null;
    let next = null;
    
    if (index > 0) {
      prev = this.chats[index - 1];
    }
    
    if (index !== -1 && index < this.chats.length - 1) {
      next = this.chats[index + 1];
    }
    
    return { prev, next };
  }

  /**
   * Get the full URL for a file
   * @param {string} filePath The file path from api.json
   * @returns {string} The full URL to fetch the file
   */
  getFileUrl(filePath) {
    // Normalize path to use forward slashes
    const normalizedPath = filePath.replace(/\\/g, '/');
    const url = `${baseUrl}/${normalizedPath}`;
    
    if (window.appLog) {
      appLog.debug(`Constructed file URL: ${url}`);
    }
    
    return url;
  }

  /**
   * Get headers from a markdown file
   * @param {string} filePath Path to the markdown file
   * @returns {Promise<Array>} Array of header objects
   */
  async getFileHeaders(filePath) {
    try {
      const url = this.getFileUrl(filePath);
      if (window.appLog) {
        appLog.debug(`Fetching headers from: ${url}`);
      }
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch ${url}: ${response.status}`);
      }
      const text = await response.text();
      return this.extractHeaders(text);
    } catch (error) {
      console.warn(`Error fetching headers for ${filePath}:`, error);
      return [];
    }
  }

  /**
   * Initialize the directory view
   * @returns {Promise<void>}
   */
  async initDirectoryView() {
    const log = (msg) => {
      if (window.appLog) {
        appLog.debug(msg);
      } else {
        console.info(msg);
      }
    };

    try {
      log('Starting directory view mode');
      log('Initializing chat scanner');

      // Initialize the scanner
      await this.init();

      // Get the directory container
      const directoryContainer = document.getElementById('directory-container');
      if (!directoryContainer) {
        throw new Error('Directory container not found');
      }

      // Create the directory structure
      const directoryStructure = this.dates.map(date => ({
        name: date.name,
        displayName: date.displayName,
        files: date.files.map(file => ({
          path: file.path.replace(/\\/g, '/'),
          name: file.name,
          title: file.title || file.name.replace('.md', '')
        }))
      }));

      log(`Received ${this.dates.length} date directories`);
      log('Creating simplified directory structure');

      // Create the directory view
      directoryContainer.innerHTML = this.createDirectoryView(directoryStructure);

      // Initialize any interactive elements
      this.initializeDirectoryInteractions(directoryContainer);

      // Extract spans from the first file if available
      if (this.dates.length > 0 && this.dates[0].files.length > 0) {
        const firstFile = this.dates[0].files[0];
        try {
          const spans = await this.extractSpans(firstFile.path);
          if (spans && spans.length > 0) {
            log('No headers case - Root node has wikilinks:');
            this.initializeWikilinks(spans);
          }
        } catch (error) {
          console.warn('Error extracting spans:', error);
        }
      }
    } catch (error) {
      console.error('Error in initDirectoryView:', error);
      throw error;
    }
  }

  /**
   * Extract spans from a markdown file
   * @param {string} filePath Path to the markdown file
   * @returns {Promise<Array>} Array of span objects
   */
  async extractSpans(filePath) {
    try {
      const url = this.getFileUrl(filePath);
      if (window.appLog) {
        appLog.debug(`Extracting spans from: ${url}`);
      }
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch ${url}: ${response.status}`);
      }
      const text = await response.text();
      return this.parseSpans(text);
    } catch (error) {
      console.warn(`Error extracting spans from ${filePath}:`, error);
      return [];
    }
  }
}

// Create a global instance
window.chatScanner = new ChatDirectoryScanner(); 