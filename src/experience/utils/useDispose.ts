"use client";

import { useEffect } from "react";

interface Disposable {
  dispose(): void;
}

/**
 * Disposes a GPU resource when it is replaced or when the component unmounts.
 * One hook per resource, so a change to one memoised value never disposes its
 * neighbours (a shared "dispose everything" effect would tear down every
 * material whenever any single dependency changed).
 */
export function useDispose<T extends Disposable>(value: T): T {
  useEffect(() => () => value.dispose(), [value]);
  return value;
}

/** Same for a list of resources that is memoised as one array. */
export function useDisposeAll<T extends Disposable>(values: T[]): T[] {
  useEffect(() => () => values.forEach((v) => v.dispose()), [values]);
  return values;
}
