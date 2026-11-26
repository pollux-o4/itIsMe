/**
 * Single active item among keyed elements (State pattern): changing the key touches only the
 * previous and next elements, O(1) per change instead of re-toggling the whole list.
 */
export function createSelection<E extends Element>(
  items: Iterable<E>,
  keyOf: (item: E) => string | undefined,
  apply: (item: E, active: boolean) => void,
) {
  const byKey = new Map<string, E[]>();
  for (const item of items) {
    const key = keyOf(item);
    if (key === undefined) continue;
    const group = byKey.get(key);
    if (group) group.push(item); else byKey.set(key, [item]);
  }
  let current: string | undefined;
  const set = (key: string | undefined, active: boolean) => byKey.get(key ?? '')?.forEach(item => apply(item, active));
  return {
    get current() { return current; },
    get: (key: string) => byKey.get(key)?.[0],
    /** Applies every item once, e.g. to reset static markup. */
    reset(key: string) {
      for (const [itemKey, group] of byKey) group.forEach(item => apply(item, itemKey === key));
      current = key;
    },
    select(key: string) {
      if (key === current) return false;
      set(current, false);
      set(key, true);
      current = key;
      return true;
    },
  };
}
