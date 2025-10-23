import { useState } from "react";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import medicalLogo from "@/assets/medical-logo.png";

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

  const handleAnalyze = () => {
    if (!selectedFile) {
      toast.error("Пожалуйста, загрузите файл для анализа");
      return;
    }
    
    // Симуляция анализа
    toast.success("Анализ начат");
    setTimeout(() => {
      setResult("Результаты анализа будут отображены здесь после обработки изображения.");
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-background py-6 px-4 sm:py-10">
      <Card className="max-w-[430px] mx-auto rounded-[23px] p-6 sm:p-8 shadow-[var(--shadow-card)] border-border">
        {/* Logo */}
        <div className="flex justify-center mb-4">
          <div className="w-20 h-20 rounded-full bg-card shadow-[var(--shadow-subtle)] p-1.5 border-2 border-border flex items-center justify-center">
            <img 
              src={medicalLogo} 
              alt="МедГид-Анализ логотип" 
              className="w-16 h-16 rounded-full object-cover"
            />
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
        <div
          className={`bg-input border-2 rounded-2xl p-7 text-center mb-5 cursor-pointer transition-all duration-[170ms] ${
            isDragging 
              ? "border-accent bg-accent/5" 
              : "border-border hover:border-primary hover:bg-primary/5"
          }`}
          onClick={() => document.getElementById("file-input")?.click()}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <label 
            htmlFor="file-input" 
            className="block cursor-pointer text-lg font-semibold mb-2 text-primary"
          >
            Загрузи фото анализа
          </label>
          <input
            id="file-input"
            type="file"
            className="hidden"
            accept="image/png,image/jpeg"
            onChange={handleFileSelect}
          />
          
          <div className="bg-card rounded px-3 py-1.5 inline-block shadow-[var(--shadow-field)] mb-1 border border-background font-medium text-sm">
            <strong>JPG/PNG:</strong> Фото или скан вашего анализа
          </div>
          
          <div className="text-primary text-base bg-secondary px-4 py-2 rounded-lg mt-3 inline-block shadow-sm border border-border/50 italic">
            Кликните/тапните или перетащите фото сюда
          </div>
          
          {selectedFile && (
            <div className="mt-3 text-sm text-accent font-semibold">
              ✓ {selectedFile.name}
            </div>
          )}
        </div>

        {/* Analyze Button */}
        <Button
          onClick={handleAnalyze}
          className="w-full bg-primary text-primary-foreground hover:bg-accent active:bg-accent transition-[background] duration-[130ms] font-semibold text-lg py-6 rounded-xl shadow-[var(--shadow-button)] tracking-tight"
        >
          Анализировать
        </Button>

        {/* Disclaimer - Positioned AFTER the Analyze button */}
        <Card className="mt-5 mb-4 bg-card/50 border-l-4 border-l-primary p-4 rounded-xl shadow-sm">
          <div className="text-sm">
            <strong className="text-foreground">Дисклеймер:</strong>
            <br />
            <span className="text-foreground/90">
              Данный сервис предоставляет информацию только в ознакомительных целях и не является медицинской консультацией. 
              Для точной диагностики и лечения обратитесь к квалифицированному специалисту.
            </span>
          </div>
        </Card>

        {/* Results */}
        {result && (
          <Card className="mt-3 bg-card/80 border-l-4 border-l-primary p-4 rounded-xl shadow-sm">
            <div className="whitespace-pre-line text-sm text-foreground">
              {result}
            </div>
          </Card>
        )}

        {/* Telegram Block */}
        <div className="mt-8 p-4 bg-input text-primary text-center rounded-xl border border-border shadow-sm">
          <div className="text-base font-semibold mb-1">Будьте в курсе!</div>
          <div className="text-sm mb-3">Присоединяйтесь к нашему Telegram-каналу</div>
          <a
            href="https://t.me/medgid_mo"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block bg-primary text-primary-foreground hover:bg-accent active:bg-accent transition-[background] duration-[130ms] font-semibold text-base px-6 py-2.5 rounded-lg shadow-sm border-0 tracking-tight"
          >
            Перейти в наш канал
          </a>
          <div className="mt-2 text-xs opacity-60">Официальный канал MedGid MO</div>
        </div>
      </Card>
    </div>
  );
};

export default Index;
