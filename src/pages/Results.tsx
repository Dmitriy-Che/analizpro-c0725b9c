import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { CheckCircle2, AlertTriangle, Download, Share2, ArrowLeft, FileImage, FileText, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Header } from "@/components/Header";
import { DesktopNav } from "@/components/DesktopNav";
import { BottomNavigation } from "@/components/BottomNavigation";
import { AnalysisReport } from "@/components/results/AnalysisReport";
import { parseAnalysisResult, getOverallStatusColor } from "@/types/analysis";
import { shareAsImage, shareAsPDF } from "@/utils/exportReport";
import { toast } from "sonner";

const Results = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  
  const result = location.state?.result || "";
  const age = location.state?.age || "";
  const gender = location.state?.gender || "";

  useEffect(() => {
    if (!result) {
      navigate("/");
    }
  }, [result, navigate]);

  const parsedResult = parseAnalysisResult(result);

  // Get status for text-based results
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

  // Fallback for text results
  const textStatus = parsedResult.text ? getTextResultStatus(parsedResult.text) : 'normal';
  const textStatusColors = getOverallStatusColor(textStatus);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-accent/5 py-6 px-4 sm:py-10">
      {/* Desktop decorative background */}
      <div className="hidden lg:block fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/4 w-64 h-64 bg-secondary/5 rounded-full blur-3xl" />
      </div>
      
      <Card className="relative max-w-[480px] lg:max-w-[560px] mx-auto rounded-3xl p-6 sm:p-8 lg:p-10 shadow-[var(--shadow-large)] border-border/50 backdrop-blur-sm bg-card/95">
        {/* Header */}
        <Header />

        {/* Back Button */}
        <Button 
          onClick={() => navigate("/")} 
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
            />
            
            {/* Share Button */}
            <Button 
              variant="outline" 
              className="w-full gap-2 mt-4 border-2 hover:bg-accent hover:text-white hover:border-accent transition-all" 
              onClick={() => setShareDialogOpen(true)}
              disabled={exporting}
            >
              <Share2 className="w-4 h-4" />
              Поделиться
            </Button>
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
                    a.download = 'analiz-pro-result.txt';
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
                    onClick={async () => {
                      setExporting(true);
                      try {
                        await shareAsPDF('analysis-report', `analiz-pro-${new Date().toISOString().split('T')[0]}`);
                        toast.success("Готово");
                      } catch { toast.error("Не удалось отправить PDF"); }
                      finally { setExporting(false); setShareDialogOpen(false); }
                    }}
                    disabled={exporting}
                  >
                    {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
                    Отправить PDF
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full gap-2 border-2 justify-start" 
                    onClick={handleShare}
                    disabled={exporting}
                  >
                    {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileImage className="w-4 h-4" />}
                    Отправить как изображение
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

        {/* Disclaimer */}
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

        {/* Telegram Block */}
        <div className="mt-8 p-6 bg-gradient-to-br from-primary/10 to-accent/10 text-center rounded-2xl border-2 border-primary/20 shadow-md animate-fade-in">
          <div className="text-base font-semibold mb-1 text-foreground">💬 Присоединяйтесь к нам!</div>
          <p className="text-sm text-muted-foreground mb-4">Обновления, советы по здоровью и новости медицины</p>
          <Button asChild className="bg-accent hover:bg-accent/90 text-white font-semibold shadow-lg hover:shadow-xl transition-all hover:scale-105">
            <a href="https://t.me/medgid_mo" target="_blank" rel="noopener noreferrer">
              Перейти в Telegram-канал
            </a>
          </Button>
        </div>

        {/* Footer Info */}
        <div className="mt-6 space-y-2 text-center text-xs text-muted-foreground animate-fade-in">
          <div className="font-medium">Версия 4.1.0</div>
          <div>© 2026 АнализПро. Все права защищены.</div>
          <a href="https://docs.google.com/document/d/1F4EAz8NiKYt6rmi3SrVG7M99fOhqMXjC0gXsQiGMyUY/edit?usp=sharing" target="_blank" rel="noopener noreferrer" className="text-primary hover:text-accent underline transition-colors inline-block">
            Политика конфиденциальности
          </a>
        </div>
      </Card>
    </div>
  );
};

export default Results;
