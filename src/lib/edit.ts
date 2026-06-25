import { PixelImage, RGBA, getPixel, setPixel } from "./types";

/** PixelImage を複製する（編集は非破壊で行い、履歴に積めるようにする）。 */
export function cloneImage(img: PixelImage): PixelImage {
  return { width: img.width, height: img.height, data: new Uint8ClampedArray(img.data) };
}

/** 透明色（消しゴム用）。 */
export const TRANSPARENT: RGBA = { r: 0, g: 0, b: 0, a: 0 };

function sameColor(a: RGBA, b: RGBA): boolean {
  // 完全透明同士は色成分を無視して等価とみなす
  if (a.a === 0 && b.a === 0) return true;
  return a.r === b.r && a.g === b.g && a.b === b.b && a.a === b.a;
}

/** 1ドットを塗る（新しい画像を返す）。 */
export function paintPixel(img: PixelImage, x: number, y: number, color: RGBA): PixelImage {
  const out = cloneImage(img);
  setPixel(out, x, y, color);
  return out;
}

/**
 * Bresenham の直線でドットを塗る（ペンのドラッグ補間にも使う）。
 * 始点・終点を含む。新しい画像を返す。
 */
export function drawLine(
  img: PixelImage,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  color: RGBA,
): PixelImage {
  const out = cloneImage(img);
  let dx = Math.abs(x1 - x0);
  let dy = Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1;
  const sy = y0 < y1 ? 1 : -1;
  let err = dx - dy;
  let x = x0;
  let y = y0;
  // 無限ループ防止のための上限（盤面サイズに比例）
  const limit = (img.width + img.height) * 4 + 8;
  for (let i = 0; i < limit; i++) {
    setPixel(out, x, y, color);
    if (x === x1 && y === y1) break;
    const e2 = 2 * err;
    if (e2 > -dy) {
      err -= dy;
      x += sx;
    }
    if (e2 < dx) {
      err += dx;
      y += sy;
    }
  }
  return out;
}

/**
 * 塗りつぶし（バケツ）。(x, y) と同色で4連結に繋がる領域を fill 色に置き換える。
 * 新しい画像を返す。fill が現在色と同じ場合は何もしない。
 */
export function floodFill(img: PixelImage, x: number, y: number, fill: RGBA): PixelImage {
  if (x < 0 || y < 0 || x >= img.width || y >= img.height) return cloneImage(img);
  const target = getPixel(img, x, y);
  if (sameColor(target, fill)) return cloneImage(img);

  const out = cloneImage(img);
  const stack: [number, number][] = [[x, y]];
  while (stack.length > 0) {
    const [cx, cy] = stack.pop()!;
    if (cx < 0 || cy < 0 || cx >= out.width || cy >= out.height) continue;
    if (!sameColor(getPixel(out, cx, cy), target)) continue;
    setPixel(out, cx, cy, fill);
    stack.push([cx + 1, cy], [cx - 1, cy], [cx, cy + 1], [cx, cy - 1]);
  }
  return out;
}

/** スポイト：その座標の色を返す。範囲外は透明。 */
export function pickColor(img: PixelImage, x: number, y: number): RGBA {
  return getPixel(img, x, y);
}
