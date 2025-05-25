# Machine Yearning

A GitHub Pages template for rendering Markdown conversation files as a chat interface.

## Features

- Automatically lists all conversations organized by date
- Renders Markdown files as a chat interface
- Supports code syntax highlighting
- Responsive design with dark mode support
- Custom message layout positioning
- Works with GitHub Pages' Jekyll integration

## Setup



### Option 1: Using Jekyll (recommended)

1. Remove the `.nojekyll` file from your repository if it exists
2. Enable GitHub Pages for your repository with Jekyll processing
   - Go to Settings > Pages
   - Select the branch you want to deploy from (usually `main` or `master`)
   - Select the "/ (root)" folder for the site source
   - Save the settings

3. Your site will be available at `https://[your-username].github.io/[repository-name]/`

### Option 2: Without Jekyll (static HTML)

If you're having issues with Jekyll processing:

1. Include the `.nojekyll` file in your repository
2. Update links in the HTML files to use relative paths instead of Jekyll variables
3. The site will be served as static HTML without Jekyll processing

## Adding New Conversations

1. Create a directory with a date format: `YYYY.MM.DD`
2. Add your Markdown conversation files inside that directory
3. Format your conversations using speaker tags:

```markdown
<< USER >>
User's message goes here

<< ASSISTANT >>
Assistant's response goes here
```

4. The files will be automatically listed on the homepage

### Message Layout Customization

You can customize message layout and positioning using layout tags:

```markdown
<< USER {L} >>
This message will align to the left side of the page

<< ASSISTANT {R} >>
This message will align to the right side of the page

<< USER {L.25} >>
This message will be offset 25% from the left side

<< ASSISTANT {R.4} >>
This message will be offset 40% from the right side
```

Layout options:
- `{L}` - Left align (default for assistant/non-user messages)
- `{R}` - Right align (default for user messages)
- `{L.XX}` - Left align with XX% offset from left (e.g., L.25, L.4, L.75)
- `{R.XX}` - Right align with XX% offset from right (e.g., R.25, R.4, R.75)

The layout setting applies to all subsequent messages from the same speaker until a new layout tag is specified.

## Troubleshooting

If your site shows nested HTML or doesn't render correctly:

1. Make sure your HTML files don't contain duplicate HTML, head, or body tags when using Jekyll
2. Try toggling between using Jekyll (remove `.nojekyll`) or static HTML (include `.nojekyll`)
3. Check the GitHub Pages build logs for any errors

## Customization

- Modify `chat-style.css` to change the appearance
- Edit `_config.yml` to change site settings (if using Jekyll)
- Adjust the templates in `index.html` and `chat-viewer.html`

## Local Development

1. Install Jekyll and Bundler:
   ```
   gem install jekyll bundler
   ```

2. Create a `Gemfile` with:
   ```
   source 'https://rubygems.org'
   gem 'github-pages', group: :jekyll_plugins
   ```

3. Run `bundle install`

4. Start the local server:
   ```
   bundle exec jekyll serve
   ```

5. View your site at `http://localhost:4000`

## Legacy Format Support

The system also supports the older format for backward compatibility:

```markdown
<<USER>>
User's message goes here

<<ASSISTANT>>
Assistant's response goes here
```

## License

MIT  