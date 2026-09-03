import {
  escapeMarkdownInline,
  escapeMarkdownLinkLabel,
  safeMarkdownLinkUrl,
} from "./markdown";
import type { SlackMessage } from "./slack-dom";

function pad(number: number): string {
  return number.toString().padStart(2, "0");
}

function localDate(timestamp: Date): string {
  return `${timestamp.getFullYear()}-${pad(timestamp.getMonth() + 1)}-${pad(timestamp.getDate())}`;
}

function attachmentMarkdown(message: SlackMessage): string {
  return message.attachments
    .map((attachment) => {
      const safeUrl =
        attachment.url === null ? null : safeMarkdownLinkUrl(attachment.url);
      return safeUrl === null
        ? `📎 ${escapeMarkdownInline(attachment.name)}`
        : `📎 [${escapeMarkdownLinkLabel(attachment.name)}](${safeUrl})`;
    })
    .join("\n");
}

function timestampLabel(message: SlackMessage, includeDate: boolean): string {
  if (message.timestamp === null) return message.displayedTime;
  return includeDate
    ? `${localDate(message.timestamp)} ${message.displayedTime}`
    : message.displayedTime;
}

export function formatSlackMessages(messages: SlackMessage[]): string {
  const dates = new Set(
    messages.flatMap((message) =>
      message.timestamp === null ? [] : [localDate(message.timestamp)],
    ),
  );
  const includeDate = dates.size > 1;

  return messages
    .map((message) => {
      const parts = [message.body, attachmentMarkdown(message)].filter(
        (part) => part !== "",
      );
      return `**${escapeMarkdownInline(message.author)}** · ${timestampLabel(message, includeDate)}\n${parts.join("\n")}`;
    })
    .join("\n\n");
}
