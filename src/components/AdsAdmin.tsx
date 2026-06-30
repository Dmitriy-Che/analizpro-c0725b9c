import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Plus, Trash2, Save, Pencil, X } from "lucide-react";

const PAGE_OPTIONS: { value: string; label: string }[] = [
  { value: "home", label: "Главная" },
  { value: "analyze", label: "Анализ" },
  { value: "results", label: "Страница отчёта" },
  { value: "my-reports", label: "Мои отчёты" },
  { value: "tariffs", label: "Тарифы" },
];

const pageLabel = (v: string) =>
  PAGE_OPTIONS.find((o) => o.value === v)?.label ?? v;

interface Ad {
  id: string;
  page: string;
  title: string | null;
  content: string;
  link: string | null;
  html_code: string | null;
  is_active: boolean;
  created_at: string;
}

interface FormState {
  id?: string;
  page: string;
  title: string;
  content: string;
  link: string;
  html_code: string;
  is_active: boolean;
}

const emptyForm: FormState = {
  page: "home",
  title: "",
  content: "",
  link: "",
  html_code: "",
  is_active: true,
};

export function AdsAdmin() {
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [editing, setEditing] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("ads")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) toast.error("Не удалось загрузить рекламу");
    setAds((data as Ad[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const reset = () => {
    setForm(emptyForm);
    setEditing(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.content.trim() && !form.html_code.trim()) {
      toast.error("Заполните текст или HTML-код");
      return;
    }
    setSaving(true);
    const payload = {
      page: form.page,
      title: form.title.trim() || null,
      content: form.content,
      link: form.link.trim() || null,
      html_code: form.html_code.trim() || null,
      is_active: form.is_active,
    };
    const { error } = editing && form.id
      ? await supabase.from("ads").update(payload).eq("id", form.id)
      : await supabase.from("ads").insert(payload);
    setSaving(false);
    if (error) {
      toast.error("Ошибка сохранения");
      return;
    }
    toast.success(editing ? "Объявление обновлено" : "Объявление создано");
    reset();
    load();
  };

  const handleEdit = (ad: Ad) => {
    setEditing(true);
    setForm({
      id: ad.id,
      page: ad.page,
      title: ad.title ?? "",
      content: ad.content ?? "",
      link: ad.link ?? "",
      html_code: ad.html_code ?? "",
      is_active: ad.is_active,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Удалить это объявление?")) return;
    const { error } = await supabase.from("ads").delete().eq("id", id);
    if (error) {
      toast.error("Не удалось удалить");
      return;
    }
    toast.success("Удалено");
    load();
  };

  const toggleActive = async (ad: Ad) => {
    const { error } = await supabase
      .from("ads")
      .update({ is_active: !ad.is_active })
      .eq("id", ad.id);
    if (error) {
      toast.error("Ошибка обновления");
      return;
    }
    load();
  };

  return (
    <div className="space-y-6">
      <Card className="p-6 border-2 border-primary/20">
        <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
          {editing ? <Pencil className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
          {editing ? "Редактировать объявление" : "Новое объявление"}
        </h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Страница показа</Label>
            <Select
              value={form.page}
              onValueChange={(v) => setForm({ ...form, page: v })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PAGE_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Заголовок (необязательно)</Label>
            <Input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Краткий заголовок"
              maxLength={120}
            />
          </div>

          <div className="space-y-2">
            <Label>Текст объявления</Label>
            <Textarea
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
              placeholder="Текст, который увидят пользователи"
              rows={4}
              maxLength={1000}
            />
          </div>

          <div className="space-y-2">
            <Label>Рекламная ссылка (для кнопки «Подробнее»)</Label>
            <Input
              type="url"
              value={form.link}
              onChange={(e) => setForm({ ...form, link: e.target.value })}
              placeholder="https://..."
              maxLength={500}
            />
          </div>

          <div className="space-y-2">
            <Label>HTML-код от партнёра (необязательно)</Label>
            <Textarea
              value={form.html_code}
              onChange={(e) => setForm({ ...form, html_code: e.target.value })}
              placeholder="<a href=...>...</a>"
              rows={4}
              className="font-mono text-xs"
            />
            <p className="text-xs text-muted-foreground">
              ⚠️ Вставляйте код только от проверенных партнёров.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Switch
              id="is_active"
              checked={form.is_active}
              onCheckedChange={(v) => setForm({ ...form, is_active: v })}
            />
            <Label htmlFor="is_active">Активно</Label>
          </div>

          <div className="flex gap-2">
            <Button type="submit" disabled={saving} className="gap-2">
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {editing ? "Сохранить" : "Создать"}
            </Button>
            {editing && (
              <Button type="button" variant="outline" onClick={reset} className="gap-2">
                <X className="w-4 h-4" />
                Отмена
              </Button>
            )}
          </div>
        </form>
      </Card>

      <Card className="p-6 border-2 border-border">
        <h3 className="font-bold text-lg mb-4">Все объявления ({ads.length})</h3>
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : ads.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">
            Пока нет объявлений
          </p>
        ) : (
          <div className="space-y-3">
            {ads.map((ad) => (
              <Card key={ad.id} className="p-4 border border-border/60">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                        {pageLabel(ad.page)}
                      </span>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${
                          ad.is_active
                            ? "bg-green-100 text-green-700"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {ad.is_active ? "Активно" : "Скрыто"}
                      </span>
                    </div>
                    {ad.title && <div className="font-semibold">{ad.title}</div>}
                    {ad.content && (
                      <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                        {ad.content}
                      </p>
                    )}
                    {ad.link && (
                      <a
                        href={ad.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-primary truncate block mt-1"
                      >
                        {ad.link}
                      </a>
                    )}
                  </div>
                  <div className="flex flex-col gap-2 shrink-0">
                    <Switch
                      checked={ad.is_active}
                      onCheckedChange={() => toggleActive(ad)}
                    />
                  </div>
                </div>
                <div className="flex gap-2 mt-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEdit(ad)}
                    className="gap-1.5"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    Изменить
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDelete(ad.id)}
                    className="gap-1.5 text-destructive hover:text-destructive"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Удалить
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
