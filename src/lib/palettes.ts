import { Palette, RGBA } from "./types";

/** "#rrggbb" を RGBA に変換する。 */
export function hex(code: string): RGBA {
  const m = /^#?([0-9a-fA-F]{6})$/.exec(code.trim());
  if (!m) throw new Error(`不正なカラーコード: ${code}`);
  const n = parseInt(m[1], 16);
  return { r: (n >> 16) & 0xff, g: (n >> 8) & 0xff, b: n & 0xff, a: 255 };
}

function pal(id: string, name: string, codes: string[]): Palette {
  return { id, name, colors: codes.map(hex) };
}

/** 減色で選べる色数プリセット。 */
export const COLOR_COUNTS = [2, 4, 8, 16, 32, 64, 128, 256] as const;

/** 同梱する有名パレット。 */
export const NAMED_PALETTES: Palette[] = [
  pal("gameboy", "Game Boy (4)", ["#0f380f", "#306230", "#8bac0f", "#9bbc0f"]),
  pal("pico8", "PICO-8 (16)", [
    "#000000", "#1d2b53", "#7e2553", "#008751", "#ab5236", "#5f574f", "#c2c3c7", "#fff1e8",
    "#ff004d", "#ffa300", "#ffec27", "#00e436", "#29adff", "#83769c", "#ff77a8", "#ffccaa",
  ]),
  pal("cga", "CGA (4)", ["#000000", "#55ffff", "#ff55ff", "#ffffff"]),
  pal("nes", "NES 風 (16)", [
    "#000000", "#fcfcfc", "#f8f8f8", "#bcbcbc", "#7c7c7c", "#a4e4fc", "#3cbcfc", "#0078f8",
    "#0000fc", "#b8b8f8", "#6888fc", "#0058f8", "#0000bc", "#f8b8f8", "#f878f8", "#e40058",
  ]),
];

/** id から有名パレットを取得する。 */
export function findPalette(id: string): Palette | undefined {
  return NAMED_PALETTES.find((p) => p.id === id);
}
