import { useState } from "react";

const SIZE_PRESETS = [16, 32, 48, 64, 128];

export default function Home({
  onConvert,
  onCreate,
}: {
  onConvert: () => void;
  onCreate: (width: number, height: number, transparent: boolean) => void;
}) {
  const [showNew, setShowNew] = useState(false);
  const [width, setWidth] = useState(32);
  const [height, setHeight] = useState(32);
  const [transparent, setTransparent] = useState(true);

  return (
    <div className="home">
      <div className="home__hero">
        <h1 className="home__title">ドット絵コンバーター</h1>
        <p className="home__sub">イラストをドット絵に変換 ・ ゼロから作成</p>
      </div>

      {!showNew ? (
        <div className="home__cards">
          <button className="home-card" onClick={onConvert}>
            <span className="home-card__icon">🖼️</span>
            <span className="home-card__title">画像を変換</span>
            <span className="home-card__desc">イラストや写真をドット絵に変換します</span>
          </button>
          <button className="home-card" onClick={() => setShowNew(true)}>
            <span className="home-card__icon">✨</span>
            <span className="home-card__title">新規作成</span>
            <span className="home-card__desc">空のキャンバスからドット絵を描きます</span>
          </button>
        </div>
      ) : (
        <div className="newcanvas">
          <h2>新しいキャンバス</h2>
          <div className="newcanvas__row">
            <label>
              幅
              <input
                type="number"
                min={1}
                max={256}
                value={width}
                onChange={(e) => setWidth(Math.min(256, Math.max(1, Number(e.target.value) || 1)))}
              />
            </label>
            <span className="newcanvas__x">×</span>
            <label>
              高さ
              <input
                type="number"
                min={1}
                max={256}
                value={height}
                onChange={(e) => setHeight(Math.min(256, Math.max(1, Number(e.target.value) || 1)))}
              />
            </label>
          </div>
          <div className="chips">
            {SIZE_PRESETS.map((s) => (
              <button
                key={s}
                className={`chip ${width === s && height === s ? "chip--on" : ""}`}
                onClick={() => {
                  setWidth(s);
                  setHeight(s);
                }}
              >
                {s}×{s}
              </button>
            ))}
          </div>
          <label className="check">
            <input type="checkbox" checked={transparent} onChange={(e) => setTransparent(e.target.checked)} />
            背景を透過にする
          </label>
          <div className="newcanvas__actions">
            <button className="btn btn--ghost" onClick={() => setShowNew(false)}>
              キャンセル
            </button>
            <button className="btn btn--primary" onClick={() => onCreate(width, height, transparent)}>
              作成
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
