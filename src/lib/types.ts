/** ドット絵処理で扱う、DOM非依存の画像表現。 */
export interface PixelImage {
  width: number;
  height: number;
  /** RGBA 各1バイト。長さは width * height * 4。 */
  data: Uint8ClampedArray;
}

/** RGB(A) 色。a は 0-255、省略時は不透明(255)扱い。 */
export interface RGBA {
  r: number;
  g: number;
  b: number;
  a: number;
}

/** 名前付きカラーパレット。 */
export interface Palette {
  id: string;
  name: string;
  colors: RGBA[];
}

/** 空の PixelImage を生成する（全ピクセル透明）。 */
export function createImage(width: number, height: number): PixelImage {
  return {
    width,
    height,
    data: new Uint8ClampedArray(width * height * 4),
  };
}

/** (x, y) のピクセルを取得する。範囲外は透明黒を返す。 */
export function getPixel(img: PixelImage, x: number, y: number): RGBA {
  if (x < 0 || y < 0 || x >= img.width || y >= img.height) {
    return { r: 0, g: 0, b: 0, a: 0 };
  }
  const i = (y * img.width + x) * 4;
  return { r: img.data[i], g: img.data[i + 1], b: img.data[i + 2], a: img.data[i + 3] };
}

/** (x, y) にピクセルを書き込む。範囲外は無視する。 */
export function setPixel(img: PixelImage, x: number, y: number, c: RGBA): void {
  if (x < 0 || y < 0 || x >= img.width || y >= img.height) return;
  const i = (y * img.width + x) * 4;
  img.data[i] = c.r;
  img.data[i + 1] = c.g;
  img.data[i + 2] = c.b;
  img.data[i + 3] = c.a;
}
