# BizEngStudy

British business English pattern cards with a warm notebook-style UI, 200 cards, and three tap zones for audio.

- Left 50%: British English
- Middle-right 25%: Indian English
- Right 25%: American English

## Files

```text
index.html                 # main app
src/cards.js               # all card data; append here to add cards
assets/british_travel_badge.png
assets/british_travel_icon.png
manifest.webmanifest       # PWA metadata / icon
tools/validate-cards.cjs   # lightweight card validator
docs/chatgpt-card-addition-prompt.md
```

## Add cards with ChatGPT

The app is designed so future additions are mostly data-only.
Edit `src/cards.js` and append objects to `window.BIZ_ENG_CARDS`.

Each card uses this shape:

```js
{
  category: "確認",
  promptJa: "〜か確認します。",
  situation: "その場で引き取って確認する自然な表現。",
  hint: "",
  coreText: "I’ll check whether...",
  coreKana: "アイル チェック ウェザー",
  coreJa: "〜か確認します。",
  businessText: "I’ll check whether the invoice has been sent.",
  businessJa: "請求書が送られているか確認します。",
  commsText: "I’ll check whether the allied rear guard still has a viable withdrawal route.",
  commsJa: "友軍後衛にまだ実行可能な撤退経路があるか確認します。",
  markers: ["I’ll check whether"]
}
```

Then run:

```bash
npm run validate
```

No build step is required. Open `index.html` directly or publish the repository with GitHub Pages.

## GitHub Pages

After uploading to GitHub:

1. Open repository **Settings**
2. Go to **Pages**
3. Choose **Deploy from a branch**
4. Select `main` and `/root`

## Notes

This app uses the browser's Web Speech API. Voice quality depends on the device and installed voices.
