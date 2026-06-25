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
