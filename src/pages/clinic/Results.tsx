import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { CheckCircle2, AlertTriangle, Download, Share2, ArrowLeft, FileImage, FileText, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PartnerHeader } from "@/components/PartnerHeader";
import { AnalysisReport } from "@/components/results/AnalysisReport";
import { usePartnerBySlug } from "@/hooks/usePartner";
import { parseAnalysisResult, getOverallStatusColor } from "@/types/analysis";
import { exportAsPNG, exportAsPDF, shareAsImage } from "@/utils/exportReport";
import { toast } from "sonner";

export default function ClinicResults() {
  const { slug } = useParams<{ slug: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const { partner, loading: partnerLoading, error: partnerError } = usePartnerBySlug(slug);
  
  const result = location.state?.result || "";
  const age = location.state?.age || "";
  const gender = location.state?.gender || "";

  useEffect(() => {
    if (!result) {
      navigate(`/c/${slug}`);
    }
  }, [result, navigate, slug]);

  const parsedResult = parseAnalysisResult(result);

  const getTextResultStatus = (text: string): 'normal' | 'warning' | 'critical' => {
    const lowerText = text.toLowerCase();
    if (lowerText.includes('срочно') || lowerText.includes('критично') || lowerText.includes('немедленно') || lowerText.includes('опасно')) {
      return 'critical';
    }
    if (lowerText.includes('обратить внимание') || lowerText.includes('повышен') || lowerText.includes('понижен') || lowerText.includes('отклонение')) {
      return 'warning';
    }
    return 'normal';
  };

  const handleExportPNG = async () => {
    setExporting(true);
    try {
      await exportAsPNG('analysis-report', `analiz-${partner?.name || 'pro'}-${new Date().toISOString().split('T')[0]}`);
      toast.success("Изображение скачано");
    } catch (error) {
      toast.error("Ошибка при экспорте");
    } finally {
      setExporting(false);
    }
  };

  const handleExportPDF = async () => {
    setExporting(true);
    try {
      await exportAsPDF(
        'analysis-report', 
        `analiz-${partner?.name || 'pro'}-${new Date().toISOString().split('T')[0]}`
      );
      toast.success("PDF скачан");
    } catch (error) {
      toast.error("Ошибка при экспорте");
    } finally {
      setExporting(false);
    }
  };

  const handleShare = async () => {
    setExporting(true);
    try {
      await shareAsImage('analysis-report');
      toast.success("Готово к отправке");
    } catch (error) {
      toast.error("Ошибка при подготовке");
    } finally {
      setExporting(false);
      setShareDialogOpen(false);
    }
  };

  const textStatus = parsedResult.text ? getTextResultStatus(parsedResult.text) : 'normal';
  const textStatusColors = getOverallStatusColor(textStatus);

  if (partnerLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-accent/5 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (partnerError || !partner) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-accent/5 flex items-center justify-center px-4">
        <Card className="p-8 text-center max-w-md">
          <h1 className="text-2xl font-bold mb-4">Клиника не найдена</h1>
          <Button onClick={() => navigate('/')}>Перейти на главную</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-accent/5 py-6 px-4 sm:py-10">
      <div className="hidden lg:block fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/4 w-64 h-64 bg-secondary/5 rounded-full blur-3xl" />
      </div>
      
      <Card className="relative max-w-[480px] lg:max-w-[560px] mx-auto rounded-3xl p-6 sm:p-8 lg:p-10 shadow-[var(--shadow-large)] border-border/50 backdrop-blur-sm bg-card/95">
        <PartnerHeader 
          clinicName={partner.name} 
          clinicLogo={partner.logo_url} 
          slug={partner.slug}
        />

        <Button 
          onClick={() => navigate(`/c/${slug}`)} 
          variant="outline"
          className="mb-6 gap-2 border-2 hover:bg-primary hover:text-white hover:border-primary transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          Назад к загрузке
        </Button>

        {/* Results */}
        {parsedResult.isStructured && parsedResult.structured ? (
          <>
            <AnalysisReport 
              result={parsedResult.structured}
              age={age}
              gender={gender}
              clinicName={partner.name}
              clinicLogo={partner.logo_url}
            />
            
            {/* Export Buttons */}
            <div className="flex gap-3 mt-4">
              <Button 
                variant="outline" 
                className="flex-1 gap-2 border-2 hover:bg-primary hover:text-white hover:border-primary transition-all" 
                onClick={handleExportPDF}
                disabled={exporting}
              >
                {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
                Скачать PDF
              </Button>
              <Button 
                variant="outline" 
                className="flex-1 gap-2 border-2 hover:bg-accent hover:text-white hover:border-accent transition-all" 
                onClick={() => setShareDialogOpen(true)}
                disabled={exporting}
              >
                <Share2 className="w-4 h-4" />
                Поделиться
              </Button>
            </div>
          </>
        ) : (
          /* Fallback for text-only results */
          <Card className={`border-2 ${textStatusColors.border} rounded-2xl shadow-xl overflow-hidden animate-fade-in`}>
            <div className={`${textStatusColors.header} p-4`}>
              <h3 className="text-white font-bold text-lg flex items-center gap-2">
                <CheckCircle2 className="w-6 h-6" />
                Результаты анализа
              </h3>
            </div>
            <div id="analysis-report" className={`p-5 ${textStatusColors.body}`}>
              <div className="whitespace-pre-line text-sm text-foreground leading-relaxed mb-4">
                {parsedResult.text}
              </div>
            </div>
            <div className="p-4 pt-0">
              <div className="flex gap-3">
                <Button 
                  variant="outline" 
                  className="flex-1 gap-2 border-2 hover:bg-primary hover:text-white hover:border-primary transition-all" 
                  onClick={() => {
                    const blob = new Blob([parsedResult.text || ''], { type: 'text/plain' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `analiz-${partner.name}.txt`;
                    a.click();
                    toast.success("Результат скачан");
                  }}
                >
                  <Download className="w-4 h-4" />
                  Скачать
                </Button>
                <Button 
                  variant="outline" 
                  className="flex-1 gap-2 border-2 hover:bg-accent hover:text-white hover:border-accent transition-all" 
                  onClick={() => setShareDialogOpen(true)}
                >
                  <Share2 className="w-4 h-4" />
                  Отправить
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Share Dialog */}
        <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Поделиться результатами</DialogTitle>
              <DialogDescription>
                Выберите формат для отправки
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-3 py-4">
              {parsedResult.isStructured && (
                <>
                  <Button 
                    variant="outline" 
                    className="w-full gap-2 border-2 justify-start" 
                    onClick={handleShare}
                    disabled={exporting}
                  >
                    {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileImage className="w-4 h-4" />}
                    Отправить как изображение
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full gap-2 border-2 justify-start" 
                    onClick={handleExportPNG}
                    disabled={exporting}
                  >
                    {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                    Скачать PNG
                  </Button>
                </>
              )}
              <Button 
                variant="outline" 
                className="w-full gap-2 border-2 justify-start" 
                onClick={() => {
                  const textToCopy = parsedResult.isStructured && parsedResult.structured
                    ? `${parsedResult.structured.summary}\n\n${parsedResult.structured.general_recommendations}`
                    : parsedResult.text || '';
                  navigator.clipboard.writeText(textToCopy);
                  toast.success("Скопировано в буфер обмена");
                  setShareDialogOpen(false);
                }}
              >
                <FileText className="w-4 h-4" />
                Скопировать текст
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <Card className="mt-6 mb-4 border-2 border-warning/30 p-4 rounded-2xl shadow-sm bg-warning/5 animate-fade-in">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
            <div className="text-xs">
              <strong className="text-foreground block mb-1">Важное уведомление:</strong>
              <span className="text-foreground/80 leading-relaxed">
                Данный сервис предоставляет информацию только в ознакомительных целях и не является медицинской консультацией. 
                Для точной диагностики и лечения обратитесь к квалифицированному специалисту.
              </span>
            </div>
          </div>
        </Card>

        <div className="mt-6 space-y-2 text-center text-xs text-muted-foreground animate-fade-in">
          <div>© 2025 АнализПро. Все права защищены.</div>
          <a href="https://docs.google.com/document/d/1F4EAz8NiKYt6rmi3SrVG7M99fOhqMXjC0gXsQiGMyUY/edit?usp=sharing" target="_blank" rel="noopener noreferrer" className="text-primary hover:text-accent underline transition-colors inline-block">
            Политика конфиденциальности
          </a>
        </div>
      </Card>
    </div>
  );
}
