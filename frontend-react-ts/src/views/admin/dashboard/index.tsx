import { FC } from "react";
import AdminLayout from "../../../components/layout/AdminLayout";
import { useAuthUser } from "../../../hooks/auth/useAuthUser";
import { useDashboard } from "../../../hooks/dashboard/useDashboard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { DonutChart, HorizontalBar, ChartSegment } from "@/components/charts/Charts";
import { Users, CheckCircle2, FileText, FilePenLine, ClipboardCheck, Gauge } from "lucide-react";

const PALETTE = ["#6366f1", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4", "#f97316", "#ec4899"];

const STATUS_COLORS: Record<string, string> = {
  draft: "#f59e0b",
  active: "#10b981",
  closed: "#94a3b8",
};

const fmtScore = (value: number | null): string => {
  if (value === null) return "-";
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
};

const fmtDate = (value: string | null): string => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("id-ID", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
};

const Dashboard: FC = () => {
  const user = useAuthUser();
  const { data, isLoading, isError, error } = useDashboard();

  const stats = [
    { label: "Peserta Terdaftar", value: data?.total_peserta, icon: Users, iconClass: "bg-primary/10 text-primary" },
    { label: "Ujian Aktif", value: data?.active_exams, icon: CheckCircle2, iconClass: "bg-emerald-500/10 text-emerald-600" },
    { label: "Total Ujian", value: data?.total_exams, icon: FileText, iconClass: "bg-amber-500/10 text-amber-600" },
    { label: "Ujian Draft", value: data?.draft_exams, icon: FilePenLine, iconClass: "bg-slate-500/10 text-slate-600" },
    { label: "Selesai Dikerjakan", value: data?.finished_sessions, icon: ClipboardCheck, iconClass: "bg-blue-500/10 text-blue-600" },
    { label: "Rata-rata Nilai", value: data && data.average_score !== null ? fmtScore(data.average_score) : "-", icon: Gauge, iconClass: "bg-violet-500/10 text-violet-600" },
  ];

  const statusSegments: ChartSegment[] = (data?.exams_by_status ?? []).filter((s) => STATUS_COLORS[s.name]).map((s) => ({
    label: s.name === "draft" ? "Draft" : s.name === "active" ? "Aktif" : "Ditutup",
    value: s.value,
    color: STATUS_COLORS[s.name],
  }));

  const categorySegments: ChartSegment[] = (data?.participants_by_category ?? []).map((c, index) => ({
    label: c.name,
    value: c.value,
    color: PALETTE[index % PALETTE.length],
  }));

  const scoreItems = (data?.score_distribution ?? []).map((b, index) => ({
    label: b.label,
    value: b.count,
    color: PALETTE[index % PALETTE.length],
  }));

  const examItems = (data?.sessions_per_exam ?? []).map((e) => ({
    label: e.exam_title,
    value: e.participant_count,
    color: "hsl(var(--primary))",
  }));

  return (
    <AdminLayout
      title={`Selamat datang, ${user?.name}`}
      description="Ringkasan aktivitas sistem CBT."
    >
      {isError && (
        <Card className="mb-4">
          <CardContent className="p-6 text-sm text-destructive">Error: {error.message}</CardContent>
        </Card>
      )}

      {isLoading && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-12 w-12 rounded-xl" />
                <Skeleton className="mt-3 h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {!isLoading && !isError && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            {stats.map((stat) => (
              <Card key={stat.label}>
                <CardContent className="flex items-center gap-4 p-6">
                  <span className={`flex size-12 shrink-0 items-center justify-center rounded-xl ${stat.iconClass}`}>
                    <stat.icon className="size-6" />
                  </span>
                  <div>
                    <p className="text-2xl font-bold tracking-tight">{stat.value ?? 0}</p>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Status Ujian</CardTitle>
              </CardHeader>
              <CardContent>
                <DonutChart
                  segments={statusSegments}
                  centerValue={String(data?.total_exams ?? 0)}
                  centerLabel="ujian"
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Peserta per Kategori</CardTitle>
              </CardHeader>
              <CardContent>
                <DonutChart
                  segments={categorySegments}
                  centerValue={String(data?.total_peserta ?? 0)}
                  centerLabel="peserta"
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Distribusi Nilai</CardTitle>
              </CardHeader>
              <CardContent>
                <HorizontalBar
                  items={scoreItems}
                  formatValue={(v) => `${v} sisw`}
                  emptyText="Belum ada nilai terhitung"
                />
              </CardContent>
            </Card>
          </div>

          <div className="mt-5 grid gap-4 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-base">Peserta per Ujian</CardTitle>
              </CardHeader>
              <CardContent>
                <HorizontalBar
                  items={examItems}
                  emptyText="Belum ada peserta yang mengerjakan ujian"
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Aktivitas Terbaru</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {(data?.recent_sessions ?? []).length === 0 && (
                  <p className="text-sm text-muted-foreground">Belum ada peserta menyelesaikan ujian.</p>
                )}
                {(data?.recent_sessions ?? []).map((s, index) => (
                  <div key={`recent-${s.username}-${s.finished_at}-${index}`} className="flex items-center gap-3 rounded-lg border bg-muted/40 px-3 py-2.5">
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                      {s.user_name.slice(0, 1).toUpperCase()}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium leading-tight">{s.user_name}</p>
                      <p className="truncate text-xs text-muted-foreground">{s.exam_title}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold">{s.total_score ?? "-"}</p>
                      <p className="text-xs text-muted-foreground">{fmtDate(s.finished_at)}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </AdminLayout>
  );
};

export default Dashboard;