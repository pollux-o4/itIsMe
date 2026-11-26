/** A single geometric ladder, capped at and including the original width. */
export function imageWidths(sourceWidth: number): number[] {
  if (!Number.isInteger(sourceWidth) || sourceWidth < 1) {
    throw new RangeError('Image width must be a positive integer');
  }
  const widths = new Set<number>();
  for (let candidate = 32; candidate < sourceWidth; candidate *= 1.3) {
    widths.add(Math.round(candidate));
  }
  widths.add(sourceWidth);
  return [...widths];
}

export function imageQuality(name: string): number {
  return name === 'portrait' ? 100 : 85;
}
