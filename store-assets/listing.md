# Chrome Web Store listing

## Name

Copy Slack as Markdown

## Summary

Copy visible Slack Web messages and threads as clean Markdown.

## Detailed description

Copy Slack as Markdown adds a small MD button to message actions in Slack Web. Use it to copy a single message, a selected portion of a message, or the currently loaded messages in an open thread as plain-text Markdown.

The conversion preserves common Slack formatting, including bold, italic, strikethrough, inline code, code blocks, links, lists, quotes, emoji, displayed mention names, and attachment filenames.

Features:

- Copy an individual message from its action bar
- Copy only the selected part of a message
- Copy the visible parent message and replies from an open thread panel
- Use Ctrl+Shift+C on macOS for selected, hovered, or focused message text
- See a confirmation or error message after each copy action

Privacy:

- All conversion happens locally in the browser
- No Slack API or OAuth
- No external requests, analytics, tracking, or message logging
- Runs only on app.slack.com

The extension reads only content already loaded in the current Slack Web page. It does not load unseen replies, export entire channels, download attachments, or support the Slack desktop or mobile apps.

Chrome 120 or later is required.

## Category

Productivity

## Language

English

## Single purpose

Convert user-selected, currently visible Slack Web messages and open threads into Markdown and copy the result to the clipboard.

## Permission justification

`clipboardWrite`: Required to place the generated Markdown on the clipboard after the user explicitly clicks a copy button or invokes the keyboard shortcut.

Site access to `https://app.slack.com/*`: Required to add the copy controls and read only the Slack messages currently visible on the page for the user-requested conversion.

## Data handling declaration

The extension handles website content and personal communications locally in the browser only when the user explicitly requests a copy operation. It does not collect, retain, transmit, sell, or share user data.

## Privacy policy URL

https://github.com/kokoichi206-sandbox/copy-slack-as-markdown/blob/main/PRIVACY.md

## Support URL

https://github.com/kokoichi206-sandbox/copy-slack-as-markdown/issues

## Homepage URL

https://github.com/kokoichi206-sandbox/copy-slack-as-markdown
