import { useState } from "react";
import { FileText, Sparkles, CheckCircle2, AlertTriangle, Download, Share2, ChevronDown, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import medicalLogo from "@/assets/logomedgid.png";
const Index = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [result, setResult] = useState<string>("");
  const [isDragging, setIsDragging] = useState(false);
  const [age, setAge] = useState<string>("");
  const [gender, setGender] = useState<string>("");
  const [consentChecked, setConsentChecked] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      toast.success("Файл загружен");
    }
  };
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type === "image/png" || file.type === "image/jpeg") {
        setSelectedFile(file);
        toast.success("Файл загружен");
      } else {
        toast.error("Пожалуйста, загрузите JPG или PNG файл");
      }
    }
  };
  const [isAnalyzing, setIsAnalyzing] = useState(false);

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
  const resultStatus = result ? getResultStatus(result) : 'normal';
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
  const handleAnalyze = async () => {
    if (!selectedFile) {
      toast.error("Пожалуйста, загрузите файл для анализа");
      return;
    }
    if (!age) {
      toast.error("Пожалуйста, укажите возраст");
      return;
    }
    if (!gender) {
      toast.error("Пожалуйста, выберите пол");
      return;
    }
    if (!consentChecked) {
      toast.error("Пожалуйста, дайте согласие на обработку персональных данных");
      return;
    }
    setIsAnalyzing(true);
    setResult("");
    toast.success("Анализ начат");
    try {
      // Конвертация файла в base64
      const reader = new FileReader();
      reader.readAsDataURL(selectedFile);
      const base64Image = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
      });

      // Вызов edge function
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-medical-photo`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`
        },
        body: JSON.stringify({
          imageBase64: base64Image,
          age: parseInt(age),
          gender: gender
        })
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Ошибка при анализе');
      }
      const data = await response.json();
      setResult(data.result);
      toast.success("Анализ завершен");
    } catch (error) {
      console.error('Ошибка анализа:', error);
      toast.error(error instanceof Error ? error.message : "Ошибка при анализе изображения");
      setResult("");
    } finally {
      setIsAnalyzing(false);
    }
  };
  return <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-accent/5 py-6 px-4 sm:py-10">
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

        {/* Stats Counter - removed for cleaner UI */}

        {/* Progress Steps */}
        <div className="mb-6 flex items-center justify-center gap-2 animate-fade-in">
          <div className={`flex items-center justify-center w-10 h-10 rounded-full font-bold text-sm transition-all ${age ? 'bg-success text-white' : 'bg-primary text-white'}`}>
            {age ? <CheckCircle2 className="w-5 h-5" /> : '1'}
          </div>
          <div className={`h-1 w-8 rounded-full transition-all ${age ? 'bg-success' : 'bg-border'}`} />
          <div className={`flex items-center justify-center w-10 h-10 rounded-full font-bold text-sm transition-all ${gender ? 'bg-success text-white' : age ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'}`}>
            {gender ? <CheckCircle2 className="w-5 h-5" /> : '2'}
          </div>
          <div className={`h-1 w-8 rounded-full transition-all ${gender ? 'bg-success' : 'bg-border'}`} />
          <div className={`flex items-center justify-center w-10 h-10 rounded-full font-bold text-sm transition-all ${selectedFile ? 'bg-success text-white' : gender ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'}`}>
            {selectedFile ? <CheckCircle2 className="w-5 h-5" /> : '3'}
          </div>
          <div className={`h-1 w-8 rounded-full transition-all ${selectedFile ? 'bg-success' : 'bg-border'}`} />
          <div className={`flex items-center justify-center w-10 h-10 rounded-full font-bold text-sm transition-all ${result ? 'bg-success text-white' : selectedFile && consentChecked ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'}`}>
            {result ? <CheckCircle2 className="w-5 h-5" /> : '✓'}
          </div>
        </div>

        {/* Age Input */}
        <div className="mb-4 animate-fade-in">
          <label htmlFor="age-input" className="block text-sm font-bold mb-2 text-foreground">
            Шаг 1: Укажите Ваш возраст
          </label>
          <input id="age-input" type="number" min="0" max="120" value={age} onChange={e => setAge(e.target.value)} placeholder="Введите возраст" className="w-full px-5 py-4 rounded-2xl border-2 border-border focus:border-primary focus:ring-4 focus:ring-primary/20 focus:outline-none bg-input text-foreground transition-all text-lg font-medium shadow-sm hover:shadow-md" />
        </div>

        {/* Gender Select */}
        <div className="mb-5 animate-fade-in">
          <label className="block text-sm font-bold mb-3 text-foreground">
            Шаг 2: Выберите Ваш пол
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button type="button" onClick={() => setGender('male')} className={`py-4 px-6 rounded-2xl border-2 font-semibold text-base transition-all ${gender === 'male' ? 'bg-primary text-primary-foreground border-primary shadow-lg scale-105' : 'bg-input text-foreground border-border hover:border-primary hover:shadow-md'}`}>
              👨 Мужской
            </button>
            <button type="button" onClick={() => setGender('female')} className={`py-4 px-6 rounded-2xl border-2 font-semibold text-base transition-all ${gender === 'female' ? 'bg-primary text-primary-foreground border-primary shadow-lg scale-105' : 'bg-input text-foreground border-border hover:border-primary hover:shadow-md'}`}>
              👩 Женский
            </button>
          </div>
        </div>

        {/* File Upload Dropzone */}
        <div className="mb-5 animate-fade-in">
          <label className="block text-sm font-bold mb-3 text-foreground">
            Шаг 3: Загрузите фото анализа
          </label>
          <div className={`bg-gradient-to-br from-input to-muted/50 border-3 rounded-2xl p-8 text-center cursor-pointer transition-all duration-300 ${isDragging ? "border-accent bg-accent/10 scale-105 shadow-xl" : selectedFile ? "border-success bg-success/5 shadow-lg" : "border-dashed border-border hover:border-primary hover:shadow-md hover:scale-[1.02]"}`} onClick={() => document.getElementById("file-input")?.click()} onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}>
            <input id="file-input" type="file" className="hidden" accept="image/png,image/jpeg" onChange={handleFileSelect} />
            
            <div className="flex flex-col items-center gap-3">
              <div className={`p-4 rounded-full transition-all ${selectedFile ? 'bg-success/20' : 'bg-primary/10'}`}>
                <FileText size={40} className={selectedFile ? 'text-success' : 'text-primary'} />
              </div>
              
              {selectedFile ? <div className="flex flex-col items-center gap-2">
                  <CheckCircle2 className="w-6 h-6 text-success" />
                  <p className="text-sm font-bold text-success">{selectedFile.name}</p>
                  <p className="text-xs text-muted-foreground">Файл готов к анализу</p>
                </div> : <div className="flex flex-col items-center gap-2">
                  <p className="text-base font-semibold text-foreground">Кликните или перетащите</p>
                  <p className="text-sm text-muted-foreground">JPG или PNG до 10 МБ</p>
                </div>}
            </div>
          </div>
        </div>

        {/* Consent Checkbox */}
        <div className="flex items-start gap-3 mb-6 p-5 bg-muted/50 rounded-2xl border-2 border-border animate-fade-in">
          <Checkbox id="consent-checkbox" checked={consentChecked} onCheckedChange={checked => setConsentChecked(checked === true)} className="mt-1 data-[state=checked]:bg-primary data-[state=checked]:border-primary" />
          <label htmlFor="consent-checkbox" className="text-foreground cursor-pointer leading-relaxed text-sm font-medium">
            Согласен(-на) на обработку персональных данных
          </label>
        </div>

        {/* Analyze Button */}
        <Button onClick={handleAnalyze} disabled={isAnalyzing || !selectedFile || !age || !gender || !consentChecked} className="w-full bg-gradient-to-r from-primary to-accent text-white hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 font-bold text-lg py-7 rounded-2xl shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 animate-fade-in">
          {isAnalyzing ? <span className="flex items-center gap-2">
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Анализируем...
            </span> : <span className="flex items-center gap-2">
              <Sparkles className="w-5 h-5" />
              Анализировать
            </span>}
        </Button>

        {/* Results */}
        {result && <Card className={`mt-6 border-2 ${statusColors.border} rounded-2xl shadow-xl overflow-hidden animate-fade-in`}>
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
                <Button variant="outline" className="flex-1 gap-2 border-2 hover:bg-primary hover:text-white hover:border-primary transition-all" onClick={() => {
              const blob = new Blob([result], {
                type: 'text/plain'
              });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = 'analiz-pro-result.txt';
              a.click();
              toast.success("Результат скачан");
            }}>
                  <Download className="w-4 h-4" />
                  Скачать
                </Button>
                <Button variant="outline" className="flex-1 gap-2 border-2 hover:bg-accent hover:text-white hover:border-accent transition-all" onClick={() => setShareDialogOpen(true)}>
                  <Share2 className="w-4 h-4" />
                  Отправить
                </Button>
              </div>
            </div>
          </Card>}

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
              <Button variant="outline" className="w-full gap-2 border-2" onClick={() => {
              navigator.clipboard.writeText(result);
              toast.success("Скопировано в буфер обмена");
              setShareDialogOpen(false);
            }}>
                <Copy className="w-4 h-4" />
                Скопировать текст
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* FAQ Section */}
        <Collapsible className="mt-8 animate-fade-in">
          <CollapsibleTrigger className="w-full p-4 bg-muted/30 rounded-2xl hover:bg-muted/50 transition-all border border-border">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-foreground flex items-center gap-2">
                ❓ Частые вопросы
              </h3>
              <ChevronDown className="w-5 h-5 text-muted-foreground transition-transform" />
            </div>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-3 space-y-3">
            <Card className="p-4 border border-border rounded-xl">
              <p className="font-semibold text-sm mb-1 text-foreground">Насколько точны результаты?</p>
              <p className="text-xs text-muted-foreground">Результаты основаны на AI-анализе и предназначены для ознакомления. 
Нейросеть анализирует данные по стандартам ведущих мировых институтов
— World Health Organization (WHO), Американская ассоциация клинической химии (AACC), Европейская федерация лабораторной медицины (EFLM), Актуальные протоколы 2025 года.

Обязательно консультируйтесь с врачом.</p>
            </Card>
            <Card className="p-4 border border-border rounded-xl">
              <p className="font-semibold text-sm mb-1 text-foreground">Какие анализы можно загружать?</p>
              <p className="text-xs text-muted-foreground">Общий и биохимический анализ крови, мочи, гормоны, онкомаркеры, коагулограмма и другие лабораторные исследования.</p>
            </Card>
            <Card className="p-4 border border-border rounded-xl">
              <p className="font-semibold text-sm mb-1 text-foreground">Безопасны ли мои данные?</p>
              <p className="text-xs text-muted-foreground">Мы не храним ваши фотографии и результаты анализов. Все данные обрабатываются анонимно.</p>
            </Card>
          </CollapsibleContent>
        </Collapsible>

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
    </div>;
};
export default Index;