import { PixelImage, RGBA } from "./types";

export interface OutlineOptions {
  /** 縁取りの色。省略時は濃い色（#1a1a2e 相当）。 */
  color?: RGBA;
  /**
   * 隣接ピクセルとの輝度差がこの値(0-255)を超えたら内部の輪郭線とみなす。
   * 0 にすると内部線は引かず、シルエットの縁取りのみになる。
   */
  edgeThreshold?: number;
  /** 不透明領域と透明領域の境界をシルエットとして縁取るか。既定 true。 */
  silhouette?: boolean;
}

const DEFAULT_COLOR: RGBA = { r: 26, g: 26, b: 46, a: 255 };

/** アルファ加重なしの単純輝度（0-255）。 */
function luma(data: Uint8ClampedArray, i: number): number {
  return 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
}

function isOpaque(data: Uint8ClampedArray, i: number): boolean {
  return data[i + 3] >= 128;
}

/**
 * ピクセル化済み画像にアウトライン（縁取り・輪郭線）を乗せて
 * ポップでくっきりした見た目にする。元画像は変更せず新しい画像を返す。
 *
 * - シルエット: 不透明ピクセルのうち、上下左右に透明ピクセルが隣接するものを縁取る。
 * - 内部線: 隣接する不透明ピクセルとの輝度差が edgeThreshold を超える箇所に線を引く。
 */
export function applyOutline(img: PixelImage, options: OutlineOptions = {}): PixelImage {
  const { width, height } = img;
  const src = img.data;
  const out: PixelImage = { width, height, data: new Uint8ClampedArray(src) };
  const color = options.color ?? DEFAULT_COLOR;
  const threshold = options.edgeThreshold ?? 48;
  const silhouette = options.silhouette ?? true;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      if (!isOpaque(src, i)) continue;

      const left = x > 0 ? i - 4 : -1;
      const right = x < width - 1 ? i + 4 : -1;
      const up = y > 0 ? i - width * 4 : -1;
      const down = y < height - 1 ? i + width * 4 : -1;
      const neighbors = [left, right, up, down];

      let mark = false;
      for (const n of neighbors) {
        if (n < 0) {
          // 画像端は透明扱い → 端のシルエットも縁取る
          if (silhouette) mark = true;
          continue;
        }
        if (!isOpaque(src, n)) {
          if (silhouette) mark = true;
        } else if (threshold > 0 && Math.abs(luma(src, i) - luma(src, n)) > threshold) {
          mark = true;
        }
      }

      if (mark) {
        const o = i;
        out.data[o] = color.r;
        out.data[o + 1] = color.g;
        out.data[o + 2] = color.b;
        out.data[o + 3] = color.a;
      }
    }
  }
  return out;
}
