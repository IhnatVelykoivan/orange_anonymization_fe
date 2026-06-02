import '@testing-library/jest-dom';

// jsdom has no ResizeObserver / matchMedia; Recharts' ResponsiveContainer and
// MUI's useMediaQuery rely on them. Stub them so page-level component tests render.
class ResizeObserverStub {
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
}

globalThis.ResizeObserver = ResizeObserverStub as unknown as typeof ResizeObserver;

if (!window.matchMedia) {
  window.matchMedia = ((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia;
}

// jsdom does not implement SVG layout; Recharts measures text/elements via
// getBBox and getComputedTextLength while rendering chart labels and axes.
if (!('getBBox' in SVGElement.prototype)) {
  (SVGElement.prototype as unknown as { getBBox: () => DOMRect }).getBBox = () =>
    ({ x: 0, y: 0, width: 120, height: 16 }) as DOMRect;
}

if (!('getComputedTextLength' in SVGElement.prototype)) {
  (
    SVGElement.prototype as unknown as { getComputedTextLength: () => number }
  ).getComputedTextLength = () => 80;
}
