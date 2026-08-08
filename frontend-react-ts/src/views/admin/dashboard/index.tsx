import { FC } from "react";
import AdminLayout from "../../../components/layout/AdminLayout";
import { useAuthUser } from "../../../hooks/auth/useAuthUser";
import { useUsers } from "../../../hooks/user/useUsers";
import { useAdminExams } from "../../../hooks/exam/useAdminExams";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, FileText, CheckCircle2 } from "lucide-react";

const Dashboard: FC = () => {
  const user = useAuthUser();
  const { data: users } = useUsers();
  const { data: exams } = useAdminExams();

  const pesertaCount = users?.filter((u) => u.role === 'peserta').length ?? 0;
  const activeExamCount = exams?.filter((e) => e.status === 'active').length ?? 0;
  const isLoading = !users && !exams;

  const stats = [
    {
      label: "Peserta Terdaftar",
      value: pesertaCount,
      icon: Users,
      iconClass: "bg-primary/10 text-primary",
    },
    {
      label: "Ujian Aktif",
      value: activeExamCount,
      icon: CheckCircle2,
      iconClass: "bg-emerald-500/10 text-emerald-600",
    },
    {
      label: "Total Ujian",
      value: exams?.length ?? 0,
      icon: FileText,
      iconClass: "bg-amber-500/10 text-amber-600",
    },
  ];

  return (
    <AdminLayout
      title={`Selamat datang, ${user?.name}`}
      description="Ringkasan aktivitas sistem CBT."
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="flex items-center gap-4 p-6">
              <span className={`flex size-12 shrink-0 items-center justify-center rounded-xl ${stat.iconClass}`}>
                <stat.icon className="size-6" />
              </span>
              <div>
                {isLoading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <p className="text-3xl font-bold tracking-tight">{stat.value}</p>
                )}
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </AdminLayout>
  )
}

export default Dashboard;