# Custom Icons in Dialog

Dialog allows for visual representation of different speakers in your conversations through icons.

## Speaker Icons

Each speaker in a conversation can have an associated icon that helps visually identify who is speaking. By default, Dialog distinguishes between different speaker types such as users and assistants.

## Implementation Note

This documentation is a placeholder for the icon customization feature. The specific implementation details should be verified against the actual codebase and updated accordingly.

## Potential Customization Approaches

There are several common approaches to customizing speaker icons in chat interfaces:

### Configuration File

Many chat interfaces allow icon customization through a configuration file:

```
# Example configuration (format will depend on actual implementation)
icons:
  user: path/to/user-icon.svg
  assistant: path/to/assistant-icon.svg
  custom_speaker: path/to/custom-icon.svg
```

### CSS-Based Customization

Another approach is using CSS selectors to assign icons:

```css
.speaker-icon[data-speaker="USER"] {
  background-image: url('path/to/user-icon.svg');
}

.speaker-icon[data-speaker="CUSTOM_NAME"] {
  background-image: url('path/to/custom-icon.svg');
}
```

### Best Practices for Icon Design

Regardless of the implementation method, these icon design principles apply:

- Keep icons simple and recognizable at small sizes (typically 24×24px)
- Maintain consistent visual style across all icons
- Ensure sufficient contrast with background colors
- Consider using different colors or shapes to help distinguish between speakers
- Use SVG format for best scaling across different screen sizes and resolutions

## Further Development

This documentation will be updated with specific implementation details as they are finalized. In the meantime, you can experiment with custom styling through CSS to achieve some customization of the speaker icons. 