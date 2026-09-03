import { chromium } from "playwright";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const extensionPath = resolve("dist");
const outputDirectory = resolve("store-assets");
const fixtureUrl = "https://app.slack.com/client/store-preview/thread";

const fixture = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <style>
      * { box-sizing: border-box; }
      body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; color: #1d1c1d; background: #f8f8f8; }
      .app { display: grid; grid-template-columns: 250px 1fr 430px; height: 800px; }
      .sidebar { padding: 28px 20px; color: white; background: #35113f; }
      .workspace { margin-bottom: 34px; font-size: 20px; font-weight: 700; }
      .sidebar-item { padding: 8px 12px; border-radius: 6px; opacity: .82; }
      .sidebar-item.active { background: #1164a3; opacity: 1; }
      .channel { background: white; border-right: 1px solid #ddd; }
      .channel-header, .thread-header { height: 82px; padding: 24px 28px; border-bottom: 1px solid #ddd; background: white; }
      .channel-header strong, .thread-header strong { display: block; font-size: 18px; }
      .channel-header span, .thread-header span { color: #616061; font-size: 13px; }
      .messages { padding: 32px 28px; }
      [data-qa="message_container"] { position: relative; display: grid; grid-template-columns: 48px 1fr; gap: 12px; padding: 14px 16px; border-radius: 8px; }
      [data-qa="message_container"]:hover, .featured { background: #f5f5f5; }
      .avatar { display: grid; width: 44px; height: 44px; place-items: center; border-radius: 10px; color: white; background: #0b8075; font-weight: 700; }
      .meta { display: flex; align-items: baseline; gap: 8px; }
      [data-qa="message_sender_name"] { padding: 0; border: 0; background: transparent; font: inherit; font-weight: 700; }
      .c-timestamp { color: #616061; font-size: 12px; }
      [data-qa="message-text"] { margin-top: 5px; font-size: 15px; line-height: 1.55; }
      .p-rich_text_list { margin: 8px 0; padding-left: 24px; }
      code { padding: 2px 5px; border: 1px solid #ddd; border-radius: 4px; color: #c7254e; background: #fafafa; }
      .c-message_actions__container { position: absolute; top: -16px; right: 14px; display: flex; align-items: center; min-height: 34px; padding: 3px; border: 1px solid #ddd; border-radius: 8px; background: white; box-shadow: 0 2px 8px #0002; }
      .thread { background: white; }
      .thread .messages { padding: 20px 18px; }
      .thread [data-qa="message_container"] { grid-template-columns: 40px 1fr; padding: 12px; }
      .thread .avatar { width: 38px; height: 38px; }
      .thread-header { display: flex; align-items: center; justify-content: space-between; padding: 18px 20px; }
      .thread-title { min-width: 90px; }
      .hint { margin-top: 24px; padding: 16px; border-radius: 8px; color: #3f3f3f; background: #ecf7f5; font-size: 14px; line-height: 1.5; }
    </style>
  </head>
  <body>
    <div class="app">
      <nav class="sidebar">
        <div class="workspace">Acme Workspace</div>
        <div class="sidebar-item">Threads</div>
        <div class="sidebar-item">Drafts & sent</div>
        <div class="sidebar-item active"># project-alpha</div>
        <div class="sidebar-item"># announcements</div>
      </nav>
      <main class="channel">
        <header class="channel-header"><strong># project-alpha</strong><span>Planning and implementation</span></header>
        <div class="messages">
          <div data-qa="message_container" data-ts="1788318120.000000">
            <div class="avatar">A</div>
            <div data-qa="message_content">
              <div class="meta"><button data-qa="message_sender_name">alice</button><a class="c-timestamp">14:02</a></div>
              <div data-qa="message-text"><div class="p-rich_text_block"><div class="p-rich_text_section">Could you review the <strong>release checklist</strong>?</div><ul class="p-rich_text_list"><li>Verify the production build</li><li>Update the documentation</li><li>Share the final notes</li></ul></div></div>
            </div>
            <div class="c-message_actions__container"></div>
          </div>
          <div data-qa="message_container" data-ts="1788318240.000000">
            <div class="avatar" style="background:#1264a3">B</div>
            <div data-qa="message_content">
              <div class="meta"><button data-qa="message_sender_name">bob</button><a class="c-timestamp">14:04</a></div>
              <div data-qa="message-text"><div class="p-rich_text_block"><div class="p-rich_text_section">Done. The command is <code>pnpm check</code>.</div></div></div>
            </div>
            <div class="c-message_actions__container"></div>
          </div>
          <div class="hint"><strong>Copy exactly what you need.</strong><br>Select part of a message and click MD, or copy the whole message in one click.</div>
        </div>
      </main>
      <aside class="thread" data-qa="threads_flexpane">
        <header class="thread-header p-flexpane_header"><div class="thread-title"><strong>Thread</strong><span># project-alpha</span></div></header>
        <div class="messages">
          <div class="c-virtual_list__item" data-item-key="message-parent">
            <div data-qa="message_container" data-msg-ts="1788325320.000000">
              <div class="avatar">A</div>
              <div data-qa="message_content"><div class="meta"><button data-qa="message_sender_name">alice</button><a class="c-timestamp">14:02</a></div><div data-qa="message-text"><div class="p-rich_text_block"><div class="p-rich_text_section">Could you review the <strong>release checklist</strong>?</div></div></div></div>
              <div class="c-message_actions__container"></div>
            </div>
          </div>
          <div class="c-virtual_list__item" data-item-key="message-reply">
            <div data-qa="message_container" data-msg-ts="1788325500.000000">
              <div class="avatar" style="background:#1264a3">B</div>
              <div data-qa="message_content"><div class="meta"><button data-qa="message_sender_name">bob</button><a class="c-timestamp">14:05</a></div><div data-qa="message-text"><div class="p-rich_text_block"><div class="p-rich_text_section">Yes, I will check:</div><ul class="p-rich_text_list"><li>Formatting</li><li>Links</li></ul></div></div></div>
              <div class="c-message_actions__container"></div>
            </div>
          </div>
          <div class="c-virtual_list__item" data-item-key="message-reply-2">
            <div data-qa="message_container" data-msg-ts="1788325560.000000">
              <div class="avatar" style="background:#7c3aed">C</div>
              <div data-qa="message_content"><div class="meta"><button data-qa="message_sender_name">carol</button><a class="c-timestamp">14:06</a></div><div data-qa="message-text"><div class="p-rich_text_block"><div class="p-rich_text_section">The Markdown output looks good.</div></div></div></div>
              <div class="c-message_actions__container"></div>
            </div>
          </div>
        </div>
      </aside>
    </div>
  </body>
</html>`;

const context = await chromium.launchPersistentContext(
  mkdtempSync(join(tmpdir(), "copy-slack-md-store-")),
  {
    channel: "chromium",
    headless: true,
    viewport: { width: 1280, height: 800 },
    args: [
      `--disable-extensions-except=${extensionPath}`,
      `--load-extension=${extensionPath}`,
    ],
  },
);

try {
  await context.grantPermissions(["clipboard-read", "clipboard-write"], {
    origin: "https://app.slack.com",
  });
  const page = context.pages()[0] ?? (await context.newPage());
  await page.route("**/*", async (route) => {
    if (route.request().isNavigationRequest()) {
      await route.fulfill({
        status: 200,
        contentType: "text/html; charset=utf-8",
        body: fixture,
      });
      return;
    }
    await route.abort();
  });
  await page.goto(fixtureUrl, { waitUntil: "commit" });
  await page.locator(".csm-copy-message-button").first().waitFor();
  await page.locator("[data-qa='message_container']").first().hover();
  await page.locator(".csm-copy-message-button").first().click();
  await page.locator(".csm-toast--success").waitFor();
  await page.screenshot({
    path: join(outputDirectory, "screenshot-message.png"),
  });

  await page.waitForTimeout(3100);
  await page.getByRole("button", { name: "Copy thread as Markdown" }).click();
  await page
    .locator('.csm-toast--success:has-text("Copied 3 messages")')
    .waitFor();
  await page.screenshot({
    path: join(outputDirectory, "screenshot-thread.png"),
  });
} finally {
  await context.close();
}
