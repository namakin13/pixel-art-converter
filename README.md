# ドット絵コンバーター (pixel-art-converter)

イラスト画像をドット絵（ピクセルアート）に変換するデスクトップアプリです。

## 機能（予定）

- 画像ファイルの読み込み（PNG / JPEG など）
- ピクセル化（解像度・ドットサイズの調整）
- 減色（パレット数の指定）
- 変換結果のプレビューと書き出し

## 技術スタック

- [Tauri 2](https://tauri.app/) — デスクトップアプリ基盤
- React 19 + TypeScript
- Vite

## 開発

```bash
npm install
npm run tauri dev    # 開発用にアプリを起動
npm run tauri build  # 配布用ビルド
```

## ライセンス

MIT
