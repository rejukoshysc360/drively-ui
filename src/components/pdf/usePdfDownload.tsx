import React, { RefObject } from 'react';
import { createRoot } from 'react-dom/client';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export type HtmlToPdfOptions = {
  filename: string;
  /** Fixed pixel width to render content. 794 ≈ A4 @ 96dpi for stable wrapping */
  width?: number;            // default: 794
  /** Screenshot scale for crisp text */
  scale?: number;            // default: 2.5
  /** PDF page size */
  page?: 'a4' | 'letter';    // default: 'a4'
  /** Page background */
  background?: string;       // default: '#ffffff'
  /** Extra padding for off-screen mount */
  padding?: number;          // default: 24
};

const DEFAULTS: Required<Omit<HtmlToPdfOptions, 'filename'>> = {
  width: 794,
  scale: 2.5,
  page: 'a4',
  background: '#ffffff',
  padding: 24,
};

// ---------- tiny utils ----------
async function waitForFonts() {
  const fonts = (document as any).fonts;
  if (fonts?.ready) { try { await fonts.ready; } catch {} }
}
function waitForImages(root: HTMLElement) {
  const imgs = Array.from(root.querySelectorAll('img'));
  if (imgs.length === 0) return Promise.resolve();
  return Promise.all(
    imgs.map(
      (img) =>
        new Promise<void>((res) => {
          if (img.complete && img.naturalWidth > 0) return res();
          img.onload = () => res();
          img.onerror = () => res();
        })
    )
  );
}
function doubleRAF(): Promise<void> {
  return new Promise((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
  });
}

async function elementToPdf(
  el: HTMLElement,
  { filename, width, scale, page, background, padding }: Required<HtmlToPdfOptions>
) {
  // ensure measured width matches capture width
  const canvas = await html2canvas(el, {
    scale,
    backgroundColor: background,
    useCORS: true,
    allowTaint: true,
    width: width,
    windowWidth: width + padding * 2,
  });

  const pdf = new jsPDF('p', 'pt', page);
  const pageWidth = pdf.internal.pageSize.getWidth();   // 595pt (A4)
  const pageHeight = pdf.internal.pageSize.getHeight(); // 842pt (A4)

  const imgWidth = pageWidth;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;

  if (imgHeight <= pageHeight) {
    pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, imgWidth, imgHeight, undefined, 'FAST');
  } else {
    // slice across pages
    const pageCanvas = document.createElement('canvas');
    const pageCtx = pageCanvas.getContext('2d')!;
    const scaleFactor = imgWidth / canvas.width;
    const pageCanvasHeight = pageHeight / scaleFactor;

    let renderedHeight = 0;
    let idx = 0;

    while (renderedHeight < canvas.height) {
      const sliceHeight = Math.min(pageCanvasHeight, canvas.height - renderedHeight);
      pageCanvas.width = canvas.width;
      pageCanvas.height = sliceHeight;

      pageCtx.clearRect(0, 0, pageCanvas.width, pageCanvas.height);
      pageCtx.drawImage(
        canvas,
        0, renderedHeight, canvas.width, sliceHeight,
        0, 0, canvas.width, sliceHeight
      );

      const pageData = pageCanvas.toDataURL('image/png');
      if (idx > 0) pdf.addPage();
      pdf.addImage(pageData, 'PNG', 0, 0, imgWidth, sliceHeight * scaleFactor, undefined, 'FAST');

      renderedHeight += sliceHeight;
      idx++;
    }
  }

  pdf.save(filename);
}

// ---------- PUBLIC HOOK ----------
export function usePdfDownload() {
  const downloadFromRef = async (ref: RefObject<HTMLElement>, opts: HtmlToPdfOptions) => {
    if (!ref.current) return;
    const o = { ...DEFAULTS, ...opts };
    await waitForFonts();
    await waitForImages(ref.current);
    await doubleRAF();
    await elementToPdf(ref.current, o as Required<HtmlToPdfOptions>);
  };

  /**
   * Headless/off-screen: provide a render() that returns your document JSX.
   * We'll mount it off-screen at a fixed width, capture, then unmount.
   */
  const downloadFromRender = async (render: () => React.ReactNode, opts: HtmlToPdfOptions) => {
    const o = { ...DEFAULTS, ...opts };

    const host = document.createElement('div');
    host.style.position = 'fixed';
    host.style.left = '-10000px';
    host.style.top = '0';
    host.style.background = o.background;
    host.style.width = `${o.width}px`;
    host.style.padding = `${o.padding}px`;
    host.style.zIndex = '0';
    document.body.appendChild(host);

    const root = createRoot(host);
    root.render(<div style={{ width: o.width }}>{render()}</div>);

    try {
      await waitForFonts();
      await waitForImages(host);
      await doubleRAF();
      await elementToPdf(host, o as Required<HtmlToPdfOptions>);
    } finally {
      root.unmount();
      host.remove();
    }
  };

  return { downloadFromRef, downloadFromRender };
}

// ---------- Convenience Button ----------
type ButtonProps =
  | ({ targetRef: RefObject<HTMLElement>; render?: never } & HtmlToPdfOptions)
  | ({ render: () => React.ReactNode; targetRef?: never } & HtmlToPdfOptions);

export function PdfDownloadButton(props: ButtonProps & { className?: string; children?: React.ReactNode }) {
  const { downloadFromRef, downloadFromRender } = usePdfDownload();
  const { className, children, ...rest } = props as any;

  const onClick = async () => {
    if ('targetRef' in rest && rest.targetRef) {
      await downloadFromRef(rest.targetRef, rest);
    } else if ('render' in rest && rest.render) {
      await downloadFromRender(rest.render, rest);
    }
  };

  return (
    <button type="button" onClick={onClick} className={className}>
      {children ?? 'Download PDF'}
    </button>
  );
}
