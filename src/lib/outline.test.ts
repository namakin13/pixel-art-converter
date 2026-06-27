import { describe, it, expect } from "vitest";
import { PixelImage, RGBA, getPixel } from "./types";
import { applyOutline } from "./outline";

const OUTLINE: RGBA = { r: 26, g: 26, b: 46, a: 255 };

/** 各ピクセルを RGBA で指定して画像を作る。 */
function make(width: number, height: number, pixels: RGBA[]): PixelImage {
  const data = new Uint8ClampedArray(width * height * 4);
  pixels.forEach((c, idx) => {
    data[idx * 4] = c.r;
    data[idx * 4 + 1] = c.g;
    data[idx * 4 + 2] = c.b;
    data[idx * 4 + 3] = c.a;
  });
  return { width, height, data };
}

const T: RGBA = { r: 0, g: 0, b: 0, a: 0 }; // 透明
const W: RGBA = { r: 255, g: 255, b: 255, a: 255 };

describe("applyOutline", () => {
  it("単独の不透明ピクセルは全方向が境界なので縁取られる", () => {
    const img = make(3, 3, [T, T, T, T, W, T, T, T, T]);
    const out = applyOutline(img);
    expect(getPixel(out, 1, 1)).toEqual(OUTLINE);
  });

  it("不透明ブロックの内側は縁取られず、外周だけ縁取られる", () => {
    // 3x3 全面不透明（threshold=0でシルエットのみ評価）
    const img = make(3, 3, Array(9).fill(W));
    const out = applyOutline(img, { edgeThreshold: 0 });
    // 中央は四方すべて不透明なので元の白のまま
    expect(getPixel(out, 1, 1)).toEqual(W);
    // 角は画像端に接するので縁取られる
    expect(getPixel(out, 0, 0)).toEqual(OUTLINE);
  });

  it("透明ピクセルには何も書かない", () => {
    const img = make(3, 3, [T, T, T, T, W, T, T, T, T]);
    const out = applyOutline(img);
    expect(getPixel(out, 0, 0)).toEqual(T);
  });

  it("輝度差が閾値を超える隣接で内部線を引く", () => {
    const black: RGBA = { r: 0, g: 0, b: 0, a: 255 };
    // 左 白 / 右 黒 の 2x1。輝度差は最大なので両方とも線になる
    const img = make(2, 1, [W, black]);
    const out = applyOutline(img, { edgeThreshold: 48, silhouette: false });
    expect(getPixel(out, 0, 0)).toEqual(OUTLINE);
    expect(getPixel(out, 1, 0)).toEqual(OUTLINE);
  });

  it("同色の隣接（輝度差ゼロ）では内部線を引かない", () => {
    const img = make(2, 1, [W, W]);
    const out = applyOutline(img, { edgeThreshold: 48, silhouette: false });
    expect(getPixel(out, 0, 0)).toEqual(W);
    expect(getPixel(out, 1, 0)).toEqual(W);
  });

  it("色を指定できる", () => {
    const red: RGBA = { r: 255, g: 0, b: 0, a: 255 };
    const img = make(1, 1, [W]);
    const out = applyOutline(img, { color: red });
    expect(getPixel(out, 0, 0)).toEqual(red);
  });

  it("元画像を破壊しない", () => {
    const img = make(1, 1, [W]);
    applyOutline(img);
    expect(getPixel(img, 0, 0)).toEqual(W);
  });
});
