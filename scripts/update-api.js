const fs = require('fs');
const path = require('path');

function scanDirectory(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...scanDirectory(fullPath));
    } else if (entry.isFile() && entry.name.endsWith('.md')) {
      // Get relative path from content directory and normalize to forward slashes
      const relativePath = path.relative('content', fullPath).replace(/\\/g, '/');
      files.push({
        path: `content/${relativePath}`,
        name: entry.name,
        directory: path.dirname(relativePath).replace(/\\/g, '/')
      });
    }
  }

  return files;
}

// Ensure content directory exists
if (!fs.existsSync('content')) {
  console.error('Content directory not found!');
  process.exit(1);
}

// Scan for all markdown files
const files = scanDirectory('content');

// Group files by directory
const directoryStructure = files.reduce((acc, file) => {
  if (!acc[file.directory]) {
    acc[file.directory] = [];
  }
  acc[file.directory].push({
    name: file.name,
    path: file.path
  });
  return acc;
}, {});

// Write to api.json
fs.writeFileSync('api.json', JSON.stringify({
  lastUpdated: new Date().toISOString(),
  directories: directoryStructure
}, null, 2));

console.log(`Successfully indexed ${files.length} markdown files`);

// Run the script if called directly
if (require.main === module) {
  try {
    scanDirectory('content');
  } catch (error) {
    console.error('Error generating api.json:', error);
    process.exit(1);
  }
}

module.exports = { scanDirectory }; 