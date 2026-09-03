import { describe, expect, it } from "vitest";

import { formatSlackMessages } from "./format-message";
import type { SlackMessage } from "./slack-dom";

function message(overrides: Partial<SlackMessage> = {}): SlackMessage {
  return {
    author: "alice",
    body: "Question",
    timestamp: new Date(2026, 8, 2, 14, 2),
    displayedTime: "14:02",
    attachments: [],
    ...overrides,
  };
}

describe("formatSlackMessages", () => {
  it("同じ日の発言は時刻だけで整形する", () => {
    expect(
      formatSlackMessages([
        message(),
        message({
          author: "bob",
          body: "Reply\n- item",
          timestamp: new Date(2026, 8, 2, 14, 5),
          displayedTime: "14:05",
        }),
      ]),
    ).toBe("**alice** · 14:02\nQuestion\n\n**bob** · 14:05\nReply\n- item");
  });

  it("日をまたぐスレッドは全発言に日付を付ける", () => {
    expect(
      formatSlackMessages([
        message(),
        message({
          timestamp: new Date(2026, 8, 3, 0, 5),
          displayedTime: "00:05",
        }),
      ]),
    ).toContain(
      "**alice** · 2026-09-02 14:02\nQuestion\n\n**alice** · 2026-09-03 00:05",
    );
  });

  it("添付ファイル名と URL を本文の後ろに置く", () => {
    expect(
      formatSlackMessages([
        message({
          attachments: [
            {
              name: "report [final].pdf",
              url: "https://files.slack.com/report.pdf",
            },
          ],
        }),
      ]),
    ).toBe(
      "**alice** · 14:02\nQuestion\n📎 [report \\[final\\].pdf](https://files.slack.com/report.pdf)",
    );
  });

  it("解析した Date ではなく Slack の表示時刻を使う", () => {
    expect(
      formatSlackMessages([
        message({
          timestamp: new Date(2026, 8, 2, 15, 2),
          displayedTime: "14:02",
        }),
      ]),
    ).toBe("**alice** · 14:02\nQuestion");
  });

  it("安全でない添付 URL はリンクにしない", () => {
    expect(
      formatSlackMessages([
        message({
          attachments: [
            { name: "report.pdf", url: "javascript:alert(1)" },
            { name: "broken.pdf", url: "https://[invalid" },
          ],
        }),
      ]),
    ).toBe("**alice** · 14:02\nQuestion\n📎 report.pdf\n📎 broken.pdf");
  });
});
