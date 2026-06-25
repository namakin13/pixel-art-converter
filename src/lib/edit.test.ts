import { describe, it, expect } from "vitest";
import { PixelImage, RGBA, createImage, getPixel, setPixel } from "./types";
import { paintPixel, drawLine, floodFill, pickColor, cloneImage, createCanvas, TRANSPARENT } from "./edit";

const RED: RGBA = { r: 255, g: 0, b: 0, a: 255 };
const BLUE: RGBA = { r: 0, g: 0, b: 255, a: 255 };

function filled(w: number, h: number, c: RGBA): PixelImage {
  const img = createImage(w, h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) setPixel(img, x, y, c);
  return img;
}

describe("cloneImage / paintPixel", () => {
  it("paintPixel は元画像を変更しない（非破壊）", () => {
    const src = createImage(3, 3);
    const out = paintPixel(src, 1, 1, RED);
    expect(getPixel(out, 1, 1)).toEqual(RED);
    expect(getPixel(src, 1, 1).a).toBe(0); // 元は透明のまま
  });

  it("cloneImage はデータをコピーする", () => {
    const src = filled(2, 2, RED);
    const c = cloneImage(src);
    expect(c.data).not.toBe(src.data);
    expect(Array.from(c.data)).toEqual(Array.from(src.data));
  });
});

describe("drawLine", () => {
  it("水平線の全ドットを塗る", () => {
    const out = drawLine(createImage(5, 1), 0, 0, 4, 0, RED);
    for (let x = 0; x < 5; x++) expect(getPixel(out, x, 0)).toEqual(RED);
  });

  it("対角線は始点と終点を含む", () => {
    const out = drawLine(createImage(4, 4), 0, 0, 3, 3, BLUE);
    expect(getPixel(out, 0, 0)).toEqual(BLUE);
    expect(getPixel(out, 3, 3)).toEqual(BLUE);
  });

  it("1点（始点=終点）も塗る", () => {
    const out = drawLine(createImage(3, 3), 1, 1, 1, 1, RED);
    expect(getPixel(out, 1, 1)).toEqual(RED);
  });
});

describe("floodFill", () => {
  it("同色で繋がった全域を塗り替える", () => {
    const out = floodFill(filled(3, 3, RED), 0, 0, BLUE);
    for (let y = 0; y < 3; y++) for (let x = 0; x < 3; x++) expect(getPixel(out, x, y)).toEqual(BLUE);
  });

  it("異なる色の境界を越えない", () => {
    // 中央縦に青の壁、左半分が赤
    const img = filled(3, 1, RED);
    setPixel(img, 1, 0, BLUE);
    const out = floodFill(img, 0, 0, { r: 0, g: 255, b: 0, a: 255 });
    expect(getPixel(out, 0, 0)).toEqual({ r: 0, g: 255, b: 0, a: 255 });
    expect(getPixel(out, 1, 0)).toEqual(BLUE); // 壁は残る
    expect(getPixel(out, 2, 0)).toEqual(RED); // 壁の向こうは塗られない
  });

  it("塗る色が現在色と同じなら変化しない", () => {
    const out = floodFill(filled(2, 2, RED), 0, 0, RED);
    for (let i = 0; i < 4; i++) expect(out.data[i * 4]).toBe(255);
  });

  it("範囲外起点は何もしない", () => {
    const src = filled(2, 2, RED);
    const out = floodFill(src, 5, 5, BLUE);
    expect(Array.from(out.data)).toEqual(Array.from(src.data));
  });

  it("透明領域を色で塗れる", () => {
    const out = floodFill(createImage(2, 2), 0, 0, RED);
    for (let y = 0; y < 2; y++) for (let x = 0; x < 2; x++) expect(getPixel(out, x, y)).toEqual(RED);
  });
});

describe("createCanvas", () => {
  it("bg=null は全透明", () => {
    const img = createCanvas(3, 2, null);
    expect(img.width).toBe(3);
    expect(img.height).toBe(2);
    for (let i = 0; i < 6; i++) expect(img.data[i * 4 + 3]).toBe(0);
  });

  it("色を指定すると全面塗りつぶし", () => {
    const img = createCanvas(2, 2, RED);
    for (let i = 0; i < 4; i++) {
      expect(img.data[i * 4]).toBe(255);
      expect(img.data[i * 4 + 3]).toBe(255);
    }
  });

  it("サイズ0以下は例外", () => {
    expect(() => createCanvas(0, 5, null)).toThrow();
  });
});

describe("pickColor", () => {
  it("指定座標の色を返す", () => {
    const img = filled(2, 2, BLUE);
    expect(pickColor(img, 1, 1)).toEqual(BLUE);
  });
  it("範囲外は透明", () => {
    expect(pickColor(createImage(2, 2), 9, 9)).toEqual(TRANSPARENT);
  });
});
