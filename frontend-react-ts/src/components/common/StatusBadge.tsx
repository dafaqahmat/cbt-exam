import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const STATUS_STYLES: Record<string, { label: string; className: string }> = {
  draft: { label: "Draft", className: "bg-secondary text-secondary-foreground" },
  active: { label: "Aktif", className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400" },
  closed: { label: "Ditutup", className: "bg-destructive/10 text-destructive" },
  in_progress: { label: "Berjalan", className: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400" },
  finished: { label: "Selesai", className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400" },
  published: { label: "Published", className: "bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-400" },
  not_published: { label: "Belum Publikasi", className: "bg-secondary text-secondary-foreground" },
};

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export default function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = STATUS_STYLES[status] ?? { label: status, className: "bg-secondary text-secondary-foreground" };
  return (
    <Badge className={cn(config.className, className)}>{config.label}</Badge>
  );
}