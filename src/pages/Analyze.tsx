import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { BottomNavigation } from '@/components/BottomNavigation';
import { DesktopNav } from '@/components/DesktopNav';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import {
  Upload,
  User,
  Calendar,
  Microscope,
  FileImage,
  Loader2,
  Check,
  X
} from 'lucide-react';

import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useEntitlements } from '@/hooks/useEntitlements';
import logo from '@/assets/new-logo.png';

type Step = 'age' | 'gender' | 'studyType' | 'upload';
type Gender = 'male' | 'female' | null;
type StudyType = 'lab' | 'ultrasound' | 'mri' | null;

export default function Analyze() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { deviceId, user } = useCurrentUser();
  const { hasAvailable, remaining, loading: entLoading, refresh: refreshEnt } = useEntitlements();

  const [currentStep, setCurrentStep] = useState<Step>('age');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState<Gender>(null);
  const [studyType, setStudyType] = useState<StudyType>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [consent, setConsent] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);

  const steps: Step[] = ['age', 'gender', 'studyType', 'upload'];
  const currentStepIndex = steps.indexOf(currentStep);

  const canProceed = () => {
    switch (currentStep) {
      case 'age':
        const ageNum = parseInt(age);
        return age && ageNum >= 0 && ageNum <= 120;
      case 'gender':
        return gender !== null;
      case 'studyType':
        return studyType !== null;
      case 'upload':
        return selectedFile !== null && consent;
      default:
        return false;
    }
  };

  const nextStep = () => {
    const idx = steps.indexOf(currentStep);
    if (idx < steps.length - 1) {
      setCurrentStep(steps[idx + 1]);
    }
  };

  const prevStep = () => {
    const idx = steps.indexOf(currentStep);
    if (idx > 0) {
      setCurrentStep(steps[idx - 1]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error('Файл слишком большой (максимум 10 МБ)');
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleAnalyze = async () => {
    if (!selectedFile || !age || !gender || !studyType) return;

    if (!hasAvailable) {
      toast.error('Нет доступных расшифровок. Активируйте бесплатную или выберите тариф.');
      navigate('/tariffs');
      return;
    }

    setIsAnalyzing(true);
    setProgress(0);

    const progressInterval = setInterval(() => {
      setProgress(prev => Math.min(prev + Math.random() * 15, 90));
    }, 500);

    try {
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve) => {
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(selectedFile);
      });
      const imageBase64 = await base64Promise;

      const { data, error } = await supabase.functions.invoke('analyze-medical-photo', {
        body: {
          imageBase64,
          age: parseInt(age),
          gender,
          studyType,
          user_id: user?.id ?? null,
          device_id: deviceId,
          partner_id: null,
        },
      });

      clearInterval(progressInterval);
      setProgress(100);

      if (error) throw error;

      if (data?.result) {
        navigate('/results', {
          state: {
            result: data.result,
            age,
            gender,
          },
        });
      } else {
        throw new Error('Не удалось получить результат анализа');
      }
    } catch (error) {
      console.error('Analysis error:', error);
      toast.error('Ошибка при анализе. Попробуйте еще раз.');
      clearInterval(progressInterval);
      setProgress(0);
    } finally {
      setIsAnalyzing(false);
      refreshEnt();
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 'age':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Calendar className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-xl font-bold mb-2">Укажите возраст</h2>
              <p className="text-muted-foreground text-sm">Для точной расшифровки с учётом возрастных норм</p>
            </div>
            <div className="max-w-[200px] mx-auto">
              <Input
                type="number"
                min="0"
                max="120"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                placeholder="Введите возраст"
                className="text-center text-2xl h-14 font-bold"
              />
              <p className="text-xs text-muted-foreground text-center mt-2">полных лет</p>
            </div>
          </div>
        );

      case 'gender':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <User className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-xl font-bold mb-2">Укажите пол</h2>
              <p className="text-muted-foreground text-sm">Нормы показателей различаются для мужчин и женщин</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Button
                variant="outline"
                className={`h-20 text-lg font-semibold border-2 transition-all ${
                  gender === 'male' 
                    ? 'border-primary bg-primary/10 text-primary' 
                    : 'hover:border-primary/50'
                }`}
                onClick={() => setGender('male')}
              >
                👨 Мужской
              </Button>
              <Button
                variant="outline"
                className={`h-20 text-lg font-semibold border-2 transition-all ${
                  gender === 'female' 
                    ? 'border-primary bg-primary/10 text-primary' 
                    : 'hover:border-primary/50'
                }`}
                onClick={() => setGender('female')}
              >
                👩 Женский
              </Button>
            </div>
          </div>
        );

      case 'studyType':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Microscope className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-xl font-bold mb-2">Тип исследования</h2>
              <p className="text-muted-foreground text-sm">Выберите, что вы хотите расшифровать</p>
            </div>
            <div className="space-y-3">
              {[
                { value: 'lab', label: 'Лабораторные анализы', emoji: '🧪', desc: 'Кровь, моча, биохимия' },
                { value: 'ultrasound', label: 'УЗИ', emoji: '📊', desc: 'Ультразвуковое исследование' },
                { value: 'mri', label: 'МРТ', emoji: '🧲', desc: 'Магнитно-резонансная томография' },
              ].map((type) => (
                <Button
                  key={type.value}
                  variant="outline"
                  className={`w-full h-auto py-4 px-4 justify-start border-2 transition-all ${
                    studyType === type.value 
                      ? 'border-primary bg-primary/10' 
                      : 'hover:border-primary/50'
                  }`}
                  onClick={() => setStudyType(type.value as StudyType)}
                >
                  <span className="text-2xl mr-3">{type.emoji}</span>
                  <div className="text-left">
                    <div className="font-semibold">{type.label}</div>
                    <div className="text-xs text-muted-foreground">{type.desc}</div>
                  </div>
                  {studyType === type.value && (
                    <Check className="w-5 h-5 text-primary ml-auto" />
                  )}
                </Button>
              ))}
            </div>
          </div>
        );

      case 'upload':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <FileImage className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-xl font-bold mb-2">Загрузите фото</h2>
              <p className="text-muted-foreground text-sm">Выберите файл с анализом из галереи или с устройства</p>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />

            {selectedFile ? (
              <Card className="p-4 border-2 border-primary/30 bg-primary/5">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                    <FileImage className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{selectedFile.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {(selectedFile.size / 1024 / 1024).toFixed(2)} МБ
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedFile(null)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </Card>
            ) : (
              <Button
                variant="outline"
                className="w-full h-28 flex-col gap-2 border-2 border-dashed hover:border-primary/50"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="w-7 h-7" />
                <span className="text-sm font-semibold">Загрузить файл</span>
              </Button>
            )}


            <div className="flex items-start gap-3 p-4 bg-muted/50 rounded-xl">
              <Checkbox
                id="consent"
                checked={consent}
                onCheckedChange={(checked) => setConsent(checked === true)}
              />
              <Label htmlFor="consent" className="text-xs text-muted-foreground leading-relaxed cursor-pointer">
                Я понимаю, что результат носит информационный характер и не является медицинским диагнозом
              </Label>
            </div>
          </div>
        );
    }
  };

  if (isAnalyzing) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-accent/5 flex items-center justify-center px-4">
        {/* Desktop decorative background */}
        <div className="hidden lg:block fixed inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-20 left-10 w-72 h-72 bg-primary/5 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
        </div>
        
        <Card className="w-full max-w-[400px] lg:max-w-[450px] p-8 lg:p-10 text-center relative">
          <img 
            src={logo} 
            alt="Logo" 
            className="w-20 h-20 lg:w-24 lg:h-24 mx-auto shadow-lg mb-6 animate-pulse object-contain rounded-full"
          />
          <Loader2 className="w-12 h-12 lg:w-14 lg:h-14 mx-auto mb-4 animate-spin text-primary" />
          <h2 className="text-xl lg:text-2xl font-bold mb-2">Анализируем...</h2>
          <p className="text-muted-foreground text-sm lg:text-base mb-6">
            ИИ изучает ваш анализ и готовит расшифровку
          </p>
          <Progress value={progress} className="h-2 lg:h-3" />
          <p className="text-xs lg:text-sm text-muted-foreground mt-2">{Math.round(progress)}%</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-accent/5 pb-20 lg:pb-12">
      {/* Desktop decorative background */}
      <div className="hidden lg:block fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/4 w-64 h-64 bg-secondary/5 rounded-full blur-3xl" />
      </div>

      <DesktopNav />

      <div className="relative max-w-[480px] lg:max-w-2xl mx-auto px-4 lg:px-8 py-6 lg:py-12">
        {/* Header (mobile only — desktop has top nav) */}
        <div className="lg:hidden">
          <Header />
        </div>

        <div className="hidden lg:block text-center mb-8">
          <h1 className="text-3xl font-black mb-2">Расшифровка анализа</h1>
          <p className="text-muted-foreground">Заполните 4 шага — ИИ подготовит подробный отчёт</p>
        </div>

        {/* Progress */}
        <div className="flex items-center gap-2 mb-6 lg:mb-8">
          {steps.map((step, idx) => (
            <div key={step} className="flex-1">
              <div 
                className={`h-1.5 lg:h-2 rounded-full transition-colors ${
                  idx <= currentStepIndex ? 'bg-primary' : 'bg-muted'
                }`}
              />
            </div>
          ))}
        </div>

        {/* Step Content */}
        <Card className="p-6 lg:p-8 border-2 border-border/50 bg-card/95 mb-6 lg:mb-8">
          {renderStep()}
        </Card>

        {/* Navigation */}
        <div className="flex gap-3">
          {currentStepIndex > 0 && (
            <Button
              variant="outline"
              onClick={prevStep}
              className="flex-1 h-12 lg:h-14 border-2 lg:text-lg"
            >
              Назад
            </Button>
          )}
          {currentStep === 'upload' ? (
            <Button
              onClick={handleAnalyze}
              disabled={!canProceed()}
              className="flex-1 h-12 lg:h-14 lg:text-lg bg-gradient-to-r from-primary to-accent hover:opacity-90"
            >
              Анализировать
            </Button>
          ) : (
            <Button
              onClick={nextStep}
              disabled={!canProceed()}
              className="flex-1 h-12 lg:h-14 lg:text-lg bg-gradient-to-r from-primary to-accent hover:opacity-90"
            >
              Продолжить
            </Button>
          )}
        </div>
      </div>

      <BottomNavigation />
    </div>
  );
}
