# textlint-rule-ja-keigo

日本語の敬語使用をチェックするtextlintルールです。

## 概要

このルールパッケージは日本語の適切な敬語使用をサポートし、以下の敬語の問題を検出します：

1. **手動敬語（Manual Keigo）** - 不適切な「なります」の使用など
2. **二重敬語（Double Keigo）** - 尊敬語の重複使用
3. **尊敬語と謙譲語の混同（Confusion）** - 謙譲語と尊敬語の誤用
4. **不適切な「お・ご」の使用** - 自分側への尊敬語使用
5. **動詞形の誤用** - 「ご/お〜される」の不適切な使用

## インストール

<!-- ```bash
npm install textlint-rule-ja-keigo
# または
pnpm add textlint-rule-ja-keigo
# または
yarn add textlint-rule-ja-keigo
``` -->

## 使用方法

### .textlintrc設定（推奨: 個別ルールを指定）

本パッケージは複数ルールを内包しています。必要なものを個別に有効化してください。

```json
{
  "rules": {
    "ja-keigo/ja-keigo-manual": true,
    "ja-keigo/ja-keigo-double": true,
    "ja-keigo/ja-keigo-confusion": true,
    "ja-keigo/ja-keigo-inappropriate-o-go": true,
    "ja-keigo/ja-keigo-misuse-verb": true
  }
}
```

<!-- ## 検出例
### 1. 手動敬語（Manual Keigo）

❌ **不適切:**

- こちら、商品になります。

✅ **適切:**

- こちら、商品です。
- こちら、商品でございます。

### 2. 二重敬語（Double Keigo）

❌ **不適切:**

- 先生がお読みになられる。
- いらっしゃられる。

✅ **適切:**

- 先生がお読みになる。
- いらっしゃる。

### 3. 尊敬語と謙譲語の混同

❌ **不適切:**

- 担当者に伺ってください。

✅ **適切:**

- 担当者にお聞きください。
- 担当者にお尋ねください。

### 4. 不適切な「お・ご」の使用

❌ **不適切:**

- 弊社の御考え

✅ **適切:**

- 弊社の所存
- 弊社の意向

### 5. 動詞形の誤用

❌ **不適切:**

- 御利用される場合は

✅ **適切:**

- 御利用になる場合は
- 利用なさる場合は

## 開発
### プロジェクトのセットアップ

```bash
# 依存関係のインストール
pnpm install

# ビルド
pnpm build

# テスト実行
pnpm test
``` -->
