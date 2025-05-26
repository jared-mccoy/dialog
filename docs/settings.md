# Dialog Settings

Dialog offers several configurable settings to customize your experience. This document outlines the available settings and how to adjust them.

## Animation Settings

Control the typing animation and pacing:

- `typingSpeed`: Adjust characters-per-second for typing animation
- `pauseOnPunctuation`: Add natural pauses after periods, commas, etc.
- `enableAnimations`: Toggle all animations on/off

## Theme Settings

Customize the visual appearance:

- `darkMode`: Set default theme (auto/dark/light)
- `accentColor`: Customize the primary accent color
- `fontFamily`: Change the default font
- `messageSpacing`: Adjust spacing between messages

## Behavior Settings

Fine-tune how Dialog behaves:

- `collapseHeaders`: Automatically collapse sections on page load
- `showTimestamps`: Display timestamps on messages
- `codeHighlighting`: Enable syntax highlighting in code blocks
- `autoScrollBehavior`: Control scrolling behavior during animations

## Accessing Settings

Dialog provides two ways to access and modify settings:

1. **UI Settings Panel**: Click the settings icon in the top-right corner of the interface to open the settings panel, where you can adjust settings through a user-friendly interface.

2. **Direct File Editing**: For more advanced customization, you can directly edit the `settings.json` file in the root directory of your Dialog installation.

## Example Configuration

Here's an example of the settings structure in `settings.json`:

```json
{
  "theme": {
    "darkMode": "auto",
    "accentColor": "#0078d7",
    "fontFamily": "Space Grotesk, system-ui, sans-serif"
  },
  "animation": {
    "enable": true,
    "typingSpeed": 70,
    "pauseOnPunctuation": true
  },
  "behavior": {
    "collapseHeaders": false,
    "showTimestamps": true,
    "codeHighlighting": true
  }
}
``` 