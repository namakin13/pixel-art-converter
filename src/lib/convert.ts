import { PixelImage, RGBA, createImage } from "./types";
import { pixelate } from "./pixelate";
import { medianCut, applyPalette } from "./quantize";

export interface ConvertOptions {
  /** 出力の横ドット数。 */
  targetWidth: number;
  /**
   * 減色のパレット指定。
   * - { kind: "auto", colors } … 画像から自動生成（メディアンカット）
   * - { kind: "fixed", colors } … 与えたパレットに最近色マッピング
   * - { kind: "none" } … 減色しない（ピクセル化のみ）
   */
  palette:
    | { kind: "auto"; colors: number }
    | { kind: "fixed"; colors: RGBA[] }
    | { kind: "none" };
}

export interface ConvertResult {
  image: PixelImage;
  /** 実際に使われたパレット（none の場合は空）。 */
  palette: RGBA[];
}

/** ピクセル化→減色を通して変換する。 */
export function convert(src: PixelImage, options: ConvertOptions): ConvertResult {
  const pixelated = pixelate(src, options.targetWidth);

  if (options.palette.kind === "none") {
    return { image: pixelated, palette: [] };
  }

  const palette =
    options.palette.kind === "auto"
      ? medianCut(pixelated, options.palette.colors)
      : options.palette.colors;

  if (palette.length === 0) {
    // 全透明などでパレットが作れない場合はピクセル化結果をそのまま返す
    return { image: pixelated, palette: [] };
  }

  return { image: applyPalette(pixelated, palette), palette };
}

/**
 * 最近傍法で整数倍に拡大する。ドットのにじみを防ぐ表示・書き出し用。
 * factor は 1 以上の整数。
 */
export function scaleNearest(img: PixelImage, factor: number): PixelImage {
  if (!Number.isInteger(factor) || factor < 1) {
    throw new Error("factor は 1 以上の整数である必要があります");
  }
  if (factor === 1) {
    return { width: img.width, height: img.height, data: img.data.slice() };
  }
  const out = createImage(img.width * factor, img.height * factor);
  for (let y = 0; y < img.height; y++) {
    for (let x = 0; x < img.width; x++) {
      const si = (y * img.width + x) * 4;
      for (let dy = 0; dy < factor; dy++) {
        for (let dx = 0; dx < factor; dx++) {
          const di = ((y * factor + dy) * out.width + (x * factor + dx)) * 4;
          out.data[di] = img.data[si];
          out.data[di + 1] = img.data[si + 1];
          out.data[di + 2] = img.data[si + 2];
          out.data[di + 3] = img.data[si + 3];
        }
      }
    }
  }
  return out;
}

/** ImageData 互換オブジェクト（{data,width,height}）から PixelImage を作る。 */
export function fromImageData(src: { data: Uint8ClampedArray; width: number; height: number }): PixelImage {
  return { width: src.width, height: src.height, data: new Uint8ClampedArray(src.data) };
}
