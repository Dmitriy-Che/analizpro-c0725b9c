import { useState } from "react";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import medicalLogo from "@/assets/logomedgid.png";
const Index = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [result, setResult] = useState<string>("");
  const [isDragging, setIsDragging] = useState(false);
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
  const handleAnalyze = async () => {
    if (!selectedFile) {
      toast.error("Пожалуйста, загрузите файл для анализа");
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
          imageBase64: base64Image
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
  return <div className="min-h-screen bg-background py-6 px-4 sm:py-10">
      <Card className="max-w-[430px] mx-auto rounded-[23px] p-6 sm:p-8 shadow-[var(--shadow-card)] border-border">
        {/* Logo */}
        <div className="flex justify-center mb-4">
          <div className="w-20 h-20 rounded-full bg-card shadow-[var(--shadow-subtle)] p-1.5 border-2 border-border flex items-center justify-center">
            <img src={medicalLogo} alt="МедГид-Анализ логотип" className="w-16 h-16 rounded-full object-cover" />
          </div>
        </div>

        {/* Title */}
        <h1 className="text-3xl font-extrabold text-primary text-center mb-2 tracking-tight">
          МедГид-Анализ
        </h1>
        
        {/* Subtitle */}
        <p className="text-center text-foreground/75 font-medium mb-5">
          Бесплатная расшифровка анализов по фото с помощью нейросети
        </p>

        {/* File Upload Dropzone */}
        <div className={`bg-input border-2 rounded-2xl p-7 text-center mb-5 cursor-pointer transition-all duration-[170ms] ${isDragging ? "border-accent bg-[#eefbfa]" : "border-border hover:border-primary hover:bg-primary/5"}`} onClick={() => document.getElementById("file-input")?.click()} onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}>
          <label htmlFor="file-input" className="block cursor-pointer text-lg font-semibold mb-2 text-primary">
            Загрузите фото анализа
          </label>
          <input id="file-input" type="file" className="hidden" accept="image/png,image/jpeg" onChange={handleFileSelect} />
          
          <div className="bg-card rounded px-3 py-1.5 inline-block shadow-[var(--shadow-field)] mb-1 border border-background font-medium text-sm">
            <strong>JPG/PNG:</strong> Фото или скан вашего анализа
          </div>
          
          <div className="text-primary text-base bg-secondary px-4 py-2 rounded-lg mt-3 inline-block shadow-sm border border-border/50 italic">Кликните/тапните или перетащите фото сюда</div>
          
          {selectedFile && <div className="mt-3 text-sm text-accent font-semibold">
              ✓ {selectedFile.name}
            </div>}
        </div>

        {/* Analyze Button */}
        <Button onClick={handleAnalyze} disabled={isAnalyzing || !selectedFile} className="w-full bg-primary text-primary-foreground hover:bg-accent active:bg-accent transition-[background] duration-[130ms] font-semibold text-lg py-6 rounded-xl shadow-[var(--shadow-button)] tracking-tight disabled:opacity-50 disabled:cursor-not-allowed">
          {isAnalyzing ? "Анализируем..." : "Анализировать"}
        </Button>

        {/* Disclaimer - Positioned AFTER the Analyze button */}
        <Card className="mt-5 mb-4 border border-border p-3 rounded-xl shadow-sm bg-[#cee8fc]">
          <div className="text-sm">
            <strong className="text-foreground">Дисклеймер:</strong>
            <br />
            <span className="text-foreground/90 text-justify">
              Данный сервис предоставляет информацию только в ознакомительных целях и не является медицинской консультацией. 
              Для точной диагностики и лечения обратитесь к квалифицированному специалисту.
            </span>
          </div>
        </Card>

        {/* Results */}
        {result && <Card className="mt-5 bg-card/80 border-l-4 border-l-primary p-4 rounded-xl shadow-sm">
            <div className="whitespace-pre-line text-sm text-foreground">
              {result}
            </div>
          </Card>}

        {/* Telegram Block */}
        <div className="mt-8 p-4 bg-input text-primary text-center rounded-xl border border-border shadow-sm">
          <div className="text-base font-semibold mb-1">Будьте в курсе!</div>
          <div className="text-sm mb-3">Присоединяйтесь к нашему Telegram-каналу</div>
          <Button 
            variant="outline" 
            asChild 
            className="mb-4 border-primary/50 hover:bg-primary/10"
          >
            <a href="https://t.me/medgid_mo" target="_blank" rel="noopener noreferrer">
              Перейти в наш канал
            </a>
          </Button>
          
          {/* Footer Info */}
          <div className="space-y-1 text-xs text-foreground/60">
            <div>Версия 3.69.25</div>
            <div>© 2025 АнализПро. Все права защищены.</div>
            <div>Использование сервиса означает согласие с условиями использования.</div>
            <a href="#" className="text-primary underline hover:text-accent">
              [Политика конфиденциальности]
            </a>
          </div>
          
          <div className="mt-3 text-xs text-foreground/70 font-medium">
            Не является медицинской консультацией.
          </div>
        </div>
      </Card>
    </div>;
};
export default Index;