/**
 * 元画像(srcW×srcH)を size×size の正方形に「contain（はみ出さず中央寄せ）」で
 * 収める配置を求める。アスペクト比を保ち、余白は透明にする想定。
 */
export function fitContain(
  srcW: number,
  srcH: number,
  size: number,
): { drawW: number; drawH: number; dx: number; dy: number } {
  if (srcW <= 0 || srcH <= 0 || size <= 0) throw new Error("サイズが不正です");
  const scale = Math.min(size / srcW, size / srcH);
  const drawW = Math.max(1, Math.round(srcW * scale));
  const drawH = Math.max(1, Math.round(srcH * scale));
  const dx = Math.floor((size - drawW) / 2);
  const dy = Math.floor((size - drawH) / 2);
  return { drawW, drawH, dx, dy };
}
