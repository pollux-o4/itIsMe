// Reads what the viewer shows from an exhibit's rendered markup; Exhibit.astro stays the only author of it.
export interface ExhibitSource {
  frame: HTMLElement;
  ratio: number;
  sourceWidth: number;
  /** The picture and its numbered marks, cloned at full resolution. */
  layer(): HTMLElement;
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
      const picture = frame.querySelector('img')!.cloneNode() as HTMLImageElement;
      picture.sizes = '100vw';
      picture.loading = 'eager';
      const layer = document.createElement('div');
      layer.className = 'viewer-canvas';
      layer.append(picture, ...[...frame.querySelectorAll('.exhibit-mark')].map(mark => mark.cloneNode(true)));
      return layer;
    },
    caption() {
      const caption = frame.closest('.exhibit')?.querySelector('figcaption');
      return caption ? [...caption.children].map(child => child.cloneNode(true)) : [];
    },
  };
}
