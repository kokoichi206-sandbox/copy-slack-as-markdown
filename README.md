# Copy Slack as Markdown

<div align="right">

English | [日本語](./README.ja.md)

</div>

A Chrome extension that converts visible Slack Web messages and threads to Markdown and copies them to your clipboard. It does not use the Slack API or OAuth.

## Installation

```sh
pnpm install
pnpm build
```

Open `chrome://extensions`, enable **Developer mode**, click **Load unpacked**, and select the `dist` directory in this repository.

Chrome 120 or later is required.

## Usage

- Hover over a message and click the `MD` button labeled **Copy as Markdown** in its action bar. If you select part of that message first, only the selected range is copied.
- Click **Copy thread as Markdown** at the top of an open thread panel to copy its currently loaded parent message and replies.
- On macOS, press `Ctrl+Shift+C` to copy selected Slack message text. Without a selection, the hovered or focused message is copied. `Shift+Command+C` and `Ctrl+Shift+C` on Windows and Linux conflict with Chrome DevTools, so use the `MD` button on those platforms.
- The shortcut is disabled while typing in a Slack input field.

The clipboard output is plain-text Markdown:

```md
**alice** · 14:02
Question

**bob** · 14:05
Reply

- List item
- `code`
```

The conversion preserves bold, italic, strikethrough, inline code, code blocks, links, lists, quotes, emoji, displayed mention names, and attachment filenames. Messages from threads spanning multiple dates use `YYYY-MM-DD HH:mm` timestamps.

## Scope

- Runs only on `https://app.slack.com/*`.
- Reads only the DOM currently loaded in the open page. It does not automatically load unseen replies.
- Does not support Slack Desktop, mobile apps, or full-workspace exports.
- Does not download attachment contents.
- Slack DOM changes may break extraction. Copy failures are reported through an on-screen toast and the browser console.

## Permissions and privacy

The `clipboardWrite` permission is used only when you activate the `MD` button or shortcut. The content script is limited to `https://app.slack.com/*`, with no additional host permissions.

The extension does not send data to external servers, collect analytics, or log message contents. All conversion runs locally in the browser.

## Development

```sh
pnpm exec playwright install chromium
pnpm dev          # Watch for changes and rebuild dist
pnpm check        # Run lint, formatting, unit tests, and build
pnpm e2e          # Load dist in Chromium and run fixture E2E checks
```

Slack message lookup and extraction live in `src/slack-dom.ts`, rich-text conversion in `src/markdown.ts`, and selected-range handling in `src/selection.ts`. When adapting to Slack DOM changes, update the relevant module and its fixture together.

## License

[MIT](./LICENSE)
