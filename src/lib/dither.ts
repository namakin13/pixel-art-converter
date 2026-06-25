import { PixelImage, RGBA } from "./types";
import { nearestColor } from "./quantize";

/** アルファがこの値未満のピクセルは透明として扱い、誤差拡散の対象外にする。 */
const ALPHA_THRESHOLD = 8;

/**
 * Floyd–Steinberg 誤差拡散ディザリングでパレットに減色する。
 * 量子化誤差を近傍ピクセルへ拡散し、少ない色数でも階調を表現する。
 * 透明ピクセルはそのまま透明を保ち、誤差の授受もしない。
 */
export function ditherFloydSteinberg(img: PixelImage, palette: RGBA[]): PixelImage {
  if (palette.length === 0) throw new Error("パレットが空です");

  const { width, height } = img;
  // RGB を float で保持する作業バッファ（誤差を載せるため）
  const buf = new Float32Array(width * height * 3);
  for (let i = 0; i < width * height; i++) {
    buf[i * 3] = img.data[i * 4];
    buf[i * 3 + 1] = img.data[i * 4 + 1];
    buf[i * 3 + 2] = img.data[i * 4 + 2];
  }

  // 出力にはパレット内の確定色(0-255)のみ書き込むのでクランプ配列で問題ない
  const out: PixelImage = {
    width,
    height,
    data: new Uint8ClampedArray(img.data.length),
  };

  const diffuse = (x: number, y: number, er: number, eg: number, eb: number, f: number) => {
    if (x < 0 || x >= width || y < 0 || y >= height) return;
    const a = img.data[(y * width + x) * 4 + 3];
    if (a < ALPHA_THRESHOLD) return; // 透明ピクセルには誤差を渡さない
    const j = (y * width + x) * 3;
    buf[j] += (er * f) / 16;
    buf[j + 1] += (eg * f) / 16;
    buf[j + 2] += (eb * f) / 16;
  };

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      const a = img.data[idx * 4 + 3];
      if (a < ALPHA_THRESHOLD) {
        out.data[idx * 4 + 3] = 0;
        continue;
      }
      const old: RGBA = {
        r: buf[idx * 3],
        g: buf[idx * 3 + 1],
        b: buf[idx * 3 + 2],
        a: 255,
      };
      const c = nearestColor(old, palette);
      out.data[idx * 4] = c.r;
      out.data[idx * 4 + 1] = c.g;
      out.data[idx * 4 + 2] = c.b;
      out.data[idx * 4 + 3] = a;

      const er = old.r - c.r;
      const eg = old.g - c.g;
      const eb = old.b - c.b;
      diffuse(x + 1, y, er, eg, eb, 7);
      diffuse(x - 1, y + 1, er, eg, eb, 3);
      diffuse(x, y + 1, er, eg, eb, 5);
      diffuse(x + 1, y + 1, er, eg, eb, 1);
    }
  }

  return out;
}
