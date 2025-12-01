import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { CheckCircle2, AlertTriangle, Download, Share2, Copy, ArrowLeft } from "lucide-react";

// Extend Window interface for DocDoc widget
declare global {
  interface Window {
    DdWidget?: (config: {
      widget: string;
      template: string;
      pid: string;
      id: string;
      container: string;
      action: string;
      city: string;
    }) => void;
  }
}
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import medicalLogo from "@/assets/logomedgid.png";

const Results = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  
  // Получаем результат из state
  const result = location.state?.result || "";
  const age = location.state?.age || "";
  const gender = location.state?.gender || "";

  // Если нет результата, перенаправляем на главную
  useEffect(() => {
    if (!result) {
      navigate("/");
    }
  }, [result, navigate]);

  // Загрузка скрипта DocDoc виджета
  useEffect(() => {
    // Проверяем, загружен ли уже скрипт
    if (!document.getElementById('docdoc-widget-script')) {
      const script = document.createElement('script');
      script.id = 'docdoc-widget-script';
      script.src = 'https://docdoc.ru/widget/js';
      script.type = 'text/javascript';
      script.onload = () => {
        // После загрузки скрипта инициализируем виджет
        if (window.DdWidget) {
          window.DdWidget({
            widget: 'Button',
            template: 'Button_common',
            pid: '35704',
            id: 'DDWidgetButton',
            container: 'DDWidgetButton',
            action: 'LoadWidget',
            city: 'msk'
          });
        }
      };
      document.body.appendChild(script);
    } else if (window.DdWidget) {
      // Если скрипт уже загружен, просто инициализируем виджет
      window.DdWidget({
        widget: 'Button',
        template: 'Button_common',
        pid: '35704',
        id: 'DDWidgetButton',
        container: 'DDWidgetButton',
        action: 'LoadWidget',
        city: 'msk'
      });
    }
  }, []);

  // Определяем статус результата на основе ключевых слов
  const getResultStatus = (text: string): 'normal' | 'warning' | 'critical' => {
    const lowerText = text.toLowerCase();

    // Критический статус
    if (lowerText.includes('срочно') || lowerText.includes('критично') || lowerText.includes('немедленно') || lowerText.includes('опасно') || lowerText.includes('серьезное отклонение') || lowerText.includes('значительное превышение') || lowerText.includes('угроза')) {
      return 'critical';
    }

    // Статус предупреждения
    if (lowerText.includes('обратить внимание') || lowerText.includes('повышен') || lowerText.includes('понижен') || lowerText.includes('отклонение') || lowerText.includes('рекомендуется') || lowerText.includes('следует')) {
      return 'warning';
    }

    // Нормальный статус
    return 'normal';
  };

  const resultStatus = getResultStatus(result);

  const getStatusColors = (status: 'normal' | 'warning' | 'critical') => {
    switch (status) {
      case 'normal':
        return {
          header: 'bg-gradient-to-r from-green-500 to-green-600',
          body: 'bg-green-50/80',
          border: 'border-green-200'
        };
      case 'warning':
        return {
          header: 'bg-gradient-to-r from-yellow-500 to-yellow-600',
          body: 'bg-yellow-50/80',
          border: 'border-yellow-200'
        };
      case 'critical':
        return {
          header: 'bg-gradient-to-r from-red-400 to-red-500',
          body: 'bg-red-50/80',
          border: 'border-red-200'
        };
    }
  };

  const statusColors = getStatusColors(resultStatus);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-accent/5 py-6 px-4 sm:py-10">
      <Card className="max-w-[480px] mx-auto rounded-3xl p-6 sm:p-8 shadow-[var(--shadow-large)] border-border/50 backdrop-blur-sm bg-card/95">
        {/* Logo Header */}
        <div className="flex justify-center mb-4">
          <img src={medicalLogo} alt="Medical Logo" className="w-16 h-16 rounded-full shadow-md object-contain animate-fade-in" />
        </div>

        {/* Title */}
        <div className="mb-6 text-center">
          <h1 className="font-black text-primary mb-2 tracking-tight text-5xl bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent animate-fade-in">
            АнализПро<span className="text-lg align-super">©</span>
          </h1>
          <p className="text-base text-muted-foreground font-medium flex items-center justify-center gap-2 animate-fade-in">Расшифровка медицинских анализов и УЗИ</p>
        </div>

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

            {/* DocDoc Widget */}
            <div className="mt-6 pt-6 border-t-2 border-border/20">
              <p className="text-sm font-bold text-foreground mb-4 text-center">
                Записаться к любому врачу в вашем городе только сейчас со скидкой 20%
              </p>
              <div id="DDWidgetButton" className="flex justify-center"></div>
            </div>
          </div>
        </Card>

        {/* Share Dialog */}
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
          <div className="font-medium">Версия 3.69.25</div>
          <div>© 2025 АнализПро. Все права защищены.</div>
          <a href="https://docs.google.com/document/d/1F4EAz8NiKYt6rmi3SrVG7M99fOhqMXjC0gXsQiGMyUY/edit?usp=sharing" target="_blank" rel="noopener noreferrer" className="text-primary hover:text-accent underline transition-colors inline-block">
            Политика конфиденциальности
          </a>
        </div>
      </Card>
    </div>
  );
};

export default Results;
