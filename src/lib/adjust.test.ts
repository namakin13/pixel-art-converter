import { describe, it, expect } from "vitest";
import { PixelImage } from "./types";
import { applyAdjustments, isIdentity, NO_ADJUST } from "./adjust";

function px(r: number, g: number, b: number, a = 255): PixelImage {
  return { width: 1, height: 1, data: new Uint8ClampedArray([r, g, b, a]) };
}

describe("isIdentity", () => {
  it("全0は無調整", () => {
    expect(isIdentity(NO_ADJUST)).toBe(true);
    expect(isIdentity({ brightness: 1, contrast: 0, saturation: 0 })).toBe(false);
  });
});

describe("applyAdjustments", () => {
  it("無調整は同じ値（別配列）を返す", () => {
    const src = px(100, 150, 200);
    const out = applyAdjustments(src, NO_ADJUST);
    expect(Array.from(out.data)).toEqual([100, 150, 200, 255]);
    expect(out.data).not.toBe(src.data);
  });

  it("明度プラスで明るくなる", () => {
    const out = applyAdjustments(px(100, 100, 100), { ...NO_ADJUST, brightness: 20 });
    expect(out.data[0]).toBeGreaterThan(100);
  });

  it("明度マイナスで暗くなる", () => {
    const out = applyAdjustments(px(100, 100, 100), { ...NO_ADJUST, brightness: -20 });
    expect(out.data[0]).toBeLessThan(100);
  });

  it("彩度-100でグレースケール（R=G=B）になる", () => {
    const out = applyAdjustments(px(200, 50, 10), { ...NO_ADJUST, saturation: -100 });
    expect(out.data[0]).toBe(out.data[1]);
    expect(out.data[1]).toBe(out.data[2]);
  });

  it("値は0-255にクランプされる", () => {
    const out = applyAdjustments(px(250, 250, 250), { ...NO_ADJUST, brightness: 100 });
    expect(out.data[0]).toBe(255);
  });

  it("アルファは変更されない", () => {
    const out = applyAdjustments(px(100, 100, 100, 128), { ...NO_ADJUST, brightness: 50, contrast: 50 });
    expect(out.data[3]).toBe(128);
  });

  it("コントラストを上げると128から離れる方向に動く", () => {
    const high = applyAdjustments(px(200, 200, 200), { ...NO_ADJUST, contrast: 40 });
    expect(high.data[0]).toBeGreaterThan(200); // 128より上の値はさらに上へ
    const low = applyAdjustments(px(50, 50, 50), { ...NO_ADJUST, contrast: 40 });
    expect(low.data[0]).toBeLessThan(50); // 128より下の値はさらに下へ
  });
});
