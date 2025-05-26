# Dialog

A platform for creating dialogical experiences that showcase the interplay between humans and AI. Dialog moves beyond traditional chat interfaces to create a thoughtful, speech-paced experience that encourages deeper engagement.

## Philosophy

Dialog was born from a desire to get away from the expected Android/iOS chat style and create something simple, vaguely retro, and highly customizable. The goal is to highlight the back-and-forth dialogue that takes place between user and agent—a critical aspect of prompt engineering that is often omitted in discussions about AI.

By presenting conversations as curated dialogues, Dialog allows you to polish interactions into experiences that encourage readers to follow at the speed of thought and speech, rather than engaging in what N. Katherine Hayles calls "hyper reading"—the rapid, scanning-based reading we've grown accustomed to online.

## Examples

See Dialog in action:
- [Machine Yearning](https://jared-mccoy.github.io/machine-yearning/index.html) - An example blog created with Dialog

## Purpose

Dialog allows you to:

- Create a dialogical blog from markdown conversation files
- Showcase the iterative nature of human-AI interaction
- Publish your conversations as a GitHub Pages site
- Customize the appearance and pacing to suit your aesthetic preferences
- Focus on the content of the dialogue rather than the interface

## Getting Started

### Quick Setup

1. Fork this repository
2. Enable GitHub Pages in your repository settings
3. Add your conversation files to the `content` directory
4. Your site will be available at `https://[your-username].github.io/[your-repository-name]/`

### Creating Conversations

Conversations are stored as Markdown files in date-formatted directories. Format your dialogues using speaker tags:

```markdown
<< USER >>
User's message goes here

<< AGENT >>
Agent's response goes here
```

## Structure

Dialog uses a structured approach to conversation rendering:

### Markdown Headings as Collapsible Sections

Markdown headings automatically create collapsible sections, allowing you to organize conversations into logical segments:

```markdown
# Main Topic

<< USER >>
First question about the main topic

<< AGENT >>
First response about the main topic

## Subtopic

<< USER >>
Question about the subtopic

<< AGENT >>
Response about the subtopic
```

### Content Types

Dialog supports different content types within your conversations:

1. **Chat Elements** - Standard exchange between speakers using `<< SPEAKER >>` tags
2. **Plain Text** - Empty speaker tags `<<>>` can be used for narrative or contextual text

Example of plain text with empty tags:

```markdown
## Scene 1

<<>>
Enter [from separate directions] [[Bernardo]] and [[Francisco]], two sentinels

<<BERNARDO>>
Who's there?
```

### Message Layout

By default, user messages align to the right and agent messages to the left. Dialog supports custom positioning with layout tags to create more dynamic conversations.

For details on message positioning options, see the [Message Positioning documentation](docs/message-positioning.md).

## Icons

### Default Speaker Icons

Dialog maps icons to the two primary speaker types:

- `<< USER >>` - Default user icon
- `<< AGENT >>` - Default agent icon

### Custom Speaker Icons

You can define custom speakers with their own styling:

```markdown
<<BERNARDO>>
Who's there?

<<FRANCISCO>>
Nay, answer me. Stand and unfold yourself.
```

## Tagging

Dialog supports two simple tagging systems:

### Backtick Tags

Use backtick tags for technical terms and code elements:

```markdown
<< USER >>
How can I use `async/await` in JavaScript?

<< AGENT >>
The `async/await` syntax makes asynchronous code easier to write.
```

### Wiki Links

Use double-bracket wiki links for concepts and themes:

```markdown
<< USER >>
How does [[reinforcement learning]] work?

<< AGENT >>
[[Reinforcement learning]] is based on reward mechanisms.
```

## Directory

Dialog automatically generates a directory view of your conversations:

- Conversations are organized by date
- Each conversation shows its title and key tags
- Tags from backticks and wiki links are accumulated and displayed
- This provides a quick synopsis of each conversation's content
- Users can browse conversations by concept rather than just chronologically

The directory.js script extracts all backtick tags and wiki links from your markdown files to create this overview, making it easy to see what topics are covered in each conversation.

## Settings

Dialog offers numerous settings to customize your experience, including animation speeds, theme preferences, and behavior options.

For a detailed explanation of available settings, see the [Settings documentation](docs/settings.md).

## Advanced Topics

For more detailed collaboration options:

- [Collaboration Workflow](docs/collaboration.md) - Using the sync script to manage Dialog across repositories

## Philosophy & Further Reading

Dialog is inspired by dialogical traditions in philosophy and literature, as well as modern theories about how we read and process information in digital environments. For more on these topics:

- N. Katherine Hayles on [hyper reading vs. deep attention](https://www.jstor.org/stable/10.1086/660376)
- The role of dialogue in [philosophical traditions](https://plato.stanford.edu/entries/dialogue/)
- [Prompt engineering as conversation](https://arxiv.org/abs/2302.11382)

## License

MIT  