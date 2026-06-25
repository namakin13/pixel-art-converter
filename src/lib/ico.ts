/** ICO に格納する1画像（PNGバイト列とその寸法）。 */
export interface IcoEntry {
  width: number;
  height: number;
  /** この画像の PNG エンコード済みバイト列。 */
  png: Uint8Array;
}

const HEADER_SIZE = 6;
const ENTRY_SIZE = 16;

/**
 * 複数サイズの PNG を 1 つの .ico バイナリにまとめる。
 * PNG を直接埋め込む形式（Windows Vista 以降が対応）。
 * 寸法は 1〜256。ICO の仕様上 256 は 0 として記録する。
 */
export function encodeIco(entries: IcoEntry[]): Uint8Array {
  if (entries.length === 0) throw new Error("画像が1つ以上必要です");
  for (const e of entries) {
    if (e.width < 1 || e.width > 256 || e.height < 1 || e.height > 256) {
      throw new Error(`アイコンの寸法は1〜256である必要があります: ${e.width}x${e.height}`);
    }
  }

  const totalPng = entries.reduce((s, e) => s + e.png.length, 0);
  const total = HEADER_SIZE + ENTRY_SIZE * entries.length + totalPng;
  const out = new Uint8Array(total);
  const view = new DataView(out.buffer);

  // ICONDIR ヘッダー
  view.setUint16(0, 0, true); // reserved
  view.setUint16(2, 1, true); // type = 1 (icon)
  view.setUint16(4, entries.length, true); // count

  // 画像データはエントリ群の後ろに連続して置く
  let dataOffset = HEADER_SIZE + ENTRY_SIZE * entries.length;
  entries.forEach((e, i) => {
    const eo = HEADER_SIZE + ENTRY_SIZE * i;
    out[eo] = e.width === 256 ? 0 : e.width; // 256 は 0 で表す
    out[eo + 1] = e.height === 256 ? 0 : e.height;
    out[eo + 2] = 0; // パレット色数（0 = 不使用）
    out[eo + 3] = 0; // reserved
    view.setUint16(eo + 4, 1, true); // color planes
    view.setUint16(eo + 6, 32, true); // bits per pixel
    view.setUint32(eo + 8, e.png.length, true); // この画像のバイト数
    view.setUint32(eo + 12, dataOffset, true); // ファイル先頭からのオフセット

    out.set(e.png, dataOffset);
    dataOffset += e.png.length;
  });

  return out;
}

/** アイコンとして一般的に使うサイズ一式。 */
export const ICON_SIZES = [16, 32, 48, 64, 128, 256] as const;
