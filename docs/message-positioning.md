# Message Positioning in Dialog

Dialog offers flexible message positioning to create natural conversation flows and visual interest in your dialogues.

## Default Positioning

By default, messages are positioned as follows:

- `<< USER >>` messages are aligned to the right
- `<< ASSISTANT >>` and other speakers are aligned to the left

This creates a chat-like experience where your user's messages appear on one side and responses on the other.

## Layout Tags

You can override the default positioning using layout tags within the speaker declaration:

```markdown
<< SPEAKER {POSITION} >>
```

Where `POSITION` can be:

- `{L}` - Left align
- `{R}` - Right align
- `{L.XX}` - Left align with XX% offset from left (e.g., L.25, L.4, L.75)
- `{R.XX}` - Right align with XX% offset from right (e.g., R.25, R.4, R.75)

## Examples

### Basic Alignment

```markdown
<< USER {L} >>
This user message will align to the left instead of the default right

<< ASSISTANT {R} >>
This assistant message will align to the right instead of the default left
```

### Offset Positioning

```markdown
<< USER {L.25} >>
This message will be offset 25% from the left side

<< ASSISTANT {R.4} >>
This message will be offset 40% from the right side
```

### Multiple Speakers

```markdown
<< ALICE {L} >>
Alice's message on the left

<< BOB {R} >>
Bob's message on the right

<< CHARLIE {L.50} >>
Charlie's message centered
```

## Persistence

The layout setting applies to all subsequent messages from the same speaker until a new layout tag is specified. This allows you to set a position once and maintain consistency:

```markdown
<< USER {L} >>
This message is left-aligned.

<< USER >>
This message is also left-aligned because the previous setting persists.

<< USER {R} >>
Now we've switched back to right alignment.
```

## Strategic Use

Consider these approaches for effective message positioning:

- Use default positioning for standard back-and-forth dialogues
- Use custom positioning to show multiple participants in a conversation
- Use offsets to create visual hierarchy or emphasis
- Use centered positioning (e.g., `{L.50}`) for narration or important statements 