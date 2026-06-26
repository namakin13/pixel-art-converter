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
      <div className="statusbar">
        <span className="statusbar__1up">1UP</span>
        <span className="statusbar__credit">CREDIT 01</span>
      </div>

      <div className="home__center">
        <div className="home__hero">
          <h1 className="home__title">
            DOT ART
            <br />
            CONVERTER
          </h1>
          <p className="home__sub">イラストをドット絵に　・　ゼロから作成</p>
        </div>

        {!showNew ? (
          <>
            <div className="home__menu">
              <button className="menu-item menu-item--on" onClick={onConvert}>
                <span className="menu-item__arrow">▶</span>
                <span className="menu-item__body">
                  <span className="menu-item__title">画像をへんかん</span>
                  <span className="menu-item__desc">イラスト・写真をドット絵に</span>
                </span>
                <span className="menu-item__key">A</span>
              </button>
              <button className="menu-item" onClick={() => setShowNew(true)}>
                <span className="menu-item__arrow">▶</span>
                <span className="menu-item__body">
                  <span className="menu-item__title">しんきさくせい</span>
                  <span className="menu-item__desc">空のキャンバスから描く</span>
                </span>
                <span className="menu-item__key">B</span>
              </button>
            </div>
            <div className="press-start">PRESS START</div>
          </>
        ) : (
          <div className="newcanvas">
            <h2>NEW CANVAS</h2>
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
    </div>
  );
}
