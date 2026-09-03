import "./content.css";

import { formatSlackMessages } from "../format-message";
import { selectedSlackMarkdown } from "../selection";
import {
  extractSlackMessage,
  findMessageActions,
  findMessageElement,
  findMessageElements,
  findOpenThreadPane,
  findThreadHeader,
  SlackDomError,
  THREAD_PANE_SELECTOR,
} from "../slack-dom";

const MESSAGE_BUTTON_CLASS = "csm-copy-message-button";
const THREAD_BUTTON_CLASS = "csm-copy-thread-button";
const TOAST_CLASS = "csm-toast";
const IS_MACOS = navigator.platform.startsWith("Mac");

let hoveredMessage: HTMLElement | null = null;
let scanScheduled = false;
const pendingScanRoots = new Set<Element>();
let toastRemovalTimer: number | null = null;

function createMessageButton(): HTMLButtonElement {
  const button = document.createElement("button");
  button.type = "button";
  button.className = MESSAGE_BUTTON_CLASS;
  button.title = "Copy as Markdown";
  button.setAttribute("aria-label", "Copy as Markdown");
  button.dataset.csmIgnore = "true";
  button.textContent = "MD";
  return button;
}

function createThreadButton(): HTMLButtonElement {
  const button = document.createElement("button");
  button.type = "button";
  button.className = THREAD_BUTTON_CLASS;
  button.textContent = "Copy thread as Markdown";
  button.dataset.csmThreadButton = "true";
  button.dataset.csmIgnore = "true";
  return button;
}

function createToastRegion(kind: "success" | "error"): HTMLDivElement {
  const toast = document.createElement("div");
  toast.className = `${TOAST_CLASS} ${TOAST_CLASS}--${kind}`;
  toast.setAttribute("role", kind === "error" ? "alert" : "status");
  toast.setAttribute("aria-atomic", "true");
  toast.dataset.csmIgnore = "true";
  document.body.appendChild(toast);
  return toast;
}

const toastRegions = {
  success: createToastRegion("success"),
  error: createToastRegion("error"),
};

function injectMessageButton(message: HTMLElement): void {
  const actions = findMessageActions(message);
  if (actions === null) return;
  const existingButton = message.querySelector<HTMLButtonElement>(
    `.${MESSAGE_BUTTON_CLASS}`,
  );
  if (existingButton?.parentElement !== actions)
    actions.appendChild(existingButton ?? createMessageButton());
}

function injectMessageButtons(root: ParentNode): void {
  for (const message of findMessageElements(root)) injectMessageButton(message);
}

function injectThreadButton(pane: HTMLElement): void {
  const header = findThreadHeader(pane);
  if (header === null) return;
  const existingButton = pane.querySelector<HTMLButtonElement>(
    `.${THREAD_BUTTON_CLASS}`,
  );
  if (existingButton?.parentElement !== header)
    header.appendChild(existingButton ?? createThreadButton());
}

function injectThreadButtons(root: ParentNode): void {
  const panes =
    root instanceof Element && root.matches(THREAD_PANE_SELECTOR)
      ? [root as HTMLElement]
      : [...root.querySelectorAll<HTMLElement>(THREAD_PANE_SELECTOR)];

  for (const pane of panes) {
    injectThreadButton(pane);
  }
}

function scanPendingSlackUi(): void {
  scanScheduled = false;
  const scanRoots = [...pendingScanRoots];
  pendingScanRoots.clear();
  for (const root of scanRoots) {
    if (!root.isConnected) continue;
    const containingMessage = findMessageElement(root);
    if (containingMessage !== null) injectMessageButton(containingMessage);
    injectMessageButtons(root);
    const containingPane = root.closest<HTMLElement>(THREAD_PANE_SELECTOR);
    if (containingPane !== null) injectThreadButton(containingPane);
    injectThreadButtons(root);
  }
}

function scheduleScan(root: Element): void {
  pendingScanRoots.add(root);
  if (!scanScheduled) {
    scanScheduled = true;
    requestAnimationFrame(scanPendingSlackUi);
  }
}

function showToast(message: string, kind: "success" | "error"): void {
  if (toastRemovalTimer !== null) window.clearTimeout(toastRemovalTimer);
  toastRegions.success.textContent = "";
  toastRegions.error.textContent = "";
  toastRegions[kind].textContent = message;
  toastRemovalTimer = window.setTimeout(() => {
    toastRegions[kind].textContent = "";
    toastRemovalTimer = null;
  }, 2400);
}

function readableError(error: unknown): string {
  if (error instanceof SlackDomError) return error.message;
  if (error instanceof DOMException && error.name === "NotAllowedError") {
    return "Clipboard permission was denied.";
  }
  return "Could not copy as Markdown.";
}

async function writeMarkdown(
  markdown: string,
  successMessage = "Copied as Markdown",
): Promise<void> {
  await navigator.clipboard.writeText(markdown);
  showToast(successMessage, "success");
}

async function copySingleMessage(message: HTMLElement | null): Promise<void> {
  try {
    if (message === null)
      throw new SlackDomError("The selected Slack message was not found.");
    const selection = selectedSlackMarkdown(message);
    if (selection !== null) {
      await writeMarkdown(selection);
      return;
    }
    await writeMarkdown(formatSlackMessages([extractSlackMessage(message)]));
  } catch (error) {
    console.error("[Copy Slack as Markdown] Copy failed", error);
    showToast(readableError(error), "error");
  }
}

async function copyThreadMessages(
  messageElements: HTMLElement[],
): Promise<void> {
  try {
    if (messageElements.length === 0)
      throw new SlackDomError(
        "No visible messages were found in the open thread.",
      );

    const messages = messageElements.map(extractSlackMessage);
    await writeMarkdown(formatSlackMessages(messages));
  } catch (error) {
    console.error("[Copy Slack as Markdown] Thread copy failed", error);
    showToast(readableError(error), "error");
  }
}

async function copyFromShortcut(): Promise<void> {
  try {
    const selection = selectedSlackMarkdown();
    if (selection !== null) {
      await writeMarkdown(selection);
      return;
    }
    const activeMessage =
      document.activeElement instanceof Element
        ? findMessageElement(document.activeElement)
        : null;
    const message =
      hoveredMessage?.isConnected === true ? hoveredMessage : activeMessage;
    if (message === null || !message.isConnected) {
      throw new SlackDomError(
        "Hover or focus a Slack message before using Ctrl+Shift+C.",
      );
    }
    await writeMarkdown(formatSlackMessages([extractSlackMessage(message)]));
  } catch (error) {
    console.error("[Copy Slack as Markdown] Shortcut copy failed", error);
    showToast(readableError(error), "error");
  }
}

document.addEventListener("pointerover", (event) => {
  if (!(event.target instanceof Element)) return;
  hoveredMessage = findMessageElement(event.target);
  if (hoveredMessage !== null) scheduleScan(hoveredMessage);
});

document.addEventListener("pointerout", (event) => {
  if (hoveredMessage === null) return;
  if (
    !(event.relatedTarget instanceof Node) ||
    !hoveredMessage.contains(event.relatedTarget)
  )
    hoveredMessage = null;
});

document.addEventListener(
  "click",
  (event) => {
    if (!(event.target instanceof Element)) return;

    const messageButton = event.target.closest<HTMLButtonElement>(
      `.${MESSAGE_BUTTON_CLASS}`,
    );
    if (messageButton !== null) {
      if (!event.isTrusted) return;
      event.preventDefault();
      event.stopPropagation();
      const message = findMessageElement(messageButton);
      void copySingleMessage(message);
      return;
    }

    const threadButton = event.target.closest<HTMLButtonElement>(
      `.${THREAD_BUTTON_CLASS}`,
    );
    if (threadButton === null) return;
    if (!event.isTrusted) return;
    event.preventDefault();
    event.stopPropagation();
    const pane = threadButton.closest<HTMLElement>(THREAD_PANE_SELECTOR);
    void copyThreadMessages(pane === null ? [] : findMessageElements(pane));
  },
  true,
);

document.addEventListener("keydown", (event) => {
  if (!IS_MACOS) return;
  if (
    event.target instanceof Element &&
    event.target.closest(
      'input, textarea, [contenteditable]:not([contenteditable="false"]), [role="textbox"]',
    ) !== null
  )
    return;
  if (
    event.ctrlKey &&
    !event.altKey &&
    !event.metaKey &&
    event.shiftKey &&
    event.code === "KeyC"
  ) {
    if (!event.isTrusted) return;
    event.preventDefault();
    void copyFromShortcut();
  }
});

new MutationObserver((records) => {
  for (const record of records) {
    if (
      record.removedNodes.length > 0 &&
      record.target instanceof Element &&
      record.target.closest("[data-csm-ignore]") === null
    ) {
      scheduleScan(record.target);
    }
    for (const addedNode of record.addedNodes) {
      if (addedNode instanceof Element) {
        if (addedNode.matches("[data-csm-ignore]")) continue;
        scheduleScan(addedNode);
      } else if (record.target instanceof Element) {
        scheduleScan(record.target);
      }
    }
  }
}).observe(document.body, {
  childList: true,
  subtree: true,
});

injectMessageButtons(document);
injectThreadButtons(document);

const openThreadPane = findOpenThreadPane();
if (openThreadPane !== null) scheduleScan(openThreadPane);
