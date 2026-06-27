# ドット絵コンバーター (pixel-art-converter)

イラスト画像をドット絵（ピクセルアート）に変換するデスクトップアプリです。

## ダウンロード

Windows 用インストーラーは [Releases](https://github.com/namakin13/pixel-art-converter/releases) から入手できます。

## 主な機能

- 画像の読み込み（ファイル選択 / ドラッグ＆ドロップ / クリップボード貼り付け）
- ピクセル化（出力解像度の指定）
- 減色（自動メディアンカット / 有名パレット / 減色なし）
  - 同梱パレット: Game Boy・PICO-8・CGA・NES 風・**POP ビビッド**
  - Floyd–Steinberg ディザリング対応
- 明度・コントラスト・彩度の補正
- **POP変換** — 彩度/コントラスト強調＋ビビッドパレット＋アウトライン（縁取り・輪郭線）を
  一括適用し、デフォルメ風のポップなドット絵にするプリセット
- ドット絵エディタ（描画・反転/回転・ミラー描画・Undo/Redo）
- PNG 書き出し（最近傍法で整数倍に拡大）

## 技術スタック

- [Tauri 2](https://tauri.app/) — デスクトップアプリ基盤
- React 19 + TypeScript
- Vite

## 開発

```bash
npm install
npm run test         # 単体テスト(Vitest)
npm run tauri dev    # 開発用にアプリを起動
npm run gen-icon     # アプリアイコン(assets/app-icon.png)を再生成
npm run tauri build  # 配布用ビルド（NSISインストーラー生成）
```

## インストーラー

`npm run tauri build` を実行すると、Windows用インストーラーが以下に生成されます。

```
src-tauri/target/release/bundle/nsis/ドット絵コンバーター_<version>_x64-setup.exe
```

## ライセンス

MIT
