import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { save } from "@tauri-apps/plugin-dialog";
import { writeFile } from "@tauri-apps/plugin-fs";
import "./App.css";

import { PixelImage } from "./lib/types";
import { convert, scaleNearest } from "./lib/convert";
import { renderToCanvas, loadPixelImageFromBlob, toPngBytes } from "./lib/canvas";
import { COLOR_COUNTS, NAMED_PALETTES } from "./lib/palettes";
import { exportFileName } from "./lib/io";
import { Adjustments, NO_ADJUST } from "./lib/adjust";
import { createCanvas } from "./lib/edit";
import Editor from "./Editor";
import Home from "./Home";

const TARGET_WIDTHS = [16, 32, 48, 64, 96, 128, 256];
const EXPORT_SCALES = [1, 2, 4, 8];

type PaletteMode = "auto" | "named" | "none";
type View = "home" | "convert";

function Slider({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="slider">
      <div className="slider__head">
        <span>{label}</span>
        <span className="slider__val">{value > 0 ? `+${value}` : value}</span>
      </div>
      <input
        type="range"
        min={-100}
        max={100}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </div>
  );
}

function App() {
  const [view, setView] = useState<View>("home");
  const [editTarget, setEditTarget] = useState<PixelImage | null>(null);
  const [source, setSource] = useState<PixelImage | null>(null);
  const [sourceName, setSourceName] = useState("pixelart");
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  // 変換設定
  const [targetWidth, setTargetWidth] = useState(64);
  const [paletteMode, setPaletteMode] = useState<PaletteMode>("auto");
  const [colorCount, setColorCount] = useState(32);
  const [namedPaletteId, setNamedPaletteId] = useState(NAMED_PALETTES[0].id);
  const [dither, setDither] = useState(false);
  const [adjust, setAdjust] = useState<Adjustments>(NO_ADJUST);
  const [exportScale, setExportScale] = useState(4);

  const canvasRef = useRef<HTMLCanvasElement>(null);

  // 変換結果（設定が変わるたび再計算）
  const result = useMemo(() => {
    if (!source) return null;
    const base = { targetWidth, dither, adjustments: adjust };
    if (paletteMode === "none") {
      return convert(source, { ...base, palette: { kind: "none" } });
    }
    if (paletteMode === "named") {
      const p = NAMED_PALETTES.find((x) => x.id === namedPaletteId)!;
      return convert(source, { ...base, palette: { kind: "fixed", colors: p.colors } });
    }
    return convert(source, { ...base, palette: { kind: "auto", colors: colorCount } });
  }, [source, targetWidth, paletteMode, colorCount, namedPaletteId, dither, adjust]);

  // プレビュー描画（表示はキャンバス幅 ~512px を目安にフィット）
  useEffect(() => {
    if (!result || !canvasRef.current) return;
    const fit = Math.max(1, Math.floor(512 / result.image.width));
    renderToCanvas(canvasRef.current, result.image, Math.min(fit, 16));
  }, [result]);

  const handleFile = useCallback(async (file: Blob, name: string) => {
    try {
      setError(null);
      const img = await loadPixelImageFromBlob(file);
      setSource(img);
      setSourceName(name.replace(/\.[^.]+$/, "") || "pixelart");
      setStatus(`読み込み完了: ${img.width}×${img.height}px`);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }, []);

  // クリップボードからの貼り付け（Ctrl+V）
  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      const item = Array.from(e.clipboardData?.items ?? []).find((i) => i.type.startsWith("image/"));
      const file = item?.getAsFile();
      if (file) {
        e.preventDefault();
        handleFile(file, "pasted");
      }
    };
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, [handleFile]);

  const onPick = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const f = e.target.files?.[0];
      if (f) handleFile(f, f.name);
    },
    [handleFile],
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const f = e.dataTransfer.files?.[0];
      if (f && f.type.startsWith("image/")) handleFile(f, f.name);
      else setError("画像ファイルをドロップしてください");
    },
    [handleFile],
  );

  const onExport = useCallback(async () => {
    if (!result) return;
    try {
      setError(null);
      const scaled = scaleNearest(result.image, exportScale);
      const bytes = await toPngBytes(scaled);
      const fileName = exportFileName(sourceName, exportScale, "png");
      const path = await save({
        defaultPath: fileName,
        filters: [{ name: "PNG画像", extensions: ["png"] }],
      });
      if (!path) return;
      await writeFile(path, bytes);
      setStatus(`書き出し完了: ${path}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }, [result, exportScale, sourceName]);

  if (editTarget) {
    return (
      <Editor initial={editTarget} baseName={sourceName} onBack={() => setEditTarget(null)} />
    );
  }

  if (view === "home") {
    return (
      <Home
        onConvert={() => setView("convert")}
        onCreate={(w, h, transparent) => {
          setSourceName("pixelart");
          setEditTarget(createCanvas(w, h, transparent ? null : { r: 255, g: 255, b: 255, a: 255 }));
        }}
      />
    );
  }

  return (
    <div className="app">
      <header className="app__header">
        <button className="btn btn--ghost btn--sm app__home" onClick={() => setView("home")}>
          ← ホーム
        </button>
        <h1>ドット絵コンバーター</h1>
        <span className="app__tag">イラスト → ドット絵</span>
      </header>

      <div className="app__body">
        {/* 左: 入力 / プレビュー */}
        <main className="preview">
          {!source ? (
            <label
              className={`dropzone ${dragging ? "dropzone--active" : ""}`}
              onDragOver={(e) => {
                e.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={onDrop}
            >
              <input type="file" accept="image/*" onChange={onPick} hidden />
              <div className="dropzone__inner">
                <div className="dropzone__icon">🖼️</div>
                <p>画像をドラッグ＆ドロップ</p>
                <p className="dropzone__sub">クリックして選択 / Ctrl+V で貼り付け</p>
              </div>
            </label>
          ) : (
            <div
              className="canvas-wrap"
              onDragOver={(e) => {
                e.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={onDrop}
            >
              <canvas ref={canvasRef} className="preview__canvas" />
              {result && (
                <div className="preview__meta">
                  出力: {result.image.width}×{result.image.height}px
                  {result.palette.length > 0 && ` / ${result.palette.length}色`}
                </div>
              )}
            </div>
          )}
        </main>

        {/* 右: 設定 */}
        <aside className="panel">
          <section className="panel__group">
            <h2>入力</h2>
            <label className="btn btn--ghost">
              <input type="file" accept="image/*" onChange={onPick} hidden />
              画像を選択…
            </label>
          </section>

          <section className="panel__group">
            <h2>解像度（横ドット数）</h2>
            <div className="chips">
              {TARGET_WIDTHS.map((w) => (
                <button
                  key={w}
                  className={`chip ${targetWidth === w ? "chip--on" : ""}`}
                  onClick={() => setTargetWidth(w)}
                >
                  {w}
                </button>
              ))}
            </div>
          </section>

          <section className="panel__group">
            <h2>パレット</h2>
            <div className="seg">
              <button className={paletteMode === "auto" ? "seg--on" : ""} onClick={() => setPaletteMode("auto")}>
                自動減色
              </button>
              <button className={paletteMode === "named" ? "seg--on" : ""} onClick={() => setPaletteMode("named")}>
                プリセット
              </button>
              <button className={paletteMode === "none" ? "seg--on" : ""} onClick={() => setPaletteMode("none")}>
                減色なし
              </button>
            </div>

            {paletteMode === "auto" && (
              <div className="chips chips--mt">
                {COLOR_COUNTS.map((c) => (
                  <button
                    key={c}
                    className={`chip ${colorCount === c ? "chip--on" : ""}`}
                    onClick={() => setColorCount(c)}
                  >
                    {c}色
                  </button>
                ))}
              </div>
            )}

            {paletteMode === "named" && (
              <select
                className="select"
                value={namedPaletteId}
                onChange={(e) => setNamedPaletteId(e.target.value)}
              >
                {NAMED_PALETTES.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            )}

            {paletteMode !== "none" && (
              <label className="check">
                <input type="checkbox" checked={dither} onChange={(e) => setDither(e.target.checked)} />
                ディザリング（誤差拡散）
              </label>
            )}
          </section>

          <section className="panel__group">
            <h2>画像補正</h2>
            <Slider
              label="明度"
              value={adjust.brightness}
              onChange={(v) => setAdjust((a) => ({ ...a, brightness: v }))}
            />
            <Slider
              label="コントラスト"
              value={adjust.contrast}
              onChange={(v) => setAdjust((a) => ({ ...a, contrast: v }))}
            />
            <Slider
              label="彩度"
              value={adjust.saturation}
              onChange={(v) => setAdjust((a) => ({ ...a, saturation: v }))}
            />
            <button className="btn btn--ghost btn--sm" onClick={() => setAdjust(NO_ADJUST)}>
              補正をリセット
            </button>
          </section>

          <section className="panel__group">
            <h2>書き出し</h2>
            <div className="chips">
              {EXPORT_SCALES.map((s) => (
                <button
                  key={s}
                  className={`chip ${exportScale === s ? "chip--on" : ""}`}
                  onClick={() => setExportScale(s)}
                >
                  ×{s}
                </button>
              ))}
            </div>
            <button className="btn btn--primary" onClick={onExport} disabled={!result}>
              PNGで書き出し
            </button>
            <button
              className="btn btn--ghost btn--sm"
              onClick={() => result && setEditTarget(result.image)}
              disabled={!result}
            >
              このドット絵を編集
            </button>
          </section>

          {error && <p className="msg msg--err">{error}</p>}
          {status && !error && <p className="msg msg--ok">{status}</p>}
        </aside>
      </div>
    </div>
  );
}

export default App;
