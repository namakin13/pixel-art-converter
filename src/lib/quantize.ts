import { PixelImage, RGBA } from "./types";

/** アルファがこの値未満のピクセルは「透明」として減色対象から外す。 */
const ALPHA_THRESHOLD = 8;

/** 2色の RGB ユークリッド距離の2乗。 */
export function colorDistanceSq(a: RGBA, b: RGBA): number {
  const dr = a.r - b.r;
  const dg = a.g - b.g;
  const db = a.b - b.b;
  return dr * dr + dg * dg + db * db;
}

/** パレットの中から最も近い色を返す。パレットは1色以上必要。 */
export function nearestColor(c: RGBA, palette: RGBA[]): RGBA {
  if (palette.length === 0) throw new Error("パレットが空です");
  let best = palette[0];
  let bestD = colorDistanceSq(c, best);
  for (let i = 1; i < palette.length; i++) {
    const d = colorDistanceSq(c, palette[i]);
    if (d < bestD) {
      bestD = d;
      best = palette[i];
    }
  }
  return best;
}

interface Bucket {
  pixels: RGBA[];
}

function channelRange(pixels: RGBA[], ch: "r" | "g" | "b"): number {
  let min = 255;
  let max = 0;
  for (const p of pixels) {
    const v = p[ch];
    if (v < min) min = v;
    if (v > max) max = v;
  }
  return max - min;
}

function averageColor(pixels: RGBA[]): RGBA {
  let r = 0;
  let g = 0;
  let b = 0;
  for (const p of pixels) {
    r += p.r;
    g += p.g;
    b += p.b;
  }
  const n = pixels.length;
  return { r: Math.round(r / n), g: Math.round(g / n), b: Math.round(b / n), a: 255 };
}

/**
 * メディアンカット法で画像から最大 maxColors 色のパレットを生成する。
 * 透明ピクセルは無視する。色数が足りない画像はその分だけ返す。
 */
export function medianCut(img: PixelImage, maxColors: number): RGBA[] {
  if (maxColors < 1) throw new Error("maxColors は 1 以上である必要があります");

  const pixels: RGBA[] = [];
  for (let i = 0; i < img.width * img.height; i++) {
    const a = img.data[i * 4 + 3];
    if (a >= ALPHA_THRESHOLD) {
      pixels.push({ r: img.data[i * 4], g: img.data[i * 4 + 1], b: img.data[i * 4 + 2], a: 255 });
    }
  }
  if (pixels.length === 0) return [];

  let buckets: Bucket[] = [{ pixels }];

  while (buckets.length < maxColors) {
    // 最も色の幅が広いバケツを選んで分割する
    let target = -1;
    let targetRange = 0; // 色幅0のバケツは分割しない（同一色を増やさない）
    let targetCh: "r" | "g" | "b" = "r";
    for (let i = 0; i < buckets.length; i++) {
      if (buckets[i].pixels.length < 2) continue;
      for (const ch of ["r", "g", "b"] as const) {
        const range = channelRange(buckets[i].pixels, ch);
        if (range > targetRange) {
          targetRange = range;
          target = i;
          targetCh = ch;
        }
      }
    }
    if (target === -1) break; // これ以上分割できない

    const ps = buckets[target].pixels.slice().sort((a, b) => a[targetCh] - b[targetCh]);
    const mid = Math.floor(ps.length / 2);
    buckets.splice(target, 1, { pixels: ps.slice(0, mid) }, { pixels: ps.slice(mid) });
  }

  return buckets.filter((b) => b.pixels.length > 0).map((b) => averageColor(b.pixels));
}

/**
 * 画像の各ピクセルをパレットの最近色に置き換える（新しい PixelImage を返す）。
 * 透明ピクセル（アルファ < しきい値）はそのまま透明を保つ。
 */
export function applyPalette(img: PixelImage, palette: RGBA[]): PixelImage {
  const out: PixelImage = {
    width: img.width,
    height: img.height,
    data: new Uint8ClampedArray(img.data.length),
  };
  for (let i = 0; i < img.width * img.height; i++) {
    const a = img.data[i * 4 + 3];
    if (a < ALPHA_THRESHOLD) {
      out.data[i * 4 + 3] = 0;
      continue;
    }
    const c = nearestColor(
      { r: img.data[i * 4], g: img.data[i * 4 + 1], b: img.data[i * 4 + 2], a: 255 },
      palette,
    );
    out.data[i * 4] = c.r;
    out.data[i * 4 + 1] = c.g;
    out.data[i * 4 + 2] = c.b;
    out.data[i * 4 + 3] = a;
  }
  return out;
}
