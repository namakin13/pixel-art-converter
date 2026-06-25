import { describe, it, expect } from "vitest";
import { fitContain } from "./iconize";

describe("fitContain", () => {
  it("正方形は全面を埋め、余白なし", () => {
    expect(fitContain(32, 32, 64)).toEqual({ drawW: 64, drawH: 64, dx: 0, dy: 0 });
  });

  it("横長は上下に余白（中央寄せ）", () => {
    const r = fitContain(64, 32, 64);
    expect(r.drawW).toBe(64);
    expect(r.drawH).toBe(32);
    expect(r.dx).toBe(0);
    expect(r.dy).toBe(16); // (64-32)/2
  });

  it("縦長は左右に余白（中央寄せ）", () => {
    const r = fitContain(32, 64, 64);
    expect(r.drawW).toBe(32);
    expect(r.drawH).toBe(64);
    expect(r.dx).toBe(16);
    expect(r.dy).toBe(0);
  });

  it("縮小もできる（小さいアイコン）", () => {
    const r = fitContain(100, 50, 16);
    expect(r.drawW).toBe(16);
    expect(r.drawH).toBe(8);
    expect(r.dy).toBe(4);
  });

  it("最低1pxは保証する", () => {
    const r = fitContain(100, 1, 16);
    expect(r.drawH).toBeGreaterThanOrEqual(1);
  });

  it("不正なサイズは例外", () => {
    expect(() => fitContain(0, 10, 16)).toThrow();
    expect(() => fitContain(10, 10, 0)).toThrow();
  });
});
