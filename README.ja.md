# Copy Slack as Markdown

<div align="right">

[English](./README.md) | 日本語

</div>

Chrome 120 以降の Slack Web で画面に表示されているメッセージやスレッドを Markdown に変換し、クリップボードへコピーする拡張です。Slack API や OAuth は使いません。

## インストール

```sh
pnpm install
pnpm build
```

Chrome で `chrome://extensions` を開き、『デベロッパー モード』を有効にします。『パッケージ化されていない拡張機能を読み込む』から、このリポジトリの `dist` ディレクトリを選んでください。

## 使い方

- メッセージにマウスを重ね、アクション列の『Copy as Markdown』ボタン（`MD`）を押すと、そのメッセージをコピーします。本文を選択してから、その選択を含むメッセージの `MD` を押すと選択範囲だけをコピーします。
- スレッドパネル上部の『Copy thread as Markdown』を押すと、パネル内に読み込まれている親メッセージと返信をまとめてコピーします。
- macOS では、メッセージ内のテキストを選択して `Ctrl+Shift+C` を押しても、選択範囲だけをコピーできます。選択がない場合は、マウスを重ねているかフォーカス中のメッセージが対象です。`Shift+Command+C` と Windows/Linux の `Ctrl+Shift+C` は Chrome のデベロッパーツールと衝突するため、その他の環境では `MD` ボタンを使用してください。
- Slack の入力欄で入力中は発火しません。

出力は `text/plain` の Markdown です。

```md
**alice** · 14:02
質問本文

**bob** · 14:05
返信

- 箇条書き
- `code`
```

太字、斜体、打ち消し、インラインコード、コードブロック、リンク、リスト、引用、絵文字、メンションの表示名、添付ファイル名を保持します。スレッドが日をまたぐ場合、時刻は `YYYY-MM-DD HH:mm` になります。

## 対応範囲

- 対象は `https://app.slack.com/*` のみです。
- 開いている画面の DOM だけを読みます。未ロードの返信を自動取得しません。
- Slack Desktop、モバイル、ワークスペース全体のエクスポートには対応しません。
- 添付ファイルの中身はダウンロードしません。
- Slack の DOM が変わると動かなくなる可能性があります。コピーに失敗した場合は画面上のトーストとコンソールに理由を出します。

## 権限とデータの扱い

`clipboardWrite` 権限は、`MD` ボタンまたはショートカットを操作したときのクリップボード書き込みに使います。`content_scripts.matches` で `https://app.slack.com/*` にだけ拡張を読み込み、追加のホスト権限は要求しません。

外部サーバーへの送信、解析、ログ収集は行いません。メッセージの変換処理はブラウザ内で完結します。

詳細は[プライバシーポリシー](./PRIVACY.md)を参照してください。

## 開発

```sh
pnpm exec playwright install chromium
pnpm dev          # 変更を監視して dist を再ビルド
pnpm check        # lint、format、unit test、build
pnpm e2e          # Chromium に dist を読み込んだ fixture E2E
```

メッセージの特定と値の抽出は `src/slack-dom.ts`、本文内の rich text 変換は `src/markdown.ts`、選択範囲の抽出は `src/selection.ts` にまとめています。DOM 変更へ追従するときは、対象モジュールと fixture を同時に更新してください。

## リリース

拡張機能のバージョンは `package.json` で管理します。バージョン更新を `main` にマージしたあと、GitHub Actions の **Create release tag** を実行してください。対応する `v*` タグが作成され、Chrome Web Store に提出できる ZIP が GitHub Release に添付されます。CI でも、ビルド済みの拡張機能をバージョン付きArtifactとして保存します。

Chrome Web Store への公開処理は、GitHub Release の作成とは分離しています。

## ライセンス

[MIT](./LICENSE)
