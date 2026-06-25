/**
 * キャンバス上の表示座標(offsetX/Y)を、表示倍率 scale からドット座標へ変換する。
 * scale は 1ドットあたりの画面ピクセル数。
 */
export function screenToCell(
  offsetX: number,
  offsetY: number,
  scale: number,
): { x: number; y: number } {
  if (scale <= 0) throw new Error("scale は正の値である必要があります");
  return { x: Math.floor(offsetX / scale), y: Math.floor(offsetY / scale) };
}

/** (x, y) が w×h の盤面内に収まるか。 */
export function inBounds(x: number, y: number, w: number, h: number): boolean {
  return x >= 0 && y >= 0 && x < w && y < h;
}

/** 盤面全体が maxPx 以内に収まる整数の表示倍率を求める（最低1）。 */
export function fitScale(width: number, height: number, maxPx: number): number {
  const longSide = Math.max(width, height);
  if (longSide <= 0) return 1;
  return Math.max(1, Math.floor(maxPx / longSide));
}
