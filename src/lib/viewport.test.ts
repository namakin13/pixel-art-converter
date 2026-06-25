import { describe, it, expect } from "vitest";
import { screenToCell, inBounds, fitScale } from "./viewport";

describe("screenToCell", () => {
  it("倍率10で画面座標をドット座標に変換", () => {
    expect(screenToCell(0, 0, 10)).toEqual({ x: 0, y: 0 });
    expect(screenToCell(25, 34, 10)).toEqual({ x: 2, y: 3 });
  });
  it("セル内のどこを指しても同じセルになる", () => {
    expect(screenToCell(10, 10, 10)).toEqual({ x: 1, y: 1 });
    expect(screenToCell(19, 19, 10)).toEqual({ x: 1, y: 1 });
  });
  it("scale<=0 は例外", () => {
    expect(() => screenToCell(5, 5, 0)).toThrow();
  });
});

describe("inBounds", () => {
  it("盤面内/外を判定", () => {
    expect(inBounds(0, 0, 4, 4)).toBe(true);
    expect(inBounds(3, 3, 4, 4)).toBe(true);
    expect(inBounds(4, 0, 4, 4)).toBe(false);
    expect(inBounds(-1, 0, 4, 4)).toBe(false);
  });
});

describe("fitScale", () => {
  it("長辺が maxPx に収まる整数倍率", () => {
    expect(fitScale(32, 16, 512)).toBe(16); // 512/32
    expect(fitScale(100, 50, 500)).toBe(5);
  });
  it("最低でも1を返す", () => {
    expect(fitScale(1000, 1000, 100)).toBe(1);
  });
});
