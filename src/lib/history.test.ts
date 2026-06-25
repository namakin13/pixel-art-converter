import { describe, it, expect } from "vitest";
import { createHistory, commit, undo, redo, canUndo, canRedo } from "./history";

describe("history", () => {
  it("初期状態は undo/redo 不可", () => {
    const h = createHistory("a");
    expect(h.present).toBe("a");
    expect(canUndo(h)).toBe(false);
    expect(canRedo(h)).toBe(false);
  });

  it("commit で present が更新され undo 可能になる", () => {
    let h = createHistory("a");
    h = commit(h, "b");
    expect(h.present).toBe("b");
    expect(canUndo(h)).toBe(true);
  });

  it("undo で前の状態に戻り、redo で戻れる", () => {
    let h = createHistory("a");
    h = commit(h, "b");
    h = commit(h, "c");
    h = undo(h);
    expect(h.present).toBe("b");
    expect(canRedo(h)).toBe(true);
    h = redo(h);
    expect(h.present).toBe("c");
  });

  it("commit すると future（やり直し）が破棄される", () => {
    let h = createHistory("a");
    h = commit(h, "b");
    h = undo(h); // present=a, future=[b]
    h = commit(h, "x"); // 新しい枝
    expect(h.present).toBe("x");
    expect(canRedo(h)).toBe(false);
  });

  it("戻せない/進めない時は同じ状態を返す", () => {
    const h = createHistory("a");
    expect(undo(h).present).toBe("a");
    expect(redo(h).present).toBe("a");
  });

  it("limit を超えると古い履歴が捨てられる", () => {
    let h = createHistory(0, 2);
    h = commit(h, 1);
    h = commit(h, 2);
    h = commit(h, 3); // past は最大2件
    expect(h.past.length).toBe(2);
    expect(h.present).toBe(3);
  });
});
