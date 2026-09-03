import { beforeEach, describe, expect, it } from "vitest";

import { selectedSlackMarkdown } from "./selection";

beforeEach(() => {
  window.getSelection()?.removeAllRanges();
  document.body.innerHTML = `
    <div data-qa="message_container" id="first-message">
      <div data-qa="message-text"><div class="p-rich_text_section">First <strong>message</strong></div></div>
    </div>
    <div data-qa="message_container" id="second-message">
      <div data-qa="message-text"><ul><li>Second item</li></ul></div>
    </div>`;
});

function selectContents(selector: string): void {
  const element = document.querySelector(selector);
  if (element === null) throw new Error("selection fixture is invalid");
  const range = document.createRange();
  range.selectNodeContents(element);
  const selection = window.getSelection();
  selection?.removeAllRanges();
  selection?.addRange(range);
}

describe("selectedSlackMarkdown", () => {
  it("選択範囲の祖先にある Markdown 構造を保つ", () => {
    selectContents("#second-message li");
    expect(selectedSlackMarkdown()).toBe("- Second item");
  });

  it("対象メッセージ外の選択は使わない", () => {
    selectContents("#first-message .p-rich_text_section");
    const secondMessage =
      document.querySelector<HTMLElement>("#second-message");
    if (secondMessage === null) throw new Error("selection fixture is invalid");
    expect(selectedSlackMarkdown(secondMessage)).toBeNull();
  });

  it("選択がないときは null を返す", () => {
    expect(selectedSlackMarkdown()).toBeNull();
  });
});
