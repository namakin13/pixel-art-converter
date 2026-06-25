// アプリアイコン(1024px)を生成する小さなスクリプト。
// 16x16 のドット絵モチーフ（緑のジェム）を64倍に拡大してPNG化する。
// 依存ライブラリなし（Node 標準の zlib のみ）。
import { deflateSync } from "node:zlib";
import { writeFileSync, mkdirSync } from "node:fs";

const GRID = 16;
const CELL = 64;
const SIZE = GRID * CELL; // 1024

const BG = [28, 31, 41, 255];
const G1 = [52, 211, 153, 255];
const G2 = [110, 231, 183, 255];
const EDGE = [7, 36, 26, 255];
const NONE = [0, 0, 0, 0];

// 16x16 の論理ドットの色を決める
function cellColor(x, y) {
  // 角を1セル落としてチャンキーな丸み
  if ((x === 0 || x === GRID - 1) && (y === 0 || y === GRID - 1)) return NONE;

  const cx = 7.5;
  const cy = 7.5;
  const d = Math.abs(x - cx) + Math.abs(y - cy); // マンハッタン距離
  if (d <= 3) return G2; // 内側ハイライト
  if (d <= 5) return G1; // ジェム本体
  if (d <= 6) return EDGE; // 縁取り
  return BG; // 背景
}

// 1024x1024 の RGBA バッファを作る
const raw = Buffer.alloc(SIZE * SIZE * 4);
for (let y = 0; y < SIZE; y++) {
  for (let x = 0; x < SIZE; x++) {
    const c = cellColor(Math.floor(x / CELL), Math.floor(y / CELL));
    const i = (y * SIZE + x) * 4;
    raw[i] = c[0];
    raw[i + 1] = c[1];
    raw[i + 2] = c[2];
    raw[i + 3] = c[3];
  }
}

// --- 最小限の PNG エンコーダ ---
function crc32(buf) {
  let c = ~0;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
  }
  return ~c >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, "ascii");
  const body = Buffer.concat([typeBuf, data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body), 0);
  return Buffer.concat([len, body, crc]);
}

const ihdr = Buffer.alloc(13);
ihdr.writeUInt32BE(SIZE, 0);
ihdr.writeUInt32BE(SIZE, 4);
ihdr[8] = 8; // bit depth
ihdr[9] = 6; // color type RGBA
ihdr[10] = 0;
ihdr[11] = 0;
ihdr[12] = 0;

// スキャンラインごとにフィルタバイト(0)を付ける
const stride = SIZE * 4;
const filtered = Buffer.alloc((stride + 1) * SIZE);
for (let y = 0; y < SIZE; y++) {
  filtered[y * (stride + 1)] = 0;
  raw.copy(filtered, y * (stride + 1) + 1, y * stride, y * stride + stride);
}
const idat = deflateSync(filtered, { level: 9 });

const png = Buffer.concat([
  Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
  chunk("IHDR", ihdr),
  chunk("IDAT", idat),
  chunk("IEND", Buffer.alloc(0)),
]);

mkdirSync("assets", { recursive: true });
writeFileSync("assets/app-icon.png", png);
console.log(`generated assets/app-icon.png (${SIZE}x${SIZE}, ${png.length} bytes)`);
