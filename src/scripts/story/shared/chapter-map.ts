/**
 * Chapter geometry in document coordinates. Measured once per layout change (O(N)), then
 * each scroll frame answers with a binary search over the cached tops (O(log N), no layout reads).
 */
export function createChapterMap(sections: HTMLElement[]) {
  let tops: number[] = [];
  let bottoms: number[] = [];
  let scrollable = 0;
  let dirty = true;

  function measure() {
    const y = window.scrollY;
    // Read all geometry in one batch before anyone writes styles.
    const rects = sections.map(section => section.getBoundingClientRect());
    tops = rects.map(rect => rect.top + y);
    bottoms = rects.map(rect => rect.bottom + y);
    scrollable = document.documentElement.scrollHeight - window.innerHeight;
    dirty = false;
  }

  /** Index of the last chapter whose top is at or above the document line, or -1. */
  function lastAtOrAbove(line: number) {
    let low = 0, high = tops.length - 1, found = -1;
    while (low <= high) {
      const mid = (low + high) >> 1;
      if (tops[mid] <= line) { found = mid; low = mid + 1; } else high = mid - 1;
    }
    return found;
  }

  return {
    invalidate() { dirty = true; },
    locate(y: number, readingEdge: number) {
      if (dirty) measure();
      const active = Math.max(0, lastAtOrAbove(y + readingEdge));
      const under = lastAtOrAbove(y + 32);
      return {
        active: sections[active] as HTMLElement | undefined,
        beneath: under >= 0 && bottoms[under] > y + 32 ? sections[under] : undefined,
        progress: scrollable > 0 ? Math.min(1, Math.max(0, y / scrollable)) : 0,
      };
    },
  };
}
