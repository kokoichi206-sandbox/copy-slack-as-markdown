import { describe, expect, it } from "vitest";

import { slackRichTextToMarkdown } from "./markdown";

function markdown(html: string): string {
  const root = document.createElement("div");
  root.innerHTML = html;
  return slackRichTextToMarkdown(root);
}

describe("slackRichTextToMarkdown", () => {
  it("Slack のインライン装飾・リンク・絵文字を Markdown にする", () => {
    expect(
      markdown(
        '<div class="p-rich_text_section">Hello <strong>bold</strong>, <em>italic</em>, <s>old</s>, <code>a`b</code> <a href="https://example.com/docs?q=1">docs</a> <img alt=":party-parrot:" src="emoji.png"></div>',
      ),
    ).toBe(
      "Hello **bold**, *italic*, ~~old~~, ``a`b`` [docs](https://example.com/docs?q=1) :party-parrot:",
    );
  });

  it("箇条書き・番号付きリスト・引用を保つ", () => {
    expect(
      markdown(`
        <ul><li>one</li><li>two<ul><li>nested</li></ul></li></ul>
        <ol><li>first</li><li>second</li></ol>
        <blockquote>quoted<br>next line</blockquote>
      `),
    ).toBe(
      "- one\n- two\n  - nested\n\n1. first\n2. second\n\n> quoted\n> next line",
    );
  });

  it("コードブロック内のバッククォートより長い fence を使う", () => {
    expect(markdown('<pre data-language="ts">const fence = "```";</pre>')).toBe(
      '````ts\nconst fence = "```";\n````',
    );
  });

  it("メンションはリンクにせず表示名だけを残す", () => {
    expect(
      markdown(
        '<a data-stringify-type="mention" href="https://app.slack.com/team/U123">@alice</a>',
      ),
    ).toBe("@alice");
  });

  it("href のないリンク要素は表示テキストだけを残す", () => {
    expect(markdown('<a class="c-timestamp">14:06</a>')).toBe("14:06");
  });

  it("絵文字ではない画像の alt は本文へ入れない", () => {
    expect(markdown('<img alt="alice" src="avatar.png">message')).toBe(
      "message",
    );
  });

  it("現行 Slack の rich text wrapper と改行・置換リンクを処理する", () => {
    expect(
      markdown(`
        <div class="p-rich_text_block">
          <div class="p-rich_text_section">first<span data-stringify-type="paragraph-break"></span>second</div>
          <div data-stringify-type="replace" data-stringify-text="https://example.com/long"><svg aria-hidden="true"></svg><div><a href="https://example.com/long">example</a></div></div>
        </div>
      `),
    ).toBe("first\nsecond\n[example](https://example.com/long)");
  });

  it("Slack の data-indent で分割されたネストリストを字下げする", () => {
    expect(
      markdown(`
        <ul data-indent="0"><li>parent</li></ul>
        <ul data-indent="1"><li>child</li></ul>
      `),
    ).toBe("- parent\n  - child");
  });

  it("コードブロック内の空行と行末空白を変えない", () => {
    expect(markdown("<pre>first  \n\n\nlast</pre>")).toBe(
      "```\nfirst  \n\n\nlast\n```",
    );
  });

  it("内容のないリスト・コードブロック・引用を出力しない", () => {
    expect(
      markdown(
        '<div class="p-rich_text_section">before</div><ul><li></li></ul><pre></pre><blockquote></blockquote><div class="p-rich_text_section">after</div>',
      ),
    ).toBe("before\nafter");
  });

  it("リストと引用の後続段落を独立したブロックにする", () => {
    expect(
      markdown(
        '<div class="p-rich_text_section">list intro</div><ul><li>item</li></ul><div class="p-rich_text_section">list tail</div><div class="p-rich_text_section">quote intro</div><blockquote class="p-rich_text_quote">quoted</blockquote><div class="p-rich_text_section">quote tail</div>',
      ),
    ).toBe(
      "list intro\n\n- item\n\nlist tail\nquote intro\n\n> quoted\n\nquote tail",
    );
  });

  it("プレーンテキストの Markdown 記号をエスケープする", () => {
    expect(markdown("literal *asterisk* and [brackets] # heading")).toBe(
      "literal \\*asterisk\\* and [brackets] # heading",
    );
  });

  it("現行 Slack の非表示指定された改行と行頭の箇条書きを Markdown にする", () => {
    expect(
      markdown(
        '<div class="p-rich_text_section"><img alt=":rotating_light:" data-stringify-type="emoji" data-stringify-emoji=":rotating_light:"> [Mac-mini] pipeline healthcheck 異常<br aria-hidden="true">&nbsp;• companies-edinet の最新実行が失敗<br aria-hidden="true">&nbsp;• joboffers-ambi の最新実行が失敗<br aria-hidden="true">確認: <a href="http://localhost:8090">dkron UI</a> / log ~/Library/Logs/shodan-pro/</div>',
      ),
    ).toBe(
      ":rotating_light: [Mac-mini] pipeline healthcheck 異常\n\n- companies-edinet の最新実行が失敗\n- joboffers-ambi の最新実行が失敗\n\n確認: [dkron UI](http://localhost:8090/) / log ~/Library/Logs/shodan-pro/",
    );
  });

  it("強調範囲の空白を記号の外へ出し単語内の斜体を保つ", () => {
    expect(
      markdown("before<strong> bold </strong>un<em>believ</em>able<s> </s>"),
    ).toBe("before **bold** un*believ*able");
  });

  it("番号付きリストの start 属性から採番する", () => {
    expect(markdown('<ol start="3"><li>third</li><li>fourth</li></ol>')).toBe(
      "3. third\n4. fourth",
    );
  });

  it("プレーンテキストの HTML と行頭 Markdown 記法をエスケープする", () => {
    expect(
      markdown(
        '<div class="p-rich_text_section">use &lt;div&gt;<br>&gt; quote<br>- item<br>1. numbered</div>',
      ),
    ).toBe("use \\<div>\n\\> quote\n\\- item\n1\\. numbered");
  });

  it("リンクラベルの角括弧をエスケープし危険な URL をリンクにしない", () => {
    expect(
      markdown(
        '<a href="https://example.com/docs">a]b</a> <a href="javascript:alert(1)">unsafe</a>',
      ),
    ).toBe("[a\\]b](https://example.com/docs) unsafe");
  });
});
