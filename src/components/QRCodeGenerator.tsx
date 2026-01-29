import { QRCodeSVG } from 'qrcode.react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Download, Copy, Check } from 'lucide-react';
import { useState, useRef } from 'react';
import { toast } from 'sonner';

interface QRCodeGeneratorProps {
  url: string;
  clinicName: string;
}

export function QRCodeGenerator({ url, clinicName }: QRCodeGeneratorProps) {
  const [copied, setCopied] = useState(false);
  const qrRef = useRef<HTMLDivElement>(null);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success('Ссылка скопирована');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Не удалось скопировать');
    }
  };

  const handleDownloadQR = () => {
    const svg = qrRef.current?.querySelector('svg');
    if (!svg) return;

    // Create canvas
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const size = 400;
    canvas.width = size;
    canvas.height = size + 60; // Extra space for text

    // White background
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw QR code
    const svgData = new XMLSerializer().serializeToString(svg);
    const img = new Image();
    img.onload = () => {
      ctx.drawImage(img, 0, 0, size, size);
      
      // Add clinic name
      ctx.fillStyle = '#374151';
      ctx.font = 'bold 18px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(clinicName, size / 2, size + 30);
      ctx.font = '14px sans-serif';
      ctx.fillStyle = '#6b7280';
      ctx.fillText('АнализПро', size / 2, size + 50);

      // Download
      const link = document.createElement('a');
      link.download = `qr-${clinicName.toLowerCase().replace(/\s+/g, '-')}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      toast.success('QR-код скачан');
    };
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  };

  return (
    <Card className="p-6 border-2 border-border/50">
      <h3 className="font-semibold text-lg mb-4">Ваш QR-код</h3>
      
      <div className="flex flex-col items-center gap-4">
        <div ref={qrRef} className="p-4 bg-white rounded-xl shadow-md">
          <QRCodeSVG
            value={url}
            size={200}
            level="H"
            includeMargin={true}
          />
        </div>

        <div className="w-full space-y-2">
          <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
            <code className="flex-1 text-xs truncate">{url}</code>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopyLink}
              className="shrink-0"
            >
              {copied ? (
                <Check className="w-4 h-4 text-green-500" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </Button>
          </div>

          <Button
            onClick={handleDownloadQR}
            className="w-full gap-2"
            variant="outline"
          >
            <Download className="w-4 h-4" />
            Скачать QR-код
          </Button>
        </div>
      </div>

      <p className="text-xs text-muted-foreground text-center mt-4">
        Распечатайте QR-код и разместите в клинике. Пациенты смогут быстро получить доступ к сервису.
      </p>
    </Card>
  );
}
