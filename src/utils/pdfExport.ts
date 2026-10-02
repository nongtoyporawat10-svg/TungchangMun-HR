import { toJpeg } from 'html-to-image';
import jsPDF from 'jspdf';

export interface PDFExportOptions {
  filename?: string;
  margin?: number;
  orientation?: 'portrait' | 'landscape';
  scale?: number;
  fitToSinglePage?: boolean;
}

/**
 * High-quality Thai Government Document PDF Exporter
 * Converts DOM element into an authentic, crisp A4 PDF using native browser rasterization.
 * Formats content strictly within standard A4 dimensions (210mm x 297mm) without edge clipping.
 */
export async function exportElementToPDF(
  element: HTMLElement,
  options: PDFExportOptions = {}
): Promise<void> {
  const {
    filename = 'official-document.pdf',
    orientation = 'portrait',
    scale = 2,
    margin = 6, // 6mm safe margin for government print
    fitToSinglePage = false,
  } = options;

  const resolvedFilename = filename.endsWith('.pdf') ? filename : `${filename}.pdf`;

  try {
    // Measure accurate element bounds
    const scrollWidth = Math.max(element.scrollWidth, element.clientWidth, 800);
    const scrollHeight = Math.max(element.scrollHeight, element.clientHeight);

    // Generate high-resolution image data URL using html-to-image
    const imgDataUrl = await toJpeg(element, {
      quality: 0.98,
      pixelRatio: scale,
      backgroundColor: '#ffffff',
      cacheBust: true,
      skipFonts: true,
      fontEmbedCSS: '',
      width: scrollWidth,
      height: scrollHeight,
      style: {
        transform: 'scale(1)',
        transformOrigin: 'top left',
        margin: '0',
      },
      filter: (node) => {
        // Exclude elements marked with print:hidden, no-print, or pdf-exclude
        if (node instanceof HTMLElement && (node.classList.contains('print:hidden') || node.classList.contains('no-print') || node.classList.contains('pdf-exclude'))) {
          if (node === element) return true;
          return false;
        }
        return true;
      }
    });

    // Determine dimensions from loaded image
    const img = new Image();
    img.src = imgDataUrl;
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = (e) => reject(new Error(`Failed to load rendered image: ${e}`));
    });

    const pdf = new jsPDF({
      orientation: orientation,
      unit: 'mm',
      format: 'a4',
      compress: true,
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const printableWidth = pageWidth - (margin * 2);
    const printableHeight = pageHeight - (margin * 2);

    // Scale image proportionally to fit printable width
    let imgWidth = printableWidth;
    let imgHeight = (img.naturalHeight * printableWidth) / img.naturalWidth;

    // If fitToSinglePage is requested or image is slightly taller than 1 page (within 15% tolerance), scale to fit 1 page
    if (fitToSinglePage || (imgHeight > printableHeight && imgHeight <= printableHeight * 1.18)) {
      const scaleFactor = printableHeight / imgHeight;
      imgHeight = printableHeight;
      imgWidth = imgWidth * scaleFactor;
      const xOffset = margin + (printableWidth - imgWidth) / 2;
      pdf.addImage(imgDataUrl, 'JPEG', xOffset, margin, imgWidth, imgHeight, undefined, 'FAST');
    } else {
      let heightLeft = imgHeight;
      let position = margin;

      // First page
      pdf.addImage(imgDataUrl, 'JPEG', margin, position, imgWidth, imgHeight, undefined, 'FAST');
      heightLeft -= printableHeight;

      // Handle multiple pages if document length exceeds single A4
      while (heightLeft > 0) {
        position = heightLeft - imgHeight + margin;
        pdf.addPage();
        pdf.addImage(imgDataUrl, 'JPEG', margin, position, imgWidth, imgHeight, undefined, 'FAST');
        heightLeft -= printableHeight;
      }
    }

    pdf.save(resolvedFilename);
  } catch (error) {
    console.error('Error generating PDF via html-to-image:', error);
    // Fallback: trigger browser print dialog if PDF generator fails
    window.print();
    throw error;
  }
}

