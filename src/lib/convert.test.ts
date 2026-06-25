import { describe, it, expect } from "vitest";
import { PixelImage, RGBA } from "./types";
import { convert, scaleNearest, fromImageData } from "./convert";
import { colorDistanceSq } from "./quantize";

function checker(): PixelImage {
  // 4x4 の赤/青チェッカー
  const red: RGBA = { r: 255, g: 0, b: 0, a: 255 };
  const blue: RGBA = { r: 0, g: 0, b: 255, a: 255 };
  const data = new Uint8ClampedArray(4 * 4 * 4);
  for (let y = 0; y < 4; y++) {
    for (let x = 0; x < 4; x++) {
      const c = (x + y) % 2 === 0 ? red : blue;
      const i = (y * 4 + x) * 4;
      data[i] = c.r;
      data[i + 1] = c.g;
      data[i + 2] = c.b;
      data[i + 3] = c.a;
    }
  }
  return { width: 4, height: 4, data };
}

describe("convert", () => {
  it("palette none はピクセル化のみ行う", () => {
    const out = convert(checker(), { targetWidth: 2, palette: { kind: "none" } });
    expect(out.image.width).toBe(2);
    expect(out.image.height).toBe(2);
    expect(out.palette).toEqual([]);
  });

  it("auto パレットは指定色数以内のパレットを返す", () => {
    const out = convert(checker(), { targetWidth: 4, palette: { kind: "auto", colors: 2 } });
    expect(out.palette.length).toBeGreaterThan(0);
    expect(out.palette.length).toBeLessThanOrEqual(2);
  });

  it("fixed パレットは全ピクセルがパレット内の色になる", () => {
    const green: RGBA = { r: 0, g: 255, b: 0, a: 255 };
    const out = convert(checker(), { targetWidth: 4, palette: { kind: "fixed", colors: [green] } });
    for (let i = 0; i < out.image.width * out.image.height; i++) {
      const c: RGBA = {
        r: out.image.data[i * 4],
        g: out.image.data[i * 4 + 1],
        b: out.image.data[i * 4 + 2],
        a: 255,
      };
      expect(colorDistanceSq(c, green)).toBe(0);
    }
  });
});

describe("scaleNearest", () => {
  it("factor=1 はデータ複製（同一内容・別配列）", () => {
    const src = checker();
    const out = scaleNearest(src, 1);
    expect(out.data).not.toBe(src.data);
    expect(Array.from(out.data)).toEqual(Array.from(src.data));
  });

  it("factor=2 で縦横2倍、各ドットが2x2に複製される", () => {
    const src: PixelImage = {
      width: 1,
      height: 1,
      data: new Uint8ClampedArray([10, 20, 30, 255]),
    };
    const out = scaleNearest(src, 2);
    expect(out.width).toBe(2);
    expect(out.height).toBe(2);
    for (let i = 0; i < 4; i++) {
      expect([out.data[i * 4], out.data[i * 4 + 1], out.data[i * 4 + 2], out.data[i * 4 + 3]]).toEqual([
        10, 20, 30, 255,
      ]);
    }
  });

  it("非整数や0以下の factor は例外", () => {
    expect(() => scaleNearest(checker(), 1.5)).toThrow();
    expect(() => scaleNearest(checker(), 0)).toThrow();
  });
});

describe("fromImageData", () => {
  it("ImageData互換オブジェクトをコピーして変換する", () => {
    const data = new Uint8ClampedArray([1, 2, 3, 4]);
    const img = fromImageData({ data, width: 1, height: 1 });
    expect(img.width).toBe(1);
    expect(Array.from(img.data)).toEqual([1, 2, 3, 4]);
    expect(img.data).not.toBe(data); // コピーされている
  });
});
