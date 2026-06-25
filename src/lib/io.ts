/** 入力画像の上限（HD相当）。これを超える画像は読み込み時に縮小する。 */
export const MAX_SOURCE = { width: 1280, height: 720 } as const;

/**
 * (w, h) を maxW × maxH に収まるよう、アスペクト比を保って縮小した寸法を返す。
 * 収まっている場合はそのまま返す。
 */
export function fitWithin(
  w: number,
  h: number,
  maxW: number,
  maxH: number,
): { width: number; height: number; scaled: boolean } {
  if (w <= 0 || h <= 0) throw new Error("サイズが不正です");
  if (w <= maxW && h <= maxH) {
    return { width: w, height: h, scaled: false };
  }
  const ratio = Math.min(maxW / w, maxH / h);
  return {
    width: Math.max(1, Math.floor(w * ratio)),
    height: Math.max(1, Math.floor(h * ratio)),
    scaled: true,
  };
}

/** 拡張子を除いたベース名を取り出す（パス区切りも除去）。 */
export function baseName(path: string): string {
  const file = path.split(/[\\/]/).pop() ?? path;
  const dot = file.lastIndexOf(".");
  return dot > 0 ? file.slice(0, dot) : file;
}

/**
 * 書き出しファイル名を生成する。
 * 例: ("cat", 4, "png") -> "cat_pixel_x4.png"
 *     ("cat", 1, "ico") -> "cat_icon.ico"
 */
export function exportFileName(base: string, scale: number, ext: "png" | "ico"): string {
  const safe = (base || "pixelart").trim() || "pixelart";
  if (ext === "ico") return `${safe}_icon.ico`;
  const suffix = scale > 1 ? `_pixel_x${scale}` : "_pixel";
  return `${safe}${suffix}.png`;
}
