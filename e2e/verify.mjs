import { chromium } from "playwright";
import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const extensionPath = resolve("dist");
const fixtureUrl = "https://app.slack.com/client/test/thread";
const failures = [];
const manifest = JSON.parse(
  readFileSync(resolve(extensionPath, "manifest.json"), "utf8"),
);

const recordAssertion = (name, passed, detail = "") => {
  console.log(
    `${passed ? "PASS" : "FAIL"}: ${name}${detail === "" ? "" : ` (${detail})`}`,
  );
  if (!passed) failures.push(name);
};

const fixture = `<!doctype html>
<html>
  <body>
    <main>
      <div data-qa="message_container" data-ts="1788318120.000000">
        <div data-qa="message_content">
          <button data-qa="message_sender_name">outside</button>
          <a class="c-timestamp" data-ts="1788318120.000000">12:02</a>
          <div data-qa="message-text"><div class="p-rich_text_block"><div class="p-rich_text_section"><img alt=":rotating_light:" data-stringify-type="emoji" data-stringify-emoji=":rotating_light:"> [Mac-mini] pipeline healthcheck 異常<br aria-hidden="true">&nbsp;• companies-edinet の最新実行が失敗<br aria-hidden="true">&nbsp;• joboffers-ambi の最新実行が失敗<br aria-hidden="true">確認: <a href="http://localhost:8090">dkron UI</a> / log ~/Library/Logs/shodan-pro/</div></div></div>
        </div>
        <div class="c-message_kit__actions"><div class="c-message_actions__container" onclick="event.stopPropagation()"></div></div>
      </div>
      <textarea aria-label="Message composer"></textarea>
      <div contenteditable="plaintext-only" role="textbox" aria-label="Rich message composer"></div>
      <div data-qa="message_container" data-msg-ts="1788318180.000000" id="lazy-actions-message">
        <div class="c-message_kit__actions">
          <button data-qa="message_sender_name">later</button>
          <a class="c-timestamp">12:03</a>
          <div data-qa="message-text"><div class="p-rich_text_block"><div class="p-rich_text_section">Lazy actions</div></div></div>
          </div>
      </div>
      <div data-qa="message_container" data-msg-ts="1788318240.000000" id="code-message">
        <div data-qa="message_content">
          <button data-qa="message_sender_name">coder</button>
          <a class="c-timestamp">12:04</a>
          <div data-qa="message-text"><div class="p-rich_text_block"><div class="p-rich_text_section">Code intro</div><ul><li>alpha</li><li>beta</li></ul><pre class="p-rich_text_preformatted">const a = x * y;
const b = _z_;
return a;</pre><div class="p-rich_text_section">Code tail</div></div></div>
        </div>
        <div class="c-message_actions__container" onclick="event.stopPropagation()"></div>
      </div>
      <div data-qa="message_container" data-msg-ts="1788318270.000000" id="replaced-actions-message">
        <div data-qa="message_content">
          <button data-qa="message_sender_name">rerendered</button>
          <a class="c-timestamp">12:04</a>
          <div data-qa="message-text"><div class="p-rich_text_block"><div class="p-rich_text_section">Replaced actions</div></div></div>
        </div>
        <div class="c-message_actions__container" onclick="event.stopPropagation()"></div>
      </div>
      <div data-qa="message_container" data-msg-ts="1788318300.000000" id="quote-message">
        <div data-qa="message_content">
          <button data-qa="message_sender_name">quoter</button>
          <a class="c-timestamp">12:05</a>
          <div data-qa="message-text"><div class="p-rich_text_block"><div class="p-rich_text_section">Quote intro</div><blockquote class="p-rich_text_quote"><div class="p-rich_text_section">first quoted</div><div class="p-rich_text_section">second quoted</div></blockquote><div class="p-rich_text_section">Quote tail</div></div></div>
        </div>
        <div class="c-message_actions__container" onclick="event.stopPropagation()"></div>
      </div>
      <div id="blank-area">blank area</div>
    </main>
    <div data-item-key="message-unreadable" id="unreadable-message">
      <div data-qa="message_container">
        <a class="c-timestamp" data-ts="1788325100.000000">13:58</a>
        <div data-qa="message-text"><div class="p-rich_text_block"><div class="p-rich_text_section">Unreadable author</div></div></div>
        <div class="c-message_actions__container" onclick="event.stopPropagation()"></div>
      </div>
    </div>
    <aside data-qa="threads_flexpane">
      <header class="p-flexpane_header" hidden><strong>Old thread header</strong></header>
      <header data-qa="thread_header"><strong>Thread</strong></header>
      <div class="c-virtual_list__item" data-item-key="message-parent">
        <div data-qa="message_container" data-msg-ts="1788325320.000000">
          <div data-qa="message_content">
            <button data-qa="message_sender_name">alice</button>
            <a class="c-timestamp">14:02</a>
            <div data-qa="message-text"><div class="p-rich_text_block"><div class="p-rich_text_section">Question <strong>here</strong></div></div></div>
          </div>
          <div class="c-message_actions__container" onclick="event.stopPropagation()"></div>
        </div>
      </div>
      <div class="c-virtual_list__item" data-item-key="message-reply">
        <div data-qa="message_container" data-msg-ts="1788325500.000000">
          <div data-qa="message_content">
            <button data-qa="message_sender_name">bob</button>
            <a class="c-timestamp">14:05</a>
            <div data-qa="message-text"><div class="p-rich_text_block"><div class="p-rich_text_section">Reply</div><ul><li>item</li></ul></div></div>
          </div>
          <div class="c-message_actions__container" onclick="event.stopPropagation()"></div>
        </div>
      </div>
      <div class="c-virtual_list__item" data-item-key="message-compact-reply">
        <div data-qa="message_container" data-msg-ts="1788325560.000000">
          <div data-qa="thread_compact_gutter" class="p-thread_compact_gutter_generic p-thread_compact_gutter_generic--adjacent"></div>
          <a class="c-timestamp">14:06</a>
          <div data-qa="message-text"><div class="p-rich_text_block"><div class="p-rich_text_section">Second reply</div></div></div>
          <div class="c-message_actions__container" onclick="event.stopPropagation()"></div>
        </div>
      </div>
    </aside>
    <script>
      document.querySelector('#lazy-actions-message').addEventListener('pointerover', (event) => {
        if (event.currentTarget.querySelector('.c-message_actions__container')) return;
        const actions = document.createElement('div');
        actions.className = 'c-message_actions__container';
        actions.addEventListener('click', (clickEvent) => clickEvent.stopPropagation());
        event.currentTarget.appendChild(actions);
      });
      document.querySelector('#replaced-actions-message').addEventListener('pointerover', (event) => {
        if (event.currentTarget.dataset.replacementScheduled === 'true') return;
        event.currentTarget.dataset.replacementScheduled = 'true';
        const actions = event.currentTarget.querySelector('.c-message_actions__container');
        setTimeout(() => {
          actions.querySelector('.csm-copy-message-button')?.remove();
        }, 50);
      });
    </script>
  </body>
</html>`;

const context = await chromium.launchPersistentContext(
  mkdtempSync(join(tmpdir(), "copy-slack-md-e2e-")),
  {
    channel: "chromium",
    headless: true,
    timezoneId: "Asia/Tokyo",
    args: [
      `--disable-extensions-except=${extensionPath}`,
      `--load-extension=${extensionPath}`,
    ],
  },
);

recordAssertion(
  "生成 Manifest の権限を clipboardWrite だけにする",
  JSON.stringify(manifest.permissions) === JSON.stringify(["clipboardWrite"]) &&
    manifest.host_permissions === undefined &&
    manifest.minimum_chrome_version === "120",
);

try {
  console.log("INFO: Chromium に拡張を読み込みました");
  await context.grantPermissions(["clipboard-read", "clipboard-write"], {
    origin: "https://app.slack.com",
  });
  const page = context.pages()[0] ?? (await context.newPage());
  const cdpSession = await context.newCDPSession(page);
  await cdpSession.send("Emulation.setUserAgentOverride", {
    userAgent: await page.evaluate(() => navigator.userAgent),
    platform: "MacIntel",
  });
  page.setDefaultTimeout(10_000);
  page.setDefaultNavigationTimeout(15_000);
  const unexpectedRequests = [];
  await page.route("**/*", async (route) => {
    if (
      route.request().isNavigationRequest() &&
      route.request().url().startsWith(fixtureUrl)
    ) {
      await route.fulfill({
        status: 200,
        contentType: "text/html; charset=utf-8",
        body: fixture,
      });
      return;
    }
    unexpectedRequests.push(route.request().url());
    await route.abort();
  });

  console.log("INFO: app.slack.com の fixture を開きます");
  await page.goto(fixtureUrl, { waitUntil: "commit" });
  await page
    .locator(".csm-copy-message-button")
    .first()
    .waitFor({ timeout: 10_000 });

  const messageButtons = await page.locator(".csm-copy-message-button").count();
  recordAssertion(
    "各メッセージのアクション列にコピーボタンを追加する",
    messageButtons === 8,
    `count=${messageButtons}`,
  );

  recordAssertion(
    "本文ラッパーにはコピーボタンを常設しない",
    (await page
      .locator("#lazy-actions-message .csm-copy-message-button")
      .count()) === 0,
  );
  await page.locator("#lazy-actions-message").hover();
  const lazyActionsButton = page.locator(
    "#lazy-actions-message .c-message_actions__container > .csm-copy-message-button",
  );
  await lazyActionsButton.waitFor();
  recordAssertion(
    "遅延表示されたホバー操作列へコピーボタンを追加する",
    (await lazyActionsButton.count()) === 1,
  );

  await page.locator("#replaced-actions-message").hover();
  await page.waitForTimeout(150);
  const replacedActionsButtonCount = await page
    .locator("#replaced-actions-message .csm-copy-message-button")
    .count();
  recordAssertion(
    "Slackが操作列を差し替えてもボタンを再挿入する",
    replacedActionsButtonCount === 1,
    `count=${replacedActionsButtonCount}`,
  );

  await page.locator(".csm-copy-message-button").first().click();
  const singleMarkdown = await page.evaluate(() =>
    navigator.clipboard.readText(),
  );
  recordAssertion(
    "単一メッセージを text/plain の Markdown としてコピーする",
    singleMarkdown ===
      "**outside** · 12:02\n:rotating_light: [Mac-mini] pipeline healthcheck 異常\n\n- companies-edinet の最新実行が失敗\n- joboffers-ambi の最新実行が失敗\n\n確認: [dkron UI](http://localhost:8090/) / log ~/Library/Logs/shodan-pro/",
    JSON.stringify(singleMarkdown),
  );
  recordAssertion(
    "コピー成功トーストを表示する",
    (await page
      .locator('.csm-toast--success:has-text("Copied as Markdown")')
      .count()) === 1,
  );

  await page.evaluate(() => navigator.clipboard.writeText("untouched"));
  await page.evaluate(() =>
    document.querySelector(".csm-copy-message-button")?.click(),
  );
  recordAssertion(
    "合成 click ではクリップボードを書き換えない",
    (await page.evaluate(() => navigator.clipboard.readText())) === "untouched",
  );

  const threadButton = page.getByRole("button", {
    name: "Copy thread as Markdown",
  });
  await threadButton.click();
  const threadMarkdown = await page.evaluate(() =>
    navigator.clipboard.readText(),
  );
  const threadSuccessToast = page.locator(
    '.csm-toast--success:has-text("Copied 3 messages as Markdown")',
  );
  await threadSuccessToast.waitFor();
  recordAssertion(
    "スレッドコピー時にコピーしたメッセージ件数を表示する",
    (await threadSuccessToast.count()) === 1,
  );
  recordAssertion(
    "開いているスレッドの親と返信だけをまとめてコピーする",
    threadMarkdown ===
      "**alice** · 14:02\nQuestion **here**\n\n**bob** · 14:05\nReply\n\n- item\n\n**bob** · 14:06\nSecond reply",
    JSON.stringify(threadMarkdown),
  );

  await page.evaluate(() => {
    const unreadable = document.querySelector("#unreadable-message");
    const pane = document.querySelector('[data-qa="threads_flexpane"]');
    if (unreadable === null || pane === null)
      throw new Error("unreadable thread fixture is invalid");
    pane.appendChild(unreadable);
    return navigator.clipboard.writeText("thread untouched");
  });
  await threadButton.click();
  recordAssertion(
    "読めない項目があるスレッドは一部コピーせず失敗を表示する",
    (await page.evaluate(() => navigator.clipboard.readText())) ===
      "thread untouched" &&
      (await page
        .locator(
          '.csm-toast--error:has-text("message author could not be read")',
        )
        .count()) === 1,
  );

  await page
    .locator('[data-item-key="message-reply"] .p-rich_text_section')
    .evaluate((element) => {
      const selection = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents(element);
      selection.removeAllRanges();
      selection.addRange(range);
    });
  await page
    .locator('[data-item-key="message-reply"] .csm-copy-message-button')
    .click();
  const selectionFromButtonMarkdown = await page.evaluate(() =>
    navigator.clipboard.readText(),
  );
  recordAssertion(
    "テキスト選択中は MD ボタンでも選択範囲だけをコピーする",
    selectionFromButtonMarkdown === "Reply",
    JSON.stringify(selectionFromButtonMarkdown),
  );

  await page.evaluate(() => {
    const start = document.querySelector('[data-item-key="message-reply"]');
    const end = document.querySelector(
      '[data-item-key="message-compact-reply"]',
    );
    if (start === null || end === null)
      throw new Error("wrapper selection fixture is invalid");
    const selection = window.getSelection();
    const range = document.createRange();
    range.setStart(start, 0);
    range.setEnd(end, end.childNodes.length);
    selection?.removeAllRanges();
    selection?.addRange(range);
  });
  await page
    .locator('[data-item-key="message-compact-reply"] .csm-copy-message-button')
    .click();
  const wrapperBoundarySelectionMarkdown = await page.evaluate(() =>
    navigator.clipboard.readText(),
  );
  recordAssertion(
    "選択境界が Slack の行ラッパーでも本文範囲をコピーする",
    wrapperBoundarySelectionMarkdown === "Reply\n\n- item\n\nSecond reply",
    JSON.stringify(wrapperBoundarySelectionMarkdown),
  );

  await page.evaluate(() => {
    const pane = document.querySelector('[data-qa="threads_flexpane"]');
    const start = document.querySelector('[data-item-key="message-reply"]');
    const end = document.querySelector(
      '[data-item-key="message-compact-reply"] .p-rich_text_section',
    )?.firstChild;
    if (pane === null || start === null || end === undefined || end === null)
      throw new Error("pane boundary selection fixture is invalid");
    const startOffset = [...pane.childNodes].indexOf(start);
    if (startOffset === -1) throw new Error("pane boundary start is invalid");
    const selection = window.getSelection();
    const range = document.createRange();
    range.setStart(pane, startOffset);
    range.setEnd(end, end.textContent?.length ?? 0);
    selection?.removeAllRanges();
    selection?.addRange(range);
  });
  await page
    .locator('[data-item-key="message-compact-reply"] .csm-copy-message-button')
    .click();
  const paneBoundarySelectionMarkdown = await page.evaluate(() =>
    navigator.clipboard.readText(),
  );
  recordAssertion(
    "選択境界がメッセージ間でも交差する本文だけをコピーする",
    paneBoundarySelectionMarkdown === "Reply\n\n- item\n\nSecond reply",
    JSON.stringify(paneBoundarySelectionMarkdown),
  );

  await page
    .locator('[data-item-key="message-parent"] .p-rich_text_section')
    .evaluate((element) => {
      const selection = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents(element);
      selection?.removeAllRanges();
      selection?.addRange(range);
    });
  await page
    .locator('[data-item-key="message-compact-reply"] .csm-copy-message-button')
    .click();
  const unrelatedSelectionMarkdown = await page.evaluate(() =>
    navigator.clipboard.readText(),
  );
  recordAssertion(
    "別メッセージの残存選択よりクリックしたメッセージを優先する",
    unrelatedSelectionMarkdown === "**bob** · 14:06\nSecond reply",
    JSON.stringify(unrelatedSelectionMarkdown),
  );

  await page
    .locator('[data-item-key="message-parent"] [data-qa="message_sender_name"]')
    .evaluate((element) => {
      const selection = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents(element);
      selection?.removeAllRanges();
      selection?.addRange(range);
    });
  await page
    .locator('[data-item-key="message-parent"] .csm-copy-message-button')
    .click();
  const authorOnlySelectionMarkdown = await page.evaluate(() =>
    navigator.clipboard.readText(),
  );
  recordAssertion(
    "本文外だけの選択ではクリックしたメッセージをコピーする",
    authorOnlySelectionMarkdown === "**alice** · 14:02\nQuestion **here**",
    JSON.stringify(authorOnlySelectionMarkdown),
  );

  await page
    .locator('[data-item-key="message-reply"] [data-qa="message-text"]')
    .evaluate((element) => {
      const selection = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents(element.querySelector(".p-rich_text_section"));
      selection.removeAllRanges();
      selection.addRange(range);
    });
  await page.keyboard.press("Control+Shift+KeyC");
  const selectionMarkdown = await page.evaluate(() =>
    navigator.clipboard.readText(),
  );
  recordAssertion(
    "Ctrl+Shift+C で選択範囲だけをコピーする",
    selectionMarkdown === "Reply",
    JSON.stringify(selectionMarkdown),
  );

  await page.evaluate(() => {
    const start = document.querySelector(
      '[data-item-key="message-reply"] .p-rich_text_section',
    )?.firstChild;
    const end = document.querySelector(
      '[data-item-key="message-compact-reply"] .p-rich_text_section',
    )?.firstChild;
    if (
      start === undefined ||
      start === null ||
      end === undefined ||
      end === null
    )
      throw new Error("cross-message selection fixture is invalid");
    const selection = window.getSelection();
    const range = document.createRange();
    range.setStart(start, 0);
    range.setEnd(end, end.textContent?.length ?? 0);
    selection?.removeAllRanges();
    selection?.addRange(range);
  });
  await page.keyboard.press("Control+Shift+KeyC");
  const crossMessageSelectionMarkdown = await page.evaluate(() =>
    navigator.clipboard.readText(),
  );
  recordAssertion(
    "複数メッセージをまたいでも本文の選択範囲だけをコピーする",
    crossMessageSelectionMarkdown === "Reply\n\n- item\n\nSecond reply",
    JSON.stringify(crossMessageSelectionMarkdown),
  );

  await page.evaluate(() => {
    const start = document.querySelector(
      '[data-item-key="message-reply"] li',
    )?.firstChild;
    const end = document.querySelector(
      '[data-item-key="message-compact-reply"] .p-rich_text_section',
    )?.firstChild;
    if (
      start === undefined ||
      start === null ||
      end === undefined ||
      end === null
    )
      throw new Error("list boundary selection fixture is invalid");
    const range = document.createRange();
    range.setStart(start, start.textContent?.length ?? 0);
    range.setEnd(end, end.textContent?.length ?? 0);
    const selection = window.getSelection();
    selection?.removeAllRanges();
    selection?.addRange(range);
  });
  await page.keyboard.press("Control+Shift+KeyC");
  const selectionAfterListBoundaryMarkdown = await page.evaluate(() =>
    navigator.clipboard.readText(),
  );
  recordAssertion(
    "リスト末尾からの選択に空の箇条書きを入れない",
    selectionAfterListBoundaryMarkdown === "Second reply",
    JSON.stringify(selectionAfterListBoundaryMarkdown),
  );

  await page.evaluate(() => {
    const start = document.querySelector(
      '[data-item-key="message-reply"] .p-rich_text_section',
    )?.firstChild;
    const end = document.querySelector(
      '[data-item-key="message-reply"] li',
    )?.firstChild;
    if (
      start === undefined ||
      start === null ||
      end === undefined ||
      end === null
    )
      throw new Error("list start selection fixture is invalid");
    const range = document.createRange();
    range.setStart(start, 0);
    range.setEnd(end, 0);
    const selection = window.getSelection();
    selection?.removeAllRanges();
    selection?.addRange(range);
  });
  await page.keyboard.press("Control+Shift+KeyC");
  const selectionBeforeListBoundaryMarkdown = await page.evaluate(() =>
    navigator.clipboard.readText(),
  );
  recordAssertion(
    "リスト先頭までの選択に空の箇条書きを入れない",
    selectionBeforeListBoundaryMarkdown === "Reply",
    JSON.stringify(selectionBeforeListBoundaryMarkdown),
  );

  for (const [messageId, blockSelector, expected] of [
    ["code-message", "pre", "Code tail"],
    ["quote-message", "blockquote", "Quote tail"],
  ]) {
    await page.evaluate(
      ({ messageId, blockSelector }) => {
        const block = document.querySelector(`#${messageId} ${blockSelector}`);
        const tailText = document.querySelector(
          `#${messageId} .p-rich_text_block > .p-rich_text_section:last-child`,
        )?.firstChild;
        if (block === null || tailText === undefined || tailText === null)
          throw new Error("block boundary selection fixture is invalid");
        const walker = document.createTreeWalker(block, NodeFilter.SHOW_TEXT);
        let blockText = walker.nextNode();
        let nextText = walker.nextNode();
        while (nextText !== null) {
          blockText = nextText;
          nextText = walker.nextNode();
        }
        if (blockText === null)
          throw new Error("block boundary selection fixture is invalid");
        const range = document.createRange();
        range.setStart(blockText, blockText.textContent?.length ?? 0);
        range.setEnd(tailText, tailText.textContent?.length ?? 0);
        const selection = window.getSelection();
        selection?.removeAllRanges();
        selection?.addRange(range);
      },
      { messageId, blockSelector },
    );
    await page.keyboard.press("Control+Shift+KeyC");
    const blockBoundaryMarkdown = await page.evaluate(() =>
      navigator.clipboard.readText(),
    );
    recordAssertion(
      `${blockSelector} 末尾からの選択に空の Markdown 記法を入れない`,
      blockBoundaryMarkdown === expected,
      JSON.stringify(blockBoundaryMarkdown),
    );
  }

  await page.evaluate(() => {
    const items = document.querySelectorAll("#code-message li");
    const start = items[0]?.firstChild;
    const end = items[1]?.firstChild;
    if (
      start === undefined ||
      start === null ||
      end === undefined ||
      end === null
    )
      throw new Error("inner list selection fixture is invalid");
    const range = document.createRange();
    range.setStart(start, 0);
    range.setEnd(end, end.textContent?.length ?? 0);
    const selection = window.getSelection();
    selection?.removeAllRanges();
    selection?.addRange(range);
  });
  await page.keyboard.press("Control+Shift+KeyC");
  const innerListSelectionMarkdown = await page.evaluate(() =>
    navigator.clipboard.readText(),
  );
  recordAssertion(
    "同一リスト内の選択でも箇条書き構造を保つ",
    innerListSelectionMarkdown === "- alpha\n- beta",
    JSON.stringify(innerListSelectionMarkdown),
  );

  await page.evaluate(() => {
    const code = document.querySelector("#code-message pre")?.firstChild;
    if (code === undefined || code === null)
      throw new Error("inner code selection fixture is invalid");
    const text = code.textContent ?? "";
    const range = document.createRange();
    range.setStart(code, text.indexOf("a = x"));
    range.setEnd(code, text.indexOf("return"));
    const selection = window.getSelection();
    selection?.removeAllRanges();
    selection?.addRange(range);
  });
  await page.keyboard.press("Control+Shift+KeyC");
  const innerCodeSelectionMarkdown = await page.evaluate(() =>
    navigator.clipboard.readText(),
  );
  recordAssertion(
    "コードブロック内の部分選択でも改行と記号を保つ",
    innerCodeSelectionMarkdown === "```\na = x * y;\nconst b = _z_;\n```",
    JSON.stringify(innerCodeSelectionMarkdown),
  );

  await page.evaluate(() => {
    const sections = document.querySelectorAll(
      "#quote-message blockquote .p-rich_text_section",
    );
    const start = sections[0]?.firstChild;
    const end = sections[1]?.firstChild;
    if (
      start === undefined ||
      start === null ||
      end === undefined ||
      end === null
    )
      throw new Error("inner quote selection fixture is invalid");
    const range = document.createRange();
    range.setStart(start, 0);
    range.setEnd(end, end.textContent?.length ?? 0);
    const selection = window.getSelection();
    selection?.removeAllRanges();
    selection?.addRange(range);
  });
  await page.keyboard.press("Control+Shift+KeyC");
  const innerQuoteSelectionMarkdown = await page.evaluate(() =>
    navigator.clipboard.readText(),
  );
  recordAssertion(
    "引用内の選択でも引用構造を保つ",
    innerQuoteSelectionMarkdown === "> first quoted\n> second quoted",
    JSON.stringify(innerQuoteSelectionMarkdown),
  );

  await page.evaluate(() => window.getSelection()?.removeAllRanges());
  await page.locator("#quote-message > [data-qa='message_content']").hover();
  await page.evaluate(() => navigator.clipboard.writeText("untouched"));
  await page.keyboard.press("Control+Shift+KeyC");
  const hoverShortcutMarkdown = await page.evaluate(() =>
    navigator.clipboard.readText(),
  );
  const quoteMessageMarkdown =
    "**quoter** · 12:05\nQuote intro\n\n> first quoted\n> second quoted\n\nQuote tail";
  recordAssertion(
    "ホバー中のメッセージを Ctrl+Shift+C でコピーする",
    hoverShortcutMarkdown === quoteMessageMarkdown,
    JSON.stringify(hoverShortcutMarkdown),
  );

  await page.locator("#quote-message .csm-copy-message-button").click();
  await page.mouse.move(1, 1);
  await page.evaluate(() => navigator.clipboard.writeText("untouched"));
  await page.keyboard.press("Control+Shift+KeyC");
  const focusShortcutMarkdown = await page.evaluate(() =>
    navigator.clipboard.readText(),
  );
  recordAssertion(
    "フォーカス中のメッセージを Ctrl+Shift+C でコピーする",
    focusShortcutMarkdown === quoteMessageMarkdown,
    JSON.stringify(focusShortcutMarkdown),
  );

  await page.locator("#code-message .csm-copy-message-button").click();
  await page.locator("#blank-area").click();
  await page.mouse.move(1, 1);
  await page.evaluate(() => navigator.clipboard.writeText("untouched"));
  await page.keyboard.press("Control+Shift+KeyC");
  const clipboardAfterBlankShortcut = await page.evaluate(() =>
    navigator.clipboard.readText(),
  );
  recordAssertion(
    "メッセージ外へフォーカスを移した後の Ctrl+Shift+C で以前のメッセージをコピーしない",
    clipboardAfterBlankShortcut === "untouched",
    JSON.stringify(clipboardAfterBlankShortcut),
  );

  await page.evaluate(() => window.getSelection()?.removeAllRanges());
  const clipboardBeforeComposerShortcut = await page.evaluate(() =>
    navigator.clipboard.readText(),
  );
  await page
    .getByRole("textbox", { name: "Message composer", exact: true })
    .focus();
  await page.keyboard.press("Control+Shift+KeyC");
  const clipboardAfterComposerShortcut = await page.evaluate(() =>
    navigator.clipboard.readText(),
  );
  recordAssertion(
    "入力欄では Ctrl+Shift+C を横取りしない",
    clipboardAfterComposerShortcut === clipboardBeforeComposerShortcut,
    JSON.stringify(clipboardAfterComposerShortcut),
  );

  await page.getByRole("textbox", { name: "Rich message composer" }).focus();
  await page.keyboard.press("Control+Shift+KeyC");
  recordAssertion(
    "plaintext-only の入力欄でも Ctrl+Shift+C を横取りしない",
    (await page.evaluate(() => navigator.clipboard.readText())) ===
      clipboardBeforeComposerShortcut,
  );

  await page.evaluate(() => {
    const selection = window.getSelection();
    const content = document.querySelector(
      '[data-item-key="message-reply"] .p-rich_text_section',
    );
    if (selection === null || content === null)
      throw new Error("synthetic shortcut fixture is invalid");
    const range = document.createRange();
    range.selectNodeContents(content);
    selection.removeAllRanges();
    selection.addRange(range);
    document.dispatchEvent(
      new KeyboardEvent("keydown", {
        bubbles: true,
        code: "KeyC",
        ctrlKey: true,
        shiftKey: true,
      }),
    );
  });
  recordAssertion(
    "合成 keydown ではクリップボードを書き換えない",
    (await page.evaluate(() => navigator.clipboard.readText())) ===
      clipboardBeforeComposerShortcut,
  );

  await page.locator("#unreadable-message .csm-copy-message-button").click();
  recordAssertion(
    "単一メッセージを読めないときは失敗トーストを表示する",
    (await page
      .locator('.csm-toast--error:has-text("message author could not be read")')
      .count()) === 1,
  );

  await cdpSession.send("Emulation.setUserAgentOverride", {
    userAgent: await page.evaluate(() => navigator.userAgent),
    platform: "Linux x86_64",
  });
  await page.reload({ waitUntil: "commit" });
  await page.locator("#quote-message").hover();
  await page.evaluate(() => navigator.clipboard.writeText("untouched"));
  await page.keyboard.press("Control+Shift+KeyC");
  recordAssertion(
    "macOS以外では Ctrl+Shift+C を横取りしない",
    (await page.evaluate(
      () =>
        navigator.platform === "Linux x86_64" && navigator.clipboard.readText(),
    )) === "untouched",
  );

  recordAssertion(
    "拡張から外部ネットワークリクエストを送らない",
    unexpectedRequests.length === 0,
    unexpectedRequests.join(", "),
  );
} finally {
  await context.close();
}

if (failures.length > 0) {
  console.error(`\n${failures.length} 件失敗: ${failures.join(", ")}`);
  process.exit(1);
}

console.log("\nすべての E2E 検証に成功。");
