import { describe, it, expect } from "vitest";
import { PixelImage } from "./types";
import { pixelate, targetSize } from "./pixelate";

/** テスト用に、単色塗りの画像を作る。 */
function solid(width: number, height: number, r: number, g: number, b: number, a = 255): PixelImage {
  const data = new Uint8ClampedArray(width * height * 4);
  for (let i = 0; i < width * height; i++) {
    data[i * 4] = r;
    data[i * 4 + 1] = g;
    data[i * 4 + 2] = b;
    data[i * 4 + 3] = a;
  }
  return { width, height, data };
}

describe("targetSize", () => {
  it("アスペクト比を保って横幅を縮める", () => {
    expect(targetSize(100, 50, 10)).toEqual({ width: 10, height: 5 });
  });

  it("元より大きい横幅は元サイズに丸める", () => {
    expect(targetSize(8, 8, 64)).toEqual({ width: 8, height: 8 });
  });

  it("高さは最低1pxを保証する", () => {
    expect(targetSize(1000, 10, 4).height).toBe(1);
  });

  it("不正な入力で例外を投げる", () => {
    expect(() => targetSize(0, 10, 4)).toThrow();
    expect(() => targetSize(10, 10, 0)).toThrow();
  });
});

describe("pixelate", () => {
  it("単色画像は縮小しても同じ色を保つ", () => {
    const src = solid(8, 8, 120, 60, 30);
    const out = pixelate(src, 2);
    expect(out.width).toBe(2);
    expect(out.height).toBe(2);
    for (let i = 0; i < out.width * out.height; i++) {
      expect(out.data[i * 4]).toBe(120);
      expect(out.data[i * 4 + 1]).toBe(60);
      expect(out.data[i * 4 + 2]).toBe(30);
      expect(out.data[i * 4 + 3]).toBe(255);
    }
  });

  it("2x2のブロックを平均して1pxにする", () => {
    // 左上 黒(0)、それ以外 白(255) の 2x2 → 平均 ≒ 191
    const data = new Uint8ClampedArray([
      0, 0, 0, 255, 255, 255, 255, 255,
      255, 255, 255, 255, 255, 255, 255, 255,
    ]);
    const src: PixelImage = { width: 2, height: 2, data };
    const out = pixelate(src, 1);
    expect(out.width).toBe(1);
    expect(out.height).toBe(1);
    // (0 + 255*3) / 4 = 191.25 → 191
    expect(out.data[0]).toBe(191);
    expect(out.data[3]).toBe(255);
  });

  it("完全透明ピクセルは色平均に影響しない（アルファ加重）", () => {
    // 不透明な赤 + 透明な緑 → 出力色は赤、アルファは平均(約128)
    const data = new Uint8ClampedArray([
      255, 0, 0, 255, 0, 255, 0, 0,
    ]);
    const src: PixelImage = { width: 2, height: 1, data };
    const out = pixelate(src, 1);
    expect(out.data[0]).toBe(255); // r
    expect(out.data[1]).toBe(0); // g（透明緑は無視される）
    expect(out.data[2]).toBe(0); // b
    expect(out.data[3]).toBe(128); // alpha = (255+0)/2 ≒ 128
  });
});
