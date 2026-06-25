export type MirrorMode = "none" | "horizontal" | "vertical" | "both";

export interface Point {
  x: number;
  y: number;
}

/**
 * (x, y) に対し、ミラーモードに応じた描画点（自身＋鏡像）を返す。
 * - horizontal: 左右対称（縦軸で反転）
 * - vertical: 上下対称（横軸で反転）
 * - both: 4方向対称
 * 軸上で重複する点は除去する。
 */
export function mirrorPoints(x: number, y: number, w: number, h: number, mode: MirrorMode): Point[] {
  const mx = w - 1 - x;
  const my = h - 1 - y;
  const pts: Point[] = [{ x, y }];

  if (mode === "horizontal" || mode === "both") pts.push({ x: mx, y });
  if (mode === "vertical" || mode === "both") pts.push({ x, y: my });
  if (mode === "both") pts.push({ x: mx, y: my });

  // 重複除去（軸上の点が重なるケース）
  const seen = new Set<string>();
  return pts.filter((p) => {
    const key = `${p.x},${p.y}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export interface Segment {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

/**
 * 線分 (x0,y0)-(x1,y1) に対し、ミラーモードに応じた線分群（自身＋鏡像）を返す。
 * ペンのドラッグ補間に鏡像を適用するために使う。完全に重なる線分は除去する。
 */
export function mirrorSegments(
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  w: number,
  h: number,
  mode: MirrorMode,
): Segment[] {
  const rx = (x: number) => w - 1 - x;
  const ry = (y: number) => h - 1 - y;

  type Tf = (p: Point) => Point;
  const id: Tf = (p) => p;
  const fx: Tf = (p) => ({ x: rx(p.x), y: p.y });
  const fy: Tf = (p) => ({ x: p.x, y: ry(p.y) });
  const fxy: Tf = (p) => ({ x: rx(p.x), y: ry(p.y) });

  let tfs: Tf[];
  if (mode === "horizontal") tfs = [id, fx];
  else if (mode === "vertical") tfs = [id, fy];
  else if (mode === "both") tfs = [id, fx, fy, fxy];
  else tfs = [id];

  const seen = new Set<string>();
  const out: Segment[] = [];
  for (const tf of tfs) {
    const a = tf({ x: x0, y: y0 });
    const b = tf({ x: x1, y: y1 });
    const key = `${a.x},${a.y},${b.x},${b.y}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ x0: a.x, y0: a.y, x1: b.x, y1: b.y });
  }
  return out;
}
