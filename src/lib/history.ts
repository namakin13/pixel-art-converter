/** Undo/Redo を管理する汎用履歴。状態 T は不変オブジェクトを想定。 */
export interface History<T> {
  past: T[];
  present: T;
  future: T[];
  /** past に保持する最大件数。 */
  limit: number;
}

export function createHistory<T>(initial: T, limit = 50): History<T> {
  return { past: [], present: initial, future: [], limit };
}

/** 新しい状態を確定する。現在状態を past に積み、future（やり直し）は破棄する。 */
export function commit<T>(h: History<T>, next: T): History<T> {
  const past = [...h.past, h.present];
  // 上限を超えたら古いものから捨てる
  while (past.length > h.limit) past.shift();
  return { past, present: next, future: [], limit: h.limit };
}

export function canUndo<T>(h: History<T>): boolean {
  return h.past.length > 0;
}

export function canRedo<T>(h: History<T>): boolean {
  return h.future.length > 0;
}

/** 1つ前の状態へ戻す。戻せない場合はそのまま返す。 */
export function undo<T>(h: History<T>): History<T> {
  if (!canUndo(h)) return h;
  const past = h.past.slice();
  const prev = past.pop()!;
  return { past, present: prev, future: [h.present, ...h.future], limit: h.limit };
}

/** 1つ先の状態へ進める。進めない場合はそのまま返す。 */
export function redo<T>(h: History<T>): History<T> {
  if (!canRedo(h)) return h;
  const future = h.future.slice();
  const next = future.shift()!;
  return { past: [...h.past, h.present], present: next, future, limit: h.limit };
}
