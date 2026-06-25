import { PixelImage, createImage } from "./types";

/**
 * 目標の横ドット数からアスペクト比を保った出力サイズを求める。
 * 高さは最低 1px を保証する。
 */
export function targetSize(
  srcWidth: number,
  srcHeight: number,
  targetWidth: number,
): { width: number; height: number } {
  if (srcWidth <= 0 || srcHeight <= 0) {
    throw new Error("元画像のサイズが不正です");
  }
  if (targetWidth <= 0) {
    throw new Error("targetWidth は 1 以上である必要があります");
  }
  const w = Math.min(targetWidth, srcWidth);
  const h = Math.max(1, Math.round((w * srcHeight) / srcWidth));
  return { width: w, height: h };
}

/**
 * ブロック平均によるダウンサンプル。出力の各ピクセルは、対応する元画像領域の
 * 平均色（アルファ加重）になる。これがドット絵化の基礎処理。
 */
export function pixelate(src: PixelImage, targetWidth: number): PixelImage {
  const { width: outW, height: outH } = targetSize(src.width, src.height, targetWidth);
  const out = createImage(outW, outH);

  const scaleX = src.width / outW;
  const scaleY = src.height / outH;

  for (let oy = 0; oy < outH; oy++) {
    const y0 = Math.floor(oy * scaleY);
    const y1 = Math.max(y0 + 1, Math.floor((oy + 1) * scaleY));
    for (let ox = 0; ox < outW; ox++) {
      const x0 = Math.floor(ox * scaleX);
      const x1 = Math.max(x0 + 1, Math.floor((ox + 1) * scaleX));

      let rSum = 0;
      let gSum = 0;
      let bSum = 0;
      let aSum = 0;
      let count = 0;

      for (let sy = y0; sy < y1; sy++) {
        for (let sx = x0; sx < x1; sx++) {
          const i = (sy * src.width + sx) * 4;
          const a = src.data[i + 3];
          // 色はアルファで加重平均（透明部分の色に引っ張られないように）
          rSum += src.data[i] * a;
          gSum += src.data[i + 1] * a;
          bSum += src.data[i + 2] * a;
          aSum += a;
          count++;
        }
      }

      const oi = (oy * outW + ox) * 4;
      if (aSum > 0) {
        out.data[oi] = Math.round(rSum / aSum);
        out.data[oi + 1] = Math.round(gSum / aSum);
        out.data[oi + 2] = Math.round(bSum / aSum);
      }
      out.data[oi + 3] = count > 0 ? Math.round(aSum / count) : 0;
    }
  }

  return out;
}
