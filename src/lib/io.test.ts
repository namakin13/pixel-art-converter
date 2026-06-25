import { describe, it, expect } from "vitest";
import { fitWithin, baseName, exportFileName, MAX_SOURCE } from "./io";

describe("fitWithin", () => {
  it("上限内ならそのまま返す", () => {
    expect(fitWithin(800, 600, 1280, 720)).toEqual({ width: 800, height: 600, scaled: false });
  });

  it("横超過時はアスペクト比を保って縮小する", () => {
    const r = fitWithin(2560, 1440, 1280, 720);
    expect(r.scaled).toBe(true);
    expect(r.width).toBe(1280);
    expect(r.height).toBe(720);
  });

  it("縦長画像も上限に収める", () => {
    const r = fitWithin(720, 2000, 1280, 720);
    expect(r.height).toBeLessThanOrEqual(720);
    expect(r.width).toBeLessThanOrEqual(1280);
    expect(r.scaled).toBe(true);
  });

  it("HD上限定数を使った縮小", () => {
    const r = fitWithin(1920, 1080, MAX_SOURCE.width, MAX_SOURCE.height);
    expect(r.width).toBe(1280);
    expect(r.height).toBe(720);
  });

  it("サイズ0は例外", () => {
    expect(() => fitWithin(0, 100, 1280, 720)).toThrow();
  });
});

describe("baseName", () => {
  it("Windowsパスから拡張子なしのファイル名を取り出す", () => {
    expect(baseName("C:\\foo\\bar\\cat.png")).toBe("cat");
  });
  it("Unixパスにも対応", () => {
    expect(baseName("/home/user/dog.jpeg")).toBe("dog");
  });
  it("拡張子なしはそのまま", () => {
    expect(baseName("noext")).toBe("noext");
  });
});

describe("exportFileName", () => {
  it("PNG 等倍", () => {
    expect(exportFileName("cat", 1, "png")).toBe("cat_pixel.png");
  });
  it("PNG 4倍", () => {
    expect(exportFileName("cat", 4, "png")).toBe("cat_pixel_x4.png");
  });
  it("ICO", () => {
    expect(exportFileName("cat", 1, "ico")).toBe("cat_icon.ico");
  });
  it("空ベース名はフォールバック", () => {
    expect(exportFileName("  ", 2, "png")).toBe("pixelart_pixel_x2.png");
  });
});
