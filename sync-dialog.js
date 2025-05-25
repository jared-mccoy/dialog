#!/usr/bin/env node

const { execSync } = require('child_process');
const readline = require('readline');
const fs = require('fs');
const path = require('path');
const os = require('os');

/**
 * Script to sync changes from current repo to dialog template repo
 * Creates a new branch and sets up for a pull request
 */

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

// Get the current user's git identity (for branch naming)
function getGitUserInfo() {
  try {
    const name = execSync('git config --get user.name').toString().trim();
    return name.toLowerCase().replace(/\s+/g, '-');
  } catch (error) {
    return 'sync';
  }
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
    fs.rmSync(tempDir, { recursive: true, force: true });
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
      fs.rmSync(tempDir, { recursive: true, force: true });
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
    
    // Create branch and commit changes
    try {
      // Change to dialog repo directory
      process.chdir(tempDir);
      
      // Create a new branch
      const timestamp = new Date().toISOString().replace(/[-:.]/g, '').substring(0, 14);
      const username = getGitUserInfo();
      const branchName = `sync-${username}-${timestamp}`;
      
      console.log(`Creating branch: ${branchName}`);
      execSync(`git checkout -b ${branchName}`);
      
      // Stage all copied files
      filesToSync.forEach(file => {
        execSync(`git add "${file}"`);
      });
      
      // Commit changes
      execSync(`git commit -m "${finalCommitMsg}"`);
      
      console.log('Changes committed successfully!');
      
      // Push the branch
      console.log('Pushing branch to GitHub...');
      execSync(`git push -u origin ${branchName}`);
      
      // Generate PR URL
      const prUrl = `https://github.com/jared-mccoy/dialog/pull/new/${branchName}`;
      
      console.log('\nChanges pushed successfully!');
      console.log('\nTo create a pull request, visit:');
      console.log(prUrl);
      
      // Open the PR URL in the default browser if requested
      rl.question('\nDo you want to open the pull request page in your browser? (y/n): ', (openAnswer) => {
        if (openAnswer.toLowerCase() === 'y') {
          const openCommand = process.platform === 'win32' 
            ? `start "${prUrl}"` 
            : (process.platform === 'darwin' ? `open "${prUrl}"` : `xdg-open "${prUrl}"`);
          
          try {
            execSync(openCommand);
          } catch (error) {
            console.log(`Could not open browser. Please visit the URL manually.`);
          }
        }
        
        // Clean up
        console.log('Cleaning up temporary files...');
        process.chdir(process.cwd());
        fs.rmSync(tempDir, { recursive: true, force: true });
        
        console.log('Sync completed successfully!');
        rl.close();
      });
    } catch (error) {
      console.error('Error during commit/push:', error.message);
      // Clean up on error
      process.chdir(process.cwd());
      fs.rmSync(tempDir, { recursive: true, force: true });
      rl.close();
      process.exit(1);
    }
  });
} catch (error) {
  console.error('Error:', error.message);
  // Clean up on error
  if (fs.existsSync(tempDir)) {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
  process.exit(1);
} 