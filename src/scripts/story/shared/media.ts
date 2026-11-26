// One source for the media queries every behavior consults.
export const reducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)');
export const finePointer = () => matchMedia('(hover: hover) and (pointer: fine)');
