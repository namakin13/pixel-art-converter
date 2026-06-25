import { describe, it, expect } from "vitest";
import { PixelImage, RGBA } from "./types";
import { ditherFloydSteinberg } from "./dither";

function gray(width: number, height: number, value: number): PixelImage {
  const data = new Uint8ClampedArray(width * height * 4);
  for (let i = 0; i < width * height; i++) {
    data[i * 4] = value;
    data[i * 4 + 1] = value;
    data[i * 4 + 2] = value;
    data[i * 4 + 3] = 255;
  }
  return { width, height, data };
}

const BLACK: RGBA = { r: 0, g: 0, b: 0, a: 255 };
const WHITE: RGBA = { r: 255, g: 255, b: 255, a: 255 };

describe("ditherFloydSteinberg", () => {
  it("出力の全ピクセルがパレット内の色になる", () => {
    const out = ditherFloydSteinberg(gray(8, 8, 128), [BLACK, WHITE]);
    for (let i = 0; i < out.width * out.height; i++) {
      const r = out.data[i * 4];
      expect(r === 0 || r === 255).toBe(true);
    }
  });

  it("中間グレーを白黒2色に振ると黒白が混在する", () => {
    const out = ditherFloydSteinberg(gray(8, 8, 128), [BLACK, WHITE]);
    let blacks = 0;
    let whites = 0;
    for (let i = 0; i < out.width * out.height; i++) {
      if (out.data[i * 4] === 0) blacks++;
      else whites++;
    }
    expect(blacks).toBeGreaterThan(0);
    expect(whites).toBeGreaterThan(0);
  });

  it("平均輝度が元画像に近い（誤差拡散の性質）", () => {
    const out = ditherFloydSteinberg(gray(16, 16, 128), [BLACK, WHITE]);
    let sum = 0;
    for (let i = 0; i < out.width * out.height; i++) sum += out.data[i * 4];
    const avg = sum / (out.width * out.height);
    expect(Math.abs(avg - 128)).toBeLessThan(20);
  });

  it("透明ピクセルは透明のまま保たれる", () => {
    const data = new Uint8ClampedArray([100, 100, 100, 0]);
    const img: PixelImage = { width: 1, height: 1, data };
    const out = ditherFloydSteinberg(img, [BLACK, WHITE]);
    expect(out.data[3]).toBe(0);
  });

  it("空パレットは例外", () => {
    expect(() => ditherFloydSteinberg(gray(2, 2, 100), [])).toThrow();
  });
});
