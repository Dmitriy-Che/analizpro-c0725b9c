import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { Loader2, Trash2, RefreshCw, Users, CheckCircle2, AlertTriangle, Gift } from 'lucide-react';

interface ReferralRow {
  id: string;
  referrer_code: string;
  referrer_user_id: string | null;
  referrer_device_id: string | null;
  referrer_email: string | null;
  invitee_device_id: string;
  invitee_user_id: string | null;
  invitee_email: string | null;
  invitee_ip: string | null;
  status: 'pending' | 'qualified' | 'rewarded' | 'flagged';
  qualified_at: string | null;
  rewarded_at: string | null;
  created_at: string;
  invitee_analyses_count: number;
}

interface StatsRow {
  total_invites: number;
  qualified: number;
  rewarded: number;
  flagged: number;
  conversion_pct: number;
  top_referrers: { code: string; invites: number; qualified: number }[];
}

const STATUS_LABELS: Record<string, { label: string; cls: string }> = {
  pending:   { label: 'Ожидает',     cls: 'bg-yellow-100 text-yellow-700 border-yellow-300' },
  qualified: { label: 'Засчитан',    cls: 'bg-blue-100 text-blue-700 border-blue-300' },
  rewarded:  { label: 'Награждён',   cls: 'bg-green-100 text-green-700 border-green-300' },
  flagged:   { label: 'На проверке', cls: 'bg-red-100 text-red-700 border-red-300' },
};

export function ReferralsAdmin() {
  const [rows, setRows] = useState<ReferralRow[]>([]);
  const [stats, setStats] = useState<StatsRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  const load = useCallback(async () => {
    setLoading(true);
    const [{ data: list, error: e1 }, { data: st }] = await Promise.all([
      supabase.rpc('admin_list_referrals'),
      supabase.rpc('admin_referral_stats'),
    ]);
    if (e1) toast.error('Ошибка загрузки рефералов');
    setRows((list as ReferralRow[]) ?? []);
    if (st) {
      const raw: any = Array.isArray(st) ? st[0] : st;
      const top = typeof raw?.top_referrers === 'string' ? JSON.parse(raw.top_referrers) : raw?.top_referrers ?? [];
      setStats({ ...raw, top_referrers: top });
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const changeStatus = async (id: string, status: string) => {
    const { error } = await supabase.rpc('admin_set_referral_status', {
      p_referral_id: id, p_status: status,
    });
    if (error) return toast.error('Не удалось изменить статус');
    toast.success('Статус обновлён');
    load();
  };

  const remove = async (id: string) => {
    const { error } = await supabase.rpc('admin_delete_referral', { p_referral_id: id });
    if (error) return toast.error('Не удалось удалить');
    toast.success('Реферал удалён');
    load();
  };

  const filtered = filter === 'all' ? rows : rows.filter((r) => r.status === filter);

  return (
    <div className="space-y-6">
      {/* Info */}
      <Card className="p-5 border-2 border-primary/20 bg-primary/5">
        <h3 className="font-bold text-base mb-2 flex items-center gap-2">
          <Users className="w-5 h-5 text-primary" />
          Что такое рефералы и зачем этот раздел
        </h3>
        <div className="text-sm text-muted-foreground space-y-2 leading-relaxed">
          <p>
            <strong className="text-foreground">Реферальная программа</strong> — это система,
            которая поощряет пользователей за то, что они делятся ссылкой на сервис с друзьями и
            знакомыми. Когда новый человек регистрируется по чьей-то персональной ссылке,
            приглашённый и пригласивший получают бонусы — например, бесплатные расшифровки анализов.
          </p>
          <p>
            В этом разделе вы видите всех участников программы: кто пригласил, кого пригласил,
            сколько расшифровок сделал приглашённый и какой у реферала текущий статус.
          </p>
          <p>
            <strong className="text-foreground">Что можно делать:</strong>
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Просматривать статистику — общее число приглашений, засчитанных рефералов, конверсию.</li>
            <li>Фильтровать рефералов по статусу (ожидает, засчитан, награждён, на проверке).</li>
            <li>Изменять статус вручную — например, отметить реферал как «Награждён» или «На проверке».</li>
            <li>Удалять подозрительные или ошибочные записи.</li>
          </ul>
          <p className="text-xs italic pt-1">
            Статус «Ожидает» — приглашённый ещё не сделал расшифровку. «Засчитан» — приглашённый выполнил
            условие. «Награждён» — бонус начислен. «На проверке» — требует внимания администратора.
          </p>
        </div>
      </Card>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <Card className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs"><Users className="w-4 h-4" /> Всего</div>
            <div className="text-2xl font-bold mt-1">{stats.total_invites}</div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs"><CheckCircle2 className="w-4 h-4" /> Засчитано</div>
            <div className="text-2xl font-bold mt-1 text-blue-600">{stats.qualified}</div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs"><Gift className="w-4 h-4" /> Награждено</div>
            <div className="text-2xl font-bold mt-1 text-green-600">{stats.rewarded}</div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs"><AlertTriangle className="w-4 h-4" /> На проверке</div>
            <div className="text-2xl font-bold mt-1 text-red-600">{stats.flagged}</div>
          </Card>
          <Card className="p-4">
            <div className="text-muted-foreground text-xs">Конверсия</div>
            <div className="text-2xl font-bold mt-1">{stats.conversion_pct}%</div>
          </Card>
        </div>
      )}

      {/* Top referrers */}
      {stats?.top_referrers?.length ? (
        <Card className="p-4">
          <h3 className="font-bold mb-3">Топ-пригласившие</h3>
          <div className="flex flex-wrap gap-2">
            {stats.top_referrers.map((t) => (
              <div key={t.code} className="px-3 py-1.5 rounded-full bg-muted text-sm">
                <code className="font-mono mr-2">{t.code}</code>
                <span className="text-muted-foreground">{t.qualified}/{t.invites}</span>
              </div>
            ))}
          </div>
        </Card>
      ) : null}

      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-[200px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все статусы</SelectItem>
            <SelectItem value="pending">Ожидает</SelectItem>
            <SelectItem value="qualified">Засчитан</SelectItem>
            <SelectItem value="rewarded">Награждён</SelectItem>
            <SelectItem value="flagged">На проверке</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" onClick={load} disabled={loading} className="gap-2">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          Обновить
        </Button>
      </div>

      {/* List */}
      {loading ? (
        <div className="py-12 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
      ) : filtered.length === 0 ? (
        <Card className="p-8 text-center text-muted-foreground">Нет рефералов</Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((r) => {
            const st = STATUS_LABELS[r.status] ?? STATUS_LABELS.pending;
            return (
              <Card key={r.id} className="p-4">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="outline" className={st.cls}>{st.label}</Badge>
                      <code className="text-sm font-mono bg-muted px-2 py-0.5 rounded">{r.referrer_code}</code>
                      <span className="text-xs text-muted-foreground">
                        {new Date(r.created_at).toLocaleString('ru-RU')}
                      </span>
                    </div>
                    <div className="text-sm grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1">
                      <div>
                        <span className="text-muted-foreground">Пригласил: </span>
                        <span className="font-medium">{r.referrer_email || '—'}</span>
                        {r.referrer_device_id && (
                          <code className="ml-2 text-xs text-muted-foreground">{r.referrer_device_id.slice(0, 12)}…</code>
                        )}
                      </div>
                      <div>
                        <span className="text-muted-foreground">Приглашён: </span>
                        <span className="font-medium">{r.invitee_email || 'Гость'}</span>
                        <code className="ml-2 text-xs text-muted-foreground">{r.invitee_device_id.slice(0, 12)}…</code>
                      </div>
                      <div>
                        <span className="text-muted-foreground">IP: </span>
                        <span>{r.invitee_ip || '—'}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Расшифровок у приглашённого: </span>
                        <span className="font-semibold">{r.invitee_analyses_count}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Select value={r.status} onValueChange={(v) => changeStatus(r.id, v)}>
                      <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Ожидает</SelectItem>
                        <SelectItem value="qualified">Засчитать</SelectItem>
                        <SelectItem value="rewarded">Награждён</SelectItem>
                        <SelectItem value="flagged">На проверку</SelectItem>
                      </SelectContent>
                    </Select>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="icon"><Trash2 className="w-4 h-4" /></Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Удалить реферала?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Запись и неиспользованный подарок приглашённого будут удалены. Действие нельзя отменить.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Отмена</AlertDialogCancel>
                          <AlertDialogAction onClick={() => remove(r.id)}>Удалить</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
