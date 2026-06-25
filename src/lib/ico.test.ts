import { describe, it, expect } from "vitest";
import { encodeIco, IcoEntry, ICON_SIZES } from "./ico";

function fakePng(len: number, fill: number): Uint8Array {
  return new Uint8Array(len).fill(fill);
}

describe("encodeIco", () => {
  it("ヘッダーが ICONDIR 形式（reserved=0, type=1, count=n）", () => {
    const ico = encodeIco([{ width: 16, height: 16, png: fakePng(10, 1) }]);
    const v = new DataView(ico.buffer);
    expect(v.getUint16(0, true)).toBe(0);
    expect(v.getUint16(2, true)).toBe(1);
    expect(v.getUint16(4, true)).toBe(1);
  });

  it("総バイト数 = 6 + 16*n + Σpng長", () => {
    const entries: IcoEntry[] = [
      { width: 16, height: 16, png: fakePng(10, 1) },
      { width: 32, height: 32, png: fakePng(20, 2) },
    ];
    const ico = encodeIco(entries);
    expect(ico.length).toBe(6 + 16 * 2 + 10 + 20);
  });

  it("各エントリのオフセットが正しく、その位置にPNGが置かれる", () => {
    const entries: IcoEntry[] = [
      { width: 16, height: 16, png: fakePng(10, 0xaa) },
      { width: 32, height: 32, png: fakePng(20, 0xbb) },
    ];
    const ico = encodeIco(entries);
    const v = new DataView(ico.buffer);

    // 1つ目: オフセット = 6 + 16*2 = 38
    const off1 = v.getUint32(6 + 12, true);
    expect(off1).toBe(38);
    expect(ico[off1]).toBe(0xaa);
    expect(v.getUint32(6 + 8, true)).toBe(10); // bytesInRes

    // 2つ目: オフセット = 38 + 10 = 48
    const off2 = v.getUint32(6 + 16 + 12, true);
    expect(off2).toBe(48);
    expect(ico[off2]).toBe(0xbb);
  });

  it("256サイズは寸法バイトに0として記録される", () => {
    const ico = encodeIco([{ width: 256, height: 256, png: fakePng(4, 1) }]);
    expect(ico[6]).toBe(0); // width byte
    expect(ico[7]).toBe(0); // height byte
  });

  it("通常サイズは寸法バイトにそのまま入る", () => {
    const ico = encodeIco([{ width: 48, height: 48, png: fakePng(4, 1) }]);
    expect(ico[6]).toBe(48);
    expect(ico[7]).toBe(48);
  });

  it("bitCount は 32, planes は 1", () => {
    const ico = encodeIco([{ width: 16, height: 16, png: fakePng(4, 1) }]);
    const v = new DataView(ico.buffer);
    expect(v.getUint16(6 + 4, true)).toBe(1);
    expect(v.getUint16(6 + 6, true)).toBe(32);
  });

  it("空配列は例外", () => {
    expect(() => encodeIco([])).toThrow();
  });

  it("寸法が範囲外は例外", () => {
    expect(() => encodeIco([{ width: 0, height: 16, png: fakePng(4, 1) }])).toThrow();
    expect(() => encodeIco([{ width: 257, height: 16, png: fakePng(4, 1) }])).toThrow();
  });

  it("ICON_SIZES 全サイズで生成でき、エントリ数が一致する", () => {
    const entries = ICON_SIZES.map((s) => ({ width: s, height: s, png: fakePng(8, s & 0xff) }));
    const ico = encodeIco(entries);
    const v = new DataView(ico.buffer);
    expect(v.getUint16(4, true)).toBe(ICON_SIZES.length);
  });
});
