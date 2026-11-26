// Reads what the viewer shows from an exhibit's rendered markup; Exhibit.astro stays the only author of it.
export interface ExhibitSource {
  frame: HTMLElement;
  ratio: number;
  sourceWidth: number;
  /** The picture and its numbered marks; starts from the tile's already-decoded pixels. */
  layer(): HTMLElement;
  /** Swaps in the full-resolution source once it is decoded, so the swap never shows a blank frame. */
  sharpen(layer: HTMLElement): Promise<void>;
  /** Caption, keys and page, cloned. */
  caption(): Node[];
}

const numberVar = (frame: HTMLElement, name: string) => Number(frame.style.getPropertyValue(name)) || 0;

export function readExhibit(frame: HTMLElement): ExhibitSource {
  return {
    frame,
    ratio: numberVar(frame, '--ratio') || 1,
    sourceWidth: numberVar(frame, '--source-width'),
    layer() {
      const tile = frame.querySelector('img')!;
      const picture = tile.cloneNode() as HTMLImageElement;
      picture.removeAttribute('srcset');
      picture.src = tile.currentSrc || tile.src;
      picture.loading = 'eager';
      const layer = document.createElement('div');
      layer.className = 'viewer-canvas';
      layer.append(picture, ...[...frame.querySelectorAll('.exhibit-mark')].map(mark => mark.cloneNode(true)));
      return layer;
    },
    async sharpen(layer) {
      const tile = frame.querySelector('img')!;
      const shown = layer.querySelector('img');
      if (!shown || !tile.srcset) return;
      const full = Object.assign(new Image(), { sizes: '100vw', srcset: tile.srcset, src: tile.src, alt: '' });
      try { await full.decode(); } catch { return; }
      if (!shown.isConnected || full.currentSrc === shown.currentSrc) return;
      shown.src = full.currentSrc;
    },
    caption() {
      const caption = frame.closest('.exhibit')?.querySelector('figcaption');
      return caption ? [...caption.children].map(child => child.cloneNode(true)) : [];
    },
  };
}
