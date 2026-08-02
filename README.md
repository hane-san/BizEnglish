# 英国英語リスニング432

日本語から英文を思い出し、カードをタップして英語表示と音声で確認する学習アプリです。

- 英国ビジネス英語 216文
- 旅行・思い出・映画・ライブ英語 216文
- 順番どおり／ランダム再生
- UK／US／India音声と速度変更
- 学習位置と設定をブラウザに保存

## Files

```text
index.html                 # 432文を収録したスタンドアロンアプリ
assets/british_travel_badge.png
assets/british_travel_icon.png
manifest.webmanifest       # PWAメタデータ（既存アイコンを継続使用）
```

No build step is required. Open `index.html` directly or publish the repository with GitHub Pages.

## GitHub Pages

公開設定:

1. Open repository **Settings**
2. Go to **Pages**
3. Choose **Deploy from a branch**
4. Select `main` and `/root`

## Notes

音声にはブラウザのWeb Speech APIを使用しています。選べる声と品質は端末・ブラウザにより異なります。
