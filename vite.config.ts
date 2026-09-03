import { crx, defineManifest } from "@crxjs/vite-plugin";
import { defineConfig } from "vite";

import pkg from "./package.json";

const manifest = defineManifest({
  manifest_version: 3,
  name: "Copy Slack as Markdown",
  description: "Copy visible Slack Web messages and threads as Markdown.",
  version: pkg.version,
  minimum_chrome_version: "120",
  permissions: ["clipboardWrite"],
  content_scripts: [
    {
      matches: ["https://app.slack.com/*"],
      js: ["src/content/main.ts"],
      run_at: "document_idle",
    },
  ],
});

export default defineConfig({
  plugins: [crx({ manifest })],
  test: {
    environment: "jsdom",
  },
});
