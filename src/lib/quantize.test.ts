import { describe, it, expect } from "vitest";
import { PixelImage, RGBA } from "./types";
import { colorDistanceSq, nearestColor, medianCut, applyPalette } from "./quantize";

function img(width: number, height: number, pixels: RGBA[]): PixelImage {
  const data = new Uint8ClampedArray(width * height * 4);
  pixels.forEach((p, i) => {
    data[i * 4] = p.r;
    data[i * 4 + 1] = p.g;
    data[i * 4 + 2] = p.b;
    data[i * 4 + 3] = p.a;
  });
  return { width, height, data };
}

const RED: RGBA = { r: 255, g: 0, b: 0, a: 255 };
const GREEN: RGBA = { r: 0, g: 255, b: 0, a: 255 };
const BLUE: RGBA = { r: 0, g: 0, b: 255, a: 255 };

describe("colorDistanceSq / nearestColor", () => {
  it("同じ色は距離0", () => {
    expect(colorDistanceSq(RED, { ...RED })).toBe(0);
  });

  it("最も近いパレット色を選ぶ", () => {
    const near = nearestColor({ r: 250, g: 10, b: 5, a: 255 }, [RED, GREEN, BLUE]);
    expect(near).toEqual(RED);
  });

  it("空パレットは例外", () => {
    expect(() => nearestColor(RED, [])).toThrow();
  });
});

describe("medianCut", () => {
  it("3色画像を3色パレットにすると元の色を再現する", () => {
    const out = medianCut(img(3, 1, [RED, GREEN, BLUE]), 3);
    expect(out.length).toBe(3);
    // 各原色が含まれること（順不同）
    for (const target of [RED, GREEN, BLUE]) {
      const found = out.some((c) => colorDistanceSq(c, target) === 0);
      expect(found).toBe(true);
    }
  });

  it("色数より多く要求しても存在色数までしか返さない", () => {
    const out = medianCut(img(2, 1, [RED, RED]), 8);
    expect(out.length).toBe(1);
    expect(out[0]).toEqual(RED);
  });

  it("全透明画像は空パレット", () => {
    const transparent: RGBA = { r: 10, g: 20, b: 30, a: 0 };
    expect(medianCut(img(2, 1, [transparent, transparent]), 4)).toEqual([]);
  });

  it("maxColors < 1 は例外", () => {
    expect(() => medianCut(img(1, 1, [RED]), 0)).toThrow();
  });
});

describe("applyPalette", () => {
  it("各ピクセルが最近色に置換される", () => {
    const src = img(2, 1, [
      { r: 240, g: 5, b: 5, a: 255 },
      { r: 5, g: 240, b: 5, a: 255 },
    ]);
    const out = applyPalette(src, [RED, GREEN]);
    expect([out.data[0], out.data[1], out.data[2]]).toEqual([255, 0, 0]);
    expect([out.data[4], out.data[5], out.data[6]]).toEqual([0, 255, 0]);
  });

  it("透明ピクセルは透明のまま保たれる", () => {
    const src = img(1, 1, [{ r: 100, g: 100, b: 100, a: 0 }]);
    const out = applyPalette(src, [RED]);
    expect(out.data[3]).toBe(0);
  });

  it("元のアルファ値を保持する", () => {
    const src = img(1, 1, [{ r: 240, g: 0, b: 0, a: 128 }]);
    const out = applyPalette(src, [RED]);
    expect(out.data[3]).toBe(128);
  });
});
