import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Megaphone, ExternalLink, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export type AdPage =
  | "home"
  | "analyze"
  | "results"
  | "my-reports"
  | "tariffs";

interface Ad {
  id: string;
  title: string | null;
  content: string;
  link: string | null;
  html_code: string | null;
}

interface Props {
  page: AdPage;
}

export function AdPlaceholder({ page }: Props) {
  const [ad, setAd] = useState<Ad | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("ads")
        .select("id, title, content, link, html_code")
        .eq("page", page)
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (!cancelled) {
        setAd(data as Ad | null);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [page]);

  if (loading) {
    return (
      <Card className="mt-6 border-2 border-dashed border-primary/20 p-5 rounded-2xl">
        <div className="h-20 animate-pulse bg-muted/40 rounded-lg" />
      </Card>
    );
  }

  if (!ad) {
    return (
      <Card
        className="relative mt-6 overflow-hidden border-2 border-dashed border-accent/40 rounded-2xl p-5 lg:p-6
                   bg-gradient-to-br from-accent/5 via-primary/5 to-secondary/5"
      >
        <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-accent font-bold mb-2">
          <Megaphone className="w-3.5 h-3.5" />
          Место для рекламы
        </div>
        <p className="text-sm text-muted-foreground">
          Здесь скоро появится партнёрское предложение
        </p>
      </Card>
    );
  }

  return (
    <Card
      className="relative mt-6 overflow-hidden border-2 border-accent/40 rounded-2xl p-5 lg:p-6
                 bg-gradient-to-br from-accent/10 via-primary/5 to-secondary/10
                 shadow-[0_8px_30px_-8px_hsl(var(--accent)/0.45)]
                 hover:shadow-[0_12px_40px_-8px_hsl(var(--accent)/0.6)] hover:-translate-y-0.5
                 transition-all duration-300"
    >
      {/* Accent corner glow */}
      <div className="pointer-events-none absolute -top-16 -right-16 w-44 h-44 rounded-full bg-accent/30 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-16 -left-16 w-44 h-44 rounded-full bg-primary/20 blur-3xl" />

      <div className="relative">
        <div className="inline-flex items-center gap-1.5 mb-3 px-2.5 py-1 rounded-full bg-accent text-accent-foreground text-[11px] font-bold uppercase tracking-wider shadow-sm">
          <Sparkles className="w-3 h-3" />
          Спецпредложение
        </div>

        {ad.title && (
          <h4 className="font-extrabold text-lg lg:text-xl text-foreground leading-tight mb-2">
            {ad.title}
          </h4>
        )}
        {ad.content && (
          <p className="text-sm lg:text-base text-foreground/80 whitespace-pre-wrap leading-relaxed mb-3">
            {ad.content}
          </p>
        )}
        {ad.html_code && (
          <div
            className="ad-html-content mb-3"
            dangerouslySetInnerHTML={{ __html: ad.html_code }}
          />
        )}
        {ad.link && (
          <Button asChild variant="cta" size="lg" className="gap-2 w-full sm:w-auto">
            <a href={ad.link} target="_blank" rel="noopener noreferrer">
              Узнать подробнее
              <ExternalLink className="w-4 h-4" />
            </a>
          </Button>
        )}
      </div>
    </Card>
  );
}
