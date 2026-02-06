import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface ExportOptions {
  patientAge?: string;
  patientGender?: string;
  clinicName?: string;
}

export async function exportAsPNG(
  elementId: string, 
  filename: string = 'analysis-report'
): Promise<void> {
  const element = document.getElementById(elementId);
  if (!element) {
    throw new Error('Element not found');
  }

  // Create canvas from element
  const canvas = await html2canvas(element, {
    scale: 2, // Higher quality
    backgroundColor: '#ffffff',
    useCORS: true,
    logging: false,
  });

  // Convert to PNG and download
  const link = document.createElement('a');
  link.download = `${filename}.png`;
  link.href = canvas.toDataURL('image/png');
  link.click();
}

export async function exportAsPDF(
  elementId: string,
  filename: string = 'analysis-report',
  options: ExportOptions = {}
): Promise<void> {
  const element = document.getElementById(elementId);
  if (!element) {
    throw new Error('Element not found');
  }

  // Create canvas from element
  const canvas = await html2canvas(element, {
    scale: 2,
    backgroundColor: '#ffffff',
    useCORS: true,
    logging: false,
  });

  const imgData = canvas.toDataURL('image/png');
  const imgWidth = canvas.width;
  const imgHeight = canvas.height;

  // A4 dimensions in mm
  const pdfWidth = 210;
  const pdfHeight = 297;
  
  // Calculate scale to fit width
  const ratio = pdfWidth / imgWidth;
  const scaledHeight = imgHeight * ratio;

  // Create PDF
  const pdf = new jsPDF({
    orientation: scaledHeight > pdfHeight ? 'portrait' : 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  // Add header
  pdf.setFontSize(10);
  pdf.setTextColor(100);
  pdf.text('АнализПро - Расшифровка медицинских анализов', pdfWidth / 2, 10, { align: 'center' });
  
  if (options.clinicName) {
    pdf.text(options.clinicName, pdfWidth / 2, 15, { align: 'center' });
  }

  // Add date
  const date = new Date().toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
  pdf.text(`Дата: ${date}`, pdfWidth - 10, 10, { align: 'right' });

  // Add patient info
  if (options.patientAge || options.patientGender) {
    const genderText = options.patientGender === 'male' ? 'Мужской' : 'Женский';
    pdf.text(`Пациент: ${options.patientAge || ''} лет, пол: ${genderText}`, 10, 20);
  }

  // Add content image
  const contentY = 25;
  const maxContentHeight = pdfHeight - contentY - 15; // Leave space for footer
  
  if (scaledHeight > maxContentHeight) {
    // Content is taller than page, need multiple pages
    let remainingHeight = imgHeight;
    let yOffset = 0;
    let pageNum = 1;
    
    while (remainingHeight > 0) {
      const pageHeight = maxContentHeight / ratio;
      
      // Create a temporary canvas for this page section
      const pageCanvas = document.createElement('canvas');
      pageCanvas.width = imgWidth;
      pageCanvas.height = Math.min(pageHeight, remainingHeight);
      const ctx = pageCanvas.getContext('2d');
      
      if (ctx) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);
        ctx.drawImage(
          canvas, 
          0, yOffset, 
          imgWidth, Math.min(pageHeight, remainingHeight),
          0, 0, 
          imgWidth, Math.min(pageHeight, remainingHeight)
        );
        
        const pageImgData = pageCanvas.toDataURL('image/png');
        
        if (pageNum > 1) {
          pdf.addPage();
        }
        
        pdf.addImage(
          pageImgData, 
          'PNG', 
          0, 
          contentY, 
          pdfWidth, 
          Math.min(pageHeight, remainingHeight) * ratio
        );
      }
      
      remainingHeight -= pageHeight;
      yOffset += pageHeight;
      pageNum++;
    }
  } else {
    // Content fits on one page
    pdf.addImage(imgData, 'PNG', 0, contentY, pdfWidth, scaledHeight);
  }

  // Add footer to last page
  const pageCount = pdf.getNumberOfPages();
  pdf.setPage(pageCount);
  pdf.setFontSize(8);
  pdf.setTextColor(150);
  pdf.text(
    'Данный документ носит информационный характер и не является медицинским заключением.',
    pdfWidth / 2, 
    pdfHeight - 10, 
    { align: 'center' }
  );
  pdf.text(
    '© АнализПро - analizpro.lovable.app',
    pdfWidth / 2, 
    pdfHeight - 5, 
    { align: 'center' }
  );

  // Download
  pdf.save(`${filename}.pdf`);
}

export async function shareAsImage(elementId: string): Promise<void> {
  const element = document.getElementById(elementId);
  if (!element) {
    throw new Error('Element not found');
  }

  const canvas = await html2canvas(element, {
    scale: 2,
    backgroundColor: '#ffffff',
    useCORS: true,
    logging: false,
  });

  // Convert to blob
  const blob = await new Promise<Blob>((resolve) => {
    canvas.toBlob((b) => resolve(b!), 'image/png');
  });

  // Check if Web Share API is available with file support
  if (navigator.share && navigator.canShare?.({ files: [new File([blob], 'report.png', { type: 'image/png' })] })) {
    const file = new File([blob], 'analysis-report.png', { type: 'image/png' });
    
    await navigator.share({
      files: [file],
      title: 'Результаты анализа - АнализПро',
      text: 'Мои результаты анализа от АнализПро'
    });
  } else {
    // Fallback to download
    await exportAsPNG(elementId, 'analysis-report');
  }
}
