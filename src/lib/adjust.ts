import { PixelImage } from "./types";

export interface Adjustments {
  /** 明度 -100..100（0で無調整）。 */
  brightness: number;
  /** コントラスト -100..100（0で無調整）。 */
  contrast: number;
  /** 彩度 -100..100（0で無調整、-100でグレースケール）。 */
  saturation: number;
}

export const NO_ADJUST: Adjustments = { brightness: 0, contrast: 0, saturation: 0 };

function clamp(v: number): number {
  return v < 0 ? 0 : v > 255 ? 255 : v;
}

/** すべて0なら無調整。 */
export function isIdentity(a: Adjustments): boolean {
  return a.brightness === 0 && a.contrast === 0 && a.saturation === 0;
}

/**
 * 明度・コントラスト・彩度を適用した新しい PixelImage を返す。
 * 透明度(アルファ)は変更しない。
 */
export function applyAdjustments(img: PixelImage, a: Adjustments): PixelImage {
  const out: PixelImage = {
    width: img.width,
    height: img.height,
    data: new Uint8ClampedArray(img.data),
  };
  if (isIdentity(a)) return out;

  const bright = (a.brightness / 100) * 255;
  // コントラスト係数（標準的な式）
  const c = (a.contrast / 100) * 255;
  const cf = (259 * (c + 255)) / (255 * (259 - c));
  const sat = 1 + a.saturation / 100;

  for (let i = 0; i < img.width * img.height; i++) {
    let r = img.data[i * 4];
    let g = img.data[i * 4 + 1];
    let b = img.data[i * 4 + 2];

    // 明度
    r += bright;
    g += bright;
    b += bright;

    // コントラスト（128中心）
    r = cf * (r - 128) + 128;
    g = cf * (g - 128) + 128;
    b = cf * (b - 128) + 128;

    // 彩度（輝度との線形補間）
    const gray = 0.299 * r + 0.587 * g + 0.114 * b;
    r = gray + (r - gray) * sat;
    g = gray + (g - gray) * sat;
    b = gray + (b - gray) * sat;

    out.data[i * 4] = clamp(r);
    out.data[i * 4 + 1] = clamp(g);
    out.data[i * 4 + 2] = clamp(b);
    // アルファはそのまま
  }
  return out;
}
