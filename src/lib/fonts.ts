import declarations from 'pretendard/dist/web/variable/pretendardvariable-dynamic-subset.css?raw';

const files = import.meta.glob<string>('../../node_modules/pretendard/dist/web/variable/woff2-dynamic-subset/*.woff2', {
  eager: true, query: '?url', import: 'default',
});

// Preload only glyph ranges used above the fold, including future CMS edits.
export function criticalFonts(text: string) {
  const codepoints = [...new Set([...text].map(character => character.codePointAt(0)!))];
  return [...declarations.matchAll(/url\(\.\/woff2-dynamic-subset\/([^)]*)\)[\s\S]*?unicode-range:\s*([^;]+);/g)]
    .filter(([, , ranges]) => ranges.split(',').some(range => {
      const [start, end = start] = range.trim().replace('U+', '').split('-').map(value => parseInt(value, 16));
      return codepoints.some(value => value >= start && value <= end);
    }))
    .map(([, filename]) => {
      const href = files[`../../node_modules/pretendard/dist/web/variable/woff2-dynamic-subset/${filename}`];
      if (!href) throw new Error(`Missing critical font: ${filename}`);
      return href;
    });
}
