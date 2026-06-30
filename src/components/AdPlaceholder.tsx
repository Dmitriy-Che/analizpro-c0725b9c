import { Card } from "@/components/ui/card";
import { Megaphone } from "lucide-react";

export function AdPlaceholder() {
  return (
    <Card className="mt-4 border border-border/60 p-5 lg:p-6 rounded-2xl bg-muted/20">
      <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground mb-2">
        <Megaphone className="w-3.5 h-3.5" />
        Реклама
      </div>
      <div className="text-sm text-muted-foreground/70 text-center py-6">
        Здесь скоро появится партнёрское предложение
      </div>
    </Card>
  );
}
