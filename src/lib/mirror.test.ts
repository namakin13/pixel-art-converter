import { describe, it, expect } from "vitest";
import { mirrorPoints, mirrorSegments } from "./mirror";

describe("mirrorPoints", () => {
  it("none は自身のみ", () => {
    expect(mirrorPoints(1, 2, 8, 8, "none")).toEqual([{ x: 1, y: 2 }]);
  });

  it("horizontal は左右の鏡像を足す", () => {
    const pts = mirrorPoints(1, 2, 8, 8, "horizontal");
    expect(pts).toContainEqual({ x: 1, y: 2 });
    expect(pts).toContainEqual({ x: 6, y: 2 }); // 8-1-1
    expect(pts).toHaveLength(2);
  });

  it("vertical は上下の鏡像を足す", () => {
    const pts = mirrorPoints(1, 2, 8, 8, "vertical");
    expect(pts).toContainEqual({ x: 1, y: 2 });
    expect(pts).toContainEqual({ x: 1, y: 5 }); // 8-1-2
    expect(pts).toHaveLength(2);
  });

  it("both は4点", () => {
    const pts = mirrorPoints(1, 2, 8, 8, "both");
    expect(pts).toHaveLength(4);
    expect(pts).toContainEqual({ x: 6, y: 5 });
  });

  it("軸上の点は重複除去される（奇数幅の中央）", () => {
    // 幅7の中央 x=3 は鏡像も x=3
    const pts = mirrorPoints(3, 1, 7, 7, "horizontal");
    expect(pts).toHaveLength(1);
  });

  it("both で中心点は1点に集約", () => {
    const pts = mirrorPoints(3, 3, 7, 7, "both");
    expect(pts).toHaveLength(1);
  });
});

describe("mirrorSegments", () => {
  it("none は元の線分のみ", () => {
    expect(mirrorSegments(0, 0, 2, 1, 8, 8, "none")).toEqual([{ x0: 0, y0: 0, x1: 2, y1: 1 }]);
  });

  it("horizontal は鏡像線分を足す", () => {
    const segs = mirrorSegments(0, 0, 2, 1, 8, 8, "horizontal");
    expect(segs).toHaveLength(2);
    expect(segs).toContainEqual({ x0: 7, y0: 0, x1: 5, y1: 1 }); // x → 8-1-x
  });

  it("both は4線分", () => {
    const segs = mirrorSegments(0, 0, 1, 1, 8, 8, "both");
    expect(segs).toHaveLength(4);
  });

  it("中央軸上で重なる線分は除去", () => {
    // 幅7の縦中央線 x=3 を縦に引く → 鏡像も同じ線分
    const segs = mirrorSegments(3, 0, 3, 6, 7, 7, "horizontal");
    expect(segs).toHaveLength(1);
  });
});
