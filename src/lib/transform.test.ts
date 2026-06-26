import { describe, it, expect } from "vitest";
import { PixelImage, RGBA, createImage, getPixel, setPixel } from "./types";
import { flipHorizontal, flipVertical, rotateCW, rotateCCW } from "./transform";

const A: RGBA = { r: 10, g: 0, b: 0, a: 255 };
const B: RGBA = { r: 20, g: 0, b: 0, a: 255 };
const C: RGBA = { r: 30, g: 0, b: 0, a: 255 };
const D: RGBA = { r: 40, g: 0, b: 0, a: 255 };

/** 2x2: 左上A 右上B 左下C 右下D */
function quad(): PixelImage {
  const img = createImage(2, 2);
  setPixel(img, 0, 0, A);
  setPixel(img, 1, 0, B);
  setPixel(img, 0, 1, C);
  setPixel(img, 1, 1, D);
  return img;
}

describe("flipHorizontal", () => {
  it("左右が入れ替わる", () => {
    const out = flipHorizontal(quad());
    expect(getPixel(out, 0, 0)).toEqual(B);
    expect(getPixel(out, 1, 0)).toEqual(A);
    expect(getPixel(out, 0, 1)).toEqual(D);
    expect(getPixel(out, 1, 1)).toEqual(C);
  });
});

describe("flipVertical", () => {
  it("上下が入れ替わる", () => {
    const out = flipVertical(quad());
    expect(getPixel(out, 0, 0)).toEqual(C);
    expect(getPixel(out, 1, 0)).toEqual(D);
    expect(getPixel(out, 0, 1)).toEqual(A);
    expect(getPixel(out, 1, 1)).toEqual(B);
  });
});

describe("rotateCW", () => {
  it("時計回り90度: 左上Aが右上へ", () => {
    const out = rotateCW(quad());
    // A(左上)→右上, C(左下)→左上, D→左下, B→右下
    expect(getPixel(out, 1, 0)).toEqual(A);
    expect(getPixel(out, 0, 0)).toEqual(C);
    expect(getPixel(out, 0, 1)).toEqual(D);
    expect(getPixel(out, 1, 1)).toEqual(B);
  });

  it("非正方形は幅と高さが入れ替わる", () => {
    const out = rotateCW(createImage(3, 5));
    expect(out.width).toBe(5);
    expect(out.height).toBe(3);
  });
});

describe("rotateCCW", () => {
  it("反時計回り90度: 右上Bが左上へ", () => {
    const out = rotateCCW(quad());
    // B(右上)→左上, A(左上)→左下
    expect(getPixel(out, 0, 0)).toEqual(B);
    expect(getPixel(out, 1, 0)).toEqual(D);
    expect(getPixel(out, 0, 1)).toEqual(A);
    expect(getPixel(out, 1, 1)).toEqual(C);
  });

  it("CW→CCW で元に戻る", () => {
    const src = quad();
    const back = rotateCCW(rotateCW(src));
    expect(Array.from(back.data)).toEqual(Array.from(src.data));
  });
});
