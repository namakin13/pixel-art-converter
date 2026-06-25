import { PixelImage, createImage, getPixel, setPixel } from "./types";

/** 左右反転（新しい画像を返す）。 */
export function flipHorizontal(img: PixelImage): PixelImage {
  const out = createImage(img.width, img.height);
  for (let y = 0; y < img.height; y++) {
    for (let x = 0; x < img.width; x++) {
      setPixel(out, img.width - 1 - x, y, getPixel(img, x, y));
    }
  }
  return out;
}

/** 上下反転（新しい画像を返す）。 */
export function flipVertical(img: PixelImage): PixelImage {
  const out = createImage(img.width, img.height);
  for (let y = 0; y < img.height; y++) {
    for (let x = 0; x < img.width; x++) {
      setPixel(out, x, img.height - 1 - y, getPixel(img, x, y));
    }
  }
  return out;
}

/** 時計回りに90度回転（幅と高さが入れ替わる）。 */
export function rotateCW(img: PixelImage): PixelImage {
  const out = createImage(img.height, img.width); // 幅↔高さ
  for (let y = 0; y < img.height; y++) {
    for (let x = 0; x < img.width; x++) {
      // 元(x,y) → 新(height-1-y, x)
      setPixel(out, img.height - 1 - y, x, getPixel(img, x, y));
    }
  }
  return out;
}

/** 反時計回りに90度回転（幅と高さが入れ替わる）。 */
export function rotateCCW(img: PixelImage): PixelImage {
  const out = createImage(img.height, img.width);
  for (let y = 0; y < img.height; y++) {
    for (let x = 0; x < img.width; x++) {
      // 元(x,y) → 新(y, width-1-x)
      setPixel(out, y, img.width - 1 - x, getPixel(img, x, y));
    }
  }
  return out;
}
