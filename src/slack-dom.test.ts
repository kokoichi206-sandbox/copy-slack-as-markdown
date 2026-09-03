import { beforeEach, describe, expect, it } from "vitest";

import {
  extractSlackMessage,
  findMessageElements,
  findMessageActions,
  findOpenThreadPane,
  findThreadHeader,
  MESSAGE_ACTIONS_SELECTOR,
  SlackDomError,
} from "./slack-dom";

beforeEach(() => {
  document.body.innerHTML = "";
});

describe("Slack DOM adapter", () => {
  it("表示中メッセージから発言者・日時・本文・添付を読む", () => {
    document.body.innerHTML = `
      <div data-qa="message_container" data-ts="1788332520.000000">
        <div data-qa="message_content">
          <button data-qa="message_sender_name">alice</button>
          <a data-qa="message_timestamp"><time datetime="2026-09-02T14:02:00+09:00">14:02</time></a>
          <div data-qa="message-text"><div class="p-rich_text_block"><div class="p-rich_text_section">Question <strong>here</strong></div></div></div>
          <div><a href="https://files.slack.com/report.pdf"><span data-qa="file_name">report.pdf</span></a></div>
        </div>
      </div>`;

    const element = document.querySelector<HTMLElement>(
      '[data-qa="message_container"]',
    );
    if (element === null) throw new Error("fixture is invalid");
    const message = extractSlackMessage(element);

    expect(message.author).toBe("alice");
    expect(message.displayedTime).toBe("14:02");
    expect(message.timestamp?.toISOString()).toBe("2026-09-02T05:02:00.000Z");
    expect(message.body).toBe("Question **here**");
    expect(message.attachments).toEqual([
      { name: "report.pdf", url: "https://files.slack.com/report.pdf" },
    ]);
  });

  it("スレッド内の親と返信を DOM 順で一度ずつ返す", () => {
    document.body.innerHTML = `
      <aside data-qa="threads_flexpane">
        <div class="c-virtual_list__item" data-item-key="message-1">
          <div data-qa="message_container"><span data-qa="message_sender_name">alice</span></div>
        </div>
        <div class="c-virtual_list__item" data-item-key="message-2">
          <div data-qa="message_container"><span data-qa="message_sender_name">bob</span></div>
        </div>
      </aside>`;

    const pane = findOpenThreadPane();
    expect(pane).not.toBeNull();
    expect(findMessageElements(pane as HTMLElement)).toHaveLength(2);
    expect(
      findMessageElements(pane as HTMLElement).map((message) =>
        message
          .closest<HTMLElement>("[data-item-key]")
          ?.getAttribute("data-item-key"),
      ),
    ).toEqual(["message-1", "message-2"]);
  });

  it("現行 Slack のメッセージ操作列を検出できる", () => {
    document.body.innerHTML = `
      <div data-qa="message_container">
        <div data-qa="message-actions" class="c-message_actions__group"></div>
      </div>`;

    expect(document.querySelectorAll(MESSAGE_ACTIONS_SELECTOR)).toHaveLength(1);
    expect(
      findMessageActions(
        document.querySelector('[data-qa="message_container"]') as HTMLElement,
      )?.className,
    ).toBe("c-message_actions__group");
  });

  it("連続返信の adjacent 表示では直前の投稿者を使う", () => {
    document.body.innerHTML = `
      <aside data-qa="threads_flexpane">
        <div data-qa="message_container">
          <span data-qa="message_sender_name">bob</span>
          <a class="c-timestamp" data-ts="1788325200.000000">14:00</a>
          <div data-qa="message-text">first reply</div>
        </div>
        <div data-qa="message_container" data-msg-ts="1788325260.000000">
          <div data-qa="thread_compact_gutter" class="p-thread_compact_gutter_generic p-thread_compact_gutter_generic--adjacent"></div>
          <a class="c-timestamp">14:01</a>
          <div data-qa="message-text">second reply</div>
        </div>
      </aside>`;

    const messages = findMessageElements(findOpenThreadPane() as HTMLElement);
    const compactReply = extractSlackMessage(messages[1]);
    expect(compactReply.author).toBe("bob");
    expect(compactReply.timestamp?.toISOString()).toBe(
      "2026-09-02T05:01:00.000Z",
    );
  });

  it("チャンネルの compact 表示では直前の投稿者を使う", () => {
    document.body.innerHTML = `
      <div data-qa="slack_kit_list">
        <div data-qa="message_container">
          <span data-qa="message_sender_name">alice</span>
          <a class="c-timestamp" data-ts="1788325200.000000">14:00</a>
          <div data-qa="message-text">first message</div>
        </div>
        <div data-qa="message_container" data-msg-ts="1788325260.000000">
          <span class="p-message_pane_message__compact_timestamp--adjacent"></span>
          <a class="c-timestamp">14:01</a>
          <div data-qa="message-text">second message</div>
        </div>
      </div>`;

    const messages = findMessageElements(document);
    expect(extractSlackMessage(messages[1]).author).toBe("alice");
  });

  it("複数種類の操作列候補があるときは専用コンテナを選ぶ", () => {
    document.body.innerHTML = `
      <div data-qa="message_container">
        <div class="c-message_kit__actions">
          <div class="c-message_actions__container"></div>
        </div>
      </div>`;

    const message = document.querySelector(
      '[data-qa="message_container"]',
    ) as HTMLElement;
    expect(findMessageActions(message)?.className).toBe(
      "c-message_actions__container",
    );
  });

  it("本文を含む c-message_kit__actions は操作列として扱わない", () => {
    document.body.innerHTML = `
      <div data-qa="message_container">
        <div class="c-message_kit__actions">
          <div data-qa="message-text">message body</div>
        </div>
      </div>`;

    const message = document.querySelector(
      '[data-qa="message_container"]',
    ) as HTMLElement;
    expect(findMessageActions(message)).toBeNull();
  });

  it("添付だけの message_content を含む kit は操作列として扱わない", () => {
    document.body.innerHTML = `
      <div data-qa="message_container">
        <div class="c-message_kit__actions">
          <div data-qa="message_content">
            <a href="https://files.slack.com/report.pdf"><span data-qa="file_name">report.pdf</span></a>
          </div>
        </div>
      </div>`;

    const message = document.querySelector(
      '[data-qa="message_container"]',
    ) as HTMLElement;
    expect(findMessageActions(message)).toBeNull();
  });

  it("必須要素を読めないときは DOM 変更を明示する", () => {
    const element = document.createElement("div");
    element.setAttribute("data-qa", "message_container");
    expect(() => extractSlackMessage(element)).toThrow(SlackDomError);
    expect(() => extractSlackMessage(element)).toThrow(
      "Slack's DOM may have changed",
    );
  });

  it("添付だけのメッセージで投稿者と時刻を本文へ混ぜない", () => {
    document.body.innerHTML = `
      <div data-qa="message_container">
        <div data-qa="message_content">
          <button data-qa="message_sender_name">alice</button>
          <a class="c-timestamp" data-ts="1788325320.000000">14:02</a>
          <a href="https://files.slack.com/report.pdf"><span data-qa="file_name">report.pdf</span></a>
        </div>
      </div>`;

    const message = extractSlackMessage(
      document.querySelector('[data-qa="message_container"]') as HTMLElement,
    );
    expect(message.body).toBe("");
    expect(message.attachments).toEqual([
      { name: "report.pdf", url: "https://files.slack.com/report.pdf" },
    ]);
  });

  it("入れ子の候補は message_container をメッセージ本体として一度だけ返す", () => {
    document.body.innerHTML = `
      <div class="c-virtual_list__item" data-item-key="message-1">
        <div data-qa="message_container">
          <div data-qa="message">body</div>
        </div>
      </div>`;

    const messages = findMessageElements(document);
    expect(messages).toHaveLength(1);
    expect(messages[0].getAttribute("data-qa")).toBe("message_container");
  });

  it("ファイル名と無関係な同一 div 内のリンクを添付 URL にしない", () => {
    document.body.innerHTML = `
      <div data-qa="message_container">
        <span data-qa="message_sender_name">alice</span>
        <div>
          <a class="c-timestamp">14:02</a>
          <span data-qa="file_name">report.pdf</span>
        </div>
      </div>`;

    const message = extractSlackMessage(
      document.querySelector('[data-qa="message_container"]') as HTMLElement,
    );
    expect(message.attachments).toEqual([{ name: "report.pdf", url: null }]);
  });

  it("明示的に非表示のスレッドヘッダを注入先にしない", () => {
    document.body.innerHTML = `
      <aside data-qa="threads_flexpane">
        <header class="p-flexpane_header" hidden>old</header>
        <header class="p-flexpane_header" id="visible-header">current</header>
      </aside>`;

    const pane = findOpenThreadPane();
    if (pane === null) throw new Error("thread fixture is invalid");
    expect(findThreadHeader(pane)?.id).toBe("visible-header");
  });
});
