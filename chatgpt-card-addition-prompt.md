# ChatGPTでカードを追加するためのプロンプト

`src/cards.js` をChatGPTに渡して、次のように依頼してください。

```text
この `window.BIZ_ENG_CARDS` 配列に、既存カテゴリを維持したままカードを20枚追加してください。
各カードは以下のフィールドを必ず持たせてください。
category / promptJa / situation / hint / coreText / coreKana / coreJa / businessText / businessJa / commsText / commsJa / markers

方針：
- 英語は英国ビジネス英語寄り。
- businessText は短く、会議・メール・業務指示で使える文にする。
- commsText は友軍通信・作戦ブリーフィング・防衛/撤退/支援などのテーマで、ややSF/軍事通信風にする。
- markers は businessText / commsText 内に実在する核表現を入れる。
- 音声用に `...` は表示には使ってよいが、過剰なドット連続は避ける。
- 日本語は自然な文にする。直訳くさすぎる表現は避ける。
```

追加後はローカルで次を実行します。

```bash
node tools/validate-cards.cjs
```

GitHub上で直接編集する場合は、`src/cards.js` の配列末尾にカードオブジェクトを追加してコミットしてください。
