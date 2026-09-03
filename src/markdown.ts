interface SerializeContext {
  listDepth: number;
}

const BLOCK_TAGS = new Set([
  "ADDRESS",
  "ARTICLE",
  "ASIDE",
  "DIV",
  "FIGCAPTION",
  "FIGURE",
  "FOOTER",
  "HEADER",
  "MAIN",
  "NAV",
  "P",
  "SECTION",
]);

function escapeMarkdownText(text: string): string {
  return text
    .replace(/([\\`*_])/g, "\\$1")
    .replace(/~~/g, "\\~\\~")
    .replace(/</g, "\\<")
    .replace(/(^|\n)([ \t]{0,3})#(?=\s)/g, "$1$2\\#")
    .replace(/(^|\n)([ \t]{0,3})([>+-])(?=\s)/g, "$1$2\\$3")
    .replace(/(^|\n)([ \t]{0,3})(\d+)([.)])(?=\s)/g, "$1$2$3\\$4");
}

function normalizeTextNode(text: string): string {
  if (text.trim() === "" && text.includes("\n")) return "";
  return escapeMarkdownText(text.replace(/\u00a0/g, " ").replace(/\s+/g, " "));
}

function serializeChildren(node: Node, context: SerializeContext): string {
  return [...node.childNodes]
    .map((child) => serializeNode(child, context))
    .join("");
}

function languageForCodeBlock(element: Element): string {
  const explicit = element.getAttribute("data-language");
  if (explicit !== null) return explicit.replace(/[^a-zA-Z0-9_+-]/g, "");

  const code = element.matches("code")
    ? element
    : element.querySelector("code");
  const languageClass = [...(code?.classList ?? [])].find((className) =>
    /^(?:language|lang)-/.test(className),
  );
  return languageClass?.replace(/^(?:language|lang)-/, "") ?? "";
}

function fencedCode(text: string, language: string): string {
  const code = text.replace(/^\n+|\n+$/g, "");
  if (code === "") return "";
  const longestRun = Math.max(
    0,
    ...[...code.matchAll(/`+/g)].map(([run]) => run.length),
  );
  const fence = "`".repeat(Math.max(3, longestRun + 1));
  return `\n${fence}${language}\n${code}\n${fence}\n`;
}

function inlineCode(text: string): string {
  const longestRun = Math.max(
    0,
    ...[...text.matchAll(/`+/g)].map(([run]) => run.length),
  );
  const fence = "`".repeat(longestRun + 1);
  const padding = text.startsWith("`") || text.endsWith("`") ? " " : "";
  return `${fence}${padding}${text}${padding}${fence}`;
}

function wrapInlineMarkdown(content: string, marker: string): string {
  const leadingWhitespace = content.match(/^\s+/)?.[0] ?? "";
  const trailingWhitespace =
    content.slice(leadingWhitespace.length).match(/\s+$/)?.[0] ?? "";
  const innerEnd = content.length - trailingWhitespace.length;
  const inner = content.slice(leadingWhitespace.length, innerEnd);
  if (inner === "") return content;
  return `${leadingWhitespace}${marker}${inner}${marker}${trailingWhitespace}`;
}

function quote(text: string): string {
  const content = text.trim();
  if (content === "") return "";
  return content
    .split("\n")
    .map((line) => `> ${line}`)
    .join("\n");
}

function isBulletList(element: Element): boolean {
  return (
    element.tagName === "UL" ||
    element.getAttribute("data-liststyle") === "bullet" ||
    element.classList.contains("p-rich_text_list__bullet")
  );
}

function serializeList(element: Element, context: SerializeContext): string {
  const listItems = [...element.children].filter(
    (child) => child.tagName === "LI",
  );
  const bullet = isBulletList(element);
  const lines = listItems.flatMap((item, index) => {
    const inlineNodes = [...item.childNodes].filter(
      (child) =>
        !(
          child instanceof Element &&
          (child.tagName === "UL" || child.tagName === "OL")
        ),
    );
    const inline = inlineNodes
      .map((child) =>
        serializeNode(child, { listDepth: context.listDepth + 1 }),
      )
      .join("")
      .trim();
    const nested = [...item.children]
      .filter((child) => child.tagName === "UL" || child.tagName === "OL")
      .map((child) =>
        serializeList(child, { listDepth: context.listDepth + 1 })
          .replace(/^\n/, "")
          .trimEnd(),
      )
      .join("\n");
    const declaredIndent = element.getAttribute("data-indent");
    const parsedIndent =
      declaredIndent === null ? null : Number(declaredIndent);
    const indent = "  ".repeat(
      parsedIndent !== null &&
        Number.isInteger(parsedIndent) &&
        parsedIndent >= 0
        ? parsedIndent
        : context.listDepth,
    );
    const orderedStart =
      element instanceof HTMLOListElement ? element.start : 1;
    const marker = bullet ? "-" : `${orderedStart + index}.`;
    if (inline === "" && nested === "") return [];
    return [
      `${indent}${marker} ${inline}${nested.length > 0 ? `\n${nested}` : ""}`,
    ];
  });
  return lines.length === 0 ? "" : `\n${lines.join("\n")}\n\n`;
}

function serializeLink(
  element: HTMLAnchorElement,
  context: SerializeContext,
): string {
  const label = serializeChildren(element, context).trim() || element.href;
  if (
    element.matches(
      '[data-qa*="mention"], [data-member-id], [data-stringify-type="mention"]',
    ) ||
    element.classList.contains("c-member_slug")
  ) {
    return label;
  }
  if (!element.hasAttribute("href")) return label;
  const href = safeMarkdownLinkUrl(element.href);
  if (href === null) return label;
  const escapedLabel = label.replace(/([\[\]])/g, "\\$1");
  return `[${escapedLabel}](${href})`;
}

export function safeMarkdownLinkUrl(url: string): string | null {
  const protocol = new URL(url).protocol;
  if (protocol !== "http:" && protocol !== "https:") return null;
  return url.replace(/\s/g, "%20").replace(/\(/g, "%28").replace(/\)/g, "%29");
}

function serializeNode(node: Node, context: SerializeContext): string {
  if (node.nodeType === Node.TEXT_NODE)
    return normalizeTextNode(node.textContent ?? "");
  if (!(node instanceof Element)) return "";

  if (node.tagName === "BR") return "\n";
  if (node.matches('[aria-hidden="true"], [data-csm-ignore]')) return "";
  if (node.getAttribute("data-stringify-type") === "paragraph-break") {
    return "\n";
  }
  if (node.getAttribute("data-stringify-type") === "replace") {
    const link = node.querySelector<HTMLAnchorElement>("a[href]");
    if (link !== null) return serializeLink(link, context);
  }
  if (node.classList.contains("p-rich_text_preformatted")) {
    return fencedCode(node.textContent ?? "", languageForCodeBlock(node));
  }
  if (node.classList.contains("p-rich_text_quote")) {
    const quoted = quote(serializeChildren(node, context));
    return quoted === "" ? "" : `\n${quoted}\n\n`;
  }

  switch (node.tagName) {
    case "STRONG":
    case "B":
      return wrapInlineMarkdown(serializeChildren(node, context), "**");
    case "EM":
    case "I":
      return wrapInlineMarkdown(serializeChildren(node, context), "*");
    case "DEL":
    case "S":
    case "STRIKE":
      return wrapInlineMarkdown(serializeChildren(node, context), "~~");
    case "CODE":
      return inlineCode(node.textContent ?? "");
    case "PRE":
      return fencedCode(node.textContent ?? "", languageForCodeBlock(node));
    case "A":
      return serializeLink(node as HTMLAnchorElement, context);
    case "IMG": {
      const stringifiedEmoji = node.getAttribute("data-stringify-emoji");
      if (stringifiedEmoji !== null) return stringifiedEmoji;
      const alt = (node as HTMLImageElement).alt;
      return /^:[^:\s]+:$/.test(alt) ? alt : "";
    }
    case "BLOCKQUOTE": {
      const quoted = quote(serializeChildren(node, context));
      return quoted === "" ? "" : `\n${quoted}\n\n`;
    }
    case "UL":
    case "OL":
      return serializeList(node, context);
    case "LI":
      return serializeChildren(node, context);
    default: {
      const content = serializeChildren(node, context);
      const isRichTextSection = node.classList.contains("p-rich_text_section");
      return BLOCK_TAGS.has(node.tagName) || isRichTextSection
        ? `${content}\n`
        : content;
    }
  }
}

function normalizeSlackTextBullets(markdown: string): string {
  return markdown.replace(
    /(^|\n)((?:[ \t]*•[ \t]+[^\n]*)(?:\n[ \t]*•[ \t]+[^\n]*)*)(?=\n|$)/g,
    (_match, boundary: string, bulletBlock: string) => {
      const markdownList = bulletBlock.replace(/^[ \t]*•[ \t]+/gm, "- ");
      return `${boundary === "" ? "" : "\n\n"}${markdownList}\n`;
    },
  );
}

function normalizeProseMarkdown(markdown: string): string {
  return normalizeSlackTextBullets(markdown)
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n[ \t]+\n/g, "\n\n")
    .replace(/\n{2,}(?=[ \t]+(?:[-+*]|\d+[.)]) )/g, "\n")
    .replace(/\n{3,}/g, "\n\n");
}

function normalizeMarkdown(markdown: string): string {
  const fencedCodePattern = /(^|\n)(`{3,})[^\n]*\n[\s\S]*?\n\2(?=\n|$)/g;
  let normalized = "";
  let previousEnd = 0;

  for (const match of markdown.matchAll(fencedCodePattern)) {
    const matchIndex = match.index;
    normalized += normalizeProseMarkdown(
      markdown.slice(previousEnd, matchIndex),
    );
    normalized += match[0];
    previousEnd = matchIndex + match[0].length;
  }

  normalized += normalizeProseMarkdown(markdown.slice(previousEnd));
  return normalized.trim();
}

export function slackRichTextToMarkdown(root: Node): string {
  return normalizeMarkdown(serializeChildren(root, { listDepth: 0 }));
}

export function escapeMarkdownInline(text: string): string {
  return escapeMarkdownText(text);
}

export function escapeMarkdownLinkLabel(text: string): string {
  return escapeMarkdownText(text).replace(/([\[\]])/g, "\\$1");
}
