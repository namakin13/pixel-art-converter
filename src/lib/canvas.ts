import { PixelImage } from "./types";
import { fromImageData } from "./convert";
import { fitWithin, MAX_SOURCE } from "./io";
import { fitContain } from "./iconize";
import { encodeIco, IcoEntry } from "./ico";

/**
 * ブラウザの Blob/File から PixelImage を読み込む。
 * HD 上限を超える場合はアスペクト比を保って縮小する。
 */
export async function loadPixelImageFromBlob(blob: Blob): Promise<PixelImage> {
  const url = URL.createObjectURL(blob);
  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error("画像の読み込みに失敗しました"));
      el.src = url;
    });
    const { width, height } = fitWithin(
      image.naturalWidth,
      image.naturalHeight,
      MAX_SOURCE.width,
      MAX_SOURCE.height,
    );
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas コンテキストを取得できません");
    ctx.drawImage(image, 0, 0, width, height);
    return fromImageData(ctx.getImageData(0, 0, width, height));
  } finally {
    URL.revokeObjectURL(url);
  }
}

/** バイト列（読み込んだファイル内容）から PixelImage を読み込む。 */
export async function loadPixelImageFromBytes(bytes: Uint8Array, mime = "image/png"): Promise<PixelImage> {
  return loadPixelImageFromBlob(new Blob([bytes], { type: mime }));
}

/** PixelImage を ImageData に変換する。 */
function toImageData(img: PixelImage): ImageData {
  return new ImageData(new Uint8ClampedArray(img.data), img.width, img.height);
}

/**
 * PixelImage を canvas にドット表示する（最近傍・補間なし）。
 * canvas のサイズは呼び出し側で設定済みである前提。displayScale は表示倍率。
 */
export function renderToCanvas(canvas: HTMLCanvasElement, img: PixelImage, displayScale: number): void {
  canvas.width = img.width * displayScale;
  canvas.height = img.height * displayScale;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas コンテキストを取得できません");

  // 等倍の中間 canvas に描いてから拡大することで補間を防ぐ
  const buf = document.createElement("canvas");
  buf.width = img.width;
  buf.height = img.height;
  buf.getContext("2d")!.putImageData(toImageData(img), 0, 0);

  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(buf, 0, 0, canvas.width, canvas.height);
}

/**
 * エディタ用にドット絵を表示する。透過チェッカー背景＋任意でグリッド線を描く。
 * scale は 1ドットあたりの画面ピクセル数。
 */
export function renderEditor(
  canvas: HTMLCanvasElement,
  img: PixelImage,
  scale: number,
  showGrid: boolean,
): void {
  canvas.width = img.width * scale;
  canvas.height = img.height * scale;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas コンテキストを取得できません");

  // 透過チェッカー背景
  const cell = Math.max(4, Math.floor(scale / 2));
  for (let y = 0; y < canvas.height; y += cell) {
    for (let x = 0; x < canvas.width; x += cell) {
      ctx.fillStyle = ((x / cell + y / cell) & 1) === 0 ? "#1c1830" : "#161226";
      ctx.fillRect(x, y, cell, cell);
    }
  }

  // ドット本体（補間なし）
  const buf = document.createElement("canvas");
  buf.width = img.width;
  buf.height = img.height;
  buf.getContext("2d")!.putImageData(toImageData(img), 0, 0);
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(buf, 0, 0, canvas.width, canvas.height);

  // グリッド線
  if (showGrid && scale >= 6) {
    ctx.strokeStyle = "rgba(103,232,245,0.1)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = 0; x <= img.width; x++) {
      ctx.moveTo(x * scale + 0.5, 0);
      ctx.lineTo(x * scale + 0.5, canvas.height);
    }
    for (let y = 0; y <= img.height; y++) {
      ctx.moveTo(0, y * scale + 0.5);
      ctx.lineTo(canvas.width, y * scale + 0.5);
    }
    ctx.stroke();
  }
}

/** PixelImage を PNG のバイト列に変換する。 */
export async function toPngBytes(img: PixelImage): Promise<Uint8Array> {
  const canvas = document.createElement("canvas");
  canvas.width = img.width;
  canvas.height = img.height;
  canvas.getContext("2d")!.putImageData(toImageData(img), 0, 0);
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
  if (!blob) throw new Error("PNG への変換に失敗しました");
  return new Uint8Array(await blob.arrayBuffer());
}

/**
 * ドット絵を size×size の正方形アイコンに収めた PNG バイト列を返す。
 * アスペクト比を保って中央寄せし、余白は透明・補間なし。
 */
export async function toIconPngBytes(img: PixelImage, size: number): Promise<Uint8Array> {
  const buf = document.createElement("canvas");
  buf.width = img.width;
  buf.height = img.height;
  buf.getContext("2d")!.putImageData(toImageData(img), 0, 0);

  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  ctx.imageSmoothingEnabled = false;
  const { drawW, drawH, dx, dy } = fitContain(img.width, img.height, size);
  ctx.drawImage(buf, dx, dy, drawW, drawH);

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
  if (!blob) throw new Error("アイコンPNGの生成に失敗しました");
  return new Uint8Array(await blob.arrayBuffer());
}

/** 指定サイズ群のアイコンを内包する .ico バイト列を生成する。 */
export async function buildIcoBytes(img: PixelImage, sizes: readonly number[]): Promise<Uint8Array> {
  const entries: IcoEntry[] = [];
  for (const s of sizes) {
    entries.push({ width: s, height: s, png: await toIconPngBytes(img, s) });
  }
  return encodeIco(entries);
}
