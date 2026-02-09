import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

function isMobile(): boolean {
  return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
}

async function canShareFiles(files: File[]): Promise<boolean> {
  try {
    return !!(navigator.share && navigator.canShare?.({ files }));
  } catch {
    return false;
  }
}

async function renderElement(elementId: string): Promise<HTMLCanvasElement> {
  const element = document.getElementById(elementId);
  if (!element) throw new Error('Element not found');
  return html2canvas(element, {
    scale: 2,
    backgroundColor: '#ffffff',
    useCORS: true,
    logging: false,
  });
}

function buildPDF(canvas: HTMLCanvasElement): jsPDF {
  const imgData = canvas.toDataURL('image/png');
  const pageW = 210;
  const pageH = 297;
  const margin = 10;
  const contentW = pageW - margin * 2;
  const imgAspect = canvas.height / canvas.width;
  const scaledH = contentW * imgAspect;
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const usableH = pageH - margin * 2;

  if (scaledH <= usableH) {
    pdf.addImage(imgData, 'PNG', margin, margin, contentW, scaledH);
  } else {
    const pxPerMm = canvas.width / contentW;
    const sliceHeightPx = usableH * pxPerMm;
    let remainingPx = canvas.height;
    let srcY = 0;
    let page = 0;

    while (remainingPx > 0) {
      const chunkPx = Math.min(sliceHeightPx, remainingPx);
      const chunkMm = chunkPx / pxPerMm;
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
  return pdf;
}

export async function exportAsPNG(
  elementId: string, 
  filename: string = 'analysis-report'
): Promise<void> {
  const canvas = await renderElement(elementId);
  const link = document.createElement('a');
  link.download = `${filename}.png`;
  link.href = canvas.toDataURL('image/png');
  link.click();
}

export async function exportAsPDF(
  elementId: string,
  filename: string = 'analysis-report'
): Promise<void> {
  const canvas = await renderElement(elementId);
  const pdf = buildPDF(canvas);

  if (isMobile()) {
    const blob = pdf.output('blob');
    const file = new File([blob], `${filename}.pdf`, { type: 'application/pdf' });

    if (await canShareFiles([file])) {
      await navigator.share({
        files: [file],
        title: 'Результаты анализа',
      });
    } else {
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
    }
  } else {
    pdf.save(`${filename}.pdf`);
  }
}

export async function shareAsPDF(
  elementId: string,
  filename: string = 'analysis-report'
): Promise<void> {
  const canvas = await renderElement(elementId);
  const pdf = buildPDF(canvas);
  const blob = pdf.output('blob');
  const file = new File([blob], `${filename}.pdf`, { type: 'application/pdf' });

  if (await canShareFiles([file])) {
    await navigator.share({
      files: [file],
      title: 'Результаты анализа',
    });
  } else {
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
  }
}

export async function shareAsImage(elementId: string): Promise<void> {
  const canvas = await renderElement(elementId);

  const blob = await new Promise<Blob>((resolve) => {
    canvas.toBlob((b) => resolve(b!), 'image/png');
  });

  const file = new File([blob], 'analysis-report.png', { type: 'image/png' });

  if (await canShareFiles([file])) {
    await navigator.share({
      files: [file],
      title: 'Результаты анализа',
      text: 'Мои результаты анализа'
    });
  } else {
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
  }
}
