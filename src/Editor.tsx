import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { save } from "@tauri-apps/plugin-dialog";
import { writeFile } from "@tauri-apps/plugin-fs";

import { PixelImage, RGBA } from "./lib/types";
import { cloneImage, drawLine, floodFill, pickColor, TRANSPARENT } from "./lib/edit";
import { History, createHistory, commit, undo, redo, canUndo, canRedo } from "./lib/history";
import { screenToCell, inBounds, fitScale } from "./lib/viewport";
import { renderEditor, toPngBytes, buildIcoBytes } from "./lib/canvas";
import { scaleNearest } from "./lib/convert";
import { exportFileName } from "./lib/io";
import { NAMED_PALETTES } from "./lib/palettes";
import { ICON_SIZES } from "./lib/ico";
import { flipHorizontal, flipVertical, rotateCW, rotateCCW } from "./lib/transform";
import { MirrorMode, mirrorSegments } from "./lib/mirror";

type Tool = "pen" | "eraser" | "bucket" | "eyedropper";

const SWATCHES: RGBA[] = [
  { r: 0, g: 0, b: 0, a: 255 },
  { r: 255, g: 255, b: 255, a: 255 },
  ...NAMED_PALETTES.find((p) => p.id === "pico8")!.colors,
];

function toHex(c: RGBA): string {
  const h = (n: number) => n.toString(16).padStart(2, "0");
  return `#${h(c.r)}${h(c.g)}${h(c.b)}`;
}
function fromHex(s: string): RGBA {
  const n = parseInt(s.slice(1), 16);
  return { r: (n >> 16) & 0xff, g: (n >> 8) & 0xff, b: n & 0xff, a: 255 };
}

export default function Editor({
  initial,
  baseName,
  onBack,
}: {
  initial: PixelImage;
  baseName: string;
  onBack: () => void;
}) {
  const [history, setHistory] = useState<History<PixelImage>>(() => createHistory(initial));
  const [tool, setTool] = useState<Tool>("pen");
  const [mirror, setMirror] = useState<MirrorMode>("none");
  const [color, setColor] = useState<RGBA>(SWATCHES[0]);
  const [scale, setScale] = useState(() => fitScale(initial.width, initial.height, 480));
  const [showGrid, setShowGrid] = useState(true);
  const [exportScale, setExportScale] = useState(4);
  const [status, setStatus] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawingRef = useRef(false);
  const draftRef = useRef<PixelImage | null>(null);
  const lastCellRef = useRef<{ x: number; y: number } | null>(null);

  const image = history.present;

  const render = useCallback(
    (img: PixelImage) => {
      if (canvasRef.current) renderEditor(canvasRef.current, img, scale, showGrid);
    },
    [scale, showGrid],
  );

  useEffect(() => {
    render(draftRef.current ?? image);
  }, [image, render]);

  const cellFromEvent = useCallback(
    (e: React.PointerEvent) => {
      const rect = canvasRef.current!.getBoundingClientRect();
      return screenToCell(e.clientX - rect.left, e.clientY - rect.top, scale);
    },
    [scale],
  );

  // ミラーを考慮して1ストローク分の線を引く（鏡像も同時に描く）
  const strokeSegment = useCallback(
    (img: PixelImage, x0: number, y0: number, x1: number, y1: number, paint: RGBA): PixelImage => {
      let cur = img;
      for (const s of mirrorSegments(x0, y0, x1, y1, img.width, img.height, mirror)) {
        cur = drawLine(cur, s.x0, s.y0, s.x1, s.y1, paint);
      }
      return cur;
    },
    [mirror],
  );

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      const { x, y } = cellFromEvent(e);
      if (!inBounds(x, y, image.width, image.height)) return;

      if (tool === "eyedropper") {
        setColor(pickColor(image, x, y));
        return;
      }
      if (tool === "bucket") {
        setHistory((h) => commit(h, floodFill(image, x, y, color)));
        return;
      }
      // pen / eraser : ドラッグ開始
      (e.target as Element).setPointerCapture(e.pointerId);
      drawingRef.current = true;
      const paint = tool === "eraser" ? TRANSPARENT : color;
      const draft = strokeSegment(cloneImage(image), x, y, x, y, paint);
      draftRef.current = draft;
      lastCellRef.current = { x, y };
      render(draft);
    },
    [cellFromEvent, image, tool, color, render, strokeSegment],
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!drawingRef.current || !draftRef.current) return;
      const { x, y } = cellFromEvent(e);
      const last = lastCellRef.current!;
      if (x === last.x && y === last.y) return;
      const paint = tool === "eraser" ? TRANSPARENT : color;
      const draft = strokeSegment(draftRef.current, last.x, last.y, x, y, paint);
      draftRef.current = draft;
      lastCellRef.current = { x, y };
      render(draft);
    },
    [cellFromEvent, tool, color, render, strokeSegment],
  );

  const endStroke = useCallback(() => {
    if (!drawingRef.current || !draftRef.current) return;
    const draft = draftRef.current;
    drawingRef.current = false;
    draftRef.current = null;
    lastCellRef.current = null;
    setHistory((h) => commit(h, draft));
  }, []);

  // キーボードショートカット（Undo/Redo）
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!(e.ctrlKey || e.metaKey)) return;
      if (e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        setHistory((h) => undo(h));
      } else if ((e.key === "z" && e.shiftKey) || e.key === "y") {
        e.preventDefault();
        setHistory((h) => redo(h));
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const onExport = useCallback(async () => {
    try {
      const scaled = scaleNearest(image, exportScale);
      const bytes = await toPngBytes(scaled);
      const path = await save({
        defaultPath: exportFileName(baseName, exportScale, "png"),
        filters: [{ name: "PNG画像", extensions: ["png"] }],
      });
      if (!path) return;
      await writeFile(path, bytes);
      setStatus(`書き出し完了: ${path}`);
    } catch (err) {
      setStatus(err instanceof Error ? err.message : String(err));
    }
  }, [image, exportScale, baseName]);

  const onExportIco = useCallback(async () => {
    try {
      const bytes = await buildIcoBytes(image, ICON_SIZES);
      const path = await save({
        defaultPath: exportFileName(baseName, 1, "ico"),
        filters: [{ name: "アイコン", extensions: ["ico"] }],
      });
      if (!path) return;
      await writeFile(path, bytes);
      setStatus(`アイコン書き出し完了: ${path}`);
    } catch (err) {
      setStatus(err instanceof Error ? err.message : String(err));
    }
  }, [image, baseName]);

  const applyTransform = useCallback((fn: (img: PixelImage) => PixelImage) => {
    setHistory((h) => commit(h, fn(h.present)));
  }, []);

  const tools: { id: Tool; label: string; icon: string }[] = useMemo(
    () => [
      { id: "pen", label: "ペン", icon: "✏️" },
      { id: "eraser", label: "消しゴム", icon: "🧽" },
      { id: "bucket", label: "塗りつぶし", icon: "🪣" },
      { id: "eyedropper", label: "スポイト", icon: "💧" },
    ],
    [],
  );

  return (
    <div className="editor">
      <div className="editor__toolbar">
        <button className="btn btn--ghost btn--sm editor__back" onClick={onBack}>
          ← 戻る
        </button>
        <div className="editor__tools">
          {tools.map((t) => (
            <button
              key={t.id}
              className={`tool ${tool === t.id ? "tool--on" : ""}`}
              title={t.label}
              onClick={() => setTool(t.id)}
            >
              <span>{t.icon}</span>
              {t.label}
            </button>
          ))}
        </div>
        <div className="editor__hist">
          <button className="btn btn--sm" disabled={!canUndo(history)} onClick={() => setHistory(undo(history))}>
            ↶ 元に戻す
          </button>
          <button className="btn btn--sm" disabled={!canRedo(history)} onClick={() => setHistory(redo(history))}>
            ↷ やり直し
          </button>
        </div>
      </div>

      <div className="editor__body">
        <div className="editor__canvas-area">
          <canvas
            ref={canvasRef}
            className="editor__canvas"
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={endStroke}
            onPointerLeave={endStroke}
          />
        </div>

        <aside className="panel">
          <section className="panel__group">
            <h2>色</h2>
            <div className="color-row">
              <input
                type="color"
                value={toHex(color)}
                onChange={(e) => setColor(fromHex(e.target.value))}
              />
              <span className="color-hex">{toHex(color)}</span>
            </div>
            <div className="swatches">
              {SWATCHES.map((c, i) => (
                <button
                  key={i}
                  className="swatch"
                  style={{ background: toHex(c) }}
                  onClick={() => setColor(c)}
                  title={toHex(c)}
                />
              ))}
            </div>
          </section>

          <section className="panel__group">
            <h2>ミラー描画</h2>
            <div className="seg">
              <button className={mirror === "none" ? "seg--on" : ""} onClick={() => setMirror("none")}>
                なし
              </button>
              <button className={mirror === "horizontal" ? "seg--on" : ""} onClick={() => setMirror("horizontal")}>
                左右
              </button>
              <button className={mirror === "vertical" ? "seg--on" : ""} onClick={() => setMirror("vertical")}>
                上下
              </button>
              <button className={mirror === "both" ? "seg--on" : ""} onClick={() => setMirror("both")}>
                4方向
              </button>
            </div>
          </section>

          <section className="panel__group">
            <h2>変形</h2>
            <div className="chips">
              <button className="chip" onClick={() => applyTransform(flipHorizontal)}>左右反転</button>
              <button className="chip" onClick={() => applyTransform(flipVertical)}>上下反転</button>
              <button className="chip" onClick={() => applyTransform(rotateCCW)}>⟲ 左回転</button>
              <button className="chip" onClick={() => applyTransform(rotateCW)}>⟳ 右回転</button>
            </div>
          </section>

          <section className="panel__group">
            <h2>表示</h2>
            <div className="zoom-row">
              <button className="btn btn--sm" onClick={() => setScale((s) => Math.max(1, s - 1))}>
                −
              </button>
              <span className="zoom-val">×{scale}</span>
              <button className="btn btn--sm" onClick={() => setScale((s) => Math.min(40, s + 1))}>
                ＋
              </button>
            </div>
            <label className="check">
              <input type="checkbox" checked={showGrid} onChange={(e) => setShowGrid(e.target.checked)} />
              グリッド表示
            </label>
          </section>

          <section className="panel__group">
            <h2>書き出し</h2>
            <div className="chips">
              {[1, 2, 4, 8].map((s) => (
                <button
                  key={s}
                  className={`chip ${exportScale === s ? "chip--on" : ""}`}
                  onClick={() => setExportScale(s)}
                >
                  ×{s}
                </button>
              ))}
            </div>
            <button className="btn btn--primary" onClick={onExport}>
              PNGで書き出し
            </button>
            <button className="btn btn--ghost btn--sm" onClick={onExportIco}>
              アイコン(.ico)で書き出し
            </button>
          </section>

          <p className="editor__meta">
            {image.width}×{image.height}px
          </p>
          {status && <p className="msg msg--ok">{status}</p>}
        </aside>
      </div>
    </div>
  );
}
