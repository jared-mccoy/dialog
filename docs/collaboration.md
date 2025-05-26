# Collaboration Workflow

Dialog includes tools to help you collaborate with others and manage your conversations across multiple repositories.

## Using the Sync Script

Dialog provides a sync script to help you push changes from your working repository to a main Dialog repository. This allows you to work on conversations locally and then publish them to a shared repository.

### Setup

1. First, make sure you have access to both repositories:
   - Your local Dialog repository
   - The target Dialog repository you want to sync with

2. Configure the sync script by editing the configuration section at the top of `sync-dialog.js`:

```javascript
// Configuration
const config = {
  sourceRepo: 'path/to/your/local/dialog',
  targetRepo: 'path/to/target/dialog/repository',
  contentDir: 'content',
  includeDirs: ['styles', 'scripts', 'public'],
  excludePatterns: ['.git', 'node_modules', '.DS_Store']
};
```

### Basic Usage

Run the sync script from the command line:

```bash
node sync-dialog.js
```

This will:
1. Compare files between your source and target repositories
2. Identify files that need to be updated
3. Copy new and modified files to the target repository

### Advanced Options

The sync script supports several command-line options:

```bash
# Perform a dry run (don't make any changes)
node sync-dialog.js --dry-run

# Force overwrite all files, even if unchanged
node sync-dialog.js --force

# Only sync specific directories
node sync-dialog.js --dirs=content,styles

# Sync only files modified after a specific date
node sync-dialog.js --since=2023-01-01
```

## Collaborative Workflows

### Solo Author Workflow

If you're working alone but want to maintain multiple Dialog sites:

1. Create a main Dialog repository for publishing
2. Create a working Dialog repository for development
3. Make changes in your working repository
4. Use the sync script to push changes to your main repository
5. Deploy your main repository to GitHub Pages

### Team Workflow

For teams collaborating on Dialog content:

1. Create a central Dialog repository
2. Each team member forks the repository
3. Make changes in your fork
4. Submit pull requests to the central repository
5. Use the sync script to keep your fork up to date with the central repository

### Content Management Workflow

For managing multiple Dialog instances:

1. Create a template Dialog repository with your custom styling and settings
2. For each new project, create a new repository from the template
3. Add content to the new repository
4. Use the sync script to pull styling updates from the template repository

## Best Practices

- **Keep Content Separate**: Store all conversations in the `content/` directory to make syncing easier
- **Use Consistent Naming**: Follow the same naming conventions across repositories
- **Document Changes**: Add comments in your sync script configuration to track special handling
- **Regular Backups**: Always backup important content before running the sync script
- **Version Control**: Commit changes before and after syncing to track what was modified

## Troubleshooting

### Common Issues

- **File conflicts**: If both repositories have modified the same file, the script will warn you and default to the newer version
- **Missing dependencies**: Make sure both repositories have the same structure and required files
- **Permission errors**: Ensure you have write access to both repositories

### Manual Conflict Resolution

If you encounter conflicts:

1. Run the sync script with `--dry-run` to see what changes would be made
2. Manually resolve conflicts by editing the files in question
3. Run the sync script again with the `--resolved` flag to skip conflict detection 