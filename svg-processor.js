#!/usr/bin/env node

// SVG Processor Script - Node.js version
// Directly converts images to SVG with background removal - outputs in monochrome black
const fs = require('fs');
const path = require('path');
const { createCanvas, Image } = require('canvas');

// Default configuration
const defaults = {
  inputFile: 'agent.png',
  outputFile: 'agent-mono.svg',
  threshold: 200,
  batchMode: true,  // Default to batch mode
  inputDir: 'public/speaker_icons/raw',
  outputDir: 'public/speaker_icons'
};

// Get arguments
const args = process.argv.slice(2);
let {
  inputFile,
  outputFile,
  threshold,
  batchMode,
  inputDir,
  outputDir
} = defaults;

// Parse command line arguments
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--input' && i + 1 < args.length) {
    inputFile = args[i + 1];
    i++;
  } else if (args[i] === '--output' && i + 1 < args.length) {
    outputFile = args[i + 1];
    i++;
  } else if (args[i] === '--threshold' && i + 1 < args.length) {
    threshold = parseInt(args[i + 1]);
    i++;
  } else if (args[i] === '--single' || args[i] === '-s') {
    batchMode = false;
  } else if (args[i] === '--batch' || args[i] === '-b') {
    batchMode = true;
  } else if (args[i] === '--input-dir' && i + 1 < args.length) {
    inputDir = args[i + 1];
    i++;
  } else if (args[i] === '--output-dir' && i + 1 < args.length) {
    outputDir = args[i + 1];
    i++;
  }
}

// Display configuration
debugLog(`Configuration:
  Mode: ${batchMode ? 'Batch' : 'Single file'}
  Input: ${batchMode ? inputDir : inputFile}
  Output: ${batchMode ? outputDir : outputFile}
  Threshold: ${threshold}
  Output format: Monochrome black (can be colored via CSS)
`);

// Ensure directories exist
function ensureDirectoryExists(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    debugLog(`Created directory: ${dir}`);
  }
}

// Convert image to monochrome SVG
function convertImageToSvg(inputPath, outputPath, threshold) {
  // Read the image file
  const img = new Image();
  
  try {
    // Load image from file
    const fileBuffer = fs.readFileSync(inputPath);
    img.src = fileBuffer;
    
    // Create canvas with image dimensions
    const canvas = createCanvas(img.width, img.height);
    const ctx = canvas.getContext('2d');
    
    // Draw image to canvas
    ctx.drawImage(img, 0, 0);
    
    // Get image data
    const pixelData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = pixelData.data;
    
    // Create a binary representation of the image (dark pixels only)
    const binaryImage = [];
    for (let y = 0; y < canvas.height; y++) {
      binaryImage[y] = [];
      for (let x = 0; x < canvas.width; x++) {
        const index = (y * canvas.width + x) * 4;
        const r = data[index];
        const g = data[index + 1];
        const b = data[index + 2];
        const a = data[index + 3];
        
        // Calculate brightness
        const brightness = (r * 0.299 + g * 0.587 + b * 0.114);
        
        // Mark pixel as dark (1) or light (0)
        binaryImage[y][x] = (brightness < threshold && a > 127) ? 1 : 0;
      }
    }
    
    // Create SVG header with proper viewBox
    let svgString = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${canvas.width} ${canvas.height}" width="${canvas.width}" height="${canvas.height}" class="icon-svg">`;
    
    // Create a single path that contains all dark areas - using black (#000) as the color
    svgString += `<path fill="currentColor" d="`;
    
    // Use a simplified approach - create rectangles for runs of dark pixels
    const paths = [];
    
    // Find horizontal runs of dark pixels
    for (let y = 0; y < canvas.height; y++) {
      let runStart = -1;
      
      for (let x = 0; x < canvas.width; x++) {
        if (binaryImage[y][x] === 1) {
          // Start of a run
          if (runStart === -1) {
            runStart = x;
          }
        } else if (runStart !== -1) {
          // End of a run
          paths.push(`M${runStart},${y}h${x - runStart}v1h-${x - runStart}z`);
          runStart = -1;
        }
      }
      
      // Check for run at the end of the row
      if (runStart !== -1) {
        paths.push(`M${runStart},${y}h${canvas.width - runStart}v1h-${canvas.width - runStart}z`);
      }
    }
    
    // Add all paths to SVG
    svgString += paths.join(' ') + '"/>'; 
    
    // Close SVG
    svgString += '</svg>';
    
    // Write SVG to file
    fs.writeFileSync(outputPath, svgString);
    
    debugLog(`Successfully converted ${inputPath} to ${outputPath}`);
    
    return true;
  } catch (error) {
    console.error(`Error converting image ${inputPath}:`, error.message);
    return false;
  }
}

// Process a directory of images
function processBatch(inputDirectory, outputDirectory, threshold) {
  // Ensure output directory exists
  ensureDirectoryExists(outputDirectory);
  
  // Check if input directory exists
  if (!fs.existsSync(inputDirectory)) {
    console.error(`Error: Input directory "${inputDirectory}" not found.`);
    process.exit(1);
  }
  
  // Get all files in the input directory
  const files = fs.readdirSync(inputDirectory);
  
  // Filter for image files
  const imageFiles = files.filter(file => {
    const ext = path.extname(file).toLowerCase();
    return ['.png', '.jpg', '.jpeg', '.gif'].includes(ext);
  });
  
  debugLog(`Found ${imageFiles.length} image files in ${inputDirectory}`);
  
  if (imageFiles.length === 0) {
    debugLog('No image files found to process.');
    return;
  }
  
  // Process each image
  let successCount = 0;
  let failCount = 0;
  
  imageFiles.forEach(file => {
    const inputPath = path.join(inputDirectory, file);
    const outputFileName = path.basename(file, path.extname(file)) + '.svg';
    const outputPath = path.join(outputDirectory, outputFileName);
    
    debugLog(`Processing: ${inputPath} -> ${outputPath}`);
    
    const success = convertImageToSvg(inputPath, outputPath, threshold);
    if (success) {
      successCount++;
    } else {
      failCount++;
    }
  });
  
  debugLog('\nBatch processing complete:');
  debugLog(`- Total files: ${imageFiles.length}`);
  debugLog(`- Successfully converted: ${successCount}`);
  debugLog(`- Failed: ${failCount}`);
  debugLog('\nNow you can use the SVGs with CSS coloring:');
  debugLog(`
  /* In your CSS file */
  .icon-svg {
    color: var(--accent-color); /* Icons inherit color from CSS */
    width: 24px;
    height: 24px;
  }
  
  /* Dynamic coloring based on theme */
  [data-theme="light"] .icon-svg { color: #192b91; }
  [data-theme="dark"] .icon-svg { color: #ffc400; }
  `);
}

// Run in batch mode or single file mode
if (batchMode) {
  debugLog('Running in batch mode...');
  processBatch(inputDir, outputDir, threshold);
} else {
  // Check if the file exists
  if (!fs.existsSync(inputFile)) {
    console.error(`Error: Input file "${inputFile}" not found.`);
    process.exit(1);
  }
  
  // Ensure output directory exists
  const outputDirectory = path.dirname(outputFile);
  ensureDirectoryExists(outputDirectory);
  
  // Run the conversion for single file
  convertImageToSvg(inputFile, outputFile, threshold);
  
  debugLog('\nYou can use the SVG with CSS coloring:');
  debugLog(`
  /* In your CSS file */
  .icon-svg {
    color: var(--accent-color); /* Icons inherit color from CSS */
    width: 24px;
    height: 24px;
  }
  
  /* Dynamic coloring based on theme */
  [data-theme="light"] .icon-svg { color: #192b91; }
  [data-theme="dark"] .icon-svg { color: #ffc400; }
  `);
}

/*
USAGE:
1. Make sure you have installed the required dependency:
   npm install canvas

2. Make the script executable (Unix/Linux/Mac):
   chmod +x svg-processor.js

3. Running the script with no arguments will use defaults:
   - Batch processing mode
   - Input directory: public/speaker_icons/raw
   - Output directory: public/speaker_icons
   - Threshold: 200
   - Output: Monochrome black SVGs with currentColor fill (for CSS styling)

4. Run with custom parameters for batch processing:
   node svg-processor.js --input-dir public/speaker_icons/raw --output-dir public/speaker_icons --threshold 180

5. Run in single file mode:
   node svg-processor.js --single --input agent.png --output agent-mono.svg

6. Parameters:
   --single, -s  : Process a single file instead of batch
   --batch, -b   : Process all images in the input directory (default)
   --input       : Input image file path (for single mode)
   --output      : Output SVG file path (for single mode)
   --input-dir   : Input directory for batch processing
   --output-dir  : Output directory for batch processing
   --threshold   : Brightness threshold (0-255, higher = more aggressive background removal)

7. CSS Usage:
   The output SVGs use currentColor, so you can color them with CSS:
   
   // HTML
   <img src="agent.svg" class="icon-svg">
   
   // CSS
   .icon-svg {
     color: var(--accent-color);
     width: 24px;
     height: 24px;
   }
*/ 