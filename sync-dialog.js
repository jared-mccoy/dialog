#!/usr/bin/env node

const { execSync } = require('child_process');
const readline = require('readline');
const fs = require('fs');
const path = require('path');
const os = require('os');

/**
 * Script to sync changes from current repo to dialog template repo
 * Pushes directly to main branch
 */

// Store original directory
const originalDir = process.cwd();

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// GitHub repository URL
const DIALOG_REPO_URL = 'https://github.com/jared-mccoy/dialog.git';

// Get commit message from args
const COMMIT_MSG = process.argv[2];

// Create a temporary directory for cloning
const tempDir = path.join(os.tmpdir(), `dialog-sync-${Date.now()}`);
console.log(`Creating temporary directory: ${tempDir}`);
fs.mkdirSync(tempDir, { recursive: true });

// Helper function to safely clean up temporary directory
function cleanupTempDir() {
  try {
    // Make sure we're not in the temp directory
    process.chdir(originalDir);
    
    console.log('Cleaning up temporary files...');
    
    // On Windows, we might need to retry due to file locking
    let retries = 5;
    let success = false;
    
    while (retries > 0 && !success) {
      try {
        fs.rmSync(tempDir, { recursive: true, force: true });
        success = true;
      } catch (err) {
        retries--;
        if (retries === 0) {
          console.warn(`Warning: Could not remove temp directory: ${tempDir}`);
          console.warn('You may need to delete it manually.');
        } else {
          // Wait a moment before retrying
          execSync('timeout /t 1', { stdio: 'ignore' });
        }
      }
    }
  } catch (err) {
    console.warn(`Warning: Error during cleanup: ${err.message}`);
    console.warn(`Temporary directory may still exist at: ${tempDir}`);
  }
}

// Set up graceful exit
process.on('SIGINT', () => {
  console.log('\nInterrupted. Cleaning up...');
  cleanupTempDir();
  process.exit(1);
});

// Generate default commit message if none provided
function getDefaultCommitMessage() {
  // Get current repository name from git or fallback to directory name
  let sourceRepo;
  try {
    const remoteUrl = execSync('git config --get remote.origin.url').toString().trim();
    const repoMatch = remoteUrl.match(/\/([^\/]+?)(\.git)?$/);
    sourceRepo = repoMatch ? repoMatch[1] : path.basename(process.cwd());
  } catch (error) {
    sourceRepo = path.basename(process.cwd());
  }
  
  return `Sync changes from ${sourceRepo} - ${new Date().toISOString().split('T')[0]}`;
}

// Set commit message (use default if not provided)
const finalCommitMsg = COMMIT_MSG || getDefaultCommitMessage();

// Directories to exclude
const EXCLUDE_DIRS = ['content', 'public', 'node_modules', '.git'];

// Function to get all files recursively, excluding specific directories
function getAllFiles(dirPath, arrayOfFiles = [], baseDir = dirPath) {
  const files = fs.readdirSync(dirPath);

  files.forEach(file => {
    const fullPath = path.join(dirPath, file);
    const relativePath = path.relative(baseDir, fullPath);
    
    // Skip excluded directories
    if (fs.statSync(fullPath).isDirectory()) {
      // Check if this directory should be excluded
      if (!EXCLUDE_DIRS.some(dir => relativePath.startsWith(dir))) {
        getAllFiles(fullPath, arrayOfFiles, baseDir);
      }
    } else {
      arrayOfFiles.push(relativePath);
    }
  });

  return arrayOfFiles;
}

try {
  // Clone the repository
  console.log(`Cloning ${DIALOG_REPO_URL} to ${tempDir}...`);
  execSync(`git clone ${DIALOG_REPO_URL} "${tempDir}"`);
  
  console.log(`Commit message: "${finalCommitMsg}"`);
  
  // Get all files from current directory excluding specified directories
  console.log('Scanning current repository...');
  const currentRepoFiles = getAllFiles(process.cwd());
  
  // Files that need to be copied to dialog repo
  const filesToSync = [];
  
  // Check each file to see if it needs to be synced
  console.log('Comparing with dialog repository...');
  currentRepoFiles.forEach(file => {
    const currentFilePath = path.join(process.cwd(), file);
    const dialogFilePath = path.join(tempDir, file);
    
    // Skip files in excluded directories
    if (EXCLUDE_DIRS.some(dir => file.startsWith(dir))) {
      return;
    }
    
    // If file doesn't exist in dialog repo or is different, add to sync list
    if (!fs.existsSync(dialogFilePath) || 
        fs.readFileSync(currentFilePath).toString() !== fs.readFileSync(dialogFilePath).toString()) {
      filesToSync.push(file);
    }
  });
  
  if (filesToSync.length === 0) {
    console.log('No files to sync');
    // Clean up and exit
    cleanupTempDir();
    rl.close();
    process.exit(0);
  }
  
  // Show which files will be synced
  console.log('The following files will be synced to dialog repository:');
  filesToSync.forEach(file => console.log(`- ${file}`));
  console.log();
  
  // Ask for confirmation
  rl.question('Do you want to proceed with the sync? (y/n): ', (answer) => {
    if (answer.toLowerCase() !== 'y') {
      console.log('Sync cancelled');
      // Clean up
      cleanupTempDir();
      rl.close();
      process.exit(0);
    }
    
    // Copy files to dialog repo
    console.log('Copying files...');
    filesToSync.forEach(file => {
      // Create directory structure if needed
      const dialogFilePath = path.join(tempDir, file);
      const dialogDirPath = path.dirname(dialogFilePath);
      
      if (!fs.existsSync(dialogDirPath)) {
        fs.mkdirSync(dialogDirPath, { recursive: true });
      }
      
      // Copy file
      fs.copyFileSync(path.join(process.cwd(), file), dialogFilePath);
    });
    
    // Commit and push changes
    try {
      // Change to dialog repo directory
      process.chdir(tempDir);
      
      // Stage all copied files
      filesToSync.forEach(file => {
        execSync(`git add "${file}"`);
      });
      
      // Commit changes
      execSync(`git commit -m "${finalCommitMsg}"`);
      
      console.log('Changes committed successfully!');
      
      // Push to main
      console.log('Pushing changes to dialog repository main branch...');
      execSync('git push origin main');
      
      console.log('\nChanges pushed successfully to main branch!');
      
      // Clean up and return to original directory
      process.chdir(originalDir);
      
      // Close readline before cleanup to avoid file handle issues
      rl.close();
      
      // Add a small delay before cleanup to ensure all file handles are released
      setTimeout(() => {
        cleanupTempDir();
        console.log('Sync completed successfully!');
      }, 1000);
    } catch (error) {
      // Make sure we change back to original directory
      process.chdir(originalDir);
      console.error('Error during commit/push:', error.message);
      
      // Close readline before cleanup
      rl.close();
      
      // Add a small delay before cleanup
      setTimeout(() => {
        cleanupTempDir();
        process.exit(1);
      }, 1000);
    }
  });
} catch (error) {
  console.error('Error:', error.message);
  // Clean up on error
  cleanupTempDir();
  rl.close();
  process.exit(1);
} 