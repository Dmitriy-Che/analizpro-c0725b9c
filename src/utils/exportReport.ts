import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export async function exportAsPNG(
  elementId: string, 
  filename: string = 'analysis-report'
): Promise<void> {
  const element = document.getElementById(elementId);
  if (!element) throw new Error('Element not found');

  const canvas = await html2canvas(element, {
    scale: 2,
    backgroundColor: '#ffffff',
    useCORS: true,
    logging: false,
  });

  const link = document.createElement('a');
  link.download = `${filename}.png`;
  link.href = canvas.toDataURL('image/png');
  link.click();
}

export async function exportAsPDF(
  elementId: string,
  filename: string = 'analysis-report'
): Promise<void> {
  const element = document.getElementById(elementId);
  if (!element) throw new Error('Element not found');

  const canvas = await html2canvas(element, {
    scale: 2,
    backgroundColor: '#ffffff',
    useCORS: true,
    logging: false,
  });

  const imgData = canvas.toDataURL('image/png');

  // A4 dimensions in mm
  const pageW = 210;
  const pageH = 297;
  const margin = 10; // 10mm margins on all sides
  const contentW = pageW - margin * 2; // 190mm usable width

  // Scale image to fit content width
  const imgAspect = canvas.height / canvas.width;
  const scaledH = contentW * imgAspect; // total image height in mm

  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  const usableH = pageH - margin * 2; // usable height per page

  if (scaledH <= usableH) {
    // Fits on one page
    pdf.addImage(imgData, 'PNG', margin, margin, contentW, scaledH);
  } else {
    // Multi-page: slice the canvas into page-sized chunks
    const pxPerMm = canvas.width / contentW;
    const sliceHeightPx = usableH * pxPerMm;
    let remainingPx = canvas.height;
    let srcY = 0;
    let page = 0;

    while (remainingPx > 0) {
      const chunkPx = Math.min(sliceHeightPx, remainingPx);
      const chunkMm = chunkPx / pxPerMm;

      // Create a sub-canvas for this page
      const pageCanvas = document.createElement('canvas');
      pageCanvas.width = canvas.width;
      pageCanvas.height = chunkPx;
      const ctx = pageCanvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);
        ctx.drawImage(canvas, 0, srcY, canvas.width, chunkPx, 0, 0, canvas.width, chunkPx);
      }

      if (page > 0) pdf.addPage();
      pdf.addImage(pageCanvas.toDataURL('image/png'), 'PNG', margin, margin, contentW, chunkMm);

      srcY += chunkPx;
      remainingPx -= chunkPx;
      page++;
    }
  }

  pdf.save(`${filename}.pdf`);
}

export async function shareAsImage(elementId: string): Promise<void> {
  const element = document.getElementById(elementId);
  if (!element) throw new Error('Element not found');

  const canvas = await html2canvas(element, {
    scale: 2,
    backgroundColor: '#ffffff',
    useCORS: true,
    logging: false,
  });

  const blob = await new Promise<Blob>((resolve) => {
    canvas.toBlob((b) => resolve(b!), 'image/png');
  });

  if (navigator.share && navigator.canShare?.({ files: [new File([blob], 'report.png', { type: 'image/png' })] })) {
    const file = new File([blob], 'analysis-report.png', { type: 'image/png' });
    await navigator.share({
      files: [file],
      title: 'Результаты анализа',
      text: 'Мои результаты анализа'
    });
  } else {
    await exportAsPNG(elementId, 'analysis-report');
  }
}
