import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { CheckCircle2, AlertTriangle, Download, Share2, Copy, ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PartnerHeader } from "@/components/PartnerHeader";
import { usePartnerBySlug } from "@/hooks/usePartner";
import { toast } from "sonner";

export default function ClinicResults() {
  const { slug } = useParams<{ slug: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const { partner, loading: partnerLoading, error: partnerError } = usePartnerBySlug(slug);
  
  const result = location.state?.result || "";
  const age = location.state?.age || "";
  const gender = location.state?.gender || "";

  useEffect(() => {
    if (!result) {
      navigate(`/c/${slug}`);
    }
  }, [result, navigate, slug]);

  const getResultStatus = (text: string): 'normal' | 'warning' | 'critical' => {
    const lowerText = text.toLowerCase();
    if (lowerText.includes('срочно') || lowerText.includes('критично') || lowerText.includes('немедленно') || lowerText.includes('опасно')) {
      return 'critical';
    }
    if (lowerText.includes('обратить внимание') || lowerText.includes('повышен') || lowerText.includes('понижен') || lowerText.includes('отклонение')) {
      return 'warning';
    }
    return 'normal';
  };

  const resultStatus = getResultStatus(result);

  const getStatusColors = (status: 'normal' | 'warning' | 'critical') => {
    switch (status) {
      case 'normal':
        return { header: 'bg-gradient-to-r from-green-500 to-green-600', body: 'bg-green-50/80', border: 'border-green-200' };
      case 'warning':
        return { header: 'bg-gradient-to-r from-yellow-500 to-yellow-600', body: 'bg-yellow-50/80', border: 'border-yellow-200' };
      case 'critical':
        return { header: 'bg-gradient-to-r from-red-400 to-red-500', body: 'bg-red-50/80', border: 'border-red-200' };
    }
  };

  const statusColors = getStatusColors(resultStatus);

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

        <Card className={`border-2 ${statusColors.border} rounded-2xl shadow-xl overflow-hidden animate-fade-in`}>
          <div className={`${statusColors.header} p-4`}>
            <h3 className="text-white font-bold text-lg flex items-center gap-2">
              <CheckCircle2 className="w-6 h-6" />
              Результаты анализа
            </h3>
          </div>
          <div className={`p-5 ${statusColors.body}`}>
            <div className="whitespace-pre-line text-sm text-foreground leading-relaxed mb-4">
              {result}
            </div>
            <div className="flex gap-3 mt-4">
              <Button 
                variant="outline" 
                className="flex-1 gap-2 border-2 hover:bg-primary hover:text-white hover:border-primary transition-all" 
                onClick={() => {
                  const blob = new Blob([result], { type: 'text/plain' });
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

        <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Скопировать результаты</DialogTitle>
              <DialogDescription>
                Скопируйте текст результатов анализа
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-3 py-4">
              <Button 
                variant="outline" 
                className="w-full gap-2 border-2" 
                onClick={() => {
                  navigator.clipboard.writeText(result);
                  toast.success("Скопировано в буфер обмена");
                  setShareDialogOpen(false);
                }}
              >
                <Copy className="w-4 h-4" />
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
