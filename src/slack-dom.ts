import { slackRichTextToMarkdown } from "./markdown";

const MESSAGE_CONTAINER_SELECTOR = '[data-qa="message_container"]';
const MESSAGE_FALLBACK_SELECTOR = '[data-qa="message"]';
const VIRTUAL_MESSAGE_SELECTOR =
  '.c-virtual_list__item[data-item-key^="message"]';

export const MESSAGE_SELECTOR = [
  MESSAGE_CONTAINER_SELECTOR,
  MESSAGE_FALLBACK_SELECTOR,
  VIRTUAL_MESSAGE_SELECTOR,
].join(",");

const MESSAGE_ACTIONS_SELECTORS = [
  '[data-qa="message_actions"]',
  '[data-qa="message-actions"]',
  ".c-message_actions__group",
  ".c-message_actions__container",
  ".c-message_actions",
];

export const MESSAGE_ACTIONS_SELECTOR = MESSAGE_ACTIONS_SELECTORS.join(",");

export const THREAD_PANE_SELECTOR = [
  '[data-qa="threads_flexpane"]',
  '[data-qa="thread_view"]',
  '[data-qa="thread-pane"]',
].join(",");

const THREAD_HEADER_SELECTORS = [
  '[data-qa="thread_header"]',
  '[data-qa="flexpane_header"]',
  ".p-flexpane_header__control",
  ".p-flexpane_header",
];

export const THREAD_HEADER_SELECTOR = THREAD_HEADER_SELECTORS.join(",");

const AUTHOR_SELECTORS = [
  '[data-qa="message_sender_name"]',
  '[data-qa="message_sender"]',
  ".c-message__sender_link",
  '[data-message-sender-name="true"]',
];

const CONTENT_SELECTORS = [
  '[data-qa="message-text"]',
  '[data-qa="message_content"] .p-rich_text_block',
  '[data-qa="message_content"] .p-rich_text_section',
  ".c-message__body",
];

const TIMESTAMP_SELECTORS = [
  "time[datetime]",
  '[data-qa="message_timestamp"]',
  ".c-timestamp",
];

const ATTACHMENT_TITLE_SELECTOR = [
  '[data-qa="file_name"]',
  ".c-file__title",
].join(",");

const COMPACT_MESSAGE_INDICATOR_SELECTOR = [
  '[data-qa="thread_compact_gutter"].p-thread_compact_gutter_generic--adjacent',
  ".p-message_pane_message__compact_timestamp--adjacent",
].join(",");

export interface SlackAttachment {
  name: string;
  url: string | null;
}

export interface SlackMessage {
  author: string;
  body: string;
  timestamp: Date | null;
  displayedTime: string;
  attachments: SlackAttachment[];
}

export class SlackDomError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SlackDomError";
  }
}

function elementText(element: Element | null): string {
  return element?.textContent?.trim() ?? "";
}

function queryFirstByPriority(
  root: ParentNode,
  selectors: string[],
): Element | null {
  for (const selector of selectors) {
    const element = root.querySelector(selector);
    if (element !== null) return element;
  }
  return null;
}

function timestampFromElement(
  message: Element,
  timestampElement: Element | null,
): Date | null {
  const timeElement =
    timestampElement instanceof HTMLTimeElement
      ? timestampElement
      : (timestampElement?.querySelector("time") ?? null);
  if (timeElement instanceof HTMLTimeElement && timeElement.dateTime !== "") {
    const parsed = new Date(timeElement.dateTime);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }

  const unixTimestamp =
    timestampElement?.getAttribute("data-ts") ??
    message.getAttribute("data-ts") ??
    message.getAttribute("data-msg-ts");
  if (unixTimestamp !== null && /^\d+(?:\.\d+)?$/.test(unixTimestamp)) {
    return new Date(Number(unixTimestamp) * 1000);
  }
  return null;
}

function findAttachments(message: Element): SlackAttachment[] {
  const attachments: SlackAttachment[] = [];
  const seen = new Set<string>();
  for (const title of message.querySelectorAll(ATTACHMENT_TITLE_SELECTOR)) {
    const name = elementText(title);
    if (name === "") continue;
    const link = title.closest("a") ?? title.querySelector("a");
    const url = link instanceof HTMLAnchorElement ? link.href : null;
    const key = `${name}\n${url ?? ""}`;
    if (seen.has(key)) continue;
    seen.add(key);
    attachments.push({ name, url });
  }
  return attachments;
}

export function findMessageElement(from: Element): HTMLElement | null {
  return (
    from.closest<HTMLElement>(MESSAGE_CONTAINER_SELECTOR) ??
    from.closest<HTMLElement>(MESSAGE_FALLBACK_SELECTOR) ??
    from.closest<HTMLElement>(VIRTUAL_MESSAGE_SELECTOR)
  );
}

export function findMessageContentElement(message: Element): Element | null {
  return queryFirstByPriority(message, CONTENT_SELECTORS);
}

export function findMessageActions(message: HTMLElement): HTMLElement | null {
  for (const selector of MESSAGE_ACTIONS_SELECTORS) {
    const candidate = message.querySelector<HTMLElement>(selector);
    if (candidate !== null) return candidate;
  }
  return null;
}

export function findMessageElements(root: ParentNode): HTMLElement[] {
  const candidates = [
    ...(root instanceof HTMLElement && root.matches(MESSAGE_SELECTOR)
      ? [root]
      : []),
    ...root.querySelectorAll<HTMLElement>(MESSAGE_SELECTOR),
  ];
  return [
    ...new Set(
      candidates.map(
        (candidate) =>
          (candidate.matches(MESSAGE_CONTAINER_SELECTOR)
            ? candidate
            : candidate.closest<HTMLElement>(MESSAGE_CONTAINER_SELECTOR)) ??
          candidate.querySelector<HTMLElement>(MESSAGE_CONTAINER_SELECTOR) ??
          (candidate.matches(MESSAGE_FALLBACK_SELECTOR)
            ? candidate
            : candidate.closest<HTMLElement>(MESSAGE_FALLBACK_SELECTOR)) ??
          candidate.querySelector<HTMLElement>(MESSAGE_FALLBACK_SELECTOR) ??
          candidate,
      ),
    ),
  ];
}

function directAuthor(message: Element): string {
  return elementText(queryFirstByPriority(message, AUTHOR_SELECTORS));
}

function authorFromAdjacentCompactMessage(message: HTMLElement): string {
  const isAdjacentCompactMessage =
    message.querySelector(COMPACT_MESSAGE_INDICATOR_SELECTOR) !== null;
  if (!isAdjacentCompactMessage) return "";

  const scope =
    message.closest(THREAD_PANE_SELECTOR) ??
    message.closest('[data-qa="threads_view"]') ??
    message.closest('[data-qa="slack_kit_list"]') ??
    message.closest(".c-virtual_list__scroll_container");
  if (scope === null) return "";

  const messages = findMessageElements(scope);
  const currentIndex = messages.findIndex(
    (candidate) => candidate === message || candidate.contains(message),
  );
  for (let index = currentIndex - 1; index >= 0; index -= 1) {
    const author = directAuthor(messages[index]);
    if (author !== "") return author;
  }
  return "";
}

export function extractSlackMessage(message: HTMLElement): SlackMessage {
  const author =
    directAuthor(message) || authorFromAdjacentCompactMessage(message);
  const content = findMessageContentElement(message);
  const timestampElement = queryFirstByPriority(message, TIMESTAMP_SELECTORS);
  const displayedTime = elementText(timestampElement);

  if (author === "") {
    if (message.querySelector(COMPACT_MESSAGE_INDICATOR_SELECTOR) !== null) {
      throw new SlackDomError(
        "The message author is outside the visible Slack range. Scroll until the preceding message is visible.",
      );
    }
    throw new SlackDomError(
      "The message author could not be read. Slack's DOM may have changed.",
    );
  }
  const attachments = findAttachments(message);
  if (content === null && attachments.length === 0) {
    throw new SlackDomError(
      "The message body could not be read. Slack's DOM may have changed.",
    );
  }
  if (displayedTime === "") {
    throw new SlackDomError(
      "The message time could not be read. Slack's DOM may have changed.",
    );
  }

  const body = content === null ? "" : slackRichTextToMarkdown(content);
  if (body === "" && attachments.length === 0) {
    throw new SlackDomError("The message is empty or not supported.");
  }

  return {
    author,
    body,
    timestamp: timestampFromElement(message, timestampElement),
    displayedTime,
    attachments,
  };
}

export function findOpenThreadPane(
  root: ParentNode = document,
): HTMLElement | null {
  return root.querySelector<HTMLElement>(THREAD_PANE_SELECTOR);
}

export function findThreadHeader(pane: HTMLElement): HTMLElement | null {
  const header = queryFirstByPriority(pane, THREAD_HEADER_SELECTORS);
  return header instanceof HTMLElement ? header : null;
}
