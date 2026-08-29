# English through Stories

青空文庫作品を、日本語原文（または青空文庫掲載の日本語訳）と Modern British English の2列で読み、Web Speech APIで反復できる文学英語リーダーです。

現在の収録作品:

- 🏃 走れメロス — 001〜015
- ⛰️ 遠野物語 — 001〜015
- ⛩️ 羅生門 — 001〜005
- 🧥 外套 — 001〜015

## Reader features

- 日本語セル: 対応する英語全文を再生
- 英語セル: `**太字**` の学習チャンクを再生
- セル左70% = UK / 右30% = US
- 0.86 / 1.0 / 1.12 再生速度
- 見ないで操作: タップで再生、上フリックで次、下フリックで前
- 遠野物語などの数字だけの話数行は音声対象から自動除外
- 最後の作品・章・行・スクロール位置・速度・見ないでモードを `localStorage` に保存
- 起動時は前回位置を復元するが、音声は自動再生しない

## Architecture

Notionを教材の source of truth、GitHubの `data/` を配信用コピーとして扱います。本文はUIコードへ直書きしません。

```text
index.html                  # PWA / GitHub Pages の入口 → literature.html
literature.html             # 本番リーダー画面
literature-app.js            # 読込・音声・前回位置・ジェスチャー
literature-ui.css            # リーダーUI
literature-copy.js           # 英語セル長押しコピー
data/story-catalog.js        # 作品カタログ
data/melos.js                # 走れメロス（既存bundle形式）
data/rashomon.js             # 羅生門（既存bundle形式）
data/tono/001.js ... 015.js  # 遠野物語
data/overcoat/001.js ...     # 外套
manifest.webmanifest         # PWA metadata
```

新規作品は原則 `data/<work-id>/001.js` のように **1 Notion分冊 = 1データファイル** とし、`data/story-catalog.js` に作品を登録します。これによりNotionで1章だけ修正した場合、対応する1ファイルだけを更新できます。

## Data format

```js
window.STORY_SECTIONS=window.STORY_SECTIONS||{};
window.STORY_SECTIONS['work-id:001']={id:'001',rows:[
  [String.raw`日本語`,String.raw`English with **reusable chunk**.`]
]};
```

`**太字**` は表示上の強調とチャンク音声の両方に利用するため、同期時に残してください。

## Deploy

Build stepはありません。GitHub Pagesで `main` / `/root` を公開すれば動作します。

音声はブラウザのWeb Speech APIを使用するため、利用できるvoiceはOS・ブラウザによって異なります。
