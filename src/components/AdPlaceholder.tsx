import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Megaphone, ExternalLink } from "lucide-react";
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

  return (
    <Card className="mt-4 border border-border/60 p-5 lg:p-6 rounded-2xl bg-muted/20">
      <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground mb-3">
        <Megaphone className="w-3.5 h-3.5" />
        Реклама
      </div>

      {loading ? (
        <div className="h-16 animate-pulse bg-muted/40 rounded-md" />
      ) : ad ? (
        <div className="space-y-3">
          {ad.title && (
            <h4 className="font-semibold text-base text-foreground">
              {ad.title}
            </h4>
          )}
          {ad.content && (
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
              {ad.content}
            </p>
          )}
          {ad.html_code && (
            <div
              className="ad-html-content"
              dangerouslySetInnerHTML={{ __html: ad.html_code }}
            />
          )}
          {ad.link && (
            <Button
              asChild
              size="sm"
              className="bg-warning hover:bg-warning/90 text-warning-foreground gap-1.5"
            >
              <a href={ad.link} target="_blank" rel="noopener noreferrer">
                Подробнее
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </Button>
          )}
        </div>
      ) : (
        <div className="text-sm text-muted-foreground/70 text-center py-6">
          Здесь скоро появится партнёрское предложение
        </div>
      )}
    </Card>
  );
}
