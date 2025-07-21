<p align="center">
  <img src="icons/icon256.png" width="128" alt="iHeaderFox logo">
</p>

<h1 align="center">iHeaderFox</h1>
<p align="center">Lightweight tool to inspect AI-generated PNG metadata, when present.</p>

---

## ✨ What it does
* Adds **“View embedded metadata”** to the right-click menu of any PNG on the web.  
* Pops up a sleek, resizable *lens* that shows every `tEXt` chunk (often the prompt & model info for AI images).  
* Supports **multiple languages** (currently English & 日本語).  
* Works even when sites strip metadata from cached images—iHeaderFox automatically fetches a fresh, un-optimised copy for you.  
* 100 % client-side: no servers, no data leaves your browser.

> **Original concept by <https://github.com/Regalia6666> — iHeaderFox builds on and extends that idea.**

---

## 🛠 Installation
1. Clone or download this repository.  
2. Head to `chrome://extensions`, enable **Developer mode**.  
3. Click **Load unpacked** and select the `iHeaderFox/` folder.  
4. That’s it! Right-click any PNG → **View embedded metadata**.

---

## 🌍 Languages

| UI · Lens · Menu | Status |
|------------------|--------|
| English          | ✅ |
| 日本語            | ✅ |

Want to add another language?  
Create a new `i18n/yourlang.json` (see `english.json` for schema) and add the file name to the `AVAILABLE` array in `popup.js`.

---

## ⚖️ Permissions

| Permission                | Why it’s needed |
|---------------------------|-----------------|
| `contextMenus`            | Add the right-click item |
| `scripting`               | Inject the lens & CSS |
| `activeTab`               | Allow injection into the current page |
| `storage`                 | Save language preference |
| `host_permissions: *`     | Fetch a fresh copy of any image (cache-busting) |

No analytics, no tracking.

## 日本語 README

### ✨ 機能
* PNG 画像を右クリックして **「埋め込みメタデータを表示」**。  
* AI 画像に含まれる `tEXt` チャンク（プロンプトやモデル情報など）を、スクロール可能な *レンズ* で一覧表示。  
* **多言語対応**（英語 / 日本語）。  
* サイト側でメタデータが削除されても大丈夫。iHeaderFox は自動的に未加工の画像を再取得して解析します。  
* 完全ローカル動作。データはブラウザ外へ送信されません。

> **発案: <https://github.com/Regalia6666>** — 本拡張はアイデアを拡張・実装したものです。

### 🛠 インストール
1. このリポジトリをクローン or ダウンロード。  
2. `chrome://extensions` を開き、**デベロッパーモード**を有効化。  
3. **「パッケージ化されていない拡張機能を読み込む」** をクリックし、`iHeaderFox/` フォルダを選択。  
4. 以上です！ PNG を右クリック → **「埋め込みメタデータを表示」**。

### 🌍 言語追加
`i18n/` に JSON を追加し、`popup.js` の `AVAILABLE` 配列へファイル名を追記してください。

### ⚖️ 権限
最小限の権限のみ使用し、解析はすべてローカルで完結します。

---

Happy inspecting! 🦊🔍
