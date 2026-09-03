import { slackRichTextToMarkdown } from "./markdown";
import { findMessageContentElement, findMessageElements } from "./slack-dom";

function restoreSelectedAncestorContext(
  selectedFragment: DocumentFragment,
  selectedRange: Range,
  messageContent: Element,
): DocumentFragment {
  let selectedRoot: Node = selectedFragment;
  let ancestor =
    selectedRange.commonAncestorContainer instanceof Element
      ? selectedRange.commonAncestorContainer
      : selectedRange.commonAncestorContainer.parentElement;

  while (ancestor !== null && ancestor !== messageContent) {
    const ancestorClone = ancestor.cloneNode(false);
    ancestorClone.appendChild(selectedRoot);
    selectedRoot = ancestorClone;
    ancestor = ancestor.parentElement;
  }

  const contextualFragment = document.createDocumentFragment();
  contextualFragment.appendChild(selectedRoot);
  return contextualFragment;
}

export function selectedSlackMarkdown(
  targetMessage?: HTMLElement,
): string | null {
  const selection = window.getSelection();
  if (selection === null || selection.isCollapsed || selection.rangeCount === 0)
    return null;
  const range = selection.getRangeAt(0);
  const selectedMessageContents = findMessageElements(document).flatMap(
    (message) => {
      const content = findMessageContentElement(message);
      return content !== null && range.intersectsNode(content)
        ? [{ message, content }]
        : [];
    },
  );
  if (
    targetMessage !== undefined &&
    !selectedMessageContents.some(({ message }) => message === targetMessage)
  ) {
    return null;
  }

  const markdown = selectedMessageContents
    .flatMap(({ content }) => {
      const contentRange = document.createRange();
      contentRange.setStart(content, 0);
      contentRange.setEnd(content, content.childNodes.length);
      if (content.contains(range.startContainer)) {
        contentRange.setStart(range.startContainer, range.startOffset);
      }
      if (content.contains(range.endContainer)) {
        contentRange.setEnd(range.endContainer, range.endOffset);
      }
      const selectedFragment = restoreSelectedAncestorContext(
        contentRange.cloneContents(),
        contentRange,
        content,
      );
      const hasSelectedText = selectedFragment.textContent?.trim() !== "";
      const hasSelectedEmoji =
        selectedFragment.querySelector(
          'img[data-stringify-emoji], img[alt^=":"][alt$=":"]',
        ) !== null;
      if (!hasSelectedText && !hasSelectedEmoji) return [];

      const selectedContent = slackRichTextToMarkdown(selectedFragment);
      return selectedContent === "" ? [] : [selectedContent];
    })
    .join("\n\n");
  return markdown === "" ? null : markdown;
}
